"use client";

import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "./locale-context";
import { AuthProvider } from "./auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/nextauth">
      <LocaleProvider>
        <AuthProvider>{children}</AuthProvider>
      </LocaleProvider>
    </SessionProvider>
  );
}
