"use client";

import { useState } from "react";

var metrics = [
  { label: "Overall rating", value: "4.8 ★", change: "+0.2 this month", accent: "border-t-amber-400", pill: "bg-emerald-50 text-emerald-600" },
  { label: "Total reviews", value: "47", change: "+12 this month", accent: "border-t-blue-500", pill: "bg-emerald-50 text-emerald-600" },
  { label: "AI replies", value: "38", change: "81% reply rate", accent: "border-t-purple-500", pill: "bg-gray-100 text-gray-600" },
  { label: "Response time", value: "8s", change: "AI-powered", accent: "border-t-emerald-500", pill: "bg-emerald-50 text-emerald-600" },
  { label: "Sentiment", value: "92%", change: "Positive", accent: "border-t-pink-500", pill: "bg-emerald-50 text-emerald-600" },
  { label: "Marketing impact", value: "23", change: "posts from reviews", accent: "border-t-amber-500", pill: "bg-blue-50 text-blue-600" },
];

var tabs = [
  { id: "inbox", label: "Inbox", badge: "3 pending", badgeClass: "bg-red-50 text-red-600" },
  { id: "replied", label: "Replied", badge: "38", badgeClass: "bg-gray-100 text-gray-500" },
  { id: "marketing", label: "Marketing", badge: "23 posts", badgeClass: "bg-blue-50 text-blue-600" },
  { id: "campaigns", label: "Campaigns" },
  { id: "competitors", label: "Competitors" },
  { id: "analytics", label: "Analytics" },
];

var sentimentBars = [
  { stars: 5, count: 32, pct: 68, color: "bg-emerald-500" },
  { stars: 4, count: 10, pct: 21, color: "bg-emerald-400" },
  { stars: 3, count: 3, pct: 6, color: "bg-amber-400" },
  { stars: 2, count: 2, pct: 4, color: "bg-red-400" },
  { stars: 1, count: 0, pct: 0, color: "bg-red-500" },
];

var altReplies: Record<string, string[]> = {
  priya: [
    "Thank you so much, Priya! We\u2019re thrilled about your progress with chronic back pain. Dr. Sai Kumar\u2019s evidence-based approach focuses on long-term relief. \u2014 Team Kamakya",
    "Priya, your recovery journey has been inspiring! We\u2019re committed to evidence-based physiotherapy that delivers real results. See you at your next session! \u2014 Team Kamakya",
  ],
  rajesh: [
    "Thank you for your feedback, Rajesh. We\u2019re glad the treatment helped with your knee pain. We apologize for the wait \u2014 we\u2019ve updated scheduling to run on time. \u2014 Team Kamakya",
    "Rajesh, we appreciate the honest feedback! Knee pain relief is our priority. We\u2019ve already adjusted scheduling to minimize wait times. \u2014 Team Kamakya",
  ],
};

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`flex h-4 w-7 items-center rounded-full px-0.5 ${on ? "bg-emerald-500" : "bg-gray-300"}`}>
      <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-all duration-200 ${on ? "ml-auto" : ""}`} />
    </div>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <span className="text-[12px] tracking-wider">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < count ? "text-amber-400" : "text-gray-200"}>★</span>
      ))}
    </span>
  );
}

export default function GoogleReviewsPage() {
  var [activeTab, setActiveTab] = useState("inbox");
  var [replyIdx, setReplyIdx] = useState<Record<string, number>>({ priya: 0, rajesh: 0 });

  function regenerate(key: string) {
    setReplyIdx((prev) => ({ ...prev, [key]: (prev[key] + 1) % 2 }));
  }

  return (
    <div className="px-8 py-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Reviews AI</h1>
          <p className="mt-1 text-sm text-gray-500">Your review-powered marketing engine — every review becomes social proof, content, and patients</p>
        </div>
        <div className="flex gap-2">
          <button className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:text-emerald-600">Request reviews</button>
          <button className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md">Auto-reply all (3)</button>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-5 grid grid-cols-6 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className={`rounded-2xl border border-gray-100 border-t-2 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md ${m.accent}`}>
            <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{m.label}</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{m.value}</div>
            <div className="mt-1"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${m.pill}`}>{m.change}</span></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-0 border-b border-gray-100">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`cursor-pointer pb-2 pr-5 text-sm transition-all duration-200 ${
              activeTab === t.id ? "border-b-2 border-emerald-500 font-medium text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
            {t.badge && (
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${t.badgeClass}`}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab !== "inbox" ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
          <div className="mb-2 text-lg font-medium text-gray-900">{tabs.find((t) => t.id === activeTab)?.label}</div>
          <p className="text-sm text-gray-500">Coming soon — this tab is being built</p>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_280px] gap-5">
          {/* LEFT — Review cards */}
          <div>
            {/* Review 1: Priya */}
            <div className="mb-3 rounded-2xl border border-gray-100 border-l-[3px] border-l-amber-400 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white shadow-sm">PR</div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-gray-900">Priya Reddy</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[11px] text-gray-400">2 hours ago</span>
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[9px] font-medium text-blue-600"><b>G</b> Google</span>
                  </div>
                  <div className="mt-1"><Stars count={5} /></div>
                </div>
                <span className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1 text-[9px] font-medium text-amber-600">Pending reply</span>
              </div>
              <div className="text-[13px] leading-relaxed text-gray-700">Had an amazing experience with Dr. Sai Kumar. My chronic back pain improved after just 3 sessions. Clinic is clean, staff very helpful. Highly recommended!</div>
              <div className="mt-3 rounded-xl border border-emerald-100/50 bg-emerald-50/30 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-emerald-500 px-2.5 py-0.5 text-[9px] font-medium text-white">AI drafted</span>
                  <span className="text-[10px] text-gray-400">Generated in 3s using Brand DNA tone</span>
                </div>
                <div className="text-[12px] italic leading-relaxed text-gray-700">{altReplies.priya[replyIdx.priya]}</div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => alert("Reply posted to Google! Auto-marketing triggered: Website, Instagram, GBP, WhatsApp")} className="cursor-pointer rounded-lg bg-emerald-500 px-3 py-1.5 text-[10px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600">Approve + post</button>
                  <button className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] text-gray-700 transition-all duration-200 hover:border-emerald-500">Edit reply</button>
                  <button onClick={() => regenerate("priya")} className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] text-gray-700 transition-all duration-200 hover:border-emerald-500">Regenerate</button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 text-[10px] text-gray-400">
                <span className="h-[5px] w-[5px] rounded-full bg-emerald-500" />Patient in CRM: Priya Reddy, 3 visits<span className="text-gray-300">|</span>Last visit: April 10 (back pain)<span className="text-gray-300">|</span>Lifetime value: Rs 3,600
              </div>
              <div className="mt-2 flex items-center gap-2 text-[10px]">
                <span className="text-gray-400">Auto-posted to:</span>
                {["Website", "Instagram", "GBP", "WhatsApp"].map((b) => (
                  <span key={b} className="rounded border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] text-emerald-600">✓ {b}</span>
                ))}
              </div>
            </div>

            {/* Review 2: Rajesh */}
            <div className="mb-3 rounded-2xl border border-gray-100 border-l-[3px] border-l-amber-400 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-sm font-medium text-white shadow-sm">RK</div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-gray-900">Rajesh Kumar</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[11px] text-gray-400">5 hours ago</span>
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[9px] font-medium text-blue-600"><b>G</b> Google</span>
                  </div>
                  <div className="mt-1"><Stars count={4} /></div>
                </div>
                <span className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1 text-[9px] font-medium text-amber-600">Pending reply</span>
              </div>
              <div className="text-[13px] leading-relaxed text-gray-700">Good clinic overall. Treatment effective for knee pain. Only concern was waiting time — about 20 minutes past appointment.</div>
              <div className="mt-3 rounded-xl border border-emerald-100/50 bg-emerald-50/30 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-emerald-500 px-2.5 py-0.5 text-[9px] font-medium text-white">AI drafted</span>
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[9px] font-medium text-amber-700">Sensitive: addresses complaint</span>
                  <span className="text-[10px] text-gray-400">Generated in 3s using Brand DNA tone</span>
                </div>
                <div className="text-[12px] italic leading-relaxed text-gray-700">{altReplies.rajesh[replyIdx.rajesh]}</div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => alert("Reply posted to Google! Auto-marketing triggered: Website, GBP")} className="cursor-pointer rounded-lg bg-emerald-500 px-3 py-1.5 text-[10px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600">Approve + post</button>
                  <button className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] text-gray-700 transition-all duration-200 hover:border-emerald-500">Edit reply</button>
                  <button onClick={() => regenerate("rajesh")} className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] text-gray-700 transition-all duration-200 hover:border-emerald-500">Regenerate</button>
                  <button className="cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[10px] text-red-500 transition-all duration-200 hover:bg-red-50">Flag for owner</button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 text-[10px] text-gray-400">
                <span className="h-[5px] w-[5px] rounded-full bg-amber-500" />AI insight: 3 reviews mentioned wait times this month
              </div>
              <div className="mt-2 flex items-center gap-2 text-[10px]">
                <span className="text-gray-400">Auto-posted to:</span>
                {["Website", "GBP"].map((b) => (
                  <span key={b} className="rounded border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] text-emerald-600">✓ {b}</span>
                ))}
              </div>
            </div>

            {/* Review 3: Sunita — Negative */}
            <div className="mb-1 rounded-2xl border border-gray-100 border-l-[3px] border-l-red-400 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-sm font-medium text-white shadow-sm">SM</div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-gray-900">Sunita Menon</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[11px] text-gray-400">1 day ago</span>
                    <span className="rounded bg-pink-50 px-2 py-0.5 text-[9px] font-medium text-pink-600"><b>P</b> Practo</span>
                  </div>
                  <div className="mt-1"><Stars count={2} /></div>
                </div>
                <span className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[9px] font-medium text-red-600">Negative — needs attention</span>
              </div>
              <div className="text-[13px] leading-relaxed text-gray-700">Not a great experience. Felt rushed and doctor didn&apos;t explain treatment plan. Charged more than quoted on phone.</div>
              <div className="mt-3 rounded-xl border border-red-100/50 bg-red-50/30 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-red-500 px-2.5 py-0.5 text-[9px] font-medium text-white">Escalated to owner</span>
                </div>
                <div className="text-[12px] italic leading-relaxed text-gray-700">Pricing discrepancy + rushed care mentioned. AI recommends personal response from owner.</div>
                <div className="mt-3 flex gap-2">
                  <button className="cursor-pointer rounded-lg bg-red-500 px-3 py-1.5 text-[10px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-red-600">Draft owner response</button>
                  <button className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] text-gray-700 transition-all duration-200 hover:border-gray-400">Call via MHAI Caller</button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 text-[10px] text-gray-400">
                <span className="h-[5px] w-[5px] rounded-full bg-red-500" />Not in CRM — likely walk-in<span className="text-gray-300">|</span>Practo (manual reply needed)
              </div>
            </div>
            <div className="mb-3 rounded-lg border border-amber-100 bg-amber-50 p-2 text-[10px] text-amber-800">
              Recovery pipeline: Owner notified → Telecaller calling within 2hr → If resolved, request updated review
            </div>

            {/* Review 4: Arun — Already replied */}
            <div className="mb-3 rounded-2xl border border-gray-100 border-l-[3px] border-l-gray-300 bg-white p-5 opacity-60 shadow-sm">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-sm font-medium text-white shadow-sm">AS</div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-gray-900">Arun Sharma</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[11px] text-gray-400">3 days ago</span>
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-[9px] font-medium text-blue-600"><b>G</b> Google</span>
                  </div>
                  <div className="mt-1"><Stars count={5} /></div>
                </div>
                <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[9px] font-medium text-emerald-600">Replied</span>
              </div>
              <div className="text-[13px] leading-relaxed text-gray-700">Best physiotherapy clinic in Hyderabad. Evidence-based approach.</div>
              <div className="mt-2 text-[10px] italic text-emerald-500">Replied by AI: &ldquo;Thank you, Arun! Your kind words motivate our entire team...&rdquo; — posted 8 seconds after review</div>
              <div className="mt-2 text-[10px] text-gray-400">✓ Website ✓ Instagram ✓ GBP ✓ WhatsApp — all auto-posted</div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Card 1: Auto-marketing rules */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="text-sm font-medium text-gray-900">✦ Auto-marketing rules</div>
              <div className="mb-3 text-[10px] text-gray-400">Every review triggers these automatically</div>
              {[
                "Review → website feed",
                "Review → social post",
                "Review → GBP update",
                "Review → WhatsApp leads",
                "Review → testimonial page",
                "Keywords → SEO pages",
                "Negative → recovery pipeline",
              ].map((r) => (
                <div key={r} className="flex items-center justify-between border-b border-gray-50 py-2">
                  <span className="text-[11px] text-gray-700">{r}</span>
                  <Toggle on />
                </div>
              ))}
              <div className="mt-2 text-[9px] text-gray-400">This month: 23 auto-posts, 4 SEO triggers, 2 recovery pipelines</div>
            </div>

            {/* Card 2: Request campaigns */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">Request campaigns</div>
              {[
                { icon: "W", color: "bg-emerald-500", name: "WhatsApp", when: "2hr after visit", on: true },
                { icon: "S", color: "bg-blue-500", name: "SMS", when: "if no WhatsApp", on: true },
                { icon: "E", color: "bg-gray-500", name: "Email", when: "day after visit", on: true },
                { icon: "Q", color: "bg-amber-500", name: "QR code", when: "at reception", on: false },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-2 border-b border-gray-50 py-2">
                  <div className={`flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold text-white ${c.color}`}>{c.icon}</div>
                  <span className="flex-1 text-[11px] text-gray-700">{c.name}</span>
                  <span className="text-[9px] text-gray-400">{c.when}</span>
                  <Toggle on={c.on} />
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 text-[10px] text-gray-400">28 sent → 12 reviews (43% conversion)</div>
              <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-2 text-[9px] text-blue-700">
                Smart gating ON: Happy patients → Google review. Unhappy → private feedback → recovery.
              </div>
            </div>

            {/* Card 3: Competitor watch */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">Competitor watch</div>
              {[
                { name: "City Physiotherapy", rating: "4.6 ★ · 89 reviews" },
                { name: "PhysioFirst Clinic", rating: "4.3 ★ · 34 reviews" },
                { name: "HealthPlus Rehab", rating: "4.1 ★ · 21 reviews" },
              ].map((c) => (
                <div key={c.name} className="flex items-center justify-between border-b border-gray-50 py-2">
                  <span className="text-[11px] text-gray-700">{c.name}</span>
                  <span className="text-[11px] text-gray-500">{c.rating}</span>
                </div>
              ))}
              <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-[10px] text-emerald-700">
                You&apos;re #1 in rating! Need 42 more reviews to overtake City Physio in review count. At current velocity: ~4 months.
              </div>
            </div>

            {/* Card 4: Sentiment breakdown */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">Sentiment breakdown</div>
              {sentimentBars.map((s) => (
                <div key={s.stars} className="flex items-center gap-2 py-1">
                  <span className="w-4 text-right text-[10px] text-gray-500">{s.stars}★</span>
                  <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                  </div>
                  <span className="w-12 text-right text-[10px] text-gray-400">{s.count} ({s.pct}%)</span>
                </div>
              ))}
            </div>

            {/* Card 5: AI insights */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">AI insights</div>
              {[
                { label: "Top praise", color: "bg-emerald-500", text: "\u2018evidence-based\u2019 8x, \u2018professional\u2019 6x, \u2018clean\u2019 5x" },
                { label: "Watch", color: "bg-amber-500", text: "\u2018wait time\u2019 3x this month — scheduling alert" },
                { label: "Opportunity", color: "bg-blue-500", text: "8 patients with 3+ visits never reviewed — send requests" },
                { label: "Staff", color: "bg-purple-500", text: "Dr. Kumar: 12 positive mentions. Receptionist: 2 negative (wait time)" },
              ].map((i) => (
                <div key={i.label} className="flex gap-2 py-1.5">
                  <span className={`mt-0.5 h-[5px] w-[5px] flex-shrink-0 rounded-full ${i.color}`} />
                  <div>
                    <span className="text-[10px] font-medium text-gray-700">{i.label}: </span>
                    <span className="text-[10px] text-gray-500">{i.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Card 6: Platform monitoring */}
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm font-medium text-gray-900">Platform monitoring</div>
              {[
                { icon: "G", color: "bg-blue-500", name: "Google", rating: "4.8 · 42 reviews", badge: "Connected", badgeClass: "bg-emerald-50 text-emerald-600" },
                { icon: "P", color: "bg-pink-500", name: "Practo", rating: "4.5 · 3 reviews", badge: "Monitoring", badgeClass: "bg-amber-50 text-amber-600" },
                { icon: "f", color: "bg-blue-600", name: "Facebook", rating: "4.9 · 2 reviews", badge: "Connected", badgeClass: "bg-emerald-50 text-emerald-600" },
                { icon: "H", color: "bg-gray-400", name: "Healthgrades", rating: "Not listed", badge: "Set up", badgeClass: "bg-gray-100 text-gray-500" },
              ].map((p) => (
                <div key={p.name} className="flex items-center gap-2 border-b border-gray-50 py-2">
                  <div className={`flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold text-white ${p.color}`}>{p.icon}</div>
                  <span className="flex-1 text-[11px] text-gray-700">{p.name}</span>
                  <span className="text-[10px] text-gray-400">{p.rating}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${p.badgeClass}`}>{p.badge}</span>
                </div>
              ))}
              <div className="mt-2 rounded-lg bg-gray-50 p-2">
                <div className="text-[10px] text-gray-600">This month: 12 reviews (target: 15)</div>
                <div className="mt-1 h-1.5 rounded-full bg-gray-200">
                  <div className="h-full w-[80%] rounded-full bg-emerald-500" />
                </div>
                <div className="mt-1 text-[9px] text-gray-400">Google favors consistent review flow for Maps ranking</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
