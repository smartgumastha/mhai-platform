"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/app/providers/locale-context";

/* ── currency system ── */
type PricingTier = {
  symbol: string;
  locale: string;
  country: string;
  pro: number;
  business: number;
  proYearly: number;
  businessYearly: number;
  payFree: string;
  payPro: string;
  payBusiness: string;
  payEnterprise: string;
};

var pricing: Record<string, PricingTier> = {
  IN: {
    symbol: "₹", locale: "en-IN", country: "India",
    pro: 2999, business: 7999, proYearly: 2499, businessYearly: 6666,
    payFree: "2%", payPro: "1.5%", payBusiness: "1%", payEnterprise: "0.5%",
  },
  US: {
    symbol: "$", locale: "en-US", country: "United States",
    pro: 29, business: 99, proYearly: 24, businessYearly: 82,
    payFree: "2%", payPro: "1.5%", payBusiness: "1%", payEnterprise: "0.5%",
  },
  GB: {
    symbol: "£", locale: "en-GB", country: "United Kingdom",
    pro: 25, business: 79, proYearly: 21, businessYearly: 66,
    payFree: "2%", payPro: "1.5%", payBusiness: "1%", payEnterprise: "0.5%",
  },
  AE: {
    symbol: "AED ", locale: "en-AE", country: "UAE",
    pro: 109, business: 369, proYearly: 91, businessYearly: 308,
    payFree: "2%", payPro: "1.5%", payBusiness: "1%", payEnterprise: "0.5%",
  },
  KE: {
    symbol: "KSh ", locale: "en-KE", country: "Kenya",
    pro: 2999, business: 9999, proYearly: 2499, businessYearly: 8333,
    payFree: "2%", payPro: "1.5%", payBusiness: "1%", payEnterprise: "0.5%",
  },
};

type AddonPrices = { hms: number; caller: number; seat: number; sms: number; intel: number; chats: number };
var addonPricing: Record<string, AddonPrices> = {
  IN: { hms: 1499, caller: 1499, seat: 399, sms: 699, intel: 2299, chats: 699 },
  US: { hms: 19, caller: 19, seat: 5, sms: 9, intel: 29, chats: 9 },
  GB: { hms: 15, caller: 15, seat: 4, sms: 7, intel: 25, chats: 7 },
  AE: { hms: 69, caller: 69, seat: 19, sms: 35, intel: 109, chats: 35 },
  KE: { hms: 1999, caller: 1999, seat: 499, sms: 899, intel: 2999, chats: 899 },
};

function fmt(amount: number, locale: string) {
  return amount.toLocaleString(locale);
}

var countryKeys = Object.keys(pricing);

/* ── feature data builder ── */
type Feat = { text: string; included: boolean; addon?: boolean };
type Sec = { title: string; dot: string; features: Feat[] };

function buildSections(p: PricingTier, plan: "free" | "pro" | "business" | "enterprise"): Sec[] {
  var ap = addonPricing[countryKeys.find((k) => pricing[k] === p) || "IN"] || addonPricing.IN;
  if (plan === "free") return [
    { title: "Marketing", dot: "bg-emerald-500", features: [
      { text: "AI website (MHAI branded)", included: true },
      { text: "Google Business Profile", included: true },
      { text: "3 AI review replies/mo", included: true },
      { text: "Basic booking page", included: true },
    ]},
    { title: "MHAI Pay", dot: "bg-blue-500", features: [{ text: `Payment links (${p.payFree} fee)`, included: true }] },
    { title: "Receptionist", dot: "bg-purple-500", features: [{ text: "Website chatbot (50 chats/mo)", included: true }] },
    { title: "Caller", dot: "bg-amber-500", features: [{ text: "Not included", included: false }] },
    { title: "HMS", dot: "bg-red-500", features: [{ text: "Not included", included: false }] },
  ];
  if (plan === "pro") return [
    { title: "Marketing", dot: "bg-emerald-500", features: [
      { text: "Custom domain + AI website", included: true },
      { text: "Unlimited reviews + AI replies", included: true },
      { text: "Social posts (all platforms)", included: true },
      { text: "WhatsApp + SMS (100/mo)", included: true },
      { text: "SEO + AEO + AI blog", included: true },
      { text: "Patient CRM", included: true },
    ]},
    { title: "MHAI Pay", dot: "bg-blue-500", features: [
      { text: `Payment links (${p.payPro} fee)`, included: true },
      { text: "Deposits + auto-invoice", included: true },
    ]},
    { title: "Receptionist", dot: "bg-purple-500", features: [
      { text: "Website + WhatsApp bot", included: true },
      { text: "Booking + FAQ", included: true },
    ]},
    { title: "Caller", dot: "bg-amber-500", features: [{ text: `${p.symbol}${fmt(ap.caller, p.locale)}/mo`, included: true, addon: true }] },
    { title: "HMS", dot: "bg-red-500", features: [{ text: `${p.symbol}${fmt(ap.hms, p.locale)}/mo`, included: true, addon: true }] },
  ];
  if (plan === "business") return [
    { title: "Marketing", dot: "bg-emerald-500", features: [
      { text: "Everything in Pro + autopilot", included: true },
      { text: "Google + Meta Ads", included: true },
      { text: "Print studio + field marketing", included: true },
      { text: "Team hub (5 seats)", included: true },
      { text: "Referral network", included: true },
    ]},
    { title: "MHAI Pay", dot: "bg-blue-500", features: [
      { text: `All payments (${p.payBusiness} fee)`, included: true },
      { text: "EMI + Collections AI", included: true },
      { text: "Revenue dashboard", included: true },
    ]},
    { title: "Receptionist", dot: "bg-purple-500", features: [
      { text: "All channels + triage", included: true },
      { text: "In-chat payments + voice", included: true },
      { text: "Multilingual", included: true },
    ]},
    { title: "Caller", dot: "bg-amber-500", features: [{ text: "3 seats + AI scripts + campaigns", included: true }] },
    { title: "HMS", dot: "bg-red-500", features: [{ text: "OPD + billing + Rx + lab", included: true }] },
  ];
  return [
    { title: "Marketing", dot: "bg-emerald-500", features: [
      { text: "Unlimited branches + command center", included: true },
      { text: "White-label option", included: true },
    ]},
    { title: "MHAI Pay", dot: "bg-blue-500", features: [{ text: `${p.payEnterprise} fee + multi-branch`, included: true }] },
    { title: "Receptionist", dot: "bg-purple-500", features: [{ text: "Unlimited + custom AI training", included: true }] },
    { title: "Caller", dot: "bg-amber-500", features: [{ text: "Unlimited seats + AI auto-caller", included: true }] },
    { title: "HMS", dot: "bg-red-500", features: [{ text: "Full suite + NHCX + ABDM + dedicated manager", included: true }] },
  ];
}

var faqs = [
  { q: "Can I start free?", a: "Yes, no credit card required. Start with our Free plan and upgrade anytime as your clinic grows." },
  { q: "What happens after the 14-day trial?", a: "You can continue on the Free plan forever, or choose a paid plan. No surprise charges." },
  { q: "How does the transaction fee work?", a: "2% on Free, 1.5% on Pro, 1% on Business, 0.5% on Enterprise. Applied only to payments processed through MHAI Pay." },
  { q: "Can I use MHAI without HMS?", a: "Yes, HMS is an optional add-on. MHAI works perfectly for marketing, payments, and patient engagement without it." },
  { q: "Do you support multiple branches?", a: "Business plan supports 3 branches. Enterprise plan supports unlimited branches with a central command center." },
  { q: "Is patient data safe?", a: "Absolutely. We are HIPAA and GDPR compliant. All data is encrypted at rest and in transit. We never share or sell patient data." },
];

export default function PricingPage() {
  var { country } = useLocale();
  var [isYearly, setIsYearly] = useState(false);
  var [openFaq, setOpenFaq] = useState<number | null>(null);

  var p = pricing[country] || pricing.IN;
  var ap = addonPricing[country] || addonPricing.IN;
  var proPrice = isYearly ? p.proYearly : p.pro;
  var bizPrice = isYearly ? p.businessYearly : p.business;

  var cards = [
    {
      name: "Free", tagline: "Get online in 5 minutes", plan: "free" as const,
      price: "Free", sub: "forever", accent: "border-t-gray-300",
      cta: "Start free", ctaClass: "bg-gray-100 text-gray-700 hover:bg-gray-200", ctaHref: "/signup",
    },
    {
      name: "Pro", tagline: "Full AI marketing on autopilot", plan: "pro" as const,
      price: `${p.symbol}${fmt(proPrice, p.locale)}`, sub: "/mo", accent: "border-t-emerald-500",
      yearly: isYearly ? `Billed ${p.symbol}${fmt(p.pro * 10, p.locale)}/year` : "",
      cta: "Start 14-day trial", ctaClass: "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 hover:shadow-md", ctaHref: "/signup",
    },
    {
      name: "Business", tagline: "Complete engine + intelligence", plan: "business" as const,
      price: `${p.symbol}${fmt(bizPrice, p.locale)}`, sub: "/mo", accent: "border-t-emerald-500",
      yearly: isYearly ? `Billed ${p.symbol}${fmt(p.business * 10, p.locale)}/year` : "",
      popular: true,
      cta: "Start 14-day trial", ctaClass: "bg-emerald-500 text-white shadow-md hover:bg-emerald-600 hover:shadow-lg", ctaHref: "/signup",
    },
    {
      name: "Enterprise", tagline: "Multi-branch healthcare empire", plan: "enterprise" as const,
      price: "Custom", sub: "per branch", accent: "border-t-gray-900",
      cta: "Talk to sales", ctaClass: "bg-gray-900 text-white shadow-sm hover:bg-gray-800", ctaHref: "mailto:saicharankumarpakala@gmail.com",
    },
  ];

  var addonCards = [
    { name: "HMS module", desc: "OPD, billing, prescriptions, lab", price: `${p.symbol}${fmt(ap.hms, p.locale)}/mo`, border: "border-l-red-500" },
    { name: "MHAI Caller", desc: "3 telecaller seats + AI scripts", price: `${p.symbol}${fmt(ap.caller, p.locale)}/mo`, border: "border-l-amber-500" },
    { name: "Extra seats", desc: "Beyond included seats", price: `${p.symbol}${fmt(ap.seat, p.locale)}/seat`, border: "border-l-blue-500" },
    { name: "SMS packs", desc: "For review requests + reminders", price: `500 = ${p.symbol}${fmt(ap.sms, p.locale)}`, border: "border-l-green-500" },
    { name: "Intelligence", desc: "Cross-clinic benchmarks", price: `${p.symbol}${fmt(ap.intel, p.locale)}/mo`, border: "border-l-purple-500" },
    { name: "Extra chats", desc: "Beyond plan chatbot limit", price: `${p.symbol}${fmt(ap.chats, p.locale)}/500`, border: "border-l-pink-500" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/80 px-8 py-4 backdrop-blur-sm">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-[10px] font-bold text-white shadow-sm">MHAI</div>
          <span className="text-lg font-semibold text-gray-900">MediHost AI</span>
        </a>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-sm text-gray-500 transition-colors hover:text-gray-900">Login</a>
          <a href="/signup" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md">Start free →</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-b from-emerald-50/40 via-white to-white px-8 pb-10 pt-20 text-center">
        <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-900">
          Every tool your clinic needs.
        </h1>
        <div className="mt-1 text-5xl font-bold text-emerald-500">One price.</div>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-500">
          AI marketing + payments + chatbot + telecaller + HMS
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Start free. Upgrade when you&apos;re ready. Cancel anytime.
        </p>

        {/* Toggle */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!isYearly ? "text-gray-900" : "text-gray-400"}`}>Monthly</span>
          <div
            onClick={() => setIsYearly(!isYearly)}
            className={`flex h-6 w-12 cursor-pointer items-center rounded-full transition-colors duration-300 ${isYearly ? "bg-emerald-500" : "bg-gray-300"}`}
          >
            <div
              className="h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300"
              style={{ transform: isYearly ? "translateX(24px)" : "translateX(2px)" }}
            />
          </div>
          <span className={`text-sm font-medium ${isYearly ? "text-gray-900" : "text-gray-400"}`}>Yearly</span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-medium text-emerald-700">Save 20%</span>
        </div>

        {/* Trust strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          {["Patent filed", "HIPAA compliant", "GDPR ready", "10 languages", "Cancel anytime"].map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="text-emerald-500">✓</span> {t}
            </span>
          ))}
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="mx-auto mt-10 max-w-6xl px-8">
        <div className="grid grid-cols-4 gap-5">
          {cards.map((card) => {
            var sections = buildSections(p, card.plan);
            return (
              <div
                key={card.name}
                className={`relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:shadow-xl ${
                  card.popular
                    ? "border-2 border-emerald-500 shadow-lg"
                    : `border border-gray-100 shadow-sm border-t-[3px] ${card.accent}`
                }`}
              >
                {card.popular && (
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 px-5 py-1.5 text-[11px] font-medium text-white shadow-sm">
                    Most popular
                  </span>
                )}

                {/* Header */}
                <div className="p-7">
                  <div className="text-xl font-bold text-gray-900">{card.name}</div>
                  <div className="mt-1 text-[13px] leading-relaxed text-gray-500">{card.tagline}</div>
                  <div className="mt-5">
                    {card.name === "Free" ? (
                      <>
                        <span className="text-4xl font-bold text-gray-900">Free</span>
                        <span className="ml-1 text-sm text-gray-400">forever</span>
                      </>
                    ) : card.name === "Enterprise" ? (
                      <>
                        <span className="text-3xl font-bold text-gray-900">Custom</span>
                        <span className="ml-1 text-sm text-gray-400">per branch</span>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-gray-900">{card.price}</span>
                        <span className="text-sm text-gray-400">{card.sub}</span>
                        {card.yearly && (
                          <span className="mt-1 block text-[11px] text-gray-400">{card.yearly}</span>
                        )}
                      </>
                    )}
                  </div>
                  <a
                    href={card.ctaHref}
                    className={`mt-5 block w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-all duration-200 ${card.ctaClass}`}
                  >
                    {card.cta}
                  </a>
                </div>

                {/* Features */}
                <div className="flex-1">
                  {sections.map((sec) => (
                    <div key={sec.title}>
                      <div className="flex items-center gap-2 bg-gray-50 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        <span className={`h-1.5 w-1.5 rounded-full ${sec.dot}`} />
                        {sec.title}
                      </div>
                      {sec.features.map((f, fi) => (
                        <div key={fi} className="flex items-start gap-2 px-5 py-2.5 text-[12px]">
                          <span className={`text-sm font-bold ${f.included ? (f.addon ? "text-blue-500" : "text-emerald-500") : "text-gray-200"}`}>
                            {f.included ? "✓" : "—"}
                          </span>
                          <span className={`flex-1 ${f.included ? (f.addon ? "text-gray-600" : "text-gray-700") : "text-gray-300"}`}>
                            {f.text}
                          </span>
                          {f.addon && (
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600">
                              add-on
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ADD-ONS */}
      <section className="mx-auto mt-20 max-w-5xl px-8">
        <h2 className="text-center text-3xl font-bold text-gray-900">Add-ons</h2>
        <p className="mt-2 text-center text-sm text-gray-500">Expand any plan with what you need</p>
        <div className="mt-10 grid grid-cols-3 gap-4">
          {addonCards.map((a) => (
            <div
              key={a.name}
              className={`rounded-2xl border border-gray-100 border-l-[3px] bg-white p-6 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${a.border}`}
            >
              <div className="text-sm font-semibold text-gray-900">{a.name}</div>
              <div className="mt-1 text-[12px] text-gray-500">{a.desc}</div>
              <div className="mt-3 text-xl font-bold text-gray-900">{a.price}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST */}
      <div className="mt-16 text-center text-[13px] text-gray-400">
        HIPAA/GDPR compliant · 10 languages · Cancel anytime · Free migration · 24/7 AI support
      </div>

      {/* FAQ */}
      <section className="mx-auto mt-16 max-w-3xl px-8 pb-16">
        <h2 className="mb-10 text-center text-3xl font-bold text-gray-900">Frequently asked questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full cursor-pointer items-center justify-between px-6 py-5 text-left transition-colors hover:bg-gray-50"
              >
                <span className="text-[14px] font-medium text-gray-900">{faq.q}</span>
                <span className={`text-xl text-gray-400 transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-[13px] leading-relaxed text-gray-600">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex items-center justify-between bg-gray-900 px-8 py-8 text-sm text-gray-500">
        <span>© 2026 SmartGumastha Technologies Pvt Ltd</span>
        <span className="text-gray-400">MHAI — where AI is not a feature, it&apos;s the DNA</span>
        <div className="flex gap-4">
          <a href="/privacy" className="transition-colors hover:text-gray-200">Privacy</a>
          <a href="/terms" className="transition-colors hover:text-gray-200">Terms</a>
          <a href="/support" className="transition-colors hover:text-gray-200">Contact</a>
        </div>
      </footer>
    </div>
  );
}
