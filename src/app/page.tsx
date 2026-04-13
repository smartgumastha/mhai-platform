"use client";

import { useState } from "react";

/* ─── helpers ─── */
const card = "rounded-2xl border border-white/5 bg-white/[.025]";
const body45 = "text-[rgba(255,255,255,.45)]";
const body25 = "text-[rgba(255,255,255,.25)]";
const heading = "text-[#F1F5F9]";
const green = "#10B981";

function DomainBar({ id }: { id?: string }) {
  const [domain, setDomain] = useState("");
  const go = () => {
    if (domain.trim()) window.location.href = `/signup?domain=${encodeURIComponent(domain.trim())}`;
  };
  return (
    <div id={id} className="flex w-full max-w-lg items-center rounded-full border border-white/10 bg-white/[.04] pr-1.5 pl-4">
      {/* globe icon */}
      <svg className="mr-2 h-5 w-5 shrink-0 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14.25 14.25 0 014 9 14.25 14.25 0 01-4 9 14.25 14.25 0 01-4-9 14.25 14.25 0 014-9z" />
      </svg>
      <input
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder="yourname.medihost.in"
        className="flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/25"
      />
      <button onClick={go} className="rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: green }}>
        Search
      </button>
    </div>
  );
}

/* ─── ticker items ─── */
const tickerItems = [
  { text: "Dr. Sharma got 3 new Google reviews", city: "Mumbai" },
  { text: "AI generated 12 posts for Smile Dental", city: "Dubai" },
  { text: "47 appointments booked at Kumar Ortho", city: "Hyderabad" },
  { text: "156 WhatsApp reminders sent, no-shows down 32%", city: "Bangalore" },
  { text: "₹2.4L collected across 8 branches", city: "Chennai" },
];

/* ─── channel data ─── */
const channels = [
  { name: "Google", stat: "4.8 rating", color: "#EF4444" },
  { name: "Facebook", stat: "2.3K reach", color: "#3B82F6" },
  { name: "Instagram", stat: "847 likes", color: "#EC4899" },
  { name: "YouTube", stat: "Shorts", color: "#EF4444" },
  { name: "WhatsApp", stat: "156 sent", color: "#22C55E" },
  { name: "Website", stat: "89 visits", color: "#10B981" },
];

/* ─── built-for data ─── */
const builtFor = [
  { name: "Clinics", desc: "GP, specialists, polyclinics", color: "#10B981", icon: "🏥" },
  { name: "Dental", desc: "Orthodontics, implants, cosmetic", color: "#3B82F6", icon: "🦷" },
  { name: "Hospitals", desc: "Multi-department, chain groups", color: "#8B5CF6", icon: "🏨" },
  { name: "Labs", desc: "Pathology, diagnostics, imaging", color: "#F59E0B", icon: "🔬" },
];

export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: `radial-gradient(ellipse 80% 50% at 80% 10%, rgba(16,185,129,.07), transparent),
                     radial-gradient(ellipse 60% 40% at 20% 90%, rgba(16,185,129,.04), transparent),
                     #0F1117`,
      }}
    >
      {/* ════════ SECTION 1 — STICKY NAV ════════ */}
      <nav className="sticky top-0 z-50 border-b border-white/[.06]" style={{ background: "rgba(15,17,23,.85)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          {/* logo */}
          <a href="/" className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: green }} />
            <span className="text-lg font-bold text-white">Medi<span style={{ color: green }}>Host</span></span>
            <span className="text-xs text-white/30 -ml-1">AI</span>
          </a>
          {/* desktop links */}
          <div className="hidden items-center gap-6 md:flex">
            <a href="#engine" className={`text-sm ${body45} hover:text-white transition`}>Features</a>
            <a href="#pricing" className={`text-sm ${body45} hover:text-white transition`}>Pricing</a>
            <a href="/login" className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-white/70 hover:border-white/20 transition">Login</a>
            <a href="/signup" className="rounded-full px-4 py-1.5 text-sm font-semibold text-white" style={{ background: green }}>Start Free →</a>
          </div>
          {/* mobile */}
          <div className="flex items-center gap-3 md:hidden">
            <a href="/signup" className="rounded-full px-4 py-1.5 text-sm font-semibold text-white" style={{ background: green }}>Start Free →</a>
          </div>
        </div>
      </nav>

      {/* ════════ SECTION 2 — LIVE TICKER ════════ */}
      <div className="overflow-hidden" style={{ background: "rgba(16,185,129,.06)" }}>
        <div className="flex whitespace-nowrap py-2.5" style={{ animation: "ticker 28s linear infinite", width: "max-content" }}>
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className="mx-6 flex items-center gap-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: green, animation: "pulse-dot 1.5s infinite" }} />
              <span className="text-white/60">{item.text}</span>
              <span className="text-white/20">— {item.city}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ════════ SECTION 3 — HERO ════════ */}
      <section className="mx-auto max-w-3xl px-5 pt-20 pb-16 text-center md:pt-28 md:pb-20">
        {/* pill badge */}
        <div className="mb-6 inline-block rounded-full border border-white/10 bg-white/[.04] px-4 py-1.5 text-xs text-white/50">
          AI-powered SaaS for the medical fraternity
        </div>
        {/* h1 */}
        <h1 className={`text-4xl font-bold leading-tight tracking-tight md:text-6xl ${heading}`}>
          Stop hiring agencies.<br />
          <span style={{ color: green }}>Your AI marketing team</span><br />
          works 24/7.
        </h1>
        {/* subtitle */}
        <p className={`mx-auto mt-6 max-w-xl text-base leading-relaxed md:text-lg ${body45}`}>
          Google reviews, Instagram reels, WhatsApp reminders, appointments, billing, SEO — one platform does it all.
          AI generates. You approve. Patients come.
        </p>
        {/* domain bar */}
        <div className="mt-10 flex justify-center">
          <DomainBar />
        </div>
        {/* trust badges */}
        <div className={`mt-6 flex flex-wrap items-center justify-center gap-3 text-xs ${body25}`}>
          <span>NABL</span><span>|</span>
          <span>HIPAA</span><span>|</span>
          <span>ABDM</span><span>|</span>
          <span>GST</span><span>|</span>
          <a href="/signup" className="hover:text-white/40 transition">Or start free with yourname.medihost.in →</a>
        </div>
      </section>

      {/* ════════ SECTION 4 — AI ENGINE HUB ════════ */}
      <section id="engine" className="mx-auto max-w-5xl px-5 py-16 md:py-24">
        <h2 className={`mb-14 text-center text-2xl font-bold md:text-3xl ${heading}`}>
          All your channels. One AI engine.
        </h2>

        {/* center hub */}
        <div className="mb-14 flex flex-col items-center">
          <div className="relative flex h-24 w-24 items-center justify-center">
            {/* glow circle */}
            <div className="absolute inset-0 rounded-full" style={{ background: green, animation: "glowPulse 3s infinite" }} />
            {/* orbit ring */}
            <div className="absolute h-36 w-36 rounded-full border border-white/10" style={{ animation: "orbit 18s linear infinite" }}>
              <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full" style={{ background: green }} />
            </div>
            <span className="relative z-10 text-xl font-bold text-white">AI</span>
          </div>
          <span className="mt-6 text-[10px] font-semibold uppercase tracking-[.2em] text-white/25">MHAI Engine</span>
        </div>

        {/* channel grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {channels.map((ch) => (
            <div key={ch.name} className={`${card} flex flex-col items-center gap-2 p-5`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: ch.color }} />
              <span className="text-sm font-medium text-white/80">{ch.name}</span>
              <span className={`text-xs ${body25}`}>{ch.stat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ SECTION 5 — REAL-WORLD SCENARIOS ════════ */}
      <section className="mx-auto max-w-2xl space-y-6 px-5 py-16 md:py-24">
        {/* Card 1 — Instagram */}
        <div className={`${card} overflow-hidden p-5`} style={{ animation: "slideUp .5s ease both" }}>
          <div className="mb-3 flex items-center justify-between">
            <span className={`text-sm font-medium ${heading}`}>Instagram post — <span className={body25}>created 8 seconds ago</span></span>
            <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-medium text-purple-400">AI generated</span>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[.02] p-4">
            <div className="mb-3 flex gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${green}, #059669)` }}>
                World<br />Diabetes<br />Day
              </div>
              <p className="text-sm leading-relaxed text-white/50">
                This World Diabetes Day, take charge of your health. Early screening saves lives.
                Book your HbA1c test today at HealthFirst Diagnostics. 🩸
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-pink-500/10 px-2.5 py-0.5 text-[10px] text-pink-400">Instagram</span>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] text-blue-400">Facebook</span>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] text-amber-400">Hindi</span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] text-emerald-400">Telugu</span>
            </div>
          </div>
        </div>

        {/* Card 2 — Google Review */}
        <div className={`${card} overflow-hidden p-5`} style={{ animation: "slideUp .5s .15s ease both" }}>
          <div className="mb-3 flex items-center justify-between">
            <span className={`text-sm font-medium ${heading}`}>Google review — <span className={body25}>AI replied in 8 seconds</span></span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: "pulse-dot 1.5s infinite" }} /> Live
            </span>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[.02] p-4">
            <div className="mb-2 flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="mb-2 text-sm leading-relaxed text-white/50">
              &quot;Excellent experience with Dr. Kumar. The staff was very helpful and the clinic is well-maintained. Got my reports on time. Highly recommended!&quot;
            </p>
            <p className="mb-3 text-xs text-white/25">Priya R., 2 hours ago</p>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-sm leading-relaxed text-emerald-400/80">
                Thank you so much, Priya! We&apos;re delighted you had a great experience with Dr. Kumar. Your feedback means a lot to our team. We look forward to serving you again. 🙏
              </p>
            </div>
          </div>
        </div>

        {/* Card 3 — WhatsApp */}
        <div className={`${card} overflow-hidden p-5`} style={{ animation: "slideUp .5s .3s ease both" }}>
          <div className="mb-3 flex items-center justify-between">
            <span className={`text-sm font-medium ${heading}`}>WhatsApp — <span className={body25}>appointment confirmed in 12 seconds</span></span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">Auto-sent</span>
          </div>
          <div className="space-y-2 rounded-xl border border-white/5 bg-white/[.02] p-4">
            {/* outgoing */}
            <div className="ml-auto w-4/5 rounded-xl rounded-tr-sm p-3" style={{ background: "#1A3A2A" }}>
              <p className="text-sm text-emerald-300">
                Hi Rajesh! 👋 Reminder: You have an appointment with Dr. Mehta tomorrow at 10:30 AM.
                Reply YES to confirm or RESCHEDULE to change.
              </p>
              <p className="mt-1 text-right text-[10px] text-white/20">10:02 AM</p>
            </div>
            {/* incoming */}
            <div className="mr-auto w-1/3 rounded-xl rounded-tl-sm bg-white/[.06] p-3">
              <p className="text-sm text-white/70">YES</p>
              <p className="mt-1 text-right text-[10px] text-white/20">10:03 AM</p>
            </div>
            {/* outgoing confirmation */}
            <div className="ml-auto w-4/5 rounded-xl rounded-tr-sm p-3" style={{ background: "#1A3A2A" }}>
              <p className="text-sm text-emerald-300">
                Confirmed! ✅ See you tomorrow at 10:30 AM.<br />
                📍 Kumar Clinic, MG Road, Hyderabad<br />
                <span className="text-emerald-400/60 underline">maps.google.com/kumar-clinic</span>
              </p>
              <p className="mt-1 text-right text-[10px] text-white/20">10:03 AM</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ SECTION 6 — COST COMPARISON ════════ */}
      <section id="pricing" className="mx-auto max-w-3xl px-5 py-16 md:py-24">
        <div className={`${card} p-6 md:p-10`}>
          <h2 className={`mb-8 text-center text-2xl font-bold ${heading}`}>MHAI vs the alternatives</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Agency */}
            <div className="rounded-xl border border-red-500/10 bg-red-500/[.04] p-5 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-sm font-bold text-red-400">A</div>
              <p className="text-sm font-medium text-white/70">Agency</p>
              <p className="mt-2 text-lg text-white/30 line-through">$500–2000/mo</p>
              <p className="mt-1 text-xs font-medium text-red-400">Slow turnaround</p>
            </div>
            {/* DIY */}
            <div className="rounded-xl border border-amber-500/10 bg-amber-500/[.04] p-5 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-sm font-bold text-amber-400">D</div>
              <p className="text-sm font-medium text-white/70">DIY</p>
              <p className="mt-2 text-lg text-white/30 line-through">15+ hrs/week</p>
              <p className="mt-1 text-xs font-medium text-amber-400">No time</p>
            </div>
            {/* MHAI */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[.06] p-5 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">AI</div>
              <p className="text-sm font-medium text-white/70">MHAI</p>
              <p className="mt-2 text-lg font-bold" style={{ color: green }}>$29/mo</p>
              <p className="mt-1 text-xs font-medium text-emerald-400">AI does it all</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ SECTION 7 — BUILT FOR ════════ */}
      <section className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <h2 className={`mb-10 text-center text-2xl font-bold ${heading}`}>Built for every healthcare practice</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {builtFor.map((b) => (
            <div key={b.name} className={`${card} p-5 text-center`}>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: `${b.color}15` }}>
                {b.icon}
              </div>
              <p className="text-sm font-medium text-white/80">{b.name}</p>
              <p className={`mt-1 text-xs ${body25}`}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ SECTION 8 — DOMAIN SEARCH CTA ════════ */}
      <section className="mx-auto max-w-2xl px-5 py-16">
        <div className="rounded-2xl border border-emerald-500/15 p-8 text-center md:p-12" style={{ background: "rgba(16,185,129,.04)" }}>
          <h2 className={`mb-3 text-2xl font-bold ${heading}`}>Get your clinic online in 5 minutes</h2>
          <p className={`mb-8 ${body45}`}>AI builds your website. You just type your clinic name.</p>
          <div className="flex justify-center">
            <DomainBar />
          </div>
          <p className={`mt-4 text-xs ${body25}`}>Free subdomain included. Custom domains from $5/year.</p>
        </div>
      </section>

      {/* ════════ SECTION 9 — FINAL CTA ════════ */}
      <section className="mx-auto max-w-2xl px-5 py-16 text-center md:py-24">
        <h2 className={`mb-4 text-3xl font-bold md:text-4xl ${heading}`}>Your AI marketing team is ready</h2>
        <p className={`mx-auto mb-10 max-w-md ${body45}`}>
          MHAI handles reviews, posts, reminders, billing, and SEO — so you can focus on what matters: your patients.
        </p>
        <a
          href="/signup"
          className="inline-block rounded-full px-10 py-4 text-lg font-semibold text-white transition"
          style={{ background: green, boxShadow: `0 0 24px rgba(16,185,129,.35)` }}
        >
          Start Free →
        </a>
        <p className={`mt-6 text-xs ${body25}`}>No credit card. 10 languages. Works globally. Cancel anytime.</p>
      </section>

      {/* ════════ SECTION 10 — FOOTER ════════ */}
      <footer className="border-t border-white/[.06] py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-xs text-white/25 md:flex-row">
          <span>MHAI by SmartGumastha Technologies</span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-white/40 transition">Privacy</a>
            <a href="/terms" className="hover:text-white/40 transition">Terms</a>
            <a href="/support" className="hover:text-white/40 transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
