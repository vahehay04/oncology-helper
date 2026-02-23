import React, { useState, useRef } from "react";
import mammoth from "mammoth";
import { motion } from "framer-motion";
import { Send, Paperclip, X, FileText, Sparkles, Loader2, BookOpen, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Detect if query looks like a full clinical case (has diagnosis + treatment history)
function isFullClinicalCase(text) {
  const hasDiagnosis = /\bрак\b|карцинома|саркома|лимфома|меланома|опухоль/i.test(text);
  const hasStage = /\b(ст\.|стадия|pT|cT|TNM)\b/i.test(text);
  const hasTreatment = /\b(курс|ХТ|химио|операц|хирург|лечение|прогресс|линия|протокол)\b/i.test(text);
  return hasDiagnosis && hasStage && hasTreatment;
}

export default function SpecialistSearch() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [mode, setMode] = useState(null); // "case" | "reference"
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile(file);

    const imageExts = [".png", ".jpg", ".jpeg"];
    const isImage = imageExts.some(ext => file.name.toLowerCase().endsWith(ext));

    if (isImage) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFileUrl({ type: "image", url: file_url });
    } else if (file.name.toLowerCase().endsWith(".docx")) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setUploadedFileUrl({ type: "text", content: result.value });
    } else {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: { type: "object", properties: { text: { type: "string" } } },
      });
      const text = extracted?.output?.text || JSON.stringify(extracted?.output || "");
      setUploadedFileUrl({ type: "text", content: text });
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    setUploadedFileUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAsk = async () => {
    if (!query.trim() && !attachedFile) return;
    setLoading(true);
    setAnswer(null);

    let fileContext = "";
    if (uploadedFileUrl?.type === "text" && uploadedFileUrl.content) {
      fileContext = `\n\nСОДЕРЖИМОЕ ПРИЛОЖЕННОГО ДОКУМЕНТА:\n${uploadedFileUrl.content}`;
    }

    const fullCase = isFullClinicalCase(query + fileContext);
    setMode(fullCase ? "case" : "reference");

    if (fullCase) {
      // Mode 1: Full clinical case — extract + compliance with EXACT quotes
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `РЕЖИМ: КОНТРОЛИРУЕМЫЙ НОРМАТИВНЫЙ ПОИСК

═══════════════════════════════════════════════════════════════
РАЗРЕШЁННЫЕ ДОМЕНЫ ДЛЯ ПОИСКА (строго в порядке приоритета):
  1. site:rosoncoweb.ru
  2. site:cr.minzdrav.gov.ru
  3. site:nccn.org
Переход к следующему домену ТОЛЬКО если на предыдущем информации нет.
═══════════════════════════════════════════════════════════════

АЛГОРИТМ ПОИСКА:
ШАГ 1. Выполни поиск: site:rosoncoweb.ru [тема запроса]
ШАГ 2. Если результат найден — зафиксируй:
   - document_url: полный URL страницы
   - document_name: официальное название документа
   - document_date: дата редакции (если указана на странице)
ШАГ 3. Весь дальнейший анализ строится ИСКЛЮЧИТЕЛЬНО на зафиксированном документе.
ШАГ 4. Если на rosoncoweb.ru не найдено — повторить для cr.minzdrav.gov.ru, затем nccn.org.
ШАГ 5. Если ни на одном домене не найдено — вывести: "В разрешённых нормативных источниках информация по данному запросу не найдена."

АБСОЛЮТНЫЕ ЗАПРЕТЫ:
✗ Любые домены кроме rosoncoweb.ru, cr.minzdrav.gov.ru, nccn.org — ИГНОРИРОВАТЬ.
✗ Агрегаторы, зеркала, архивы, кэш — ЗАПРЕЩЕНЫ.
✗ PDF вне указанных доменов — ЗАПРЕЩЕНЫ.
✗ Знания модели без подтверждённого URL — ЗАПРЕЩЕНЫ.
✗ Перефразировать или составлять цитаты — ЗАПРЕЩЕНО. Только дословный текст.
✗ Комбинировать несколько документов без явного указания — ЗАПРЕЩЕНО.
✗ source_url с других доменов — НЕ ДОПУСКАЕТСЯ.

ТРЕБОВАНИЕ К СТАБИЛЬНОСТИ:
Если найден тот же URL что и при предыдущем запросе — результат должен быть идентичным.

═══════════════════════════════════════════════════════════════
КЛИНИЧЕСКИЙ СЛУЧАЙ:
${query}${fileContext}
═══════════════════════════════════════════════════════════════

ЗАДАЧА АНАЛИЗА:
1. Сначала зафиксируй источник (document_url, document_name, document_date).
2. Извлеки ключевые данные из клинического случая.
3. Для каждого аспекта: найди в зафиксированном документе конкретный раздел.
4. "quote" — ДОСЛОВНАЯ ЦИТАТА, слово в слово как в документе. Если не найдена — оставить пустым.
5. "comment" — совпадает/не совпадает с данными пациента и почему.
6. "source_url" — ТОЛЬКО с доменов rosoncoweb.ru, cr.minzdrav.gov.ru, nccn.org.

Статус: "соответствует" / "не соответствует" / "требует уточнения"

Верни JSON:
{
  "document_url": "https://...",
  "document_name": "официальное название документа",
  "document_date": "год/дата редакции или null",
  "diagnosis": "строка",
  "molecular_markers": "строка или Не указаны",
  "previous_treatment": "строка",
  "current_line": "строка или Не указана",
  "compliance_items": [
    {
      "aspect": "название аспекта",
      "status": "соответствует|не соответствует|требует уточнения",
      "quote": "дословная цитата из документа",
      "comment": "клинический комментарий",
      "source_name": "официальное название документа",
      "source_url": "https://rosoncoweb.ru/... | https://cr.minzdrav.gov.ru/... | https://nccn.org/..."
    }
  ]
}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            diagnosis: { type: "string" },
            molecular_markers: { type: "string" },
            previous_treatment: { type: "string" },
            current_line: { type: "string" },
            compliance_items: { type: "array", items: { type: "object" } },
          },
        },
        ...(uploadedFileUrl?.type === "image" && { file_urls: [uploadedFileUrl.url] }),
      });

      setAnswer({ type: "case", data: res });
    } else {
      // Mode 2: Reference question — detailed answer with exact quotes
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `РЕЖИМ: КОНТРОЛИРУЕМЫЙ НОРМАТИВНЫЙ ПОИСК

═══════════════════════════════════════════════════════════════
РАЗРЕШЁННЫЕ ДОМЕНЫ ДЛЯ ПОИСКА (строго в порядке приоритета):
  1. site:rosoncoweb.ru
  2. site:cr.minzdrav.gov.ru
  3. site:nccn.org
Переход к следующему домену ТОЛЬКО если на предыдущем информации нет.
═══════════════════════════════════════════════════════════════

АЛГОРИТМ ПОИСКА:
ШАГ 1. Поиск: site:rosoncoweb.ru [тема вопроса]
ШАГ 2. Если найден — зафиксируй:
   - document_url: полный URL
   - document_name: официальное название документа
   - document_date: дата редакции (если указана)
ШАГ 3. Все ответы строятся ТОЛЬКО на зафиксированном документе.
ШАГ 4. Если не найдено — повторить для cr.minzdrav.gov.ru, затем nccn.org.
ШАГ 5. Если нигде не найдено → вывести: "В разрешённых нормативных источниках информация по данному запросу не найдена."

АБСОЛЮТНЫЕ ЗАПРЕТЫ:
✗ Любые домены кроме rosoncoweb.ru, cr.minzdrav.gov.ru, nccn.org — ИГНОРИРОВАТЬ.
✗ Агрегаторы, зеркала, архивы, кэш — ЗАПРЕЩЕНЫ.
✗ PDF вне указанных доменов — ЗАПРЕЩЕНЫ.
✗ Знания модели без подтверждённого URL — ЗАПРЕЩЕНЫ.
✗ Перефразировать или составлять цитаты самостоятельно — ЗАПРЕЩЕНО.
✗ source_url с других доменов — НЕ ДОПУСКАЕТСЯ.

ТРЕБОВАНИЕ К СТАБИЛЬНОСТИ:
Если найден тот же URL что и при предыдущем запросе — результат должен быть идентичным.

═══════════════════════════════════════════════════════════════
ВОПРОС ВРАЧА:
${query}${fileContext}
═══════════════════════════════════════════════════════════════

ПРАВИЛА ОТВЕТА:
- Схема/протокол (FLOT, XELOX и т.д.) → найти таблицу схем на rosoncoweb.ru, дословно привести дозы и режим.
- Диагностика → раздел "Диагностика" на rosoncoweb.ru или cr.minzdrav.gov.ru, дословный перечень.
- Показания → точные критерии из документа, дословно.
- quote ОБЯЗАТЕЛЕН для каждого блока. Если цитату найти не удалось — написать явно.

Верни JSON:
{
  "document_url": "https://...",
  "document_name": "официальное название документа",
  "document_date": "год/дата редакции или null",
  "question_type": "схема|диагностика|показания|другое",
  "answer_blocks": [
    {
      "title": "заголовок блока",
      "content": "основной текст ответа",
      "quote": "дословная цитата из документа",
      "source_name": "официальное название документа",
      "source_url": "https://rosoncoweb.ru/... | https://cr.minzdrav.gov.ru/... | https://nccn.org/..."
    }
  ]
}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            question_type: { type: "string" },
            answer_blocks: { type: "array", items: { type: "object" } },
          },
        },
        ...(uploadedFileUrl?.type === "image" && { file_urls: [uploadedFileUrl.url] }),
      });

      setAnswer({ type: "reference", data: res });
    }

    setLoading(false);
  };

  const statusConfig = {
    "соответствует": { bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", badge: "text-emerald-600" },
    "не соответствует": { bg: "bg-red-50 border-red-200", dot: "bg-red-500", text: "text-red-700", badge: "text-red-600" },
    "требует уточнения": { bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500", text: "text-amber-700", badge: "text-amber-600" },
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-3 text-left">
        <p className="text-sm text-gray-500">
          Введите данные пациента: диагноз, молекулярно-генетические результаты, линию терапии
        </p>
      </div>

      {/* Input */}
      <div className="glass-input rounded-2xl shadow-xl shadow-gray-200/30 bg-white border border-gray-200">
        {attachedFile && (
          <div className="flex items-center gap-2 px-6 pt-4 pb-2">
            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 rounded-lg px-3 py-1.5 text-sm">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="truncate max-w-[220px]">{attachedFile.name}</span>
              <button onClick={removeFile}><X className="w-3.5 h-3.5 ml-1" /></button>
            </div>
          </div>
        )}
        <div className="flex items-start px-6 py-4 gap-3">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleAsk())}
            placeholder={`Пример: Что входит в состав протокола FLOT?\nИли: Рак пищеводно-желудочного перехода III ст., pT3N2M0. 4 курса ХТ XELOX...`}
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm resize-none min-h-[80px]"
          />
          <div className="flex flex-col gap-2 flex-shrink-0">
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx,.png,.jpg,.jpeg" onChange={handleFileChange} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors" title="Прикрепить документ">
              <Paperclip className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={handleAsk} disabled={loading} className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {answer && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">

          {/* === CLINICAL CASE MODE === */}
          {answer.type === "case" && answer.data && (
            <>
              {/* Fixed source banner */}
              {answer.data.document_url && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-2 text-xs text-slate-600">
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
                  <div>
                    <span className="font-semibold text-slate-700">Зафиксированный источник: </span>
                    <a href={answer.data.document_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-600">
                      {answer.data.document_name || answer.data.document_url}
                    </a>
                    {answer.data.document_date && <span className="ml-1 text-slate-400">({answer.data.document_date})</span>}
                  </div>
                </div>
              )}

              {/* Key data */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ключевые данные из запроса</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Диагноз", value: answer.data.diagnosis },
                    { label: "Молекулярные маркеры", value: answer.data.molecular_markers },
                    { label: "Предшествующее лечение", value: answer.data.previous_treatment },
                    { label: "Текущая линия", value: answer.data.current_line },
                  ].map(({ label, value }) => value ? (
                    <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                      <div className="text-sm font-medium text-gray-800">{value}</div>
                    </div>
                  ) : null)}
                </div>
              </div>

              {/* Compliance with EXACT quotes */}
              {answer.data.compliance_items?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Соответствие рекомендациям</h3>
                  <div className="space-y-3">
                    {answer.data.compliance_items.map((item, i) => {
                      const cfg = statusConfig[item.status] || statusConfig["требует уточнения"];
                      return (
                        <div key={i} className={`rounded-xl border p-4 ${cfg.bg}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                              <span className={`font-semibold text-sm ${cfg.text}`}>{item.aspect}</span>
                            </div>
                            <span className={`text-xs font-medium ${cfg.badge}`}>{item.status}</span>
                          </div>
                          {item.quote && (
                            <blockquote className={`text-xs italic opacity-80 pl-4 border-l-2 mb-2 ${cfg.dot.replace('bg-', 'border-')} leading-relaxed`}>
                              «{item.quote}»
                            </blockquote>
                          )}
                          {item.comment && (
                            <p className={`text-sm pl-4 ${cfg.text} opacity-90`}>{item.comment}</p>
                          )}
                          {(item.source_name || item.source_url) && (
                            <div className="mt-2 pl-4 flex items-center gap-1 text-xs text-gray-400">
                              <BookOpen className="w-3 h-3 flex-shrink-0" />
                              {item.source_url ? (
                                <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-600 transition-colors">
                                  {item.source_name || item.source_url}
                                </a>
                              ) : (
                                <span>{item.source_name}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* === REFERENCE MODE === */}
          {answer.type === "reference" && answer.data && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              {/* Fixed source banner */}
              {answer.data.document_url && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-2 text-xs text-slate-600 mb-4">
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
                  <div>
                    <span className="font-semibold text-slate-700">Зафиксированный источник: </span>
                    <a href={answer.data.document_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-600">
                      {answer.data.document_name || answer.data.document_url}
                    </a>
                    {answer.data.document_date && <span className="ml-1 text-slate-400">({answer.data.document_date})</span>}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ответ из клинических рекомендаций</h3>
              </div>
              <div className="space-y-4">
                {(answer.data.answer_blocks || []).map((block, i) => (
                  <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    {block.title && (
                      <h4 className="font-semibold text-gray-800 text-sm mb-2">{block.title}</h4>
                    )}
                    {block.content && (
                      <p className="text-sm text-gray-700 leading-relaxed mb-2 whitespace-pre-line">{block.content}</p>
                    )}
                    {block.quote && (
                      <blockquote className="text-xs italic text-gray-600 pl-3 border-l-2 border-indigo-300 bg-indigo-50 rounded-r-lg py-2 pr-3 leading-relaxed">
                        «{block.quote}»
                      </blockquote>
                    )}
                    {(block.source_name || block.source_url) && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                        <BookOpen className="w-3 h-3 flex-shrink-0" />
                        {block.source_url ? (
                          <a href={block.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-600 transition-colors">
                            {block.source_name || block.source_url}
                          </a>
                        ) : (
                          <span>{block.source_name}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      )}
    </div>
  );
}