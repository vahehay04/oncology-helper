import React from "react";
import { motion } from "framer-motion";

export default function ChatMessage({ role, content, actionButtons, onAction }) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[75%] ${isUser ? "" : ""}`}>
        <div
          className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
            isUser
              ? "bg-indigo-50 border border-indigo-100 text-indigo-900"
              : "bg-white border border-gray-100 text-gray-800"
          }`}
        >
          {content}
        </div>

        {actionButtons && (
          <div className="mt-2 flex flex-col gap-2">
            {actionButtons.map((btn, i) => (
              <button
                key={i}
                onClick={() => onAction(btn)}
                className="text-left rounded-2xl px-5 py-3 text-sm bg-indigo-50/80 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-sm"
              >
                {i + 1}. {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}