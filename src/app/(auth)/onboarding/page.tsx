"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/auth-context";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { onboardComplete } from "@/lib/api";

var SPECIALTIES_BY_COUNTRY: Record<string, string[]> = {
  IN: ["Allopathy", "General Medicine", "Family Medicine", "Ayurveda", "Homeopathy", "Unani", "Siddha", "Internal Medicine", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Gynecology"],
  AE: ["General Medicine", "Family Medicine", "Internal Medicine", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Gynecology", "Emergency Medicine", "Surgery"],
  GB: ["General Practice", "Internal Medicine", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Gynecology", "Emergency Medicine", "Surgery"],
  US: ["Family Medicine", "Internal Medicine", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Gynecology", "Emergency Medicine", "Surgery"],
  KE: ["General Medicine", "Family Medicine", "Internal Medicine", "Pediatrics", "Gynecology", "Surgery"],
  SG: ["General Practice", "Internal Medicine", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Gynecology"],
  AU: ["General Practice", "Internal Medicine", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Gynecology", "Emergency Medicine"],
  CA: ["Family Medicine", "Internal Medicine", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Gynecology"],
  DE: ["General Medicine", "Internal Medicine", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Gynecology"],
};

var CITIES_BY_COUNTRY: Record<string, string[]> = {
  IN: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah"],
  GB: ["London", "Manchester", "Birmingham", "Leeds", "Edinburgh", "Glasgow", "Bristol", "Liverpool"],
  US: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego"],
  KE: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"],
  SG: ["Singapore"],
  AU: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  CA: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  DE: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"],
};

var COUNTRY_NAMES: Record<string, string> = {
  IN: "India", AE: "UAE", GB: "UK", US: "USA",
  KE: "Kenya", SG: "Singapore", AU: "Australia", CA: "Canada", DE: "Germany",
};

var FILTER_NOTE: Record<string, string> = {
  IN: "★ India list: Includes AYUSH specialties (Ayurveda, Homeopathy, Unani, Siddha)",
  AE: "★ UAE list: ICD-10-CM aligned, Ayurveda/Homeopathy excluded",
  GB: "★ UK list: NHS-aligned, includes General Practice",
  US: "★ US list: ICD-10-CM aligned, Board-certified specialties",
  KE: "★ Kenya list: KMPDC-aligned specialties",
  SG: "★ Singapore list: SMC-aligned specialties",
  AU: "★ Australia list: AHPRA-aligned specialties",
  CA: "★ Canada list: CPSO-aligned specialties",
  DE: "★ Germany list: LANR-aligned specialties",
};

var DOCTOR_OPTIONS = [
  { num: "1",   label: "Solo practice" },
  { num: "2-5", label: "Small clinic" },
  { num: "6-15",label: "Medium clinic" },
  { num: "16+", label: "Hospital" },
];

function getStartingCountry(): string {
  try {
    return localStorage.getItem("mhai_signup_country") || "IN";
  } catch {
    return "IN";
  }
}

export default function OnboardingPage() {
  var router = useRouter();
  var { user, isLoading: authLoading, isAuthenticated, patchUser } = useAuth();

  var [countryCode, setCountryCode] = useState("IN");
  var [city, setCity] = useState("");
  var [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  var [doctorOption, setDoctorOption] = useState("");
  var [isSubmitting, setIsSubmitting] = useState(false);
  var [error, setError] = useState<string | null>(null);

  // Initialize country from localStorage (set during signup via phone prefix)
  useEffect(() => {
    var cc = getStartingCountry();
    setCountryCode(cc);
    var cities = CITIES_BY_COUNTRY[cc] || CITIES_BY_COUNTRY.IN;
    setCity(cities[0] || "");
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/signup");
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#1ba3d6] border-t-transparent" />
      </div>
    );
  }

  var specialties = SPECIALTIES_BY_COUNTRY[countryCode] || SPECIALTIES_BY_COUNTRY.IN;
  var cities = CITIES_BY_COUNTRY[countryCode] || CITIES_BY_COUNTRY.IN;
  var countryName = COUNTRY_NAMES[countryCode] || countryCode;

  function toggleSpecialty(s: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleSubmit() {
    if (!city.trim()) { setError("Please select a city."); return; }
    if (selectedSpecialties.length === 0) { setError("Please select at least one specialty."); return; }
    if (!doctorOption) { setError("Please select the number of doctors."); return; }

    setIsSubmitting(true);
    setError(null);

    try {
      var payload: any = {
        clinic_info: {
          name: user?.business_name || "",
          city: city,
          phone: user?.phone || "",
          type: selectedSpecialties[0] || "General Medicine",
        },
        modules: [],
        country_code: countryCode,
        regulatory_ids: {},
      };

      var res = await onboardComplete(payload);

      if (res && (res as any).success !== false) {
        // Bug #4 fix: store hms_token from onboard response so HMS API calls work immediately
        var hmsToken = (res as any).hms_token;
        if (hmsToken) {
          try { localStorage.setItem("mhai_hms_token", hmsToken); } catch {}
        }

        // Bug #3 fix: hydrate auth context with hospital_id BEFORE navigation
        var hospitalId = (res as any).hospital_id;
        if (hospitalId) {
          patchUser({ hospital_id: hospitalId });
        }

        // Clean up signup country from localStorage
        try { localStorage.removeItem("mhai_signup_country"); } catch {}

        router.push("/dashboard");
      } else {
        setError((res as any)?.message || (res as any)?.error || "Setup failed. Please try again.");
        setIsSubmitting(false);
        window.scrollTo(0, 0);
      }
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
      window.scrollTo(0, 0);
    }
  }

  return (
    <AuthLayout>
      {/* Progress */}
      <div className="mb-[6px] text-[10.5px] font-extrabold tracking-[0.08em] text-[#0e7ba8]">
        STEP 2 OF 4 · CLINIC SETUP
      </div>
      <div className="mb-5 flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all"
            style={{ background: i === 0 ? "#10b981" : i === 1 ? "#1ba3d6" : "#f1f5f9" }}
          />
        ))}
      </div>

      <h1 className="mb-2 text-[28px] font-extrabold leading-[1.15] tracking-[-0.04em] text-[#020617]">
        Tell us about{" "}
        <span className="text-[#0e7ba8]">your clinic</span>
      </h1>
      <p className="mb-4 text-[14px] leading-[1.5] text-[#475569]">
        We&apos;ll customize <strong className="font-bold text-[#0f172a]">departments, billing &amp; compliance</strong> to your country.
      </p>

      {/* Country detected banner */}
      <div className="mb-4 flex items-center gap-2.5 rounded-[10px] border-[1.5px] border-[rgba(27,163,214,0.25)] bg-[rgba(27,163,214,0.08)] px-3.5 py-3 text-[12px] font-semibold text-[#075985]">
        <span className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-[#10b981] text-[11px] font-black text-white">
          ✓
        </span>
        Country detected: <strong className="ml-1">{countryName}</strong>
        <span className="ml-1 text-[#0e7ba8]">· Showing {countryName} specialties only</span>
      </div>

      {error && (
        <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* City */}
        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-[#334155]">
            City <span className="text-[#1ba3d6]">*</span>
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-[10px] border-[1.5px] border-[#e2e8f0] bg-white px-3.5 py-[11px] text-[14px] text-[#0f172a] font-[inherit] outline-none transition-all focus:border-[#1ba3d6] focus:[box-shadow:0_0_0_4px_rgba(27,163,214,0.08)]"
          >
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Specialties */}
        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-[#334155]">
            Departments / Specialties <span className="text-[#1ba3d6]">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {specialties.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpecialty(s)}
                className={`rounded-[6px] border-[1.5px] px-[11px] py-[6px] text-[11px] font-semibold transition-all ${
                  selectedSpecialties.includes(s)
                    ? "border-[#1ba3d6] bg-[#1ba3d6] text-white"
                    : "border-[#e2e8f0] bg-white text-[#475569] hover:border-[#1ba3d6]"
                }`}
              >
                {selectedSpecialties.includes(s) ? `${s} ✓` : s}
              </button>
            ))}
          </div>
          {FILTER_NOTE[countryCode] && (
            <p className="mt-2 text-[11px] italic text-[#475569]">{FILTER_NOTE[countryCode]}</p>
          )}
        </div>

        {/* Doctor count */}
        <div>
          <label className="mb-1.5 block text-[12px] font-bold text-[#334155]">
            Number of doctors <span className="text-[#1ba3d6]">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DOCTOR_OPTIONS.map((opt) => (
              <button
                key={opt.num}
                type="button"
                onClick={() => setDoctorOption(opt.num)}
                className={`rounded-[10px] border-[1.5px] px-3 py-3.5 text-center transition-all ${
                  doctorOption === opt.num
                    ? "border-[#1ba3d6] bg-[rgba(27,163,214,0.08)]"
                    : "border-[#e2e8f0] bg-white hover:border-[#1ba3d6]"
                }`}
              >
                <div className="text-[18px] font-extrabold text-[#0e7ba8]">{opt.num}</div>
                <div className="mt-0.5 text-[10.5px] font-semibold text-[#475569]">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        disabled={isSubmitting}
        onClick={handleSubmit}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-[10px] py-[13px] text-[15px] font-extrabold tracking-[-0.01em] text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
          boxShadow: "0 10px 24px -6px rgba(124,58,237,0.4)",
        }}
      >
        {isSubmitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Launching your clinic...
          </>
        ) : (
          "Continue to billing setup →"
        )}
      </button>

      <button
        type="button"
        onClick={() => router.push("/signup")}
        className="mt-2 w-full rounded-[10px] border-[1.5px] border-[#e2e8f0] bg-white py-[11px] text-[13px] font-bold text-[#475569] transition-all hover:border-[#1ba3d6] hover:text-[#0f172a]"
      >
        ← Back
      </button>

    </AuthLayout>
  );
}
