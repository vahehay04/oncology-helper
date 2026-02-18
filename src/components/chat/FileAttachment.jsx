import React from "react";
import { FileText } from "lucide-react";

export default function FileAttachment({ fileName }) {
  return (
    <div className="flex justify-end mb-4">
      <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 shadow-sm max-w-[220px]">
        <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-rose-400" />
        </div>
        <span className="text-sm font-medium text-rose-700 truncate">{fileName}</span>
      </div>
    </div>
  );
}