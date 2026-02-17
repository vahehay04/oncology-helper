import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Send, Sparkles, Shield, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";

export default function Home() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setAnswer("");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Ты — AI-консультант по онкологии, который объясняет медицинские рекомендации понятно и просто для пациентов.

ИСТОЧНИКИ (обязательно используй эти клинические рекомендации):
1. Клинические рекомендации Минздрава РФ — https://cr.minzdrav.gov.ru/preview-cr/921_1
2. Рекомендации RUSSCO 2025 — https://rosoncoweb.ru/standarts/RUSSCO/2025/2025-1-2-12.pdf
3. ESMO Clinical Practice Guideline — https://melnet.org.nz/new-blog/cutaneous-melanoma-esmo-clinical-practice-guideline-for-diagnosis-treatment-and-follow-up

Ответь на вопрос пациента, основываясь на этих источниках. Ответ должен быть доступным, но точным. Не указывай ссылки на источники в ответе. Напомни, что для точной диагностики нужно обратиться к врачу.

Вопрос пациента: ${query}`,
      add_context_from_internet: true,
    });
    setAnswer(res);
    setLoading(false);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Gradient background */}
      <div className="absolute inset-0 gradient-bg pointer-events-none" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-pink-100/40 via-orange-50/30 to-indigo-100/40 blur-3xl pointer-events-none" />

      {/* Hero */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
            Доктор рядом
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-light mb-12 max-w-lg mx-auto">
            AI-консультант, который объяснит медицинские рекомендации понятно и просто.
          </p>

          {/* Search input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-2xl mx-auto"
          >
            <div className="glass-input rounded-2xl flex items-center px-6 py-4 shadow-xl shadow-gray-200/30 hover:shadow-gray-200/50 transition-shadow">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder="Введите Ваш вопрос / рекомендацию..."
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-base"
              />
              <button
                onClick={handleAsk}
                disabled={loading}
                className="ml-3 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Answer */}
          {answer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 max-w-2xl mx-auto text-left"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-medium text-indigo-600">AI-ответ</span>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{answer}</p>
                <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                  Информация носит справочный характер. Для точной диагностики обратитесь к врачу.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mt-20 mb-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto px-6 w-full"
        >
          <FeatureCard
            icon={<Shield className="w-5 h-5" />}
            title="Анализ по рекомендациям"
            description="Проверка соответствия клинических решений рекомендациям Минздрава, RUSSCO и ESMO"
          />
          <FeatureCard
            icon={<BookOpen className="w-5 h-5" />}
            title="База знаний"
            description="Актуальные клинические рекомендации с уровнями доказательности A-E"
          />
          <FeatureCard
            icon={<Sparkles className="w-5 h-5" />}
            title="Умный поиск"
            description="Анализ похожих случаев из базы одобренных историй болезни"
          />
        </motion.div>

        {/* CTA for specialists */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative mb-16"
        >
          <Link
            to={createPageUrl("NewCase")}
            className="group inline-flex items-center gap-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Начать анализ клинического случая
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100/80 hover:border-gray-200 transition-all hover:shadow-lg">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}