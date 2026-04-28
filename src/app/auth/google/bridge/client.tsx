"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/api";
import { useAuth } from "@/app/providers/auth-context";

export default function GoogleBridgeClient({
  railwayJwt,
  partner,
}: {
  railwayJwt: string;
  partner: Record<string, any> | null;
}) {
  var router = useRouter();
  var { patchUser } = useAuth();

  useEffect(() => {
    setToken(railwayJwt);
    if (partner) patchUser(partner);
    router.replace("/dashboard");
  }, [railwayJwt, partner, router, patchUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-[#7c3aed]/20 border-t-[#7c3aed]" />
        <p className="text-[14px] font-semibold text-[#475569]">
          Completing Google sign-in&hellip;
        </p>
      </div>
    </div>
  );
}
