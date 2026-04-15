"use client";

import { useState, useEffect, useRef } from "react";
import { getChatbotSessions, getChatbotSession, handoffSession } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";

var STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-600" },
  handoff: { label: "Handoff", cls: "bg-amber-50 text-amber-600" },
  closed: { label: "Closed", cls: "bg-gray-100 text-gray-500" },
};

type Session = {
  id: string;
  session_id: string;
  patient_name: string | null;
  patient_phone: string | null;
  status: string;
  message_count: number;
  last_message: string | null;
  last_role: string | null;
  created_at: number;
  updated_at: number;
};

type Message = {
  role: string;
  content: string;
  timestamp: number;
};

function timeAgo(ts: number): string {
  var diff = Date.now() - ts;
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  var hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  return Math.floor(hrs / 24) + "d ago";
}

export default function ReceptionistPage() {
  var notify = useNotification();
  var [sessions, setSessions] = useState<Session[]>([]);
  var [loading, setLoading] = useState(true);
  var [selectedId, setSelectedId] = useState<string | null>(null);
  var [conversation, setConversation] = useState<Message[]>([]);
  var [selectedSession, setSelectedSession] = useState<Session | null>(null);
  var [loadingConvo, setLoadingConvo] = useState(false);
  var [handingOff, setHandingOff] = useState(false);
  var scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getChatbotSessions()
      .then((res) => {
        if (res.success && res.sessions) setSessions(res.sessions);
      })
      .catch(() => {
        notify.error("Failed to load", "Could not fetch chatbot sessions.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function loadSession(session: Session) {
    setSelectedId(session.session_id);
    setSelectedSession(session);
    setLoadingConvo(true);
    try {
      var res = await getChatbotSession(session.session_id);
      if (res.success && res.session && res.session.messages) {
        setConversation(res.session.messages);
        setTimeout(function () {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 100);
      } else {
        setConversation([]);
      }
    } catch {
      notify.error("Error", "Could not load conversation.");
      setConversation([]);
    } finally {
      setLoadingConvo(false);
    }
  }

  async function handleHandoff() {
    if (!selectedId || !selectedSession) return;
    setHandingOff(true);
    try {
      var res = await handoffSession(selectedId);
      if (res.success) {
        notify.success("Handed off", res.message || "Session marked for doctor handoff.");
        setSessions((prev) =>
          prev.map((s) => s.session_id === selectedId ? { ...s, status: "handoff" } : s)
        );
        setSelectedSession({ ...selectedSession, status: "handoff" });
      } else {
        notify.error("Failed", res.error || "Could not hand off session.");
      }
    } catch {
      notify.error("Network error", "Please try again.");
    } finally {
      setHandingOff(false);
    }
  }

  /* Stats */
  var today = new Date().toISOString().slice(0, 10);
  var todayStart = new Date(today).getTime();
  var todaySessions = sessions.filter((s) => s.created_at >= todayStart);
  var activeSessions = sessions.filter((s) => s.status === "active");
  var handoffSessions = sessions.filter((s) => s.status === "handoff");
  var totalMessages = sessions.reduce((sum, s) => sum + s.message_count, 0);
  var avgMessages = sessions.length > 0 ? Math.round(totalMessages / sessions.length) : 0;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col px-8 py-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">MHAI Receptionist</h1>
        <p className="mt-1 text-sm text-gray-500">Clara's conversations with patients — monitor, review, and hand off</p>
      </div>

      {/* Stats bar */}
      <div className="mb-4 flex gap-3">
        {[
          { label: "Today", value: String(todaySessions.length), cls: "text-blue-600" },
          { label: "Active now", value: String(activeSessions.length), cls: "text-emerald-600" },
          { label: "Handoffs", value: String(handoffSessions.length), cls: "text-amber-600" },
          { label: "Avg msgs/session", value: String(avgMessages), cls: "text-gray-700" },
        ].map((s) => (
          <div key={s.label} className="flex-1 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="text-[10px] text-gray-400">{s.label}</div>
            <div className={`text-lg font-semibold ${s.cls}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-sm text-gray-400">Loading sessions...</div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center">
          <div className="mb-2 text-sm font-medium text-gray-700">No conversations yet</div>
          <p className="max-w-sm text-xs text-gray-500">
            When patients chat with Clara on your booking page, their conversations will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* LEFT — Session list */}
          <div className="w-[40%] overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            {sessions.map((session) => {
              var isSelected = selectedId === session.session_id;
              var badge = STATUS_BADGES[session.status] || STATUS_BADGES.active;
              return (
                <div
                  key={session.session_id}
                  onClick={() => loadSession(session)}
                  className={`cursor-pointer border-b border-gray-50 px-4 py-3 transition-colors ${
                    isSelected ? "bg-emerald-50/50" : "hover:bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F6E56]/10 text-[11px] font-medium text-[#0F6E56]">
                        {(session.patient_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-gray-900">
                          {session.patient_name || "Unknown patient"}
                        </div>
                        {session.patient_phone && (
                          <div className="text-[10px] text-gray-400">{session.patient_phone}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] text-gray-400">{timeAgo(session.updated_at)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[8px] font-medium ${badge.cls}`}>{badge.label}</span>
                    </div>
                  </div>
                  {session.last_message && (
                    <div className="mt-1.5 pl-10 text-[11px] text-gray-500 truncate">
                      {session.last_role === "assistant" ? "Clara: " : ""}
                      {session.last_message}
                    </div>
                  )}
                  <div className="mt-1 pl-10 text-[9px] text-gray-400">
                    {session.message_count} message{session.message_count !== 1 ? "s" : ""}
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT — Conversation */}
          <div className="flex w-[60%] flex-col rounded-2xl border border-gray-100 bg-white shadow-sm">
            {!selectedId ? (
              <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
                Select a session to view the conversation
              </div>
            ) : (
              <>
                {/* Conversation header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0F6E56]/10 text-sm font-medium text-[#0F6E56]">
                      {(selectedSession?.patient_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-gray-900">
                        {selectedSession?.patient_name || "Unknown patient"}
                      </div>
                      {selectedSession?.patient_phone && (
                        <div className="text-[10px] text-gray-400">{selectedSession.patient_phone}</div>
                      )}
                    </div>
                    {selectedSession && (
                      <span className={`rounded-full px-2 py-0.5 text-[8px] font-medium ${(STATUS_BADGES[selectedSession.status] || STATUS_BADGES.active).cls}`}>
                        {(STATUS_BADGES[selectedSession.status] || STATUS_BADGES.active).label}
                      </span>
                    )}
                  </div>
                  {selectedSession?.status === "active" && (
                    <button
                      onClick={handleHandoff}
                      disabled={handingOff}
                      className="cursor-pointer rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700 transition-all duration-200 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {handingOff ? "Handing off..." : "Handoff to doctor"}
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {loadingConvo ? (
                    <div className="flex items-center justify-center py-10 text-sm text-gray-400">Loading...</div>
                  ) : conversation.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-sm text-gray-400">No messages</div>
                  ) : (
                    conversation.map(function (msg, i) {
                      var isUser = msg.role === "user";
                      return (
                        <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[75%]">
                            <div
                              className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                                isUser
                                  ? "bg-blue-500 text-white"
                                  : "bg-[#0F6E56]/10 text-gray-800"
                              }`}
                            >
                              {msg.content}
                            </div>
                            <div className={`mt-0.5 text-[9px] text-gray-400 ${isUser ? "text-right" : ""}`}>
                              {isUser ? "Patient" : "Clara"} · {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
