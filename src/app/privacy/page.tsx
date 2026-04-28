import Link from 'next/link';

export const metadata = { title: 'Privacy Policy — MediHost™ AI' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <nav className="sticky top-0 z-50 border-b border-[#e2e8f0] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px]" style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#ec4899 100%)' }}>
              <svg viewBox="0 0 100 100" width="18" height="18">
                <path d="M50 8 L85 22 L85 52 Q85 76 50 92 Q15 76 15 52 L15 22 Z" fill="white" />
                <path d="M50 30 L50 70 M30 50 L70 50" stroke="#7c3aed" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[14px] font-extrabold tracking-[-0.03em] text-[#020617]">MediHost™ AI</span>
          </Link>
          <Link href="/" className="text-[13px] font-semibold text-[#475569] hover:text-[#020617]">← Back to home</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em] text-[#020617] mb-1">Privacy Policy</h1>
        <p className="text-[13px] text-[#94a3b8] mb-1">Last updated: April 6, 2026</p>
        <p className="text-[13px] text-[#94a3b8] mb-10">Effective date: April 6, 2026</p>

        <div className="text-[14px] leading-[1.8] text-[#475569] space-y-0">

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">1. Who We Are</h2>
          <p className="mb-4">
            MediHost™ AI is a product of <strong className="text-[#020617]">Medihost AI Technologies Private Limited</strong>, a
            technology company registered in Hyderabad, India. We build cloud-based clinic management software
            including website hosting, appointment scheduling, billing, EMR, and laboratory information systems
            for healthcare providers.
          </p>
          <div className="rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-5 mb-4">
            <p className="text-[13px]"><strong className="text-[#020617]">Legal Entity:</strong> Medihost AI Technologies Private Limited</p>
            <p className="text-[13px]"><strong className="text-[#020617]">Address:</strong> Hyderabad, Telangana, India</p>
            <p className="text-[13px]"><strong className="text-[#020617]">Email:</strong>{' '}
              <a href="mailto:privacy@medihost.in" className="text-[#1ba3d6] hover:underline">privacy@medihost.in</a>
            </p>
          </div>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">2. What Data We Collect</h2>
          <p className="mb-4">
            Under the Digital Personal Data Protection (DPDP) Act, 2023, the <strong className="text-[#020617]">clinic is the Data Fiduciary</strong> (they
            decide what patient data to collect and why). <strong className="text-[#020617]">MediHost™ AI is the Data Processor</strong> (we
            process data on the clinic&rsquo;s behalf using our software infrastructure).
          </p>
          <p className="mb-2 font-semibold text-[#020617]">We process the following categories of data:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong className="text-[#020617]">Account data</strong> &mdash; clinic name, owner name, email address, phone number, and login credentials.</li>
            <li><strong className="text-[#020617]">Patient data</strong> &mdash; patient names, contact details, medical history, prescriptions, lab reports, and billing records as entered by the clinic.</li>
            <li><strong className="text-[#020617]">Usage data</strong> &mdash; pages visited, features used, browser type, device information, IP address, and session duration.</li>
            <li><strong className="text-[#020617]">Payment data</strong> &mdash; transaction IDs, plan details, and billing history. Card/UPI details are processed by Razorpay and never stored on our servers.</li>
            <li><strong className="text-[#020617]">Cookies</strong> &mdash; one essential authentication cookie. See Section 8 for details.</li>
          </ul>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">3. Why We Collect It</h2>
          <p className="mb-4">
            In accordance with the <strong className="text-[#020617]">purpose limitation</strong> principle of the DPDP Act, 2023, we only
            collect and process personal data for the following specific, lawful purposes:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>To provide, operate, and maintain the MediHost™ AI platform and its features.</li>
            <li>To create and manage your clinic account and authenticate users.</li>
            <li>To process payments, generate invoices, and manage subscriptions.</li>
            <li>To send transactional communications (appointment reminders, billing receipts, system alerts).</li>
            <li>To improve our services, fix bugs, and develop new features based on aggregated usage patterns.</li>
            <li>To comply with legal obligations including tax filings and regulatory requirements.</li>
            <li>To respond to support requests and grievances.</li>
          </ul>
          <p className="mb-4">We do not process data for any purpose beyond what is stated above without obtaining fresh consent.</p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">4. Who We Share Data With</h2>
          <p className="mb-4">
            We <strong className="text-[#020617]">never sell your personal data</strong>. We share data only with the following
            service providers who act as sub-processors:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong className="text-[#020617]">Railway</strong> &mdash; application hosting and database infrastructure.</li>
            <li><strong className="text-[#020617]">Vercel</strong> &mdash; front-end hosting and edge network delivery.</li>
            <li><strong className="text-[#020617]">Razorpay</strong> &mdash; payment processing (PCI DSS compliant).</li>
            <li><strong className="text-[#020617]">Resend</strong> &mdash; transactional email delivery.</li>
            <li><strong className="text-[#020617]">Twilio</strong> &mdash; SMS notifications and appointment reminders.</li>
            <li><strong className="text-[#020617]">Anthropic</strong> &mdash; AI-powered features (data sent only when AI features are used, with minimal context).</li>
          </ul>
          <p className="mb-4">Each sub-processor is bound by data processing agreements. We may also disclose data if required by law, court order, or government authority.</p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">5. Data Retention</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong className="text-[#020617]">Active account data</strong> &mdash; retained while your account is active, plus 90 days after deletion to allow recovery.</li>
            <li><strong className="text-[#020617]">Medical records</strong> &mdash; retained for 7 years as per Indian medical record-keeping guidelines.</li>
            <li><strong className="text-[#020617]">GST/tax records</strong> &mdash; retained for 8 years as required under Indian tax law.</li>
            <li><strong className="text-[#020617]">Server logs</strong> &mdash; automatically purged after 30 days.</li>
          </ul>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">6. Your Rights Under the DPDP Act, 2023</h2>
          <p className="mb-4">As a Data Principal, you have the following rights:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong className="text-[#020617]">Right to Access</strong> &mdash; request a summary of the personal data we process and the processing activities.</li>
            <li><strong className="text-[#020617]">Right to Correction</strong> &mdash; request correction of inaccurate or misleading personal data.</li>
            <li><strong className="text-[#020617]">Right to Erasure</strong> &mdash; request deletion of your personal data, subject to legal retention requirements.</li>
            <li><strong className="text-[#020617]">Right to Grievance Redressal</strong> &mdash; file a complaint with our Grievance Officer or escalate to the Data Protection Board of India.</li>
            <li><strong className="text-[#020617]">Right to Nominate</strong> &mdash; nominate another individual to exercise your rights in case of death or incapacity.</li>
          </ul>
          <p className="mb-4">To exercise any of these rights, email <a href="mailto:privacy@medihost.in" className="text-[#1ba3d6] hover:underline">privacy@medihost.in</a> with your registered clinic email. We will respond within 72 hours.</p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">7. Grievance Officer</h2>
          <p className="mb-4">In accordance with the DPDP Act, 2023, we have appointed the following Grievance Officer:</p>
          <div className="rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-5 mb-4">
            <p className="text-[13px]"><strong className="text-[#020617]">Name:</strong> Sai Charan Kumar Pakala</p>
            <p className="text-[13px]"><strong className="text-[#020617]">Designation:</strong> Founder &amp; Data Protection Officer</p>
            <p className="text-[13px]"><strong className="text-[#020617]">Email:</strong>{' '}
              <a href="mailto:privacy@medihost.in" className="text-[#1ba3d6] hover:underline">privacy@medihost.in</a>
            </p>
            <p className="text-[13px]"><strong className="text-[#020617]">Phone:</strong> +91 7993 135 689</p>
            <p className="text-[13px]"><strong className="text-[#020617]">Location:</strong> Hyderabad, Telangana, India</p>
          </div>
          <p className="mb-4">All grievances will be acknowledged within <strong className="text-[#020617]">72 hours</strong> and resolved as expeditiously as possible.</p>

          <h2 id="cookies" className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">8. Cookies</h2>
          <p className="mb-4">MediHost™ AI uses <strong className="text-[#020617]">one essential cookie</strong>:</p>
          <div className="rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-5 mb-4 overflow-x-auto">
            <table className="text-[13px] w-full">
              <thead>
                <tr className="text-left text-[#020617]">
                  <th className="pb-2 pr-4">Cookie</th>
                  <th className="pb-2 pr-4">Purpose</th>
                  <th className="pb-2 pr-4">Duration</th>
                  <th className="pb-2">Type</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="pr-4 font-mono text-[#7c3aed]">medihost_auth</td>
                  <td className="pr-4">Session authentication</td>
                  <td className="pr-4">Session / 30 days</td>
                  <td>Essential</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mb-4">
            We do <strong className="text-[#020617]">not</strong> use any tracking cookies, advertising cookies, or third-party analytics cookies.
            Because we only use a strictly necessary cookie, no opt-in consent is required for its operation — though
            we inform you of its use via our cookie banner.
          </p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">9. Healthcare Data Disclaimer</h2>
          <p className="mb-4">
            MediHost™ AI is a <strong className="text-[#020617]">software platform</strong>, not a healthcare provider, medical
            device, or diagnostic service. We do not provide medical advice, diagnoses, or treatment
            recommendations. All clinical decisions are the sole responsibility of the licensed healthcare
            professionals using the platform. The data entered, stored, and managed through MediHost™ AI is
            under the full control and responsibility of the clinic (Data Fiduciary).
          </p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">10. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. If we make material changes, we will notify you
            by email at least <strong className="text-[#020617]">30 days before</strong> the changes take effect. The &ldquo;Last updated&rdquo; date at
            the top of this page will always reflect the most recent revision. Continued use of the platform after
            the effective date constitutes acceptance of the updated policy.
          </p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">11. Contact</h2>
          <p className="mb-4">For any privacy-related questions or concerns, reach us at:</p>
          <div className="rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-5">
            <p className="text-[13px]"><strong className="text-[#020617]">Email:</strong>{' '}
              <a href="mailto:privacy@medihost.in" className="text-[#1ba3d6] hover:underline">privacy@medihost.in</a>
            </p>
            <p className="text-[13px]"><strong className="text-[#020617]">Subject line:</strong> Privacy Inquiry — [Your Clinic Name]</p>
          </div>

        </div>
      </div>

      <footer className="border-t border-[#e2e8f0] bg-[#020617] py-6 text-center">
        <p className="text-[11px] text-[#475569]">
          © 2026 Medihost AI Technologies Private Limited · MediHost™ AI — Clinic Software That Works
        </p>
        <div className="mt-2 flex justify-center gap-4">
          <Link href="/privacy" className="text-[11px] text-[#64748b] hover:text-white">Privacy Policy</Link>
          <Link href="/terms" className="text-[11px] text-[#64748b] hover:text-white">Terms of Service</Link>
          <Link href="/refund" className="text-[11px] text-[#64748b] hover:text-white">Refund Policy</Link>
        </div>
      </footer>
    </div>
  );
}
