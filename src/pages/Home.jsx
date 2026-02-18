import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shield, BookOpen, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import RoleModal from "@/components/home/RoleModal";
import SpecialistSearch from "@/components/home/SpecialistSearch";
import OnboardingTour from "@/components/onboarding/OnboardingTour";

export default function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState(() => sessionStorage.getItem("userRole") || null);

  const handleRoleChange = (newRole) => {
    sessionStorage.setItem("userRole", newRole);
    window.dispatchEvent(new Event("roleSelected"));
    setRole(newRole);
    if (newRole === "patient") {
      navigate(createPageUrl("PatientChat"));
    }
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
            <div id="tour-role-switch" className="flex items-center justify-center gap-2 mb-8">
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

          {/* Onboarding tour */}
          {role && <OnboardingTour role={role} />}
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