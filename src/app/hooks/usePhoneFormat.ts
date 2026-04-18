"use client";

import { useMemo } from "react";
import { useLocale } from "@/app/providers/locale-context";

/**
 * usePhoneFormat — canonical phone formatting hook.
 * Reads phone shape from LocaleProvider's v2 locale.
 * Safe fallbacks to +91 / 10 digits if locale not yet loaded.
 */
export function usePhoneFormat() {
  var ctx = useLocale();
  var phone = ctx.localeV2?.phone;

  var countryCode = phone?.country_code || "+91";
  var displayFormat = phone?.display_format || "+91 XXXXX XXXXX";
  var placeholder = phone?.placeholder || "+91 98765 43210";
  var regex = phone?.regex || "^[6-9]\\d{9}$";
  var digitCount = phone?.digit_count || 10;

  var validator = useMemo(function () {
    try {
      return new RegExp(regex);
    } catch {
      return /^[6-9]\d{9}$/;
    }
  }, [regex]);

  /** Strip all non-digit characters, return last digitCount digits. */
  function normalize(input: string): string {
    var digits = (input || "").replace(/\D/g, "");
    if (digits.length > digitCount) return digits.slice(-digitCount);
    return digits;
  }

  /** Strip the country code prefix if present. */
  function stripPrefix(raw: string): string {
    var s = (raw || "").trim();
    if (s.startsWith(countryCode)) return s.slice(countryCode.length).trim();
    if (s.startsWith(countryCode.replace("+", ""))) {
      return s.slice(countryCode.replace("+", "").length).trim();
    }
    return s;
  }

  /** Prepend the country code if not already present. */
  function addPrefix(raw: string): string {
    var s = (raw || "").trim();
    if (!s) return "";
    if (s.startsWith("+")) return s;
    var digits = s.replace(/\D/g, "");
    return countryCode + " " + digits;
  }

  /** Validate against the locale's phone regex, after stripping prefix. */
  function isValid(raw: string): boolean {
    var stripped = stripPrefix(raw).replace(/\D/g, "");
    return validator.test(stripped);
  }

  /** Format the last digitCount digits using the displayFormat mask. */
  function formatInput(raw: string): string {
    var digits = normalize(stripPrefix(raw));
    if (!digits) return "";
    var mask = displayFormat;
    var prefixPart = mask.split(" ")[0];
    var body = mask.substring(prefixPart.length + 1);
    var out = prefixPart + " ";
    var di = 0;
    for (var i = 0; i < body.length && di < digits.length; i++) {
      var ch = body[i];
      if (ch === "X") {
        out += digits[di];
        di++;
      } else {
        out += ch;
      }
    }
    return out.trimEnd();
  }

  return {
    countryCode: countryCode,
    displayFormat: displayFormat,
    placeholder: placeholder,
    regex: regex,
    digitCount: digitCount,
    normalize: normalize,
    stripPrefix: stripPrefix,
    addPrefix: addPrefix,
    isValid: isValid,
    formatInput: formatInput,
  };
}
