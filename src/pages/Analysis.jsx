import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, XCircle, PlusCircle, ArrowLeft, ThumbsUp, FileText, FlaskConical, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import AnalysisItem from "@/components/analysis/AnalysisItem";
import { MINZDRAV_GUIDELINES_MAP } from "@/components/lib/sourcePrompt";

// Find the correct guideline URL for a given MKB code
function findGuidelineUrl(mkbCode) {
  if (!mkbCode) return null;
  const prefix = mkbCode.split(".")[0];
  const match = MINZDRAV_GUIDELINES_MAP.find(g =>
    g.mkb.some(m => m === mkbCode || m === prefix)
  );
  return match ? match.url : null;
}

export default function Analysis() {
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get("caseId");

  const [clinicalCase, setClinicalCase] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [activeSection, setActiveSection] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    loadData();
  }, [caseId]);

  const loadData = async () => {
    if (!caseId) return;
    setLoading(true);
    const caseData = await base44.entities.ClinicalCase.list();
    const foundCase = caseData.find(c => c.id === caseId);
    setClinicalCase(foundCase);

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

    const guidelineUrl = findGuidelineUrl(caseData.mkb_code);

    const prompt = `Ты — строго нормативный AI-эксперт по онкологии. Проведи анализ клинического случая по трём источникам: RUSSCO, Минздрав РФ, NCCN.

РАЗРЕШЁННЫЕ ДОМЕНЫ:
1. cr.minzdrav.gov.ru — клинические рекомендации Минздрава РФ
2. rosoncoweb.ru — рекомендации RUSSCO
3. nccn.org — рекомендации NCCN (Guidelines for Patients / Professionals)

ДАННЫЕ КЛИНИЧЕСКОГО СЛУЧАЯ:
Диагноз: ${caseData.diagnosis_text || "не указан"}
Код МКБ-10: ${caseData.mkb_code || "не указан"}${guidelineUrl ? `\nСсылка на документ Минздрава: ${guidelineUrl}` : ""}
Стадия: T${caseData.t_stage || "?"} N${caseData.n_stage || "?"} M${caseData.m_stage || "?"}, стадия ${caseData.tumor_stage || "?"}
ИГХ: ${caseData.immunohistochemistry || "не указана"}
Молекулярные маркеры: ${caseData.molecular_markers || "не указаны"}
${Object.keys(caseData.oncology_specific_fields || {}).length > 0 ? `Специфические параметры:\n${Object.entries(caseData.oncology_specific_fields).map(([k, v]) => `- ${k}: ${v}`).join("\n")}` : ""}

Выполненная диагностика:
${(caseData.diagnostics_performed || []).map(d => `- ${d.name}${d.custom_name ? ` (${d.custom_name})` : ""}: ${d.result}`).join("\n") || "не указана"}

Проведённое лечение:
${(caseData.treatment_performed || []).map(t => `- ${t.type}${t.custom_type ? ` (${t.custom_type})` : ""}: ${t.details} (${t.result || ""})`).join("\n") || "не указано"}

ЗАДАНИЕ:
Для каждого пункта диагностики и лечения проверь соответствие рекомендациям. Раздели анализ по:
- source: "RUSSCO" / "Минздрав" / "NCCN" (один пункт может иметь несколько источников — тогда создай отдельные записи)
- analysis_type: "диагностика" / "лечение"

Для КАЖДОГО пункта:
- item: название пункта
- status: "рекомендовано" / "сомнительно" / "не_рекомендовано" / "необходимо_дополнить"
- evidence_level: уровень доказательности
- comment: комментарий по документу
- source: "RUSSCO" / "Минздрав" / "NCCN"
- analysis_type: "диагностика" / "лечение"
- source_reference: РАБОЧИЙ URL документа (только из cr.minzdrav.gov.ru, rosoncoweb.ru или nccn.org)
- source_text: цитата из документа

ВАЖНО: URL должны быть реальными и рабочими. Для Минздрава используй только ссылки из списка cr.minzdrav.gov.ru/preview-cr/...
Для RUSSCO используй rosoncoweb.ru/standarts/ или конкретные страницы.
Для NCCN используй nccn.org/guidelines/...
НЕ придумывай несуществующие URL.

Также укажи missing_items (чего не хватает по протоколу).
overall_compliance: "высокое" / "среднее" / "низкое"
summary: краткое заключение`;

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
                source: { type: "string" },
                analysis_type: { type: "string" },
                source_reference: { type: "string" },
                source_text: { type: "string" },
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
                source_reference: { type: "string" },
                analysis_type: { type: "string" },
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {analyzing ? "AI анализирует данные..." : "Загрузка..."}
          </h2>
          {analyzing && (
            <p className="text-gray-500 max-w-md">
              Сверяем с рекомендациями RUSSCO, Минздрава РФ и NCCN
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
          <Link to={createPageUrl("NewCase")}><Button>Создать новый</Button></Link>
        </div>
      </div>
    );
  }

  const complianceColors = {
    высокое: "bg-emerald-100 text-emerald-700 border-emerald-200",
    среднее: "bg-amber-100 text-amber-700 border-amber-200",
    низкое: "bg-red-100 text-red-700 border-red-200",
  };

  const statusCounts = { "рекомендовано": 0, "сомнительно": 0, "не_рекомендовано": 0, "необходимо_дополнить": 0 };
  analysisResult?.analysis_items?.forEach(item => {
    if (statusCounts[item.status] !== undefined) statusCounts[item.status]++;
  });
  statusCounts["необходимо_дополнить"] += (analysisResult?.missing_items?.length || 0);

  const allItems = analysisResult?.analysis_items || [];
  const filteredItems = allItems.filter(item => {
    const srcOk = activeSection === "all" || (item.source || "").toLowerCase().includes(activeSection.toLowerCase());
    const catOk = activeCategory === "all" || (item.analysis_type || "").toLowerCase() === activeCategory.toLowerCase();
    return srcOk && catOk;
  });

  const filteredMissing = (analysisResult?.missing_items || []).filter(item => {
    return activeCategory === "all" || (item.analysis_type || "").toLowerCase() === activeCategory.toLowerCase();
  });

  // Case summary fields
  const diagText = clinicalCase.diagnosis_text;
  const mkb = clinicalCase.mkb_code;
  const igh = clinicalCase.immunohistochemistry;
  const mol = clinicalCase.molecular_markers;
  const specific = clinicalCase.oncology_specific_fields || {};
  const diagsDone = clinicalCase.diagnostics_performed || [];
  const treatments = clinicalCase.treatment_performed || [];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50/50 to-indigo-50/30">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <Link to={createPageUrl("CasesList")} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" />К списку случаев
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Результат анализа</h1>
            <p className="text-gray-500 text-sm mt-1 line-clamp-2 max-w-xl">{clinicalCase.diagnosis_text}</p>
          </div>
          <div className="flex gap-3">
            {clinicalCase.status !== "одобрен" && (
              <Button onClick={handleApprove} disabled={approving} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                <ThumbsUp className="w-4 h-4 mr-2" />Одобрить случай
              </Button>
            )}
            {clinicalCase.status === "одобрен" && (
              <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 text-sm rounded-xl">
                <CheckCircle2 className="w-4 h-4 mr-1" />Одобрен
              </Badge>
            )}
          </div>
        </div>

        {/* Case Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Резюме случая</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {diagText && <SummaryRow label="Диагноз" value={diagText} />}
            {mkb && <SummaryRow label="Код МКБ-10" value={`${mkb}${clinicalCase.mkb_description ? " — " + clinicalCase.mkb_description : ""}`} />}
            {(clinicalCase.t_stage || clinicalCase.n_stage || clinicalCase.m_stage) && (
              <SummaryRow label="TNM стадия" value={`T${clinicalCase.t_stage || "?"} N${clinicalCase.n_stage || "?"} M${clinicalCase.m_stage || "?"}${clinicalCase.tumor_stage ? " (ст. " + clinicalCase.tumor_stage + ")" : ""}`} />
            )}
            {igh && <SummaryRow label="ИГХ" value={igh} />}
            {mol && <SummaryRow label="Молекулярные маркеры" value={mol} />}
            {Object.entries(specific).map(([k, v]) => v && <SummaryRow key={k} label={k} value={v} />)}
          </div>
          {diagsDone.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Диагностика</p>
              <div className="space-y-1">
                {diagsDone.map((d, i) => (
                  <div key={i} className="text-sm text-gray-700">
                    <span className="font-medium">{d.name}{d.custom_name ? ` (${d.custom_name})` : ""}</span>
                    {d.date && <span className="text-gray-400 ml-1">({d.date})</span>}
                    {d.result && <span className="text-gray-500 ml-1">— {d.result}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {treatments.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Лечение</p>
              <div className="space-y-1">
                {treatments.map((t, i) => (
                  <div key={i} className="text-sm text-gray-700">
                    <span className="font-medium">{t.type}{t.custom_type ? ` (${t.custom_type})` : ""}</span>
                    {t.details && <span className="text-gray-500 ml-1">— {t.details}</span>}
                    {t.result && <span className="text-gray-400 ml-1">({t.result})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {analysisResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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

            {/* AI Summary */}
            {analysisResult.summary && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900">Заключение AI</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">{analysisResult.summary}</p>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
                <FilterBtn active={activeSection === "all"} onClick={() => setActiveSection("all")}>Все источники</FilterBtn>
                <FilterBtn active={activeSection === "russco"} onClick={() => setActiveSection("RUSSCO")}>RUSSCO</FilterBtn>
                <FilterBtn active={activeSection === "Минздрав"} onClick={() => setActiveSection("Минздрав")}>Минздрав РФ</FilterBtn>
                <FilterBtn active={activeSection === "NCCN"} onClick={() => setActiveSection("NCCN")}>NCCN</FilterBtn>
              </div>
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
                <FilterBtn active={activeCategory === "all"} onClick={() => setActiveCategory("all")} icon={null}>Все</FilterBtn>
                <FilterBtn active={activeCategory === "диагностика"} onClick={() => setActiveCategory("диагностика")}>
                  <FlaskConical className="w-3.5 h-3.5 mr-1" />Диагностика
                </FilterBtn>
                <FilterBtn active={activeCategory === "лечение"} onClick={() => setActiveCategory("лечение")}>
                  <Stethoscope className="w-3.5 h-3.5 mr-1" />Лечение
                </FilterBtn>
              </div>
            </div>

            {/* Analysis items */}
            {filteredItems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  Анализ по пунктам
                  <span className="text-sm font-normal text-gray-400">({filteredItems.length})</span>
                </h3>
                <div className="space-y-3">
                  {filteredItems.map((item, i) => (
                    <AnalysisItem key={i} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Missing items */}
            {filteredMissing.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-500" />
                  Необходимо дополнить
                </h3>
                <div className="space-y-3">
                  {filteredMissing.map((item, i) => (
                    <AnalysisItem
                      key={`missing-${i}`}
                      item={{
                        ...item,
                        status: "необходимо_дополнить",
                        comment: item.recommendation,
                        source_reference: item.source_reference,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredItems.length === 0 && filteredMissing.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                Нет пунктов для выбранных фильтров
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex gap-2 py-1 border-b border-gray-50">
      <span className="text-gray-400 w-36 flex-shrink-0 text-xs pt-0.5">{label}</span>
      <span className="text-gray-800 text-sm leading-relaxed">{value}</span>
    </div>
  );
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        active ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({ icon: Icon, color, count, label }) {
  const colorMap = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-600",
    amber: "bg-amber-50 border-amber-200 text-amber-600",
    red: "bg-red-50 border-red-200 text-red-600",
    blue: "bg-blue-50 border-blue-200 text-blue-600",
  };
  return (
    <div className={`rounded-2xl p-5 border ${colorMap[color]}`}>
      <Icon className="w-5 h-5 mb-2" />
      <p className="text-2xl font-bold text-gray-900">{count}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}