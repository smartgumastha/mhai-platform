"use client";
import { useState, useEffect } from "react";

const scenarios = [
  {
    label: "HINGLISH",
    msgs: [
      { time: "10:47", name: "Ramesh", text: "root canal kitna charge?", isClara: false },
      { time: "10:47", name: "Clara", text: "Namaste! \u20B94,500 se start, EMI \u20B9750/mo available. Free consult book karein?", isClara: true },
      { time: "10:47", name: "Ramesh", text: "Kal 7 PM possible?", isClara: false },
    ],
  },
  {
    label: "ENGLISH",
    msgs: [
      { time: "14:22", name: "Sarah", text: "Do you offer laser hair removal?", isClara: false },
      { time: "14:22", name: "Clara", text: "Yes! Our 6-session package is $599, EMI available. Book a free consult?", isClara: true },
      { time: "14:22", name: "Sarah", text: "This weekend?", isClara: false },
    ],
  },
  {
    label: "TAMIL",
    msgs: [
      { time: "09:15", name: "Rajesh", text: "echo test ku appointment venum", isClara: false },
      { time: "09:15", name: "Clara", text: "Kaalai 9 manikku avail \u2014 Dr. Kumar saturday ku free. Book pannalaama?", isClara: true },
      { time: "09:15", name: "Rajesh", text: "romba nandri", isClara: false },
    ],
  },
];

export default function LiveDemoVideo() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setScenarioIdx((prev) => (prev + 1) % scenarios.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const scenario = scenarios[scenarioIdx];

  function handlePlay() {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  }

  return (
    <div className="grid gap-0 md:grid-cols-[1.1fr_1fr] overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* LEFT - Video stage */}
      <div
        className="relative flex flex-col items-center justify-center min-h-[300px] p-6 cursor-pointer"
        style={{ background: "linear-gradient(135deg, #0C447C, #26215C)" }}
        onClick={handlePlay}
      >
        {/* LIVE pill */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1">
          <span className="h-2 w-2 rounded-full bg-red-500" style={{ animation: "liveBlink 1.5s infinite" }} />
          <span className="text-[10px] text-white/80 font-medium">LIVE \u00B7 Dr. Sharma Dental, Hyderabad</span>
        </div>

        {/* Timer */}
        <div className="absolute top-4 right-4 flex items-center gap-1 text-white/60 text-xs">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="5"/><path d="M6 3v3l2 1"/></svg>
          0:47
        </div>

        {/* Play button */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(93,202,165,0.3) 0%, transparent 70%)", filter: "blur(20px)", width: 100, height: 100, top: -22, left: -22 }} />
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #5DCAA5, #7F77DD)", animation: "glowRing 2s infinite" }}
            aria-label="Play demo video"
          >
            <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm px-4 py-3">
          <p className="text-[10px] text-white/50 uppercase tracking-wider">Now playing</p>
          <p className="text-xs text-white/80">Clara books a root canal in 47 seconds \u2014 WhatsApp, EMI, reminder all auto</p>
        </div>

        {/* Toast */}
        {showToast && (
          <div className="absolute top-16 left-4 right-4 rounded-lg bg-white/10 backdrop-blur px-4 py-3 text-xs text-white text-center" style={{ animation: "slideIn 0.3s ease" }}>
            Video launching April 21 \u2014 this is a preview of what Clara does live.
          </div>
        )}
      </div>

      {/* RIGHT - Transcript */}
      <div className="bg-[#F8FAFC] p-5">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-3">
          Transcript \u00B7 {scenario.label}
        </p>
        <div className="space-y-2.5 min-h-[200px]">
          {scenario.msgs.map((msg, i) => (
            <div
              key={`${scenarioIdx}-${i}`}
              className="flex gap-2"
              style={{ animation: `slideIn 0.4s ease ${i * 0.3}s both` }}
            >
              <span className="text-[10px] text-gray-300 mt-0.5 shrink-0">{msg.time}</span>
              <div>
                <span className={"text-[10px] font-semibold " + (msg.isClara ? "text-emerald-600" : "text-gray-500")}>{msg.name}</span>
                <p className="text-xs text-gray-700">{msg.text}</p>
              </div>
            </div>
          ))}
          {/* Typing dots */}
          <div className="flex gap-2">
            <span className="text-[10px] text-gray-300 mt-0.5">{scenario.msgs[2]?.time?.replace(/:\d+$/, (m) => ":" + String(parseInt(m.slice(1)) + 1).padStart(2, "0"))}</span>
            <div>
              <span className="text-[10px] font-semibold text-emerald-600">Clara</span>
              <div className="flex gap-1 mt-1">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: `typeDots 1.4s infinite ${d * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Success pills */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-gray-200">
          {["\u2713 Booked", "\u2713 WhatsApp sent", "\u2713 EMI attached", "\u2713 Reminder set"].map((p) => (
            <span key={p} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
