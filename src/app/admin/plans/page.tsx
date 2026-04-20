"use client";

import { useEffect, useState, useCallback } from "react";
import { getToken } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";

// ============================================================
// TYPES — inline, pragmatic
// ============================================================
type Plan = {
  id: string;
  slug: string;
  display_name: string;
  subtitle: string | null;
  tier_order: number;
  outcome_commitment: string | null;
  agents_included: number;
  measurement_cadence: string | null;
  trial_days: number;
  is_active: boolean;
  is_enterprise: boolean;
  badge_color: string | null;
};

type Price = {
  id: string;
  plan_id: string;
  plan_slug: string;
  plan_display_name: string;
  tier_order: number;
  country_code: string;
  currency: string;
  monthly_price_minor: number;
  yearly_price_minor: number;
  yearly_discount_pct: number;
  razorpay_plan_id_monthly: string | null;
  razorpay_plan_id_yearly: string | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  is_active: boolean;
};

type Feature = {
  id: string;
  slug: string;
  name: string;
  icon_emoji: string | null;
  what_you_get: any;
  what_you_lose: any;
  proof_point: any;
  patent_claim_ref: string | null;
  is_hero: boolean;
  display_order: number;
  plan_slugs: string[];
};

// ============================================================
// API helper — relative paths, routed via Next.js rewrites (same pattern as src/lib/api.ts)
// ============================================================
async function apiGet(path: string) {
  var token = getToken();
  var res = await fetch(path, {
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    var txt = await res.text();
    throw new Error("GET " + path + " failed (" + res.status + "): " + txt);
  }
  return res.json();
}

async function apiPatch(path: string, body: any) {
  var token = getToken();
  var res = await fetch(path, {
    method: "PATCH",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    var txt = await res.text();
    throw new Error("PATCH " + path + " failed (" + res.status + "): " + txt);
  }
  return res.json();
}

// ============================================================
// Utility — format minor units to human-readable price
// ============================================================
function formatMinor(minor: number, currency: string, _countryCode: string): string {
  if (minor === 0) return "free";
  var major = minor / 100;
  var formatted: string;
  if (currency === "INR") {
    formatted = "₹" + major.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  } else if (currency === "USD") {
    formatted = "$" + major.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (currency === "GBP") {
    formatted = "£" + major.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else {
    formatted = currency + " " + major.toFixed(2);
  }
  return formatted;
}

function flagFor(country: string): string {
  if (country === "IN") return "🇮🇳";
  if (country === "US") return "🇺🇸";
  if (country === "UK" || country === "GB") return "🇬🇧";
  return "🏳️";
}

// ============================================================
// Page
// ============================================================
export default function AdminPlansPage() {
  var notify = useNotification();

  var [plans, setPlans] = useState<Plan[]>([]);
  var [prices, setPrices] = useState<Price[]>([]);
  var [features, setFeatures] = useState<Feature[]>([]);
  var [loading, setLoading] = useState(true);
  var [loadError, setLoadError] = useState<string | null>(null);

  // Track which rows have pending saves, keyed by `${kind}:${id}:${field}`
  var [, setSaving] = useState<Record<string, boolean>>({});

  // Initial load
  useEffect(function () {
    var cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      apiGet("/api/admin/plans/v2/plans"),
      apiGet("/api/admin/plans/v2/prices"),
      apiGet("/api/admin/plans/v2/features"),
    ])
      .then(function (results) {
        if (cancelled) return;
        setPlans(results[0].plans || []);
        setPrices(results[1].prices || []);
        setFeatures(results[2].features || []);
      })
      .catch(function (err) {
        if (cancelled) return;
        setLoadError(err.message);
      })
      .finally(function () {
        if (!cancelled) setLoading(false);
      });
    return function () { cancelled = true; };
  }, []);

  // ============================================================
  // PLAN field save — optimistic, blur-triggered
  // ============================================================
  var savePlanField = useCallback(
    async function (planId: string, field: keyof Plan, oldVal: any, newVal: any) {
      if (oldVal === newVal) return;
      var key = "plan:" + planId + ":" + field;
      setSaving(function (s) { return { ...s, [key]: true }; });
      try {
        var body: any = {};
        body[field] = newVal;
        var res = await apiPatch("/api/admin/plans/v2/plans/" + planId, body);
        setPlans(function (prev) {
          return prev.map(function (p) {
            return p.id === planId ? { ...p, ...res.plan } : p;
          });
        });
        notify.success("Saved — " + String(field));
      } catch (err: any) {
        // Revert local state
        setPlans(function (prev) {
          return prev.map(function (p) {
            if (p.id !== planId) return p;
            var reverted: any = { ...p };
            reverted[field] = oldVal;
            return reverted;
          });
        });
        notify.error("Save failed", err.message);
      } finally {
        setSaving(function (s) {
          var next = { ...s };
          delete next[key];
          return next;
        });
      }
    },
    [notify],
  );

  // ============================================================
  // PRICE field save
  // ============================================================
  var savePriceField = useCallback(
    async function (priceId: string, field: keyof Price, oldVal: any, newVal: any) {
      if (oldVal === newVal) return;
      var key = "price:" + priceId + ":" + field;
      setSaving(function (s) { return { ...s, [key]: true }; });
      try {
        var body: any = {};
        body[field] = newVal;
        var res = await apiPatch("/api/admin/plans/v2/prices/" + priceId, body);
        setPrices(function (prev) {
          return prev.map(function (p) {
            return p.id === priceId ? { ...p, ...res.price } : p;
          });
        });
        notify.success("Saved — " + String(field));
      } catch (err: any) {
        setPrices(function (prev) {
          return prev.map(function (p) {
            if (p.id !== priceId) return p;
            var reverted: any = { ...p };
            reverted[field] = oldVal;
            return reverted;
          });
        });
        notify.error("Save failed", err.message);
      } finally {
        setSaving(function (s) {
          var next = { ...s };
          delete next[key];
          return next;
        });
      }
    },
    [notify],
  );

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff6b4a] border-t-transparent" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl p-12">
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-6">
          <h2 className="mb-2 font-serif text-xl italic text-rose-700">Couldn&apos;t load plans</h2>
          <p className="text-sm text-rose-800">{loadError}</p>
          <p className="mt-3 text-xs text-rose-600 font-mono">
            Check: token valid? backend reachable? super admin?
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-12 py-10">

      {/* Header */}
      <div className="mb-8 border-b border-[#e5dec9] pb-8">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[#e04527]">
          Day 5 · /admin/plans
        </div>
        <h1 className="mb-3 font-serif text-[44px] font-light leading-tight tracking-tight text-[#14100c]">
          Plans CMS <em className="italic text-[#e04527]">— edit in place, save on blur.</em>
        </h1>
        <p className="max-w-3xl text-[15px] text-[#5c5248]">
          Super-admin-only surface. Inline editing for the 4 plans and 12 per-country prices. Features read-only today — full editor ships Day 6.
          Writes to the <strong>NEW Part A schema</strong>. Legacy <code className="font-mono text-xs bg-[#f5efe0] px-1.5 py-0.5 rounded">subscriptions</code> stays serving 46 live hospitals until the Day 6 cutover migration.
        </p>
      </div>

      {/* Dual-state banner */}
      <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-500/25 border-l-4 border-l-amber-500 bg-amber-500/5 px-6 py-4">
        <span className="mt-1 h-5 w-5 flex-shrink-0 text-amber-600">⚠</span>
        <div className="text-[13.5px] leading-relaxed text-[#5c5248]">
          <strong className="font-serif italic text-amber-700">You&apos;re editing the NEW schema.</strong>
          <br />
          46 live hospitals still read from legacy tables. Changes here take effect when the Day 6 migration flips the read path. Safe to experiment, no customer impact today.
        </div>
      </div>

      {/* Stat strip */}
      <div className="mb-12 grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#e5dec9] bg-white px-5 py-4">
          <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#8a7f72]">Plans</div>
          <div className="font-serif text-[28px] italic text-[#e04527]">{plans.length}</div>
        </div>
        <div className="rounded-xl border border-[#e5dec9] bg-white px-5 py-4">
          <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#8a7f72]">Prices</div>
          <div className="font-serif text-[28px] italic text-[#e04527]">{prices.length}</div>
        </div>
        <div className="rounded-xl border border-[#e5dec9] bg-white px-5 py-4">
          <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#8a7f72]">Features</div>
          <div className="font-serif text-[28px] italic text-[#e04527]">{features.length}</div>
        </div>
        <div className="rounded-xl border border-[#e5dec9] bg-white px-5 py-4">
          <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#8a7f72]">Hero features</div>
          <div className="font-serif text-[28px] italic text-[#e04527]">
            {features.filter(function (f) { return f.is_hero; }).length}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1 — PLANS */}
      {/* ============================================================ */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-[#e5dec9] bg-white">
        <div className="border-b border-[#f0e9d8] px-7 py-5">
          <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#e04527]">
            Section 01 · <code className="bg-[#f5efe0] px-1.5 py-0.5 rounded text-[10.5px]">plan</code> · {plans.length} rows · inline edit
          </div>
          <h2 className="mb-1 font-serif text-[24px] font-light text-[#14100c]">
            Plans <em className="italic text-[#e04527]">— the four tiers.</em>
          </h2>
          <p className="max-w-2xl text-[13.5px] text-[#5c5248]">
            Click any cell to edit. Save fires on blur or Enter. Slug is immutable.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f5efe0]">
                <th className="border-b border-[#e5dec9] px-4 py-3 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Slug</th>
                <th className="border-b border-[#e5dec9] px-4 py-3 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Display name</th>
                <th className="border-b border-[#e5dec9] px-4 py-3 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Subtitle</th>
                <th className="border-b border-[#e5dec9] px-4 py-3 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Tier</th>
                <th className="border-b border-[#e5dec9] px-4 py-3 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Trial</th>
                <th className="border-b border-[#e5dec9] px-4 py-3 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Agents</th>
                <th className="border-b border-[#e5dec9] px-4 py-3 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Badge</th>
                <th className="border-b border-[#e5dec9] px-4 py-3 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Active</th>
                <th className="border-b border-[#e5dec9] px-4 py-3 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(function (p) {
                return (
                  <tr key={p.id} className="hover:bg-[#faf6ed]/60">
                    <td className="border-b border-[#f0e9d8] px-4 py-2">
                      <span className="font-mono text-[12.5px] text-[#8a7f72]">{p.slug}</span>
                    </td>
                    <td className="border-b border-[#f0e9d8] px-4 py-2">
                      <input
                        className="w-full rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-sm transition-all hover:bg-[#f5efe0] hover:border-[#e5dec9] focus:outline-none focus:bg-white focus:border-[#ff6b4a] focus:ring-2 focus:ring-[#ff6b4a]/20"
                        defaultValue={p.display_name}
                        onBlur={function (e) { savePlanField(p.id, "display_name", p.display_name, e.target.value); }}
                      />
                    </td>
                    <td className="border-b border-[#f0e9d8] px-4 py-2">
                      <input
                        className="w-full rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-sm transition-all hover:bg-[#f5efe0] hover:border-[#e5dec9] focus:outline-none focus:bg-white focus:border-[#ff6b4a] focus:ring-2 focus:ring-[#ff6b4a]/20"
                        defaultValue={p.subtitle || ""}
                        onBlur={function (e) { savePlanField(p.id, "subtitle", p.subtitle, e.target.value); }}
                      />
                    </td>
                    <td className="border-b border-[#f0e9d8] px-4 py-2 text-right">
                      <input
                        type="number"
                        className="w-16 rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-right text-sm tabular-nums transition-all hover:bg-[#f5efe0] hover:border-[#e5dec9] focus:outline-none focus:bg-white focus:border-[#ff6b4a] focus:ring-2 focus:ring-[#ff6b4a]/20"
                        defaultValue={p.tier_order}
                        onBlur={function (e) { savePlanField(p.id, "tier_order", p.tier_order, parseInt(e.target.value, 10)); }}
                      />
                    </td>
                    <td className="border-b border-[#f0e9d8] px-4 py-2 text-right">
                      <input
                        type="number"
                        className="w-16 rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-right text-sm tabular-nums transition-all hover:bg-[#f5efe0] hover:border-[#e5dec9] focus:outline-none focus:bg-white focus:border-[#ff6b4a] focus:ring-2 focus:ring-[#ff6b4a]/20"
                        defaultValue={p.trial_days}
                        onBlur={function (e) { savePlanField(p.id, "trial_days", p.trial_days, parseInt(e.target.value, 10)); }}
                      />
                    </td>
                    <td className="border-b border-[#f0e9d8] px-4 py-2 text-right">
                      <input
                        type="number"
                        className="w-16 rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-right text-sm tabular-nums transition-all hover:bg-[#f5efe0] hover:border-[#e5dec9] focus:outline-none focus:bg-white focus:border-[#ff6b4a] focus:ring-2 focus:ring-[#ff6b4a]/20"
                        defaultValue={p.agents_included}
                        onBlur={function (e) { savePlanField(p.id, "agents_included", p.agents_included, parseInt(e.target.value, 10)); }}
                      />
                    </td>
                    <td className="border-b border-[#f0e9d8] px-4 py-2">
                      <select
                        className="rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-sm hover:bg-[#f5efe0] hover:border-[#e5dec9] focus:outline-none focus:bg-white focus:border-[#ff6b4a]"
                        defaultValue={p.badge_color || ""}
                        onBlur={function (e) { savePlanField(p.id, "badge_color", p.badge_color, e.target.value); }}
                      >
                        <option value="emerald">emerald</option>
                        <option value="coral">coral</option>
                        <option value="purple">purple</option>
                        <option value="pink">pink</option>
                      </select>
                    </td>
                    <td className="border-b border-[#f0e9d8] px-4 py-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-emerald-500"
                        defaultChecked={p.is_active}
                        onChange={function (e) { savePlanField(p.id, "is_active", p.is_active, e.target.checked); }}
                      />
                    </td>
                    <td className="border-b border-[#f0e9d8] px-4 py-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-emerald-500"
                        defaultChecked={p.is_enterprise}
                        onChange={function (e) { savePlanField(p.id, "is_enterprise", p.is_enterprise, e.target.checked); }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 2 — PRICES */}
      {/* ============================================================ */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-[#e5dec9] bg-white">
        <div className="border-b border-[#f0e9d8] px-7 py-5">
          <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#e04527]">
            Section 02 · <code className="bg-[#f5efe0] px-1.5 py-0.5 rounded text-[10.5px]">plan_price</code> · {prices.length} rows · inline edit
          </div>
          <h2 className="mb-1 font-serif text-[24px] font-light text-[#14100c]">
            Prices <em className="italic text-[#e04527]">— per country, monthly + yearly.</em>
          </h2>
          <p className="max-w-2xl text-[13.5px] text-[#5c5248]">
            Stored in minor units. Display hint shows the human-readable price. Razorpay / Stripe IDs start NULL; paste as you create them.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f5efe0]">
                <th className="border-b border-[#e5dec9] px-4 py-3 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Plan</th>
                <th className="border-b border-[#e5dec9] px-4 py-3 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Country</th>
                <th className="border-b border-[#e5dec9] px-4 py-3 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Monthly (minor)</th>
                <th className="border-b border-[#e5dec9] px-4 py-3 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Yearly (minor)</th>
                <th className="border-b border-[#e5dec9] px-4 py-3 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Yr disc %</th>
                <th className="border-b border-[#e5dec9] px-4 py-3 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Razorpay ID (M)</th>
                <th className="border-b border-[#e5dec9] px-4 py-3 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Stripe ID (M)</th>
                <th className="border-b border-[#e5dec9] px-4 py-3 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#8a7f72]">Active</th>
              </tr>
            </thead>
            <tbody>
              {prices.map(function (pr) {
                return (
                  <tr key={pr.id} className="hover:bg-[#faf6ed]/60">
                    <td className="border-b border-[#f0e9d8] px-4 py-2">
                      <span className="font-mono text-[11.5px] text-[#14100c]">{pr.plan_slug}</span>
                    </td>
                    <td className="border-b border-[#f0e9d8] px-4 py-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-[#e5dec9] bg-[#f5efe0] px-2 py-0.5 text-[11.5px]">
                        {flagFor(pr.country_code)} {pr.country_code} · {pr.currency}
                      </span>
                    </td>
                    <td className="border-b border-[#f0e9d8] px-4 py-2 text-right">
                      <input
                        type="number"
                        className="w-28 rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-right text-sm tabular-nums transition-all hover:bg-[#f5efe0] hover:border-[#e5dec9] focus:outline-none focus:bg-white focus:border-[#ff6b4a] focus:ring-2 focus:ring-[#ff6b4a]/20"
                        defaultValue={pr.monthly_price_minor}
                        onBlur={function (e) { savePriceField(pr.id, "monthly_price_minor", pr.monthly_price_minor, parseInt(e.target.value, 10)); }}
                      />
                      <div className="mt-0.5 font-mono text-[10.5px] text-[#8a7f72]">
                        {formatMinor(pr.monthly_price_minor, pr.currency, pr.country_code)}
                      </div>
                    </td>
                    <td className="border-b border-[#f0e9d8] px-4 py-2 text-right">
                      <input
                        type="number"
                        className="w-28 rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-right text-sm tabular-nums transition-all hover:bg-[#f5efe0] hover:border-[#e5dec9] focus:outline-none focus:bg-white focus:border-[#ff6b4a] focus:ring-2 focus:ring-[#ff6b4a]/20"
                        defaultValue={pr.yearly_price_minor}
                        onBlur={function (e) { savePriceField(pr.id, "yearly_price_minor", pr.yearly_price_minor, parseInt(e.target.value, 10)); }}
                      />
                      <div className="mt-0.5 font-mono text-[10.5px] text-[#8a7f72]">
                        {formatMinor(pr.yearly_price_minor, pr.currency, pr.country_code)} · -{pr.yearly_discount_pct}%
                      </div>
                    </td>
                    <td className="border-b border-[#f0e9d8] px-4 py-2 text-right">
                      <input
                        type="number"
                        className="w-16 rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-right text-sm tabular-nums transition-all hover:bg-[#f5efe0] hover:border-[#e5dec9] focus:outline-none focus:bg-white focus:border-[#ff6b4a] focus:ring-2 focus:ring-[#ff6b4a]/20"
                        defaultValue={pr.yearly_discount_pct}
                        onBlur={function (e) { savePriceField(pr.id, "yearly_discount_pct", pr.yearly_discount_pct, parseInt(e.target.value, 10)); }}
                      />
                    </td>
                    <td className="border-b border-[#f0e9d8] px-4 py-2">
                      <input
                        className="w-40 rounded-md border border-transparent bg-transparent px-2.5 py-1.5 font-mono text-[12px] transition-all hover:bg-[#f5efe0] hover:border-[#e5dec9] focus:outline-none focus:bg-white focus:border-[#ff6b4a] focus:ring-2 focus:ring-[#ff6b4a]/20"
                        placeholder="plan_xxx…"
                        defaultValue={pr.razorpay_plan_id_monthly || ""}
                        onBlur={function (e) { savePriceField(pr.id, "razorpay_plan_id_monthly", pr.razorpay_plan_id_monthly, e.target.value || null); }}
                      />
                    </td>
                    <td className="border-b border-[#f0e9d8] px-4 py-2">
                      <input
                        className="w-40 rounded-md border border-transparent bg-transparent px-2.5 py-1.5 font-mono text-[12px] transition-all hover:bg-[#f5efe0] hover:border-[#e5dec9] focus:outline-none focus:bg-white focus:border-[#ff6b4a] focus:ring-2 focus:ring-[#ff6b4a]/20"
                        placeholder="price_xxx…"
                        defaultValue={pr.stripe_price_id_monthly || ""}
                        onBlur={function (e) { savePriceField(pr.id, "stripe_price_id_monthly", pr.stripe_price_id_monthly, e.target.value || null); }}
                      />
                    </td>
                    <td className="border-b border-[#f0e9d8] px-4 py-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-emerald-500"
                        defaultChecked={pr.is_active}
                        onChange={function (e) { savePriceField(pr.id, "is_active", pr.is_active, e.target.checked); }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 3 — FEATURES (READ-ONLY) */}
      {/* ============================================================ */}
      <section className="mb-12 overflow-hidden rounded-2xl border border-[#e5dec9] bg-white">
        <div className="border-b border-[#f0e9d8] px-7 py-5">
          <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#e04527]">
            Section 03 · <code className="bg-[#f5efe0] px-1.5 py-0.5 rounded text-[10.5px]">feature</code> + <code className="bg-[#f5efe0] px-1.5 py-0.5 rounded text-[10.5px]">plan_feature</code> · read only
          </div>
          <h2 className="mb-1 font-serif text-[24px] font-light text-[#14100c]">
            Features <em className="italic text-[#e04527]">— what each tier unlocks.</em>
          </h2>
          <p className="max-w-2xl text-[13.5px] text-[#5c5248]">
            Full editor (JSONB content, hero toggle, reorder, per-tier link editor) ships Day 6. Today: sanity check your seed data.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-7 md:grid-cols-2">
          {features.map(function (f) {
            var cardClass = f.is_hero
              ? "flex items-start gap-3 rounded-xl border border-[#ff6b4a]/20 bg-gradient-to-br from-[#ff6b4a]/6 to-purple-500/5 p-4"
              : "flex items-start gap-3 rounded-xl border border-[#f0e9d8] bg-[#f5efe0] p-4";
            return (
              <div key={f.id} className={cardClass}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#e5dec9] bg-white font-serif italic text-[#e04527]">
                  {f.icon_emoji || f.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2 text-sm font-medium text-[#14100c]">
                    {f.name}
                    {f.is_hero && (
                      <span className="rounded bg-[#ff6b4a] px-1.5 py-0.5 font-mono text-[9px] tracking-[0.08em] text-white">
                        HERO
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#8a7f72]">
                    <span className="font-medium text-[#e04527]">{f.plan_slugs.join(" · ") || "(no plans)"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-[#e5dec9] pt-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#8a7f72]">
          MHAI · /admin/plans · Day 5 · v4.1
        </p>
      </footer>

    </div>
  );
}
