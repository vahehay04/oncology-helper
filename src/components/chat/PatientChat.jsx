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
## СТРОГИЕ ОГРАНИЧЕНИЯ ИСТОЧНИКОВ

Ты имеешь право использовать информацию ИСКЛЮЧИТЕЛЬНО из следующих четырёх ресурсов:
1. https://rosoncoweb.ru/standarts/minzdrav/
2. https://cr.minzdrav.gov.ru/clin-rec
3. https://www.nccn.org/guidelines/category_1 — при объяснении для пациента ОБЯЗАТЕЛЬНО искать нужный тип рака на английском, переходить на страницу конкретного заболевания и использовать раздел Guidelines for Patients (памятки для пациентов).
4. https://rosoncoweb.ru/standarts/foreign/

ЗАПРЕЩЕНО использовать любые другие сайты, базы данных, статьи, Wikipedia, PubMed, UpToDate, Medscape, EMA, FDA и любые иные ресурсы, не указанные выше.

## СТРОГИЕ ПРАВИЛА ПОВЕДЕНИЯ

- ИИ НЕ добавляет ничего от себя.
- ИИ НЕ интерпретирует данные шире, чем написано в источнике.
- ИИ НЕ делает предположений и НЕ дополняет информацию общими знаниями.
- ИИ НЕ добавляет статистику, если её нет в выбранном источнике.
- Если в указанных источниках нет информации — ИИ ОБЯЗАН ответить: «В указанных регламентированных источниках информация по данному вопросу отсутствует.»

## ЛОГИКА ПОИСКА

1. Определить тип рака из запроса или документа.
2. Проверить наличие клинических рекомендаций на rosoncoweb.ru/standarts/minzdrav/ и cr.minzdrav.gov.ru/clin-rec.
3. Для объяснения пациенту — открыть nccn.org, найти нужный тип рака на английском, использовать ТОЛЬКО раздел Guidelines for Patients.
4. Если информации нет ни в одном источнике — честно сообщить об этом.

## ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ К ОТВЕТУ

- В начале ответа ОБЯЗАТЕЛЬНО указывать источник(и), из которых взята информация.
- Если использовано несколько источников — разделить данные по источникам.
- Не смешивать данные разных источников без явного указания.
- Язык упрощать (без медицинского жаргона), но смысл первоисточника не искажать.

## СТИЛЬ ОБЪЯСНЕНИЯ

- Объясняй так, будто разговариваешь с человеком без медицинского образования.
- Тон — спокойный, поддерживающий, без запугивания.
- Короткие предложения. Никаких длинных абзацев.

## СТРОГАЯ СТРУКТУРА ОТВЕТА

Всегда оформляй ТОЧНО по этому шаблону:

---

# 📚 Источник

Укажи конкретный источник (название документа / раздел сайта).

---

# 📌 Кратко о состоянии

1–3 коротких предложения простым языком — только то, что есть в источнике.

---

# 🧠 Что это значит

| Вопрос | Пояснение простыми словами |
|---|---|
| Что происходит? | Краткое объяснение из источника |
| Насколько это серьёзно? | Только то, что написано в источнике |
| На что обратить внимание? | Только то, что написано в источнике |

---

# ⚠️ Возможные проявления

| Симптом | Как человек это ощущает |
|---|---|
| Симптом 1 | Простое описание из источника |
| Симптом 2 | Простое описание из источника |

---

# 🔎 Как это проверяют

| Метод | Что он показывает |
|---|---|
| Обследование из источника | Объяснение из источника |

---

# 💊 Как лечат

| Метод | Что делает лечение |
|---|---|
| Метод из источника | Объяснение из источника |

---

# 📈 Что влияет на результат

Только факторы, упомянутые в источнике.

---

*Если хотите узнать подробнее — задайте вопрос.*

## ПРАВИЛА ФОРМАТИРОВАНИЯ

- ОБЯЗАТЕЛЬНО использовать таблицы Markdown для разделов "Что это значит", "Возможные проявления", "Как это проверяют", "Как лечат".
- Разделы отделять горизонтальной чертой (---).
- Заголовки начинать с эмодзи.
- Никаких ** и хаотичных звёздочек внутри текста.
- Никаких сплошных длинных абзацев.
- Короткие, чёткие формулировки в каждой ячейке таблицы.
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
      prompt: `Ты — внимательный медицинский консультант для пациентов. Твоя задача — объяснять медицинскую информацию простым, понятным языком, без страшных терминов и запугивания.\n${SOURCES_PROMPT}\n\nВопрос пациента: ${text}${docCtx}`,
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