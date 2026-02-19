import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { MKB_SYSTEM_PROMPT } from "@/components/lib/sourcePrompt";

// Расширенный список МКБ-10 для онкологии
const MKB_CODES = [
  { code: "C00", desc: "Злокачественное новообразование губы" },
  { code: "C01", desc: "Злокачественное новообразование основания языка" },
  { code: "C02", desc: "Злокачественное новообразование других и неуточненных частей языка" },
  { code: "C03", desc: "Злокачественное новообразование десны" },
  { code: "C04", desc: "Злокачественное новообразование дна полости рта" },
  { code: "C05", desc: "Злокачественное новообразование нёба" },
  { code: "C06", desc: "Злокачественное новообразование других и неуточненных отделов рта" },
  { code: "C07", desc: "Злокачественное новообразование околоушной слюнной железы" },
  { code: "C08", desc: "Злокачественное новообразование других и неуточненных больших слюнных желез" },
  { code: "C09", desc: "Злокачественное новообразование миндалины" },
  { code: "C10", desc: "Злокачественное новообразование ротоглотки" },
  { code: "C11", desc: "Злокачественное новообразование носоглотки" },
  { code: "C12", desc: "Злокачественное новообразование грушевидного синуса" },
  { code: "C13", desc: "Злокачественное новообразование нижней части глотки" },
  { code: "C14", desc: "Злокачественное новообразование других и неточно обозначенных локализаций губы, полости рта и глотки" },
  { code: "C15", desc: "Злокачественное новообразование пищевода" },
  { code: "C16", desc: "Злокачественное новообразование желудка" },
  { code: "C17", desc: "Злокачественное новообразование тонкого кишечника" },
  { code: "C18", desc: "Злокачественное новообразование ободочной кишки" },
  { code: "C19", desc: "Злокачественное новообразование ректосигмоидного соединения" },
  { code: "C20", desc: "Злокачественное новообразование прямой кишки" },
  { code: "C21", desc: "Злокачественное новообразование заднего прохода и анального канала" },
  { code: "C22", desc: "Злокачественное новообразование печени и внутрипечёночных желчных протоков" },
  { code: "C23", desc: "Злокачественное новообразование желчного пузыря" },
  { code: "C24", desc: "Злокачественное новообразование других и неуточненных частей желчевыводящих путей" },
  { code: "C25", desc: "Злокачественное новообразование поджелудочной железы" },
  { code: "C26", desc: "Злокачественное новообразование других и неточно обозначенных органов пищеварения" },
  { code: "C30", desc: "Злокачественное новообразование полости носа и среднего уха" },
  { code: "C31", desc: "Злокачественное новообразование придаточных пазух" },
  { code: "C32", desc: "Злокачественное новообразование гортани" },
  { code: "C33", desc: "Злокачественное новообразование трахеи" },
  { code: "C34", desc: "Злокачественное новообразование бронхов и легкого" },
  { code: "C34.0", desc: "Злокачественное новообразование главного бронха" },
  { code: "C34.1", desc: "Злокачественное новообразование верхней доли бронха или легкого" },
  { code: "C34.2", desc: "Злокачественное новообразование средней доли бронха или легкого" },
  { code: "C34.3", desc: "Злокачественное новообразование нижней доли бронха или легкого" },
  { code: "C34.8", desc: "Злокачественное новообразование бронхов и легкого, выходящее за пределы одной и более локализаций" },
  { code: "C34.9", desc: "Злокачественное новообразование бронхов и легкого неуточненное" },
  { code: "C37", desc: "Злокачественное новообразование вилочковой железы" },
  { code: "C38", desc: "Злокачественное новообразование сердца, средостения и плевры" },
  { code: "C40", desc: "Злокачественное новообразование костей и суставных хрящей конечностей" },
  { code: "C41", desc: "Злокачественное новообразование костей и суставных хрящей других и неуточненных локализаций" },
  { code: "C43", desc: "Злокачественная меланома кожи" },
  { code: "C43.0", desc: "Злокачественная меланома губы" },
  { code: "C43.1", desc: "Злокачественная меланома века, включая спайку век" },
  { code: "C43.2", desc: "Злокачественная меланома уха и наружного слухового прохода" },
  { code: "C43.3", desc: "Злокачественная меланома других и неуточненных частей лица" },
  { code: "C43.4", desc: "Злокачественная меланома волосистой части головы и шеи" },
  { code: "C43.5", desc: "Злокачественная меланома туловища" },
  { code: "C43.6", desc: "Злокачественная меланома верхней конечности, включая область плечевого пояса" },
  { code: "C43.7", desc: "Злокачественная меланома нижней конечности, включая тазобедренную область" },
  { code: "C43.8", desc: "Злокачественная меланома кожи, выходящая за пределы одной и более вышеуказанных локализаций" },
  { code: "C43.9", desc: "Злокачественная меланома кожи неуточненная" },
  { code: "C44", desc: "Другие злокачественные новообразования кожи" },
  { code: "C45", desc: "Мезотелиома" },
  { code: "C46", desc: "Саркома Капоши" },
  { code: "C47", desc: "Злокачественное новообразование периферических нервов и вегетативной нервной системы" },
  { code: "C48", desc: "Злокачественное новообразование забрюшинного пространства и брюшины" },
  { code: "C49", desc: "Злокачественное новообразование других типов соединительной и мягких тканей" },
  { code: "C50", desc: "Злокачественное новообразование молочной железы" },
  { code: "C50.0", desc: "Злокачественное новообразование соска и ареолы молочной железы" },
  { code: "C50.1", desc: "Злокачественное новообразование центральной части молочной железы" },
  { code: "C50.2", desc: "Злокачественное новообразование верхневнутреннего квадранта молочной железы" },
  { code: "C50.3", desc: "Злокачественное новообразование нижневнутреннего квадранта молочной железы" },
  { code: "C50.4", desc: "Злокачественное новообразование верхненаружного квадранта молочной железы" },
  { code: "C50.5", desc: "Злокачественное новообразование нижненаружного квадранта молочной железы" },
  { code: "C50.6", desc: "Злокачественное новообразование подмышечной области молочной железы" },
  { code: "C50.8", desc: "Злокачественное новообразование молочной железы, выходящее за пределы одной и более локализаций" },
  { code: "C50.9", desc: "Злокачественное новообразование молочной железы неуточненной локализации" },
  { code: "C51", desc: "Злокачественное новообразование вульвы" },
  { code: "C52", desc: "Злокачественное новообразование влагалища" },
  { code: "C53", desc: "Злокачественное новообразование шейки матки" },
  { code: "C53.0", desc: "Злокачественное новообразование внутренней части шейки матки" },
  { code: "C53.1", desc: "Злокачественное новообразование наружной части шейки матки" },
  { code: "C53.8", desc: "Злокачественное новообразование шейки матки, выходящее за пределы одной и более локализаций" },
  { code: "C53.9", desc: "Злокачественное новообразование шейки матки неуточненное" },
  { code: "C54", desc: "Злокачественное новообразование тела матки" },
  { code: "C55", desc: "Злокачественное новообразование матки неуточненной локализации" },
  { code: "C56", desc: "Злокачественное новообразование яичника" },
  { code: "C57", desc: "Злокачественное новообразование других и неуточненных женских половых органов" },
  { code: "C58", desc: "Злокачественное новообразование плаценты" },
  { code: "C60", desc: "Злокачественное новообразование полового члена" },
  { code: "C61", desc: "Злокачественное новообразование предстательной железы" },
  { code: "C62", desc: "Злокачественное новообразование яичка" },
  { code: "C63", desc: "Злокачественное новообразование других и неуточненных мужских половых органов" },
  { code: "C64", desc: "Злокачественное новообразование почки, кроме почечной лоханки" },
  { code: "C65", desc: "Злокачественное новообразование почечной лоханки" },
  { code: "C66", desc: "Злокачественное новообразование мочеточника" },
  { code: "C67", desc: "Злокачественное новообразование мочевого пузыря" },
  { code: "C68", desc: "Злокачественное новообразование других и неуточненных мочевых органов" },
  { code: "C69", desc: "Злокачественное новообразование глаза и его придаточного аппарата" },
  { code: "C70", desc: "Злокачественное новообразование мозговых оболочек" },
  { code: "C71", desc: "Злокачественное новообразование головного мозга" },
  { code: "C71.0", desc: "Злокачественное новообразование полушарий головного мозга" },
  { code: "C71.1", desc: "Злокачественное новообразование лобной доли" },
  { code: "C71.2", desc: "Злокачественное новообразование теменной доли" },
  { code: "C71.3", desc: "Злокачественное новообразование височной доли" },
  { code: "C71.4", desc: "Злокачественное новообразование затылочной доли" },
  { code: "C71.5", desc: "Злокачественное новообразование желудочка мозга" },
  { code: "C71.6", desc: "Злокачественное новообразование мозжечка" },
  { code: "C71.7", desc: "Злокачественное новообразование ствола мозга" },
  { code: "C71.8", desc: "Злокачественное новообразование головного мозга, выходящее за пределы одной и более локализаций" },
  { code: "C71.9", desc: "Злокачественное новообразование головного мозга неуточненное" },
  { code: "C72", desc: "Злокачественное новообразование спинного мозга, черепных нервов и других отделов центральной нервной системы" },
  { code: "C73", desc: "Злокачественное новообразование щитовидной железы" },
  { code: "C74", desc: "Злокачественное новообразование надпочечника" },
  { code: "C75", desc: "Злокачественное новообразование других эндокринных желез и родственных структур" },
  { code: "C76", desc: "Злокачественное новообразование других и неточно обозначенных локализаций" },
  { code: "C77", desc: "Вторичное и неуточненное злокачественное новообразование лимфатических узлов" },
  { code: "C78", desc: "Вторичное злокачественное новообразование органов дыхания и пищеварения" },
  { code: "C79", desc: "Вторичное злокачественное новообразование других локализаций" },
  { code: "C80", desc: "Злокачественное новообразование без уточнения локализации" },
  { code: "C81", desc: "Болезнь Ходжкина" },
  { code: "C82", desc: "Фолликулярная лимфома" },
  { code: "C83", desc: "Нефолликулярная лимфома" },
  { code: "C84", desc: "Зрелые T/NK-клеточные лимфомы" },
  { code: "C85", desc: "Другие и неуточненные типы неходжкинской лимфомы" },
  { code: "C88", desc: "Злокачественные иммунопролиферативные болезни" },
  { code: "C90", desc: "Множественная миелома и злокачественные плазмоклеточные новообразования" },
  { code: "C91", desc: "Лимфоидный лейкоз" },
  { code: "C92", desc: "Миелоидный лейкоз" },
  { code: "C93", desc: "Моноцитарный лейкоз" },
  { code: "C94", desc: "Другие лейкозы уточненного клеточного типа" },
  { code: "C95", desc: "Лейкоз неуточненного клеточного типа" },
  { code: "C96", desc: "Другие и неуточненные злокачественные новообразования лимфоидной, кроветворной и родственных им тканей" },
  { code: "D03", desc: "Меланома in situ" },
  { code: "D03.0", desc: "Меланома in situ губы" },
  { code: "D03.1", desc: "Меланома in situ века, включая спайку век" },
  { code: "D03.2", desc: "Меланома in situ уха и наружного слухового прохода" },
  { code: "D03.3", desc: "Меланома in situ других и неуточненных частей лица" },
  { code: "D03.4", desc: "Меланома in situ волосистой части головы и шеи" },
  { code: "D03.5", desc: "Меланома in situ туловища" },
  { code: "D03.6", desc: "Меланома in situ верхней конечности, включая область плечевого пояса" },
  { code: "D03.7", desc: "Меланома in situ нижней конечности, включая тазобедренную область" },
  { code: "D03.9", desc: "Меланома in situ неуточненная" },
];

const HISTOLOGY_TYPES = [
  "Поверхностно-распространяющаяся меланома",
  "Узловая меланома",
  "Лентиго-меланома",
  "Акральная лентигинозная меланома",
  "Десмопластическая меланома",
  "Аденокарцинома",
  "Плоскоклеточный рак",
  "Мелкоклеточный рак",
  "Крупноклеточный рак",
  "Недифференцированный рак",
  "Переходноклеточный рак",
  "Светлоклеточный рак",
  "Папиллярная аденокарцинома",
  "Муцинозная аденокарцинома",
  "Лобулярный рак",
  "Протоковый рак",
  "Меланома без первично выявленного очага",
  "Другой тип",
];

const DIAGNOSIS_TYPES = ["Основной 1", "Основной 2", "Осложнение", "Сопутствующий", "Фоновый"];

export default function CaseInfoForm({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const diagnoses = data.diagnoses || [{ type: "Основной 1", text: "" }];
  const [mkbLoading, setMkbLoading] = useState(false);
  const [mkbSuggestion, setMkbSuggestion] = useState(null);
  const [mkbQuery, setMkbQuery] = useState(data.mkb_code ? `${data.mkb_code} — ${data.mkb_description}` : "");
  const [mkbSearch, setMkbSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [clarifications, setClarifications] = useState({});

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
    setMkbQuery(`${code} — ${desc}`);
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
  "code": "ТОЧНЫЙ КОД (максимально специфичный из списка)",
  "description": "ОПИСАНИЕ КОДА ИЗ СПИСКА",
  "reasoning": "ОБОСНОВАНИЕ со ссылкой ТОЛЬКО на rosoncoweb.ru или cr.minzdrav.gov.ru (никаких других доменов)",
  "missing_params": ["параметр 1 (краткое название вопроса)"] или [],
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

  const handleClarificationChange = (param, value) => {
    setClarifications(prev => ({ ...prev, [param]: value }));
  };

  const handleClarificationSubmit = () => {
    handleAiMkbSuggest(clarifications);
    setClarifications({});
  };

  const filteredCodes = mkbSearch.length >= 2
    ? MKB_CODES.filter(m =>
        m.code.toLowerCase().includes(mkbSearch.toLowerCase()) ||
        m.desc.toLowerCase().includes(mkbSearch.toLowerCase())
      ).slice(0, 20)
    : [];

  return (
    <div className="space-y-6">
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

        {/* AI suggestion */}
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
                <p className="text-xs font-semibold text-amber-800">Для точного определения кода по документу МКБ-10 (rosoncoweb.ru) уточните:</p>
                <div className="space-y-2">
                  {mkbSuggestion.missing_params.map((p, i) => (
                    <div key={i} className="space-y-1">
                      <label className="text-xs text-amber-800 font-medium flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0 inline-block mt-0.5" />
                        {p}
                      </label>
                      <input
                        type="text"
                        value={clarifications[p] || ""}
                        onChange={(e) => handleClarificationChange(p, e.target.value)}
                        placeholder="Введите уточнение..."
                        className="w-full text-xs rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleClarificationSubmit}
                  disabled={mkbLoading || !mkbSuggestion.missing_params.some(p => clarifications[p]?.trim())}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
                >
                  {mkbLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Уточнить и подобрать код
                </button>
              </div>
            )}
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <Input
            value={data.mkb_code ? `${data.mkb_code} — ${data.mkb_description}` : mkbSearch}
            onChange={(e) => {
              if (data.mkb_code) {
                onChange({ ...data, mkb_code: "", mkb_description: "" });
              }
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

      {/* Histology */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Гистологический тип</Label>
        <select
          value={data.histology || ""}
          onChange={(e) => update("histology", e.target.value)}
          className="w-full h-9 rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          <option value="">Выберите тип</option>
          {HISTOLOGY_TYPES.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>
    </div>
  );
}