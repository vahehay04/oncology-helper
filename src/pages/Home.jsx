import React, { useState } from "react";
import { motion } from "framer-motion";
import { Brain, BookOpen, Sparkles, ArrowLeft, Stethoscope, User, ArrowRight, FileText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import SpecialistSearch from "@/components/home/SpecialistSearch";

// ─── Entry screen: choose role ────────────────────────────────────────────────
function RoleSelect({ onSelect }) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-6 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Oncology Helper</h1>
        </div>
        <p className="text-slate-500 text-sm mb-10 ml-13">
          AI-ассистент на основе клинических рекомендаций МЗ РФ
        </p>

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Кто вы?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onSelect("specialist")}
            className="group flex flex-col items-start p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-100 transition-colors">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-800 mb-1">Я врач / специалист</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Анализ случаев, поиск по клин. рекомендациям, AI-проверка тактики
            </p>
            <div className="mt-4 flex items-center gap-1 text-blue-600 text-sm font-medium">
              Войти <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => onSelect("patient")}
            className="group flex flex-col items-start p-6 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-4 group-hover:bg-teal-100 transition-colors">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-800 mb-1">Я пациент</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Понятные объяснения диагноза, лечения и следующих шагов
            </p>
            <div className="mt-4 flex items-center gap-1 text-teal-600 text-sm font-medium">
              Войти <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Specialist dashboard ─────────────────────────────────────────────────────
function SpecialistDashboard({ onMode, activeMode, onBack }) {
  if (activeMode === "directory") {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Назад
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Умный справочник</h2>
              <p className="text-xs text-slate-400">Только клинические рекомендации МЗ РФ / NCCN / ESMO</p>
            </div>
          </div>
          <SpecialistSearch />
        </div>
      </div>
    );
  }

  if (activeMode === "assistant") {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Назад
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">ИИ-ассистент</h2>
              <p className="text-xs text-slate-400">Только клинические рекомендации МЗ РФ / NCCN / ESMO</p>
            </div>
          </div>
          <SpecialistSearch />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl"
      >
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Специалист</p>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Что хотите сделать?</h2>
        <p className="text-sm text-slate-500 mb-8">Выберите инструмент для работы</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => onMode("directory")}
            className="group flex flex-col items-start p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-100 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">Умный справочник</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Поиск по клинрекомендациям: диагностика, лечение, стадирование
            </p>
          </button>

          <button
            onClick={() => onMode("assistant")}
            className="group flex flex-col items-start p-6 bg-white rounded-2xl border border-slate-200 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 mb-4 group-hover:bg-violet-100 transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">ИИ-ассистент</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Загрузите документ или опишите случай — ИИ проанализирует и даст рекомендации
            </p>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Клинические случаи</h3>
          </div>
          <p className="text-sm text-slate-500 mb-3">
            Структурированное ведение случаев с полным AI-анализом соответствия протоколам
          </p>
          <div className="flex gap-2">
            <a href={createPageUrl("CasesList")} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Мои случаи
            </a>
            <a href={createPageUrl("NewCase")} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              + Создать случай
            </a>
          </div>
        </div>

        <button
          onClick={() => {
            sessionStorage.removeItem("userRole");
            window.dispatchEvent(new Event("roleSelected"));
            onMode("__reset__");
          }}
          className="mt-6 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Сменить роль
        </button>
      </motion.div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState(() => sessionStorage.getItem("userRole") || null);
  const [activeMode, setActiveMode] = useState(null);

  const handleRoleSelect = (newRole) => {
    sessionStorage.setItem("userRole", newRole);
    window.dispatchEvent(new Event("roleSelected"));
    setRole(newRole);
    if (newRole === "patient") {
      navigate(createPageUrl("PatientChat"));
    }
  };

  const handleMode = (mode) => {
    if (mode === "__reset__") {
      setRole(null);
      setActiveMode(null);
      return;
    }
    setActiveMode(mode);
  };

  if (!role) {
    return <RoleSelect onSelect={handleRoleSelect} />;
  }

  if (role === "specialist") {
    return (
      <SpecialistDashboard
        onMode={handleMode}
        activeMode={activeMode}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  return null;
}