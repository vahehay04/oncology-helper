import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

const STEPS_SPECIALIST = [
  {
    target: "tour-role-switch",
    title: "Выбор роли",
    text: "Здесь вы можете переключаться между режимом специалиста и пациента.",
    position: "bottom",
  },
  {
    target: "tour-specialist-input",
    title: "Поле запроса",
    text: "Введите данные пациента: диагноз, стадию, молекулярные маркеры и текущую линию терапии. Можно прикрепить документ (.docx, .pdf).",
    position: "top",
  },
  {
    target: "tour-attach-btn",
    title: "Прикрепить документ",
    text: "Прикрепите выписку или протокол лечения — ИИ проанализирует его содержимое.",
    position: "top",
  },
  {
    target: "tour-nav-cases",
    title: "Мои случаи",
    text: "Все сохранённые клинические случаи и результаты анализов доступны здесь.",
    position: "bottom",
  },
  {
    target: "tour-nav-newcase",
    title: "Новый случай",
    text: "Создайте подробную карту клинического случая с диагностикой и лечением для полного AI-анализа.",
    position: "bottom",
  },
];

const STEPS_PATIENT = [
  {
    target: "tour-role-switch",
    title: "Выбор роли",
    text: "Здесь вы можете переключаться между режимом пациента и специалиста.",
    position: "bottom",
  },
  {
    target: "tour-patient-input",
    title: "Задайте вопрос",
    text: "Напишите любой вопрос об онкологическом лечении — ИИ ответит понятным языком.",
    position: "top",
  },
  {
    target: "tour-patient-attach",
    title: "Загрузить документ",
    text: "Прикрепите справку или выписку — ИИ разберёт её и объяснит суть простыми словами.",
    position: "top",
  },
];

function Tooltip({ step, total, onNext, onPrev, onClose, targetRect }) {
  if (!targetRect) return null;

  const gap = 12;
  const tooltipW = 300;
  const tooltipH = 160;

  let top, left;

  if (step.position === "bottom") {
    top = targetRect.bottom + gap + window.scrollY;
    left = targetRect.left + targetRect.width / 2 - tooltipW / 2;
  } else {
    top = targetRect.top - tooltipH - gap + window.scrollY;
    left = targetRect.left + targetRect.width / 2 - tooltipW / 2;
  }

  // Keep within viewport
  left = Math.max(12, Math.min(left, window.innerWidth - tooltipW - 12));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      style={{ top, left, width: tooltipW, position: "absolute", zIndex: 10000 }}
      className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4"
    >
      {/* Arrow */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-gray-100 rotate-45 ${
          step.position === "bottom"
            ? "-top-1.5 border-l border-t"
            : "-bottom-1.5 border-r border-b"
        }`}
      />
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          {step.title}
        </span>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-4">{step.text}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === step._index ? "bg-indigo-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {step._index > 0 && (
            <button
              onClick={onPrev}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gray-600" />
            </button>
          )}
          <button
            onClick={onNext}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
          >
            {step._index === total - 1 ? "Готово" : "Далее"}
            {step._index < total - 1 && <ArrowRight className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function OnboardingTour({ role }) {
  const storageKey = `onboarding_done_${role}`;
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const steps = (role === "specialist" ? STEPS_SPECIALIST : STEPS_PATIENT).map((s, i) => ({
    ...s,
    _index: i,
  }));

  const currentStep = steps[stepIndex];

  useEffect(() => {
    if (!active || !currentStep) return;

    const measure = () => {
      const el = document.getElementById(currentStep.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    measure();
    const timer = setTimeout(measure, 300);
    return () => clearTimeout(timer);
  }, [active, stepIndex, currentStep]);

  const handleClose = () => {
    sessionStorage.setItem(storageKey, "1");
    setActive(false);
  };

  const handleNext = () => {
    if (stepIndex >= steps.length - 1) {
      handleClose();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handlePrev = () => setStepIndex((i) => Math.max(0, i - 1));

  if (!active || !currentStep) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-[9999] pointer-events-none"
        style={{ backdropFilter: "blur(1px)" }}
      />
      {/* Highlight box */}
      {targetRect && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-xl ring-4 ring-indigo-500 ring-offset-2 transition-all duration-300"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}
      {/* Tooltip rendered in a portal-like position */}
      <div className="fixed inset-0 z-[10000] pointer-events-none">
        <div className="relative w-full h-full pointer-events-none">
          <AnimatePresence mode="wait">
            <div className="pointer-events-auto" key={stepIndex}>
              <Tooltip
                step={currentStep}
                total={steps.length}
                onNext={handleNext}
                onPrev={handlePrev}
                onClose={handleClose}
                targetRect={targetRect}
              />
            </div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}