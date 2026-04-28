"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/auth-context";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { showToast } from "@/components/toast";
import { GoogleButton } from "@/components/auth/GoogleButton";

var PHONE_PREFIXES = [
  { code: "+91",  country: "India",        flag: "🇮🇳", countryCode: "IN", placeholder: "98765 43210" },
  { code: "+971", country: "UAE",          flag: "🇦🇪", countryCode: "AE", placeholder: "55 123 4567" },
  { code: "+44",  country: "UK",           flag: "🇬🇧", countryCode: "GB", placeholder: "7911 123456" },
  { code: "+1",   country: "US / Canada",  flag: "🇺🇸", countryCode: "US", placeholder: "555 123 4567" },
  { code: "+254", country: "Kenya",        flag: "🇰🇪", countryCode: "KE", placeholder: "712 345 678" },
  { code: "+65",  country: "Singapore",    flag: "🇸🇬", countryCode: "SG", placeholder: "9123 4567" },
  { code: "+49",  country: "Germany",      flag: "🇩🇪", countryCode: "DE", placeholder: "1511 234567" },
  { code: "+61",  country: "Australia",    flag: "🇦🇺", countryCode: "AU", placeholder: "412 345 678" },
];

var inputBase = "w-full rounded-[10px] border-[1.5px] bg-white px-3.5 py-[11px] text-[14px] text-[#0f172a] placeholder-[#94a3b8] font-[inherit] outline-none transition-all";
var inputOk  = "border-[#e2e8f0] focus:border-[#1ba3d6] focus:[box-shadow:0_0_0_4px_rgba(27,163,214,0.08)]";
var inputErr = "border-red-400 focus:border-red-400 focus:[box-shadow:0_0_0_4px_rgba(239,68,68,0.08)]";

function cls(base: string, ok: string, err: string, hasErr: boolean) {
  return base + " " + (hasErr ? err : ok);
}

export default function SignupPage() {
  var router = useRouter();
  var { signupUser } = useAuth();

  var [form, setForm] = useState({ ownerName: "", clinicName: "", phone: "", email: "", password: "" });
  var [errors, setErrors] = useState<Record<string, string>>({});
  var [touched, setTouched] = useState<Record<string, boolean>>({});
  var [apiError, setApiError] = useState("");
  var [loading, setLoading] = useState(false);
  var [showPw, setShowPw] = useState(false);

  var [prefix, setPrefix] = useState(PHONE_PREFIXES[0]);
  var [showPicker, setShowPicker] = useState(false);
  var pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    }
    if (showPicker) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  function validate(f: typeof form) {
    var e: Record<string, string> = {};
    if (!f.ownerName.trim() || f.ownerName.trim().length < 2) e.ownerName = "Your name is required";
    if (!f.clinicName.trim() || f.clinicName.trim().length < 2) e.clinicName = "Clinic name is required";
    if (!f.phone.replace(/\D/g, "") || f.phone.replace(/\D/g, "").length < 6) e.phone = "Valid phone required";
    if (!f.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Valid email required";
    if (!f.password || f.password.length < 8) e.password = "Min 8 characters";
    return e;
  }

  function onChange(field: keyof typeof form, value: string) {
    var next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) {
      var v = validate(next);
      setErrors((p) => { var n = { ...p }; if (v[field]) n[field] = v[field]; else delete n[field]; return n; });
    }
  }

  function onBlur(field: keyof typeof form) {
    setTouched((p) => ({ ...p, [field]: true }));
    var v = validate(form);
    setErrors((p) => { var n = { ...p }; if (v[field]) n[field] = v[field]; else delete n[field]; return n; });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ ownerName: true, clinicName: true, phone: true, email: true, password: true });
    var v = validate(form);
    if (Object.keys(v).length > 0) { setErrors(v); return; }

    setLoading(true);
    setApiError("");
    var fullPhone = prefix.code + form.phone.replace(/\s/g, "");
    var res = await signupUser(form.email, form.ownerName.trim(), form.clinicName.trim(), fullPhone, form.password);
    setLoading(false);

    if (res.success) {
      // Store selected country for onboarding to read
      try { localStorage.setItem("mhai_signup_country", prefix.countryCode); } catch {}
      router.push("/onboarding");
    } else {
      setApiError(res.error || "Signup failed. Please try again.");
    }
  }

  return (
    <AuthLayout>
      {/* Trial pill */}
      <div className="mb-4 inline-block rounded-[20px] border border-[rgba(27,163,214,0.2)] bg-[rgba(27,163,214,0.08)] px-3 py-[5px] text-[10.5px] font-extrabold tracking-[0.05em] text-[#0e7ba8]">
        ⚡ FREE 30-DAY TRIAL
      </div>

      <h1 className="mb-2 text-[28px] font-extrabold leading-[1.15] tracking-[-0.04em] text-[#020617]">
        Run your clinic{" "}
        <span className="text-[#0e7ba8]">on autopilot</span>
      </h1>
      <p className="mb-5 text-[14px] leading-[1.5] text-[#475569]">
        <strong className="font-bold text-[#0f172a]">No credit card</strong> · 4-market ready · NABH-aware
      </p>

      {apiError && (
        <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {apiError}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3.5">
        {/* Your name */}
        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-[#334155]">
            Your name <span className="text-[#1ba3d6]">*</span>
          </label>
          <input
            className={cls(inputBase, inputOk, inputErr, !!(errors.ownerName && touched.ownerName))}
            type="text"
            placeholder="Dr. Sai Kumar"
            value={form.ownerName}
            onChange={(e) => onChange("ownerName", e.target.value)}
            onBlur={() => onBlur("ownerName")}
          />
          {errors.ownerName && touched.ownerName && (
            <p className="mt-1 text-[11px] text-red-500">{errors.ownerName}</p>
          )}
        </div>

        {/* Clinic name */}
        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-[#334155]">
            Clinic name <span className="text-[#1ba3d6]">*</span>
          </label>
          <input
            className={cls(inputBase, inputOk, inputErr, !!(errors.clinicName && touched.clinicName))}
            type="text"
            placeholder="Apollo Clinic"
            value={form.clinicName}
            onChange={(e) => onChange("clinicName", e.target.value)}
            onBlur={() => onBlur("clinicName")}
          />
          {errors.clinicName && touched.clinicName && (
            <p className="mt-1 text-[11px] text-red-500">{errors.clinicName}</p>
          )}
        </div>

        {/* Phone with country picker */}
        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-[#334155]">
            Phone <span className="text-[#1ba3d6]">*</span>
          </label>
          <div className="grid gap-2" style={{ gridTemplateColumns: "110px 1fr" }}>
            <div ref={pickerRef} className="relative">
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="flex h-full w-full items-center justify-between gap-1 rounded-[10px] border-[1.5px] border-[#e2e8f0] bg-white px-3 text-[13px] text-[#0f172a] transition-all hover:border-[#1ba3d6]"
              >
                <span>{prefix.flag} {prefix.code}</span>
                <span className="text-[9px] text-[#94a3b8]">▼</span>
              </button>
              {showPicker && (
                <div className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-[240px] w-[220px] overflow-y-auto rounded-[10px] border border-[#e2e8f0] bg-white shadow-xl">
                  {PHONE_PREFIXES.map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => { setPrefix(p); setShowPicker(false); }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] transition hover:bg-[#f1f5f9] ${
                        prefix.code === p.code ? "font-bold text-[#0e7ba8]" : "text-[#0f172a]"
                      }`}
                    >
                      <span>{p.flag}</span>
                      <span className="flex-1">{p.country}</span>
                      <span className="text-[#94a3b8]">{p.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              className={cls(inputBase, inputOk, inputErr, !!(errors.phone && touched.phone))}
              type="tel"
              placeholder={prefix.placeholder}
              value={form.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              onBlur={() => onBlur("phone")}
            />
          </div>
          {errors.phone && touched.phone && (
            <p className="mt-1 text-[11px] text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-[#334155]">
            Email <span className="text-[#1ba3d6]">*</span>
          </label>
          <input
            className={cls(inputBase, inputOk, inputErr, !!(errors.email && touched.email))}
            type="email"
            placeholder="dr.sai@clinic.com"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            onBlur={() => onBlur("email")}
          />
          {errors.email && touched.email && (
            <p className="mt-1 text-[11px] text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-[#334155]">
            Password <span className="text-[#1ba3d6]">*</span>
          </label>
          <div className="relative">
            <input
              className={cls(inputBase + " pr-14", inputOk, inputErr, !!(errors.password && touched.password))}
              type={showPw ? "text" : "password"}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => onChange("password", e.target.value)}
              onBlur={() => onBlur("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#94a3b8] hover:text-[#475569]"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && touched.password && (
            <p className="mt-1 text-[11px] text-red-500">{errors.password}</p>
          )}
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-[10px] py-[13px] text-[15px] font-extrabold tracking-[-0.01em] text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
            boxShadow: "0 10px 24px -6px rgba(124,58,237,0.4)",
          }}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Creating account...
            </>
          ) : (
            "Start free trial →"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-[18px] flex items-center gap-3 text-[11px] font-bold tracking-[0.08em] text-[#94a3b8]">
        <div className="h-px flex-1 bg-[#e2e8f0]" />
        OR CONTINUE WITH
        <div className="h-px flex-1 bg-[#e2e8f0]" />
      </div>

      {/* Social buttons */}
      <div className="mb-3.5">
        <GoogleButton mode="signup" />
      </div>

      <p className="text-center text-[13px] text-[#475569]">
        Already have an account?{" "}
        <a href="/login" className="font-bold text-[#0e7ba8] hover:underline">
          Sign in →
        </a>
      </p>

      {/* Compliance badges */}
      <div className="mt-5 flex flex-wrap justify-center gap-2 border-t border-[#f1f5f9] pt-[18px]">
        {["DPDPA", "HIPAA", "ABDM", "NABH"].map((badge) => (
          <span
            key={badge}
            className="flex items-center gap-[5px] rounded-[20px] border border-[#e2e8f0] bg-white px-[11px] py-[5px] text-[10px] font-bold tracking-[0.05em] text-[#475569]"
          >
            <span className="h-[6px] w-[6px] rounded-full bg-[#1ba3d6]" />
            {badge}
          </span>
        ))}
      </div>
    </AuthLayout>
  );
}
