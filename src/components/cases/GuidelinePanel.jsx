import React, { useState, useRef } from "react";
import mammoth from "mammoth";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, X, FileText, Sparkles, Loader2, BookOpen, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { SPECIALIST_SYSTEM_PROMPT } from "@/components/lib/sourcePrompt";

export default function GuidelinePanel() {
  const [open, setOpen] = useState(false);
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
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setUploadedFileUrl({ type: "text", content: result.value });
    } else {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: { type: "object", properties: { text: { type: "string" } } },
      });
      setUploadedFileUrl({ type: "text", content: extracted?.output?.text || "" });
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
    const prompt = `${SPECIALIST_SYSTEM_PROMPT}

## ЗАПРОС ВРАЧА:
${query}${fileContext}
${uploadedFileUrl ? "\n[К запросу приложен документ — учти его содержимое]" : ""}

## ЗАДАЧА (строго по порядку):
1. Выдели из запроса ключевые данные: диагноз (МКБ-код), молекулярно-генетические маркеры, предшествующее лечение, текущую линию терапии.
2. Найди конкретные положения в регламентированных источниках.
3. Сопоставь данные пациента с найденными положениями — строго в пределах текста документа.
4. В поле "guideline_text" — ТОЛЬКО прямые цитаты из источника.
5. В поле "comment" — только вывод о соответствии, без добавления внешних знаний.
6. В поле "recommendation" — только то, что прямо следует из документа.
7. В поле "sources" — точное название документа и раздел.

Сформируй структурированный ответ в JSON:
{"key_data":{"diagnosis":"...","molecular_markers":"...","previous_treatment":"...","current_line":"..."},"compliance_items":[{"aspect":"...","status":"соответствует | не соответствует | требует уточнения","guideline_text":"...","comment":"..."}],"recommendation":"...","sources":["..."]}`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          key_data: { type: "object", properties: { diagnosis: { type: "string" }, molecular_markers: { type: "string" }, previous_treatment: { type: "string" }, current_line: { type: "string" } } },
          compliance_items: { type: "array", items: { type: "object", properties: { aspect: { type: "string" }, status: { type: "string" }, guideline_text: { type: "string" }, comment: { type: "string" } } } },
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
    "соответствует": { color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    "не соответствует": { color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
    "требует уточнения": { color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-200 transition-all"
      >
        <BookOpen className="w-4 h-4" />
        Справочник
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/20"
            />
            {/* Slide-in panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Умный справочник</div>
                    <div className="text-xs text-slate-400">МЗ РФ · NCCN · ESMO</div>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Input */}
                <div className="bg-slate-50 rounded-xl border border-slate-200">
                  {attachedFile && (
                    <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                      <div className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-lg px-3 py-1.5 text-xs">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{attachedFile.name}</span>
                        <button onClick={removeFile}><X className="w-3 h-3 ml-1" /></button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start px-4 py-3 gap-3">
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleAsk())}
                      placeholder="Диагноз, маркеры, линия терапии..."
                      className="flex-1 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 text-sm resize-none min-h-[72px]"
                    />
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx,.png,.jpg,.jpeg" onChange={handleFileChange} className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                      <button onClick={handleAsk} disabled={loading} className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors disabled:opacity-50">
                        {loading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Answer */}
                {answer && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    {answer.key_data && (
                      <div className="bg-white rounded-xl border border-slate-100 p-4">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ключевые данные</div>
                        <div className="space-y-2">
                          {[
                            { label: "Диагноз", value: answer.key_data.diagnosis },
                            { label: "Маркеры", value: answer.key_data.molecular_markers },
                            { label: "Предш. лечение", value: answer.key_data.previous_treatment },
                            { label: "Текущая линия", value: answer.key_data.current_line },
                          ].filter(x => x.value).map(({ label, value }) => (
                            <div key={label} className="flex gap-2">
                              <span className="text-xs text-slate-400 w-24 flex-shrink-0 pt-0.5">{label}</span>
                              <span className="text-xs text-slate-700 font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {answer.compliance_items?.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Соответствие</div>
                        {answer.compliance_items.map((item, i) => {
                          const cfg = statusConfig[item.status] || statusConfig["требует уточнения"];
                          return (
                            <div key={i} className={`rounded-xl border p-3 ${cfg.color}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                <span className="font-semibold text-xs">{item.aspect}</span>
                                <span className="ml-auto text-xs opacity-75">{item.status}</span>
                              </div>
                              {item.guideline_text && <p className="text-xs opacity-70 italic mb-1 pl-3">«{item.guideline_text}»</p>}
                              {item.comment && <p className="text-xs pl-3">{item.comment}</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {answer.recommendation && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Рекомендация</span>
                        </div>
                        <p className="text-xs text-blue-900 leading-relaxed">{answer.recommendation}</p>
                      </div>
                    )}

                    {answer.sources?.length > 0 && (
                      <div className="text-xs text-slate-400">
                        <span className="font-medium">Источники: </span>
                        {answer.sources.join(" · ")}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}