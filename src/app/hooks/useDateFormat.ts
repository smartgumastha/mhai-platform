"use client";

import { useMemo } from "react";
import { useLocale } from "@/app/providers/locale-context";

/**
 * useDateFormat — canonical datetime formatting hook.
 * Wraps Intl.DateTimeFormat using locale's timezone and format preferences.
 */
export function useDateFormat() {
  var ctx = useLocale();
  var dt = ctx.localeV2?.datetime;
  var currencyLocale = ctx.localeV2?.currency?.format_locale;

  var dateFormat = dt?.date_format || "DD/MM/YYYY";
  var timeFormat = dt?.time_format || "HH:mm";
  var timezone = dt?.timezone || "Asia/Kolkata";
  var clockStyle = dt?.clock_style || "24h";
  var intlLocale = currencyLocale || "en-IN";

  var dateFormatter = useMemo(function () {
    try {
      return new Intl.DateTimeFormat(intlLocale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: timezone,
      });
    } catch {
      return new Intl.DateTimeFormat("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    }
  }, [intlLocale, timezone]);

  var timeFormatter = useMemo(function () {
    try {
      return new Intl.DateTimeFormat(intlLocale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: clockStyle === "12h",
        timeZone: timezone,
      });
    } catch {
      return new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
  }, [intlLocale, timezone, clockStyle]);

  var dateTimeFormatter = useMemo(function () {
    try {
      return new Intl.DateTimeFormat(intlLocale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: clockStyle === "12h",
        timeZone: timezone,
      });
    } catch {
      return new Intl.DateTimeFormat("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
  }, [intlLocale, timezone, clockStyle]);

  /** Accepts Date | number | ISO string. Returns empty string on invalid input. */
  function toDate(input: Date | number | string | null | undefined): Date | null {
    if (input == null) return null;
    if (input instanceof Date) return input;
    var d = new Date(input);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  function formatDate(input: Date | number | string | null | undefined): string {
    var d = toDate(input);
    if (!d) return "";
    return dateFormatter.format(d);
  }

  function formatTime(input: Date | number | string | null | undefined): string {
    var d = toDate(input);
    if (!d) return "";
    return timeFormatter.format(d);
  }

  function formatDateTime(input: Date | number | string | null | undefined): string {
    var d = toDate(input);
    if (!d) return "";
    return dateTimeFormatter.format(d);
  }

  return {
    dateFormat: dateFormat,
    timeFormat: timeFormat,
    timezone: timezone,
    clockStyle: clockStyle,
    formatDate: formatDate,
    formatTime: formatTime,
    formatDateTime: formatDateTime,
  };
}
