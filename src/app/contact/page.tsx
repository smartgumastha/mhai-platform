import Link from 'next/link';

export const metadata = { title: 'Contact Us — MediHost™ AI' };

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

function ContactCard({ icon, title, value, href, sub }: { icon: string; title: string; value: string; href?: string; sub?: string }) {
  return (
    <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04),0 8px 24px -8px rgba(15,23,42,0.06)' }}>
      <div className="mb-3 text-[26px]">{icon}</div>
      <div className="mb-1 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#94a3b8]">{title}</div>
      {href ? (
        <a href={href} className="text-[14px] font-semibold text-[#1ba3d6] hover:underline">{value}</a>
      ) : (
        <div className="text-[14px] font-semibold text-[#020617]">{value}</div>
      )}
      {sub && <div className="mt-1 text-[12px] text-[#94a3b8]">{sub}</div>}
    </div>
  );
}

export default function ContactPage() {
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
            <Link href="/about" className="text-[13px] font-semibold text-[#475569] hover:text-[#020617]">About</Link>
            <Link href="/founder" className="text-[13px] font-semibold text-[#475569] hover:text-[#020617]">Founder</Link>
            <Link href="/" className="text-[13px] font-semibold text-[#475569] hover:text-[#020617]">← Home</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#f8fafc] px-5 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <Pill>Get in touch</Pill>
          <h1 className="mt-5 text-[36px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#020617]">
            We&apos;re here to help.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-[1.8] text-[#475569]">
            Whether you&apos;re a clinic looking to get started, a partner exploring integration,
            or a journalist covering healthcare technology — reach out and a real human will respond.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 py-14 space-y-14">

        {/* Contact cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ContactCard
            icon="📧"
            title="General support"
            value="support@medihostai.com"
            href="mailto:support@medihostai.com"
            sub="Reply within 24 hours"
          />
          <ContactCard
            icon="👤"
            title="Founder direct"
            value="saicharankumarpakala@gmail.com"
            href="mailto:saicharankumarpakala@gmail.com"
            sub="Partnerships · Press · Strategy"
          />
          <ContactCard
            icon="📍"
            title="Registered office"
            value="Hyderabad, Telangana"
            sub="India · 500 072"
          />
          <ContactCard
            icon="🏢"
            title="Legal entity"
            value="MediHost AI Technologies Private Limited"
            sub="CIN under MCA, India"
          />
          <ContactCard
            icon="⚖️"
            title="Grievance officer"
            value="Sai Charan Kumar Pakala"
            href="mailto:saicharankumarpakala@gmail.com"
            sub="DPDP Act 2023 · respond within 30 days"
          />
          <ContactCard
            icon="🌐"
            title="Platform"
            value="medihost.in"
            href="https://medihost.in"
            sub="Login · Dashboard · Signup"
          />
        </div>

        {/* Department routing */}
        <div>
          <Pill>Who to write to</Pill>
          <h2 className="mb-6 mt-4 text-[22px] font-extrabold tracking-[-0.03em] text-[#020617]">
            Reach the right team
          </h2>
          <div className="overflow-hidden rounded-[16px] border border-[#e2e8f0]">
            {[
              { topic: 'Getting started / onboarding', email: 'support@medihostai.com', sla: '< 24 h' },
              { topic: 'Billing & subscription', email: 'support@medihostai.com', sla: '< 24 h' },
              { topic: 'Technical / API integration', email: 'support@medihostai.com', sla: '< 48 h' },
              { topic: 'Partnership & reseller enquiry', email: 'saicharankumarpakala@gmail.com', sla: '< 48 h' },
              { topic: 'Press & media', email: 'saicharankumarpakala@gmail.com', sla: '< 48 h' },
              { topic: 'Data privacy / DPDP complaint', email: 'saicharankumarpakala@gmail.com', sla: '30 days (statutory)' },
              { topic: 'ABDM / NHA / government liaison', email: 'support@medihostai.com', sla: '< 48 h' },
            ].map((row, i) => (
              <div key={i} className={`flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}`}>
                <div className="text-[13px] font-semibold text-[#020617]">{row.topic}</div>
                <div className="flex flex-wrap items-center gap-4">
                  <a href={`mailto:${row.email}`} className="text-[12px] font-mono text-[#1ba3d6] hover:underline">{row.email}</a>
                  <span className="rounded-full bg-[#f0fdf4] px-2.5 py-0.5 text-[10px] font-bold text-[#16a34a]">{row.sla}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operating hours */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-7" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="mb-4 text-[24px]">🕐</div>
            <h3 className="mb-2 text-[16px] font-extrabold text-[#020617]">Support hours</h3>
            <div className="space-y-2 text-[13px] text-[#64748b]">
              <div className="flex justify-between">
                <span>Monday – Friday</span>
                <span className="font-semibold text-[#020617]">9:00 AM – 6:00 PM IST</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday</span>
                <span className="font-semibold text-[#020617]">10:00 AM – 2:00 PM IST</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday / Public holidays</span>
                <span className="font-semibold text-[#94a3b8]">Closed</span>
              </div>
              <p className="mt-3 text-[12px] text-[#94a3b8]">
                Emails outside hours are queued and answered the next business day.
                Critical platform issues are monitored 24 × 7 via Railway alerting.
              </p>
            </div>
          </div>

          <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-7" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="mb-4 text-[24px]">📍</div>
            <h3 className="mb-2 text-[16px] font-extrabold text-[#020617]">Registered address</h3>
            <address className="text-[13px] not-italic leading-[1.9] text-[#64748b]">
              MediHost AI Technologies Private Limited<br />
              Hyderabad, Telangana — 500 072<br />
              India
            </address>
            <div className="mt-4 text-[12px] text-[#94a3b8]">
              <span className="font-semibold text-[#475569]">Jurisdiction:</span> Courts at Hyderabad, Telangana, India
            </div>
            <div className="mt-1 text-[12px] text-[#94a3b8]">
              <span className="font-semibold text-[#475569]">Governing law:</span> Information Technology Act 2000, DPDP Act 2023
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] p-8 text-center">
          <h2 className="mb-2 text-[20px] font-extrabold text-[#020617]">Before you write</h2>
          <p className="mb-6 text-[13px] text-[#64748b]">Many questions are answered in our documentation and policies.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              ['/privacy', 'Privacy Policy'],
              ['/terms', 'Terms of Service'],
              ['/refund', 'Refund Policy'],
              ['/pricing', 'Pricing & Plans'],
              ['/about', 'About the company'],
              ['/founder', 'Meet the founder'],
            ].map(([href, label]) => (
              <Link key={href} href={href}
                className="rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-2 text-[13px] font-semibold text-[#475569] hover:border-[#1ba3d6] hover:text-[#1ba3d6]">
                {label}
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-[#e2e8f0] bg-[#f8fafc] px-5 py-10 text-center">
        <p className="text-[12px] text-[#94a3b8]">
          © 2026 MediHost AI Technologies Private Limited · Hyderabad, India ·{' '}
          <Link href="/privacy" className="hover:text-[#1ba3d6]">Privacy</Link> ·{' '}
          <Link href="/terms" className="hover:text-[#1ba3d6]">Terms</Link> ·{' '}
          <Link href="/refund" className="hover:text-[#1ba3d6]">Refund</Link>
        </p>
      </footer>
    </div>
  );
}
