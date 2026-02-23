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

// Simple in-memory cache: key = query+fileContent hash, value = { type, data }
const answerCache = new Map();

function getCacheKey(query, fileContext) {
  return `${query.trim()}||${fileContext.trim()}`;
}

export default function SpecialistSearch() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
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
    setFromCache(false);

    let fileContext = "";
    if (uploadedFileUrl?.type === "text" && uploadedFileUrl.content) {
      fileContext = `\n\nСОДЕРЖИМОЕ ПРИЛОЖЕННОГО ДОКУМЕНТА:\n${uploadedFileUrl.content}`;
    }

    const cacheKey = getCacheKey(query, fileContext);
    if (answerCache.has(cacheKey)) {
      const cached = answerCache.get(cacheKey);
      setMode(cached.type === "case" ? "case" : "reference");
      setAnswer(cached);
      setFromCache(true);
      setLoading(false);
      return;
    }

    const fullCase = isFullClinicalCase(query + fileContext);
    setMode(fullCase ? "case" : "reference");

    if (fullCase) {
      // Mode 1: Full clinical case — 8-step CDSS algorithm (RUSSCO → NCCN)
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `ТЫ — экспертная онкологическая аналитическая система уровня senior CDSS.
Ты обладаешь полными знаниями клинических рекомендаций RUSSCO (rosoncoweb.ru), Минздрава РФ (cr.minzdrav.gov.ru) и NCCN (nccn.org).
Используй ТОЛЬКО эти знания. Работай детерминированно: одни и те же входные данные → всегда одинаковый результат.

════════════════════════════════════════════
КЛИНИЧЕСКИЕ ДАННЫЕ ПАЦИЕНТА:
${query}${fileContext}
════════════════════════════════════════════

ШАГ 1 — DIAGNOSIS PROFILE
Извлеки из клинических данных:
- тип рака, локализация, гистологический тип
- стадия TNM (T, N, M), степень дифференцировки
- наличие метастазов
- молекулярно-генетические маркеры: HER2, PD-L1, MSI/MMR, EGFR, ALK, ROS1, BRAF, KRAS, NRAS, NTRK и другие
- предшествующие линии лечения
- текущая линия лечения
- статус прогрессирования/рецидива

ШАГ 2 — PATIENT TREATMENT PROFILE
Извлеки полностью из данных пациента:
- все линии терапии, схемы, препараты, дозировки
- хирургическое, лучевое, таргетное, иммунотерапевтическое лечение

ШАГ 3 — RUSSCO RECOMMENDED TREATMENT
На основе своих знаний актуальных рекомендаций RUSSCO для данного типа опухоли, стадии и молекулярного профиля:
- Укажи URL страницы RUSSCO (rosoncoweb.ru), название документа и год издания.
- Перечисли все рекомендованные схемы и обязательные компоненты лечения.

ШАГ 4 — СОПОСТАВЛЕНИЕ С RUSSCO
Сравни PATIENT TREATMENT PROFILE vs RUSSCO RECOMMENDED TREATMENT.
Раздели на 3 категории:
- FULL MATCH: лечение полностью соответствует RUSSCO
- PARTIAL MATCH: частичное соответствие
- MISSING ELEMENTS: есть в RUSSCO, отсутствует у пациента

ШАГ 5 — MISSING RECOMMENDATIONS FROM RUSSCO
Если есть MISSING ELEMENTS — опиши их точно, со ссылкой на соответствующий пункт рекомендаций RUSSCO.

ШАГ 6-7 — NCCN (только если FULL MATCH с RUSSCO = true)
На основе знаний актуальных рекомендаций NCCN для данного типа опухоли и стадии:
- Укажи URL страницы NCCN, название раздела.
- Извлеки NCCN RECOMMENDED TREATMENT.
- Сравни с PATIENT TREATMENT PROFILE → FULL/PARTIAL/MISSING ELEMENTS NCCN.

ШАГ 8 — ФИНАЛЬНЫЙ ОТЧЁТ

СТРОГИЕ ПРАВИЛА:
✗ Не используй интернет-поиск — опирайся только на свои знания рекомендаций
✗ Работай детерминированно: одинаковые данные → одинаковый вывод
✗ Работай как clinical audit system
✗ source_url ТОЛЬКО с: rosoncoweb.ru, cr.minzdrav.gov.ru, nccn.org

Верни JSON:
{
  "document_url": "https://...",
  "document_name": "...",
  "document_date": "...",
  "diagnosis_profile": {
    "cancer_type": "", "localization": "", "histology": "", "stage": "",
    "tnm": {"t": "", "n": "", "m": ""}, "grade": "", "metastases": "",
    "molecular_markers": {}, "previous_lines": "", "current_line": "", "progression_status": ""
  },
  "patient_treatment_profile": "",
  "russco_recommended_treatment": "",
  "russco_comparison": {
    "full_match": false,
    "partial_match": false,
    "match_items": [],
    "missing_items": []
  },
  "missing_russco_verbatim": "",
  "nccn_checked": false,
  "nccn_document_url": "",
  "nccn_recommended_treatment": "",
  "nccn_comparison": {
    "full_match": false, "partial_match": false, "match_items": [], "missing_items": []
  },
  "missing_nccn_verbatim": "",
  "final_conclusion": {
    "russco_compliant": false,
    "nccn_compliant": false,
    "missing_elements": [],
    "matching_elements": []
  },
  "compliance_items": [
    {
      "aspect": "",
      "status": "соответствует|не соответствует|требует уточнения",
      "quote": "цитата из рекомендаций",
      "comment": "",
      "source_name": "",
      "source_url": ""
    }
  ]
}`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            document_url: { type: "string" },
            document_name: { type: "string" },
            document_date: { type: "string" },
            diagnosis_profile: { type: "object" },
            patient_treatment_profile: { type: "string" },
            russco_recommended_treatment: { type: "string" },
            russco_comparison: { type: "object" },
            missing_russco_verbatim: { type: "string" },
            nccn_checked: { type: "boolean" },
            nccn_document_url: { type: "string" },
            nccn_recommended_treatment: { type: "string" },
            nccn_comparison: { type: "object" },
            missing_nccn_verbatim: { type: "string" },
            final_conclusion: { type: "object" },
            compliance_items: { type: "array", items: { type: "object" } },
          },
        },
        ...(uploadedFileUrl?.type === "image" && { file_urls: [uploadedFileUrl.url] }),
      });

      const result = { type: "case", data: res };
      answerCache.set(cacheKey, result);
      setAnswer(result);
    } else {
      // Mode 2: Reference question — detailed answer with exact quotes
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `ТЫ — справочная онкологическая система. Ты обладаешь знаниями клинических рекомендаций RUSSCO (rosoncoweb.ru), Минздрава РФ (cr.minzdrav.gov.ru) и NCCN (nccn.org).
Отвечай строго на основе этих знаний. Работай детерминированно: одинаковый вопрос → всегда одинаковый ответ.

ПОРЯДОК ИСТОЧНИКОВ:
1. RUSSCO (rosoncoweb.ru) — приоритет
2. Минздрав РФ (cr.minzdrav.gov.ru) — если в RUSSCO нет
3. NCCN (nccn.org) — если в предыдущих нет

ПРАВИЛА ОТВЕТА:
- Схема/протокол (FLOT, XELOX и т.д.) → укажи дозы и режим из соответствующих рекомендаций RUSSCO.
- Диагностика → перечень обследований из раздела "Диагностика" рекомендаций.
- Показания → точные критерии из документа.
- Для каждого блока обязательно укажи source_url с одного из разрешённых доменов.
- Если информация отсутствует в указанных источниках — сообщи об этом явно.

ЗАПРЕЩЕНО:
✗ Использовать источники вне rosoncoweb.ru, cr.minzdrav.gov.ru, nccn.org
✗ Выдавать разные ответы на одинаковые вопросы

═══════════════════════════════════════════
ВОПРОС ВРАЧА:
${query}${fileContext}
═══════════════════════════════════════════

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
      "quote": "цитата из рекомендаций",
      "source_name": "официальное название документа",
      "source_url": "https://rosoncoweb.ru/... или https://cr.minzdrav.gov.ru/... или https://nccn.org/..."
    }
  ]
}`,
        add_context_from_internet: false,
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

              {/* DIAGNOSIS PROFILE */}
              {answer.data.diagnosis_profile && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">1. Diagnosis Profile</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Тип рака / Локализация", value: [answer.data.diagnosis_profile.cancer_type, answer.data.diagnosis_profile.localization].filter(Boolean).join(" — ") },
                      { label: "Гистология", value: answer.data.diagnosis_profile.histology },
                      { label: "Стадия", value: answer.data.diagnosis_profile.stage },
                      { label: "TNM", value: answer.data.diagnosis_profile.tnm ? `T${answer.data.diagnosis_profile.tnm.t || "?"} N${answer.data.diagnosis_profile.tnm.n || "?"} M${answer.data.diagnosis_profile.tnm.m || "?"}` : null },
                      { label: "Метастазы", value: answer.data.diagnosis_profile.metastases },
                      { label: "Текущая линия", value: answer.data.diagnosis_profile.current_line },
                      { label: "Предшествующие линии", value: answer.data.diagnosis_profile.previous_lines },
                      { label: "Статус прогрессирования", value: answer.data.diagnosis_profile.progression_status },
                    ].filter(({ value }) => value).map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                        <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                        <div className="text-sm font-medium text-gray-800">{value}</div>
                      </div>
                    ))}
                  </div>
                  {/* Molecular markers */}
                  {answer.data.diagnosis_profile.molecular_markers && Object.keys(answer.data.diagnosis_profile.molecular_markers).length > 0 && (
                    <div className="mt-3 bg-indigo-50 rounded-xl px-4 py-3">
                      <div className="text-xs text-gray-400 mb-1">Молекулярные маркеры</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(answer.data.diagnosis_profile.molecular_markers).map(([k, v]) => (
                          <span key={k} className="text-xs bg-white border border-indigo-200 rounded-lg px-2 py-0.5 text-indigo-700 font-medium">{k}: {v}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PATIENT TREATMENT PROFILE */}
              {answer.data.patient_treatment_profile && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">2. Patient Treatment Profile</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{answer.data.patient_treatment_profile}</p>
                </div>
              )}

              {/* RUSSCO RECOMMENDED TREATMENT */}
              {answer.data.russco_recommended_treatment && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">3. RUSSCO Recommended Treatment</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{answer.data.russco_recommended_treatment}</p>
                </div>
              )}

              {/* COMPARISON WITH RUSSCO */}
              {answer.data.russco_comparison && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">4. Comparison with RUSSCO</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${answer.data.russco_comparison.full_match ? "bg-emerald-100 text-emerald-700" : answer.data.russco_comparison.partial_match ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                      {answer.data.russco_comparison.full_match ? "FULL MATCH" : answer.data.russco_comparison.partial_match ? "PARTIAL MATCH" : "MISSING ELEMENTS"}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {answer.data.compliance_items?.map((item, i) => {
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
                          {item.comment && <p className={`text-sm pl-4 ${cfg.text} opacity-90`}>{item.comment}</p>}
                          {(item.source_name || item.source_url) && (
                            <div className="mt-2 pl-4 flex items-center gap-1 text-xs text-gray-400">
                              <BookOpen className="w-3 h-3 flex-shrink-0" />
                              {item.source_url ? (
                                <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-600">{item.source_name || item.source_url}</a>
                              ) : <span>{item.source_name}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MISSING FROM RUSSCO — VERBATIM */}
              {answer.data.missing_russco_verbatim && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">5. Missing Recommendations from RUSSCO (Verbatim)</h3>
                  <blockquote className="text-sm text-red-800 pl-4 border-l-2 border-red-400 whitespace-pre-line leading-relaxed italic">
                    {answer.data.missing_russco_verbatim}
                  </blockquote>
                </div>
              )}

              {/* NCCN SECTION */}
              {answer.data.nccn_checked && (
                <>
                  {answer.data.nccn_document_url && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-2 text-xs text-slate-600">
                      <BookOpen className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
                      <div><span className="font-semibold text-slate-700">Источник NCCN: </span>
                        <a href={answer.data.nccn_document_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-600">{answer.data.nccn_document_url}</a>
                      </div>
                    </div>
                  )}
                  {answer.data.nccn_recommended_treatment && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">6. NCCN Recommended Treatment</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{answer.data.nccn_recommended_treatment}</p>
                    </div>
                  )}
                  {answer.data.nccn_comparison && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">7. Comparison with NCCN</h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${answer.data.nccn_comparison.full_match ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {answer.data.nccn_comparison.full_match ? "FULL MATCH" : "PARTIAL / MISSING"}
                        </span>
                      </div>
                      {answer.data.nccn_comparison.missing_items?.length > 0 && (
                        <ul className="text-sm text-gray-700 space-y-1">
                          {answer.data.nccn_comparison.missing_items.map((item, i) => (
                            <li key={i} className="flex gap-2"><span className="text-red-400">✗</span>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {answer.data.missing_nccn_verbatim && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                      <h3 className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-2">8. Missing Recommendations from NCCN (Verbatim)</h3>
                      <blockquote className="text-sm text-orange-800 pl-4 border-l-2 border-orange-400 whitespace-pre-line leading-relaxed italic">
                        {answer.data.missing_nccn_verbatim}
                      </blockquote>
                    </div>
                  )}
                </>
              )}

              {/* FINAL CONCLUSION */}
              {answer.data.final_conclusion && (
                <div className="bg-slate-900 text-white rounded-2xl p-5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">9. Final Conclusion</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`rounded-xl p-3 text-center ${answer.data.final_conclusion.russco_compliant ? "bg-emerald-600" : "bg-red-700"}`}>
                      <div className="text-xs text-white/70 mb-1">RUSSCO</div>
                      <div className="font-bold text-sm">{answer.data.final_conclusion.russco_compliant ? "Соответствует" : "Не соответствует"}</div>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${answer.data.final_conclusion.nccn_compliant ? "bg-emerald-600" : answer.data.nccn_checked ? "bg-red-700" : "bg-slate-700"}`}>
                      <div className="text-xs text-white/70 mb-1">NCCN</div>
                      <div className="font-bold text-sm">{answer.data.nccn_checked ? (answer.data.final_conclusion.nccn_compliant ? "Соответствует" : "Не соответствует") : "Не проверялся"}</div>
                    </div>
                  </div>
                  {answer.data.final_conclusion.missing_elements?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-slate-400 mb-1">Отсутствующие элементы:</div>
                      <ul className="space-y-1">{answer.data.final_conclusion.missing_elements.map((el, i) => (
                        <li key={i} className="text-sm text-red-300 flex gap-2"><span>✗</span>{el}</li>
                      ))}</ul>
                    </div>
                  )}
                  {answer.data.final_conclusion.matching_elements?.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Соответствующие элементы:</div>
                      <ul className="space-y-1">{answer.data.final_conclusion.matching_elements.map((el, i) => (
                        <li key={i} className="text-sm text-emerald-300 flex gap-2"><span>✓</span>{el}</li>
                      ))}</ul>
                    </div>
                  )}
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