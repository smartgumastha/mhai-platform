"use client";

import { useState } from "react";
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

var engineChips = [
  "Clinic website",
  "Instagram posts",
  "Google reviews",
  "WhatsApp bot",
  "SEO rankings",
  "Patient booking",
  "Facebook ads",
  "Email campaigns",
];

export default function LoginPage() {
  var router = useRouter();
  var { loginUser } = useAuth();
  var { locale } = useLocale();
  var [form, setForm] = useState({ email: "", password: "" });
  var [errors, setErrors] = useState<Record<string, string>>({});
  var [apiError, setApiError] = useState("");
  var [loading, setLoading] = useState(false);
  var [showPw, setShowPw] = useState(false);
  var [touched, setTouched] = useState<Record<string, boolean>>({});

  function onChange(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    if (touched[field]) {
      var v: Record<string, string> = {};
      if (field === "email" && (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)))
        v.email = "Valid email required";
      if (field === "password" && !value) v.password = "Password is required";
      setErrors((prev) => {
        var next = { ...prev };
        if (v[field]) next[field] = v[field]; else delete next[field];
        return next;
      });
    }
  }

  function onBlur(field: string) {
    setTouched((p) => ({ ...p, [field]: true }));
    if (field === "email" && (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)))
      setErrors((p) => ({ ...p, email: "Valid email required" }));
    else if (field === "email") setErrors((p) => { var n = { ...p }; delete n.email; return n; });
    if (field === "password" && !form.password)
      setErrors((p) => ({ ...p, password: "Password is required" }));
    else if (field === "password") setErrors((p) => { var n = { ...p }; delete n.password; return n; });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    var v: Record<string, string> = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) v.email = "Valid email required";
    if (!form.password) v.password = "Password is required";
    if (Object.keys(v).length > 0) { setErrors(v); return; }

    setLoading(true);
    setApiError("");
    var res = await loginUser(form.email, form.password);
    setLoading(false);

    if (res.success) {
      router.push("/dashboard");
    } else {
      setApiError(res.error || "Login failed");
    }
  }

  var inputCls = "h-[42px] w-full rounded-lg border bg-[#111916] px-3 text-[14px] text-[#f0fdf4] placeholder-[#4b5563] outline-none transition";
  var inputOk = "border-[#1f2e28] focus:border-emerald-500";
  var inputErr = "border-red-400";

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
      <h1 className="mb-1.5 text-[21px] font-medium text-[#f0fdf4]">Welcome back</h1>
      <p className="mb-6 text-[12px] leading-relaxed text-gray-400">
        Your AI marketing engine is running. Log in to see results.
      </p>

      {/* API error */}
      {apiError && (
        <div className="mb-4 rounded-lg border border-red-900 bg-[#1c1210] p-3 text-[12px] text-red-300">
          {apiError}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
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

        {/* Password */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[11px] uppercase tracking-wider text-gray-500">Password</label>
            <button
              type="button"
              onClick={() => showToast("Password reset coming soon", "info")}
              className="text-[11px] text-emerald-500"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              className={`${inputCls} pr-14 ${errors.password && touched.password ? inputErr : inputOk}`}
              placeholder="Your password"
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
              Logging in...
            </>
          ) : (
            <>Log in <span className="text-[13px]">→</span></>
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

      {/* Engine preview */}
      <div className="mt-5 rounded-lg border border-emerald-800 bg-[#0d1f17] p-3">
        <p className="mb-2 text-[11px] font-medium text-emerald-500">Your AI engine manages:</p>
        <div className="flex flex-wrap gap-1.5">
          {engineChips.map((c) => (
            <span
              key={c}
              className="rounded border border-[#1f2e28] bg-[#111916] px-2 py-0.5 text-[10px] text-gray-400"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Footer link */}
      <p className="mt-5 text-center text-[12px] text-gray-500">
        New to MediHost AI?{" "}
        <a href="/signup" className="text-emerald-500 hover:underline">
          Start free
        </a>
      </p>

      {/* Trust badges */}
      <div className="mt-4 flex items-center justify-center gap-4">
        {["256-bit SSL", ...locale.compliance_badges.slice(0, 2)].map((t) => (
          <span key={t} className="flex items-center gap-1 text-[10px] text-gray-600">
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
