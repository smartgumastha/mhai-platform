"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/app/providers/auth-context";
import { getBrandSettings } from "@/lib/api";

type DashboardCtx = {
  brand: Record<string, any> | null;
  hospital: {
    hospital_id: string | null;
    business_name: string;
  };
  isLoading: boolean;
};

var DashboardContext = createContext<DashboardCtx>({
  brand: null,
  hospital: { hospital_id: null, business_name: "" },
  isLoading: true,
});

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  var { user } = useAuth();
  var [brand, setBrand] = useState<Record<string, any> | null>(null);
  var [isLoading, setIsLoading] = useState(true);

  useEffect(function () {
    getBrandSettings()
      .then(function (res) {
        if (res.success && res.data) {
          setBrand(res.data);
        }
      })
      .catch(function () {})
      .finally(function () { setIsLoading(false); });
  }, []);

  var value: DashboardCtx = {
    brand: brand,
    hospital: {
      hospital_id: (user && user.hospital_id) || null,
      business_name: (user && (user as any).business_name) || "",
    },
    isLoading: isLoading,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
