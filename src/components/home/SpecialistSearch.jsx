import React, { useState, useRef } from "react";
import mammoth from "mammoth";
import { motion } from "framer-motion";
import { Send, Paperclip, X, FileText, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { SPECIALIST_SYSTEM_PROMPT } from "@/components/lib/sourcePrompt";

export default function SpecialistSearch() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
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
      // Extract text from .docx using mammoth directly in browser
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

    const prompt = `Ты — строго нормативный аналитический инструмент для онкологов. Твоя единственная задача — сравнить данные пациента с положениями официальных клинических рекомендаций из регламентированных источников.

## СТРОГИЕ ОГРАНИЧЕНИЯ ИСТОЧНИКОВ

Ты ОБЯЗАН использовать информацию ИСКЛЮЧИТЕЛЬНО из следующих четырёх источников:
1. https://rosoncoweb.ru/standarts/minzdrav/
2. https://cr.minzdrav.gov.ru/clin-rec
3. https://www.nccn.org/guidelines/category_1
4. https://rosoncoweb.ru/standarts/foreign/

ЗАПРЕЩЕНО: использовать собственные медицинские знания модели, PubMed, UpToDate, Wikipedia, EMA, FDA, Medscape, любые другие ресурсы, не указанные выше.

## ЖЁСТКИЕ ПРАВИЛА АНАЛИЗА

- Анализ строится ИСКЛЮЧИТЕЛЬНО на формулировках, алгоритмах и критериях, прямо указанных в перечисленных источниках.
- НЕЛЬЗЯ добавлять клиническую логику, если она не описана в документах.
- НЕЛЬЗЯ интерпретировать шире текста источника.
- НЕЛЬЗЯ дополнять отсутствующие данные предположениями или общими знаниями.
- НЕЛЬЗЯ давать альтернативные схемы лечения, если их нет в источнике.
- НЕЛЬЗЯ использовать статистику, не указанную в выбранном документе.
- НЕЛЬЗЯ давать вероятностные оценки, если они не приведены в источнике.
- Если для анализа не хватает информации в источниках — указать: «В регламентированных источниках отсутствуют достаточные данные для проведения анализа.»
- Если вопрос выходит за рамки документов — указать: «Запрошенный анализ выходит за пределы утверждённых клинических рекомендаций из регламентированных источников.»

## ЗАПРОС ВРАЧА:
${query}${fileContext}
${uploadedFileUrl ? "\n[К запросу приложен документ — учти его содержимое]" : ""}

## ЗАДАЧА (строго по порядку):
1. Выдели из запроса ключевые данные: диагноз (МКБ-код), молекулярно-генетические маркеры, предшествующее лечение, текущую линию терапии.
2. Найди конкретные положения и критерии в регламентированных источниках, относящиеся к данному случаю.
3. Сопоставь данные пациента с найденными положениями — строго в пределах текста документа.
4. В поле "guideline_text" приводи ТОЛЬКО прямые цитаты или точные формулировки из источника.
5. В поле "comment" — только вывод о соответствии/несоответствии, без добавления внешних знаний.
6. В поле "recommendation" — только то, что прямо следует из документа. Если документ не содержит однозначной рекомендации — написать «Данные выходят за пределы регламентированных источников».
7. В поле "sources" — точное название документа и раздел/пункт, из которого взята информация.

Сформируй структурированный ответ в JSON по следующей схеме:
{
  "key_data": {
    "diagnosis": "...",
    "molecular_markers": "...",
    "previous_treatment": "...",
    "current_line": "..."
  },
  "compliance_items": [
    {
      "aspect": "название аспекта (например: Выбор линии терапии)",
      "status": "соответствует | не соответствует | требует уточнения",
      "guideline_text": "прямая цитата из клин. рекомендаций",
      "comment": "вывод строго в пределах документа"
    }
  ],
  "recommendation": "Только то, что прямо указано в источнике. Без домыслов.",
  "sources": ["Точное название документа, раздел/пункт"]
}`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          key_data: {
            type: "object",
            properties: {
              diagnosis: { type: "string" },
              molecular_markers: { type: "string" },
              previous_treatment: { type: "string" },
              current_line: { type: "string" },
            },
          },
          compliance_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                aspect: { type: "string" },
                status: { type: "string" },
                guideline_text: { type: "string" },
                comment: { type: "string" },
              },
            },
          },
          recommendation: { type: "string" },
          sources: { type: "array", items: { type: "string" } },
        },
      },
      ...(uploadedFileUrl?.type === "image" && { file_urls: [uploadedFileUrl.url] }),
    });

    setAnswer(res);
    setLoading(false);
  };

  const statusConfig = {
    "соответствует": { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    "не соответствует": { color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
    "требует уточнения": { color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div id="tour-specialist-input" className="mb-3 text-left">
        <p className="text-sm text-gray-500">
          Введите данные пациента: диагноз, молекулярно-генетические результаты, линию терапии
        </p>
      </div>

      {/* Input */}
      <div className="glass-input rounded-2xl shadow-xl shadow-gray-200/30">
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
            placeholder={`Пример: Проверь данную линию химиотерапии у пациента с диагнозом меланома кожи, T3bN2aM0, BRAF V600E+, 2-я линия — пембролизумаб...`}
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm resize-none min-h-[80px]"
          />
          <div className="flex flex-col gap-2 flex-shrink-0">
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx,.png,.jpg,.jpeg" onChange={handleFileChange} className="hidden" />
            <button id="tour-attach-btn" onClick={() => fileInputRef.current?.click()} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors" title="Прикрепить документ">
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

          {/* Key data */}
          {answer.key_data && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ключевые данные из запроса</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Диагноз", value: answer.key_data.diagnosis },
                  { label: "Молекулярные маркеры", value: answer.key_data.molecular_markers },
                  { label: "Предшествующее лечение", value: answer.key_data.previous_treatment },
                  { label: "Текущая линия", value: answer.key_data.current_line },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                    <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                    <div className="text-sm font-medium text-gray-800">{value}</div>
                  </div>
                ) : null)}
              </div>
            </div>
          )}

          {/* Compliance cards */}
          {answer.compliance_items?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Соответствие рекомендациям</h3>
              <div className="space-y-3">
                {answer.compliance_items.map((item, i) => {
                  const cfg = statusConfig[item.status] || statusConfig["требует уточнения"];
                  return (
                    <div key={i} className={`rounded-xl border p-4 ${cfg.color}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        <span className="font-semibold text-sm">{item.aspect}</span>
                        <span className="ml-auto text-xs font-medium opacity-80">{item.status}</span>
                      </div>
                      {item.guideline_text && (
                        <p className="text-xs opacity-75 italic mb-1 pl-4">«{item.guideline_text}»</p>
                      )}
                      {item.comment && (
                        <p className="text-sm pl-4">{item.comment}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {answer.recommendation && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Рекомендация ИИ</span>
              </div>
              <p className="text-sm text-indigo-900 leading-relaxed">{answer.recommendation}</p>
            </div>
          )}

          {/* Sources */}
          {answer.sources?.length > 0 && (
            <div className="text-xs text-gray-400 pl-1">
              <span className="font-medium">Источники: </span>
              {answer.sources.join(" · ")}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}