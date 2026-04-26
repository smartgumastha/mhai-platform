"use client";

import Link from "next/link";
import { useState } from "react";

/* ── Shared nav ─────────────────────────────────────────── */
function Navbar() {
  var [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 border-b border-[#e2e8f0] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)", boxShadow: "0 6px 16px -4px rgba(124,58,237,0.35)" }}
          >
            <svg viewBox="0 0 100 100" width="22" height="22">
              <path d="M50 8 L85 22 L85 52 Q85 76 50 92 Q15 76 15 52 L15 22 Z" fill="white" />
              <path d="M50 30 L50 70 M30 50 L70 50" stroke="#7c3aed" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-extrabold tracking-[-0.03em] text-[#020617]">MediHost™ AI</div>
            <div className="text-[10px] font-bold text-[#0e7ba8] leading-none">AI engine for Healthcare</div>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="#features" className="text-[13px] font-semibold text-[#475569] hover:text-[#0f172a]">Features</Link>
          <Link href="#modules" className="text-[13px] font-semibold text-[#475569] hover:text-[#0f172a]">Modules</Link>
          <Link href="/pricing" className="text-[13px] font-semibold text-[#475569] hover:text-[#0f172a]">Pricing</Link>
          <Link href="#about" className="text-[13px] font-semibold text-[#475569] hover:text-[#0f172a]">About</Link>
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link href="/login" className="rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-2 text-[13px] font-bold text-[#475569] hover:border-[#1ba3d6] hover:text-[#0f172a]">
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-[8px] px-5 py-2 text-[13px] font-extrabold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)", boxShadow: "0 6px 16px -4px rgba(124,58,237,0.4)" }}
          >
            Start free →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 text-[#475569]" onClick={() => setOpen(!open)} aria-label="Menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            {open
              ? <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
              : <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
            }
          </svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-[#f1f5f9] bg-white px-5 pb-4 md:hidden">
          {[["#features","Features"],["#modules","Modules"],["/pricing","Pricing"],["#about","About"]].map(([href,label])=>(
            <Link key={href} href={href} onClick={()=>setOpen(false)} className="block py-2.5 text-[14px] font-semibold text-[#475569]">{label}</Link>
          ))}
          <div className="mt-3 flex gap-2">
            <Link href="/login" className="flex-1 rounded-[8px] border border-[#e2e8f0] py-2.5 text-center text-[13px] font-bold text-[#475569]">Login</Link>
            <Link href="/signup" className="flex-1 rounded-[8px] py-2.5 text-center text-[13px] font-extrabold text-white" style={{background:"linear-gradient(135deg,#7c3aed,#ec4899)"}}>Start free</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ── Badge pill ─────────────────────────────────────────── */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(27,163,214,0.25)] bg-[rgba(27,163,214,0.07)] px-3.5 py-1.5 text-[11px] font-bold tracking-[0.06em] text-[#0e7ba8]">
      {children}
    </span>
  );
}

/* ── Feature card ───────────────────────────────────────── */
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(15,23,42,0.07)" }}>
      <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[rgba(27,163,214,0.1)]">
        {icon}
      </div>
      <div className="mb-1.5 text-[15px] font-extrabold text-[#020617]">{title}</div>
      <div className="text-[13px] leading-[1.6] text-[#475569]">{desc}</div>
    </div>
  );
}

/* ── Module row ─────────────────────────────────────────── */
function ModuleRow({ num, tag, title, desc, bullets, accent }: {
  num: string; tag: string; title: string; desc: string; bullets: string[]; accent: string;
}) {
  return (
    <div className="flex gap-6 rounded-[16px] border border-[#e2e8f0] bg-white p-6 md:p-8" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 12px 32px -10px rgba(15,23,42,0.07)" }}>
      <div className="hidden w-10 shrink-0 pt-1 text-right text-[11px] font-extrabold tracking-[0.1em] text-[#94a3b8] sm:block">{num}</div>
      <div className="flex-1">
        <div className="mb-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-[0.08em]" style={{ background: accent + "18", color: accent }}>{tag}</div>
        <div className="mb-1 text-[18px] font-extrabold text-[#020617]">{title}</div>
        <div className="mb-4 text-[13px] leading-[1.6] text-[#475569]">{desc}</div>
        <div className="flex flex-wrap gap-2">
          {bullets.map((b) => (
            <span key={b} className="flex items-center gap-1 rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-[#334155]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1ba3d6]" />{b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Stat card ──────────────────────────────────────────── */
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[14px] border border-[#e2e8f0] bg-white p-6 text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(15,23,42,0.06)" }}>
      <div className="text-[32px] font-extrabold tracking-[-0.03em] text-[#020617]">{value}</div>
      <div className="mt-1 text-[12px] font-semibold text-[#475569]">{label}</div>
    </div>
  );
}

/* ── Compliance badge ───────────────────────────────────── */
function CBadge({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-[5px] rounded-[20px] border border-[#e2e8f0] bg-white px-3 py-1.5 text-[10px] font-bold tracking-[0.05em] text-[#475569]">
      <span className="h-[6px] w-[6px] rounded-full bg-[#1ba3d6]" />{label}
    </span>
  );
}

/* ── Main ───────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[rgba(27,163,214,0.03)] to-white" style={{ color: "#0f172a" }}>
      <Navbar />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden px-5 pb-20 pt-16 text-center">
        {/* blobs */}
        <div className="pointer-events-none absolute right-[-10%] top-[-5%] h-[50%] w-[50%]" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div className="pointer-events-none absolute bottom-[-5%] left-[-10%] h-[50%] w-[50%]" style={{ background: "radial-gradient(circle, rgba(27,163,214,0.09) 0%, transparent 70%)", filter: "blur(50px)" }} />

        <div className="relative mx-auto max-w-3xl">
          <Pill>
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            HIPAA · DPDPA · ABDM · NABH certified
          </Pill>

          <h1 className="mt-6 text-[42px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#020617] md:text-[54px]">
            The AI-powered<br />
            <span className="text-[#1ba3d6]">clinic operating system</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-[1.7] text-[#475569]">
            HMS · Revenue Cycle · AI Marketing · Compliance — one platform built for clinics in India, UAE, UK, and beyond. Launch in under 5 minutes.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-[10px] px-8 py-3.5 text-[15px] font-extrabold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)", boxShadow: "0 10px 24px -6px rgba(124,58,237,0.4)" }}
            >
              Start free — 14 days →
            </Link>
            <Link href="/login" className="rounded-[10px] border border-[#e2e8f0] bg-white px-8 py-3.5 text-[15px] font-bold text-[#475569] hover:border-[#1ba3d6] hover:text-[#0f172a]">
              Login to dashboard
            </Link>
          </div>

          <p className="mt-4 text-[11px] text-[#94a3b8]">No credit card required · Cancel anytime · All data encrypted</p>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {["HIPAA","DPDPA","ABDM","NABH","GDPR"].map((b) => <CBadge key={b} label={b} />)}
          </div>
        </div>
      </section>

      {/* ═══ SERVICES STRIP ═══ */}
      <div className="border-y border-[#f1f5f9] bg-[#f8fafc] py-4">
        <div className="mx-auto max-w-5xl px-5">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-bold tracking-[0.08em] text-[#475569]">
            {[
              "Hospital Management System",
              "Revenue Cycle Management",
              "AI Marketing Engine",
              "Multi-country Compliance",
              "ABDM / NHA Integration",
              "WhatsApp + Social Automation",
            ].map((s, i) => (
              <span key={s} className="flex items-center gap-1.5">
                {i > 0 && <span className="font-bold text-[#1ba3d6]">·</span>}
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 text-center">
            <Pill>Core capabilities</Pill>
          </div>
          <h2 className="mb-3 text-center text-[30px] font-extrabold leading-[1.2] tracking-[-0.03em] text-[#020617]">
            Everything your clinic needs,<br />
            <span className="text-[#1ba3d6]">nothing it doesn't.</span>
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-[14px] leading-[1.7] text-[#475569]">
            Built for real clinics — from solo GPs to multi-branch hospitals. No bloatware, no enterprise contracts.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<svg width="20" height="20" fill="none" stroke="#1ba3d6" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m4-10h2m-2 4h2m6-4h2m-2 4h2"/></svg>}
              title="Hospital Management"
              desc="OPD tokens, patient records, prescriptions, lab reports, pharmacy, and ward management in one unified view."
            />
            <FeatureCard
              icon={<svg width="20" height="20" fill="none" stroke="#1ba3d6" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
              title="Revenue Cycle"
              desc="Automated billing, insurance claims via NHCX, payment links, EMI collections, and real-time revenue dashboards."
            />
            <FeatureCard
              icon={<svg width="20" height="20" fill="none" stroke="#1ba3d6" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>}
              title="AI Marketing"
              desc="AI-generated website, WhatsApp automation, Google review management, social posts, and patient reactivation campaigns."
            />
            <FeatureCard
              icon={<svg width="20" height="20" fill="none" stroke="#1ba3d6" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>}
              title="Global Compliance"
              desc="HIPAA, GDPR, DPDPA, ABDM, NABH — automated consent forms, DND checks, audit trails, and regulatory reporting."
            />
          </div>
        </div>
      </section>

      {/* ═══ MODULES ═══ */}
      <section id="modules" className="bg-[#f8fafc] px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 text-center">
            <Pill>Platform modules</Pill>
          </div>
          <h2 className="mb-3 text-center text-[30px] font-extrabold leading-[1.2] tracking-[-0.03em] text-[#020617]">
            One login. Full stack.
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-center text-[14px] leading-[1.7] text-[#475569]">
            Every module is built-in — no third-party integrations to set up, no API keys to manage.
          </p>

          <div className="space-y-4">
            <ModuleRow
              num="01"
              tag="HMS"
              title="Complete Hospital Management"
              desc="From patient registration to discharge summary — OPD, IPD, pharmacy, lab, and billing all connected. ABDM-ready."
              bullets={["OPD Tokens","Patient Records","Prescription Pad","Lab Reports","Pharmacy","Ward Management","ABDM / FHIR"]}
              accent="#1ba3d6"
            />
            <ModuleRow
              num="02"
              tag="RCM"
              title="Revenue Cycle Management"
              desc="Automated invoicing, insurance claim submission via NHCX, payment link generation, and collections follow-up — all on autopilot."
              bullets={["Auto Invoicing","NHCX Claims","Payment Links","EMI Plans","Collections AI","Revenue Dashboard","Multi-currency"]}
              accent="#7c3aed"
            />
            <ModuleRow
              num="03"
              tag="AI MARKETING"
              title="AI-Powered Patient Acquisition"
              desc="Clara (our AI) builds your website, manages your Google reviews, posts on social media, and sends WhatsApp campaigns while you focus on patients."
              bullets={["AI Website","WhatsApp Automation","Google Reviews","Social Posts","SEO + AEO","Patient CRM","Reactivation"]}
              accent="#ec4899"
            />
            <ModuleRow
              num="04"
              tag="COMPLIANCE"
              title="Multi-Country Regulatory Engine"
              desc="Automated compliance for every country you operate in — consent forms, DND time-window checks, audit logs, and NABH documentation."
              bullets={["HIPAA","GDPR","DPDPA","ABDM","NABH","DND Engine","Consent Audit","FHIR R4"]}
              accent="#10b981"
            />
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard value="847+" label="Clinics launched" />
            <StatCard value="9" label="Countries supported" />
            <StatCard value="5 min" label="Time to go live" />
            <StatCard value="14 days" label="Free trial" />
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIAL ═══ */}
      <section className="bg-[#f8fafc] px-5 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[18px] border border-[#e2e8f0] bg-white p-8" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 20px 40px -12px rgba(15,23,42,0.08)" }}>
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div className="shrink-0 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-[18px] font-extrabold text-white" style={{ background: "linear-gradient(135deg, #1ba3d6, #0e7ba8)" }}>AS</div>
                <div className="mt-2.5 text-[14px] font-bold text-[#020617]">Dr. Anil Sharma</div>
                <div className="text-[11px] text-[#475569]">Sharma Dental, Hyderabad</div>
                <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-[#475569]">
                  <span className="text-amber-400">★★★★★</span> 4.9 · 247 reviews
                </div>
              </div>
              <div>
                <p className="text-[15px] italic leading-[1.7] text-[#334155]">
                  &ldquo;I replaced my social media agency and telecaller the week MediHost AI launched. In 60 days I added 47 new patients worth ₹12.4 lakh. Paying ₹2,999 a month for what used to cost me ₹80,000? It felt like stealing.&rdquo;
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#d1fae5] px-3 py-1 text-[11px] font-semibold text-[#065f46]">+47 patients in 60 days</span>
                  <span className="rounded-full bg-[rgba(27,163,214,0.1)] px-3 py-1 text-[11px] font-semibold text-[#0e7ba8]">+₹12.4L new revenue</span>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600">-₹80k monthly costs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING TEASER ═══ */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Pill>Simple pricing</Pill>
          <h2 className="mb-3 mt-5 text-[30px] font-extrabold tracking-[-0.03em] text-[#020617]">
            Starts at <span className="text-[#1ba3d6]">₹999/month</span>
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-[14px] leading-[1.7] text-[#475569]">
            Four plans — Starter, Growth, Pro, and Call Center. Every plan includes a 14-day free trial. Upgrade or cancel anytime.
          </p>

          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { name: "Starter", price: "₹999", note: "Solo practice", color: "#475569" },
              { name: "Growth", price: "₹2,999", note: "Most popular", color: "#1ba3d6" },
              { name: "Pro", price: "₹4,999", note: "AI voice + CRM", color: "#7c3aed" },
              { name: "Call Center", price: "₹9,999", note: "Full arsenal", color: "#ec4899" },
            ].map((plan) => (
              <div key={plan.name} className="rounded-[14px] border border-[#e2e8f0] bg-white p-5 text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div className="mb-1 text-[13px] font-extrabold text-[#020617]">{plan.name}</div>
                <div className="text-[22px] font-extrabold" style={{ color: plan.color }}>{plan.price}</div>
                <div className="text-[11px] text-[#94a3b8]">/month</div>
                <div className="mt-1 text-[10px] font-semibold text-[#475569]">{plan.note}</div>
              </div>
            ))}
          </div>

          <Link
            href="/pricing"
            className="inline-block rounded-[10px] px-8 py-3.5 text-[14px] font-extrabold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)", boxShadow: "0 10px 24px -6px rgba(124,58,237,0.4)" }}
          >
            See full pricing →
          </Link>

          <div className="mt-4 flex flex-wrap justify-center gap-4 text-[12px] text-[#94a3b8]">
            <span>✓ No credit card required</span>
            <span>✓ 14-day free trial</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* ═══ ABOUT ═══ */}
      <section id="about" className="bg-[#f8fafc] px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-10 md:flex-row md:items-center">
            <div className="flex-1">
              <Pill>About us</Pill>
              <h2 className="mb-4 mt-5 text-[28px] font-extrabold leading-[1.2] tracking-[-0.03em] text-[#020617]">
                Built in Hyderabad.<br />
                <span className="text-[#1ba3d6]">Built for the world.</span>
              </h2>
              <p className="mb-4 text-[14px] leading-[1.7] text-[#475569]">
                MediHost AI Technologies Private Limited was founded to give independent clinics the same AI-powered tools that large hospital chains have — without the enterprise price tag or the 6-month implementation timeline.
              </p>
              <p className="text-[14px] leading-[1.7] text-[#475569]">
                We are headquartered in Hyderabad, India. Our platform serves clinics across India, UAE, UK, Kenya, Singapore, Australia, Canada, and Germany — with full local compliance for each market.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <CBadge label="Patent Pending 202641047349" />
                <CBadge label="Hyderabad, India" />
                <CBadge label="Founded 2024" />
              </div>
            </div>
            <div className="shrink-0 md:w-64">
              <div className="rounded-[18px] border border-[#e2e8f0] bg-white p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 12px 32px -10px rgba(15,23,42,0.08)" }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-[14px]" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)", boxShadow: "0 8px 20px -5px rgba(124,58,237,0.4)" }}>
                  <svg viewBox="0 0 100 100" width="32" height="32">
                    <path d="M50 8 L85 22 L85 52 Q85 76 50 92 Q15 76 15 52 L15 22 Z" fill="white" />
                    <path d="M50 30 L50 70 M30 50 L70 50" stroke="#7c3aed" strokeWidth="7" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="mt-4 text-[17px] font-extrabold text-[#020617]">MediHost™ AI</div>
                <div className="text-[12px] font-bold text-[#0e7ba8]">AI engine for Healthcare</div>
                <div className="mt-3 border-t border-[#f1f5f9] pt-3 text-[11px] font-semibold text-[#475569]">
                  HMS
                  <span className="mx-1.5 font-bold text-[#1ba3d6]">·</span>
                  RCM
                  <span className="mx-1.5 font-bold text-[#1ba3d6]">·</span>
                  Compliance
                  <span className="mx-1.5 font-bold text-[#1ba3d6]">·</span>
                  AI Marketing
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative overflow-hidden px-5 py-20 text-center">
        <div className="pointer-events-none absolute right-[-10%] top-[-5%] h-[60%] w-[60%]" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div className="pointer-events-none absolute bottom-[-5%] left-[-10%] h-[60%] w-[60%]" style={{ background: "radial-gradient(circle, rgba(27,163,214,0.08) 0%, transparent 70%)", filter: "blur(50px)" }} />

        <div className="relative mx-auto max-w-2xl">
          <Pill>Launch today</Pill>
          <h2 className="mb-4 mt-5 text-[34px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#020617]">
            Your clinic is 5 minutes<br />
            <span className="text-[#1ba3d6]">away from launch.</span>
          </h2>
          <p className="mx-auto mb-8 max-w-md text-[14px] leading-[1.7] text-[#475569]">
            Sign up, set up your clinic profile, and your HMS dashboard is live. No IT team required. No credit card needed.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-[10px] px-10 py-4 text-[16px] font-extrabold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)", boxShadow: "0 12px 28px -6px rgba(124,58,237,0.45)" }}
          >
            Create your clinic account →
          </Link>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {["No credit card","14-day free trial","Cancel anytime","Go live in 5 minutes","9 countries supported"].map((t)=>(
              <span key={t} className="text-[11px] font-semibold text-[#94a3b8]">✓ {t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-[#e2e8f0] bg-[#020617] px-5 py-14">
        <div className="mx-auto max-w-5xl">
          {/* Brand row */}
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xs">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)" }}>
                  <svg viewBox="0 0 100 100" width="20" height="20">
                    <path d="M50 8 L85 22 L85 52 Q85 76 50 92 Q15 76 15 52 L15 22 Z" fill="white" />
                    <path d="M50 30 L50 70 M30 50 L70 50" stroke="#7c3aed" strokeWidth="9" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-[15px] font-extrabold text-white">MediHost™ AI</div>
                  <div className="text-[10px] font-bold text-[#1ba3d6]">AI engine for Healthcare</div>
                </div>
              </div>
              <p className="text-[12px] leading-[1.7] text-[#94a3b8]">
                MediHost AI Technologies Private Limited<br />
                Hyderabad, Telangana, India 500032
              </p>
              <p className="mt-2 text-[11px] text-[#64748b]">
                CIN: pending · Patent Application 202641047349
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["HIPAA","DPDPA","ABDM","NABH","GDPR"].map((b)=>(
                  <span key={b} className="flex items-center gap-1 rounded-full border border-[#1e293b] bg-[#0f172a] px-2.5 py-1 text-[9px] font-bold tracking-[0.05em] text-[#475569]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1ba3d6]" />{b}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#475569]">Product</p>
                <div className="space-y-2.5">
                  {[["#features","Features"],["#modules","Modules"],["/pricing","Pricing"],["/signup","Sign up"],["/login","Login"]].map(([href,label])=>(
                    <Link key={href} href={href} className="block text-[13px] text-[#64748b] hover:text-white">{label}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#475569]">Company</p>
                <div className="space-y-2.5">
                  {[["#about","About"],["mailto:support@medihostai.com","Contact"],["mailto:saicharankumarpakala@gmail.com","Founder"]].map(([href,label])=>(
                    <Link key={href} href={href} className="block text-[13px] text-[#64748b] hover:text-white">{label}</Link>
                  ))}
                  <p className="text-[12px] text-[#64748b]">Hyderabad, India</p>
                </div>
              </div>
              <div>
                <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#475569]">Legal</p>
                <div className="space-y-2.5">
                  {[["/privacy","Privacy Policy"],["/terms","Terms of Service"],["/refund","Refund Policy"]].map(([href,label])=>(
                    <Link key={href} href={href} className="block text-[13px] text-[#64748b] hover:text-white">{label}</Link>
                  ))}
                  <p className="text-[11px] text-[#475569]">Patent pending<br />Application 202641047349</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-[#1e293b] pt-6">
            <div className="flex flex-col items-center justify-between gap-2 text-center md:flex-row md:text-left">
              <p className="text-[11px] text-[#475569]">
                © 2026 MediHost AI Technologies Private Limited · Made with love in Hyderabad
              </p>
              <p className="text-[11px] text-[#334155]">
                Powered by Claude from Anthropic · All trademarks belong to their respective owners
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
