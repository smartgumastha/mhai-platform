"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { patientApi } from "../providers/patient-auth-context";
import { useLocale } from "@/app/providers/locale-context";

// ── Locale helpers ──────────────────────────────────────────
type CC = "IN" | "AE" | "GB" | "US";

function currencySymbol(cc: CC) {
  return cc === "AE" ? "AED " : cc === "GB" ? "£" : cc === "US" ? "$" : "₹";
}

function fmtPrice(price: number | null, currency: string | null, cc: CC): string {
  if (price == null) return "Contact for pricing";
  var sym = currency === "AED" ? "AED " : currency === "GBP" ? "£" : currency === "USD" ? "$" : currency === "INR" ? "₹" : currencySymbol(cc);
  return sym + price.toLocaleString();
}

// ── Provider type config ─────────────────────────────────────
var PROVIDER_TYPES = {
  clinic:        { label: "Clinic / Hospital", icon: "🏥", color: "bg-blue-50 text-blue-700 border-blue-200" },
  diagnostic:    { label: "Diagnostic Lab",    icon: "⚗️",  color: "bg-purple-50 text-purple-700 border-purple-200" },
  physiotherapy: { label: "Physiotherapy",     icon: "🦵",  color: "bg-green-50 text-green-700 border-green-200" },
  dietitian:     { label: "Dietitian",         icon: "🥗",  color: "bg-lime-50 text-lime-700 border-lime-200" },
  pharmacy:      { label: "Pharmacy",          icon: "💊",  color: "bg-teal-50 text-teal-700 border-teal-200" },
  fitness:       { label: "Gym / Fitness",     icon: "💪",  color: "bg-orange-50 text-orange-700 border-orange-200" },
  wellness:      { label: "Wellness / Spa",    icon: "🧘",  color: "bg-rose-50 text-rose-700 border-rose-200" },
  dental:        { label: "Dental",            icon: "🦷",  color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  optical:       { label: "Optical",           icon: "👁️",  color: "bg-sky-50 text-sky-700 border-sky-200" },
  mental_health: { label: "Mental Health",     icon: "🧠",  color: "bg-violet-50 text-violet-700 border-violet-200" },
} as const;

type ProviderType = keyof typeof PROVIDER_TYPES;

function typeConf(t: string) {
  return PROVIDER_TYPES[t as ProviderType] || { label: t, icon: "🏢", color: "bg-gray-50 text-gray-700 border-gray-200" };
}

// ── Star rating ─────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  var full  = Math.floor(rating);
  var half  = rating - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5 text-yellow-400 text-xs">
      {Array.from({ length: 5 }, function (_, i) {
        if (i < full) return <span key={i}>★</span>;
        if (i === full && half) return <span key={i} className="text-yellow-300">★</span>;
        return <span key={i} className="text-gray-200">★</span>;
      })}
      <span className="ml-1 text-gray-500 font-medium">{rating?.toFixed(1)}</span>
    </span>
  );
}

// ── Provider Card ───────────────────────────────────────────
function ProviderCard({ p, cc, onSelect }: { p: any; cc: CC; onSelect: () => void }) {
  var tc   = typeConf(p.provider_type);
  var tags = (p.tags || "").split(",").map(function (t: string) { return t.trim(); }).filter(Boolean).slice(0, 4);

  return (
    <div
      onClick={onSelect}
      className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-[#1ba3d6]/40 hover:shadow-md"
    >
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <div className={"flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border text-2xl " + tc.color}>
          {tc.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#1ba3d6] transition-colors">{p.name}</h3>
            {p.is_mhai_partner && (
              <span className="rounded-full bg-[#1ba3d6]/10 px-2 py-0.5 text-[10px] font-bold text-[#1ba3d6]">
                MHAI Partner
              </span>
            )}
            {p.is_verified && (
              <span className="text-[#1ba3d6] text-xs" title="Verified">✓</span>
            )}
          </div>
          <div className={"mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold " + tc.color}>
            {tc.icon} {tc.label}
          </div>
        </div>
      </div>

      {/* Tagline */}
      {p.tagline && (
        <p className="mb-2 text-xs text-gray-500 line-clamp-2">{p.tagline}</p>
      )}

      {/* Rating + location */}
      <div className="mb-3 flex items-center justify-between">
        <Stars rating={Number(p.rating) || 0} />
        <span className="text-xs text-gray-400">
          {[p.city, p.state].filter(Boolean).join(", ")}
        </span>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map(function (tag: string) {
            return (
              <span key={tag} className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500 ring-1 ring-gray-100">
                {tag}
              </span>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-4 flex gap-2">
        <button className="flex-1 rounded-xl bg-[#1ba3d6]/10 py-2 text-xs font-bold text-[#1ba3d6] transition-colors hover:bg-[#1ba3d6]/20">
          View Details →
        </button>
        {p.phone && (
          <a
            href={"tel:" + p.phone}
            onClick={function (e) { e.stopPropagation(); }}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 hover:border-gray-300"
          >
            📞
          </a>
        )}
      </div>
    </div>
  );
}

// ── Provider Detail Modal ────────────────────────────────────
function ProviderModal({ providerId, cc, onClose }: { providerId: string; cc: CC; onClose: () => void }) {
  var [detail, setDetail] = useState<any>(null);
  var [services, setServices] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);

  useEffect(function () {
    patientApi<any>("/api/patient/providers/" + providerId).then(function (res) {
      if (res.success) { setDetail(res.provider); setServices(res.services || []); }
      setLoading(false);
    });
  }, [providerId]);

  if (loading || !detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="rounded-2xl bg-white p-8 text-sm text-gray-400">Loading…</div>
      </div>
    );
  }

  var tc   = typeConf(detail.provider_type);
  var tags = (detail.tags || "").split(",").map(function (t: string) { return t.trim(); }).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:px-4">
      <div className="h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{tc.icon}</span>
            <span className="text-sm font-bold text-gray-900">{detail.name}</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Header info */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={"rounded-full border px-2.5 py-0.5 text-xs font-semibold " + tc.color}>{tc.label}</span>
              {detail.is_mhai_partner && <span className="rounded-full bg-[#1ba3d6]/10 px-2.5 py-0.5 text-xs font-bold text-[#1ba3d6]">MHAI Partner</span>}
              {detail.is_verified && <span className="text-xs text-[#1ba3d6] font-semibold">✓ Verified</span>}
            </div>
            <Stars rating={Number(detail.rating) || 0} />
            {detail.review_count > 0 && (
              <span className="ml-2 text-xs text-gray-400">({detail.review_count} reviews)</span>
            )}
            {detail.tagline && <p className="mt-2 text-sm text-gray-500">{detail.tagline}</p>}
            {detail.description && <p className="mt-1 text-sm text-gray-600">{detail.description}</p>}
          </div>

          {/* Specialties */}
          {tags.length > 0 && (
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Specialties</div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map(function (tag: string) {
                  return <span key={tag} className="rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-600 ring-1 ring-gray-100">{tag}</span>;
                })}
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="rounded-xl bg-gray-50 p-4 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Contact</div>
            {detail.address_line1 && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-0.5 text-gray-400">📍</span>
                <span>{[detail.address_line1, detail.city, detail.state, detail.pincode].filter(Boolean).join(", ")}</span>
              </div>
            )}
            {detail.phone && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">📞</span>
                <a href={"tel:" + detail.phone} className="text-[#1ba3d6] hover:underline">{detail.phone}</a>
              </div>
            )}
            {detail.whatsapp && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">💬</span>
                <a href={"https://wa.me/" + detail.whatsapp.replace(/\D/g, "")} target="_blank" rel="noreferrer"
                  className="text-[#1ba3d6] hover:underline">WhatsApp</a>
              </div>
            )}
            {detail.email && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">✉</span>
                <a href={"mailto:" + detail.email} className="text-[#1ba3d6] hover:underline">{detail.email}</a>
              </div>
            )}
            {detail.website && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">🌐</span>
                <a href={detail.website} target="_blank" rel="noreferrer" className="text-[#1ba3d6] hover:underline truncate">{detail.website}</a>
              </div>
            )}
          </div>

          {/* Services */}
          {services.length > 0 && (
            <div>
              <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Services & Pricing</div>
              <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                {services.map(function (s: any) {
                  return (
                    <div key={s.service_id} className="flex items-center justify-between px-4 py-3 bg-white">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{s.name}</div>
                        {s.description && <div className="text-xs text-gray-400">{s.description}</div>}
                        {s.duration_mins && <div className="text-xs text-gray-400">{s.duration_mins} min</div>}
                      </div>
                      <div className="text-sm font-bold text-gray-700 ml-4 text-right">
                        {fmtPrice(s.price, s.currency, cc)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Book CTA */}
          <div className="sticky -bottom-5 bg-white pt-2 pb-4">
            <Link
              href={"/patient/book/" + providerId}
              className="block w-full rounded-xl bg-[#1ba3d6] py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-[#0e7ba8]"
            >
              Book Appointment with {detail.name.split(" ")[0]} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────
export default function PatientProvidersPage() {
  var { localeV2 } = useLocale();
  var cc = (localeV2?.country_code || "IN") as CC;

  var [providers, setProviders] = useState<any[]>([]);
  var [total, setTotal] = useState(0);
  var [loading, setLoading] = useState(true);
  var [seeding, setSeeding] = useState(false);
  var [search, setSearch] = useState("");
  var [typeFilter, setTypeFilter] = useState("all");
  var [countryFilter, setCountryFilter] = useState(cc);
  var [selectedId, setSelectedId] = useState<string | null>(null);

  var COUNTRIES = [
    { code: "IN", flag: "🇮🇳", name: "India" },
    { code: "AE", flag: "🇦🇪", name: "UAE" },
    { code: "GB", flag: "🇬🇧", name: "UK" },
    { code: "US", flag: "🇺🇸", name: "USA" },
  ];

  var load = useCallback(async function () {
    setLoading(true);
    try {
      var qs = new URLSearchParams({ limit: "40", country: countryFilter });
      if (typeFilter !== "all") qs.set("type", typeFilter);
      if (search.trim()) qs.set("search", search.trim());
      var res: any = await patientApi("/api/patient/providers?" + qs.toString());
      if (res.success) { setProviders(res.providers || []); setTotal(res.total || 0); }
    } catch {} finally { setLoading(false); }
  }, [countryFilter, typeFilter, search]);

  useEffect(function () { load(); }, [load]);

  async function handleSeed() {
    setSeeding(true);
    try {
      var res: any = await patientApi("/api/patient/providers/seed", { method: "POST" });
      if (res.success) load();
    } catch {} finally { setSeeding(false); }
  }

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="mb-0.5 text-2xl font-bold text-gray-900">Provider Directory</h1>
        <p className="text-sm text-gray-400">
          Find clinics, labs, physios, dieticians, gyms &amp; more near you
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={function (e) { setSearch(e.target.value); }}
          onKeyDown={function (e) { if (e.key === "Enter") load(); }}
          placeholder="Search by name, specialty or location…"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none focus:ring-2 focus:ring-[#1ba3d6]/20"
        />
      </div>

      {/* Country + Type filters */}
      <div className="mb-5 space-y-2">
        {/* Country tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {COUNTRIES.map(function (c) {
            return (
              <button
                key={c.code}
                onClick={function () { setCountryFilter(c.code as CC); }}
                className={"rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap " +
                  (countryFilter === c.code
                    ? "bg-[#0a2d3d] text-white"
                    : "bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-[#1ba3d6]")}
              >
                {c.flag} {c.name}
              </button>
            );
          })}
        </div>

        {/* Type chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={function () { setTypeFilter("all"); }}
            className={"rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors whitespace-nowrap " +
              (typeFilter === "all" ? "bg-[#1ba3d6] text-white" : "bg-white text-gray-400 ring-1 ring-gray-200 hover:ring-[#1ba3d6]")}
          >
            All
          </button>
          {Object.entries(PROVIDER_TYPES).map(function ([key, conf]) {
            return (
              <button
                key={key}
                onClick={function () { setTypeFilter(key); }}
                className={"rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors whitespace-nowrap " +
                  (typeFilter === key ? "bg-[#1ba3d6] text-white" : "bg-white text-gray-400 ring-1 ring-gray-200 hover:ring-[#1ba3d6]")}
              >
                {conf.icon} {conf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">{total} provider{total !== 1 ? "s" : ""} found</p>
          {total === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="rounded-lg bg-[#1ba3d6]/10 px-3 py-1.5 text-xs font-semibold text-[#1ba3d6] hover:bg-[#1ba3d6]/20 disabled:opacity-50"
            >
              {seeding ? "Loading sample data…" : "Load sample providers"}
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(function (i) {
            return <div key={i} className="h-44 animate-pulse rounded-2xl bg-gray-100" />;
          })}
        </div>
      ) : providers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="mb-3 text-5xl">🔍</div>
          <div className="text-base font-semibold text-gray-600">No providers found</div>
          <div className="mt-1 text-xs text-gray-400">Try a different search term, type, or country</div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1ba3d6] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0e7ba8] disabled:opacity-50"
          >
            {seeding ? "Loading…" : "Load sample providers →"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map(function (p) {
            return (
              <ProviderCard
                key={p.provider_id}
                p={p}
                cc={cc}
                onSelect={function () { setSelectedId(p.provider_id); }}
              />
            );
          })}
        </div>
      )}

      {/* Provider detail modal */}
      {selectedId && (
        <ProviderModal
          providerId={selectedId}
          cc={cc}
          onClose={function () { setSelectedId(null); }}
        />
      )}
    </div>
  );
}
