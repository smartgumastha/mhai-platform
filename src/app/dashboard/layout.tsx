"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/providers/auth-context";
import DashboardSidebar from "@/app/components/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  var router = useRouter();
  var { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/80">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  console.log("[DashboardLayout] user object:", user);

  return (
    <div className="grid h-screen grid-cols-[220px_1fr] overflow-hidden">
      <DashboardSidebar
        businessName={user?.business_name || user?.owner_name || "My Clinic"}
      />
      <main className="overflow-y-auto bg-gray-50/80">{children}</main>
    </div>
  );
}
