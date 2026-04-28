import Link from 'next/link';

export const metadata = { title: 'Founder — Sai Charan Kumar Pakala · MediHost™ AI' };

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

function EduCard({ degree, institution, year, note }: { degree: string; institution: string; year: string; note?: string }) {
  return (
    <div className="flex gap-4 rounded-[14px] border border-[#e2e8f0] bg-white p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f0f9ff] text-[18px]">🎓</div>
      <div>
        <div className="text-[14px] font-extrabold text-[#020617]">{degree}</div>
        <div className="text-[13px] font-semibold text-[#1ba3d6]">{institution}</div>
        <div className="mt-0.5 text-[12px] text-[#94a3b8]">{year}{note ? ' · ' + note : ''}</div>
      </div>
    </div>
  );
}

function QuoteBlock({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="relative rounded-[20px] p-8" style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#ec4899 100%)' }}>
      <svg className="mb-4 opacity-40" width="32" height="24" viewBox="0 0 32 24" fill="white">
        <path d="M0 24V14.4C0 6.4 4.8 1.6 14.4 0l2.4 3.2C10.4 4.8 7.2 8 7.2 14.4H12V24H0zm17.6 0V14.4C17.6 6.4 22.4 1.6 32 0l2.4 3.2c-6.4 1.6-9.6 4.8-9.6 11.2H29.6V24H17.6z" />
      </svg>
      <p className="text-[17px] font-semibold italic leading-[1.7] text-white">{children}</p>
    </blockquote>
  );
}

function SkillChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#475569]">{label}</span>
  );
}

const skills = [
  'Hospital Management Systems','Healthcare IT','Clinical Operations',
  'Physiotherapy & Rehabilitation','Revenue Cycle Management','ABDM / ABHA Integration',
  'FHIR Compliance','Multi-country Regulatory','AI Product Design',
  'Clinic Workflow Automation','SaaS Architecture','Team Leadership',
];

const ventures = [
  { name: 'MediHost AI Technologies Pvt. Ltd.', role: 'Founder & CEO', year: '2024–present', desc: 'AI-powered HMS and clinic management platform serving 9 countries. Patent pending (202641047349).' },
  { name: 'RightPhysio', role: 'Founder', year: '2023–present', desc: 'Online physiotherapy platform connecting patients with certified physiotherapists across India.' },
  { name: 'Smartgumastha', role: 'Founder', year: '2022–present', desc: 'The technology backbone powering the MediHost and Hemato ecosystems. Engineering, infrastructure, and product R&D.' },
];

export default function FounderPage() {
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
            <Link href="/contact" className="text-[13px] font-semibold text-[#475569] hover:text-[#020617]">Contact</Link>
            <Link href="/" className="text-[13px] font-semibold text-[#475569] hover:text-[#020617]">← Home</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#f8fafc] px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-10 md:flex-row md:items-start">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="relative">
                <div className="flex h-40 w-40 items-center justify-center rounded-[28px] text-[64px]"
                  style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#ec4899 100%)', boxShadow: '0 20px 48px -10px rgba(124,58,237,0.45)' }}>
                  👨‍⚕️
                </div>
                <div className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#7c3aed] text-white shadow-md">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-5 flex justify-center gap-3">
                <a href="https://in.linkedin.com/in/sai-charan-kumar-pakala-506b697" target="_blank" rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#0a66c2] text-white hover:opacity-90">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="mailto:saicharankumarpakala@gmail.com"
                  className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#ea4335] text-white hover:opacity-90">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.907 1.528-1.148C21.69 2.28 24 3.434 24 5.457z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Bio intro */}
            <div className="flex-1 text-center md:text-left">
              <Pill>Founder & CEO</Pill>
              <h1 className="mt-4 text-[36px] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#020617]">
                Sai Charan Kumar Pakala
              </h1>
              <p className="mt-1 text-[16px] font-semibold text-[#1ba3d6]">
                Physiotherapist · Hospital Administrator · Healthcare Tech Founder
              </p>
              <p className="mt-4 text-[14px] leading-[1.8] text-[#475569]">
                With over 15 years straddling the bedside and the boardroom, Sai Charan Kumar Pakala
                built MediHost AI Technologies out of a frustration every independent clinician knows well:
                the software that should help them care for patients instead makes their days harder.
              </p>
              <p className="mt-3 text-[14px] leading-[1.8] text-[#475569]">
                Trained as a physiotherapist, then educated in hospital administration at one of
                India&apos;s most rigorous institutions, he spent more than a decade inside hospitals
                watching what worked and what didn&apos;t — before sitting down to build a platform
                that puts the clinician first.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                <span className="rounded-full border border-[#e2e8f0] bg-white px-3 py-1 text-[11px] font-semibold text-[#64748b]">Hyderabad, India</span>
                <span className="rounded-full border border-[#e2e8f0] bg-white px-3 py-1 text-[11px] font-semibold text-[#64748b]">15+ years in healthcare</span>
                <span className="rounded-full border border-[#e2e8f0] bg-white px-3 py-1 text-[11px] font-semibold text-[#64748b]">Patent pending</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 py-16 space-y-16">

        {/* Quote */}
        <QuoteBlock>
          &ldquo;I have seen nurses spend more time navigating software than talking to patients.
          I have seen small clinics lose revenue not because they lack patients but because
          they lack billing intelligence. MediHost exists to fix both — everywhere in the world,
          at a price that does not require a venture-backed hospital to afford.&rdquo;
        </QuoteBlock>

        {/* Story */}
        <div>
          <Pill>The story</Pill>
          <h2 className="mb-8 mt-4 text-[26px] font-extrabold tracking-[-0.03em] text-[#020617]">From clinic to code</h2>

          <div className="space-y-6 text-[14px] leading-[1.9] text-[#475569]">
            <p>
              Sai Charan Kumar Pakala grew up in Andhra Pradesh and pursued physiotherapy at
              Sri Venkateswara Institute of Medical Sciences (SVIMS) in Tirupati, graduating in 2009.
              His clinical years gave him an insider&apos;s view of how hospitals actually function —
              the informal shortcuts, the paper-trail nightmares, the billing disputes that nobody
              ever wins cleanly.
            </p>
            <p>
              Sensing that the real leverage was not in the clinic but in the systems that surrounded it,
              he enrolled in the Master of Hospital Administration programme at the Tata Institute
              of Social Sciences (TISS), Mumbai — one of India&apos;s foremost institutions for
              health-systems thinking. Graduating in 2010, he moved into healthcare IT and operations,
              spending the next twelve years implementing and managing HMS deployments across hospitals,
              diagnostic chains, and rehabilitation centres across India.
            </p>
            <p>
              Those twelve years confirmed the same observation repeatedly: large hospital chains
              could afford enterprise software that genuinely worked; independent clinics could not.
              The solutions available to them were either too expensive, too clunky, or both —
              and none of them thought about compliance across borders, because none of them
              expected their users to grow internationally.
            </p>
            <p>
              In 2024, he founded MediHost AI Technologies Private Limited with a straightforward mandate:
              build a platform that an independent clinic in rural Telangana and a diaspora-serving
              GP practice in Birmingham can both use, comply with local regulations in both places,
              and never require an IT consultant to set up. The patent-pending AI engine at the
              heart of MediHost — application 202641047349 — is the technological expression of that mandate.
            </p>
            <p>
              Today, MediHost serves clinics across India, UAE, United Kingdom, Kenya, Singapore,
              Australia, Canada, and Germany, with ABDM integration underway for India&apos;s national
              digital health mission (NHCX) and FHIR-compliant health record sharing live on the platform.
            </p>
          </div>
        </div>

        {/* Education */}
        <div>
          <Pill>Education</Pill>
          <h2 className="mb-6 mt-4 text-[26px] font-extrabold tracking-[-0.03em] text-[#020617]">Academic foundation</h2>
          <div className="space-y-4">
            <EduCard
              degree="Master of Hospital Administration (MHA)"
              institution="Tata Institute of Social Sciences (TISS), Mumbai"
              year="2010"
              note="Health Systems Management · Clinical Operations · Health Policy"
            />
            <EduCard
              degree="Bachelor of Physiotherapy (BPTh / BPT)"
              institution="Sri Venkateswara Institute of Medical Sciences (SVIMS), Tirupati"
              year="2009"
              note="Neurological Rehabilitation · Musculoskeletal · Sports Physiotherapy"
            />
          </div>
        </div>

        {/* Ventures */}
        <div>
          <Pill>Ventures</Pill>
          <h2 className="mb-6 mt-4 text-[26px] font-extrabold tracking-[-0.03em] text-[#020617]">What he&apos;s building</h2>
          <div className="space-y-4">
            {ventures.map((v) => (
              <div key={v.name} className="rounded-[16px] border border-[#e2e8f0] bg-white p-6" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-[15px] font-extrabold text-[#020617]">{v.name}</div>
                    <div className="text-[13px] font-semibold text-[#7c3aed]">{v.role}</div>
                  </div>
                  <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-[11px] font-semibold text-[#64748b]">{v.year}</span>
                </div>
                <p className="mt-3 text-[13px] leading-[1.7] text-[#64748b]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <Pill>Expertise</Pill>
          <h2 className="mb-6 mt-4 text-[26px] font-extrabold tracking-[-0.03em] text-[#020617]">Areas of depth</h2>
          <div className="flex flex-wrap gap-2.5">
            {skills.map((s) => <SkillChip key={s} label={s} />)}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="rounded-[24px] border border-[#e2e8f0] bg-[#f8fafc] p-10 text-center">
          <h2 className="text-[22px] font-extrabold text-[#020617]">Get in touch</h2>
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-[1.7] text-[#64748b]">
            Partnership enquiries, press, or just a conversation about healthcare technology —
            Sai Charan reads every email.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-4">
            <a href="mailto:saicharankumarpakala@gmail.com"
              className="inline-block rounded-[10px] px-8 py-3 text-[14px] font-extrabold text-white hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#ec4899 100%)' }}>
              Email the founder →
            </a>
            <Link href="/contact" className="inline-block rounded-[10px] border border-[#e2e8f0] bg-white px-8 py-3 text-[14px] font-semibold text-[#475569] hover:border-[#7c3aed] hover:text-[#7c3aed]">
              Contact page
            </Link>
          </div>
          <p className="mt-4 text-[11px] text-[#94a3b8]">saicharankumarpakala@gmail.com · Hyderabad, India</p>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-[#e2e8f0] bg-[#f8fafc] px-5 py-10 text-center">
        <p className="text-[12px] text-[#94a3b8]">
          © 2026 MediHost AI Technologies Private Limited · Hyderabad, India ·{' '}
          <Link href="/about" className="hover:text-[#1ba3d6]">About</Link> ·{' '}
          <Link href="/privacy" className="hover:text-[#1ba3d6]">Privacy</Link> ·{' '}
          <Link href="/terms" className="hover:text-[#1ba3d6]">Terms</Link>
        </p>
      </footer>
    </div>
  );
}
