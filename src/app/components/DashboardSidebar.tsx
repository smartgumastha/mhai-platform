"use client";

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
      { name: "HMS", href: "/dashboard/hms" },
      { name: "Marketing team", href: "/dashboard/team" },
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

export default function DashboardSidebar({
  businessName,
}: {
  businessName: string;
}) {
  var pathname = usePathname();
  var { logout } = useAuth();

  return (
    <aside className="flex h-screen w-[220px] min-w-[220px] flex-col bg-[#0a1a14] overflow-y-auto">
      {/* Logo + business info */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500">
          <span className="text-[11px] font-medium text-white">MHAI</span>
        </div>
        <div>
          <div className="text-sm font-medium text-white">{businessName}</div>
          <div className="text-[11px] text-emerald-300">AI engine active</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-gray-500">
              {group.label}
            </div>
            {group.items.map((item) => {
              var isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block py-2 px-4 text-[13px] ${
                    isActive
                      ? "border-l-2 border-emerald-500 bg-emerald-500/15 text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto border-t border-white/10 p-3">
        <div className="text-[11px] text-gray-500">Plan: Free trial</div>
        <div className="mt-1 cursor-pointer text-[11px] text-emerald-500">
          Upgrade →
        </div>
        <button
          onClick={logout}
          className="mt-3 w-full rounded-md border border-white/10 py-1.5 text-[11px] text-gray-400 hover:text-white"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
