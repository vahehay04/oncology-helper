import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, User } from "lucide-react";

export default function RoleModal({ onSelect }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(10, 10, 30, 0.65)", backdropFilter: "blur(8px)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full mx-4 text-center"
        >
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl">🩺</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Добро пожаловать</h2>
          <p className="text-gray-500 text-sm mb-8">Пожалуйста, укажите, кем вы являетесь</p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onSelect("specialist")}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-100 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                <Stethoscope className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="font-semibold text-gray-800 text-sm leading-tight">
                Специалист в области здравоохранения
              </span>
            </button>

            <button
              onClick={() => onSelect("patient")}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-100 hover:border-rose-400 hover:bg-rose-50/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-100 group-hover:bg-rose-200 flex items-center justify-center transition-colors">
                <User className="w-6 h-6 text-rose-500" />
              </div>
              <span className="font-semibold text-gray-800 text-sm leading-tight">
                Пациент / Пациентка
              </span>
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-6">
            Выбор определяет формат предоставляемой информации
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}