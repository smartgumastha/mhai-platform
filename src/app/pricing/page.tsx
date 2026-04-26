"use client";

import { useState } from "react";
import Link from "next/link";

/* ── Currency system ────────────────────────────────────── */
type PricingData = {
  symbol: string; locale: string; country: string; flag: string;
  starter: number; growth: number; pro: number; callcenter: number;
  starterY: number; growthY: number; proY: number; callcenterY: number;
};

var pricing: Record<string, PricingData> = {
  IN: { symbol: "₹", locale: "en-IN", country: "India", flag: "🇮🇳",
    starter: 999, growth: 2999, pro: 4999, callcenter: 9999,
    starterY: 833, growthY: 2499, proY: 4166, callcenterY: 8333 },
  AE: { symbol: "AED ", locale: "en-AE", country: "UAE", flag: "🇦🇪",
    starter: 39, growth: 109, pro: 189, callcenter: 369,
    starterY: 33, growthY: 91, proY: 157, callcenterY: 308 },
  GB: { symbol: "£", locale: "en-GB", country: "United Kingdom", flag: "🇬🇧",
    starter: 9, growth: 25, pro: 42, callcenter: 79,
    starterY: 8, growthY: 21, proY: 35, callcenterY: 66 },
  US: { symbol: "$", locale: "en-US", country: "United States", flag: "🇺🇸",
    starter: 9, growth: 29, pro: 49, callcenter: 99,
    starterY: 8, growthY: 24, proY: 41, callcenterY: 82 },
  KE: { symbol: "KSh ", locale: "en-KE", country: "Kenya", flag: "🇰🇪",
    starter: 999, growth: 2999, pro: 4999, callcenter: 9999,
    starterY: 833, growthY: 2499, proY: 4166, callcenterY: 8333 },
};

function fmt(n: number, locale: string) { return n.toLocaleString(locale); }

/* ── Nav ────────────────────────────────────────────────── */
function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#e2e8f0] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)", boxShadow: "0 6px 16px -4px rgba(124,58,237,0.35)" }}>
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
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/#features" className="text-[13px] font-semibold text-[#475569] hover:text-[#0f172a]">Features</Link>
          <Link href="/#modules" className="text-[13px] font-semibold text-[#475569] hover:text-[#0f172a]">Modules</Link>
          <Link href="/pricing" className="text-[13px] font-semibold text-[#1ba3d6]">Pricing</Link>
          <Link href="/#about" className="text-[13px] font-semibold text-[#475569] hover:text-[#0f172a]">About</Link>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/login" className="hidden rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-2 text-[13px] font-bold text-[#475569] hover:border-[#1ba3d6] md:block">Login</Link>
          <Link href="/signup" className="rounded-[8px] px-5 py-2 text-[13px] font-extrabold text-white" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)", boxShadow: "0 6px 16px -4px rgba(124,58,237,0.4)" }}>
            Start free →
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ── Plan card ──────────────────────────────────────────── */
type Plan = {
  name: string; tagline: string; price: string; sub: string;
  yearlyNote?: string; badge?: string; featured?: boolean;
  features: string[]; locked?: string; ctaText: string; ctaHref: string;
  accent: string;
};

function PlanCard({ plan, featured }: { plan: Plan; featured?: boolean }) {
  return (
    <div
      className={`relative flex flex-col rounded-[16px] border bg-white transition-all hover:shadow-xl ${
        featured ? "border-[#1ba3d6] shadow-lg" : "border-[#e2e8f0] shadow-sm"
      }`}
      style={featured ? { boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 20px 40px -12px rgba(27,163,214,0.18)" } : {}}
    >
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="rounded-full px-4 py-1 text-[11px] font-extrabold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 4px 12px -3px rgba(124,58,237,0.4)" }}>
            {plan.badge}
          </span>
        </div>
      )}

      <div className="p-6">
        {/* Top accent bar */}
        <div className="mb-4 h-1 w-10 rounded-full" style={{ background: plan.accent }} />

        <div className="text-[17px] font-extrabold text-[#020617]">{plan.name}</div>
        <div className="mt-0.5 text-[12px] text-[#475569]">{plan.tagline}</div>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-[34px] font-extrabold tracking-[-0.03em] text-[#020617]">{plan.price}</span>
          <span className="text-[13px] text-[#94a3b8]">{plan.sub}</span>
        </div>
        {plan.yearlyNote && <p className="mt-0.5 text-[11px] text-[#475569]">{plan.yearlyNote}</p>}

        <Link
          href={plan.ctaHref}
          className={`mt-5 block w-full rounded-[10px] py-3 text-center text-[14px] font-extrabold transition-all ${
            featured
              ? "text-white"
              : "border border-[#e2e8f0] bg-white text-[#475569] hover:border-[#1ba3d6] hover:text-[#0f172a]"
          }`}
          style={featured ? { background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)", boxShadow: "0 8px 20px -5px rgba(124,58,237,0.4)" } : {}}
        >
          {plan.ctaText}
        </Link>
      </div>

      <div className="flex-1 border-t border-[#f1f5f9] px-6 py-5">
        <div className="space-y-2.5">
          {plan.features.map((f) => (
            <div key={f} className="flex items-start gap-2.5 text-[13px]">
              <span className="mt-0.5 flex-shrink-0 text-[#1ba3d6] font-bold">✓</span>
              <span className="text-[#334155]">{f}</span>
            </div>
          ))}
          {plan.locked && (
            <div className="flex items-start gap-2.5 text-[13px]">
              <span className="mt-0.5 flex-shrink-0 text-[#cbd5e1]">—</span>
              <span className="text-[#94a3b8]">{plan.locked}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── FAQ item ───────────────────────────────────────────── */
function FAQItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-[12px] border border-[#e2e8f0] bg-white">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-6 py-5 text-left">
        <span className="text-[14px] font-semibold text-[#020617]">{q}</span>
        <span className={`text-[20px] text-[#94a3b8] transition-transform duration-200 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && <div className="border-t border-[#f1f5f9] px-6 pb-5 pt-3 text-[13px] leading-[1.7] text-[#475569]">{a}</div>}
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────── */
export default function PricingPage() {
  var [isYearly, setIsYearly] = useState(false);
  var [country, setCountry] = useState("IN");
  var [openFaq, setOpenFaq] = useState<number | null>(null);

  var p = pricing[country] || pricing.IN;

  var plans: Plan[] = [
    {
      name: "Starter",
      tagline: "For solo doctors & new clinics",
      price: isYearly ? `${p.symbol}${fmt(p.starterY, p.locale)}` : `${p.symbol}${fmt(p.starter, p.locale)}`,
      sub: "/month",
      yearlyNote: isYearly ? `Billed annually · save 17%` : "Billed monthly",
      accent: "#475569",
      features: [
        "AI-generated clinic website",
        "Google Business Profile setup",
        "Website chatbot (50 chats/mo)",
        "3 AI review replies/month",
        "Basic booking page",
        "Payment links (2% fee)",
        "1 doctor seat",
      ],
      locked: "AI marketing, WhatsApp, HMS — upgrade to unlock",
      ctaText: "Start free trial",
      ctaHref: "/signup",
    },
    {
      name: "Growth",
      tagline: "Full AI marketing on autopilot",
      price: isYearly ? `${p.symbol}${fmt(p.growthY, p.locale)}` : `${p.symbol}${fmt(p.growth, p.locale)}`,
      sub: "/month",
      yearlyNote: isYearly ? `Billed annually · save 17%` : "Billed monthly",
      badge: "Most popular",
      featured: true,
      accent: "#1ba3d6",
      features: [
        "Everything in Starter",
        "Custom domain + AI website",
        "WhatsApp automation (unlimited)",
        "Social posts (20/month, all platforms)",
        "SEO + AEO + AI blog (4 posts/mo)",
        "Unlimited review management + AI replies",
        "Patient CRM",
        "Payment links (1.5% fee) + invoicing",
        "3 doctor seats",
      ],
      locked: "AI voice calls, lead scoring — available in Pro",
      ctaText: "Start 14-day free trial →",
      ctaHref: "/signup",
    },
    {
      name: "Pro",
      tagline: "AI voice + CRM + advanced analytics",
      price: isYearly ? `${p.symbol}${fmt(p.proY, p.locale)}` : `${p.symbol}${fmt(p.pro, p.locale)}`,
      sub: "/month",
      yearlyNote: isYearly ? `Billed annually · save 17%` : "Billed monthly",
      accent: "#7c3aed",
      features: [
        "Everything in Growth",
        "AI Voice Caller (500 min/mo)",
        "AI lead scoring (0–100)",
        "Patient reactivation campaigns",
        "Google + Meta Ads management",
        "Print studio + field marketing",
        "Collections AI",
        "5 doctor seats",
        "Payment links (1% fee)",
      ],
      locked: "HMS, telecaller coaching — available in Call Center",
      ctaText: "Start 14-day free trial",
      ctaHref: "/signup",
    },
    {
      name: "Call Center",
      tagline: "Full arsenal — HMS + RCM + AI",
      price: isYearly ? `${p.symbol}${fmt(p.callcenterY, p.locale)}` : `${p.symbol}${fmt(p.callcenter, p.locale)}`,
      sub: "/month",
      yearlyNote: isYearly ? `Billed annually · save 17%` : "Billed monthly",
      accent: "#ec4899",
      features: [
        "Everything in Pro",
        "Hospital Management System (HMS)",
        "Revenue Cycle Management (RCM)",
        "NHCX insurance claims",
        "AI Voice Caller (5,000 min/mo)",
        "5 telecaller seats + AI coaching",
        "Weekly AI performance reports",
        "ABDM / NHA integration",
        "Unlimited doctor seats",
        "Payment links (0.5% fee)",
        "Priority support + dedicated manager",
      ],
      ctaText: "Start 14-day free trial",
      ctaHref: "/signup",
    },
  ];

  var addons = [
    { name: "HMS Module", desc: "OPD, billing, prescriptions, lab — standalone add-on for Growth/Pro", icon: "🏥" },
    { name: "Extra Telecaller Seats", desc: "Add more telecaller seats beyond plan limit", icon: "📞" },
    { name: "SMS Packs", desc: "For review requests, reminders, and campaigns", icon: "💬" },
    { name: "Intelligence Dashboard", desc: "Cross-clinic benchmarks and competitive analysis", icon: "📊" },
    { name: "Extra AI Chat Volume", desc: "Additional chatbot conversations beyond plan quota", icon: "🤖" },
    { name: "Enterprise / Multi-branch", desc: "Unlimited branches, white-label, custom SLA — contact sales", icon: "🏢" },
  ];

  var faqs = [
    { q: "Can I start without a credit card?", a: "Yes. Every plan comes with a 14-day free trial — no credit card required. You only need to add payment details when your trial ends." },
    { q: "What happens after the 14-day trial?", a: "You can continue on the Starter plan at ₹999/month, or choose a higher plan. No surprise charges — we'll remind you 3 days before the trial ends." },
    { q: "How does the transaction fee work?", a: "The transaction fee applies only to payments processed through MHAI Pay (our built-in payment link system). It's 2% on Starter, 1.5% on Growth, 1% on Pro, and 0.5% on Call Center." },
    { q: "Do you support multi-branch clinics?", a: "Yes. The Call Center plan supports multi-branch setups. For hospital chains or franchises with 5+ branches, contact us for an enterprise quote." },
    { q: "Is patient data safe?", a: "All patient data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are HIPAA, GDPR, and DPDPA compliant. We never share or sell patient data. Each clinic's data is fully isolated." },
    { q: "Can I use just the HMS without the marketing features?", a: "Yes. HMS is available as a standalone add-on on Growth and Pro plans. You don't need the full Call Center plan to access patient records and billing." },
    { q: "What countries are supported?", a: "India, UAE, UK, USA, Kenya, Singapore, Australia, Canada, and Germany. Each market has its own compliance setup (ABDM for India, DHA for UAE, NHS for UK, etc.)." },
    { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time. Your account stays active until the end of the current billing period. No cancellation fees." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[rgba(27,163,214,0.02)] to-white" style={{ color: "#0f172a" }}>
      <Navbar />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden px-5 pb-16 pt-16 text-center">
        <div className="pointer-events-none absolute right-[-10%] top-[-5%] h-[50%] w-[50%]" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div className="pointer-events-none absolute bottom-0 left-[-10%] h-[50%] w-[50%]" style={{ background: "radial-gradient(circle, rgba(27,163,214,0.08) 0%, transparent 70%)", filter: "blur(50px)" }} />

        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(27,163,214,0.25)] bg-[rgba(27,163,214,0.07)] px-3.5 py-1.5 text-[11px] font-bold tracking-[0.06em] text-[#0e7ba8]">
            Simple, transparent pricing
          </span>
          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#020617] md:text-[52px]">
            Every tool your clinic needs.<br />
            <span className="text-[#1ba3d6]">One monthly price.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-[1.7] text-[#475569]">
            AI marketing + HMS + RCM + Compliance. Start free, upgrade as you grow.
          </p>

          {/* Country selector */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {Object.entries(pricing).map(([code, data]) => (
              <button
                key={code}
                onClick={() => setCountry(code)}
                className={`rounded-[8px] border px-3 py-1.5 text-[12px] font-bold transition-all ${
                  country === code
                    ? "border-[#1ba3d6] bg-[rgba(27,163,214,0.1)] text-[#0e7ba8]"
                    : "border-[#e2e8f0] bg-white text-[#475569] hover:border-[#1ba3d6]"
                }`}
              >
                {data.flag} {data.country}
              </button>
            ))}
          </div>

          {/* Toggle */}
          <div className="mt-5 flex items-center justify-center gap-3">
            <span className={`text-[13px] font-semibold ${!isYearly ? "text-[#020617]" : "text-[#94a3b8]"}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`flex h-6 w-12 items-center rounded-full transition-colors duration-300 ${isYearly ? "bg-[#1ba3d6]" : "bg-[#e2e8f0]"}`}
              aria-label="Toggle yearly billing"
            >
              <div className="h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300" style={{ transform: isYearly ? "translateX(24px)" : "translateX(2px)" }} />
            </button>
            <span className={`text-[13px] font-semibold ${isYearly ? "text-[#020617]" : "text-[#94a3b8]"}`}>Yearly</span>
            <span className="rounded-full bg-[rgba(27,163,214,0.1)] px-2.5 py-1 text-[10px] font-extrabold text-[#0e7ba8]">Save 17%</span>
          </div>

          {/* Trust */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-5">
            {["No credit card","14-day free trial","Cancel anytime","HIPAA compliant","9 countries"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94a3b8]">
                <span className="text-[#1ba3d6]">✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PLAN CARDS ═══ */}
      <section className="px-5 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} featured={plan.featured} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPETITOR COMPARISON ═══ */}
      <section className="bg-[#f8fafc] px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-[26px] font-extrabold tracking-[-0.03em] text-[#020617]">
            What clinics pay separately today
          </h2>
          <p className="mb-8 text-center text-[13px] text-[#475569]">All of this is included in MediHost AI Growth at ₹2,999/month.</p>
          <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 12px 32px -10px rgba(15,23,42,0.07)" }}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["Practo listing", "₹15,000/mo"],
                ["Social media agency", "₹12,000/mo"],
                ["Web developer", "₹30,000 one-time + ₹2k/mo"],
                ["Telecaller (1 person)", "₹15,000/mo"],
                ["WhatsApp Business tool", "₹3,000/mo"],
                ["Google Ads management", "₹8,000/mo"],
              ].map(([item, cost]) => (
                <div key={item} className="flex items-center justify-between rounded-[8px] border border-[#f1f5f9] bg-[#f8fafc] px-4 py-3">
                  <span className="text-[13px] font-semibold text-[#334155]">{item}</span>
                  <span className="text-[12px] font-bold text-[#94a3b8] line-through">{cost}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[10px] border border-[rgba(27,163,214,0.25)] bg-[rgba(27,163,214,0.07)] px-4 py-3 text-center">
              <span className="text-[14px] font-extrabold text-[#0e7ba8]">MediHost AI Growth — ₹2,999/month</span>
              <span className="ml-2 text-[12px] text-[#475569]">includes all of the above + HMS + RCM</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ADD-ONS ═══ */}
      <section className="px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-[26px] font-extrabold tracking-[-0.03em] text-[#020617]">Add-ons & Upgrades</h2>
          <p className="mb-8 text-center text-[13px] text-[#475569]">Expand any plan with exactly what you need. Contact us for pricing.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addons.map((a) => (
              <div key={a.name} className="rounded-[14px] border border-[#e2e8f0] bg-white p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div className="mb-2 text-[22px]">{a.icon}</div>
                <div className="text-[14px] font-extrabold text-[#020617]">{a.name}</div>
                <div className="mt-1 text-[12px] leading-[1.6] text-[#475569]">{a.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="mailto:support@medihostai.com" className="text-[13px] font-bold text-[#1ba3d6] hover:underline">
              Contact us for add-on pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="bg-[#f8fafc] px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-[26px] font-extrabold tracking-[-0.03em] text-[#020617]">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative overflow-hidden px-5 py-20 text-center">
        <div className="pointer-events-none absolute right-[-5%] top-[-5%] h-[50%] w-[50%]" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div className="relative mx-auto max-w-xl">
          <h2 className="mb-4 text-[30px] font-extrabold tracking-[-0.03em] text-[#020617]">
            Ready to launch your<br /><span className="text-[#1ba3d6]">AI-powered clinic?</span>
          </h2>
          <p className="mb-8 text-[14px] leading-[1.7] text-[#475569]">
            14-day free trial on all plans. No credit card required. Set up takes under 5 minutes.
          </p>
          <Link href="/signup" className="inline-block rounded-[10px] px-10 py-4 text-[15px] font-extrabold text-white" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)", boxShadow: "0 10px 24px -6px rgba(124,58,237,0.4)" }}>
            Start your free trial →
          </Link>
          <p className="mt-4 text-[12px] text-[#94a3b8]">Questions? Email us at support@medihostai.com</p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-[#e2e8f0] bg-[#020617] px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px]" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)" }}>
                  <svg viewBox="0 0 100 100" width="20" height="20">
                    <path d="M50 8 L85 22 L85 52 Q85 76 50 92 Q15 76 15 52 L15 22 Z" fill="white" />
                    <path d="M50 30 L50 70 M30 50 L70 50" stroke="#7c3aed" strokeWidth="9" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-[14px] font-extrabold text-white">MediHost™ AI</div>
                  <div className="text-[10px] font-bold text-[#1ba3d6]">AI engine for Healthcare</div>
                </div>
              </div>
              <p className="text-[12px] leading-[1.7] text-[#94a3b8]">
                MediHost AI Technologies Private Limited<br />
                Hyderabad, Telangana, India 500032
              </p>
              <p className="mt-1.5 text-[11px] text-[#64748b]">Patent Application 202641047349</p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#475569]">Product</p>
                <div className="space-y-2">
                  {[["/#features","Features"],["/#modules","Modules"],["/pricing","Pricing"],["/signup","Sign up"],["/login","Login"]].map(([href,label])=>(
                    <Link key={href} href={href} className="block text-[12px] text-[#64748b] hover:text-white">{label}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#475569]">Company</p>
                <div className="space-y-2">
                  {[["/#about","About"],["mailto:support@medihostai.com","Support"],["mailto:saicharankumarpakala@gmail.com","Founder"]].map(([href,label])=>(
                    <Link key={href} href={href} className="block text-[12px] text-[#64748b] hover:text-white">{label}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#475569]">Legal</p>
                <div className="space-y-2">
                  {[["/privacy","Privacy Policy"],["/terms","Terms of Service"],["/refund","Refund Policy"]].map(([href,label])=>(
                    <Link key={href} href={href} className="block text-[12px] text-[#64748b] hover:text-white">{label}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#1e293b] pt-6">
            <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
              <p className="text-[11px] text-[#475569]">© 2026 MediHost AI Technologies Private Limited · Made with love in Hyderabad, India</p>
              <div className="flex flex-wrap gap-1.5">
                {["HIPAA","DPDPA","ABDM","NABH","GDPR"].map((b)=>(
                  <span key={b} className="flex items-center gap-1 rounded-full border border-[#1e293b] px-2 py-0.5 text-[9px] font-bold text-[#475569]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1ba3d6]" />{b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
