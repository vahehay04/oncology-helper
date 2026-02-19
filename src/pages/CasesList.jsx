import React from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Plus, FileText, CheckCircle2, Clock, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import GuidelinePanel from "@/components/cases/GuidelinePanel";

const STATUS_MAP = {
  "черновик": { label: "Черновик", color: "bg-gray-100 text-gray-600", icon: FileText },
  "на_анализе": { label: "На анализе", color: "bg-indigo-100 text-indigo-600", icon: Loader2 },
  "проанализирован": { label: "Проанализирован", color: "bg-amber-100 text-amber-600", icon: Sparkles },
  "одобрен": { label: "Одобрен", color: "bg-emerald-100 text-emerald-600", icon: CheckCircle2 },
};

export default function CasesList() {
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.ClinicalCase.list("-created_date"),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => base44.entities.Patient.list(),
  });

  const getPatient = (id) => patients.find(p => p.id === id);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50/50 to-indigo-50/30">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Клинические случаи</h1>
            <p className="text-gray-500 text-sm mt-1">Все введённые случаи и результаты анализа</p>
          </div>
          <Link to={createPageUrl("NewCase")}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Новый случай
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : cases.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Нет клинических случаев</h3>
            <p className="text-gray-400 mb-6">Создайте первый случай для AI-анализа</p>
            <Link to={createPageUrl("NewCase")}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Создать
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {cases.map((c, i) => {
              const patient = getPatient(c.patient_id);
              const status = STATUS_MAP[c.status] || STATUS_MAP["черновик"];
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={c.status === "черновик" || c.status === "на_анализе"
                      ? createPageUrl("Analysis") + `?caseId=${c.id}`
                      : createPageUrl("Analysis") + `?caseId=${c.id}`
                    }
                    className="block bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={`${status.color} rounded-lg text-xs font-medium flex items-center gap-1`}>
                            <StatusIcon className={`w-3 h-3 ${c.status === "на_анализе" ? "animate-spin" : ""}`} />
                            {status.label}
                          </Badge>
                          {c.mkb_code && (
                            <Badge variant="outline" className="rounded-lg text-xs font-mono">
                              {c.mkb_code}
                            </Badge>
                          )}
                          {c.tumor_stage && (
                            <Badge variant="outline" className="rounded-lg text-xs">
                              Стадия {c.tumor_stage}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                          {c.diagnosis_text || "Без диагноза"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          {patient && (
                            <span>{patient.full_name}, {patient.age} лет, {patient.gender}</span>
                          )}
                          <span>{c.created_date ? format(new Date(c.created_date), "dd.MM.yyyy") : ""}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors mt-2 flex-shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <GuidelinePanel />
    </div>
  );
}