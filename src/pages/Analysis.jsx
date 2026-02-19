import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, XCircle, PlusCircle, ArrowLeft, ThumbsUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import AnalysisItem from "@/components/analysis/AnalysisItem";

export default function Analysis() {
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get("caseId");

  const [clinicalCase, setClinicalCase] = useState(null);
  const [patient, setPatient] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadData();
  }, [caseId]);

  const loadData = async () => {
    if (!caseId) return;
    setLoading(true);

    const caseData = await base44.entities.ClinicalCase.list();
    const foundCase = caseData.find(c => c.id === caseId);
    setClinicalCase(foundCase);

    if (foundCase?.patient_id) {
      const patients = await base44.entities.Patient.list();
      setPatient(patients.find(p => p.id === foundCase.patient_id));
    }

    // Check for existing analysis
    const analyses = await base44.entities.AnalysisResult.filter({ clinical_case_id: caseId });
    if (analyses.length > 0) {
      setAnalysisResult(analyses[0]);
    } else if (foundCase?.status === "на_анализе") {
      runAnalysis(foundCase);
    }

    setLoading(false);
  };

  const runAnalysis = async (caseData) => {
    setAnalyzing(true);

    const prompt = `Ты — строго нормативный AI-эксперт по онкологии.

╔══════════════════════════════════════════════════════════════╗
║   ДВОЙНАЯ ПРОВЕРКА: МИНЗДРАВ РФ + RUSSCO                    ║
║   Оба источника обязательны для каждого пункта анализа      ║
╚══════════════════════════════════════════════════════════════╝

РАЗРЕШЁННЫЕ ДОМЕНЫ (только они):
1. cr.minzdrav.gov.ru — клинические рекомендации Минздрава РФ
2. rosoncoweb.ru — рекомендации RUSSCO

АЛГОРИТМ ДЛЯ КАЖДОГО ПУНКТА:
1. Открыть соответствующий документ на cr.minzdrav.gov.ru и проверить, есть ли там данный пункт.
2. Открыть соответствующий документ на rosoncoweb.ru и проверить, есть ли там данный пункт.
3. Если оба источника содержат ОДИНАКОВУЮ рекомендацию по пункту — объединить в ОДИН пункт анализа с двумя ссылками в полях source_reference_minzdrav и source_reference_russco.
4. Если источники РАСХОДЯТСЯ — создать ОТДЕЛЬНЫЙ пункт для каждого источника.
5. Если пункт есть только в одном источнике — указать только его.

ВАЖНО: Если один пункт подтверждён сразу в обоих источниках — не дублировать пункт, а объединить со ДВУМЯ ссылками.

ДАННЫЕ КЛИНИЧЕСКОГО СЛУЧАЯ:
Пациент: ${caseData.diagnosis_text || "не указан"}
Код МКБ-10: ${caseData.mkb_code || "не указан"}
Стадия: T${caseData.t_stage || "?"} N${caseData.n_stage || "?"} M${caseData.m_stage || "?"}, стадия ${caseData.tumor_stage || "?"}
Гистология: ${caseData.histology || "не указана"}
ИГХ: ${caseData.immunohistochemistry || "не указана"}
Молекулярные маркеры: ${caseData.molecular_markers || "не указаны"}
${Object.keys(caseData.oncology_specific_fields || {}).length > 0 ? `\nСпецифические нозологические параметры:\n${Object.entries(caseData.oncology_specific_fields).map(([k, v]) => `- ${k}: ${v}`).join("\n")}` : ""}

Выполненная диагностика:
${(caseData.diagnostics_performed || []).map(d => `- ${d.name}: ${d.result}`).join("\n") || "не указана"}

Проведённое лечение:
${(caseData.treatment_performed || []).map(t => `- ${t.type}: ${t.details} (${t.result || ""})`).join("\n") || "не указано"}

ЗАДАНИЕ:
Проанализируй каждый пункт диагностики и лечения, проверив ОБА источника, и верни JSON.

Для КАЖДОГО пункта:
- "status": одно из "рекомендовано", "сомнительно", "не_рекомендовано", "необходимо_дополнить"
- "evidence_level": уровень доказательности (A, B, C, D)
- "comment": подробный комментарий по тексту документов
- "source_domain": домены через запятую, если оба: "cr.minzdrav.gov.ru, rosoncoweb.ru"
- "source_reference": URL Минздрава (основной) или единственный URL
- "source_reference_minzdrav": URL документа cr.minzdrav.gov.ru (если найдено в Минздраве)
- "source_reference_russco": URL документа rosoncoweb.ru (если найдено в RUSSCO)
- "source_document": названия документов обоих источников через "; " если оба
- "source_text": прямая цитата из документа (предпочтительно из Минздрава)
- "confirmed_by_both": true если пункт подтверждён в обоих источниках, иначе false

Также определи НЕДОСТАЮЩИЕ пункты (проверяя оба источника).
Оцени общее соответствие: "высокое", "среднее", "низкое".
В поле "summary" укажи: какие документы из каких доменов использованы.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          analysis_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                item: { type: "string" },
                status: { type: "string", enum: ["рекомендовано", "сомнительно", "не_рекомендовано", "необходимо_дополнить"] },
                evidence_level: { type: "string" },
                comment: { type: "string" },
                source_domain: { type: "string" },
                source_reference: { type: "string" },
                source_reference_minzdrav: { type: "string" },
                source_reference_russco: { type: "string" },
                source_document: { type: "string" },
                source_text: { type: "string" },
                confirmed_by_both: { type: "boolean" }
              }
            }
          },
          missing_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                item: { type: "string" },
                recommendation: { type: "string" },
                source_reference: { type: "string" }
              }
            }
          },
          overall_compliance: { type: "string", enum: ["высокое", "среднее", "низкое"] },
          summary: { type: "string" }
        }
      }
    });

    const analysis = await base44.entities.AnalysisResult.create({
      clinical_case_id: caseId,
      ...result,
    });

    setAnalysisResult(analysis);
    await base44.entities.ClinicalCase.update(caseId, { status: "проанализирован" });
    setClinicalCase(prev => ({ ...prev, status: "проанализирован" }));
    setAnalyzing(false);
  };

  const handleApprove = async () => {
    setApproving(true);
    await base44.entities.ClinicalCase.update(caseId, { status: "одобрен" });
    setClinicalCase(prev => ({ ...prev, status: "одобрен" }));
    setApproving(false);
  };

  if (loading || analyzing) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {analyzing ? "AI анализирует данные..." : "Загрузка..."}
          </h2>
          {analyzing && (
            <p className="text-gray-500 max-w-md">
              Сверяем с клиническими рекомендациями Минздрава, RUSSCO и ESMO
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  if (!clinicalCase) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Случай не найден</p>
          <Link to={createPageUrl("NewCase")}>
            <Button>Создать новый</Button>
          </Link>
        </div>
      </div>
    );
  }

  const complianceColors = {
    высокое: "bg-emerald-100 text-emerald-700 border-emerald-200",
    среднее: "bg-amber-100 text-amber-700 border-amber-200",
    низкое: "bg-red-100 text-red-700 border-red-200",
  };

  const statusCounts = {
    "рекомендовано": 0,
    "сомнительно": 0,
    "не_рекомендовано": 0,
    "необходимо_дополнить": 0,
  };
  analysisResult?.analysis_items?.forEach(item => {
    if (statusCounts[item.status] !== undefined) statusCounts[item.status]++;
  });
  statusCounts["необходимо_дополнить"] += (analysisResult?.missing_items?.length || 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50/50 to-indigo-50/30">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <Link to={createPageUrl("CasesList")} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              К списку случаев
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Результат анализа</h1>
            <p className="text-gray-500 text-sm mt-1">
              {clinicalCase.diagnosis_text?.slice(0, 80)}...
            </p>
          </div>
          <div className="flex gap-3">
            {clinicalCase.status !== "одобрен" && (
              <Button
                onClick={handleApprove}
                disabled={approving}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Одобрить случай
              </Button>
            )}
            {clinicalCase.status === "одобрен" && (
              <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 text-sm rounded-xl">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Одобрен
              </Badge>
            )}
          </div>
        </div>

        {analysisResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className={`rounded-2xl p-5 border ${complianceColors[analysisResult.overall_compliance] || ""}`}>
                <p className="text-xs font-medium opacity-70 uppercase tracking-wide">Соответствие</p>
                <p className="text-lg font-bold mt-1 capitalize">{analysisResult.overall_compliance}</p>
              </div>
              <StatCard icon={CheckCircle2} color="emerald" count={statusCounts["рекомендовано"]} label="Рекомендовано" />
              <StatCard icon={AlertTriangle} color="amber" count={statusCounts["сомнительно"]} label="Сомнительно" />
              <StatCard icon={XCircle} color="red" count={statusCounts["не_рекомендовано"]} label="Не рекомендовано" />
              <StatCard icon={PlusCircle} color="blue" count={statusCounts["необходимо_дополнить"]} label="Дополнить" />
            </div>

            {/* Summary */}
            {analysisResult.summary && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900">Заключение AI</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">{analysisResult.summary}</p>
              </div>
            )}

            {/* Analysis items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Анализ по пунктам
              </h3>
              <div className="space-y-3">
                {analysisResult.analysis_items?.map((item, i) => (
                  <AnalysisItem key={i} item={item} />
                ))}
              </div>
            </div>

            {/* Missing items */}
            {analysisResult.missing_items?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-500" />
                  Необходимо дополнить
                </h3>
                <div className="space-y-3">
                  {analysisResult.missing_items.map((item, i) => (
                    <AnalysisItem
                      key={`missing-${i}`}
                      item={{
                        ...item,
                        item: item.item,
                        status: "необходимо_дополнить",
                        comment: item.recommendation,
                        source_reference: item.source_reference,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, color, count, label }) {
  return (
    <div className={`bg-${color}-50 rounded-2xl p-5 border border-${color}-200`}>
      <Icon className={`w-5 h-5 text-${color}-600 mb-2`} />
      <p className="text-2xl font-bold text-gray-900">{count}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}