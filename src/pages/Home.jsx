import React, { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import SpecialistSearch from "@/components/home/SpecialistSearch";
import OnboardingTour from "@/components/onboarding/OnboardingTour";

export default function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState(() => sessionStorage.getItem("userRole") || null);

  React.useEffect(() => {
    if (!role) {
      sessionStorage.setItem("userRole", "specialist");
      window.dispatchEvent(new Event("roleSelected"));
      setRole("specialist");
    }
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

  return (
    <div
      className="relative min-h-[calc(100vh-4rem)] flex flex-col"
      style={{
        background: "linear-gradient(135deg, #e8eaf6 0%, #fce4ec 40%, #e8eaf6 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-pink-200/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-200/30 blur-3xl pointer-events-none" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto w-full"
        >
          <h1 className="text-6xl md:text-7xl font-bold text-gray-800 tracking-tight leading-tight mb-4"
            style={{ fontFamily: "'Georgia', serif", fontWeight: 700 }}
          >
            Доктор рядом
          </h1>
          <p className="text-base md:text-lg text-gray-500 font-light mb-12 max-w-lg mx-auto">
            AI-консультант, который объяснит медицинские рекомендации понятно и просто.
          </p>

          {/* Role switcher */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <button
              onClick={() => handleRoleChange("specialist")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${role === "specialist" ? "bg-indigo-600 text-white shadow-md" : "bg-white/60 text-gray-500 hover:bg-white border border-gray-200"}`}
            >
              Специалист
            </button>
            <button
              onClick={() => handleRoleChange("patient")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${role === "patient" ? "bg-rose-500 text-white shadow-md" : "bg-white/60 text-gray-500 hover:bg-white border border-gray-200"}`}
            >
              Пациент
            </button>
          </div>

          {/* Two main cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link
                to={createPageUrl("Home")}
                className="block bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/60 hover:border-indigo-300 hover:shadow-xl transition-all text-left group"
                onClick={(e) => { e.preventDefault(); /* stays on page, opens search */ }}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">Умный справочник</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Быстрый поиск информации из любых тем клинических рекомендаций РФ
                </p>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link
                to={createPageUrl("NewCase")}
                className="block bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/60 hover:border-indigo-300 hover:shadow-xl transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">ИИ-ассистент</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Умный анализ клинических рекомендаций, составление истории случаев
                </p>
              </Link>
            </motion.div>
          </div>

          {/* Onboarding tour */}
          {role && <OnboardingTour role={role} />}
        </motion.div>
      </div>
    </div>
  );
}