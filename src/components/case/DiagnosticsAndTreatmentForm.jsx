import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

const TREATMENT_TYPES = [
  "Химиотерапия",
  "Хирургическое лечение",
  "Лучевая терапия",
  "Другое",
];

// Default diagnostics if no cancer type detected
const DEFAULT_DIAGNOSTICS = [
  "Биопсия",
  "Гистологическое исследование",
  "ИГХ-исследование",
  "Молекулярно-генетическое исследование",
  "КТ органов грудной клетки",
  "КТ органов брюшной полости",
  "МРТ",
  "ПЭТ-КТ",
  "УЗИ",
  "Общий анализ крови",
  "Биохимический анализ крови",
  "Другое",
];

export default function DiagnosticsAndTreatmentForm({ diagnostics, treatments, onDiagnosticsChange, onTreatmentsChange, caseData }) {
  const [aiDiagnostics, setAiDiagnostics] = useState([]);
  const [loadingDiag, setLoadingDiag] = useState(false);
  const [diagLoaded, setDiagLoaded] = useState(false);

  // Load AI diagnostics list when diagnosis is known
  useEffect(() => {
    const diagText = (caseData?.diagnoses || []).map(d => d.text).filter(Boolean).join("; ");
    const mkb = caseData?.mkb_code || "";
    if ((diagText || mkb) && !diagLoaded) {
      loadAiDiagnostics(diagText, mkb);
    }
  }, [caseData]);

  // Pre-populate from extracted doc data — normalize type field for diagnostics
  useEffect(() => {
    if (caseData?._extracted_diagnostics?.length > 0 && diagnostics.length === 0) {
      // Try to match extracted name to known list, or keep as-is (don't force "Другое")
      const currentOptions = aiDiagnostics.length > 0 ? aiDiagnostics : DEFAULT_DIAGNOSTICS;
      const normalized = caseData._extracted_diagnostics.map(d => {
        const nameVal = d.name || d.type || "";
        const isKnown = currentOptions.includes(nameVal);
        if (isKnown) return { ...d, name: nameVal };
        // Keep the actual name directly instead of mapping to "Другое"
        return { ...d, name: nameVal };
      });
      onDiagnosticsChange(normalized);
    }
    if (caseData?._extracted_treatments?.length > 0 && treatments.length === 0) {
      // Normalize type to known TREATMENT_TYPES
      const normalized = caseData._extracted_treatments.map(t => {
        const typeVal = t.type || "";
        const isKnown = TREATMENT_TYPES.includes(typeVal);
        if (isKnown) return t;
        // Try to match
        if (/химио/i.test(typeVal)) return { ...t, type: "Химиотерапия" };
        if (/хирург|операц/i.test(typeVal)) return { ...t, type: "Хирургическое лечение" };
        if (/лучев|лт|радио/i.test(typeVal)) return { ...t, type: "Лучевая терапия" };
        return { ...t, type: "Другое", custom_type: typeVal };
      });
      onTreatmentsChange(normalized);
    }
  }, [caseData?._extracted_diagnostics, caseData?._extracted_treatments]);

  const loadAiDiagnostics = async (diagText, mkb) => {
    setLoadingDiag(true);
    const prompt = `Ты — онколог-эксперт. По диагнозу пациента составь список диагностических мероприятий, которые рекомендованы согласно клиническим рекомендациям RUSSCO (rosoncoweb.ru) и Минздрава РФ (cr.minzdrav.gov.ru).

Диагноз: ${diagText || "не указан"}
Код МКБ-10: ${mkb || "не указан"}

Верни список из 8-15 конкретных диагностических мероприятий для данного типа рака. Каждое мероприятие — краткое название (2-6 слов). В конце всегда добавь "Другое".

Ответ верни строго в формате JSON: {"items": ["Название 1", "Название 2", ..., "Другое"]}`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          items: { type: "array", items: { type: "string" } }
        }
      }
    });

    if (res?.items?.length > 0) {
      setAiDiagnostics(res.items);
    } else {
      setAiDiagnostics(DEFAULT_DIAGNOSTICS);
    }
    setDiagLoaded(true);
    setLoadingDiag(false);
  };

  const diagnosticOptions = aiDiagnostics.length > 0 ? aiDiagnostics : DEFAULT_DIAGNOSTICS;

  // Diagnostics CRUD
  const addDiagnostic = () => onDiagnosticsChange([...diagnostics, { name: "", date: "", result: "" }]);
  const updateDiagnostic = (i, field, value) => {
    const updated = [...diagnostics];
    updated[i] = { ...updated[i], [field]: value };
    onDiagnosticsChange(updated);
  };
  const removeDiagnostic = (i) => onDiagnosticsChange(diagnostics.filter((_, idx) => idx !== i));

  // Treatments CRUD
  const addTreatment = () => onTreatmentsChange([...treatments, { type: "", details: "", start_date: "", end_date: "", result: "" }]);
  const updateTreatment = (i, field, value) => {
    const updated = [...treatments];
    updated[i] = { ...updated[i], [field]: value };
    onTreatmentsChange(updated);
  };
  const removeTreatment = (i) => onTreatmentsChange(treatments.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-8">

      {/* Diagnostics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-base font-semibold text-gray-800">Диагностика</h3>
          {loadingDiag && (
            <span className="flex items-center gap-1.5 text-xs text-indigo-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ИИ загружает список по протоколу...
            </span>
          )}
          {diagLoaded && aiDiagnostics.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Sparkles className="w-3 h-3" />
              Список по протоколу RUSSCO/Минздрав
            </span>
          )}
        </div>
        <div className="space-y-3">
          {diagnostics.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">Нажмите кнопку ниже, чтобы добавить обследование</div>
          )}
          {diagnostics.map((item, index) => (
            <div key={index} className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 space-y-4">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Обследование #{index + 1}</span>
                <button onClick={() => removeDiagnostic(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Тип обследования</Label>
                  <Select value={item.name || ""} onValueChange={(v) => updateDiagnostic(index, "name", v)}>
                    <SelectTrigger className="rounded-xl border-gray-200 bg-white">
                      <SelectValue placeholder={loadingDiag ? "Загрузка..." : "Выберите тип"} />
                    </SelectTrigger>
                    <SelectContent>
                      {diagnosticOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {item.name === "Другое" && (
                    <Input
                      value={item.custom_name || ""}
                      onChange={(e) => updateDiagnostic(index, "custom_name", e.target.value)}
                      placeholder="Укажите название обследования..."
                      className="rounded-xl border-gray-200 bg-white mt-2"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Дата проведения</Label>
                  <Input type="date" value={item.date || ""} onChange={(e) => updateDiagnostic(index, "date", e.target.value)} className="rounded-xl border-gray-200 bg-white" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Результат</Label>
                <Textarea value={item.result || ""} onChange={(e) => updateDiagnostic(index, "result", e.target.value)} placeholder="Опишите результат обследования..." className="rounded-xl border-gray-200 bg-white min-h-[70px]" />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addDiagnostic} className="w-full rounded-xl border-dashed border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-500 hover:text-indigo-600">
            <Plus className="w-4 h-4 mr-2" />Добавить обследование
          </Button>
        </div>
      </div>

      {/* Treatments */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Лечение</h3>
        <div className="space-y-3">
          {treatments.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">Нажмите кнопку ниже, чтобы добавить лечение</div>
          )}
          {treatments.map((item, index) => (
            <div key={index} className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 space-y-4">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Лечение #{index + 1}</span>
                <button onClick={() => removeTreatment(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500">Тип лечения</Label>
                  <Select value={item.type || ""} onValueChange={(v) => updateTreatment(index, "type", v)}>
                    <SelectTrigger className="rounded-xl border-gray-200 bg-white">
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      {TREATMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {item.type === "Другое" && (
                    <Input
                      value={item.custom_type || ""}
                      onChange={(e) => updateTreatment(index, "custom_type", e.target.value)}
                      placeholder="Укажите тип лечения..."
                      className="rounded-xl border-gray-200 bg-white mt-2"
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">Начало</Label>
                    <Input type="date" value={item.start_date || ""} onChange={(e) => updateTreatment(index, "start_date", e.target.value)} className="rounded-xl border-gray-200 bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">Окончание</Label>
                    <Input type="date" value={item.end_date || ""} onChange={(e) => updateTreatment(index, "end_date", e.target.value)} className="rounded-xl border-gray-200 bg-white" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Детали / Схема</Label>
                <Textarea value={item.details || ""} onChange={(e) => updateTreatment(index, "details", e.target.value)} placeholder="Дозировки, схема, особенности..." className="rounded-xl border-gray-200 bg-white min-h-[60px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Результат / Ответ</Label>
                <Textarea value={item.result || ""} onChange={(e) => updateTreatment(index, "result", e.target.value)} placeholder="Результат лечения, побочные эффекты..." className="rounded-xl border-gray-200 bg-white min-h-[60px]" />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addTreatment} className="w-full rounded-xl border-dashed border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-500 hover:text-indigo-600">
            <Plus className="w-4 h-4 mr-2" />Добавить лечение
          </Button>
        </div>
      </div>

    </div>
  );
}