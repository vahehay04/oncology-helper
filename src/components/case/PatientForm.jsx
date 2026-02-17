import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const RISK_FACTORS = [
  "Чрезмерная инсоляция",
  "Множественные невусы (>50)",
  "Диспластические невусы",
  "Иммуносупрессия",
  "Ранее перенесённая меланома",
  "Фототип I-II (светлая кожа)",
  "Солнечные ожоги в анамнезе",
  "Воздействие канцерогенов",
  "Хронические воспалительные заболевания",
];

export default function PatientForm({ data, onChange }) {
  const [newRisk, setNewRisk] = React.useState("");

  const update = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const addRisk = (risk) => {
    const current = data.risk_factors || [];
    if (!current.includes(risk)) {
      update("risk_factors", [...current, risk]);
    }
    setNewRisk("");
  };

  const removeRisk = (risk) => {
    update("risk_factors", (data.risk_factors || []).filter(r => r !== risk));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">ФИО пациента *</Label>
          <Input
            value={data.full_name || ""}
            onChange={(e) => update("full_name", e.target.value)}
            placeholder="Иванов Иван Иванович"
            className="rounded-xl border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Пол *</Label>
            <Select value={data.gender || ""} onValueChange={(v) => update("gender", v)}>
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue placeholder="Выберите" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="мужской">Мужской</SelectItem>
                <SelectItem value="женский">Женский</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Возраст *</Label>
            <Input
              type="number"
              value={data.age || ""}
              onChange={(e) => update("age", parseInt(e.target.value) || "")}
              placeholder="55"
              className="rounded-xl border-gray-200"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Дата рождения</Label>
          <Input
            type="date"
            value={data.birth_date || ""}
            onChange={(e) => update("birth_date", e.target.value)}
            className="rounded-xl border-gray-200"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">ECOG статус</Label>
          <Select value={String(data.ecog_status ?? "")} onValueChange={(v) => update("ecog_status", parseInt(v))}>
            <SelectTrigger className="rounded-xl border-gray-200">
              <SelectValue placeholder="Выберите" />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4].map(v => (
                <SelectItem key={v} value={String(v)}>ECOG {v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Статус курения</Label>
          <Select value={data.smoking_status || ""} onValueChange={(v) => update("smoking_status", v)}>
            <SelectTrigger className="rounded-xl border-gray-200">
              <SelectValue placeholder="Выберите" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="никогда">Никогда</SelectItem>
              <SelectItem value="бывший курильщик">Бывший курильщик</SelectItem>
              <SelectItem value="курит">Курит</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">Факторы риска</Label>
        <div className="flex flex-wrap gap-2">
          {(data.risk_factors || []).map((risk) => (
            <Badge
              key={risk}
              variant="secondary"
              className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg px-3 py-1.5 flex items-center gap-1.5"
            >
              {risk}
              <button onClick={() => removeRisk(risk)} className="hover:text-indigo-900">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Select value={newRisk} onValueChange={(v) => addRisk(v)}>
            <SelectTrigger className="rounded-xl border-gray-200 flex-1">
              <SelectValue placeholder="Добавить фактор риска..." />
            </SelectTrigger>
            <SelectContent>
              {RISK_FACTORS.filter(r => !(data.risk_factors || []).includes(r)).map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Наследственный анамнез по онкопатологиям</Label>
        <Textarea
          value={data.hereditary_history || ""}
          onChange={(e) => update("hereditary_history", e.target.value)}
          placeholder="Укажите семейный анамнез: меланома, рак молочной железы, рак яичников и др. у ближайших родственников..."
          className="rounded-xl border-gray-200 min-h-[80px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Сопутствующие заболевания</Label>
          <Textarea
            value={data.comorbidities || ""}
            onChange={(e) => update("comorbidities", e.target.value)}
            placeholder="Перечислите сопутствующие заболевания..."
            className="rounded-xl border-gray-200 min-h-[80px]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Аллергологический анамнез</Label>
          <Textarea
            value={data.allergy_history || ""}
            onChange={(e) => update("allergy_history", e.target.value)}
            placeholder="Аллергические реакции..."
            className="rounded-xl border-gray-200 min-h-[80px]"
          />
        </div>
      </div>
    </div>
  );
}