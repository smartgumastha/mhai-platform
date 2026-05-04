"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/providers/auth-context";

var navGroups = [
  {
    label: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/dashboard" },
      { name: "Appointments", href: "/dashboard/appointments" },
      { name: "Patients", href: "/dashboard/patients" },
    ],
  },
  {
    label: "BILLING",
    items: [
      { name: "All Bills", href: "/dashboard/bills" },
      { name: "OPD Billing", href: "/dashboard/billing/opd" },
      { name: "Claims", href: "/dashboard/claims" },
      { name: "Denials", href: "/dashboard/denials" },
      { name: "Appeals", href: "/dashboard/appeals" },
      { name: "Clinic & Billing", href: "/dashboard/settings/billing-preferences" },
    ],
  },
  {
    label: "AI MARKETING",
    items: [
      { name: "AI website", href: "/dashboard/ai-website" },
      { name: "Google reviews", href: "/dashboard/google-reviews" },
      { name: "Social posts", href: "/dashboard/social-posts" },
      { name: "WhatsApp + SMS", href: "/dashboard/whatsapp" },
      { name: "Paid ads", href: "/dashboard/paid-ads" },
      { name: "SEO + AEO", href: "/dashboard/seo" },
      { name: "Print studio", href: "/dashboard/print-studio" },
    ],
  },
  {
    label: "AI AUTOMATION",
    items: [
      { name: "MHAI Pay", href: "/dashboard/mhai-pay" },
      { name: "MHAI Receptionist", href: "/dashboard/receptionist" },
      { name: "MHAI Caller", href: "/dashboard/caller" },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { name: "Patient CRM", href: "/dashboard/crm" },
      { name: "Referral network", href: "/dashboard/referrals" },
      { name: "Team & Staff", href: "/dashboard/team" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { name: "Brand DNA", href: "/dashboard/brand" },
      { name: "Connections", href: "/dashboard/connections" },
      { name: "Analytics", href: "/dashboard/analytics" },
    ],
  },
];

var hmsSubItems = [
  { name: "OPD Queue", href: "/dashboard/hms/opd" },
  { name: "NABH Compliance", href: "/dashboard/hms/nabh" },
  { name: "Staff", href: "/dashboard/team" },
  { name: "Settings", href: "/dashboard/hms/settings" },
];

var telecallerSubItems = [
  { name: "Dashboard", href: "/dashboard/telecaller" },
  { name: "Import contacts", href: "/dashboard/telecaller/import" },
  { name: "Campaigns", href: "/dashboard/telecaller/campaigns" },
  { name: "Scripts", href: "/dashboard/telecaller/scripts" },
  { name: "Coaching", href: "/dashboard/telecaller/coaching" },
];

export default function DashboardSidebar({
  businessName,
}: {
  businessName: string;
}) {
  var pathname = usePathname();
  var { logout } = useAuth();
  var isTelecallerActive = pathname.startsWith("/dashboard/telecaller");
  var [telecallerOpen, setTelecallerOpen] = useState(isTelecallerActive);
  var isHmsActive = pathname.startsWith("/dashboard/hms") || pathname === "/dashboard/team";
  var [hmsOpen, setHmsOpen] = useState(true);

  return (
    <aside className="flex h-screen w-[220px] min-w-[220px] flex-col overflow-y-auto bg-ink">
      {/* Logo + business info */}
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 pb-4 pt-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-coral shadow-sm">
          <span className="text-[11px] font-medium text-white">MHAI</span>
        </div>
        <div>
          <div className="text-sm font-medium text-white">{businessName}</div>
          <div className="flex items-center text-[11px] text-emerald-accent">
            <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-accent" />
            AI engine active
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mb-2 flex-1 pt-1">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="mb-1 mt-4 px-4 text-[10px] uppercase tracking-wider text-text-muted">
              {group.label}
            </div>
            {group.items.map((item) => {
              var isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mx-2 block rounded-md px-3 py-2 text-[13px] transition-all duration-150 ${
                    isActive
                      ? "border-l-[3px] border-coral bg-coral/20 pl-2.5 font-medium text-white"
                      : "text-text-muted hover:bg-white/5 hover:text-paper"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            {/* HMS collapsible section — after OPERATIONS */}
            {group.label === "OPERATIONS" && (
              <div>
                <div className={`mx-2 flex w-[calc(100%-16px)] items-center justify-between rounded-md px-3 py-2 text-[13px] transition-all duration-150 ${
                    isHmsActive
                      ? "border-l-[3px] border-coral bg-coral/20 pl-2.5 font-medium text-white"
                      : "text-text-muted hover:bg-white/5 hover:text-paper"
                  }`}>
                  <Link href="/dashboard/hms" className="flex-1">HMS</Link>
                  <button onClick={function () { setHmsOpen(!hmsOpen); }}>
                    <svg
                      width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"
                      className={"transition-transform " + (hmsOpen ? "rotate-180" : "")}
                    >
                      <path d="M3 4.5l3 3 3-3" />
                    </svg>
                  </button>
                </div>
                {hmsOpen && (
                  <div className="ml-4">
                    {hmsSubItems.map(function (sub) {
                      var isSubActive = pathname === sub.href || pathname.startsWith(sub.href);
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`mx-2 block rounded-md px-3 py-1.5 text-[12px] transition-all duration-150 ${
                            isSubActive
                              ? "bg-coral/15 font-medium text-coral"
                              : "text-text-muted hover:bg-white/5 hover:text-paper"
                          }`}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Telecaller CRM collapsible section — after AI AUTOMATION */}
            {group.label === "AI AUTOMATION" && (
              <div>
                <button
                  onClick={function () { setTelecallerOpen(!telecallerOpen); }}
                  className={`mx-2 flex w-[calc(100%-16px)] items-center justify-between rounded-md px-3 py-2 text-[13px] transition-all duration-150 ${
                    isTelecallerActive
                      ? "border-l-[3px] border-coral bg-coral/20 pl-2.5 font-medium text-white"
                      : "text-text-muted hover:bg-white/5 hover:text-paper"
                  }`}
                >
                  <span>Telecaller CRM</span>
                  <svg
                    width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"
                    className={"transition-transform " + (telecallerOpen ? "rotate-180" : "")}
                  >
                    <path d="M3 4.5l3 3 3-3" />
                  </svg>
                </button>
                {telecallerOpen && (
                  <div className="ml-4">
                    {telecallerSubItems.map(function (sub) {
                      var isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`mx-2 block rounded-md px-3 py-1.5 text-[12px] transition-all duration-150 ${
                            isSubActive
                              ? "bg-coral/15 font-medium text-coral"
                              : "text-text-muted hover:bg-white/5 hover:text-paper"
                          }`}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto border-t border-white/10 p-3">
        <div className="text-[11px] text-text-muted">Plan: Free trial</div>
        <div className="mt-1.5 inline-block cursor-pointer rounded-md bg-coral/15 px-3 py-1 text-[11px] text-coral transition-all duration-200 hover:bg-coral/25">
          Upgrade →
        </div>
        <button
          onClick={logout}
          className="mt-2 w-full cursor-pointer rounded-md py-2 text-xs text-text-muted transition-all duration-200 hover:bg-white/5 hover:text-paper"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
