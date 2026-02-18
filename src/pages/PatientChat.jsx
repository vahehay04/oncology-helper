import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Brain } from "lucide-react";
import PatientChatComponent from "@/components/chat/PatientChat";

export default function PatientChatPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(135deg, #eef0fb 0%, #f5eef8 50%, #eaf3fb 100%)",
      }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-5">
        <Link to={createPageUrl("Home")} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200/50">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-widest text-gray-700 uppercase">Oncology Helper</span>
        </Link>
        <Link
          to={createPageUrl("NewCase")}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Для специалистов
        </Link>
      </header>

      {/* Hero text — shown only before document is sent */}
      <PatientChatComponent />
    </div>
  );
}