"use client";

import { useMemo } from "react";
import { useDashboard } from "@/app/dashboard/contexts/DashboardContext";

var CURRENCY_LOCALES: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "de-DE",
  AED: "en-AE",
  KES: "en-KE",
  SGD: "en-SG",
};

export function useCurrency() {
  var { locale } = useDashboard();
  var code = locale.currency_code || "INR";
  var symbol = locale.currency_symbol || "\u20B9";

  var formatter = useMemo(function () {
    var loc = CURRENCY_LOCALES[code] || "en-IN";
    try {
      return new Intl.NumberFormat(loc, {
        style: "currency",
        currency: code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } catch {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
  }, [code]);

  function format(amount: number): string {
    return formatter.format(amount);
  }

  function formatCompact(amount: number): string {
    if (code === "INR") {
      if (amount >= 100000) return symbol + (amount / 100000).toFixed(1) + "L";
      if (amount >= 1000) return symbol + (amount / 1000).toFixed(1) + "K";
    } else {
      if (amount >= 1000000) return symbol + (amount / 1000000).toFixed(1) + "M";
      if (amount >= 1000) return symbol + (amount / 1000).toFixed(1) + "K";
    }
    if (amount > 0) return symbol + String(amount);
    return symbol + "0";
  }

  return { symbol: symbol, code: code, format: format, formatCompact: formatCompact };
}
