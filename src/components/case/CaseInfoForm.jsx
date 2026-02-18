import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const MKB_CODES = [
  { code: "C43.0", desc: "Меланома губы" },
  { code: "C43.1", desc: "Меланома века, включая спайку век" },
  { code: "C43.2", desc: "Меланома уха и наружного слухового прохода" },
  { code: "C43.3", desc: "Меланома других и неуточненных частей лица" },
  { code: "C43.4", desc: "Меланома волосистой части головы и шеи" },
  { code: "C43.5", desc: "Меланома туловища" },
  { code: "C43.6", desc: "Меланома верхней конечности" },
  { code: "C43.7", desc: "Меланома нижней конечности" },
  { code: "C43.8", desc: "Меланома, выходящая за пределы одной и более локализаций" },
  { code: "C43.9", desc: "Меланома кожи неуточненная" },
  { code: "C44", desc: "Другие злокачественные новообразования кожи" },
  { code: "C77", desc: "Вторичное поражение лимфатических узлов" },
  { code: "C78", desc: "Вторичное злокачественное новообразование органов дыхания и пищеварения" },
  { code: "C79", desc: "Вторичное злокачественное новообразование других локализаций" },
  { code: "D03", desc: "Меланома in situ" },
];

const HISTOLOGY_TYPES = [
  "Поверхностно-распространяющаяся меланома",
  "Узловая меланома",
  "Лентиго-меланома",
  "Акральная лентигинозная меланома",
  "Десмопластическая меланома",
  "Меланома без первично выявленного очага",
  "Другой тип",
];

const DIAGNOSIS_TYPES = ["Основной 1", "Основной 2", "Осложнение", "Сопутствующий", "Фоновый"];

export default function CaseInfoForm({ data, onChange }) {
  const update = (field, value) => onChange({ ...data, [field]: value });

  const diagnoses = data.diagnoses || [{ type: "Основной 1", text: "" }];

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

  const handleMkbSelect = (code) => {
    const mkb = MKB_CODES.find(m => m.code === code);
    update("mkb_code", code);
    if (mkb) update("mkb_description", mkb.desc);
  };

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

      {/* MKB-10 + Histology */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Код МКБ-10</Label>
          <Select value={data.mkb_code || ""} onValueChange={handleMkbSelect}>
            <SelectTrigger className="rounded-xl border-gray-200">
              <SelectValue placeholder="Выберите код МКБ-10" />
            </SelectTrigger>
            <SelectContent>
              {MKB_CODES.map(m => (
                <SelectItem key={m.code} value={m.code}>{m.code} — {m.desc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Гистологический тип</Label>
          <Select value={data.histology || ""} onValueChange={(v) => update("histology", v)}>
            <SelectTrigger className="rounded-xl border-gray-200">
              <SelectValue placeholder="Выберите тип" />
            </SelectTrigger>
            <SelectContent>
              {HISTOLOGY_TYPES.map(h => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}