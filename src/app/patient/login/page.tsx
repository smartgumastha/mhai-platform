"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/app/providers/locale-context";
import { usePatientAuth } from "../providers/patient-auth-context";

var COUNTRY_CODES = [
  { code: "+91",  flag: "🇮🇳", label: "IN" },
  { code: "+971", flag: "🇦🇪", label: "AE" },
  { code: "+44",  flag: "🇬🇧", label: "GB" },
  { code: "+1",   flag: "🇺🇸", label: "US" },
];

export default function PatientLoginPage() {
  var { sendOtp, verifyOtp } = usePatientAuth();
  var { localeV2 } = useLocale();
  var router = useRouter();

  var defaultCode = localeV2?.country_code === "AE" ? "+971"
    : localeV2?.country_code === "GB" ? "+44"
    : localeV2?.country_code === "US" ? "+1"
    : "+91";

  var [step, setStep] = useState<"phone" | "otp">("phone");
  var [phone, setPhone] = useState("");
  var [otp, setOtp] = useState("");
  var [countryCode, setCountryCode] = useState(defaultCode);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");

  async function handleSendOtp() {
    var trimmed = phone.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    try {
      var res = await sendOtp(countryCode + trimmed);
      if (res.success) setStep("otp");
      else setError(res.message || "Failed to send OTP. Please try again.");
    } catch { setError("Network error. Please check your connection."); }
    finally { setLoading(false); }
  }

  async function handleVerifyOtp() {
    var trimmed = otp.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    try {
      var res = await verifyOtp(countryCode + phone.trim(), trimmed);
      if (res.success) router.push("/patient/dashboard");
      else setError(res.message || "Invalid OTP. Please try again.");
    } catch { setError("Network error. Please check your connection."); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0a2d3d] via-[#0e5c7a] to-[#1ba3d6] px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
          <span className="font-fraunces text-xl font-bold italic text-white">HB</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Health Bank</h1>
        <p className="mt-1.5 max-w-xs text-sm text-white/60">
          Your prescriptions, records, and bills — always with you
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        {step === "phone" ? (
          <>
            <h2 className="mb-0.5 text-lg font-bold text-gray-900">Sign in</h2>
            <p className="mb-5 text-sm text-gray-400">Enter your registered mobile number</p>

            <div className="mb-4">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={function (e) { setCountryCode(e.target.value); }}
                  className="w-[90px] rounded-xl border border-gray-200 bg-gray-50 px-2 py-2.5 text-sm text-gray-800 focus:border-[#1ba3d6] focus:outline-none"
                >
                  {COUNTRY_CODES.map(function (c) {
                    return <option key={c.code} value={c.code}>{c.flag} {c.code}</option>;
                  })}
                </select>
                <input
                  type="tel"
                  value={phone}
                  onChange={function (e) { setPhone(e.target.value.replace(/\D/g, "")); }}
                  onKeyDown={function (e) { if (e.key === "Enter") handleSendOtp(); }}
                  placeholder="9876543210"
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none focus:ring-2 focus:ring-[#1ba3d6]/20"
                  maxLength={15}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            )}

            <button
              onClick={handleSendOtp}
              disabled={loading || phone.trim().length < 7}
              className="w-full rounded-xl bg-[#1ba3d6] py-3 text-sm font-bold text-white transition-colors hover:bg-[#0e7ba8] disabled:opacity-50"
            >
              {loading ? "Sending OTP…" : "Send OTP →"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={function () { setStep("phone"); setOtp(""); setError(""); }}
              className="mb-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              ← Change number
            </button>
            <h2 className="mb-0.5 text-lg font-bold text-gray-900">Enter OTP</h2>
            <p className="mb-5 text-sm text-gray-400">
              Sent to <span className="font-semibold text-gray-700">{countryCode} {phone}</span>
            </p>

            <div className="mb-4">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                6-digit code
              </label>
              <input
                type="number"
                value={otp}
                onChange={function (e) { setOtp(e.target.value.slice(0, 6)); }}
                onKeyDown={function (e) { if (e.key === "Enter") handleVerifyOtp(); }}
                placeholder="• • • • • •"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.4em] text-gray-900 focus:border-[#1ba3d6] focus:outline-none focus:ring-2 focus:ring-[#1ba3d6]/20"
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 4}
              className="w-full rounded-xl bg-[#1ba3d6] py-3 text-sm font-bold text-white transition-colors hover:bg-[#0e7ba8] disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Verify & Sign in"}
            </button>

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="mt-3 w-full text-center text-sm text-[#1ba3d6] hover:underline disabled:opacity-50"
            >
              Resend OTP
            </button>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-white/30">
        Your health data is private and encrypted
      </p>
    </div>
  );
}
