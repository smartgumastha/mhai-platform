"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/app/providers/auth-context";
import { useLocale } from "@/app/providers/locale-context";
import { getBrandSettings } from "@/lib/api";

type DashboardCtx = {
  brand: Record<string, any> | null;
  locale: {
    country: string;
    currency_code: string;
    currency_symbol: string;
  };
  hospital: {
    hospital_id: string | null;
    business_name: string;
  };
  isLoading: boolean;
};

var DashboardContext = createContext<DashboardCtx>({
  brand: null,
  locale: { country: "IN", currency_code: "INR", currency_symbol: "\u20B9" },
  hospital: { hospital_id: null, business_name: "" },
  isLoading: true,
});

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  var { user } = useAuth();
  var { locale: localeData, country } = useLocale();
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
    locale: {
      country: country,
      currency_code: localeData.currency_code,
      currency_symbol: localeData.currency_symbol,
    },
    hospital: {
      hospital_id: user?.hospital_id || null,
      business_name: user?.business_name || "",
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
