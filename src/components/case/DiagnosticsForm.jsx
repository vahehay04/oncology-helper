import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DIAGNOSTIC_TYPES = [
  "Дерматоскопия",
  "УЗИ регионарных лимфоузлов",
  "КТ органов грудной клетки",
  "КТ органов брюшной полости",
  "МРТ головного мозга",
  "ПЭТ-КТ",
  "Рентгенография грудной клетки",
  "Биопсия (эксцизионная)",
  "Биопсия (инцизионная)",
  "Биопсия сторожевого лимфоузла",
  "Тонкоигольная аспирационная биопсия",
  "Гистологическое исследование",
  "ИГХ-исследование",
  "Молекулярно-генетическое исследование",
  "Общий анализ крови",
  "Биохимический анализ крови",
  "ЛДГ (лактатдегидрогеназа)",
  "Другое",
];

export default function DiagnosticsForm({ data, onChange }) {
  const diagnostics = data || [];

  const addDiagnostic = () => {
    onChange([...diagnostics, { name: "", date: "", result: "" }]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...diagnostics];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeItem = (index) => {
    onChange(diagnostics.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {diagnostics.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-2">Нет добавленных обследований</p>
          <p className="text-sm">Нажмите кнопку ниже, чтобы добавить</p>
        </div>
      )}

      {diagnostics.map((item, index) => (
        <div
          key={index}
          className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 space-y-4"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Обследование #{index + 1}
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
              <Label className="text-xs text-gray-500">Тип обследования</Label>
              <Select value={item.name || ""} onValueChange={(v) => updateItem(index, "name", v)}>
                <SelectTrigger className="rounded-xl border-gray-200 bg-white">
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {DIAGNOSTIC_TYPES.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Дата проведения</Label>
              <Input
                type="date"
                value={item.date || ""}
                onChange={(e) => updateItem(index, "date", e.target.value)}
                className="rounded-xl border-gray-200 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Результат</Label>
            <Textarea
              value={item.result || ""}
              onChange={(e) => updateItem(index, "result", e.target.value)}
              placeholder="Опишите результат обследования..."
              className="rounded-xl border-gray-200 bg-white min-h-[70px]"
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addDiagnostic}
        className="w-full rounded-xl border-dashed border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-500 hover:text-indigo-600"
      >
        <Plus className="w-4 h-4 mr-2" />
        Добавить обследование
      </Button>
    </div>
  );
}