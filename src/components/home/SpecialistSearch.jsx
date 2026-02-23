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
        prompt: `Ты — строго нормативный клинический аналитик. Анализируешь клинический случай.

╔══════════════════════════════════════════════════════════════╗
║   РАЗРЕШЁННЫЕ ИСТОЧНИКИ — ТОЛЬКО ЭТИ, БЕЗ ИСКЛЮЧЕНИЙ       ║
╠══════════════════════════════════════════════════════════════╣
║ 1. rosoncoweb.ru  — клин. рекомендации RUSSCO               ║
║ 2. cr.minzdrav.gov.ru — клин. рекомендации Минздрава РФ     ║
║ 3. nccn.org — рекомендации NCCN                             ║
╚══════════════════════════════════════════════════════════════╝

СТРОГИЙ ЗАПРЕТ:
✗ Запрещено использовать любые другие источники (ESMO, UpToDate, PubMed, Wikipedia, oncology-association.ru, медицинские журналы, учебники, собственные знания без ссылки на разрешённый домен).
✗ Если информация не найдена на разрешённых доменах — написать: "Информация не найдена в разрешённых источниках."
✗ Запрещено придумывать или перефразировать цитаты. Только дословный текст из документа.
✗ В поле source_url — ТОЛЬКО URL с доменов rosoncoweb.ru, cr.minzdrav.gov.ru, nccn.org.

КЛИНИЧЕСКИЙ СЛУЧАЙ:
${query}${fileContext}

ЗАДАЧА:
1. Извлеки ключевые данные из случая.
2. Для каждого клинически значимого аспекта открой соответствующий документ на разрешённом домене.
3. В поле "quote" — ДОСЛОВНАЯ ЦИТАТА из документа, слово в слово как написано в рекомендации.
4. В поле "comment" — кратко: совпадает/не совпадает с данными пациента и почему.
5. В поле "source_name" — официальное название документа с сайта (например: "Рекомендации RUSSCO 2025, Рак пищевода и кардии").
6. В поле "source_url" — точный URL только с разрешённых доменов.

Если цитата не найдена на разрешённом домене — поле "quote" оставить пустым и написать в "comment": "Данные не найдены в разрешённых источниках."

Оценки статуса: "соответствует" / "не соответствует" / "требует уточнения"

Верни JSON:
{
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
      "source_url": "https://rosoncoweb.ru/... или https://cr.minzdrav.gov.ru/... или https://nccn.org/..."
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
        prompt: `Ты — нормативный медицинский справочник для врача-онколога.

╔══════════════════════════════════════════════════════════════╗
║   РАЗРЕШЁННЫЕ ИСТОЧНИКИ — ТОЛЬКО ЭТИ, БЕЗ ИСКЛЮЧЕНИЙ       ║
╠══════════════════════════════════════════════════════════════╣
║ 1. rosoncoweb.ru  — клин. рекомендации RUSSCO               ║
║ 2. cr.minzdrav.gov.ru — клин. рекомендации Минздрава РФ     ║
║ 3. nccn.org — рекомендации NCCN                             ║
╚══════════════════════════════════════════════════════════════╝

СТРОГИЙ ЗАПРЕТ:
✗ Запрещены любые другие источники: ESMO, UpToDate, PubMed, Wikipedia, oncology-association.ru, медицинские журналы, учебники, внутренние знания модели без ссылки на разрешённый домен.
✗ Запрещено придумывать цитаты. Только дословный текст из документа.
✗ В source_url — ТОЛЬКО URL с доменов rosoncoweb.ru, cr.minzdrav.gov.ru, nccn.org.
✗ Если информации нет в разрешённых источниках — написать об этом явно.

ВОПРОС ВРАЧА:
${query}${fileContext}

ПРАВИЛА ОТВЕТА:
- Если вопрос о схеме/протоколе (FLOT, XELOX, FOLFOX и т.д.) — найди на rosoncoweb.ru раздел с таблицей схем и приведи состав с дозами дословно из таблицы.
- Если вопрос о диагностике — найди раздел "Диагностика" в соответствующей рекомендации на cr.minzdrav.gov.ru или rosoncoweb.ru и перечисли обследования.
- Если вопрос о показаниях — процитируй точные критерии из документа.
- Для каждого блока ответа: дословная цитата из документа обязательна.

Верни JSON:
{
  "question_type": "схема|диагностика|показания|другое",
  "answer_blocks": [
    {
      "title": "заголовок блока",
      "content": "основной текст ответа",
      "quote": "дословная цитата из документа",
      "source_name": "официальное название документа",
      "source_url": "https://rosoncoweb.ru/... или https://cr.minzdrav.gov.ru/... или https://nccn.org/..."
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