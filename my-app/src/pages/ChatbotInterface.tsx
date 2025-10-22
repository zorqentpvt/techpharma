import React, { useEffect, useRef, useState } from "react";

// ChatbotInterface.tsx
// Single-file React + TypeScript component ready for Tailwind projects.
// - Default export is the ChatbotInterface component
// - Supports: message list, user input (Enter to send, Shift+Enter newline), typing indicator,
//   simple bot reply simulation, file attachment preview, and responsive layout.

export type Message = {
  id: string;
  text: string;
  role: "user" | "bot" | "system";
  time: string; // human readable
  attachments?: { id: string; name: string; size: number }[];
};

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

const initialMessages: Message[] = [
  {
    id: uid("m"),
    text: "Welcome! Ask me anything .",
    role: "bot",
    time: formatTime(),
  },
];

export default function ChatbotInterface() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [value, setValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<Message["attachments"] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: uid("u"),
      text: text.trim(),
      role: "user",
      time: formatTime(),
      attachments: attachments || undefined,
    };

    setMessages((m) => [...m, userMsg]);
    setValue("");
    setAttachments(null);

    // simulate bot typing and reply
    setIsTyping(true);
    setTimeout(() => {
      const botReply: Message = {
        id: uid("b"),
        text: generateBotReply(text),
        role: "bot",
        time: formatTime(),
      };
      setMessages((m) => [...m, botReply]);
      setIsTyping(false);
    }, 700 + Math.random() * 1200);
  }

  function generateBotReply(userText: string) {
    // Lightweight simulated reply. Replace with real API call as needed.
    const short = userText.slice(0, 200);
    if (/hello|hi|hey/i.test(userText)) return `Hey! How can I help you today?`;
    if (/explain|what is|define/i.test(userText)) return `Here's a short explanation about: "${short}"\n\n(Replace this with your real bot response or API call.)`;
    if (/code|js|javascript|python/i.test(userText)) return `I see code-related question about "${short}" — I can help with examples, debugging tips, or step-by-step explanations.`;
    return `Thanks — you said: "${short}". This is a simulated reply. Hook this component to your backend to generate real responses.`;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter = send, Shift+Enter = newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(value);
    }
  }

  function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const list = Array.from(files).slice(0, 3).map((f) => ({ id: uid("a"), name: f.name, size: f.size }));
    setAttachments(list);
  }

  function removeAttachment(id?: string) {
    setAttachments(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl h-[100vh] bg-white rounded-2xl shadow-2xl grid grid-rows-[auto_1fr_auto] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b-2 border-b-blue-300 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">PB</div>
          <div className="flex-1">
            <div className="text-xl font-semibold">Pharmabot</div>
            <div className="text-sm text-slate-500">AI assistant </div>
          </div>
          <div className="text-xs text-slate-400">Online</div>
        </div>

        {/* Messages */}
        <div className="p-4 overflow-y-auto" style={{ background: "linear-gradient(180deg, #fbfdff 0%, #ffffff 100%)" }}>
          <div className="flex flex-col gap-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] md:max-w-[64%] text-lg leading-6 p-3 rounded-2xl ${m.role === "user" ? "bg-blue-500 text-white rounded-br-none" : "bg-slate-100 text-slate-900 rounded-bl-none"}`}>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  {m.attachments && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {m.attachments.map((a) => (
                        <div key={a.id} className="px-2 py-1 bg-white/60 border rounded flex items-center gap-2 text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
                          </svg>
                          <div>{a.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 mt-2 text-right">{m.time}</div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-200 p-2 rounded-2xl rounded-bl-none">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full animate-bounce" />
                    <span className="inline-block h-2 w-2 rounded-full animate-bounce delay-75" />
                    <span className="inline-block h-2 w-2 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="px-4 py-3 border-t-2 border-blue-400 bg-white">
          {attachments && (
            <div className="mb-2 flex items-center gap-2">
              {attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded">
                  <div className="text-xs">{a.name}</div>
                  <button onClick={() => removeAttachment(a.id)} className="text-xs text-slate-500 hover:text-slate-800">Remove</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">

            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message.. "
                rows={1}
                className="w-full resize-none rounded-xl border border-blue-600 px-3 py-2 text-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                style={{ maxHeight: 160, overflow: "auto" }}
              />
              <div className="mt-1 text-[12px] text-slate-400">Press Enter to send | Shift+Enter for newline</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => sendMessage(value)}
                disabled={!value.trim()}
                className="px-6 py-2.5 mb-7 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50 "
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
