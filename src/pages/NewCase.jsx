import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ClipboardList, Stethoscope, ArrowRight, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import CaseInfoForm from "@/components/case/CaseInfoForm";
import DiagnosticsAndTreatmentForm from "@/components/case/DiagnosticsAndTreatmentForm";

const STEPS = [
  { key: "info", label: "Данные случая", icon: ClipboardList },
  { key: "diagnostics_treatment", label: "Диагностика и лечение", icon: Stethoscope },
];

export default function NewCase() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [caseInfoData, setCaseInfoData] = useState({});
  const [diagnostics, setDiagnostics] = useState([]);
  const [treatments, setTreatments] = useState([]);

  const handleSubmit = async () => {
    setSaving(true);

    // Build diagnosis_text from diagnoses array
    const diagnosesArr = caseInfoData.diagnoses || [];
    const diagnosisText = diagnosesArr.map(d => `[${d.type}] ${d.text}`).join("; ");

    const clinicalCase = await base44.entities.ClinicalCase.create({
      diagnosis_text: diagnosisText || caseInfoData.case_number || "Без диагноза",
      mkb_code: caseInfoData.mkb_code,
      mkb_description: caseInfoData.mkb_description,
      histology: caseInfoData.histology,
      diagnostics_performed: diagnostics,
      treatment_performed: treatments,
      status: "на_анализе",
    });

    navigate(createPageUrl("Analysis") + `?caseId=${clinicalCase.id}`);
    setSaving(false);
  };

  const currentStep = STEPS[step];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50/50 to-indigo-50/30">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Новый клинический случай</h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
            Заполните данные для анализа соответствия с Клиническими рекомендациями Министерства Здравоохранения Российской Федерации и Международными стандартами (NCCN, ESMO...)
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <React.Fragment key={s.key}>
                {i > 0 && <div className={`h-px flex-1 ${isDone ? "bg-indigo-300" : "bg-gray-200"}`} />}
                <button
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" :
                    isDone ? "bg-indigo-50 text-indigo-600" : "bg-white text-gray-400 border border-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Form content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            {React.createElement(currentStep.icon, { className: "w-5 h-5 text-indigo-600" })}
            <h2 className="text-xl font-semibold text-gray-900">{currentStep.label}</h2>
          </div>

          {step === 0 && <CaseInfoForm data={caseInfoData} onChange={setCaseInfoData} />}
          {step === 1 && (
            <DiagnosticsAndTreatmentForm
              diagnostics={diagnostics}
              treatments={treatments}
              onDiagnosticsChange={setDiagnostics}
              onTreatmentsChange={setTreatments}
            />
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="text-gray-500 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-6">
              Далее
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl px-8 shadow-lg shadow-indigo-200"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Анализ...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Запустить AI-анализ</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}