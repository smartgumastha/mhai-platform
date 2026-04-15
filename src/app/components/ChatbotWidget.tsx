"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatbotMessage } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatbotWidget({
  hospitalId,
  clinicName,
}: {
  hospitalId: string;
  clinicName?: string;
}) {
  var [open, setOpen] = useState(false);
  var [messages, setMessages] = useState<Message[]>([]);
  var [input, setInput] = useState("");
  var [sending, setSending] = useState(false);
  var [sessionId, setSessionId] = useState<string | null>(null);
  var [greeted, setGreeted] = useState(false);
  var scrollRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    setTimeout(function () {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  }

  /* Send initial greeting when opened for the first time */
  useEffect(
    function () {
      if (open && !greeted) {
        setGreeted(true);
        setSending(true);
        sendChatbotMessage(hospitalId, null, "Hi", undefined)
          .then(function (res) {
            if (res.success && res.reply) {
              setMessages([{ role: "assistant", content: res.reply }]);
              if (res.session_id) setSessionId(res.session_id);
            }
          })
          .catch(function () {})
          .finally(function () {
            setSending(false);
            scrollToBottom();
          });
      }
    },
    [open, greeted, hospitalId]
  );

  async function handleSend() {
    var text = input.trim();
    if (!text || sending) return;

    setInput("");
    setMessages(function (prev) { return [...prev, { role: "user", content: text }]; });
    scrollToBottom();
    setSending(true);

    try {
      var res = await sendChatbotMessage(hospitalId, sessionId, text, undefined);
      if (res.success && res.reply) {
        var replyText = res.reply;
        setMessages(function (prev) { return [...prev, { role: "assistant" as const, content: replyText }]; });
        if (res.session_id) setSessionId(res.session_id);
      } else {
        setMessages(function (prev) {
          return [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }];
        });
      }
    } catch {
      setMessages(function (prev) {
        return [...prev, { role: "assistant", content: "Connection error. Please try again." }];
      });
    } finally {
      setSending(false);
      scrollToBottom();
    }
  }

  /* Floating bubble */
  if (!open) {
    return (
      <button
        onClick={function () { setOpen(true); }}
        className="fixed bottom-6 right-6 z-50 flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-full bg-[#0F6E56] shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
        aria-label="Chat with Clara"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  /* Chat window */
  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 bg-[#0F6E56] px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
          C
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">Clara</div>
          <div className="text-[10px] text-white/70">
            Receptionist{clinicName ? " at " + clinicName : ""}
          </div>
        </div>
        <button
          onClick={function () { setOpen(false); }}
          className="cursor-pointer text-white/70 transition-colors hover:text-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map(function (msg, i) {
          var isUser = msg.role === "user";
          return (
            <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  isUser
                    ? "bg-blue-500 text-white"
                    : "bg-[#0F6E56]/10 text-gray-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-[#0F6E56]/10 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#0F6E56]/40" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#0F6E56]/40" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#0F6E56]/40" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-3 py-2.5">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:border-[#0F6E56] focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20"
            placeholder="Type a message..."
            value={input}
            onChange={function (e) { setInput(e.target.value); }}
            onKeyDown={function (e) { if (e.key === "Enter") handleSend(); }}
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-[#0F6E56] text-white shadow-sm transition-all duration-200 hover:bg-[#0a5a46] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4z" />
              <path d="m22 2-11 11" />
            </svg>
          </button>
        </div>
        <div className="mt-1.5 text-center text-[9px] text-gray-400">
          Powered by MediHost AI
        </div>
      </div>
    </div>
  );
}
