"use client";

import { useState } from "react";

var themeColors = ["#10b981", "#3b82f6", "#8b5cf6", "#0891b2", "#dc2626", "#1e293b"];

var pages = [
  { dot: "bg-emerald-500", name: "Home", label: "Auto", active: true },
  { dot: "bg-emerald-500", name: "About us", label: "Auto" },
  { dot: "bg-emerald-500", name: "Services", label: "Auto" },
  { dot: "bg-emerald-500", name: "Back pain treatment", label: "SEO" },
  { dot: "bg-emerald-500", name: "Knee rehab", label: "SEO" },
  { dot: "bg-emerald-500", name: "Sports injury", label: "SEO" },
  { dot: "bg-emerald-500", name: "Dr. Sai Kumar", label: "Auto" },
  { dot: "bg-blue-500", name: "Book appointment", label: "Live" },
  { dot: "bg-blue-500", name: "Pay online", label: "Live" },
  { dot: "bg-blue-500", name: "Telehealth", label: "Live" },
  { dot: "bg-amber-500", name: "Blog", label: "4 posts" },
  { dot: "bg-amber-500", name: "Reviews", label: "12" },
  { dot: "bg-amber-500", name: "Before / after", label: "Gallery" },
  { dot: "bg-amber-500", name: "Patient stories", label: "Videos" },
  { dot: "bg-purple-500", name: "Insurance accepted", label: "—" },
  { dot: "bg-purple-500", name: "FAQ", label: "AEO" },
  { dot: "bg-gray-500", name: "Contact", label: "Auto" },
];

var widgets = [
  { name: "MHAI Receptionist", desc: "AI chatbot. Books, answers, collects payments — 24/7" },
  { name: "MHAI Pay widget", desc: "Pay online on every page. UPI, card, wallet" },
  { name: "Live booking calendar", desc: "Real-time HMS slots. Deposit collection" },
  { name: "Reviews feed", desc: "Live from Google. AI replies visible" },
  { name: "Auto-blog", desc: "1 AI post/week. SEO-optimized" },
  { name: "Insurance checker", desc: "Patient checks coverage instantly" },
  { name: "Floating CTA bar", desc: "Book / Call / WhatsApp / Pay — always visible" },
  { name: "Enquiry forms", desc: "Context-aware forms on every page → CRM" },
];

var summaryCards = [
  { num: "17", label: "pages auto-generated", desc: "Home, services, 3 treatment SEO pages, doctor profile, booking, pay online, telehealth, blog, reviews, gallery, testimonials, case studies, press, insurance, FAQ, contact" },
  { num: "8", label: "living widgets", desc: "Chatbot, pay button, booking calendar, reviews feed, auto-blog, insurance checker, floating CTA, enquiry forms" },
  { num: "47s", label: "build time", desc: "ClinicSpots takes 4-6 weeks. MHAI generates everything in 47 seconds from your Brand DNA." },
  { num: "₹0", label: "developer cost", desc: "No designer. No content writer. No SEO specialist. Pure AI. Doctor fills Brand DNA once — AI does everything forever." },
];

export default function AiWebsitePage() {
  var [themeColor, setThemeColor] = useState("#10b981");

  return (
    <div className="flex h-full flex-col">
      {/* TOP BAR */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center">
          <span className="text-lg font-medium tracking-tight text-gray-900">AI website</span>
          <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>
          <span className="ml-2 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] text-emerald-700">
            ✦ Built in 47 seconds from Brand DNA
          </span>
        </div>
        <div className="flex gap-2">
          <button className="cursor-pointer rounded-md border border-gray-200 px-3 py-1.5 text-[11px] text-gray-600 transition-all duration-200 hover:bg-gray-50">Desktop</button>
          <button className="cursor-pointer rounded-md border border-gray-200 px-3 py-1.5 text-[11px] text-gray-600 transition-all duration-200 hover:bg-gray-50">Mobile</button>
          <button className="cursor-pointer rounded-md bg-emerald-500 px-4 py-1.5 text-[11px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md">Publish changes</button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid min-h-0 flex-1 grid-cols-[240px_1fr]">
        {/* LEFT PANEL */}
        <div className="overflow-y-auto border-r border-gray-100 bg-white p-4">
          {/* Domain */}
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-gray-500">Domain</div>
          <div className="rounded-lg border border-emerald-400 bg-emerald-50/50 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-600">kamakya.medihost.in</span>
              <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[8px] font-medium text-white">Active</span>
            </div>
          </div>
          <div className="mt-2 flex gap-1.5">
            <input className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-[11px] transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="yourdomain" />
            <button className="cursor-pointer rounded-md bg-gray-900 px-3 py-1.5 text-[10px] font-medium text-white transition-all duration-200 hover:bg-gray-800">Buy</button>
          </div>
          <div className="mt-1 text-[9px] text-gray-400">.com from $9/yr</div>

          {/* Theme */}
          <div className="mb-2 mt-5 text-[11px] font-medium uppercase tracking-wider text-gray-500">Theme</div>
          <div className="grid grid-cols-6 gap-2">
            {themeColors.map((c) => (
              <button
                key={c}
                onClick={() => setThemeColor(c)}
                className={`aspect-square w-full cursor-pointer rounded-lg shadow-sm transition-transform duration-200 hover:scale-110 ${
                  themeColor === c ? "ring-2 ring-gray-900 ring-offset-2" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Pages */}
          <div className="mb-1 mt-5 text-[11px] font-medium uppercase tracking-wider text-gray-500">Pages</div>
          <div className="space-y-0.5">
            {pages.map((p) => (
              <div
                key={p.name}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] transition-all duration-150 ${
                  p.active ? "bg-emerald-50 font-medium text-emerald-600" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
                <span className="flex-1 truncate">{p.name}</span>
                <span className="text-[9px] text-gray-400">{p.label}</span>
              </div>
            ))}
            <button className="mt-1 w-full cursor-pointer rounded-lg border border-dashed border-gray-300 py-1.5 text-[11px] text-gray-400 transition-all duration-200 hover:border-gray-400 hover:text-gray-500">
              + Add page
            </button>
          </div>

          {/* Living widgets */}
          <div className="mb-1 mt-5 flex items-center text-[11px] font-medium uppercase tracking-wider text-gray-500">
            Living widgets
            <span className="ml-1 rounded bg-red-500 px-1.5 text-[8px] font-medium text-white">NEW</span>
          </div>
          {widgets.map((w) => (
            <div key={w.name} className="mb-2 rounded-xl border border-gray-100 p-3 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-medium text-gray-900">{w.name}</span>
                </div>
                <div className="flex h-4 w-7 items-center rounded-full bg-emerald-500 px-0.5">
                  <div className="ml-auto h-3 w-3 rounded-full bg-white shadow-sm" />
                </div>
              </div>
              <div className="mt-1 text-[9px] text-gray-500">{w.desc}</div>
            </div>
          ))}

          {/* SEO health */}
          <div className="mb-2 mt-5 text-[11px] font-medium uppercase tracking-wider text-gray-500">SEO health</div>
          <div className="flex flex-wrap gap-1.5">
            {["Meta OK", "Schema OK", "Speed 94", "AEO OK", "Mobile OK"].map((s) => (
              <span key={s} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-600">{s}</span>
            ))}
          </div>

          {/* AI actions */}
          <div className="mb-2 mt-5 text-[11px] font-medium uppercase tracking-wider text-gray-500">AI actions</div>
          <div className="space-y-2">
            {["Regenerate entire site", "Add 4 AI blog posts", "Optimize for AEO"].map((a) => (
              <button key={a} className="w-full cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-[11px] font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md">
                ✦ {a}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL — Browser preview */}
        <div className="overflow-y-auto bg-gradient-to-br from-gray-100 to-gray-200 p-6">
          <div className="mx-auto w-full max-w-[520px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] text-gray-500 shadow-inner">
                kamakya.medihost.in
              </div>
            </div>

            {/* WEBSITE CONTENT */}
            <div>
              {/* Nav */}
              <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md text-[7px] font-bold text-white" style={{ backgroundColor: themeColor }}>KP</div>
                  <span className="text-[12px] font-semibold text-gray-900">Kamakya Physio</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-gray-400">Services</span>
                  <span className="text-[9px] text-gray-400">Doctor</span>
                  <span className="text-[9px] text-gray-400">Reviews</span>
                  <span className="rounded-full px-3 py-1 text-[9px] font-medium text-white shadow-sm" style={{ backgroundColor: themeColor }}>Book now</span>
                  <span className="rounded-full border border-gray-200 px-2 py-1 text-[9px] text-gray-600">Pay</span>
                </div>
              </div>

              {/* Hero */}
              <div className="px-6 py-10 text-center" style={{ background: `linear-gradient(180deg, ${themeColor}06 0%, ${themeColor}12 100%)` }}>
                <div className="text-[8px] font-medium uppercase tracking-[3px]" style={{ color: themeColor }}>Evidence-based physiotherapy</div>
                <div className="mt-2 text-[22px] font-bold leading-tight text-gray-900">
                  Move better.<br />Live better.
                </div>
                <div className="mx-auto mt-3 max-w-[300px] text-[9px] leading-relaxed text-gray-500">
                  Advanced physiotherapy by Dr. Sai Kumar. Book online, pay securely, and start your recovery journey today.
                </div>
                <div className="mt-5 flex justify-center gap-3">
                  <button className="rounded-full px-5 py-2 text-[10px] font-medium text-white shadow-md" style={{ backgroundColor: themeColor }}>Book appointment</button>
                  <button className="rounded-full border-2 border-gray-200 px-5 py-2 text-[10px] font-medium text-gray-700">Pay online</button>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-[8px] text-gray-400">
                  <span>★ 4.8 (12 reviews)</span>
                  <span>·</span>
                  <span>NABH</span>
                  <span>·</span>
                  <span>8+ years</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span className="h-1 w-1 animate-pulse rounded-full" style={{ backgroundColor: themeColor }} />
                    3 slots today
                  </span>
                </div>
              </div>

              {/* MHAI Receptionist bar */}
              <div className="flex items-center gap-3 px-4 py-2.5" style={{ backgroundColor: `${themeColor}08`, borderTop: `1px solid ${themeColor}20`, borderBottom: `1px solid ${themeColor}20` }}>
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-[8px] font-bold text-white shadow-sm" style={{ backgroundColor: themeColor }}>AI</div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-semibold text-gray-900">MHAI Receptionist</span>
                    <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-[8px] text-gray-500">Online — ask anything or book</div>
                </div>
                <button className="rounded-full px-3 py-1 text-[8px] font-medium text-white" style={{ backgroundColor: themeColor }}>Chat</button>
              </div>

              {/* Services */}
              <div className="px-4 pb-1 pt-4">
                <div className="text-[11px] font-semibold text-gray-900">Our services</div>
              </div>
              <div className="grid grid-cols-3 gap-2.5 px-4 pb-4">
                {[
                  { icon: "⚕", name: "Sports rehab", sub: "Recovery + performance", price: "₹600" },
                  { icon: "◈", name: "Back pain", sub: "Chronic + acute care", price: "₹500" },
                  { icon: "◇", name: "Knee rehab", sub: "Post-surgery + injury", price: "₹500" },
                ].map((s) => (
                  <div key={s.name} className="group cursor-pointer rounded-xl bg-gray-50 p-3 text-center transition-all duration-200 hover:shadow-sm">
                    <div className="mb-1 text-lg">{s.icon}</div>
                    <div className="text-[9px] font-semibold text-gray-900">{s.name}</div>
                    <div className="mt-0.5 text-[8px] text-gray-500">{s.sub}</div>
                    <div className="mt-1.5 text-[8px] font-medium" style={{ color: themeColor }}>Book · {s.price}</div>
                  </div>
                ))}
              </div>

              {/* Live booking */}
              <div className="mx-4 my-3 overflow-hidden rounded-xl shadow-sm">
                <div className="px-4 py-2.5" style={{ backgroundColor: `${themeColor}08` }}>
                  <div className="text-[11px] font-semibold text-gray-900">Book an appointment</div>
                </div>
                <div className="bg-white px-4 py-3">
                  <div className="mb-3 flex gap-2">
                    {[
                      { day: "Today", slots: "3 slots" },
                      { day: "Tomorrow", slots: "5 slots" },
                      { day: "Wed", slots: "4 slots" },
                    ].map((d, i) => (
                      <div
                        key={d.day}
                        className="flex-1 cursor-pointer rounded-lg border p-2.5 text-center transition-all duration-200"
                        style={
                          i === 0
                            ? { borderColor: themeColor, backgroundColor: `${themeColor}08` }
                            : { borderColor: "#e5e7eb" }
                        }
                      >
                        <div className="text-[8px] text-gray-400">{d.day}</div>
                        <div className="text-[10px] font-medium text-gray-900">{d.slots}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {["10:30 AM", "11:00 AM", "2:00 PM"].map((t, i) => (
                      <span
                        key={t}
                        className="cursor-pointer rounded-full px-3 py-1.5 text-[9px] font-medium transition-all duration-200"
                        style={
                          i === 0
                            ? { backgroundColor: `${themeColor}12`, borderWidth: 1, borderColor: themeColor, color: themeColor }
                            : { borderWidth: 1, borderColor: "#e5e7eb", color: "#6b7280" }
                        }
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[8px] text-gray-400">
                    <span className="h-1 w-1 animate-pulse rounded-full" style={{ backgroundColor: themeColor }} />
                    Real-time · ₹100 deposit to confirm
                  </div>
                </div>
              </div>

              {/* Doctor */}
              <div className="px-4 pt-3">
                <div className="text-[11px] font-semibold text-gray-900">Meet your doctor</div>
              </div>
              <div className="mx-4 mb-3 mt-2 flex items-center gap-3 rounded-xl border border-gray-100 p-3 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-medium text-white shadow-sm" style={{ backgroundColor: themeColor }}>SK</div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-900">Dr. Sai Kumar</div>
                  <div className="text-[9px] text-gray-500">BPT, MPT Ortho · 8 years</div>
                  <div className="text-[9px]" style={{ color: themeColor }}>Available today 10 AM–6 PM</div>
                </div>
              </div>

              {/* Reviews */}
              <div className="px-4 pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-gray-900">Patient reviews</span>
                  <span className="flex items-center gap-1 text-[8px] text-gray-400">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
                    Live from Google
                  </span>
                </div>
              </div>
              {[
                { name: "Priya R.", time: "2 days ago", text: "Dr. Sai Kumar is excellent! My knee pain is 90% gone after just 6 sessions. Highly recommend.", reply: "Thank you Priya! We're glad the evidence-based approach helped. — Team Kamakya" },
                { name: "Arun M.", time: "1 week ago", text: "Very professional clinic. The online booking and payment made everything smooth.", reply: "Thanks Arun! We built our tech to make your experience seamless. — Team Kamakya" },
              ].map((r) => (
                <div key={r.name} className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-amber-400">★★★★★</span>
                    <span className="text-[9px] font-semibold text-gray-900">{r.name}</span>
                    <span className="text-[8px] text-gray-400">{r.time}</span>
                  </div>
                  <div className="mt-1 text-[9px] italic leading-relaxed text-gray-600">&ldquo;{r.text}&rdquo;</div>
                  <div className="mt-1 text-[8px] italic" style={{ color: themeColor }}>↳ {r.reply}</div>
                </div>
              ))}

              {/* Pay online */}
              <div className="mx-4 my-3 overflow-hidden rounded-xl shadow-sm">
                <div className="px-4 py-2.5" style={{ backgroundColor: `${themeColor}06` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-900">Pay online</span>
                    <span className="text-[8px] text-gray-400">Secure payments</span>
                  </div>
                </div>
                <div className="bg-white px-4 py-3">
                  <div className="flex gap-2">
                    {["UPI", "Card", "Net banking", "Wallet"].map((p) => (
                      <span key={p} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-center text-[9px] text-gray-600">{p}</span>
                    ))}
                  </div>
                  <div className="mt-2 text-[8px] text-gray-400">Powered by Razorpay · GST invoice auto-generated</div>
                  <button className="mt-2 w-full rounded-lg py-2 text-[10px] font-medium text-white" style={{ backgroundColor: themeColor }}>Pay consultation fee</button>
                </div>
              </div>

              {/* Before/After */}
              <div className="px-4 pt-3">
                <div className="text-[11px] font-semibold text-gray-900">Treatment results</div>
              </div>
              <div className="mx-4 mb-3 mt-2 rounded-xl bg-gray-50 p-3">
                <div className="flex gap-2">
                  <div className="flex h-16 flex-1 items-center justify-center rounded-lg bg-gray-200 text-[9px] text-gray-400">Before</div>
                  <div className="flex h-16 flex-1 items-center justify-center rounded-lg text-[9px] text-white" style={{ backgroundColor: themeColor }}>After</div>
                </div>
                <div className="mt-2 text-center text-[8px] text-gray-400">Swipe to compare · 30+ results</div>
              </div>

              {/* Insurance */}
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5">
                <div className="mb-2 text-[9px] font-semibold text-gray-900">Insurance accepted</div>
                <div className="flex flex-wrap gap-1.5">
                  {["Star Health", "ICICI Lombard", "CGHS"].map((i) => (
                    <span key={i} className="rounded bg-gray-200 px-2 py-0.5 text-[7px] text-gray-600">{i}</span>
                  ))}
                  <span className="cursor-pointer rounded px-2 py-0.5 text-[7px] text-white" style={{ backgroundColor: themeColor }}>Check yours →</span>
                </div>
              </div>

              {/* Blog */}
              <div className="border-t border-amber-100 bg-amber-50/50 px-4 py-2.5">
                <div className="mb-1 text-[9px] font-semibold text-amber-900">Latest from our blog</div>
                <div className="text-[8px] leading-relaxed text-amber-800/70">
                  5 exercises for desk workers with back pain — 2 days ago<br />
                  When should you see a physiotherapist? — 9 days ago
                </div>
              </div>

              {/* Floating CTA */}
              <div className="mx-4 my-3 flex items-center justify-around overflow-hidden rounded-xl py-2.5 shadow-md" style={{ backgroundColor: themeColor }}>
                {["Call", "WhatsApp", "Book", "Pay"].map((c) => (
                  <span key={c} className="flex-1 text-center text-[8px] font-medium text-white">{c}</span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between bg-[#0a1a14] px-4 py-3">
                <span className="text-[8px] text-gray-500">Kamakya Physiotherapy · Banjara Hills, Hyderabad</span>
                <span className="text-[8px] text-gray-600">Powered by MediHost AI</span>
              </div>
            </div>
          </div>

          {/* SUMMARY SECTION */}
          <div className="mx-auto mt-6 w-full max-w-[520px] rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 text-sm font-medium tracking-tight text-gray-900">What AI built automatically from Brand DNA</div>
            <div className="grid grid-cols-4 gap-3">
              {summaryCards.map((s) => (
                <div key={s.num} className="rounded-xl bg-gray-50 p-3.5">
                  <div className="text-xl font-bold text-gray-900">{s.num}</div>
                  <div className="mt-1 text-[11px] font-medium text-gray-900">{s.label}</div>
                  <div className="mt-1 text-[10px] leading-relaxed text-gray-500">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
