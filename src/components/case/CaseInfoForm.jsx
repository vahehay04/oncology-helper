import React, { useState, useEffect, useRef } from "react";
import mammoth from "mammoth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Sparkles, Loader2, Check, Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { MKB_SYSTEM_PROMPT } from "@/components/lib/sourcePrompt";
import { detectOncologyType, ONCOLOGY_FIELD_MAP } from "@/components/case/oncologyFields";
import OncologySpecificFields from "@/components/case/OncologySpecificFields";

// Расширенный список МКБ-10 для онкологии
const MKB_CODES = [
  { code: "C00", desc: "Злокачественное новообразование губы" },
  { code: "C01", desc: "Злокачественное новообразование основания языка" },
  { code: "C02", desc: "Злокачественное новообразование других и неуточненных частей языка" },
  { code: "C03", desc: "Злокачественное новообразование десны" },
  { code: "C04", desc: "Злокачественное новообразование дна полости рта" },
  { code: "C05", desc: "Злокачественное новообразование нёба" },
  { code: "C06", desc: "Злокачественное новообразование других и неуточненных отделов рта" },
  { code: "C09", desc: "Злокачественное новообразование миндалины" },
  { code: "C10", desc: "Злокачественное новообразование ротоглотки" },
  { code: "C11", desc: "Злокачественное новообразование носоглотки" },
  { code: "C12", desc: "Злокачественное новообразование грушевидного синуса" },
  { code: "C13", desc: "Злокачественное новообразование нижней части глотки" },
  { code: "C15", desc: "Злокачественное новообразование пищевода" },
  { code: "C16", desc: "Злокачественное новообразование желудка" },
  { code: "C18", desc: "Злокачественное новообразование ободочной кишки" },
  { code: "C20", desc: "Злокачественное новообразование прямой кишки" },
  { code: "C21", desc: "Злокачественное новообразование заднего прохода и анального канала" },
  { code: "C22", desc: "Злокачественное новообразование печени" },
  { code: "C23", desc: "Злокачественное новообразование желчного пузыря" },
  { code: "C25", desc: "Злокачественное новообразование поджелудочной железы" },
  { code: "C30", desc: "Злокачественное новообразование полости носа" },
  { code: "C32", desc: "Злокачественное новообразование гортани" },
  { code: "C33", desc: "Злокачественное новообразование трахеи" },
  { code: "C34", desc: "Злокачественное новообразование бронхов и легкого" },
  { code: "C40", desc: "Злокачественное новообразование костей конечностей" },
  { code: "C41", desc: "Злокачественное новообразование костей других локализаций" },
  { code: "C43", desc: "Злокачественная меланома кожи" },
  { code: "C43.0", desc: "Злокачественная меланома губы" },
  { code: "C43.3", desc: "Злокачественная меланома лица" },
  { code: "C43.5", desc: "Злокачественная меланома туловища" },
  { code: "C43.6", desc: "Злокачественная меланома верхней конечности" },
  { code: "C43.7", desc: "Злокачественная меланома нижней конечности" },
  { code: "C43.9", desc: "Злокачественная меланома кожи неуточненная" },
  { code: "C44", desc: "Другие злокачественные новообразования кожи" },
  { code: "C49", desc: "Злокачественное новообразование мягких тканей" },
  { code: "C50", desc: "Злокачественное новообразование молочной железы" },
  { code: "C50.9", desc: "Злокачественное новообразование молочной железы неуточненное" },
  { code: "C51", desc: "Злокачественное новообразование вульвы" },
  { code: "C52", desc: "Злокачественное новообразование влагалища" },
  { code: "C53", desc: "Злокачественное новообразование шейки матки" },
  { code: "C54", desc: "Злокачественное новообразование тела матки" },
  { code: "C56", desc: "Злокачественное новообразование яичника" },
  { code: "C61", desc: "Злокачественное новообразование предстательной железы" },
  { code: "C62", desc: "Злокачественное новообразование яичка" },
  { code: "C64", desc: "Злокачественное новообразование почки" },
  { code: "C67", desc: "Злокачественное новообразование мочевого пузыря" },
  { code: "C71", desc: "Злокачественное новообразование головного мозга" },
  { code: "C73", desc: "Злокачественное новообразование щитовидной железы" },
  { code: "C80", desc: "Злокачественное новообразование без уточнения локализации" },
  { code: "C81", desc: "Болезнь Ходжкина" },
  { code: "C83", desc: "Нефолликулярная лимфома" },
  { code: "C90", desc: "Множественная миелома" },
  { code: "C91", desc: "Лимфоидный лейкоз" },
  { code: "C92", desc: "Миелоидный лейкоз" },
  { code: "D03", desc: "Меланома in situ" },
];

const DIAGNOSIS_TYPES = ["Основной 1", "Основной 2", "Осложнение", "Сопутствующий", "Фоновый"];

export default function CaseInfoForm({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const diagnoses = data.diagnoses || [{ type: "Основной 1", text: "" }];
  const [mkbLoading, setMkbLoading] = useState(false);
  const [mkbSuggestion, setMkbSuggestion] = useState(null);
  const [mkbSearch, setMkbSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [clarifications, setClarifications] = useState({});
  const [detectedOncology, setDetectedOncology] = useState(null);

  // Document upload & AI extraction
  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [extractingData, setExtractingData] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState(null);

  useEffect(() => {
    const allText = (data.diagnoses || []).map(d => d.text).filter(Boolean).join(" ");
    const detected = detectOncologyType(allText);
    setDetectedOncology(detected);
  }, [data.diagnoses]);

  const updateDiagnosis = (index, field, value) => {
    const updated = [...diagnoses];
    updated[index] = { ...updated[index], [field]: value };
    update("diagnoses", updated);
  };

  const addDiagnosis = () => {
    update("diagnoses", [...diagnoses, { type: "", text: "" }]);
  };

  const removeDiagnosis = (index) => {
    update("diagnoses", diagnoses.filter((_, i) => i !== index));
  };

  const handleMkbSelect = (code, desc) => {
    onChange({ ...data, mkb_code: code, mkb_description: desc });
    setMkbSearch("");
    setShowDropdown(false);
    setMkbSuggestion(null);
  };

  const handleAiMkbSuggest = async (extraClarifications = {}) => {
    const diagnosisText = diagnoses.map(d => d.text).filter(Boolean).join("; ");
    if (!diagnosisText) return;

    setMkbLoading(true);
    setMkbSuggestion(null);

    const codesList = MKB_CODES.map(m => `- ${m.code}: ${m.desc}`).join("\n");
    const clarificationText = Object.entries(extraClarifications)
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");

    const prompt = `${MKB_SYSTEM_PROMPT}

Диагноз врача: "${diagnosisText}"
${clarificationText ? `\nДополнительные уточнения от врача:\n${clarificationText}` : ""}

Список возможных кодов МКБ-10:
${codesList}

Ответь строго в формате JSON:
{
  "code": "ТОЧНЫЙ КОД",
  "description": "ОПИСАНИЕ КОДА ИЗ СПИСКА",
  "reasoning": "ОБОСНОВАНИЕ",
  "missing_params": ["параметр 1"] или [],
  "needs_clarification": true или false
}`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          code: { type: "string" },
          description: { type: "string" },
          reasoning: { type: "string" },
          missing_params: { type: "array", items: { type: "string" } },
          needs_clarification: { type: "boolean" },
        },
      },
    });

    setMkbSuggestion(res);
    setMkbLoading(false);
  };

  // Upload & AI-extract document data
  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedDoc({ name: file.name, url: file_url });
    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Immediately run AI extraction
    await runAiExtraction(file_url, file.name);
  };

  const runAiExtraction = async (fileUrl, fileName) => {
    setExtractingData(true);

    const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(fileName);
    const isDocx = /\.docx$/i.test(fileName);

    // Step 1: get raw document text
    let docText = "";
    let imageUrl = null;
    if (isImage) {
      imageUrl = fileUrl;
    } else if (isDocx) {
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer });
      docText = value;
    } else {
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: { type: "object", properties: { text: { type: "string" } } }
      });
      docText = extracted?.output?.text || JSON.stringify(extracted?.output || "");
    }

    const docContext = imageUrl ? "" : `\n\nПОЛНОЕ СОДЕРЖИМОЕ ДОКУМЕНТА:\n${docText}`;

    // Step 2: extract base clinical data + detect oncology type
    const baseSchema = {
      type: "object",
      properties: {
        case_number: { type: "string" },
        diagnoses: { type: "array", items: { type: "object", properties: { type: { type: "string" }, text: { type: "string" } } } },
        mkb_code: { type: "string" },
        mkb_description: { type: "string" },
        tumor_stage: { type: "string" },
        t_stage: { type: "string" },
        n_stage: { type: "string" },
        m_stage: { type: "string" },
        immunohistochemistry: { type: "string" },
        molecular_markers: { type: "string" },
        diagnostics_performed: { type: "array", items: { type: "object", properties: { name: { type: "string" }, date: { type: "string" }, result: { type: "string" } } } },
        treatment_performed: { type: "array", items: { type: "object", properties: { type: { type: "string" }, details: { type: "string" }, start_date: { type: "string" }, end_date: { type: "string" }, result: { type: "string" } } } },
        side_effects: { type: "string" },
        outcomes: { type: "string" },
      }
    };

    const basePromptText = `РЕЖИМ: СТРОГОЕ ИЗВЛЕЧЕНИЕ ДАННЫХ ИЗ МЕДИЦИНСКОГО ДОКУМЕНТА.

ПРАВИЛА (нарушение недопустимо):
- Извлекай ТОЛЬКО то, что ЯВНО написано в документе.
- Запрещено додумывать, предполагать, интерполировать любые данные.
- Если параметр не указан в документе — верни пустую строку "".
- Запрещено предполагать стадию, TNM, гистологию, если они не написаны явно.
- Копируй формулировки из документа дословно, не перефразируя.

ЗАДАЧА: Прочитай ВЕСЬ документ от начала до конца и извлеки следующие данные:

1. diagnoses: все диагнозы (основной, осложнения, сопутствующие) — тип и точная формулировка из документа
2. mkb_code: код МКБ-10 если указан явно
3. mkb_description: описание кода МКБ-10 если указано
4. tumor_stage: стадия опухоли если указана явно (например "III", "IIB", "IV")
5. t_stage: компонент T из TNM если указан явно
6. n_stage: компонент N из TNM если указан явно
7. m_stage: компонент M из TNM если указан явно
8. immunohistochemistry: гистологический тип опухоли и ИГХ данные если указаны
9. molecular_markers: все биомаркеры и мутационный статус (HER2, MSI, PD-L1, EGFR, KRAS, BRAF и т.д.) дословно из документа
10. diagnostics_performed: ВСЕ обследования из документа — биопсия, гистология, ИГХ, молекулярная диагностика, КТ, МРТ, ПЭТ, УЗИ, анализы крови — каждое отдельным объектом {name, date, result}
11. treatment_performed: ВСЕ виды лечения из документа — химиотерапия (со схемой и ТОЧНЫМ числом курсов), лучевая терапия, операции — каждое отдельным объектом {type, details, start_date, end_date, result}
12. side_effects: побочные эффекты если указаны
13. outcomes: исходы лечения если указаны

Если данных нет — пустая строка или пустой массив. Верни JSON.`;

    const baseResult = await base44.integrations.Core.InvokeLLM({
      prompt: basePromptText + docContext,
      ...(imageUrl && { file_urls: [imageUrl] }),
      response_json_schema: baseSchema,
    });

    // Step 3: detect oncology type from diagnosis, then extract specific fields with explicit field list
    const diagText = (baseResult.diagnoses || []).map(d => d.text).filter(Boolean).join(" ");
    const detectedType = detectOncologyType(diagText || baseResult.mkb_code || "");

    let normalizedSpecific = {};
    if (detectedType && detectedType.fields.length > 0) {
      // Build explicit field instructions with all options
      const fieldInstructions = detectedType.fields.map(f => {
        if (f.options) {
          return `- "${f.key}" (${f.label}): выбери ТОЧНО одно из: [${f.options.map(o => `"${o}"`).join(", ")}]`;
        }
        return `- "${f.key}" (${f.label}): строка`;
      }).join("\n");

      const specificSchema = {
        type: "object",
        properties: Object.fromEntries(detectedType.fields.map(f => [f.key, { type: "string" }]))
      };

      const specificPrompt = `Ты — медицинский эксперт-онколог. Внимательно прочитай весь документ и найди значения КАЖДОГО из следующих параметров для нозологии "${detectedType.label}".

Для КАЖДОГО параметра найди значение в документе. Если значение явно указано — укажи его. Если не указано — оставь пустую строку "".

ПАРАМЕТРЫ ДЛЯ ЗАПОЛНЕНИЯ (используй ТОЧНЫЕ значения из списка вариантов):
${fieldInstructions}

ВАЖНО: Ищи в документе упоминания HER2, MSI, MSS, MMR, PD-L1, CPS, FGFR2, тип по Lauren, гистологию и любые другие биомаркеры. Они могут быть записаны в разных форматах.${docContext}

Верни JSON только с этими ключами.`;

      const specificResult = await base44.integrations.Core.InvokeLLM({
        prompt: specificPrompt,
        ...(imageUrl && { file_urls: [imageUrl] }),
        response_json_schema: specificSchema,
      });

      // Map to valid options
      for (const field of detectedType.fields) {
        const raw = specificResult?.[field.key];
        if (!raw) continue;
        if (field.options) {
          const rawLower = String(raw).toLowerCase().trim();
          // Exact match first
          const exact = field.options.find(o => o.toLowerCase() === rawLower);
          if (exact) { normalizedSpecific[field.key] = exact; continue; }
          // Partial match
          const partial = field.options.find(o => {
            const oLower = o.toLowerCase();
            return oLower.includes(rawLower) || rawLower.includes(oLower.replace(/[^а-яa-z0-9]/gi, "").slice(0, 6));
          });
          if (partial) { normalizedSpecific[field.key] = partial; continue; }
          // Semantic shortcuts
          if (/отриц|negat|0\/1|0\+|1\+(?!.*fish)|не.*полож/i.test(raw)) {
            const neg = field.options.find(o => /отриц|negat/i.test(o));
            if (neg) { normalizedSpecific[field.key] = neg; continue; }
          }
          if (/полож|posit|3\+|amplif/i.test(raw)) {
            const pos = field.options.find(o => /полож|posit/i.test(o) && !/не.*полож/i.test(o));
            if (pos) { normalizedSpecific[field.key] = pos; continue; }
          }
          if (/mss|pmmr|proficien/i.test(raw)) {
            const mss = field.options.find(o => /mss|pmmr/i.test(o));
            if (mss) { normalizedSpecific[field.key] = mss; continue; }
          }
          if (/msi.?h|dmmr|deficien/i.test(raw)) {
            const msih = field.options.find(o => /msi.?h|dmmr/i.test(o));
            if (msih) { normalizedSpecific[field.key] = msih; continue; }
          }
        } else {
          normalizedSpecific[field.key] = String(raw);
        }
      }
    }

    // Step 4: merge everything
    const merged = { ...data };
    if (baseResult.case_number) merged.case_number = baseResult.case_number;
    if (baseResult.diagnoses?.length > 0) merged.diagnoses = baseResult.diagnoses;
    if (baseResult.mkb_code) { merged.mkb_code = baseResult.mkb_code; merged.mkb_description = baseResult.mkb_description || ""; }
    if (baseResult.tumor_stage) merged.tumor_stage = baseResult.tumor_stage;
    if (baseResult.t_stage) merged.t_stage = baseResult.t_stage;
    if (baseResult.n_stage) merged.n_stage = baseResult.n_stage;
    if (baseResult.m_stage) merged.m_stage = baseResult.m_stage;
    if (baseResult.immunohistochemistry) merged.immunohistochemistry = baseResult.immunohistochemistry;
    if (baseResult.molecular_markers) merged.molecular_markers = baseResult.molecular_markers;
    if (Object.keys(normalizedSpecific).length > 0) {
      merged.oncology_specific_fields = { ...(merged.oncology_specific_fields || {}), ...normalizedSpecific };
    }
    if (baseResult.diagnostics_performed?.length > 0) merged._extracted_diagnostics = baseResult.diagnostics_performed;
    if (baseResult.treatment_performed?.length > 0) merged._extracted_treatments = baseResult.treatment_performed;

    onChange(merged);
    setExtractingData(false);
  };

  const filteredCodes = mkbSearch.length >= 2
    ? MKB_CODES.filter(m =>
        m.code.toLowerCase().includes(mkbSearch.toLowerCase()) ||
        m.desc.toLowerCase().includes(mkbSearch.toLowerCase())
      ).slice(0, 20)
    : [];

  return (
    <div className="space-y-6">

      {/* Document upload */}
      <div className="bg-indigo-50/70 rounded-2xl p-5 border border-indigo-100">
        <h3 className="text-sm font-semibold text-indigo-800 mb-1 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Загрузить документ (выписка, протокол)
        </h3>
        <p className="text-xs text-indigo-500 mb-3">
          ИИ автоматически извлечёт все данные: диагноз, МКБ, маркеры, диагностику, лечение и т.д.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          onChange={handleDocUpload}
          className="hidden"
        />

        {uploadedDoc ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white text-indigo-700 border border-indigo-200 rounded-lg px-3 py-1.5 text-sm flex-1">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{uploadedDoc.name}</span>
              <button onClick={() => setUploadedDoc(null)} className="ml-auto hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {extractingData && (
              <div className="flex items-center gap-2 text-xs text-indigo-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ИИ извлекает данные...
              </div>
            )}
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile || extractingData}
            className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300 h-9"
          >
            {uploadingFile ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Загрузка...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" />Прикрепить документ</>
            )}
          </Button>
        )}

        {extractingData && (
          <div className="mt-3 flex items-center gap-2 text-xs text-indigo-600 bg-indigo-100 rounded-lg px-3 py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
            ИИ анализирует документ и заполняет поля автоматически...
          </div>
        )}
      </div>

      {/* Unique case number */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Уникальный номер случая</Label>
        <Input
          value={data.case_number || ""}
          onChange={(e) => update("case_number", e.target.value)}
          placeholder="Например: ОНК-2026-001"
          className="rounded-xl border-gray-200"
        />
      </div>

      {/* Diagnoses */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">Диагнозы</Label>
        {diagnoses.map((diag, index) => (
          <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Диагноз #{index + 1}</span>
              {diagnoses.length > 1 && (
                <button onClick={() => removeDiagnosis(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Тип</Label>
                <Select value={diag.type || ""} onValueChange={(v) => updateDiagnosis(index, "type", v)}>
                  <SelectTrigger className="rounded-xl border-gray-200 bg-white">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAGNOSIS_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs text-gray-500">Формулировка</Label>
                <Input
                  value={diag.text || ""}
                  onChange={(e) => updateDiagnosis(index, "text", e.target.value)}
                  placeholder="Формулировка диагноза..."
                  className="rounded-xl border-gray-200 bg-white"
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={addDiagnosis}
          className="w-full rounded-xl border-dashed border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-500 hover:text-indigo-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить диагноз
        </Button>
      </div>

      {/* MKB-10 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">Код МКБ-10</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setClarifications({}); handleAiMkbSuggest({}); }}
            disabled={mkbLoading || !diagnoses.some(d => d.text)}
            className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg h-7 px-3 gap-1.5"
          >
            {mkbLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Подобрать AI
          </Button>
        </div>

        {mkbSuggestion && (
          <div className={`border rounded-xl p-3 space-y-2 ${mkbSuggestion.needs_clarification ? "bg-amber-50 border-amber-200" : "bg-indigo-50 border-indigo-200"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-semibold ${mkbSuggestion.needs_clarification ? "text-amber-800" : "text-indigo-800"}`}>{mkbSuggestion.code}</span>
                  <span className={`text-sm ${mkbSuggestion.needs_clarification ? "text-amber-700" : "text-indigo-700"}`}>— {mkbSuggestion.description}</span>
                </div>
                <p className={`text-xs leading-relaxed ${mkbSuggestion.needs_clarification ? "text-amber-700" : "text-indigo-600"}`}>{mkbSuggestion.reasoning}</p>
              </div>
              <button
                onClick={() => handleMkbSelect(mkbSuggestion.code, mkbSuggestion.description)}
                className={`flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ${mkbSuggestion.needs_clarification ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
              >
                <Check className="w-3 h-3" />
                Принять
              </button>
            </div>
            {mkbSuggestion.needs_clarification && mkbSuggestion.missing_params?.length > 0 && (
              <div className="bg-amber-100 rounded-lg p-2.5 space-y-2">
                <p className="text-xs font-semibold text-amber-800">Уточните:</p>
                {mkbSuggestion.missing_params.map((p, i) => (
                  <div key={i} className="space-y-1">
                    <label className="text-xs text-amber-800 font-medium">{p}</label>
                    <input
                      type="text"
                      value={clarifications[p] || ""}
                      onChange={(e) => setClarifications(prev => ({ ...prev, [p]: e.target.value }))}
                      placeholder="Введите уточнение..."
                      className="w-full text-xs rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                ))}
                <button
                  onClick={() => { handleAiMkbSuggest(clarifications); setClarifications({}); }}
                  disabled={mkbLoading}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {mkbLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Уточнить и подобрать код
                </button>
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <Input
            value={data.mkb_code ? `${data.mkb_code} — ${data.mkb_description}` : mkbSearch}
            onChange={(e) => {
              if (data.mkb_code) onChange({ ...data, mkb_code: "", mkb_description: "" });
              setMkbSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="Введите код или название (например: C43 или меланома)"
            className="rounded-xl border-gray-200"
          />
          {showDropdown && filteredCodes.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredCodes.map(m => (
                <button
                  key={m.code}
                  type="button"
                  onMouseDown={() => handleMkbSelect(m.code, m.desc)}
                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-sm flex items-center gap-3 border-b border-gray-50 last:border-0"
                >
                  <span className="font-mono font-semibold text-indigo-600 w-14 flex-shrink-0">{m.code}</span>
                  <span className="text-gray-700">{m.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {mkbSearch.length > 0 && mkbSearch.length < 2 && (
          <p className="text-xs text-gray-400">Введите минимум 2 символа для поиска</p>
        )}
      </div>

      {/* Oncology-specific fields */}
      {detectedOncology && (
        <OncologySpecificFields
          oncologyType={detectedOncology}
          data={data}
          onChange={onChange}
        />
      )}
    </div>
  );
}