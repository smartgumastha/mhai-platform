"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { PatientAuthProvider, usePatientAuth } from "./providers/patient-auth-context";

var NAV = [
  { name: "Health Bank",   href: "/patient/dashboard",   icon: "◈" },
  { name: "Documents",     href: "/patient/documents",   icon: "📂" },
  { name: "Prescriptions", href: "/patient/prescriptions", icon: "℞" },
  { name: "EHR Records",   href: "/patient/ehr",         icon: "≡" },
  { name: "Bills",         href: "/patient/bills",       icon: "₿" },
  { name: "Appointments",  href: "/patient/appointments", icon: "⊙" },
  { name: "AI Analysis",   href: "/patient/ai",          icon: "✦" },
];

function Sidebar() {
  var pathname = usePathname();
  var router = useRouter();
  var { patient, logout } = usePatientAuth();

  function handleLogout() {
    logout();
    router.push("/patient/login");
  }

  return (
    <aside className="flex h-screen w-[220px] min-w-[220px] flex-col overflow-y-auto bg-[#0a2d3d]">
      {/* Brand */}
      <div className="border-b border-white/10 px-4 pb-4 pt-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1ba3d6] text-[11px] font-bold text-white">
            HB
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Health Bank</div>
            <div className="text-[11px] text-[#7dd3f0]">Your health wallet</div>
          </div>
        </div>
        {patient && (
          <div className="mt-3 rounded-lg bg-white/5 px-3 py-2">
            <div className="truncate text-xs font-semibold text-white">{patient.name}</div>
            <div className="flex items-center gap-2">
              {patient.uhid && <span className="font-mono text-[10px] text-[#7dd3f0]">{patient.uhid}</span>}
              {patient.blood_group && (
                <span className="rounded bg-red-900/40 px-1 text-[10px] font-bold text-red-300">
                  {patient.blood_group}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        <div className="mb-1 mt-3 px-4 text-[9px] font-semibold uppercase tracking-widest text-white/30">
          MY HEALTH
        </div>
        {NAV.map(function (item) {
          var isActive = pathname === item.href || (item.href !== "/patient/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={"mx-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all " +
                (isActive
                  ? "border-l-2 border-[#1ba3d6] bg-[#1ba3d6]/15 pl-[10px] font-semibold text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80")}
            >
              <span className="w-4 text-center text-base leading-none">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 p-3">
        <div className="mb-1 px-1 text-[10px] text-white/30">
          Secured by MHAI Platform
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg py-2 text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

function PatientPortalGuard({ children }: { children: React.ReactNode }) {
  var { isLoading, isAuthenticated } = usePatientAuth();
  var { getPatientToken: getToken } = { getPatientToken: () => { if (typeof window === "undefined") return null; return localStorage.getItem("mhai_patient_token"); } };
  var pathname = usePathname();
  var router = useRouter();
  var isLoginPage  = pathname === "/patient/login";
  var isSetupPage  = pathname === "/patient/setup";
  var hasToken = typeof window !== "undefined" && !!localStorage.getItem("mhai_patient_token");

  useEffect(function () {
    if (isLoading) return;
    // Unauthenticated — allow login and setup pages freely
    if (!isAuthenticated && !isLoginPage && !isSetupPage) {
      // Setup page is accessible with a token even before profile is created
      if (!hasToken) router.replace("/patient/login");
    }
    if (isAuthenticated && isLoginPage) router.replace("/patient/dashboard");
  }, [isLoading, isAuthenticated, isLoginPage, isSetupPage, hasToken, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a2d3d]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-xl bg-[#1ba3d6]/30" />
          <p className="text-xs text-white/30">Loading Health Bank…</p>
        </div>
      </div>
    );
  }

  // Login and setup pages render without the sidebar shell
  if (isLoginPage || isSetupPage) return <>{children}</>;

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-[#f0f4f8]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <PatientAuthProvider>
      <PatientPortalGuard>{children}</PatientPortalGuard>
    </PatientAuthProvider>
  );
}
