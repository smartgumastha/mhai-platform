import Link from 'next/link';

export const metadata = { title: 'About Us — MediHost™ AI' };

function Logo() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-[8px]" style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#ec4899 100%)' }}>
      <svg viewBox="0 0 100 100" width="18" height="18">
        <path d="M50 8 L85 22 L85 52 Q85 76 50 92 Q15 76 15 52 L15 22 Z" fill="white" />
        <path d="M50 30 L50 70 M30 50 L70 50" stroke="#7c3aed" strokeWidth="8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e0f0fa] bg-[#f0f9ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0e7ba8]">
      {children}
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-6 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04),0 8px 24px -8px rgba(15,23,42,0.08)' }}>
      <div className="text-[32px] font-extrabold tracking-[-0.03em] text-[#7c3aed]">{value}</div>
      <div className="mt-1 text-[12px] font-semibold text-[#64748b]">{label}</div>
    </div>
  );
}

function ValueCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04),0 8px 24px -8px rgba(15,23,42,0.08)' }}>
      <div className="mb-3 text-[28px]">{icon}</div>
      <div className="mb-1.5 text-[15px] font-extrabold text-[#020617]">{title}</div>
      <div className="text-[13px] leading-[1.7] text-[#64748b]">{body}</div>
    </div>
  );
}

function Milestone({ year, text }: { year: string; text: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-[11px] font-extrabold text-white">{year}</div>
        <div className="mt-1 w-px flex-1 bg-[#e2e8f0]" />
      </div>
      <p className="pb-6 pt-1.5 text-[14px] leading-[1.7] text-[#475569]">{text}</p>
    </div>
  );
}

const countries = ['India','UAE','United Kingdom','Kenya','Singapore','Australia','Canada','Germany'];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#e2e8f0] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-[14px] font-extrabold tracking-[-0.03em] text-[#020617]">MediHost™ AI</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/founder" className="text-[13px] font-semibold text-[#475569] hover:text-[#020617]">Founder</Link>
            <Link href="/contact" className="text-[13px] font-semibold text-[#475569] hover:text-[#020617]">Contact</Link>
            <Link href="/" className="text-[13px] font-semibold text-[#475569] hover:text-[#020617]">← Home</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#f8fafc] px-5 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <Pill>About us</Pill>
          <h1 className="mt-5 text-[40px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#020617]">
            Built in Hyderabad.<br />
            <span style={{ background: 'linear-gradient(135deg,#7c3aed,#1ba3d6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Built for the world.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-[1.8] text-[#475569]">
            MediHost AI Technologies Private Limited is on a mission to give every independent clinic —
            from a single-room GP practice to a 20-bed multispecialty centre — the same AI-powered
            infrastructure that large hospital chains have, without the enterprise price tag or the
            six-month implementation timeline.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['Founded 2024','Hyderabad, India','Patent Pending 202641047349','9 Countries'].map((t) => (
              <span key={t} className="rounded-full border border-[#e2e8f0] bg-white px-3 py-1 text-[11px] font-semibold text-[#64748b]">{t}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 py-16 space-y-20">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat value="9" label="Countries supported" />
          <Stat value="39+" label="Platform modules" />
          <Stat value="2024" label="Year founded" />
          <Stat value="1" label="Patent pending" />
        </div>

        {/* Mission & Vision */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[20px] p-8" style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#ec4899 100%)' }}>
            <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.1em] text-white/70">Our Mission</div>
            <p className="text-[18px] font-extrabold leading-[1.4] text-white">
              Democratise healthcare technology for independent clinics everywhere.
            </p>
            <p className="mt-4 text-[13px] leading-[1.7] text-white/80">
              We believe that a rural clinic in Andhra Pradesh deserves the same billing intelligence,
              patient management tools, and AI-assisted diagnostics as a private hospital in London.
              Technology should not be a privilege of scale.
            </p>
          </div>
          <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-8">
            <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#475569]">Our Vision</div>
            <p className="text-[18px] font-extrabold leading-[1.4] text-[#020617]">
              Every doctor in the world, one click away from a fully operational clinic online.
            </p>
            <p className="mt-4 text-[13px] leading-[1.7] text-[#475569]">
              We are building the Shopify for healthcare — a platform where AI generates everything:
              the clinic website, appointment system, billing workflows, prescription templates,
              and patient marketing. The doctor only hits Publish.
            </p>
          </div>
        </div>

        {/* What We Build */}
        <div>
          <div className="mb-2 text-center"><Pill>What we build</Pill></div>
          <h2 className="mb-10 mt-4 text-center text-[28px] font-extrabold tracking-[-0.03em] text-[#020617]">
            One platform. Every clinical workflow.
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ValueCard icon="🏥" title="Hospital Management System" body="Token queue, vitals capture, EMR, prescriptions, discharge summaries — end-to-end OPD and IPD flow in one dashboard." />
            <ValueCard icon="💳" title="Multi-Market Billing & RCM" body="CGHS, NABH, NHA, NHCX claim formats for India. UB-04/837I for the US. VAT invoicing for UAE/UK. Auto-adjudication for all markets." />
            <ValueCard icon="🤖" title="AI Marketing Engine" body="One-click Google Business Profile, AI-generated social posts, WhatsApp follow-up campaigns, and patient recall automation." />
            <ValueCard icon="🆔" title="ABDM / ABHA Integration" body="M1 ABHA creation via Aadhaar OTP, M2 linking for existing health IDs, FHIR-compliant consent artefacts and health record sharing." />
            <ValueCard icon="🌍" title="9-Country Compliance" body="Built-in regulatory frameworks for India, UAE, UK, Kenya, Singapore, Australia, Canada, Germany, and Saudi Arabia." />
            <ValueCard icon="📱" title="Patient-Facing Apps" body="Clinic storefronts, online appointment booking, WhatsApp reminders, digital prescriptions, and Hemato lab integration for home sample collection." />
          </div>
        </div>

        {/* Countries */}
        <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-10 text-center">
          <Pill>Global reach</Pill>
          <h2 className="mb-3 mt-4 text-[24px] font-extrabold tracking-[-0.03em] text-[#020617]">Serving clinics across 9 countries</h2>
          <p className="mx-auto mb-8 max-w-xl text-[13px] leading-[1.7] text-[#64748b]">
            Full local compliance, localised billing formats, and country-specific regulatory support
            built directly into the platform — not bolted on as an afterthought.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {countries.map((c) => (
              <span key={c} className="rounded-full border border-[#dbeafe] bg-white px-4 py-1.5 text-[13px] font-semibold text-[#1e40af]">{c}</span>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div>
          <div className="mb-2"><Pill>Our journey</Pill></div>
          <h2 className="mb-10 mt-4 text-[28px] font-extrabold tracking-[-0.03em] text-[#020617]">How we got here</h2>
          <div className="max-w-2xl">
            <Milestone year="'09" text="Sai Charan Kumar Pakala completes BPTh from Sri Venkateswara Institute of Medical Sciences, Tirupati. Begins clinical practice as a physiotherapist." />
            <Milestone year="'10" text="Masters in Hospital Administration from Tata Institute of Social Sciences, Mumbai. Pivots from clinical practice to healthcare operations and IT." />
            <Milestone year="'12" text="Over a decade of hands-on experience managing HMS deployments, clinical workflows, and healthcare IT projects across hospitals in India." />
            <Milestone year="'23" text="Observes a consistent gap: independent clinics lack affordable, compliant, AI-ready software. Begins architecting MediHost as a solution." />
            <Milestone year="'24" text="MediHost AI Technologies Private Limited incorporated. Platform launched with HMS, billing, and AI marketing modules. Patent application 202641047349 filed." />
            <Milestone year="'25" text="Platform expands to 9 countries. ABDM/ABHA integration added. FHIR-compliant consent and health record sharing goes live. Multi-market RCM (India, US, UAE, UK) shipped." />
            <Milestone year="'26" text="NHCX integration and NHA sandbox approval in progress. Hemato lab marketplace, AI appointment engine, and clinic storefront builder in active development." />
          </div>
        </div>

        {/* Values */}
        <div>
          <div className="mb-2"><Pill>Our values</Pill></div>
          <h2 className="mb-10 mt-4 text-[28px] font-extrabold tracking-[-0.03em] text-[#020617]">What we stand for</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ValueCard icon="⚡" title="Zero setup friction" body="A clinic should be online in 5 minutes. No IT team, no integrations checklist, no consultant." />
            <ValueCard icon="🔒" title="Privacy first" body="Patient data is never sold or used for advertising. DPDP Act 2023 compliance is non-negotiable." />
            <ValueCard icon="🌐" title="Local compliance" body="Every regulation in every market we operate in is a first-class feature, not an afterthought." />
            <ValueCard icon="❤️" title="Healthcare is human" body="We build tools that free doctors to spend more time with patients, not more time with software." />
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-[24px] p-10 text-center" style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#ec4899 100%)' }}>
          <h2 className="text-[26px] font-extrabold text-white">Ready to see it live?</h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-[1.7] text-white/80">
            Sign up free. Your clinic dashboard is live in under 5 minutes. No credit card required.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="rounded-[10px] bg-white px-8 py-3 text-[14px] font-extrabold text-[#7c3aed] hover:bg-[#f8fafc]">
              Start for free →
            </Link>
            <Link href="/founder" className="rounded-[10px] border border-white/30 px-8 py-3 text-[14px] font-semibold text-white hover:bg-white/10">
              Meet the founder
            </Link>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-[#e2e8f0] bg-[#f8fafc] px-5 py-10 text-center">
        <p className="text-[12px] text-[#94a3b8]">
          © 2026 MediHost AI Technologies Private Limited · Hyderabad, India ·{' '}
          <Link href="/privacy" className="hover:text-[#1ba3d6]">Privacy</Link> ·{' '}
          <Link href="/terms" className="hover:text-[#1ba3d6]">Terms</Link> ·{' '}
          <Link href="/contact" className="hover:text-[#1ba3d6]">Contact</Link>
        </p>
      </footer>
    </div>
  );
}
