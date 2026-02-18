import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload, FileText, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

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

export default function DiagnosticsAndTreatmentForm({ diagnostics, treatments, onDiagnosticsChange, onTreatmentsChange }) {
  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Diagnostics
  const addDiagnostic = () => onDiagnosticsChange([...diagnostics, { name: "", date: "", result: "" }]);
  const updateDiagnostic = (i, field, value) => {
    const updated = [...diagnostics];
    updated[i] = { ...updated[i], [field]: value };
    onDiagnosticsChange(updated);
  };
  const removeDiagnostic = (i) => onDiagnosticsChange(diagnostics.filter((_, idx) => idx !== i));

  // Treatments
  const addTreatment = () => onTreatmentsChange([...treatments, { type: "", details: "", start_date: "", end_date: "", result: "" }]);
  const updateTreatment = (i, field, value) => {
    const updated = [...treatments];
    updated[i] = { ...updated[i], [field]: value };
    onTreatmentsChange(updated);
  };
  const removeTreatment = (i) => onTreatmentsChange(treatments.filter((_, idx) => idx !== i));

  // File upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedFiles(prev => [...prev, { name: file.name, url: file_url }]);
    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeUploadedFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">

      {/* File upload section */}
      <div className="bg-indigo-50/60 rounded-2xl p-5 border border-indigo-100">
        <h3 className="text-sm font-semibold text-indigo-800 mb-1">Загрузить данные файлом</h3>
        <p className="text-xs text-indigo-500 mb-4">Вы можете загрузить выписку, протокол или другой документ с данными о диагностике и лечении</p>
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.xlsx,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />
        <div className="flex flex-wrap gap-2">
          {uploadedFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-white text-indigo-700 border border-indigo-200 rounded-lg px-3 py-1.5 text-sm">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="truncate max-w-[180px]">{f.name}</span>
              <button onClick={() => removeUploadedFile(i)} className="hover:text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300 h-9"
          >
            {uploadingFile ? (
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploadingFile ? "Загрузка..." : "Прикрепить файл"}
          </Button>
        </div>
      </div>

      {/* Diagnostics */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Диагностика</h3>
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
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIAGNOSTIC_TYPES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
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
                <Label className="text-xs text-gray-500">Детали / Протокол</Label>
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