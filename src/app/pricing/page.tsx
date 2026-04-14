"use client";

import { useState } from "react";

/* ── plan data ── */
type Feature = { text: string; included: boolean; addon?: boolean };
type Section = { title: string; features: Feature[] };
type Plan = {
  name: string;
  tagline: string;
  monthly: string;
  yearlyMo: string;
  yearlyTotal: string;
  isFree?: boolean;
  isEnterprise?: boolean;
  popular?: boolean;
  cta: string;
  ctaClass: string;
  sections: Section[];
};

var plans: Plan[] = [
  {
    name: "Free",
    tagline: "Get started, no credit card",
    monthly: "Free",
    yearlyMo: "Free",
    yearlyTotal: "",
    isFree: true,
    cta: "Start free",
    ctaClass: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    sections: [
      {
        title: "Marketing",
        features: [
          { text: "AI website (MHAI branded)", included: true },
          { text: "Google Business Profile", included: true },
          { text: "3 AI review replies/mo", included: true },
          { text: "Basic booking page", included: true },
        ],
      },
      { title: "MHAI Pay", features: [{ text: "Payment links (2% fee)", included: true }] },
      { title: "Receptionist", features: [{ text: "Website chatbot (50 chats/mo)", included: true }] },
      { title: "Caller", features: [{ text: "Not included", included: false }] },
      { title: "HMS", features: [{ text: "Not included", included: false }] },
    ],
  },
  {
    name: "Pro",
    tagline: "For growing clinics",
    monthly: "$29",
    yearlyMo: "$24",
    yearlyTotal: "$290/year",
    cta: "Start 14-day trial",
    ctaClass: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm",
    sections: [
      {
        title: "Marketing",
        features: [
          { text: "Custom domain + AI website", included: true },
          { text: "Unlimited reviews + AI replies", included: true },
          { text: "Social posts (all platforms)", included: true },
          { text: "WhatsApp + SMS (100/mo)", included: true },
          { text: "SEO + AEO + AI blog", included: true },
          { text: "Patient CRM", included: true },
        ],
      },
      {
        title: "MHAI Pay",
        features: [
          { text: "Payment links (1.5% fee)", included: true },
          { text: "Deposits + auto-invoice", included: true },
        ],
      },
      {
        title: "Receptionist",
        features: [
          { text: "Website + WhatsApp bot", included: true },
          { text: "Booking + FAQ", included: true },
        ],
      },
      { title: "Caller", features: [{ text: "$19/mo", included: true, addon: true }] },
      { title: "HMS", features: [{ text: "$19/mo", included: true, addon: true }] },
    ],
  },
  {
    name: "Business",
    tagline: "Full autopilot marketing",
    monthly: "$99",
    yearlyMo: "$82",
    yearlyTotal: "$990/year",
    popular: true,
    cta: "Start 14-day trial",
    ctaClass: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md",
    sections: [
      {
        title: "Marketing",
        features: [
          { text: "Everything in Pro + autopilot", included: true },
          { text: "Google + Meta Ads", included: true },
          { text: "Print studio + field marketing", included: true },
          { text: "Team hub (5 seats)", included: true },
          { text: "Referral network", included: true },
        ],
      },
      {
        title: "MHAI Pay",
        features: [
          { text: "All payments (1% fee)", included: true },
          { text: "EMI + Collections AI", included: true },
          { text: "Revenue dashboard", included: true },
        ],
      },
      {
        title: "Receptionist",
        features: [
          { text: "All channels + triage", included: true },
          { text: "In-chat payments + voice", included: true },
          { text: "Multilingual", included: true },
        ],
      },
      { title: "Caller", features: [{ text: "3 seats + AI scripts + campaigns", included: true }] },
      { title: "HMS", features: [{ text: "OPD + billing + Rx + lab", included: true }] },
    ],
  },
  {
    name: "Enterprise",
    tagline: "Hospital chains & groups",
    monthly: "Custom",
    yearlyMo: "Custom",
    yearlyTotal: "",
    isEnterprise: true,
    cta: "Contact sales",
    ctaClass: "bg-gray-900 text-white hover:bg-gray-800",
    sections: [
      {
        title: "Marketing",
        features: [
          { text: "Unlimited branches + command center", included: true },
          { text: "White-label option", included: true },
        ],
      },
      { title: "MHAI Pay", features: [{ text: "0.5% fee + multi-branch settlements", included: true }] },
      { title: "Receptionist", features: [{ text: "Unlimited + custom AI training", included: true }] },
      { title: "Caller", features: [{ text: "Unlimited seats + AI auto-caller", included: true }] },
      { title: "HMS", features: [{ text: "Full suite + NHCX + ABDM + dedicated manager", included: true }] },
    ],
  },
];

var addons = [
  { name: "HMS", desc: "OPD, billing, Rx, lab — full hospital management", price: "$19/mo" },
  { name: "Caller", desc: "AI-powered telecalling with scripts and campaigns", price: "$19/mo" },
  { name: "Extra seats", desc: "Additional team member seats for your plan", price: "$5/seat" },
  { name: "SMS pack", desc: "500 SMS credits for reminders and campaigns", price: "$9" },
  { name: "Intelligence", desc: "Advanced analytics, competitor watch, AI insights", price: "$29/mo" },
  { name: "Extra chats", desc: "500 additional chatbot conversations per month", price: "$9/500" },
];

var localPricing = [
  { country: "India", flag: "🇮🇳", plans: ["₹999", "₹2,999", "₹7,999"] },
  { country: "UK", flag: "🇬🇧", plans: ["£25", "£79", "£199"] },
  { country: "Kenya", flag: "🇰🇪", plans: ["KSh 2,999", "KSh 9,999", "KSh 29,999"] },
];

var faqs = [
  { q: "Can I start free?", a: "Yes, no credit card required. Start with our Free plan and upgrade anytime as your clinic grows." },
  { q: "What happens after the 14-day trial?", a: "You can continue on the Free plan forever, or choose a paid plan. No surprise charges." },
  { q: "How does the transaction fee work?", a: "2% on Free, 1.5% on Pro, 1% on Business, 0.5% on Enterprise. Applied only to payments processed through MHAI Pay." },
  { q: "Can I use MHAI without HMS?", a: "Yes, HMS is an optional add-on. MHAI works perfectly for marketing, payments, and patient engagement without it." },
  { q: "Do you support multiple branches?", a: "Business plan supports 3 branches. Enterprise plan supports unlimited branches with a central command center." },
  { q: "Is patient data safe?", a: "Absolutely. We are HIPAA and GDPR compliant. All data is encrypted at rest and in transit. We never share or sell patient data." },
];

export default function PricingPage() {
  var [isYearly, setIsYearly] = useState(false);
  var [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="flex items-center justify-between border-b border-gray-100 px-8 py-4">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-[9px] font-bold text-white">MHAI</div>
          <span className="text-lg font-semibold text-gray-900">MediHost AI</span>
        </a>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-sm text-gray-500 transition-colors hover:text-gray-900">Login</a>
          <a href="/signup" className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md">Start free →</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-8 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Every tool your clinic needs.<br />
          <span className="text-emerald-500">One price.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-gray-500">
          AI marketing + payments + chatbot + telecaller + HMS.
        </p>

        {/* Toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!isYearly ? "text-gray-900" : "text-gray-400"}`}>Monthly</span>
          <div
            onClick={() => setIsYearly(!isYearly)}
            className={`flex h-6 w-11 cursor-pointer items-center rounded-full px-0.5 transition-colors duration-200 ${isYearly ? "bg-emerald-500" : "bg-gray-300"}`}
          >
            <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${isYearly ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
          <span className={`text-sm font-medium ${isYearly ? "text-gray-900" : "text-gray-400"}`}>Yearly</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">Save 20%</span>
        </div>
      </section>

      {/* PRICING GRID */}
      <section className="mx-auto mt-2 max-w-6xl px-8">
        <div className="grid grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl bg-white transition-all duration-200 hover:shadow-lg ${
                plan.popular
                  ? "border-2 border-emerald-500 shadow-md"
                  : "border border-gray-100 shadow-sm"
              }`}
            >
              {plan.popular && (
                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 px-4 py-1 text-[10px] font-medium text-white">
                  Most popular
                </span>
              )}

              {/* Header */}
              <div className="p-6">
                <div className="text-lg font-semibold text-gray-900">{plan.name}</div>
                <div className="mt-1 text-[13px] text-gray-500">{plan.tagline}</div>
                <div className="mt-4">
                  {plan.isFree ? (
                    <>
                      <span className="text-4xl font-bold text-gray-900">Free</span>
                      <span className="block text-sm text-gray-400">forever</span>
                    </>
                  ) : plan.isEnterprise ? (
                    <span className="text-3xl font-bold text-gray-900">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-gray-900">
                        {isYearly ? plan.yearlyMo : plan.monthly}
                      </span>
                      <span className="text-sm text-gray-400">/mo</span>
                      {isYearly && plan.yearlyTotal && (
                        <span className="mt-1 block text-[11px] text-gray-400">
                          Billed {plan.yearlyTotal}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <a
                  href="/signup"
                  className={`mt-4 block w-full rounded-xl py-3 text-center text-sm font-medium transition-all duration-200 ${plan.ctaClass}`}
                >
                  {plan.cta}
                </a>
              </div>

              {/* Feature sections */}
              <div className="flex-1">
                {plan.sections.map((sec) => (
                  <div key={sec.title}>
                    <div className="bg-gray-50 px-5 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                      {sec.title}
                    </div>
                    {sec.features.map((f, fi) => (
                      <div
                        key={fi}
                        className={`flex items-start gap-2 border-b border-gray-50 px-5 py-2 text-[12px] last:border-0`}
                      >
                        <span className={f.included ? "text-emerald-500" : "text-gray-300"}>
                          {f.included ? "✓" : "—"}
                        </span>
                        <span className={f.included ? "text-gray-700" : "text-gray-400"}>
                          {f.text}
                          {f.addon && (
                            <span className="ml-1 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600">
                              add-on
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ADD-ONS */}
      <section className="mx-auto mt-16 max-w-4xl px-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Add-ons</h2>
        <p className="mt-1 text-gray-500">Expand any plan</p>
        <div className="mt-8 grid grid-cols-3 gap-4">
          {addons.map((a) => (
            <div key={a.name} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="text-sm font-semibold text-gray-900">{a.name}</div>
              <div className="mt-1 text-[12px] text-gray-500">{a.desc}</div>
              <div className="mt-3 text-xl font-bold text-gray-900">{a.price}</div>
            </div>
          ))}
        </div>
      </section>

      {/* LOCAL PRICING */}
      <section className="mx-auto mt-12 max-w-3xl text-center">
        <h2 className="text-lg font-semibold text-gray-900">Local pricing</h2>
        <div className="mt-6 grid grid-cols-3 gap-4 px-8">
          {localPricing.map((lp) => (
            <div key={lp.country} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">
                {lp.flag} {lp.country}
              </div>
              <div className="mt-2 space-y-1">
                {["Pro", "Business", "Enterprise"].map((label, i) => (
                  <div key={label} className="flex justify-between text-[12px]">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-900">{lp.plans[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST LINE */}
      <div className="mt-10 text-center text-[13px] text-gray-500">
        HIPAA/GDPR compliant · 10 languages · Cancel anytime · Free migration
      </div>

      {/* FAQ */}
      <section className="mx-auto mt-16 max-w-3xl px-8 pb-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-gray-900">{faq.q}</span>
                <span className={`text-gray-400 transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              {openFaq === i && (
                <div className="border-t border-gray-50 px-5 pb-4 pt-2 text-[13px] leading-relaxed text-gray-600">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex items-center justify-between bg-gray-900 px-8 py-6 text-sm text-gray-400">
        <span>© 2026 SmartGumastha Technologies Pvt Ltd</span>
        <div className="flex gap-4">
          <a href="/privacy" className="transition-colors hover:text-gray-200">Privacy</a>
          <a href="/terms" className="transition-colors hover:text-gray-200">Terms</a>
          <a href="/support" className="transition-colors hover:text-gray-200">Contact</a>
        </div>
      </footer>
    </div>
  );
}
