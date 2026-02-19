import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import SpecialistSearch from "@/components/home/SpecialistSearch";
import PatientChatComponent from "@/components/chat/PatientChat";
import OnboardingTour from "@/components/onboarding/OnboardingTour";

export default function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState(() => sessionStorage.getItem("userRole") || "specialist");
  const [activeMode, setActiveMode] = useState(null); // null | "directory" | "assistant"

  React.useEffect(() => {
    if (role === "patient") {
      navigate(createPageUrl("PatientChat"), { replace: true });
    }
  }, []);

  const handleRoleChange = (newRole) => {
    sessionStorage.setItem("userRole", newRole);
    window.dispatchEvent(new Event("roleSelected"));
    setRole(newRole);
    if (newRole === "patient") {
      navigate(createPageUrl("PatientChat"));
    }
  };

  if (activeMode === "directory") {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-white">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <button
            onClick={() => setActiveMode(null)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Умный справочник</h2>
              <p className="text-sm text-gray-400">Ответы строго по клиническим рекомендациям МЗ РФ</p>
            </div>
          </div>
          <SpecialistSearch />
        </div>
      </div>
    );
  }

  if (activeMode === "assistant") {
    return (
      <div
        className="min-h-[calc(100vh-4rem)] flex flex-col"
        style={{ background: "linear-gradient(135deg, #eef0fb 0%, #f5eef8 50%, #eaf3fb 100%)" }}
      >
        <div className="max-w-2xl mx-auto w-full px-4">
          <button
            onClick={() => setActiveMode(null)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mt-6 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
        </div>
        <PatientChatComponent />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col bg-white">
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto w-full"
        >
          <h1
            className="text-6xl md:text-7xl font-bold text-gray-800 tracking-tight leading-tight mb-4"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Доктор рядом
          </h1>
          <p className="text-base md:text-lg text-gray-400 font-light mb-10 max-w-lg mx-auto">
            AI-консультант, который объяснит медицинские рекомендации понятно и просто.
          </p>

          {/* Role switcher */}
          <div className="flex items-center justify-center gap-2 mb-10">
            <button
              onClick={() => handleRoleChange("specialist")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${role === "specialist" ? "bg-indigo-600 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              Специалист
            </button>
            <button
              onClick={() => handleRoleChange("patient")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${role === "patient" ? "bg-rose-500 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              Пациент
            </button>
          </div>

          {/* Two main cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onClick={() => setActiveMode("directory")}
              className="bg-gray-50 hover:bg-indigo-50 rounded-3xl p-8 border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-base mb-2">Умный справочник</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Быстрый поиск информации из любых тем клинических рекомендаций РФ
              </p>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onClick={() => setActiveMode("assistant")}
              className="bg-gray-50 hover:bg-indigo-50 rounded-3xl p-8 border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-base mb-2">ИИ-ассистент</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Умный анализ клинических рекомендаций, составление истории случаев
              </p>
            </motion.button>
          </div>

          {role && <OnboardingTour role={role} />}
        </motion.div>
      </div>
    </div>
  );
}