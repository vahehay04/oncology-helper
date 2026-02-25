import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Trash2, CheckCircle2, Clock, BarChart2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { MetricsRadar, ResponseTimeChart } from "@/components/metrics/MetricsChart";

// Calculate classification metrics from completed tests
// Fuzzy match: find AI item by name (exact or substring)
function findAiItem(aiItems, expertItemName) {
  const norm = s => (s || "").toLowerCase().trim().replace(/[\s\-_]+/g, " ");
  const target = norm(expertItemName);
  return aiItems.find(a => {
    const src = norm(a.item);
    return src === target || src.includes(target) || target.includes(src);
  });
}

function calcMetrics(tests) {
  const done = tests.filter(t => t.status === "выполнен");
  if (done.length === 0) return null;

  let tp = 0, fp = 0, fn = 0, total = 0, correct = 0;

  done.forEach(test => {
    const expert = test.expert_items || [];
    const ai = test.ai_items || [];
    expert.forEach(eItem => {
      const aiItem = findAiItem(ai, eItem.item);
      const aiStatus = aiItem?.ai_status || null;
      const expStatus = eItem.expert_status;
      total++;
      if (aiStatus === expStatus) correct++;
      // For binary: "не_рекомендовано" / "необходимо_дополнить" = positive (violation)
      const expPositive = expStatus !== "рекомендовано";
      const aiPositive = aiStatus && aiStatus !== "рекомендовано";
      if (expPositive && aiPositive) tp++;
      if (!expPositive && aiPositive) fp++;
      if (expPositive && !aiPositive) fn++;
    });
  });

  const accuracy = total > 0 ? correct / total : 0;
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1 = (precision + recall) > 0 ? 2 * precision * recall / (precision + recall) : 0;
  const avgTime = done.filter(t => t.response_time_ms).reduce((s, t) => s + t.response_time_ms, 0) / (done.filter(t => t.response_time_ms).length || 1);

  return { accuracy, precision, recall, f1, avgTime, total, correct, done: done.length };
}

export default function Metrics() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedTest, setExpandedTest] = useState(null);
  const [form, setForm] = useState({
    title: "",
    diagnosis_text: "",
    mkb_code: "",
    case_description: "",
    expert_items: [{ item: "", expert_status: "рекомендовано" }]
  });

  useEffect(() => { loadTests(); }, []);

  const loadTests = async () => {
    setLoading(true);
    const data = await base44.entities.TestCase.list("-created_date");
    setTests(data);
    setLoading(false);
  };

  const addExpertItem = () => setForm(f => ({ ...f, expert_items: [...f.expert_items, { item: "", expert_status: "рекомендовано" }] }));
  const removeExpertItem = (i) => setForm(f => ({ ...f, expert_items: f.expert_items.filter((_, idx) => idx !== i) }));
  const updateExpertItem = (i, field, val) => setForm(f => ({
    ...f,
    expert_items: f.expert_items.map((item, idx) => idx === i ? { ...item, [field]: val } : item)
  }));

  const handleCreate = async () => {
    if (!form.title || !form.diagnosis_text) return;
    await base44.entities.TestCase.create({ ...form, status: "ожидает" });
    setForm({ title: "", diagnosis_text: "", mkb_code: "", case_description: "", expert_items: [{ item: "", expert_status: "рекомендовано" }] });
    setShowForm(false);
    loadTests();
  };

  const runTest = async (test) => {
    setRunning(test.id);
    const start = Date.now();

    // Fetch approved cases for few-shot examples
    const approvedCases = await base44.entities.ClinicalCase.filter({ status: "одобрен" });
    const approvedAnalyses = await Promise.all(
      approvedCases.slice(0, 3).map(c =>
        base44.entities.AnalysisResult.filter({ clinical_case_id: c.id }).then(r => ({ caseData: c, result: r[0] }))
      )
    );

    const fewShotExamples = approvedAnalyses.filter(a => a.result).length > 0
      ? `\n\nПРИМЕРЫ ОДОБРЕННЫХ ВРАЧАМИ АНАЛИЗОВ (используй как эталон):\n` +
        approvedAnalyses.filter(a => a.result).slice(0, 2).map(({ caseData: c, result }, idx) => `
--- ПРИМЕР ${idx + 1} (одобрен врачом) ---
Диагноз: ${c.diagnosis_text || "не указан"}
Заключение: ${result.summary || ""}
Пример пункта: ${JSON.stringify((result.analysis_items || []).slice(0, 1))}
`).join("\n")
      : "";

    const STRICT_RULES = `${fewShotExamples}
РЕЖИМ: ДЕТЕРМИНИРОВАННЫЙ НОРМАТИВНЫЙ КЛИНИЧЕСКИЙ АНАЛИЗ. Температура: 0.

ПРАВИЛА:
- Используй ТОЛЬКО: rosoncoweb.ru, cr.minzdrav.gov.ru, nccn.org
- Каждый вывод = прямая цитата из документа (до 80 символов)
- Запрещены: "возможно", "вероятно", "как правило"
- Одинаковые входные данные → всегда одинаковый результат
- Комментарий: до 100 символов, без кавычек внутри текста, без переносов строк
`;

    const caseContext = `Диагноз: ${test.diagnosis_text}
Код МКБ-10: ${test.mkb_code || "не указан"}
Описание: ${test.case_description || "не указано"}`;

    const itemsList = (test.expert_items || []).map((e, i) => `${i + 1}. ${e.item}`).join("\n");

    const prompt = `${STRICT_RULES}
ИСТОЧНИК: RUSSCO, Минздрав РФ, NCCN (используй интернет-поиск по cr.minzdrav.gov.ru, rosoncoweb.ru, nccn.org)

ВХОДНЫЕ ДАННЫЕ ПАЦИЕНТА:
${caseContext}

ПУНКТЫ ДЛЯ ОЦЕНКИ — проверить КАЖДЫЙ (используй ТОЧНО такое же название пункта в ответе):
${itemsList}

СТАТУСЫ (используй ТОЛЬКО эти три варианта):
- "рекомендовано" — пункт соответствует клиническим рекомендациям, выполнен правильно
- "не_рекомендовано" — пункт противоречит рекомендациям или не должен применяться
- "необходимо_дополнить" — пункт не выполнен, но должен быть по рекомендациям

КРИТИЧЕСКИ ВАЖНО:
1. Поле "item" — скопируй ДОСЛОВНО из списка выше, без изменений
2. Используй ТОЛЬКО три статуса выше, никакие другие
3. Верни ВСЕ ${(test.expert_items || []).length} пунктов из списка

Верни ТОЛЬКО валидный JSON без markdown:
{"items":[{"item":"точное название из списка","status":"рекомендовано","comment":"краткий вывод до 80 символов","source":"Минздрав","source_reference":"https://cr.minzdrav.gov.ru/"}]}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: { items: { type: "array", items: { type: "object" } } }
      }
    });

    const elapsed = Date.now() - start;
    
    // Map status to match expert format
    const aiItems = (result?.items || []).map(item => ({
      item: item.item,
      ai_status: item.status || "сомнительно"
    }));

    await base44.entities.TestCase.update(test.id, {
      ai_items: aiItems,
      response_time_ms: elapsed,
      status: "выполнен"
    });
    setRunning(null);
    loadTests();
  };

  const deleteTest = async (id) => {
    await base44.entities.TestCase.delete(id);
    loadTests();
  };

  const metrics = calcMetrics(tests);

  const MetricCard = ({ label, value, description, color }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value !== null ? `${Math.round(value * 100)}%` : "—"}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/50 to-indigo-50/30">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-indigo-500" />
              Метрики качества ИИ
            </h1>
            <p className="text-gray-400 text-sm mt-1">Оценка точности системы на эталонных случаях врача</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
            <Plus className="w-4 h-4 mr-2" />Добавить тест
          </Button>
        </div>

        {/* Metrics summary */}
        {metrics && (
          <div className="mb-8 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Accuracy" value={metrics.accuracy} description="Доля правильных ответов" color="text-indigo-600" />
              <MetricCard label="Precision" value={metrics.precision} description="Точность нарушений" color="text-emerald-600" />
              <MetricCard label="Recall" value={metrics.recall} description="Полнота нарушений" color="text-amber-600" />
              <MetricCard label="F1-Score" value={metrics.f1} description="Баланс точности и полноты" color="text-blue-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Радар метрик</h3>
                <MetricsRadar metrics={metrics} />
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Время ответа ИИ</h3>
                <p className="text-xs text-gray-400 mb-3">Среднее: {Math.round(metrics.avgTime / 1000)} сек.</p>
                <ResponseTimeChart tests={tests} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-6 text-sm text-gray-500 flex-wrap">
                <span>Тестов выполнено: <b className="text-gray-800">{metrics.done}</b></span>
                <span>Всего пунктов: <b className="text-gray-800">{metrics.total}</b></span>
                <span>Совпало с экспертом: <b className="text-emerald-700">{metrics.correct}</b></span>
                <span>Не совпало: <b className="text-red-600">{metrics.total - metrics.correct}</b></span>
              </div>
            </div>
          </div>
        )}

        {/* Add test form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Новый тестовый случай</h3>
            <div className="space-y-3">
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Название теста" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Диагноз (например: Рак лёгкого, стадия III)" value={form.diagnosis_text} onChange={e => setForm(f => ({ ...f, diagnosis_text: e.target.value }))} />
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Код МКБ-10 (например: C34)" value={form.mkb_code} onChange={e => setForm(f => ({ ...f, mkb_code: e.target.value }))} />
              <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm h-24 resize-none" placeholder="Описание: какая диагностика и лечение были выполнены" value={form.case_description} onChange={e => setForm(f => ({ ...f, case_description: e.target.value }))} />

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Эталонные оценки эксперта</p>
                {form.expert_items.map((ei, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Пункт (например: КТ грудной клетки)" value={ei.item} onChange={e => updateExpertItem(i, "item", e.target.value)} />
                    <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white" value={ei.expert_status} onChange={e => updateExpertItem(i, "expert_status", e.target.value)}>
                      <option value="рекомендовано">Рекомендовано</option>
                      <option value="не_рекомендовано">Не рекомендовано</option>
                      <option value="необходимо_дополнить">Необходимо дополнить</option>
                    </select>
                    {form.expert_items.length > 1 && (
                      <button onClick={() => removeExpertItem(i)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                    )}
                  </div>
                ))}
                <button onClick={addExpertItem} className="text-sm text-indigo-500 hover:text-indigo-700 mt-1">+ Добавить пункт</button>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">Создать тест</Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Отмена</Button>
              </div>
            </div>
          </div>
        )}

        {/* Tests list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />Загрузка...
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Нет тестовых случаев. Добавьте первый тест.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map(test => (
              <div key={test.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    {test.status === "выполнен"
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      : <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />}
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{test.title}</p>
                      <p className="text-xs text-gray-400">{test.diagnosis_text}{test.mkb_code ? ` · ${test.mkb_code}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {test.response_time_ms && (
                      <Badge className="bg-gray-50 text-gray-500 border border-gray-100 text-xs">
                        {(test.response_time_ms / 1000).toFixed(1)}с
                      </Badge>
                    )}
                    <Badge className={test.status === "выполнен" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-50 text-gray-500 border-gray-100"}>
                      {test.status}
                    </Badge>
                    <Button size="sm" onClick={() => runTest(test)} disabled={running === test.id} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 h-8 text-xs">
                      {running === test.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                      {running === test.id ? "Запуск..." : "Запустить"}
                    </Button>
                    <button onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)} className="text-gray-400 hover:text-gray-600 p-1">
                      {expandedTest === test.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteTest(test.id)} className="text-red-300 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedTest === test.id && (
                  <div className="border-t border-gray-50 px-5 pb-5 pt-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase">
                          <th className="text-left pb-2 font-medium">Пункт</th>
                          <th className="text-left pb-2 font-medium">Эксперт</th>
                          <th className="text-left pb-2 font-medium">ИИ</th>
                          <th className="text-left pb-2 font-medium">Совпадение</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(test.expert_items || []).map((ei, i) => {
                          const aiItem = findAiItem(test.ai_items || [], ei.item);
                          const match = aiItem && aiItem.ai_status === ei.expert_status;
                          return (
                            <tr key={i} className="border-t border-gray-50">
                              <td className="py-2 text-gray-700">{ei.item}</td>
                              <td className="py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ei.expert_status === "рекомендовано" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                                  {ei.expert_status}
                                </span>
                              </td>
                              <td className="py-2">
                                {aiItem ? (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${aiItem.ai_status === "рекомендовано" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                    {aiItem.ai_status}
                                  </span>
                                ) : <span className="text-gray-300 text-xs">—</span>}
                              </td>
                              <td className="py-2">
                                {aiItem ? (match ? "✅" : "❌") : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}