import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Brain, ArrowLeft } from "lucide-react";
import PatientChatComponent from "@/components/chat/PatientChat";

export default function PatientChatPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between flex-shrink-0">
        <Link to={createPageUrl("Home")} className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-800 tracking-wide">Oncology Helper</span>
        </Link>
        <Link
          to={createPageUrl("Home")}
          onClick={() => {
            sessionStorage.setItem("userRole", "specialist");
            window.dispatchEvent(new Event("roleSelected"));
          }}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Я врач
        </Link>
      </header>

      <PatientChatComponent />
    </div>
  );
}