"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

var suggestedPrompts = [
  "Draft a hand hygiene SOP for our hospital",
  "What does HIC.3 require exactly?",
  "We're a 30-bed nursing home. Which NABH programme should we apply for?",
  "Our CAUTI rate is 2.5/1000 catheter days. How do we improve it?",
  "Generate a medication error incident report template",
  "What documents do we need for the ROM chapter?",
  "How do we prepare for the NABH pre-assessment visit?",
  "Write a patient rights policy for an Indian hospital",
];

type Message = { role: "user" | "assistant"; text: string };

var welcomeMsg: Message = {
  role: "assistant",
  text: "I'm NABH Navigator — your AI compliance assistant. I can help you understand NABH standards, draft SOPs and policies, prepare for assessments, and guide you through the accreditation journey.\n\nWhat would you like help with today?",
};

export default function NabhCoachPage() {
  var [messages, setMessages] = useState<Message[]>([welcomeMsg]);
  var [input, setInput] = useState("");
  var [loading, setLoading] = useState(false);
  var bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    var userMsg: Message = { role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      var res = await fetch("/api/nabh-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history: messages }),
      });
      if (res.ok) {
        var data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", text: data.reply || "I'm not able to respond right now. Please try again." }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", text: "NABH Coach API is being set up. In the meantime, you can refer to nabh.co for official standards, or ask me anything — I'll answer from my NABH knowledge base once the API is connected." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "I couldn't reach the server. Please check your connection and try again." }]);
    }
    setLoading(false);
  }

  return (
    <div className="flex h-[calc(100vh-48px)] flex-col px-8 py-6">
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/dashboard" className="hover:text-coral">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/hms" className="hover:text-coral">HMS</Link>
        <span>/</span>
        <Link href="/dashboard/hms/nabh" className="hover:text-coral">NABH</Link>
        <span>/</span>
        <span className="text-ink">NABH Coach</span>
      </nav>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">NABH Navigator</h1>
          <p className="mt-0.5 text-sm text-text-muted">AI assistant for NABH compliance guidance and SOP drafting</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          AI powered
        </span>
      </div>

      {/* Chat window */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="space-y-4 p-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral/10">
                  <span className="text-[10px] font-medium text-coral">AI</span>
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-coral text-white"
                  : "border border-gray-100 bg-gray-50 text-ink"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral/10">
                <span className="text-[10px] font-medium text-coral">AI</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts — only show when no user messages yet */}
        {messages.length === 1 && (
          <div className="border-t border-gray-100 p-4">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-text-muted">Try asking</div>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-text-muted transition-all hover:border-coral/40 hover:bg-coral/5 hover:text-coral"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Ask about NABH standards, draft an SOP, prepare for an audit..."
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-text-muted transition-all focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20 disabled:opacity-60"
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className="rounded-xl bg-coral px-5 py-3 text-sm font-medium text-white transition-all hover:bg-coral-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </div>
      <div className="mt-2 text-[11px] text-text-muted">
        NABH Navigator provides guidance based on NABH standards. For official accreditation decisions, refer to <a href="https://nabh.co" target="_blank" rel="noopener noreferrer" className="text-coral hover:underline">nabh.co</a>.
      </div>
    </div>
  );
}
