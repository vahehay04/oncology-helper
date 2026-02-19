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

СТИЛЬ ОБЪЯСНЕНИЯ:
- Объясняй так, будто разговариваешь с человеком без медицинского образования.
- Избегай сложных медицинских терминов. Если термин необходим — сразу давай простое объяснение в скобках.
- Тон — спокойный, поддерживающий, без запугивания.
- Не используй академический стиль и длинные сложные предложения.
- Вместо «злокачественное новообразование, метастазирующее…» пиши «это опасная опухоль, которая может распространяться в другие части тела».

СТРОГАЯ СТРУКТУРА ОТВЕТА — всегда оформляй по этому шаблону:

### 1. Что это такое
Короткое и понятное объяснение в 2–4 предложениях.

### 2. Что это значит для человека
Объясни простыми словами, чем это может быть важно.

### 3. Возможные симптомы
- Симптом 1
- Симптом 2
- Симптом 3

### 4. Как это проверяют
- Какой анализ — что он показывает простыми словами

### 5. Как лечат
- Метод лечения — что он делает, объяснение без сухих названий

### 6. Что влияет на прогноз
Объяснить без пугающей статистики. Если приводятся цифры — объяснить их простым языком.

ПРАВИЛА ФОРМАТИРОВАНИЯ:
- Не использовать символы **, лишние звёздочки и хаотичные отступы.
- Использовать чёткие заголовки (###).
- Использовать аккуратные списки с тире.
- Между разделами — пустая строка.
- Никаких сплошных длинных абзацев.
- В конце добавлять: «Если хотите, я могу подробнее объяснить любой пункт.»
- Не писать пугающие фразы.

Не указывай ссылки на источники в ответе.
`;

export default function PatientChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [documentContent, setDocumentContent] = useState(null);
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

    addMessage({ role: "user", type: "file", fileName: file.name });
    setProcessing(true);

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

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `${btn.prompt}\n${SOURCES_PROMPT}${docCtx}`,
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

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Ты — AI-консультант по онкологии для пациентов.\n${SOURCES_PROMPT}\n\nВопрос пациента: ${text}${docCtx}`,
      add_context_from_internet: true,
    });

    setProcessing(false);
    addMessage({ role: "ai", type: "text", content: res });
  };

  const isReading = processing && messages.length === 1 && messages[0]?.type === "file";
  const showHero = messages.length === 0 && !processing;

  return (
    <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 pb-4" style={{ minHeight: "calc(100vh - 80px)" }}>
      <div className="flex-1 overflow-y-auto py-6 flex flex-col">

        <AnimatePresence>
          {showHero && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pt-12 pb-8 text-center"
            >
              <h1 className="text-5xl font-light text-gray-300 mb-3">Доктор рядом</h1>
              <p className="text-gray-400 text-sm">AI-консультант, который объяснит медицинские рекомендации понятно и просто.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isReading && (
            <motion.div
              key="reading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <p className="text-gray-400 text-sm">Помощник читает Ваши рекомендации...</p>
            </motion.div>
          )}
        </AnimatePresence>

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

        {processing && !isReading && <ReadingIndicator />}

        <div ref={bottomRef} />
      </div>

      <div className="pt-2 pb-6">
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