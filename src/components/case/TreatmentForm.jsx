import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TREATMENT_TYPES = [
  "Хирургическое лечение",
  "Широкое иссечение",
  "Биопсия сторожевого лимфоузла",
  "Лимфаденэктомия",
  "Адъювантная иммунотерапия",
  "Адъювантная таргетная терапия",
  "Неоадъювантная иммунотерапия",
  "Иммунотерапия (ниволумаб)",
  "Иммунотерапия (пембролизумаб)",
  "Иммунотерапия (ипилимумаб + ниволумаб)",
  "Таргетная терапия (дабрафениб + траметиниб)",
  "Таргетная терапия (вемурафениб + кобиметиниб)",
  "Таргетная терапия (энкорафениб + биниметиниб)",
  "Химиотерапия",
  "Лучевая терапия",
  "Стереотаксическая радиохирургия",
  "Другое",
];

export default function TreatmentForm({ data, onChange }) {
  const treatments = data || [];

  const addTreatment = () => {
    onChange([...treatments, { type: "", details: "", start_date: "", end_date: "", result: "" }]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...treatments];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeItem = (index) => {
    onChange(treatments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {treatments.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-2">Нет добавленного лечения</p>
          <p className="text-sm">Нажмите кнопку ниже, чтобы добавить</p>
        </div>
      )}

      {treatments.map((item, index) => (
        <div
          key={index}
          className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 space-y-4"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Лечение #{index + 1}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-500"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Тип лечения</Label>
              <Select value={item.type || ""} onValueChange={(v) => updateItem(index, "type", v)}>
                <SelectTrigger className="rounded-xl border-gray-200 bg-white">
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {TREATMENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Начало</Label>
                <Input
                  type="date"
                  value={item.start_date || ""}
                  onChange={(e) => updateItem(index, "start_date", e.target.value)}
                  className="rounded-xl border-gray-200 bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Окончание</Label>
                <Input
                  type="date"
                  value={item.end_date || ""}
                  onChange={(e) => updateItem(index, "end_date", e.target.value)}
                  className="rounded-xl border-gray-200 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Детали / Протокол</Label>
            <Textarea
              value={item.details || ""}
              onChange={(e) => updateItem(index, "details", e.target.value)}
              placeholder="Дозировки, схема, особенности..."
              className="rounded-xl border-gray-200 bg-white min-h-[60px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Результат / Ответ</Label>
            <Textarea
              value={item.result || ""}
              onChange={(e) => updateItem(index, "result", e.target.value)}
              placeholder="Результат лечения, побочные эффекты..."
              className="rounded-xl border-gray-200 bg-white min-h-[60px]"
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addTreatment}
        className="w-full rounded-xl border-dashed border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-500 hover:text-indigo-600"
      >
        <Plus className="w-4 h-4 mr-2" />
        Добавить лечение
      </Button>
    </div>
  );
}