import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Send } from "lucide-react";
import mammoth from "mammoth";
import { base44 } from "@/api/base44Client";
import FileAttachment from "./FileAttachment";
import ReadingIndicator from "./ReadingIndicator";
import ChatMessage from "./ChatMessage";

const ACTION_BUTTONS = [
  { label: "Получить объяснения", prompt: "Объясни простыми словами все рекомендации из документа. Что мне нужно знать и делать?" },
  { label: "Анализ на соответствие", prompt: "Проверь, соответствуют ли рекомендации из документа актуальным клиническим стандартам и руководствам?" },
];

const SOURCES_PROMPT = `
Используй ТОЛЬКО следующие источники:
1. Клинические рекомендации Минздрава РФ — https://cr.minzdrav.gov.ru/preview-cr/921_1
2. Рекомендации RUSSCO 2025 — https://rosoncoweb.ru/standarts/RUSSCO/2025/2025-1-2-12.pdf
3. ESMO Clinical Practice Guideline — https://melnet.org.nz/new-blog/cutaneous-melanoma-esmo-clinical-practice-guideline-for-diagnosis-treatment-and-follow-up

Отвечай понятно и доступно. Не указывай ссылки в ответе. Напомни, что для точной диагностики нужно обратиться к врачу.
`;

export default function PatientChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [documentContent, setDocumentContent] = useState(null);
  const [documentName, setDocumentName] = useState(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, processing]);

  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    setDocumentName(file.name);

    // Show file card as user message
    addMessage({ role: "user", type: "file", fileName: file.name });

    setProcessing(true);

    // Extract text
    let content = "";
    if (file.name.toLowerCase().endsWith(".docx")) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      content = result.value;
    } else if (file.name.toLowerCase().match(/\.(png|jpg|jpeg)$/)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      content = `[image:${file_url}]`;
    } else {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: { type: "object", properties: { text: { type: "string" } } },
      });
      content = extracted?.output?.text || "";
    }

    setDocumentContent(content);

    setProcessing(false);

    addMessage({
      role: "ai",
      type: "text",
      content: "Привет! Я прочитал твои рекомендации! Выбери информацию, которую хочешь получить:",
      actionButtons: ACTION_BUTTONS,
    });
  };

  const handleAction = async (btn) => {
    addMessage({ role: "user", type: "text", content: btn.label });
    setProcessing(true);

    const docCtx = documentContent?.startsWith("[image:")
      ? ""
      : documentContent ? `\n\nСОДЕРЖИМОЕ ДОКУМЕНТА:\n${documentContent}` : "";

    const file_urls = documentContent?.startsWith("[image:")
      ? [documentContent.replace("[image:", "").replace("]", "")]
      : undefined;

    const prompt = `${btn.prompt}\n${SOURCES_PROMPT}${docCtx}`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      ...(file_urls && { file_urls }),
    });

    setProcessing(false);
    addMessage({ role: "ai", type: "text", content: res });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    addMessage({ role: "user", type: "text", content: text });
    setProcessing(true);

    const docCtx = documentContent && !documentContent.startsWith("[image:")
      ? `\n\nКОНТЕКСТ ДОКУМЕНТА:\n${documentContent}`
      : "";

    const prompt = `Ты — AI-консультант по онкологии для пациентов.\n${SOURCES_PROMPT}\n\nВопрос пациента: ${text}${docCtx}`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
    });

    setProcessing(false);
    addMessage({ role: "ai", type: "text", content: res });
  };

  const isEmpty = messages.length === 0 && !processing;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isEmpty && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-300 text-sm select-none">Загрузите документ или задайте вопрос</p>
          </div>
        )}

        {processing && messages.length === 1 && messages[0]?.type === "file" && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm select-none">Помощник читает Ваши рекомендации...</p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => {
            if (msg.type === "file") {
              return <FileAttachment key={i} fileName={msg.fileName} />;
            }
            return (
              <ChatMessage
                key={i}
                role={msg.role}
                content={msg.content}
                actionButtons={msg.actionButtons}
                onAction={handleAction}
              />
            );
          })}
        </AnimatePresence>

        {processing && <ReadingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-6 pb-6 pt-2">
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl px-5 py-3.5 shadow-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Введите Ваши рекомендации"
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder:text-gray-300 text-sm"
          />
          {input.trim() && (
            <button
              onClick={handleSend}
              className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          )}
          <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx,.png,.jpg,.jpeg" onChange={handleFileChange} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}