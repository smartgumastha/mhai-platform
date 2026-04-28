import Link from 'next/link';

export const metadata = { title: 'Terms of Service — MediHost™ AI' };

export default function TermsPage() {
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
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em] text-[#020617] mb-1">Terms of Service</h1>
        <p className="text-[13px] text-[#94a3b8] mb-1">Last updated: April 6, 2026</p>
        <p className="text-[13px] text-[#94a3b8] mb-10">Effective date: April 6, 2026</p>

        <div className="text-[14px] leading-[1.8] text-[#475569] space-y-0">

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing or using MediHost™ AI (&ldquo;the Service&rdquo;), operated by <strong className="text-[#020617]">Medihost AI Technologies Private Limited</strong>
            (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), you agree to be bound by these Terms of Service.
            If you do not agree, do not use the Service. These terms apply to all users including clinic owners,
            staff members, and any person accessing the platform.
          </p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">2. The Service</h2>
          <p className="mb-4">
            MediHost™ AI is a cloud-based clinic management platform that provides website hosting, custom
            domains, appointment scheduling, billing &amp; invoicing, electronic medical records (EMR), laboratory
            information system (LIS), patient communication, and AI-powered features for healthcare providers
            including clinics, labs, pharmacies, and other medical practices.
          </p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">3. Your Account</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>You must provide accurate, complete registration information and keep it updated.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li>You are responsible for all activities that occur under your account.</li>
            <li>You must notify us immediately at <a href="mailto:support@medihost.in" className="text-[#1ba3d6] hover:underline">support@medihost.in</a> if you suspect unauthorized access.</li>
            <li>One account per clinic. Multiple staff members can be added under a single clinic account with role-based access.</li>
          </ul>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">4. Payment Terms</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong className="text-[#020617]">Starter Plan</strong> &mdash; free forever with core features. No credit card required.</li>
            <li><strong className="text-[#020617]">Paid Plans</strong> &mdash; billed monthly or yearly in advance. Prices are in INR and subject to applicable GST (18%).</li>
            <li><strong className="text-[#020617]">Custom Domains</strong> &mdash; domain registration fees are non-refundable once the domain has been registered with the registrar.</li>
            <li><strong className="text-[#020617]">Payment Processor</strong> &mdash; all payments are processed securely through Razorpay (PCI DSS Level 1 compliant). We do not store card or UPI details on our servers.</li>
            <li>We reserve the right to change pricing with 30 days&rsquo; written notice. Existing subscriptions will be honored until their current billing period ends.</li>
          </ul>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">5. Patient Data Responsibility</h2>
          <p className="mb-4">
            Under the Digital Personal Data Protection (DPDP) Act, 2023, the <strong className="text-[#020617]">clinic is the Data Fiduciary</strong> — you
            determine what patient data is collected, the purposes for collection, and are responsible for obtaining valid
            consent from patients. MediHost™ AI acts as the <strong className="text-[#020617]">Data Processor</strong>, processing
            patient data solely on your instructions and as described in our{' '}
            <Link href="/privacy" className="text-[#1ba3d6] hover:underline">Privacy Policy</Link>.
          </p>
          <p className="mb-4">
            You are responsible for ensuring that all patient data entered into the platform complies with
            applicable laws, including obtaining necessary consents and maintaining data accuracy.
          </p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">6. Acceptable Use</h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Use the Service for any unlawful purpose or in violation of any applicable law or regulation.</li>
            <li>Upload or transmit malicious code, viruses, or any harmful content.</li>
            <li>Attempt to gain unauthorized access to other accounts, systems, or networks.</li>
            <li>Resell, sublicense, or redistribute the Service without written permission.</li>
            <li>Use the Service to store data unrelated to healthcare practice management.</li>
            <li>Interfere with or disrupt the integrity or performance of the Service.</li>
            <li>Scrape, crawl, or use automated tools to extract data from the platform.</li>
          </ul>
          <p className="mb-4">Violation of these terms may result in immediate account suspension or termination.</p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">7. Uptime &amp; Support</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong className="text-[#020617]">Uptime Target</strong> &mdash; we target <strong className="text-[#020617]">99.5% uptime</strong> on a monthly basis, excluding scheduled maintenance windows.</li>
            <li><strong className="text-[#020617]">Support Response</strong> &mdash; we aim to respond to all support requests within <strong className="text-[#020617]">24 hours</strong> during business days.</li>
            <li>Scheduled maintenance will be communicated at least 24 hours in advance via email.</li>
            <li>We are not liable for downtime caused by factors beyond our reasonable control, including third-party service outages, natural disasters, or government actions.</li>
          </ul>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">8. Intellectual Property</h2>
          <p className="mb-4">
            The MediHost™ name, logo, and brand are the intellectual property of <strong className="text-[#020617]">Medihost AI Technologies Private Limited</strong>.
            Trademark application filed under <strong className="text-[#020617]">Class 42 (Software as a Service)</strong>,
            Reference Number <strong className="text-[#020617]">14007693</strong>, with the Indian Trademark Registry.
          </p>
          <p className="mb-4">
            All platform code, design, documentation, and AI models are proprietary. Your content (clinic data,
            patient records) remains yours — we claim no ownership over data you enter into the platform.
          </p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">9. Limitation of Liability</h2>
          <p className="mb-4">
            To the maximum extent permitted by applicable law, Medihost AI Technologies Private Limited and its officers,
            employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or
            punitive damages arising out of or related to your use of the Service.
          </p>
          <p className="mb-4">
            Our total aggregate liability for any claims arising from or related to the Service shall not
            exceed the amount you paid us in the <strong className="text-[#020617]">3 months preceding the claim</strong>. For free-tier users,
            our maximum liability is INR 0.
          </p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">10. Termination</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>You may cancel your subscription at any time from your dashboard or by emailing <a href="mailto:billing@medihost.in" className="text-[#1ba3d6] hover:underline">billing@medihost.in</a>.</li>
            <li>Upon cancellation, you will retain access until the end of your current billing period.</li>
            <li>After termination, you have <strong className="text-[#020617]">30 days to export your data</strong>. We will provide data export tools and assistance.</li>
            <li>We may terminate or suspend your account immediately for violation of these Terms, with or without notice.</li>
            <li>After the 30-day data export window, your data will be permanently deleted in accordance with our data retention policy.</li>
          </ul>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">11. Governing Law</h2>
          <p className="mb-4">
            These Terms shall be governed by and construed in accordance with the laws of <strong className="text-[#020617]">India</strong>.
            Any disputes arising from these Terms or the use of the Service shall be subject to the exclusive
            jurisdiction of the courts in <strong className="text-[#020617]">Hyderabad, Telangana, India</strong>.
          </p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">12. Contact</h2>
          <p className="mb-4">For questions about these Terms of Service:</p>
          <div className="rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-5">
            <p className="text-[13px]"><strong className="text-[#020617]">Company:</strong> Medihost AI Technologies Private Limited</p>
            <p className="text-[13px]"><strong className="text-[#020617]">Email:</strong>{' '}
              <a href="mailto:legal@medihost.in" className="text-[#1ba3d6] hover:underline">legal@medihost.in</a>
            </p>
            <p className="text-[13px]"><strong className="text-[#020617]">Subject line:</strong> Terms Inquiry — [Your Clinic Name]</p>
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
