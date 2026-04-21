"use client";

import { useState, useEffect, useCallback } from "react";
import { getToken } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";

// =================================================================
// Types — match backend response shape exactly
// =================================================================
type PlanSlug = "rank-tracker" | "move-the-needle" | "dominate-4-surfaces" | "own-the-market";

const PLAN_SLUGS: PlanSlug[] = [
  "rank-tracker",
  "move-the-needle",
  "dominate-4-surfaces",
  "own-the-market",
];

const PLAN_LABELS: Record<PlanSlug, string> = {
  "rank-tracker": "RT",
  "move-the-needle": "MTN",
  "dominate-4-surfaces": "D4S",
  "own-the-market": "OTM",
};

type Feature = {
  id: string;
  slug: string;
  name: string;
  icon_emoji: string | null;
  icon_name: string | null;
  is_hero: boolean;
  display_order: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  what_you_get: any; // JSONB array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  what_you_lose: any; // JSONB array
  proof_point: string | null;
  proof_source: string | null;
  short_tagline: string | null;
  patent_claim_ref: string | null;
  category: string | null;
  is_active: boolean;
  plan_slugs: string[];
  created_at: string;
  updated_at: string;
};

// =================================================================
// Helper — JSONB array <-> multiline text conversion for UI
// =================================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function arrayToText(arr: any): string {
  if (!arr) return "";
  if (typeof arr === "string") {
    try {
      arr = JSON.parse(arr);
    } catch {
      return arr;
    }
  }
  if (!Array.isArray(arr)) return "";
  return arr.join("\n");
}

function textToArray(text: string): string[] {
  if (!text) return [];
  return text.split("\n").map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
}

// =================================================================
// Page
// =================================================================
export default function AdminFeaturesPage() {
  var notify = useNotification();
  var [features, setFeatures] = useState<Feature[]>([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState<string | null>(null);
  var [expandedId, setExpandedId] = useState<string | null>(null);

  // Data load
  var fetchFeatures = useCallback(async function () {
    try {
      setLoading(true);
      setError(null);
      var token = getToken();
      var res = await fetch("/api/admin/plans/v2/features", {
        headers: { Authorization: "Bearer " + (token || "") },
      });
      var data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not load features");
      }
      setFeatures(data.features || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(function () {
    fetchFeatures();
  }, [fetchFeatures]);

  // PATCH a single field
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function patchField(featureId: string, col: string, value: any) {
    try {
      var token = getToken();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      var body: any = {};
      body[col] = value;
      var res = await fetch("/api/admin/plans/v2/features/" + encodeURIComponent(featureId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (token || "") },
        body: JSON.stringify(body),
      });
      var data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Save failed");
      }
      notify.success("Saved — " + col);
      setFeatures(function (prev) {
        return prev.map(function (f) {
          if (f.id === featureId) {
            return Object.assign({}, f, data.feature, { plan_slugs: f.plan_slugs });
          }
          return f;
        });
      });
    } catch (e: unknown) {
      var msg = e instanceof Error ? e.message : "Save failed";
      notify.error("Save failed", msg);
      fetchFeatures();
    }
  }

  // Toggle plan link
  async function togglePlan(featureId: string, planSlug: PlanSlug, currentlyLinked: boolean) {
    try {
      var token = getToken();
      var method = currentlyLinked ? "DELETE" : "POST";
      var res = await fetch(
        "/api/admin/plans/v2/features/" + encodeURIComponent(featureId) + "/plans/" + encodeURIComponent(planSlug),
        {
          method: method,
          headers: { Authorization: "Bearer " + (token || "") },
        }
      );
      var data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || (currentlyLinked ? "Unlink failed" : "Link failed"));
      }
      setFeatures(function (prev) {
        return prev.map(function (f) {
          if (f.id === featureId) {
            return Object.assign({}, f, { plan_slugs: data.currently_linked_plans || [] });
          }
          return f;
        });
      });
      notify.success(currentlyLinked ? "Unlinked from " + PLAN_LABELS[planSlug] : "Linked to " + PLAN_LABELS[planSlug]);
    } catch (e: unknown) {
      var msg = e instanceof Error ? e.message : "Toggle failed";
      notify.error("Toggle failed", msg);
      fetchFeatures();
    }
  }

  var totalFeatures = features.length;
  var heroCount = features.filter(function (f) { return f.is_hero; }).length;
  var totalLinks = features.reduce(function (acc, f) { return acc + (f.plan_slugs || []).length; }, 0);

  return (
    <div className="min-h-screen bg-[#faf6ed]">
      <div className="mx-auto max-w-[1280px] px-10 py-12">
        {/* Header */}
        <div className="pb-7 border-b border-[#e5dec9] mb-8">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[#e04527]">
            /admin/features · features CMS
          </div>
          <h1 className="text-[42px] font-light leading-[1.08] tracking-tight text-[#14100c] mb-2.5">
            Features CMS <em className="italic text-[#e04527] font-normal">— edit in place.</em>
          </h1>
          <p className="text-[16px] text-[#5c5248] max-w-[720px]">
            Quick fields stay inline. Long content (what you get, what you lose, proof) expands on click.
            Plan checkboxes toggle live.
          </p>
        </div>

        {/* Amber warning strip */}
        <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          You&apos;re editing the NEW schema. Saves fire on blur. Plan links fire on check/uncheck.
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-4 gap-3.5 mb-8">
          <StatCard label="Features" value={totalFeatures} />
          <StatCard label="Hero" value={heroCount} />
          <StatCard label="Plan × Feature links" value={totalLinks} />
          <StatCard label="Plans" value={4} />
        </div>

        {/* Column header */}
        <div className="grid gap-3.5 items-center px-5 pb-2"
             style={{ gridTemplateColumns: "44px minmax(0,1fr) auto auto auto auto" }}>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#8a7f72] text-center">Icon</span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#8a7f72]">Name</span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#8a7f72] text-center">Plans</span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#8a7f72] text-center">Hero</span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#8a7f72] text-center">Order</span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#8a7f72] text-center">Detail</span>
        </div>

        {/* Loading / error / data */}
        {loading ? (
          <div className="py-12 text-center text-[#8a7f72] font-mono text-[13px]">Loading features…</div>
        ) : error ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-[14px] text-red-800">
            Couldn&apos;t load features: {error}
            <button onClick={fetchFeatures} className="ml-3 underline hover:no-underline">
              Retry
            </button>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {features.map(function (f) {
              var expanded = expandedId === f.id;
              return (
                <FeatureCard
                  key={f.id}
                  feature={f}
                  expanded={expanded}
                  onToggleExpand={function () { setExpandedId(expanded ? null : f.id); }}
                  onPatch={patchField}
                  onTogglePlan={togglePlan}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// =================================================================
// Sub-components
// =================================================================
function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white border border-[#e5dec9] rounded-xl px-5 py-4">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#8a7f72] mb-1.5">{label}</div>
      <div className="font-serif italic text-[28px] text-[#e04527]">{value}</div>
    </div>
  );
}

function FeatureCard({
  feature: f,
  expanded,
  onToggleExpand,
  onPatch,
  onTogglePlan,
}: {
  feature: Feature;
  expanded: boolean;
  onToggleExpand: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPatch: (id: string, col: string, value: any) => Promise<void>;
  onTogglePlan: (id: string, slug: PlanSlug, linked: boolean) => Promise<void>;
}) {
  var [localName, setLocalName] = useState(f.name);
  var [localOrder, setLocalOrder] = useState(String(f.display_order));
  var [localTagline, setLocalTagline] = useState(f.short_tagline || "");
  var [localProofPoint, setLocalProofPoint] = useState(f.proof_point || "");
  var [localProofSource, setLocalProofSource] = useState(f.proof_source || "");
  var [localWhatYouGet, setLocalWhatYouGet] = useState(arrayToText(f.what_you_get));
  var [localWhatYouLose, setLocalWhatYouLose] = useState(arrayToText(f.what_you_lose));
  var [localIconEmoji, setLocalIconEmoji] = useState(f.icon_emoji || "");

  useEffect(function () {
    setLocalName(f.name);
    setLocalOrder(String(f.display_order));
    setLocalTagline(f.short_tagline || "");
    setLocalProofPoint(f.proof_point || "");
    setLocalProofSource(f.proof_source || "");
    setLocalWhatYouGet(arrayToText(f.what_you_get));
    setLocalWhatYouLose(arrayToText(f.what_you_lose));
    setLocalIconEmoji(f.icon_emoji || "");
  }, [f.name, f.display_order, f.short_tagline, f.proof_point, f.proof_source, f.what_you_get, f.what_you_lose, f.icon_emoji]);

  var heroClass = f.is_hero
    ? "border-[rgba(255,107,74,0.25)] bg-gradient-to-br from-[rgba(255,107,74,0.04)] to-[rgba(139,92,246,0.02)]"
    : "border-[#e5dec9] bg-white";
  var expandedClass = expanded ? "shadow-lg border-[#ff6b4a]" : "";

  return (
    <div className={"border rounded-2xl overflow-hidden transition-all " + heroClass + " " + expandedClass}>
      {/* Header row */}
      <div className="grid gap-3.5 items-center px-5 py-3.5"
           style={{ gridTemplateColumns: "44px minmax(0,1fr) auto auto auto auto" }}>
        {/* Icon */}
        <input
          type="text"
          value={localIconEmoji}
          onChange={function (e) { setLocalIconEmoji(e.target.value); }}
          onBlur={function () { if (localIconEmoji !== (f.icon_emoji || "")) onPatch(f.id, "icon_emoji", localIconEmoji); }}
          maxLength={4}
          className="w-11 h-11 bg-white border border-[#e5dec9] rounded-[10px] text-center text-[22px] hover:border-[#ff6b4a] focus:outline-none focus:border-[#ff6b4a]"
        />

        {/* Name */}
        <div className="min-w-0">
          <input
            type="text"
            value={localName}
            onChange={function (e) { setLocalName(e.target.value); }}
            onBlur={function () { if (localName !== f.name && localName.trim().length > 0) onPatch(f.id, "name", localName); }}
            className="w-full text-[15px] font-medium text-[#14100c] bg-transparent border border-transparent px-2 py-1 rounded-md hover:bg-[#f5efe0] hover:border-[#e5dec9] focus:outline-none focus:bg-white focus:border-[#ff6b4a]"
          />
          {f.is_hero ? (
            <span className="ml-2 align-middle font-mono text-[8.5px] text-white bg-[#ff6b4a] px-1.5 py-0.5 rounded tracking-[0.08em]">HERO</span>
          ) : null}
        </div>

        {/* Plan checkboxes */}
        <div className="inline-flex gap-1">
          {PLAN_SLUGS.map(function (slug) {
            var isLinked = (f.plan_slugs || []).indexOf(slug) !== -1;
            return (
              <button
                key={slug}
                type="button"
                onClick={function () { onTogglePlan(f.id, slug, isLinked); }}
                className={
                  "px-2.5 py-1.5 rounded-md font-mono text-[10px] tracking-[0.05em] border transition-all " +
                  (isLinked
                    ? "bg-[#ff6b4a] border-[#ff6b4a] text-white"
                    : "bg-white border-[#e5dec9] text-[#8a7f72] hover:border-[#ff6b4a] hover:text-[#e04527]")
                }
              >
                {PLAN_LABELS[slug]}
              </button>
            );
          })}
        </div>

        {/* Hero toggle */}
        <button
          type="button"
          onClick={function () { onPatch(f.id, "is_hero", !f.is_hero); }}
          className={
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[10px] tracking-[0.08em] border transition-all " +
            (f.is_hero
              ? "bg-[rgba(255,107,74,0.1)] border-[#ff6b4a] text-[#e04527]"
              : "bg-white border-[#e5dec9] text-[#8a7f72] hover:border-[#ff6b4a]")
          }
        >
          {f.is_hero ? "HERO" : "off"}
        </button>

        {/* Order */}
        <input
          type="number"
          value={localOrder}
          onChange={function (e) { setLocalOrder(e.target.value); }}
          onBlur={function () {
            var parsed = parseInt(localOrder, 10);
            if (!isNaN(parsed) && parsed !== f.display_order && parsed >= 0) {
              onPatch(f.id, "display_order", parsed);
            } else if (isNaN(parsed) || parsed < 0) {
              setLocalOrder(String(f.display_order));
            }
          }}
          min={0}
          className="w-12 px-2 py-1 bg-transparent border border-transparent rounded-md text-center font-mono text-[12px] hover:bg-[#f5efe0] hover:border-[#e5dec9] focus:outline-none focus:bg-white focus:border-[#ff6b4a]"
        />

        {/* Expand button */}
        <button
          type="button"
          onClick={onToggleExpand}
          className={
            "w-8 h-8 rounded-lg border flex items-center justify-center transition-all " +
            (expanded
              ? "bg-[rgba(255,107,74,0.1)] border-[#ff6b4a] text-[#e04527]"
              : "bg-white border-[#e5dec9] text-[#8a7f72] hover:border-[#ff6b4a] hover:text-[#ff6b4a]")
          }
        >
          <span className={"inline-block transition-transform " + (expanded ? "rotate-180" : "")}>▼</span>
        </button>
      </div>

      {/* Expand body */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-[#f0e9d8]">
          {/* Tagline */}
          <div className="pt-4 mb-4">
            <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-[#e04527] font-medium mb-1.5">Short tagline</label>
            <input
              type="text"
              value={localTagline}
              onChange={function (e) { setLocalTagline(e.target.value); }}
              onBlur={function () { if (localTagline !== (f.short_tagline || "")) onPatch(f.id, "short_tagline", localTagline); }}
              className="w-full px-3 py-2 border border-[#e5dec9] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#ff6b4a]"
              placeholder="One-line hook for the public pricing page"
            />
          </div>

          {/* What you get / lose / proof in 3-col grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-[#e04527] font-medium mb-1.5">What you get</label>
              <textarea
                value={localWhatYouGet}
                onChange={function (e) { setLocalWhatYouGet(e.target.value); }}
                onBlur={function () {
                  var arrNew = textToArray(localWhatYouGet);
                  var arrOld = Array.isArray(f.what_you_get) ? f.what_you_get : [];
                  if (JSON.stringify(arrNew) !== JSON.stringify(arrOld)) {
                    onPatch(f.id, "what_you_get", arrNew);
                  }
                }}
                rows={5}
                className="w-full px-3 py-2 border border-[#e5dec9] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#ff6b4a] leading-[1.5] resize-y"
                placeholder="One bullet per line"
              />
              <div className="text-[11px] text-[#8a7f72] mt-1">One outcome per line. Shows as bullets on /pricing.</div>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-[#e04527] font-medium mb-1.5">What you lose without this</label>
              <textarea
                value={localWhatYouLose}
                onChange={function (e) { setLocalWhatYouLose(e.target.value); }}
                onBlur={function () {
                  var arrNew = textToArray(localWhatYouLose);
                  var arrOld = Array.isArray(f.what_you_lose) ? f.what_you_lose : [];
                  if (JSON.stringify(arrNew) !== JSON.stringify(arrOld)) {
                    onPatch(f.id, "what_you_lose", arrNew);
                  }
                }}
                rows={5}
                className="w-full px-3 py-2 border border-[#e5dec9] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#ff6b4a] leading-[1.5] resize-y"
                placeholder="One pain point per line"
              />
              <div className="text-[11px] text-[#8a7f72] mt-1">Quantified where possible.</div>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-[#e04527] font-medium mb-1.5">Proof point</label>
              <textarea
                value={localProofPoint}
                onChange={function (e) { setLocalProofPoint(e.target.value); }}
                onBlur={function () { if (localProofPoint !== (f.proof_point || "")) onPatch(f.id, "proof_point", localProofPoint); }}
                rows={5}
                className="w-full px-3 py-2 border border-[#e5dec9] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#ff6b4a] leading-[1.5] resize-y"
                placeholder="Stat, case study, or patent reference"
              />
              <input
                type="text"
                value={localProofSource}
                onChange={function (e) { setLocalProofSource(e.target.value); }}
                onBlur={function () { if (localProofSource !== (f.proof_source || "")) onPatch(f.id, "proof_source", localProofSource); }}
                className="w-full mt-1.5 px-3 py-1.5 border border-[#e5dec9] rounded-md text-[11px] bg-white focus:outline-none focus:border-[#ff6b4a]"
                placeholder="Source (optional)"
              />
            </div>
          </div>

          {/* Meta row */}
          <div className="flex justify-between items-center pt-3 border-t border-[#f0e9d8] font-mono text-[10.5px] text-[#8a7f72]">
            <span>Slug: <strong className="text-[#14100c]">{f.slug}</strong> · immutable</span>
            <span className="bg-[#f5efe0] px-2 py-0.5 rounded">patent_claim_ref: {f.patent_claim_ref || "(none)"}</span>
            <span>Order {f.display_order} · {f.is_active ? "active" : "inactive"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
