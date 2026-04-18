"use client";

import { useMemo } from "react";
import { useLocale } from "@/app/providers/locale-context";

/**
 * useCurrency — canonical currency formatter hook.
 * Reads currency shape from LocaleProvider's v2 locale.
 * Safe fallbacks to INR / ₹ / en-IN if locale not yet loaded.
 * Public API is identical to the pre-T1.2.4b version:
 *   { symbol, code, format, formatCompact }
 */
export function useCurrency() {
  var ctx = useLocale();
  var currency = ctx.localeV2?.currency;

  var code = (currency && currency.code) || "INR";
  var symbol = (currency && currency.symbol) || "\u20B9";
  var formatLocale = (currency && currency.format_locale) || "en-IN";

  var formatter = useMemo(function () {
    try {
      return new Intl.NumberFormat(formatLocale, {
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
  }, [code, formatLocale]);

  function format(amount: number): string {
    return formatter.format(amount);
  }

  function formatCompact(amount: number): string {
    if (code === "INR") {
      if (amount >= 10000000) return symbol + (amount / 10000000).toFixed(1) + "Cr";
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
