"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/auth-context";

var channels = [
  { name: "Instagram", color: "#c13584" },
  { name: "Facebook", color: "#1877f2" },
  { name: "Google", color: "#ea4335" },
  { name: "WhatsApp", color: "#25d366" },
  { name: "LinkedIn", color: "#0a66c2" },
  { name: "SEO", color: "#f59e0b" },
  { name: "Website", color: "#10b981" },
];

export default function DashboardPage() {
  var router = useRouter();
  var { user, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-emerald-500">
          <span className="text-[11px] font-medium tracking-[0.5px] text-[#064e3b]">MHAI</span>
        </div>
        <div>
          <div className="text-[17px] font-medium text-white">
            Medi<span className="text-emerald-400">Host</span>{" "}
            <span className="text-[13px] text-gray-500">AI</span>
          </div>
        </div>
      </div>

      <h1 className="mb-2 text-xl text-white">
        Welcome, {user?.business_name || user?.owner_name || "Partner"}!
      </h1>
      <p className="mb-8 text-gray-400">Your MHAI dashboard is coming soon.</p>

      <div className="mb-8 flex flex-wrap gap-1.5">
        {channels.map((ch) => (
          <span
            key={ch.name}
            className="flex h-[26px] items-center gap-1.5 rounded-full border border-[#1f2e28] bg-[#111916] px-2.5 text-[11px] text-gray-500"
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: ch.color }} />
            {ch.name}
          </span>
        ))}
      </div>

      <button
        onClick={logout}
        className="rounded-lg border border-red-900 px-4 py-2 text-[13px] text-red-400 transition hover:bg-red-900/20"
      >
        Log out
      </button>
    </div>
  );
}
