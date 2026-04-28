import Link from 'next/link';

export const metadata = { title: 'Refund Policy — MediHost™ AI' };

export default function RefundPage() {
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
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em] text-[#020617] mb-1">Refund Policy</h1>
        <p className="text-[13px] text-[#94a3b8] mb-1">Last updated: April 6, 2026</p>
        <p className="text-[13px] text-[#94a3b8] mb-10">Effective date: April 6, 2026</p>
        <p className="mb-8 text-[14px] leading-[1.8] text-[#475569]">
          This Refund Policy applies to all subscription plans and purchases made through{' '}
          <strong className="text-[#020617]">Medihost AI Technologies Private Limited</strong> for the MediHost™ AI platform.
        </p>

        <div className="text-[14px] leading-[1.8] text-[#475569] space-y-0">

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">1. Monthly Subscriptions</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>You may cancel your monthly subscription at any time from your dashboard or by emailing <a href="mailto:billing@medihost.in" className="text-[#1ba3d6] hover:underline">billing@medihost.in</a>.</li>
            <li>No refund will be issued for the current billing month — your access continues until the end of the paid period.</li>
            <li>After the billing period ends, your account will be downgraded to the free Starter plan.</li>
            <li>No partial or pro-rata refunds are provided for monthly plans.</li>
          </ul>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">2. Yearly Subscriptions</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong className="text-[#020617]">Within 7 days</strong> &mdash; if you cancel within 7 days of your yearly subscription purchase, you are eligible for a <strong className="text-[#020617]">full refund</strong>.</li>
            <li><strong className="text-[#020617]">After 7 days</strong> &mdash; a pro-rata refund will be calculated based on the unused full months remaining in your subscription period.</li>
            <li>Refunds are processed within <strong className="text-[#020617]">5&ndash;7 business days</strong> to your original payment method via Razorpay.</li>
            <li>Any discounts, coupons, or promotional pricing applied at the time of purchase will be factored into the refund calculation.</li>
          </ul>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">3. Custom Domain Registrations</h2>
          <p className="mb-4">
            Domain name registrations are <strong className="text-[#020617]">non-refundable</strong> once the domain has been registered.
            This is because domain registrations are processed through third-party registrars (ICANN / ResellerClub)
            and cannot be reversed once completed. This policy applies regardless of whether the domain was
            registered as part of a subscription plan or as a standalone purchase.
          </p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">4. Free Plan (Starter)</h2>
          <p className="mb-4">
            The Starter plan is free and does not involve any payment. Therefore, no refund policy applies to the
            free tier. You may continue using the Starter plan indefinitely at no cost.
          </p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">5. Add-on Services</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong className="text-[#020617]">WhatsApp / SMS credits</strong> &mdash; purchased credits are non-refundable once consumed. Unused credits at account closure will be refunded on a pro-rata basis.</li>
            <li><strong className="text-[#020617]">AI Website generation</strong> &mdash; non-refundable once the generation process has been completed and delivered.</li>
            <li><strong className="text-[#020617]">Setup / onboarding fees</strong> &mdash; non-refundable once the onboarding session has taken place.</li>
          </ul>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">6. How to Request a Refund</h2>
          <p className="mb-4">To request a refund, email us with the following details:</p>
          <div className="rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-5 mb-4">
            <p className="text-[13px]"><strong className="text-[#020617]">Company:</strong> Medihost AI Technologies Private Limited</p>
            <p className="text-[13px]"><strong className="text-[#020617]">Email:</strong>{' '}
              <a href="mailto:billing@medihost.in" className="text-[#1ba3d6] hover:underline">billing@medihost.in</a>
            </p>
            <p className="text-[13px]"><strong className="text-[#020617]">Subject:</strong> Refund Request — [Your Clinic Name]</p>
            <p className="text-[13px] mt-2"><strong className="text-[#020617]">Include:</strong></p>
            <ul className="list-disc pl-6 space-y-1 text-[13px] mt-1">
              <li>Your registered clinic email address</li>
              <li>Razorpay transaction / order ID</li>
              <li>Reason for refund</li>
              <li>Plan type (monthly / yearly)</li>
            </ul>
          </div>
          <p className="mb-4">We will acknowledge your request within 24 hours and process eligible refunds within 5&ndash;7 business days.</p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">7. Billing Disputes</h2>
          <p className="mb-4">
            If you have a billing dispute, please contact us first at{' '}
            <a href="mailto:billing@medihost.in" className="text-[#1ba3d6] hover:underline">billing@medihost.in</a> before
            initiating a chargeback or dispute with your payment provider. We resolve <strong className="text-[#020617]">95% of billing
            issues within 24 hours</strong>.
          </p>
          <p className="mb-4">
            Chargebacks initiated without first contacting us may result in account suspension until the dispute
            is resolved. Medihost AI Technologies Private Limited is committed to fair resolution and will work with you
            to address any billing concerns promptly.
          </p>

          <h2 className="text-[18px] font-extrabold text-[#020617] mt-10 mb-3">8. Governing Law</h2>
          <p className="mb-4">
            This Refund Policy is governed by the laws of India. Any disputes shall be subject to the exclusive
            jurisdiction of the courts in Hyderabad, Telangana, India.
          </p>

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
