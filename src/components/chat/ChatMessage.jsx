import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function ChatMessage({ role, content, actionButtons, onAction }) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[85%] ${isUser ? "" : "w-full"}`}>
        <div
          className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
            isUser
              ? "bg-indigo-50 border border-indigo-100 text-indigo-900"
              : "bg-white border border-gray-100 text-gray-800"
          }`}
        >
          {isUser ? (
            content
          ) : (
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-base font-semibold text-gray-900 mt-4 mb-2 first:mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-semibold text-gray-800 mt-3 mb-1">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold text-gray-700 mt-3 mb-1">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 text-gray-700 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-2 space-y-1 pl-2">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-gray-700 flex gap-2"><span className="text-gray-400 mt-0.5">–</span><span>{children}</span></li>
                ),
                hr: () => (
                  <hr className="my-3 border-gray-100" />
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3 rounded-xl border border-gray-100">
                    <table className="w-full text-sm border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-50">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">{children}</th>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-gray-50">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-gray-50/50 transition-colors">{children}</tr>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-2.5 text-gray-700 align-top">{children}</td>
                ),
                em: ({ children }) => (
                  <em className="not-italic text-gray-400 text-xs">{children}</em>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">{children}</strong>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          )}
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