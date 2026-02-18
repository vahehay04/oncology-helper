import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Send, Sparkles, Shield, BookOpen, Paperclip, X, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import RoleModal from "@/components/home/RoleModal";
import SpecialistSearch from "@/components/home/SpecialistSearch";

export default function Home() {
  const [role, setRole] = useState(() => sessionStorage.getItem("userRole") || null);

  const handleRoleChange = (newRole) => {
    sessionStorage.setItem("userRole", newRole);
    window.dispatchEvent(new Event("roleSelected"));
    setRole(newRole);
  };
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile(file);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedFileUrl(file_url);
  };

  const removeFile = () => {
    setAttachedFile(null);
    setUploadedFileUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAsk = async () => {
    if (!query.trim() && !attachedFile) return;
    setLoading(true);
    setAnswer("");

    const prompt = uploadedFileUrl
      ? `Ты — AI-консультант по онкологии. Пользователь прикрепил документ. Проанализируй его и ответь на вопрос или сделай краткое резюме ключевых рекомендаций. Отвечай понятно. Напомни, что для точной диагностики нужно обратиться к врачу.\n\n${query ? `Вопрос: ${query}` : "Сделай краткое резюме документа."}`
      : `Ты — AI-консультант по онкологии, который объясняет медицинские рекомендации понятно и просто для пациентов.

ИСТОЧНИКИ:
1. Клинические рекомендации Минздрава РФ — https://cr.minzdrav.gov.ru/preview-cr/921_1
2. Рекомендации RUSSCO 2025 — https://rosoncoweb.ru/standarts/RUSSCO/2025/2025-1-2-12.pdf
3. ESMO Clinical Practice Guideline — https://melnet.org.nz/new-blog/cutaneous-melanoma-esmo-clinical-practice-guideline-for-diagnosis-treatment-and-follow-up

Ответь на вопрос пациента доступно и точно. Не указывай ссылки в ответе. Напомни про врача.

Вопрос: ${query}`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: !uploadedFileUrl,
      ...(uploadedFileUrl && { file_urls: [uploadedFileUrl] }),
    });
    setAnswer(res);
    setLoading(false);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Role selection modal */}
      {!role && <RoleModal onSelect={handleRoleChange} />}

      {/* Gradient background */}
      <div className="absolute inset-0 gradient-bg pointer-events-none" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-pink-100/40 via-orange-50/30 to-indigo-100/40 blur-3xl pointer-events-none" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto w-full"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
            Доктор рядом
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-light mb-4 max-w-lg mx-auto">
            {role === "specialist"
              ? "Проверка соответствия тактики лечения клиническим рекомендациям"
              : "AI-консультант, который объяснит медицинские рекомендации понятно и просто"}
          </p>

          {/* Role switch */}
          {role && (
            <div className="flex items-center justify-center gap-2 mb-8">
              <button
                onClick={() => handleRoleChange("specialist")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${role === "specialist" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >
                Специалист
              </button>
              <button
                onClick={() => handleRoleChange("patient")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${role === "patient" ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >
                Пациент
              </button>
            </div>
          )}

          {/* Specialist mode */}
          {role === "specialist" && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <SpecialistSearch />
            </motion.div>
          )}

          {/* Patient mode */}
          {role === "patient" && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl mx-auto">
              <div className="glass-input rounded-2xl shadow-xl shadow-gray-200/30">
                {attachedFile && (
                  <div className="flex items-center gap-2 px-6 pt-4 pb-2">
                    <div className="flex items-center gap-2 bg-rose-50 text-rose-700 rounded-lg px-3 py-1.5 text-sm">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                      <button onClick={removeFile}><X className="w-3.5 h-3.5 ml-1" /></button>
                    </div>
                  </div>
                )}
                <div className="flex items-center px-6 py-4">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                    placeholder={attachedFile ? "Задайте вопрос по документу..." : "Введите Ваш вопрос..."}
                    className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-base"
                  />
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onChange={handleFileChange} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="ml-3 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors" title="Прикрепить документ">
                    <Paperclip className="w-4 h-4 text-gray-600" />
                  </button>
                  <button onClick={handleAsk} disabled={loading} className="ml-2 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50">
                    {loading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4 text-gray-600" />}
                  </button>
                </div>
              </div>

              {answer && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-left">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-rose-400" />
                      <span className="text-sm font-medium text-rose-500">AI-ответ</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{answer}</p>
                    <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                      Информация носит справочный характер. Для точной диагностики обратитесь к врачу.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mt-16 mb-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto px-6 w-full"
        >
          <FeatureCard icon={<Shield className="w-5 h-5" />} title="Анализ по рекомендациям" description="Проверка соответствия клинических решений рекомендациям Минздрава, RUSSCO и NCCN" />
          <FeatureCard icon={<BookOpen className="w-5 h-5" />} title="База знаний" description="Актуальные клинические рекомендации с уровнями доказательности A-E" />
          <FeatureCard icon={<Sparkles className="w-5 h-5" />} title="Умный поиск" description="Анализ похожих случаев из базы одобренных историй болезни" />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }} className="relative mb-16">
          <Link to={createPageUrl("NewCase")} className="group inline-flex items-center gap-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
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
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}