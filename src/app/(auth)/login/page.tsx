"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/auth-context";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { showToast } from "@/components/toast";

var inputBase = "w-full rounded-[10px] border-[1.5px] bg-white px-3.5 py-[11px] text-[14px] text-[#0f172a] placeholder-[#94a3b8] font-[inherit] outline-none transition-all";
var inputOk  = "border-[#e2e8f0] focus:border-[#1ba3d6] focus:[box-shadow:0_0_0_4px_rgba(27,163,214,0.08)]";
var inputErr = "border-red-400 focus:border-red-400 focus:[box-shadow:0_0_0_4px_rgba(239,68,68,0.08)]";

export default function LoginPage() {
  var router = useRouter();
  var { loginUser } = useAuth();

  var [email, setEmail] = useState("");
  var [password, setPassword] = useState("");
  var [showPw, setShowPw] = useState(false);
  var [rememberMe, setRememberMe] = useState(false);
  var [errors, setErrors] = useState<Record<string, string>>({});
  var [touched, setTouched] = useState<Record<string, boolean>>({});
  var [apiError, setApiError] = useState("");
  var [loading, setLoading] = useState(false);

  function validateEmail(v: string) {
    return v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Valid email required";
  }
  function validatePassword(v: string) {
    return v ? "" : "Password is required";
  }

  function onEmailBlur() {
    setTouched((p) => ({ ...p, email: true }));
    var e = validateEmail(email);
    setErrors((p) => e ? { ...p, email: e } : (({ email: _, ...rest }) => rest)(p));
  }
  function onPasswordBlur() {
    setTouched((p) => ({ ...p, password: true }));
    var e = validatePassword(password);
    setErrors((p) => e ? { ...p, password: e } : (({ password: _, ...rest }) => rest)(p));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    var ev = validateEmail(email);
    var pv = validatePassword(password);
    var errs: Record<string, string> = {};
    if (ev) errs.email = ev;
    if (pv) errs.password = pv;
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setApiError("");
    var res = await loginUser(email, password);
    setLoading(false);

    if (res.success) {
      router.push("/dashboard");
    } else {
      setApiError(res.error || "Login failed. Please check your credentials.");
    }
  }

  return (
    <AuthLayout>
      <h1 className="mb-2 text-[28px] font-extrabold leading-[1.15] tracking-[-0.04em] text-[#020617]">
        Welcome <span className="text-[#0e7ba8]">back</span>
      </h1>
      <p className="mb-6 text-[14px] leading-[1.5] text-[#475569]">
        Sign in to your <strong className="font-bold text-[#0f172a]">clinic dashboard</strong>
      </p>

      {apiError && (
        <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {apiError}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3.5">
        {/* Email */}
        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-[#334155]">
            Email or phone <span className="text-[#1ba3d6]">*</span>
          </label>
          <input
            className={`${inputBase} ${errors.email && touched.email ? inputErr : inputOk}`}
            type="text"
            placeholder="dr.sai@clinic.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={onEmailBlur}
            autoComplete="email"
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
              className={`${inputBase} pr-14 ${errors.password && touched.password ? inputErr : inputOk}`}
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={onPasswordBlur}
              autoComplete="current-password"
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

        {/* Remember me + Forgot */}
        <div className="flex items-center justify-between text-[12.5px]">
          <label className="flex cursor-pointer items-center gap-1.5 text-[#475569]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => showToast("Password reset coming soon", "info")}
            className="font-bold text-[#0e7ba8] hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] py-[13px] text-[15px] font-extrabold tracking-[-0.01em] text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
            boxShadow: "0 10px 24px -6px rgba(124,58,237,0.4)",
          }}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing in...
            </>
          ) : (
            "Sign in →"
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
      <div className="mb-3.5 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => showToast("Google sign-in coming soon", "info")}
          className="flex items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-[#e2e8f0] bg-white py-[11px] text-[13px] font-bold text-[#0f172a] transition hover:border-[#1ba3d6]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
        <button
          type="button"
          onClick={() => showToast("Facebook sign-in coming soon", "info")}
          className="flex items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-[#e2e8f0] bg-white py-[11px] text-[13px] font-bold text-[#0f172a] transition hover:border-[#1ba3d6]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </button>
      </div>

      <p className="text-center text-[13px] text-[#475569]">
        Don&apos;t have an account?{" "}
        <a href="/signup" className="font-bold text-[#0e7ba8] hover:underline">
          Create one →
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
