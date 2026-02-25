import React from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function MetricsRadar({ metrics }) {
  const data = [
    { subject: "Accuracy", value: Math.round(metrics.accuracy * 100) },
    { subject: "Precision", value: Math.round(metrics.precision * 100) },
    { subject: "Recall", value: Math.round(metrics.recall * 100) },
    { subject: "F1-Score", value: Math.round(metrics.f1 * 100) },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13, fill: "#64748b" }} />
        <Radar name="Метрики" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function ResponseTimeChart({ tests }) {
  const data = tests
    .filter(t => t.status === "выполнен" && t.response_time_ms)
    .map((t, i) => ({ name: `Тест ${i + 1}`, ms: t.response_time_ms }));

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="ms" />
        <Tooltip formatter={(v) => [`${v} мс`, "Время ответа"]} />
        <Bar dataKey="ms" fill="#818cf8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}