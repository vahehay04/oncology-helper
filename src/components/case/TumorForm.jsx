import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MKB_CODES = [
  { code: "C43.0", desc: "Меланома губы" },
  { code: "C43.1", desc: "Меланома века, включая спайку век" },
  { code: "C43.2", desc: "Меланома уха и наружного слухового прохода" },
  { code: "C43.3", desc: "Меланома других и неуточненных частей лица" },
  { code: "C43.4", desc: "Меланома волосистой части головы и шеи" },
  { code: "C43.5", desc: "Меланома туловища" },
  { code: "C43.6", desc: "Меланома верхней конечности" },
  { code: "C43.7", desc: "Меланома нижней конечности" },
  { code: "C43.8", desc: "Меланома, выходящая за пределы одной и более вышеуказанных локализаций" },
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

export default function TumorForm({ data, onChange }) {
  const update = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleMkbSelect = (code) => {
    const mkb = MKB_CODES.find(m => m.code === code);
    update("mkb_code", code);
    if (mkb) update("mkb_description", mkb.desc);
  };

  return (
    <div className="space-y-6">
      {/* Diagnosis */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Диагноз (текстовая формулировка) *</Label>
        <Textarea
          value={data.diagnosis_text || ""}
          onChange={(e) => update("diagnosis_text", e.target.value)}
          placeholder="Полная формулировка диагноза..."
          className="rounded-xl border-gray-200 min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Код МКБ-10 *</Label>
          <Select value={data.mkb_code || ""} onValueChange={handleMkbSelect}>
            <SelectTrigger className="rounded-xl border-gray-200">
              <SelectValue placeholder="Выберите код МКБ-10" />
            </SelectTrigger>
            <SelectContent>
              {MKB_CODES.map(m => (
                <SelectItem key={m.code} value={m.code}>
                  {m.code} — {m.desc}
                </SelectItem>
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

      {/* TNM Staging */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">Стадирование по TNM</Label>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">T (опухоль)</Label>
            <Select value={data.t_stage || ""} onValueChange={(v) => update("t_stage", v)}>
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue placeholder="T" />
              </SelectTrigger>
              <SelectContent>
                {["Tis", "T1a", "T1b", "T2a", "T2b", "T3a", "T3b", "T4a", "T4b", "Tx"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">N (лимфоузлы)</Label>
            <Select value={data.n_stage || ""} onValueChange={(v) => update("n_stage", v)}>
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue placeholder="N" />
              </SelectTrigger>
              <SelectContent>
                {["N0", "N1a", "N1b", "N1c", "N2a", "N2b", "N2c", "N3a", "N3b", "N3c", "Nx"].map(n => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">M (метастазы)</Label>
            <Select value={data.m_stage || ""} onValueChange={(v) => update("m_stage", v)}>
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue placeholder="M" />
              </SelectTrigger>
              <SelectContent>
                {["M0", "M1a", "M1b", "M1c", "M1d", "Mx"].map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Стадия</Label>
            <Select value={data.tumor_stage || ""} onValueChange={(v) => update("tumor_stage", v)}>
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue placeholder="Стадия" />
              </SelectTrigger>
              <SelectContent>
                {["0", "IA", "IB", "IIA", "IIB", "IIC", "IIIA", "IIIB", "IIIC", "IIID", "IV"].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Иммуногистохимия (ИГХ)</Label>
        <Textarea
          value={data.immunohistochemistry || ""}
          onChange={(e) => update("immunohistochemistry", e.target.value)}
          placeholder="Результаты ИГХ: S100, HMB-45, Melan-A, Ki-67, PD-L1 и др."
          className="rounded-xl border-gray-200 min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Молекулярные маркеры</Label>
        <Textarea
          value={data.molecular_markers || ""}
          onChange={(e) => update("molecular_markers", e.target.value)}
          placeholder="BRAF V600E/K, NRAS, c-KIT и другие мутации..."
          className="rounded-xl border-gray-200 min-h-[80px]"
        />
      </div>
    </div>
  );
}