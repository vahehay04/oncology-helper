import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlaskConical } from "lucide-react";

export default function OncologySpecificFields({ oncologyType, data, onChange }) {
  if (!oncologyType || !oncologyType.fields?.length) return null;

  const update = (key, value) => {
    const current = data.oncology_specific_fields || {};
    onChange({ ...data, oncology_specific_fields: { ...current, [key]: value } });
  };

  const fieldValues = data.oncology_specific_fields || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-indigo-100">
        <FlaskConical className="w-4 h-4 text-indigo-500" />
        <span className="text-sm font-semibold text-indigo-700">
          Специфические параметры: {oncologyType.label}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {oncologyType.fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">{field.label}</Label>
            {field.type === "select" && (
              <Select
                value={fieldValues[field.key] || ""}
                onValueChange={(v) => update(field.key, v)}
              >
                <SelectTrigger className="rounded-xl border-gray-200 bg-white h-9 text-sm">
                  <SelectValue placeholder="Выберите..." />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {field.type === "text" && (
              <Input
                value={fieldValues[field.key] || ""}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder="Введите значение..."
                className="rounded-xl border-gray-200 h-9 text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}