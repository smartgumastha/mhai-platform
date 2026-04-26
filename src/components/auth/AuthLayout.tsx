"use client";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-[rgba(27,163,214,0.04)] to-white flex items-start justify-center px-4 pt-8 pb-14">
      {/* Background blobs — purple top-right, teal bottom-left */}
      <div
        className="pointer-events-none absolute right-[-15%] top-[-10%] h-[50%] w-[50%]"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-[-10%] left-[-15%] h-[50%] w-[50%]"
        style={{
          background: "radial-gradient(circle, rgba(27,163,214,0.10) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Brand header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            {/* Shield logo — gradient purple→pink */}
            <div
              className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-[14px]"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
                boxShadow: "0 12px 28px -6px rgba(124,58,237,0.4)",
              }}
            >
              <svg viewBox="0 0 100 100" width="28" height="28">
                <path d="M50 8 L85 22 L85 52 Q85 76 50 92 Q15 76 15 52 L15 22 Z" fill="white" />
                <path d="M50 30 L50 70 M30 50 L70 50" stroke="#7c3aed" strokeWidth="7" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="text-[19px] font-extrabold tracking-[-0.03em] text-[#020617]">
                MediHost™ AI
              </div>
              <div className="mt-0.5 text-[12px] font-bold text-[#0e7ba8]">
                AI engine for Healthcare
              </div>
            </div>
          </div>
          {/* Services strip — all same muted color, teal dots */}
          <div className="mt-3.5 border-t border-[#f1f5f9] pt-3.5 text-[11px] font-semibold tracking-[0.02em] text-[#475569]">
            HMS
            <span className="mx-1.5 font-bold text-[#1ba3d6]">·</span>
            RCM
            <span className="mx-1.5 font-bold text-[#1ba3d6]">·</span>
            Compliance
            <span className="mx-1.5 font-bold text-[#1ba3d6]">·</span>
            AI Marketing
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-[18px] border border-[#e2e8f0] bg-white px-[26px] py-[30px]"
          style={{
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 24px 48px -12px rgba(15,23,42,0.14), 0 0 0 1px rgba(27,163,214,0.06)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
