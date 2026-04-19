"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/auth-context";
import { useLocale, COUNTRY_NAMES } from "@/app/providers/locale-context";
import { onboardComplete } from "@/lib/api";

var BASE_SPECIALTIES = [
  { id: "dental", label: "Dental", sub: "General dentistry, orthodontics, implants", icon: "D" },
  { id: "orthopedics", label: "Orthopedics", sub: "Joint replacement, sports medicine", icon: "O" },
  { id: "dermatology", label: "Dermatology", sub: "Skin care, cosmetic, laser", icon: "D" },
  { id: "general", label: "General medicine", sub: "Family practice, internal medicine", icon: "G" },
  { id: "cardiology", label: "Cardiology", sub: "Heart care, interventional", icon: "C" },
  { id: "pediatrics", label: "Pediatrics", sub: "Child health, vaccination", icon: "P" },
  { id: "ophthalmology", label: "Ophthalmology", sub: "Eye care, LASIK, cataract", icon: "E" },
];

// ── Page-local: city dropdown population by country (T1.2.4b-phase2) ──
var CITIES_BY_COUNTRY: Record<string, string[]> = {
  IN: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad"],
  US: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego"],
  GB: ["London", "Manchester", "Birmingham", "Leeds", "Edinburgh", "Glasgow", "Bristol", "Liverpool"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah"],
  KE: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"],
  SG: ["Singapore"],
  AU: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  CA: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  DE: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"],
};

// ── Page-local: country-specific specialty additions (T1.2.4b-phase2) ──
// Preserves geo-localization patent claim without depending on shim's extra_specialties.
var EXTRA_SPECIALTIES: Record<string, Array<{ id: string; label: string; sub: string; icon: string }>> = {
  IN: [
    { id: "ayurveda", label: "Ayurveda", sub: "Traditional medicine", icon: "🌿" },
    { id: "homeopathy", label: "Homeopathy", sub: "Natural remedies", icon: "💧" },
    { id: "siddha", label: "Siddha", sub: "Tamil traditional medicine", icon: "🌾" },
  ],
  AE: [
    { id: "aesthetic", label: "Aesthetic Medicine", sub: "Non-surgical cosmetic", icon: "✨" },
    { id: "cosmetic_surgery", label: "Cosmetic Surgery", sub: "Surgical aesthetic", icon: "💎" },
  ],
  GB: [
    { id: "nhs_dental", label: "NHS Dental", sub: "NHS-registered practice", icon: "🇬🇧" },
    { id: "private_gp", label: "Private GP", sub: "Private general practice", icon: "🩺" },
  ],
  US: [],
  KE: [],
  SG: [],
  AU: [],
  CA: [],
  DE: [],
};

export default function OnboardingPage() {
  var router = useRouter();
  var { user, isLoading: authLoading, isAuthenticated } = useAuth();
  var { localeV2, country, setCountryFromCity, switchedFromCity, didAutoSwitch } = useLocale();
  var terminologyClinic = (localeV2 && localeV2.ai_content && localeV2.ai_content.terminology_style && localeV2.ai_content.terminology_style.clinic_word) || "clinic";
  var terminologyOptimize = (localeV2 && localeV2.ai_content && localeV2.ai_content.terminology_style && localeV2.ai_content.terminology_style.optimize) || "optimize";
  var terminologySpecialty = (localeV2 && localeV2.ai_content && localeV2.ai_content.terminology_style && localeV2.ai_content.terminology_style.specialty) || "specialty";
  var terminologyClinicTitle = terminologyClinic.charAt(0).toUpperCase() + terminologyClinic.slice(1);

  // ── City auto-prefill when country changes (T1.2.4b-phase2) ──
  var [userEditedCity, setUserEditedCity] = useState(false);
  useEffect(function () {
    if (userEditedCity) return;
    var defaultCity = (CITIES_BY_COUNTRY[country] || [])[0] || "";
    if (defaultCity && !city) setCity(defaultCity);
  }, [country]);

  var [currentStep, setCurrentStep] = useState(1);
  var [specialty, setSpecialty] = useState("");
  var [customSpecialty, setCustomSpecialty] = useState("");
  var [city, setCity] = useState((CITIES_BY_COUNTRY[country] || [])[0] || "");
  var [doctorCount, setDoctorCount] = useState(1);
  var [isSubmitting, setIsSubmitting] = useState(false);
  var [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signup");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  var allSpecialties = [
    ...BASE_SPECIALTIES,
    ...(EXTRA_SPECIALTIES[country] || []),
    { id: "other", label: "Other", sub: "Type your specialty...", icon: "+" },
  ];

  var specialtyLabel = specialty === "other" ? customSpecialty : (allSpecialties.find((s) => s.id === specialty)?.label || specialty);

  function handleCityChange(val: string) {
    setUserEditedCity(true);
    setCity(val);
  }

  function handleCityBlur() {
    if (city.trim()) setCountryFromCity(city.trim());
  }

  function handleCityChip(c: string) {
    setUserEditedCity(true);
    setCity(c);
    setCountryFromCity(c);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    var finalSpecialty = specialty === "other" ? customSpecialty : specialty;
    try {
      var res = await onboardComplete({
        clinic_info: {
          name: user?.business_name || "",
          city: city,
          phone: user?.phone || "",
          type: finalSpecialty,
        },
        modules: [],
      });
      if (res && (res as any).success !== false) {
        router.push("/dashboard");
      } else {
        setError((res as any)?.message || "Setup failed. Please try again.");
        setIsSubmitting(false);
        window.scrollTo(0, 0);
      }
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
      window.scrollTo(0, 0);
    }
  }

  var progressBars = [1, 2, 3].map((s) => {
    if (s < currentStep) return "bg-[#065f46]";
    if (s === currentStep) return "bg-emerald-500";
    return "bg-[#1f2e28]";
  });

  return (
    <div className="w-full max-w-[420px]">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-emerald-500">
          <span className="text-[10px] font-medium tracking-[0.5px] text-[#064e3b]">MHAI</span>
        </div>
        <div>
          <div className="text-[15px] font-medium text-white">
            Medi<span className="text-emerald-400">Host</span>{" "}
            <span className="text-[12px] text-gray-500">AI</span>
          </div>
          <div className="text-[11px] text-gray-500">
            Let&apos;s set up your {terminologyClinic}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 flex gap-1.5">
        {progressBars.map((cls, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${cls}`} />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-900 bg-[#1c1210] p-3 text-[12px] text-red-300">
          {error}
        </div>
      )}

      {/* STEP 1: Specialty */}
      {currentStep === 1 && (
        <div>
          <h2 className="mb-1 text-[19px] font-medium text-[#f0fdf4]">
            What&apos;s your {terminologySpecialty}?
          </h2>
          <p className="mb-5 text-[12px] text-gray-400">
            Our AI tailors your website and marketing to your {terminologyClinic}
          </p>

          <div className="space-y-2.5">
            {allSpecialties.map((s) => {
              var selected = specialty === s.id;
              var isOther = s.id === "other";
              return (
                <div key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSpecialty(s.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-emerald-500 bg-[#0d1f17]"
                        : isOther
                        ? "border-dashed border-[#1f2e28] bg-[#111916]"
                        : "border-[#1f2e28] bg-[#111916]"
                    } cursor-pointer`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-medium ${
                        selected ? "bg-[#064e3b] text-emerald-400" : "bg-[#1f2e28] text-gray-400"
                      }`}
                    >
                      {s.icon}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[13px] ${selected ? "text-[#f0fdf4]" : "text-gray-200"}`}>
                        {s.label}
                      </div>
                      <div className="text-[10px] text-gray-600">{s.sub}</div>
                    </div>
                  </button>
                  {isOther && selected && (
                    <input
                      autoFocus
                      className="mt-2 h-[42px] w-full rounded-lg border border-[#1f2e28] bg-[#111916] px-3 text-[14px] text-[#f0fdf4] placeholder-[#4b5563] outline-none focus:border-emerald-500"
                      placeholder="Type your specialty..."
                      value={customSpecialty}
                      onChange={(e) => setCustomSpecialty(e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!specialty || (specialty === "other" && !customSpecialty.trim())}
            onClick={() => setCurrentStep(2)}
            className="mt-5 flex h-[46px] w-full items-center justify-center rounded-lg bg-emerald-500 text-[15px] font-medium text-[#064e3b] transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* STEP 2: City */}
      {currentStep === 2 && (
        <div>
          <h2 className="mb-1 text-[19px] font-medium text-[#f0fdf4]">
            Where&apos;s your {terminologyClinic}?
          </h2>
          <p className="mb-5 text-[12px] text-gray-400">
            We&apos;ll {terminologyOptimize} your SEO for local searches
          </p>

          <input
            className="h-[48px] w-full rounded-lg border border-[#1f2e28] bg-[#111916] px-3 text-[16px] text-[#f0fdf4] placeholder-[#4b5563] outline-none transition focus:border-emerald-500"
            placeholder={"e.g. " + (CITIES_BY_COUNTRY[country] || [])[0] || ""}
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            onBlur={handleCityBlur}
          />

          {/* Quick-pick chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            {(CITIES_BY_COUNTRY[country] || []).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleCityChip(c)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  city === c
                    ? "border-emerald-500 text-emerald-400"
                    : "border-[#1f2e28] bg-[#111916] text-gray-400 hover:border-[#2a3f35]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Country auto-switch notification */}
          {didAutoSwitch && switchedFromCity && (
            <div className="mt-3 rounded-lg border border-emerald-500 bg-[#0d1f17] p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#064e3b] text-[9px] font-medium text-emerald-400">
                  {country}
                </span>
                <span className="text-[13px] font-medium text-emerald-400">
                  Switched to {COUNTRY_NAMES[country] || country}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400">
                We detected {switchedFromCity} is in {COUNTRY_NAMES[country] || country}. Your AI engine will now use:{" "}
                {((localeV2 && localeV2.compliance && localeV2.compliance.display_badges) || []).join(", ")}, {((localeV2 && localeV2.ai_content && localeV2.ai_content.language_options) || []).join(" + ")}, {(localeV2 && localeV2.currency && localeV2.currency.symbol) || "\u20B9"}, {(localeV2 && localeV2.domain && localeV2.domain.primary_tld) || ""}
              </p>
            </div>
          )}

          {/* AI preview */}
          {city.trim().length >= 2 && (
            <div className="mt-3 rounded-lg border border-[#1f2e28] bg-[#111916] p-3">
              <p className="mb-2 text-[11px] font-medium text-gray-500">
                AI will {terminologyOptimize} for:
              </p>
              <div className="space-y-1 text-[11px] text-gray-400">
                <p>&bull; &ldquo;Best {specialtyLabel} {terminologyClinic} in {city}&rdquo; SEO</p>
                <p>&bull; Google business listing</p>
                <p>&bull; Instagram targeting {city}</p>
                <p>&bull; Content in {((localeV2 && localeV2.ai_content && localeV2.ai_content.language_options) || []).join(" + ")}</p>
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex h-[46px] items-center px-4 text-[13px] text-gray-400 hover:text-gray-200 transition"
            >
              Back
            </button>
            <button
              type="button"
              disabled={city.trim().length < 2}
              onClick={() => setCurrentStep(3)}
              className="flex h-[46px] flex-1 items-center justify-center rounded-lg bg-emerald-500 text-[15px] font-medium text-[#064e3b] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Doctor count + Launch */}
      {currentStep === 3 && (
        <div>
          <h2 className="mb-1 text-[19px] font-medium text-[#f0fdf4]">How many doctors?</h2>
          <p className="mb-6 text-[12px] text-gray-400">
            We&apos;ll create individual profiles for each on your website
          </p>

          {/* Stepper */}
          <div className="mb-6 flex items-center justify-center gap-6">
            <button
              type="button"
              disabled={doctorCount <= 1}
              onClick={() => setDoctorCount((c) => Math.max(1, c - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1f2e28] bg-[#111916] text-xl text-gray-400 transition disabled:opacity-30 hover:border-emerald-500"
            >
              -
            </button>
            <div className="text-center">
              <div className="text-4xl font-medium text-[#f0fdf4]">{doctorCount}</div>
              <div className="text-sm text-gray-500">
                doctor{doctorCount !== 1 ? "s" : ""} at your {terminologyClinic}
              </div>
            </div>
            <button
              type="button"
              disabled={doctorCount >= 50}
              onClick={() => setDoctorCount((c) => Math.min(50, c + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1f2e28] bg-[#111916] text-xl text-gray-400 transition disabled:opacity-30 hover:border-emerald-500"
            >
              +
            </button>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-emerald-800 bg-[#0d1f17] p-4">
            <p className="mb-3 text-sm font-medium text-emerald-500">
              Your AI marketing engine will set up:
            </p>
            <div className="space-y-2 text-[12px] text-gray-300">
              <p>&bull; {terminologyClinicTitle} website with {specialtyLabel} content</p>
              <p>&bull; {doctorCount} doctor profile{doctorCount !== 1 ? "s" : ""} with online booking</p>
              <p>&bull; Instagram + Facebook content calendar</p>
              <p>&bull; Google review auto-responder</p>
              <p>&bull; WhatsApp appointment bot</p>
              <p>&bull; SEO for &ldquo;{specialtyLabel} {terminologyClinic} {city}&rdquo;</p>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex h-[46px] items-center px-4 text-[13px] text-gray-400 hover:text-gray-200 transition"
            >
              Back
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 text-[15px] font-medium text-[#064e3b] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#064e3b] border-t-transparent" />
                  Launching...
                </>
              ) : (
                <>Launch my AI engine &rarr;</>
              )}
            </button>
          </div>
          <p className="mt-3 text-center text-[11px] text-gray-600">
            Takes about 60 seconds to configure
          </p>
        </div>
      )}
    </div>
  );
}
