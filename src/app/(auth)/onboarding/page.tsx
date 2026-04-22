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

// ── OB3: country-conditional regulatory ID field requirements ──
// Keys mirror country_billing_config.required_clinic_fields seeded in the backend.
// Fallback table here so the UI renders without requiring a fresh API call.
var COUNTRY_REQUIRED_FIELDS_FALLBACK: Record<string, string[]> = {
  IN: ["GSTIN", "STATE_CODE"],
  AE: ["TRN", "DHA_LICENSE", "EMIRATE"],
  GB: ["VAT_NUMBER", "COMPANY_NUMBER", "GMC"],
  US: ["NPI", "EIN", "STATE_LICENSE"],
  AU: ["ABN", "AHPRA"],
  CA: ["GST_HST_NUMBER", "CPSO"],
  DE: ["UMSATZSTEUER_ID", "LANR"],
  KE: ["KRA_PIN", "KMPDC"],
  SG: ["GST_REG", "SMC"],
};

type RegFieldOption = { value: string; label: string };
type RegFieldConfig = {
  label: string;
  placeholder?: string;
  hint?: string;
  maxLength?: number;
  select?: boolean;
  options?: RegFieldOption[];
};

var REG_FIELD_LABELS: Record<string, RegFieldConfig> = {
  GSTIN: { label: "GSTIN", placeholder: "36AAAAA1234Z5", hint: "15-character GST Identification Number.", maxLength: 15 },
  STATE_CODE: {
    label: "State (place of supply)", hint: "Drives CGST+SGST vs IGST calculation.", select: true,
    options: [
      { value: "36", label: "36 — Telangana" },
      { value: "27", label: "27 — Maharashtra" },
      { value: "29", label: "29 — Karnataka" },
      { value: "33", label: "33 — Tamil Nadu" },
      { value: "07", label: "07 — Delhi" },
      { value: "09", label: "09 — Uttar Pradesh" },
      { value: "24", label: "24 — Gujarat" },
      { value: "06", label: "06 — Haryana" },
    ],
  },
  TRN: { label: "TRN (Tax Registration)", placeholder: "100123456700003", hint: "15-digit FTA-issued TRN.", maxLength: 15 },
  DHA_LICENSE: { label: "DHA / MOHAP License", placeholder: "DHA-F-1234567", hint: "Your health authority license." },
  EMIRATE: {
    label: "Emirate", hint: "Determines which regulator governs.", select: true,
    options: [
      { value: "Dubai", label: "Dubai" },
      { value: "Abu Dhabi", label: "Abu Dhabi" },
      { value: "Sharjah", label: "Sharjah" },
      { value: "Ajman", label: "Ajman" },
      { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
      { value: "Fujairah", label: "Fujairah" },
      { value: "Umm Al Quwain", label: "Umm Al Quwain" },
    ],
  },
  VAT_NUMBER: { label: "VAT Number", placeholder: "GB 123 4567 89", hint: "9-digit HMRC VAT number." },
  COMPANY_NUMBER: { label: "Company Number", placeholder: "09876543", hint: "Companies House 8-digit registration.", maxLength: 8 },
  GMC: { label: "GMC / HCPC Registration", placeholder: "GMC 7012345", hint: "Medical Council or Health & Care Professions Council." },
  NPI: { label: "NPI", placeholder: "1234567890", hint: "10-digit National Provider Identifier (CMS).", maxLength: 10 },
  EIN: { label: "EIN", placeholder: "12-3456789", hint: "9-digit Employer Identification Number (IRS)." },
  STATE_LICENSE: { label: "State Medical Board License", placeholder: "CA · PT-29845", hint: "License from your practice state." },
  ABN: { label: "ABN", placeholder: "53 004 085 616", hint: "11-digit Australian Business Number." },
  AHPRA: { label: "AHPRA Registration", placeholder: "MED0001234567", hint: "Australian Health Practitioner Regulation Agency." },
  GST_HST_NUMBER: { label: "GST/HST Number", placeholder: "123456789 RT0001", hint: "9-digit BN + RT account." },
  CPSO: { label: "CPSO Registration", placeholder: "12345", hint: "College of Physicians and Surgeons (provincial)." },
  UMSATZSTEUER_ID: { label: "Umsatzsteuer-ID", placeholder: "DE123456789", hint: "German VAT ID (USt-ID)." },
  LANR: { label: "LANR", placeholder: "123456789", hint: "9-digit Lebenslange Arztnummer." },
  KRA_PIN: { label: "KRA PIN", placeholder: "P051234567P", hint: "Kenya Revenue Authority Personal Identification Number." },
  KMPDC: { label: "KMPDC Registration", placeholder: "MP-12345", hint: "Kenya Medical Practitioners and Dentists Council." },
  GST_REG: { label: "GST Registration", placeholder: "M9-1234567-8", hint: "Singapore GST registration number." },
  SMC: { label: "SMC Registration", placeholder: "M12345A", hint: "Singapore Medical Council." },
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

  // OB3: Step 3 Business registration state
  var [regulatoryIds, setRegulatoryIds] = useState<Record<string, string>>({});
  var [skippedStep3, setSkippedStep3] = useState(false);
  var [requiredClinicFields, setRequiredClinicFields] = useState<string[]>(
    COUNTRY_REQUIRED_FIELDS_FALLBACK[country] || COUNTRY_REQUIRED_FIELDS_FALLBACK.IN
  );

  // Sync required fields to detected country (localeV2.country_code cascades from city)
  var detectedCountry = localeV2 && localeV2.country_code ? localeV2.country_code : country;
  useEffect(function () {
    var fields = COUNTRY_REQUIRED_FIELDS_FALLBACK[detectedCountry] || COUNTRY_REQUIRED_FIELDS_FALLBACK.IN;
    setRequiredClinicFields(fields);
  }, [detectedCountry]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signup");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-coral border-t-transparent" />
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
      // OB3: pass regulatory_ids through to backend. Empty object if user skipped Step 3.
      // Cast to any since onboardComplete's declared type in @/lib/api doesn't include
      // regulatory_ids yet — backend /presence/onboard/complete accepts it (OB1 commit 2b6fea3).
      var payload: any = {
        clinic_info: {
          name: user?.business_name || "",
          city: city,
          phone: user?.phone || "",
          type: finalSpecialty,
        },
        modules: [],
        regulatory_ids: skippedStep3 ? {} : regulatoryIds,
        country_code: country,  // ORetrofit-1: thread country from LocaleProvider to backend
      };
      var res = await onboardComplete(payload);
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

  var progressBars = [1, 2, 3, 4].map((s) => {
    if (s < currentStep) return "bg-coral-deep";
    if (s === currentStep) return "bg-coral";
    return "bg-line";
  });

  // OB3: render a single regulatory-ID field based on fieldKey + country
  function renderRegField(fieldKey: string) {
    var cfg = REG_FIELD_LABELS[fieldKey] || { label: fieldKey };
    var value = regulatoryIds[fieldKey] || "";
    var onChange = function (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
      var v = e.target.value;
      setRegulatoryIds(function (prev) {
        var next = Object.assign({}, prev);
        if (v) { next[fieldKey] = v; } else { delete next[fieldKey]; }
        return next;
      });
    };
    return (
      <div key={fieldKey} className="mb-4">
        <label className="block text-xs font-mono uppercase tracking-wider text-coral-deep font-semibold mb-2">
          {cfg.label} <span className="text-rose-500 ml-1">*</span>
        </label>
        {cfg.select ? (
          <select
            value={value}
            onChange={onChange}
            className="w-full px-4 py-3 bg-white border border-line rounded-lg text-ink focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/10"
          >
            <option value="">— Select —</option>
            {(cfg.options || []).map(function (opt) {
              return <option key={opt.value} value={opt.value}>{opt.label}</option>;
            })}
          </select>
        ) : (
          <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={cfg.placeholder || ""}
            maxLength={cfg.maxLength}
            className="w-full px-4 py-3 bg-white border border-line rounded-lg text-ink placeholder:text-text-muted focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/10"
          />
        )}
        {cfg.hint && <div className="text-xs text-text-muted mt-2">{cfg.hint}</div>}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px]">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-coral">
          <span className="text-[10px] font-medium tracking-[0.5px] text-[#064e3b]">MHAI</span>
        </div>
        <div>
          <div className="text-[15px] font-medium text-ink">
            Medi<span className="text-coral-deep">Host</span>{" "}
            <span className="text-[12px] text-text-muted">AI</span>
          </div>
          <div className="text-[11px] text-text-muted">
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
          <h2 className="mb-1 text-[22px] font-fraunces font-light tracking-tight text-ink">
            What&apos;s your {terminologySpecialty}?
          </h2>
          <p className="mb-5 text-[12px] text-text-muted">
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
                        ? "border-coral bg-[#0d1f17]"
                        : isOther
                        ? "border-dashed border-[#1f2e28] bg-[#111916]"
                        : "border-[#1f2e28] bg-[#111916]"
                    } cursor-pointer`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-medium ${
                        selected ? "bg-[#064e3b] text-coral-deep" : "bg-[#1f2e28] text-text-muted"
                      }`}
                    >
                      {s.icon}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[13px] ${selected ? "text-ink" : "text-gray-200"}`}>
                        {s.label}
                      </div>
                      <div className="text-[10px] text-gray-600">{s.sub}</div>
                    </div>
                  </button>
                  {isOther && selected && (
                    <input
                      autoFocus
                      className="mt-2 h-[42px] w-full rounded-lg border border-[#1f2e28] bg-[#111916] px-3 text-[14px] text-ink placeholder-[#4b5563] outline-none focus:border-coral"
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
            className="mt-5 flex h-[46px] w-full items-center justify-center rounded-lg bg-coral text-[15px] font-medium text-[#064e3b] transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* STEP 2: City */}
      {currentStep === 2 && (
        <div>
          <h2 className="mb-1 text-[22px] font-fraunces font-light tracking-tight text-ink">
            Where&apos;s your {terminologyClinic}?
          </h2>
          <p className="mb-5 text-[12px] text-text-muted">
            We&apos;ll {terminologyOptimize} your SEO for local searches
          </p>

          <input
            className="h-[48px] w-full rounded-lg border border-[#1f2e28] bg-[#111916] px-3 text-[16px] text-ink placeholder-[#4b5563] outline-none transition focus:border-coral"
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
                    ? "border-coral text-coral-deep"
                    : "border-[#1f2e28] bg-[#111916] text-text-muted hover:border-[#2a3f35]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Country auto-switch notification */}
          {didAutoSwitch && switchedFromCity && (
            <div className="mt-3 rounded-lg border border-coral bg-[#0d1f17] p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#064e3b] text-[9px] font-medium text-coral-deep">
                  {country}
                </span>
                <span className="text-[13px] font-medium text-coral-deep">
                  Switched to {COUNTRY_NAMES[country] || country}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-text-muted">
                We detected {switchedFromCity} is in {COUNTRY_NAMES[country] || country}. Your AI engine will now use:{" "}
                {((localeV2 && localeV2.compliance && localeV2.compliance.display_badges) || []).join(", ")}, {((localeV2 && localeV2.ai_content && localeV2.ai_content.language_options) || []).join(" + ")}, {(localeV2 && localeV2.currency && localeV2.currency.symbol) || "\u20B9"}, {(localeV2 && localeV2.domain && localeV2.domain.primary_tld) || ""}
              </p>
            </div>
          )}

          {/* AI preview */}
          {city.trim().length >= 2 && (
            <div className="mt-3 rounded-lg border border-[#1f2e28] bg-[#111916] p-3">
              <p className="mb-2 text-[11px] font-medium text-text-muted">
                AI will {terminologyOptimize} for:
              </p>
              <div className="space-y-1 text-[11px] text-text-muted">
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
              className="flex h-[46px] items-center px-4 text-[13px] text-text-muted hover:text-gray-200 transition"
            >
              Back
            </button>
            <button
              type="button"
              disabled={city.trim().length < 2}
              onClick={() => setCurrentStep(3)}
              className="flex h-[46px] flex-1 items-center justify-center rounded-lg bg-coral text-[15px] font-medium text-[#064e3b] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Business registration (country-conditional regulatory IDs) */}
      {currentStep === 3 && (
        <div>
          <div className="mb-3 text-xs font-mono uppercase tracking-wider text-coral-deep font-semibold">
            Step 3 of 4 · Business registration
          </div>
          <h2 className="mb-2 text-[22px] font-fraunces font-light tracking-tight text-ink">
            Your <em className="italic text-coral-deep font-normal">business details</em>.
          </h2>
          <p className="mb-5 text-[12px] text-text-muted">
            Needed to create compliant bills for your patients. You can skip now and add before your first bill — we&apos;ll remind you.
          </p>

          <div className="mb-5 rounded-2xl border-2 border-dashed border-coral bg-gradient-to-br from-paper-warm to-paper-soft p-4">
            <div className="font-fraunces italic font-medium text-coral-deep text-sm">You can skip this step.</div>
            <div className="mt-1 text-[11px] text-text-dim leading-relaxed">
              AI marketing unlocks immediately. Patient billing stays locked until you add your tax ID — typically 30 seconds when you&apos;re ready.
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            {requiredClinicFields.map(renderRegField)}
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex h-[46px] items-center px-4 text-[13px] text-text-muted hover:text-ink transition"
            >
              Back
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setSkippedStep3(true); setCurrentStep(4); }}
                className="h-[46px] rounded-lg border border-line bg-white px-4 text-[13px] text-ink transition hover:border-coral"
              >
                Skip for now →
              </button>
              <button
                type="button"
                onClick={() => { setSkippedStep3(false); setCurrentStep(4); }}
                className="h-[46px] rounded-lg bg-coral px-5 text-[14px] font-medium text-white transition hover:bg-coral-deep"
              >
                Save &amp; continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Doctor count + Launch */}
      {currentStep === 4 && (
        <div>
          <h2 className="mb-1 text-[22px] font-fraunces font-light tracking-tight text-ink">How many doctors?</h2>
          <p className="mb-6 text-[12px] text-text-muted">
            We&apos;ll create individual profiles for each on your website
          </p>

          {/* Stepper */}
          <div className="mb-6 flex items-center justify-center gap-6">
            <button
              type="button"
              disabled={doctorCount <= 1}
              onClick={() => setDoctorCount((c) => Math.max(1, c - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1f2e28] bg-[#111916] text-xl text-text-muted transition disabled:opacity-30 hover:border-coral"
            >
              -
            </button>
            <div className="text-center">
              <div className="text-4xl font-medium text-ink">{doctorCount}</div>
              <div className="text-sm text-text-muted">
                doctor{doctorCount !== 1 ? "s" : ""} at your {terminologyClinic}
              </div>
            </div>
            <button
              type="button"
              disabled={doctorCount >= 50}
              onClick={() => setDoctorCount((c) => Math.min(50, c + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1f2e28] bg-[#111916] text-xl text-text-muted transition disabled:opacity-30 hover:border-coral"
            >
              +
            </button>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-line bg-[#0d1f17] p-4">
            <p className="mb-3 text-sm font-medium text-coral">
              Your AI marketing engine will set up:
            </p>
            <div className="space-y-2 text-[12px] text-text-dim">
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
              onClick={() => setCurrentStep(3)}
              className="flex h-[46px] items-center px-4 text-[13px] text-text-muted hover:text-gray-200 transition"
            >
              Back
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-lg bg-coral text-[15px] font-medium text-[#064e3b] transition disabled:cursor-not-allowed disabled:opacity-50"
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
