"use client";

import { useState } from "react";

/* ── platform definitions ── */
var platformDefs = [
  { id: "ig", label: "Ig", bg: "bg-gradient-to-br from-[#f09433] to-[#bc1888]" },
  { id: "fb", label: "Fb", bg: "bg-[#1877F2]" },
  { id: "yt", label: "Yt", bg: "bg-[#FF0000]" },
  { id: "in", label: "in", bg: "bg-[#0A66C2]" },
  { id: "gbp", label: "G", bg: "bg-[#4285F4]" },
];

var defaultPlatforms: Record<string, string[]> = {
  p1: ["ig", "fb", "gbp"],
  p2: ["yt", "ig"],
  p3: ["ig", "fb", "in"],
  p4: ["fb", "ig", "gbp"],
};

/* ── tabs ── */
var tabs = [
  { id: "today", label: "Today's feed", badge: "3 ready", badgeClass: "bg-emerald-50 text-emerald-600" },
  { id: "published", label: "Published" },
  { id: "calendar", label: "Calendar" },
  { id: "media", label: "Media studio" },
  { id: "reels", label: "Reel studio" },
  { id: "pr", label: "PR + news" },
];

/* ── calendar data ── */
type CalDay = { d: number; dot?: string; today?: boolean; muted?: boolean };
var calRows: CalDay[][] = [
  [{ d: 0 }, { d: 0 }, { d: 1 }, { d: 2, dot: "#E4405F" }, { d: 3 }, { d: 4, dot: "#1877F2" }, { d: 5 }],
  [{ d: 6 }, { d: 7, dot: "#10b981" }, { d: 8 }, { d: 9, dot: "#E4405F" }, { d: 10 }, { d: 11, dot: "#FF0000" }, { d: 12 }],
  [{ d: 13 }, { d: 14, dot: "#10b981", today: true }, { d: 15 }, { d: 16, dot: "#E4405F" }, { d: 17, dot: "#dc2626" }, { d: 18 }, { d: 19 }],
  [{ d: 20 }, { d: 21, dot: "#1877F2" }, { d: 22 }, { d: 23, dot: "#E4405F" }, { d: 24 }, { d: 25, dot: "#0A66C2" }, { d: 26 }],
  [{ d: 27 }, { d: 28 }, { d: 29 }, { d: 30, dot: "#E4405F" }, { d: 1, muted: true }, { d: 2, muted: true }, { d: 3, muted: true }],
];

function PlatformToggles({ postId, active, onToggle }: { postId: string; active: string[]; onToggle: (pid: string, plat: string) => void }) {
  var count = active.length;
  return (
    <div className="mb-3 flex items-center gap-2">
      {platformDefs.map((p) => {
        var on = active.includes(p.id);
        return (
          <button
            key={p.id}
            onClick={() => onToggle(postId, p.id)}
            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[9px] font-medium transition-all duration-200 ${
              on ? `${p.bg} text-white shadow-sm ring-2 ring-offset-1 ring-gray-300` : "bg-gray-100 text-gray-400"
            }`}
          >
            {p.label}
          </button>
        );
      })}
      <span className="ml-1 text-[9px] text-gray-400">{count === 5 ? "All platforms" : `${count} platforms`}</span>
    </div>
  );
}

export default function SocialPostsPage() {
  var [activeTab, setActiveTab] = useState("today");
  var [platforms, setPlatforms] = useState(defaultPlatforms);

  function togglePlatform(postId: string, plat: string) {
    setPlatforms((prev) => {
      var list = prev[postId] || [];
      return { ...prev, [postId]: list.includes(plat) ? list.filter((x) => x !== plat) : [...list, plat] };
    });
  }

  function getActiveNames(postId: string) {
    return (platforms[postId] || []).map((id) => platformDefs.find((p) => p.id === id)?.label).filter(Boolean).join(", ");
  }

  return (
    <div className="px-8 py-6">
      {/* SECTION 1: Performance pulse */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-6">
          <div><div className="text-[10px] text-gray-400">Yesterday</div><div className="text-sm font-semibold text-gray-900">342 reach</div></div>
          <div className="text-sm font-semibold text-gray-900">18 likes</div>
          <div className="flex items-center gap-1"><span className="text-sm font-semibold text-emerald-600">1 booking</span><span className="text-[11px] text-gray-400">(Rs 600)</span></div>
          <div className="h-6 w-px bg-gray-200" />
          <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700">5-day posting streak</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-600">Top 20% of physio clinics on MHAI</span>
          <span className="text-[11px] text-gray-500">18 posts · 4.2K reach · 7 bookings</span>
        </div>
      </div>

      {/* SECTION 2: Header + action bar */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Social posts AI</h1>
          <p className="mt-1 text-sm text-gray-500">AI creates, you approve. 30 seconds. Done.</p>
        </div>
        <div className="flex gap-2">
          <button className="cursor-pointer rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-2.5 text-xs font-medium text-white shadow-md transition-all duration-200 hover:shadow-lg">Capture moment</button>
          <button className="cursor-pointer rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-medium text-white shadow-md transition-all duration-200 hover:bg-gray-800">Create reel from text</button>
          <button className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-400">WhatsApp import</button>
          <button className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-medium text-white shadow-md transition-all duration-200 hover:bg-emerald-600">+ Create post</button>
        </div>
      </div>

      {/* SECTION 3: Smart suggestions */}
      <div className="mb-4 flex gap-3 overflow-x-auto">
        {[
          { accent: "border-l-blue-500", iconBg: "bg-blue-50", iconColor: "text-blue-500", icon: "▶", text: "Post a doctor intro video — clinics with video get 35% more bookings" },
          { accent: "border-l-red-500", iconBg: "bg-red-50", iconColor: "text-red-500", icon: "📅", text: "World Hypertension Day in 3 days — your post is ready, preview?" },
          { accent: "border-l-emerald-500", iconBg: "bg-emerald-50", iconColor: "text-emerald-500", icon: "↑", text: "Your before/after post got 4x more saves — post more of these!" },
        ].map((s, i) => (
          <div key={i} className={`flex flex-shrink-0 cursor-pointer items-center gap-3 rounded-xl border border-gray-100 border-l-[3px] bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${s.accent}`} style={{ maxWidth: 280 }}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${s.iconBg} ${s.iconColor}`}>{s.icon}</div>
            <div className="flex-1 text-[11px] leading-snug text-gray-700">{s.text}</div>
            <span className="text-gray-300">→</span>
          </div>
        ))}
      </div>

      {/* SECTION 4: Tabs */}
      <div className="mb-4 flex gap-0 border-b border-gray-100">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`cursor-pointer pb-2 pr-5 text-sm transition-all duration-200 ${activeTab === t.id ? "border-b-2 border-emerald-500 font-medium text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
            {t.label}
            {t.badge && <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${t.badgeClass}`}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {activeTab !== "today" ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <div className="mb-2 text-lg font-medium text-gray-900">{tabs.find((t) => t.id === activeTab)?.label}</div>
          <p className="text-sm text-gray-500">Coming soon — this tab is being built</p>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_280px] gap-5">
          {/* LEFT — Post cards */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">Today&apos;s AI picks</span>
              <span className="text-[11px] text-gray-400">3 posts ready for you</span>
              <button onClick={() => alert("All 3 posts scheduled for optimal times today!")} className="ml-auto cursor-pointer rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-600 transition-all duration-200 hover:bg-emerald-100">Approve all</button>
            </div>

            {/* POST 1: Hypertension Day */}
            <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="relative flex h-44 items-center justify-center text-center text-white" style={{ background: "linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)" }}>
                <div>
                  <div className="text-[9px] uppercase tracking-[3px] opacity-70">WORLD HYPERTENSION DAY</div>
                  <div className="mt-1 text-xl font-bold">Know your numbers.</div>
                  <div className="text-xl font-bold">Control your pressure.</div>
                  <div className="mt-3 text-[10px] opacity-60">Free BP check at Kamakya Physio · May 17</div>
                </div>
                <span className="absolute right-3 top-3 rounded bg-white/20 px-2 py-0.5 text-[8px] text-white backdrop-blur">Health day</span>
              </div>
              <div className="p-5">
                <PlatformToggles postId="p1" active={platforms.p1} onToggle={togglePlatform} />
                <div className="mb-2 text-[13px] leading-relaxed text-gray-700">High blood pressure affects 1 in 4 adults — most don&apos;t know it. This World Hypertension Day, get a free BP screening at Kamakya Physiotherapy Clinic. Walk in, no appointment needed.</div>
                <div className="mb-3 text-[11px] text-blue-500">#WorldHypertensionDay #BloodPressure #KamakyaPhysio #Hyderabad #FreeHealthCheck</div>
                <div className="mb-3 rounded-xl bg-gray-50 p-3"><span className="text-[10px] font-medium text-gray-500">AI insight: </span><span className="text-[10px] text-gray-500">Health day posts get 3.2x more engagement. Free screening CTA drives walk-ins. Best time: 10 AM (your audience peaks 9-11 AM).</span></div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button onClick={() => alert(`Posted to ${getActiveNames("p1")}! Booking tracking enabled.`)} className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600">Post now</button>
                    <button className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-700 transition-all duration-200 hover:border-emerald-500">Schedule</button>
                    <button className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-700 transition-all duration-200 hover:border-emerald-500">Edit</button>
                  </div>
                  <div className="flex gap-3">
                    <span className="cursor-pointer text-[10px] text-purple-500 transition-colors hover:text-purple-700">Make reel</span>
                    <span className="cursor-pointer text-[10px] text-blue-500 transition-colors hover:text-blue-700">Translate to Telugu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* POST 2: Doctor intro video */}
            <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="relative flex h-44 flex-col items-center justify-center rounded-t-2xl bg-[#0f0f1a]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 shadow-lg"><span className="text-lg text-white">▶</span></div>
                <div className="mt-3 text-[11px] text-white">Meet Dr. Sai Kumar · Your physio in Hyderabad</div>
                <span className="absolute bottom-3 left-4 text-[9px] text-gray-400">YouTube Shorts + Instagram Reels</span>
                <span className="absolute bottom-3 right-4 rounded bg-black/60 px-2 py-0.5 text-[9px] text-white">0:45</span>
                <span className="absolute right-3 top-3 rounded bg-blue-500/20 px-2 py-0.5 text-[8px] text-blue-300">Video script</span>
              </div>
              <div className="p-5">
                <PlatformToggles postId="p2" active={platforms.p2} onToggle={togglePlatform} />
                <div className="mb-3 rounded-xl bg-gray-50 p-4">
                  <div className="mb-2 text-[11px] font-medium text-gray-900">AI video script (45 sec)</div>
                  {[
                    { ts: "[0-5s]", line: "Hi, I'm Dr. Sai Kumar, physiotherapist at Kamakya Clinic in Banjara Hills." },
                    { ts: "[5-15s]", line: "I help patients recover from sports injuries and chronic pain using evidence-based techniques." },
                    { ts: "[15-30s]", line: "Whether it's a runner's knee or desk worker's back pain — I focus on getting you moving safely." },
                    { ts: "[30-40s]", line: "We create a personalized exercise plan for home — recovery doesn't stop at the clinic." },
                    { ts: "[40-45s]", line: "Book your first session — link in bio. See you at Kamakya!" },
                  ].map((s) => (
                    <div key={s.ts} className="mb-1.5 flex gap-2">
                      <span className="min-w-[40px] text-[10px] font-medium text-gray-900">{s.ts}</span>
                      <span className="text-[11px] leading-relaxed text-gray-600">{s.line}</span>
                    </div>
                  ))}
                </div>
                <div className="mb-3 rounded-xl border border-purple-100 bg-purple-50 p-3"><span className="text-[10px] font-medium text-purple-700">AI insight: </span><span className="text-[10px] text-purple-600">Doctor intro videos increase booking by 35%. Optimal: 30-60 seconds for shorts/reels. Clinics with YouTube get 2.3x more traffic.</span></div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button className="cursor-pointer rounded-xl bg-purple-500 px-4 py-2 text-[11px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-purple-600">Send script to doctor</button>
                    <button className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-700 transition-all duration-200 hover:border-purple-500">Edit script</button>
                  </div>
                  <div className="flex gap-3">
                    <span className="cursor-pointer text-[10px] text-gray-500 transition-colors hover:text-gray-700">Generate thumbnail</span>
                    <span className="cursor-pointer text-[10px] text-blue-500 transition-colors hover:text-blue-700">YouTube SEO tags</span>
                  </div>
                </div>
              </div>
            </div>

            {/* POST 3: Patient education */}
            <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="relative flex h-44 items-center justify-center text-center text-white" style={{ background: "linear-gradient(135deg, #10b981 0%, #064e3b 100%)" }}>
                <div>
                  <div className="text-[9px] uppercase tracking-[3px] opacity-70">PATIENT EDUCATION</div>
                  <div className="mt-1 text-xl font-bold">5 desk stretches</div>
                  <div className="text-xl font-bold">for back pain relief</div>
                  <div className="mt-3 text-[10px] opacity-60">Save this post · Kamakya Physio</div>
                </div>
                <span className="absolute right-3 top-3 rounded bg-white/20 px-2 py-0.5 text-[8px] text-white backdrop-blur">Educational</span>
              </div>
              <div className="p-5">
                <PlatformToggles postId="p3" active={platforms.p3} onToggle={togglePlatform} />
                <div className="mb-2 text-[13px] leading-relaxed text-gray-700">Sitting 8+ hours? Your back is paying the price. Here are 5 stretches you can do at your desk in just 2 minutes. Save this post and try them today.</div>
                <div className="mb-3 text-[11px] text-blue-500">#BackPain #DeskStretches #Physiotherapy #OfficeHealth #KamakyaPhysio #Hyderabad</div>
                <div className="mb-3 rounded-xl bg-gray-50 p-3"><span className="text-[10px] font-medium text-gray-500">AI insight: </span><span className="text-[10px] text-gray-500">Educational &apos;save this&apos; posts get 4.7x more saves. Saves boost Instagram algorithm. Targets IT professionals in Hyderabad — your highest-value segment.</span></div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button onClick={() => alert(`Posted to ${getActiveNames("p3")}! Booking tracking enabled.`)} className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600">Post now</button>
                    <button className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-700 transition-all duration-200 hover:border-emerald-500">Schedule</button>
                    <button className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-700 transition-all duration-200 hover:border-emerald-500">Edit</button>
                  </div>
                  <div className="flex gap-3">
                    <span className="cursor-pointer text-[10px] text-purple-500 transition-colors hover:text-purple-700">Make reel</span>
                    <span className="cursor-pointer text-[10px] text-blue-500 transition-colors hover:text-blue-700">Translate to Telugu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* POST 4: HMS milestone */}
            <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="relative flex h-44 items-center justify-center text-center text-white" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #78350f 100%)" }}>
                <div>
                  <div className="text-5xl font-bold">500</div>
                  <div className="mt-1 text-[11px]">patients treated at Kamakya Physio</div>
                  <div className="mt-2 text-[10px] opacity-70">Thank you for trusting us with your recovery</div>
                </div>
                <span className="absolute right-3 top-3 rounded bg-white/20 px-2 py-0.5 text-[8px] text-white backdrop-blur">From HMS data</span>
              </div>
              <div className="p-5">
                <PlatformToggles postId="p4" active={platforms.p4} onToggle={togglePlatform} />
                <div className="mb-2 text-[13px] leading-relaxed text-gray-700">We just reached a beautiful milestone — 500 patients treated at Kamakya Physiotherapy! Each one trusted us with their recovery. Here&apos;s to 500 more.</div>
                <div className="mb-3 text-[11px] text-blue-500">#500Patients #Milestone #KamakyaPhysio #Hyderabad #Physiotherapy #Grateful</div>
                <div className="mb-3 rounded-xl border border-amber-100 bg-amber-50 p-3"><span className="text-[10px] font-medium text-amber-700">AI insight: </span><span className="text-[10px] text-amber-600">HMS-powered: AI detected your 500th patient registration and auto-generated this. Milestone posts get 6x more shares.</span></div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button onClick={() => alert(`Posted to ${getActiveNames("p4")}! Booking tracking enabled.`)} className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600">Post now</button>
                    <button className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-700 transition-all duration-200 hover:border-emerald-500">Schedule</button>
                    <button className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-700 transition-all duration-200 hover:border-emerald-500">Edit</button>
                  </div>
                  <span className="cursor-pointer text-[10px] text-amber-600 transition-colors hover:text-amber-800">Add patient testimonial video</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Card 1: Content calendar */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">April 2026</div>
              <div className="mb-1 grid grid-cols-7 gap-0">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="py-1 text-center text-[9px] text-gray-400">{d}</div>
                ))}
              </div>
              {calRows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-7 gap-0">
                  {row.map((cell, ci) => (
                    <div key={ci} className="flex flex-col items-center py-1">
                      {cell.d === 0 ? <span className="h-5" /> : (
                        <>
                          <span className={`flex h-5 w-5 items-center justify-center rounded-lg text-[10px] ${cell.today ? "bg-emerald-50 font-medium text-emerald-600" : cell.muted ? "text-gray-300" : "text-gray-700"}`}>{cell.d}</span>
                          {cell.dot && <span className="mx-auto mt-0.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cell.dot }} />}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              <div className="mt-2 flex flex-wrap gap-2 text-[9px] text-gray-400">
                {[
                  { c: "#E4405F", l: "Instagram" }, { c: "#1877F2", l: "Facebook" }, { c: "#FF0000", l: "YouTube" },
                  { c: "#0A66C2", l: "LinkedIn" }, { c: "#10b981", l: "Multi" }, { c: "#dc2626", l: "Health day" },
                ].map((x) => (
                  <span key={x.l} className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: x.c }} />{x.l}</span>
                ))}
              </div>
            </div>

            {/* Card 2: Upcoming health days */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">Upcoming health days</div>
              {[
                { day: "17", bg: "bg-red-50", text: "text-red-600", name: "World Hypertension Day", date: "May 17", badge: "Ready", badgeClass: "bg-emerald-50 text-emerald-600" },
                { day: "31", bg: "bg-amber-50", text: "text-amber-600", name: "World No Tobacco Day", date: "May 31", badge: "Drafting", badgeClass: "bg-amber-50 text-amber-600" },
                { day: "21", bg: "bg-blue-50", text: "text-blue-600", name: "International Yoga Day", date: "Jun 21", badge: "Planned", badgeClass: "bg-gray-100 text-gray-500" },
              ].map((h) => (
                <div key={h.day} className="flex items-center gap-2.5 border-b border-gray-50 py-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold ${h.bg} ${h.text}`}>{h.day}</div>
                  <div className="flex-1"><div className="text-[11px] font-medium text-gray-900">{h.name}</div><div className="text-[9px] text-gray-400">{h.date}</div></div>
                  <span className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${h.badgeClass}`}>{h.badge}</span>
                </div>
              ))}
            </div>

            {/* Card 3: Channel performance */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">Channel performance</div>
              {[
                { icon: "Ig", color: "bg-pink-500", name: "Instagram", stat: "847 reach", book: "4 bookings" },
                { icon: "Fb", color: "bg-blue-500", name: "Facebook", stat: "2.3K reach", book: "2 bookings" },
                { icon: "Yt", color: "bg-red-500", name: "YouTube", stat: "156 views", book: "1 booking" },
                { icon: "in", color: "bg-blue-700", name: "LinkedIn", stat: "320 impressions", book: "0 bookings" },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-2 border-b border-gray-50 py-2">
                  <div className={`flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold text-white ${c.color}`}>{c.icon}</div>
                  <span className="flex-1 text-[11px] text-gray-700">{c.name}</span>
                  <span className="text-[10px] text-gray-400">{c.stat}</span>
                  <span className="text-[10px] font-medium text-emerald-600">{c.book}</span>
                </div>
              ))}
              <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-[10px] text-emerald-700">Instagram drives 57% of bookings. Increase to 4x/week.</div>
            </div>

            {/* Card 4: Auto-post settings */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">Auto-post settings</div>
              {[
                { name: "Health day auto-posts", on: true },
                { name: "Weekly patient tips", on: true },
                { name: "HMS milestones", on: true },
                { name: "Review highlights", on: true },
                { name: "Translate to Telugu", on: false },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between border-b border-gray-50 py-2">
                  <span className="text-[11px] text-gray-700">{s.name}</span>
                  <div className={`flex h-4 w-7 items-center rounded-full px-0.5 ${s.on ? "bg-emerald-500" : "bg-gray-300"}`}>
                    <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-all duration-200 ${s.on ? "ml-auto" : ""}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Card 5: Quick upload */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">Quick upload</div>
              <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 p-4">
                <div className="text-[11px] text-gray-500">Drop video or photos</div>
                <div className="text-[10px] text-gray-400">or WhatsApp forward</div>
              </div>
              <div className="mt-2 flex gap-1.5">
                {["Upload video", "Upload photos", "WhatsApp import"].map((b) => (
                  <button key={b} className="flex-1 cursor-pointer rounded-lg border border-gray-200 py-1.5 text-[9px] text-gray-600 transition-all duration-200 hover:bg-gray-50">{b}</button>
                ))}
              </div>
            </div>

            {/* Card 6: AI content types */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">AI content types</div>
              {[
                { dot: "bg-emerald-500", name: "Health day posts" },
                { dot: "bg-blue-500", name: "Patient education" },
                { dot: "bg-purple-500", name: "Doctor videos" },
                { dot: "bg-amber-500", name: "Milestones (HMS)" },
                { dot: "bg-pink-500", name: "Before/after" },
                { dot: "bg-red-500", name: "Review highlights" },
                { dot: "bg-gray-400", name: "Behind-the-scenes" },
                { dot: "bg-cyan-500", name: "Seasonal offers" },
              ].map((t) => (
                <div key={t.name} className="flex items-center gap-2 py-1">
                  <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                  <span className="text-[11px] text-gray-700">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
