"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/auth-context";

/**
 * Admin layout — super-admin only.
 * Day 5 Phase B · April 21, 2026.
 *
 * Guard is client-side because:
 *   1. Backend routes /api/admin/plans/v2/* are already gated by
 *      verifyToken + requireSuperAdmin on Railway (server-side truth).
 *   2. A client-side guard is only to avoid flashing admin UI to
 *      non-admins — it is not the security boundary.
 *
 * If user is not a super admin → redirect to /dashboard.
 * If user is not authenticated at all → /login.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  var router = useRouter();
  var { user, isLoading, isAuthenticated } = useAuth();

  useEffect(function () {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!user?.is_super_admin) {
      router.push("/dashboard");
      return;
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf6ed]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff6b4a] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (!user?.is_super_admin) return null;

  return (
    <div className="min-h-screen bg-[#faf6ed]">
      <div className="border-b border-[#e5dec9] bg-white/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-12 py-4">
          <div className="flex items-center gap-4">
            <span className="font-serif text-xl italic text-[#e04527]">MHAI</span>
            <span className="text-xs font-mono uppercase tracking-[0.12em] text-[#8a7f72]">
              super admin
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <span className="font-mono text-xs text-[#8a7f72]">
              {user?.email}
            </span>
            <Link
              href="/dashboard"
              className="text-[#5c5248] hover:text-[#14100c] transition-colors"
            >
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
