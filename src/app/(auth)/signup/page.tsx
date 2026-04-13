"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/auth-context";
import { useLocale } from "@/app/providers/locale-context";
import { showToast } from "@/components/toast";

var channels = [
  { name: "Instagram", color: "#c13584" },
  { name: "Facebook", color: "#1877f2" },
  { name: "Google", color: "#ea4335" },
  { name: "WhatsApp", color: "#25d366" },
  { name: "LinkedIn", color: "#0a66c2" },
  { name: "SEO", color: "#f59e0b" },
  { name: "Website", color: "#10b981" },
];

var PHONE_PREFIXES = [
  { code: "+91", country: "India", flag: "IN" },
  { code: "+971", country: "UAE", flag: "AE" },
  { code: "+44", country: "UK", flag: "GB" },
  { code: "+1", country: "US", flag: "US" },
  { code: "+254", country: "Kenya", flag: "KE" },
  { code: "+65", country: "Singapore", flag: "SG" },
  { code: "+49", country: "Germany", flag: "DE" },
  { code: "+61", country: "Australia", flag: "AU" },
  { code: "+234", country: "Nigeria", flag: "NG" },
  { code: "+27", country: "South Africa", flag: "ZA" },
];

function validate(
  f: { business_name: string; email: string; phone: string; password: string },
  phoneDigits: number,
  prefixManuallyChanged: boolean
) {
  var e: Record<string, string> = {};
  if (!f.business_name || f.business_name.length < 2) e.business_name = "Name is required";
  if (!f.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Valid email required";
  var digits = f.phone.replace(/[\s\-()]/g, "");
  if (!digits) {
    e.phone = "Phone required";
  } else if (prefixManuallyChanged) {
    if (digits.length < 7 || digits.length > 15) e.phone = "7-15 digits required";
  } else {
    if (digits.length < phoneDigits) e.phone = phoneDigits + " digits required";
  }
  if (!f.password || f.password.length < 8) e.password = "Min 8 characters";
  return e;
}

export default function SignupPage() {
  var router = useRouter();
  var { signupUser } = useAuth();
  var { locale } = useLocale();
  var [form, setForm] = useState({ business_name: "", email: "", phone: "", password: "" });
  var [errors, setErrors] = useState<Record<string, string>>({});
  var [apiError, setApiError] = useState("");
  var [loading, setLoading] = useState(false);
  var [showPw, setShowPw] = useState(false);
  var [touched, setTouched] = useState<Record<string, boolean>>({});
  var [phonePrefix, setPhonePrefix] = useState(locale.phone_prefix);
  var [prefixManuallyChanged, setPrefixManuallyChanged] = useState(false);
  var [showPrefixPicker, setShowPrefixPicker] = useState(false);
  var pickerRef = useRef<HTMLDivElement>(null);

  // Sync prefix with locale when locale changes (only if not manually changed)
  useEffect(() => {
    if (!prefixManuallyChanged) setPhonePrefix(locale.phone_prefix);
  }, [locale.phone_prefix, prefixManuallyChanged]);

  // Close picker on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPrefixPicker(false);
      }
    }
    if (showPrefixPicker) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPrefixPicker]);

  function onChange(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    if (touched[field]) {
      var v = validate({ ...form, [field]: value }, locale.phone_digits, prefixManuallyChanged);
      setErrors((prev) => {
        var next = { ...prev };
        if (v[field]) next[field] = v[field]; else delete next[field];
        return next;
      });
    }
  }

  function onBlur(field: string) {
    setTouched((p) => ({ ...p, [field]: true }));
    var v = validate(form, locale.phone_digits, prefixManuallyChanged);
    if (v[field]) setErrors((p) => ({ ...p, [field]: v[field] }));
    else setErrors((p) => { var n = { ...p }; delete n[field]; return n; });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    var v = validate(form, locale.phone_digits, prefixManuallyChanged);
    setTouched({ business_name: true, email: true, phone: true, password: true });
    if (Object.keys(v).length > 0) { setErrors(v); return; }

    setLoading(true);
    setApiError("");
    var fullPhone = phonePrefix + form.phone.replace(/[\s\-()]/g, "");
    var res = await signupUser(form.email, form.business_name, fullPhone, form.password);
    setLoading(false);

    if (res.success) {
      router.push("/onboarding");
    } else {
      setApiError(res.error || "Signup failed");
    }
  }

  var inputCls = "h-[42px] w-full rounded-lg border bg-[#111916] px-3 text-[14px] text-[#f0fdf4] placeholder-[#4b5563] outline-none transition";
  var inputOk = "border-[#1f2e28] focus:border-emerald-500";
  var inputErr = "border-red-400";

  var badges = ["No card needed", ...locale.compliance_badges.slice(0, 2)];

  return (
    <div className="w-full max-w-[380px]">
      {/* Logo */}
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-emerald-500">
          <span className="text-[11px] font-medium tracking-[0.5px] text-[#064e3b]">MHAI</span>
        </div>
        <div>
          <div className="text-[17px] font-medium text-white">
            Medi<span className="text-emerald-400">Host</span>{" "}
            <span className="text-[13px] text-gray-500">AI</span>
          </div>
          <div className="text-[11px] text-gray-500">AI marketing platform for healthcare</div>
        </div>
      </div>

      {/* Channel strip */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {channels.map((ch) => (
          <span
            key={ch.name}
            className="flex h-[26px] items-center gap-1.5 rounded-full border border-[#1f2e28] bg-[#111916] px-2.5 text-[11px] text-gray-500"
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: ch.color }} />
            {ch.name}
          </span>
        ))}
      </div>

      {/* Title */}
      <h1 className="mb-1.5 text-[21px] font-medium text-[#f0fdf4]">Start free</h1>
      <p className="mb-6 text-[12px] leading-relaxed text-gray-400">
        AI runs your {locale.terminology.clinic}&apos;s marketing across every channel. Website, social, reviews, WhatsApp — all on autopilot.
      </p>

      {/* API error */}
      {apiError && (
        <div className="mb-4 rounded-lg border border-red-900 bg-[#1c1210] p-3 text-[12px] text-red-300">
          {apiError}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Clinic/Practice name */}
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">
            {locale.terminology.clinic} name
          </label>
          <input
            className={`${inputCls} ${errors.business_name && touched.business_name ? inputErr : inputOk}`}
            placeholder={"e.g. Sunrise Dental " + locale.terminology.clinic.charAt(0).toUpperCase() + locale.terminology.clinic.slice(1)}
            value={form.business_name}
            onChange={(e) => onChange("business_name", e.target.value)}
            onBlur={() => onBlur("business_name")}
          />
          {errors.business_name && touched.business_name && (
            <p className="mt-1 text-[11px] text-red-400">{errors.business_name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">Email</label>
          <input
            type="email"
            className={`${inputCls} ${errors.email && touched.email ? inputErr : inputOk}`}
            placeholder="you@clinic.com"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            onBlur={() => onBlur("email")}
          />
          {errors.email && touched.email && (
            <p className="mt-1 text-[11px] text-red-400">{errors.email}</p>
          )}
        </div>

        {/* Phone with prefix picker */}
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">Phone</label>
          <div className="relative flex gap-2">
            <div ref={pickerRef} className="relative">
              <button
                type="button"
                onClick={() => setShowPrefixPicker(!showPrefixPicker)}
                className="flex h-[42px] w-[72px] items-center justify-center gap-1 rounded-lg border border-[#1f2e28] bg-[#111916] text-[12px] text-gray-400 hover:border-emerald-500 transition"
              >
                {phonePrefix}
                <span className="text-[9px] text-gray-600">&#9662;</span>
              </button>
              {showPrefixPicker && (
                <div className="absolute left-0 top-[46px] z-50 w-[220px] rounded-lg border border-[#1f2e28] bg-[#111916] py-1 shadow-xl max-h-[280px] overflow-y-auto">
                  {PHONE_PREFIXES.map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => {
                        setPhonePrefix(p.code);
                        setPrefixManuallyChanged(true);
                        setShowPrefixPicker(false);
                      }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] transition hover:bg-[#1f2e28] ${
                        phonePrefix === p.code ? "text-emerald-400" : "text-gray-400"
                      }`}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-[#1f2e28] text-[9px] font-medium text-gray-500">
                        {p.flag}
                      </span>
                      <span className="flex-1">{p.country}</span>
                      <span className="text-gray-600">{p.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              className={`${inputCls} flex-1 ${errors.phone && touched.phone ? inputErr : inputOk}`}
              placeholder={locale.phone_placeholder}
              value={form.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              onBlur={() => onBlur("phone")}
            />
          </div>
          {errors.phone && touched.phone && (
            <p className="mt-1 text-[11px] text-red-400">{errors.phone}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              className={`${inputCls} pr-14 ${errors.password && touched.password ? inputErr : inputOk}`}
              placeholder="Min 8 characters"
              value={form.password}
              onChange={(e) => onChange("password", e.target.value)}
              onBlur={() => onBlur("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-600"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && touched.password && (
            <p className="mt-1 text-[11px] text-red-400">{errors.password}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 text-[15px] font-medium text-[#064e3b] transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#064e3b] border-t-transparent" />
              Creating account...
            </>
          ) : (
            <>Start free <span className="text-[13px]">&rarr;</span></>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#1f2e28]" />
        <span className="text-[11px] text-gray-700">or</span>
        <div className="h-px flex-1 bg-[#1f2e28]" />
      </div>

      {/* Google */}
      <button
        onClick={() => showToast("Google login coming soon", "info")}
        className="relative flex h-[42px] w-full items-center justify-center gap-2 rounded-lg border border-[#1f2e28] bg-[#111916] text-[13px] text-gray-400 transition hover:border-[#2a3f35]"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#1f2e28] text-[11px] font-bold text-gray-400">
          G
        </span>
        Continue with Google
        <span className="absolute -top-[7px] right-[10px] rounded bg-[#1f2e28] px-1.5 text-[9px] text-gray-500">
          soon
        </span>
      </button>

      {/* Footer link */}
      <p className="mt-5 text-center text-[12px] text-gray-500">
        Already have an account?{" "}
        <a href="/login" className="text-emerald-500 hover:underline">
          Log in
        </a>
      </p>

      {/* Trust badges */}
      <div className="mt-4 flex items-center justify-center gap-4">
        {badges.map((t) => (
          <span key={t} className="flex items-center gap-1 text-[10px] text-gray-600">
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
