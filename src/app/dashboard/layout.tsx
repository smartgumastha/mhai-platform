"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/providers/auth-context";
import { DashboardProvider } from "@/app/dashboard/contexts/DashboardContext";
import { NotificationProvider } from "@/app/providers/NotificationProvider";
import DashboardSidebar from "@/app/components/DashboardSidebar";
import TrialBanner from "@/app/components/TrialBanner";

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
    <DashboardProvider>
      <NotificationProvider>
        <div className="flex h-screen flex-col overflow-hidden">
          <TrialBanner />
          <div className="grid flex-1 grid-cols-[220px_1fr] overflow-hidden">
            <DashboardSidebar
              businessName={user?.business_name || user?.owner_name || "My Clinic"}
            />
            <main className="overflow-y-auto bg-gray-50/80">{children}</main>
          </div>
        </div>
      </NotificationProvider>
    </DashboardProvider>
  );
}
