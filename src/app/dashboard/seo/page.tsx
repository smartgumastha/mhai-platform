"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMe, getReviews } from "@/lib/api";
import { useLocale } from "@/app/providers/locale-context";

type Partner = {
  business_name?: string;
  slug?: string;
  owner_name?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  website_url?: string;
  specialties?: string[];
  city?: string;
  state?: string;
  country_code?: string;
  address?: string;
  description?: string;
};

type CheckItem = { id: string; label: string; detail: string; pass: boolean; fix?: string; fixPath?: string };

function CheckRow({ item }: { item: CheckItem }) {
  var router = useRouter ? useRouter() : null;
  return (
    <div className={"flex items-start gap-3 rounded-xl border px-4 py-3.5 " + (item.pass ? "border-emerald-200 bg-emerald-50/40" : "border-amber-200 bg-amber-50/40")}>
      <div className={"mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold " + (item.pass ? "bg-emerald-500 text-white" : "bg-amber-400 text-white")}>
        {item.pass ? "✓" : "!"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-ink">{item.label}</div>
        <div className="mt-0.5 text-xs text-text-dim">{item.detail}</div>
      </div>
      {!item.pass && item.fix && (
        <button
          onClick={function () { if (router && item.fixPath) router.push(item.fixPath); }}
          className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
        >
          {item.fix}
        </button>
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  var color = score >= 80 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-rose-500";
  return (
    <div className={"font-fraunces text-5xl font-light " + color}>
      {score}<span className="text-2xl text-text-muted">/100</span>
    </div>
  );
}

export default function SeoPage() {
  var { localeV2 } = useLocale();
  var [partner, setPartner] = useState<Partner | null>(null);
  var [reviewCount, setReviewCount] = useState(0);
  var [avgRating, setAvgRating] = useState(0);
  var [loading, setLoading] = useState(true);

  useEffect(function () {
    var done = 0;
    function finish() { done++; if (done === 2) setLoading(false); }
    getMe()
      .then(function (r) { if (r.success && r.partner) setPartner(r.partner); })
      .catch(function () {})
      .finally(finish);
    getReviews()
      .then(function (r) {
        if (r.success && r.reviews) {
          setReviewCount(r.reviews.length);
          var rated = r.reviews.filter(function (rv: any) { return rv.rating > 0; });
          if (rated.length > 0) {
            setAvgRating(rated.reduce(function (s: number, rv: any) { return s + rv.rating; }, 0) / rated.length);
          }
        }
      })
      .catch(function () {})
      .finally(finish);
  }, []);

  if (loading) {
    return (
      <div className="px-9 py-8">
        <div className="mb-6 h-7 w-44 animate-pulse rounded-lg bg-line" />
        <div className="h-48 animate-pulse rounded-2xl bg-line" />
      </div>
    );
  }

  var cc = partner?.country_code || localeV2?.country_code || "IN";

  // Build checklist
  var checks: CheckItem[] = [
    {
      id: "name",
      label: "Clinic name set",
      detail: partner?.business_name ? "\"" + partner.business_name + "\"" : "No business name found",
      pass: !!partner?.business_name,
      fix: "Add name",
      fixPath: "/dashboard/brand",
    },
    {
      id: "specialty",
      label: "Specialty listed",
      detail: partner?.specialties?.length ? partner.specialties.join(", ") : "No specialty — Google uses this for 'doctor near me' ranking",
      pass: !!(partner?.specialties?.length),
      fix: "Add specialty",
      fixPath: "/dashboard/brand",
    },
    {
      id: "city",
      label: "City & address set",
      detail: partner?.city ? (partner.city + (partner.state ? ", " + partner.state : "")) : "Location missing — critical for local search",
      pass: !!partner?.city,
      fix: "Add address",
      fixPath: "/dashboard/brand",
    },
    {
      id: "phone",
      label: "Phone number verified",
      detail: partner?.phone || "No phone — impacts Google Business Profile",
      pass: !!partner?.phone,
      fix: "Add phone",
      fixPath: "/dashboard/brand",
    },
    {
      id: "description",
      label: "Clinic description written",
      detail: partner?.description ? partner.description.slice(0, 80) + "…" : "No description — helps Google understand your services",
      pass: !!partner?.description,
      fix: "Add description",
      fixPath: "/dashboard/brand",
    },
    {
      id: "logo",
      label: "Logo uploaded",
      detail: partner?.logo_url ? "Logo present" : "No logo — affects brand recognition in search results",
      pass: !!partner?.logo_url,
      fix: "Upload logo",
      fixPath: "/dashboard/brand",
    },
    {
      id: "website",
      label: "Website / clinic page live",
      detail: partner?.slug ? "mhai.in/" + partner.slug : "No website slug — create your MHAI page",
      pass: !!partner?.slug,
      fix: "Build website",
      fixPath: "/dashboard/ai-website",
    },
    {
      id: "reviews",
      label: "5+ Google reviews",
      detail: reviewCount > 0 ? reviewCount + " reviews · " + (avgRating ? avgRating.toFixed(1) + " avg rating" : "rating pending") : "No reviews yet — reviews are the #1 local ranking factor",
      pass: reviewCount >= 5,
      fix: "Get reviews",
      fixPath: "/dashboard/google-reviews",
    },
    {
      id: "review_rating",
      label: "Rating ≥ 4.0 stars",
      detail: avgRating > 0 ? avgRating.toFixed(1) + " average from " + reviewCount + " reviews" : "No ratings yet",
      pass: avgRating >= 4.0,
      fix: reviewCount > 0 ? "Respond to reviews" : "Get reviews",
      fixPath: "/dashboard/google-reviews",
    },
    {
      id: "social",
      label: "Social posts published",
      detail: "Regular posts signal an active clinic to Google",
      pass: false,
      fix: "Post now",
      fixPath: "/dashboard/social-posts",
    },
  ];

  var passCount = checks.filter(function (c) { return c.pass; }).length;
  var score = Math.round((passCount / checks.length) * 100);

  var keywords: string[] = [];
  if (partner?.specialties?.length) {
    var spec = partner.specialties[0].toLowerCase();
    var city = (partner.city || "your city").toLowerCase();
    keywords = [
      spec + " near me",
      spec + " in " + city,
      "best " + spec + " " + city,
      spec + " doctor " + city,
      spec + " clinic " + city,
    ];
  }

  return (
    <div className="px-9 py-8">
      <div className="mb-1 font-fraunces text-2xl font-light text-ink">
        SEO <em className="italic text-coral-deep">health score</em>
      </div>
      <p className="mb-7 text-sm text-text-dim">How well your clinic is set up to rank in Google Search and Maps.</p>

      <div className="mb-7 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Score card */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white p-7">
          <ScoreRing score={score} />
          <div className="mt-3 text-sm font-semibold text-ink">
            {score >= 80 ? "Strong local presence" : score >= 50 ? "Needs improvement" : "Critical gaps found"}
          </div>
          <div className="mt-1 text-xs text-text-dim">{passCount}/{checks.length} checks passing</div>
        </div>

        {/* Priority fix */}
        <div className="rounded-2xl border border-line bg-white p-5 lg:col-span-2">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">What matters most in {cc === "IN" ? "India" : cc === "AE" ? "UAE" : cc === "GB" ? "UK" : "your market"}</div>
          <div className="space-y-2 text-sm text-ink">
            <div className="flex items-start gap-2"><span className="shrink-0 font-bold text-coral-deep">1.</span> Google Business Profile with complete info (name, address, phone, specialty)</div>
            <div className="flex items-start gap-2"><span className="shrink-0 font-bold text-coral-deep">2.</span> 10+ verified reviews with 4.5+ rating — this beats all other signals</div>
            <div className="flex items-start gap-2"><span className="shrink-0 font-bold text-coral-deep">3.</span> Active website / clinic page indexed by Google</div>
            <div className="flex items-start gap-2"><span className="shrink-0 font-bold text-coral-deep">4.</span> Weekly social posts — Google uses freshness as a ranking signal</div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="mb-6 rounded-2xl border border-line bg-white">
        <div className="border-b border-line-soft px-6 py-5">
          <div className="font-fraunces text-lg text-ink">
            SEO <em className="italic text-coral-deep">checklist</em>
          </div>
        </div>
        <div className="space-y-2 p-5">
          {checks.map(function (item) { return <CheckRow key={item.id} item={item} />; })}
        </div>
      </div>

      {/* Keyword ideas */}
      {keywords.length > 0 && (
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-3 font-fraunces text-lg text-ink">
            Target <em className="italic text-coral-deep">keywords</em>
          </div>
          <div className="mb-2 text-xs text-text-dim">Based on your specialty — use these in your website, social posts, and clinic description.</div>
          <div className="flex flex-wrap gap-2">
            {keywords.map(function (kw) {
              return (
                <span key={kw} className="rounded-full border border-line bg-paper-soft px-3 py-1.5 text-xs font-medium text-ink">
                  {kw}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
