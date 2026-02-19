import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, PlusCircle, ChevronDown, ChevronUp, ExternalLink, ShieldCheck, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG = {
  "рекомендовано": {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    badgeColor: "bg-emerald-100 text-emerald-700",
    label: "Рекомендовано"
  },
  "сомнительно": {
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    badgeColor: "bg-amber-100 text-amber-700",
    label: "Сомнительно"
  },
  "не_рекомендовано": {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    badgeColor: "bg-red-100 text-red-700",
    label: "Не рекомендовано"
  },
  "необходимо_дополнить": {
    icon: PlusCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    badgeColor: "bg-blue-100 text-blue-700",
    label: "Необходимо дополнить"
  }
};

export default function AnalysisItem({ item }) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[item.status] || STATUS_CONFIG["сомнительно"];
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border ${config.borderColor} ${config.bgColor} overflow-hidden transition-all`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-4 p-5 text-left"
      >
        <Icon className={`w-5 h-5 ${config.color} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-gray-900 text-sm">{item.item}</span>
            <Badge className={`${config.badgeColor} text-xs rounded-lg`}>
              {config.label}
            </Badge>
            {item.evidence_level && (
              <Badge variant="outline" className="text-xs rounded-lg">
                Уровень {item.evidence_level}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{item.comment}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {item.confirmed_by_both && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                <BadgeCheck className="w-3 h-3" />
                Минздрав + RUSSCO
              </span>
            )}
            {item.source_domain && !item.confirmed_by_both && (
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                <span className="text-xs text-indigo-500 font-mono">{item.source_domain}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 mt-1">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 ml-9 space-y-3">
              {item.comment && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Комментарий</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.comment}</p>
                </div>
              )}
              {item.source_text && (
                <div className="bg-white/80 rounded-xl p-4 border border-gray-200/50">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Цитата из рекомендаций</p>
                  <p className="text-sm text-gray-700 italic leading-relaxed">«{item.source_text}»</p>
                </div>
              )}
              {(item.source_domain || item.source_document || item.source_reference || item.source_reference_minzdrav || item.source_reference_russco) && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                      {item.confirmed_by_both ? "Подтверждено двумя источниками" : "Верифицированный источник"}
                    </span>
                  </div>
                  {item.source_document && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-indigo-400 w-20 flex-shrink-0">Документ:</span>
                      <span className="text-xs text-indigo-700">{item.source_document}</span>
                    </div>
                  )}
                  {/* Минздрав ссылка */}
                  {item.source_reference_minzdrav && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-indigo-400 w-20 flex-shrink-0">Минздрав:</span>
                      <a
                        href={item.source_reference_minzdrav}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline underline-offset-2 break-all"
                      >
                        {item.source_reference_minzdrav}
                      </a>
                    </div>
                  )}
                  {/* RUSSCO ссылка */}
                  {item.source_reference_russco && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-indigo-400 w-20 flex-shrink-0">RUSSCO:</span>
                      <a
                        href={item.source_reference_russco}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline underline-offset-2 break-all"
                      >
                        {item.source_reference_russco}
                      </a>
                    </div>
                  )}
                  {/* Fallback одиночная ссылка */}
                  {!item.source_reference_minzdrav && !item.source_reference_russco && item.source_reference && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-indigo-400 w-20 flex-shrink-0">URL:</span>
                      <a
                        href={item.source_reference.startsWith("http") ? item.source_reference : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline underline-offset-2 break-all"
                      >
                        {item.source_reference}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}