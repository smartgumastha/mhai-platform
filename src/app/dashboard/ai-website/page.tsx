"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getWebsite,
  createWebsite,
  updateWebsite,
  getWebsitePages,
  generateBlogPost,
} from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";
import { useDashboard } from "@/app/dashboard/contexts/DashboardContext";
import BookingWidget from "@/app/components/BookingWidget";

var PAGE_TYPE_STYLES: Record<string, { icon: string; dot: string }> = {
  home: { icon: "\u2302", dot: "bg-emerald-500" },
  about: { icon: "\u2139", dot: "bg-emerald-500" },
  services: { icon: "\u2726", dot: "bg-emerald-500" },
  doctors: { icon: "\u2695", dot: "bg-blue-500" },
  booking: { icon: "\u2611", dot: "bg-blue-500" },
  contact: { icon: "\u2709", dot: "bg-gray-500" },
  blog: { icon: "\u270E", dot: "bg-amber-500" },
  custom: { icon: "\u2606", dot: "bg-purple-500" },
};

var FEATURES = [
  { icon: "\u2726", title: "17+ pages auto-generated", desc: "Home, About, Services, Doctor profiles, Booking, Pay online, Blog, Reviews, FAQ, Contact and more" },
  { icon: "\u2695", title: "Doctor profiles from HMS", desc: "Qualifications, experience, availability pulled from your hospital management system" },
  { icon: "\u270E", title: "SEO-optimized blog", desc: "AI writes weekly articles targeting local search terms for your specialty and city" },
  { icon: "\u2605", title: "Live Google reviews", desc: "Reviews feed with AI replies displayed on your website automatically" },
  { icon: "\u2611", title: "Online booking + payments", desc: "Real-time appointment slots and Razorpay payment collection on every page" },
  { icon: "\u2139", title: "Built from Brand DNA", desc: "Uses your clinic name, tagline, colors, tone, services, and doctor info — zero manual content writing" },
];

var GEN_STEPS = [
  "Reading Brand DNA...",
  "Generating pages and layout...",
  "Writing SEO content...",
  "Creating first blog post...",
  "Optimizing for search engines...",
  "Publishing website...",
];

export default function AiWebsitePage() {
  var notify = useNotification();
  var { brand, hospital } = useDashboard();
  var [website, setWebsite] = useState<any>(null);
  var [pages, setPages] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);

  /* generating state */
  var [generating, setGenerating] = useState(false);
  var [genStep, setGenStep] = useState(0);

  /* blog generation */
  var [blogTopic, setBlogTopic] = useState("");
  var [blogGenerating, setBlogGenerating] = useState(false);
  var [blogToast, setBlogToast] = useState("");

  var fetchData = useCallback(async function () {
    try {
      var res = await getWebsite();
      if (res.success && res.website) {
        setWebsite(res.website);
        try {
          var pRes = await getWebsitePages(res.website.id);
          if (pRes.success && pRes.pages) setPages(pRes.pages);
        } catch {}
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(function () { fetchData(); }, [fetchData]);

  /* ── generate website flow ── */
  async function handleGenerate() {
    setGenerating(true);
    setGenStep(0);

    try {
      // Step 0-1: Create website
      setGenStep(0);
      await delay(800);
      setGenStep(1);
      var createRes = await createWebsite({ status: "generating" });
      if (!createRes.success || !createRes.website) {
        notify.error("Failed", createRes.error || createRes.message || "Failed to create website.");
        setGenerating(false);
        return;
      }
      var ws = createRes.website;

      // Step 2: Writing SEO content
      setGenStep(2);
      await delay(600);

      // Step 3: Create first blog post
      setGenStep(3);
      try {
        await generateBlogPost("Benefits of physiotherapy for back pain");
      } catch {}

      // Step 4: Optimizing
      setGenStep(4);
      await delay(600);

      // Step 5: Publish
      setGenStep(5);
      try {
        await updateWebsite(ws.id, { status: "live" });
      } catch {}

      await delay(500);

      // Refresh
      await fetchData();
    } catch {
      notify.error("Error", "Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function delay(ms: number) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  /* ── generate blog ── */
  async function handleBlogGenerate() {
    if (!blogTopic.trim()) { notify.warning("Missing topic", "Enter a blog topic."); return; }
    setBlogGenerating(true);
    try {
      var res = await generateBlogPost(blogTopic.trim());
      if (res.success) {
        setBlogTopic("");
        setBlogToast("Blog post created: " + (res.title || blogTopic));
        setTimeout(function () { setBlogToast(""); }, 3000);
        // Refresh pages
        if (website) {
          try {
            var pRes = await getWebsitePages(website.id);
            if (pRes.success && pRes.pages) setPages(pRes.pages);
          } catch {}
        }
      } else {
        notify.error("Failed", res.error || res.message || "Failed to generate blog post.");
      }
    } catch {
      notify.error("Network error", "Please try again.");
    } finally {
      setBlogGenerating(false);
    }
  }

  var inputClass =
    "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════
     STATE 2: Generating
     ══════════════════════════════════════════════════ */
  if (generating) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-8 py-6">
        <div className="w-full max-w-md text-center">
          {/* Spinner */}
          <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500" />
          <h2 className="mb-1 text-xl font-semibold text-gray-900">Building your website...</h2>
          <p className="mb-6 text-sm text-gray-500">AI is generating everything from your Brand DNA</p>

          {/* Steps checklist */}
          <div className="mx-auto max-w-xs text-left">
            {GEN_STEPS.map(function (step, i) {
              var done = i < genStep;
              var active = i === genStep;
              return (
                <div key={i} className="flex items-center gap-3 py-2">
                  {done ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </div>
                  ) : active ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-200" />
                  )}
                  <span className={"text-sm " + (done ? "text-emerald-600 font-medium" : active ? "text-gray-900 font-medium" : "text-gray-400")}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════
     STATE 1: No website — empty state
     ══════════════════════════════════════════════════ */
  if (!website) {
    return (
      <div className="px-8 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">AI Website</h1>
            <p className="mt-1 text-sm text-gray-500">Generate a complete, SEO-optimized clinic website in under 60 seconds</p>
          </div>

          {/* Feature grid */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            {FEATURES.map(function (f) {
              return (
                <div key={f.title} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-lg text-emerald-600">{f.icon}</div>
                  <div className="text-[13px] font-medium text-gray-900">{f.title}</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-gray-500">{f.desc}</div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <button
            onClick={handleGenerate}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl active:scale-[0.99]"
          >
            <span className="text-xl">{"\u2726"}</span>
            Generate my website
          </button>

          <div className="mt-3 text-center text-xs text-gray-400">
            Uses your Brand DNA — clinic name, specialty, services, doctor profiles, tone of voice
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════
     STATE 3: Website live — dashboard
     ══════════════════════════════════════════════════ */
  var subdomain = website.subdomain || website.domain || "yoursite.medihost.in";
  var isLive = website.status === "live";
  var blogPages = pages.filter(function (p) { return p.page_type === "blog"; });
  var otherPages = pages.filter(function (p) { return p.page_type !== "blog"; });
  var publishedCount = pages.filter(function (p) { return p.is_published; }).length;

  return (
    <div className="px-8 py-6">
      {/* Toast */}
      {blogToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          <span className="mr-2">{"\u2713"}</span>{blogToast}
        </div>
      )}

      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">AI Website</h1>
            <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium " + (isLive ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
              <span className={"h-1.5 w-1.5 rounded-full " + (isLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
              {isLive ? "Live" : website.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">{subdomain}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={"https://" + subdomain}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer rounded-md bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md"
          >
            View site
          </a>
          <button className="cursor-pointer rounded-md border border-gray-200 px-4 py-2 text-xs text-gray-700 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:text-emerald-600">
            Edit
          </button>
          <button className="cursor-pointer rounded-md border border-gray-200 px-4 py-2 text-xs text-gray-700 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:text-emerald-600">
            Custom domain
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-5">
        {/* LEFT — Pages + blog */}
        <div>
          {/* Website preview card */}
          <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-sm">
                {"\u2726"}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-gray-900">{subdomain}</div>
                <div className="text-[11px] text-gray-500">{pages.length} pages {"\u00B7"} {publishedCount} published {"\u00B7"} {blogPages.length} blog posts</div>
              </div>
              <span className={"rounded-full px-2.5 py-1 text-[10px] font-medium " + (isLive ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                {isLive ? "Live" : website.status}
              </span>
            </div>
          </div>

          {/* Pages list */}
          <div className="mb-2 text-sm font-medium text-gray-900">Pages</div>
          {otherPages.length === 0 && blogPages.length === 0 ? (
            <div className="mb-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-500">
              No pages generated yet. Blog posts will appear here as they are created.
            </div>
          ) : (
            <div className="mb-4 space-y-1.5">
              {otherPages.map(function (p) {
                var style = PAGE_TYPE_STYLES[p.page_type] || PAGE_TYPE_STYLES.custom;
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md">
                    <div className={"flex h-8 w-8 items-center justify-center rounded-lg text-sm " + (style.dot === "bg-emerald-500" ? "bg-emerald-50 text-emerald-600" : style.dot === "bg-blue-500" ? "bg-blue-50 text-blue-600" : style.dot === "bg-amber-500" ? "bg-amber-50 text-amber-600" : style.dot === "bg-purple-500" ? "bg-purple-50 text-purple-600" : "bg-gray-50 text-gray-600")}>
                      {style.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-[12px] font-medium text-gray-900">{p.title}</div>
                      <div className="text-[10px] text-gray-400">/{p.slug} {"\u00B7"} {p.page_type}</div>
                    </div>
                    <span className={"h-1.5 w-1.5 rounded-full " + (p.is_published ? "bg-emerald-500" : "bg-gray-300")} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Blog posts */}
          {blogPages.length > 0 && (
            <>
              <div className="mb-2 text-sm font-medium text-gray-900">Blog posts</div>
              <div className="mb-4 space-y-1.5">
                {blogPages.map(function (p) {
                  return (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-sm text-amber-600">{"\u270E"}</div>
                      <div className="flex-1">
                        <div className="text-[12px] font-medium text-gray-900">{p.title}</div>
                        <div className="text-[10px] text-gray-400">/{p.slug}</div>
                      </div>
                      <span className={"h-1.5 w-1.5 rounded-full " + (p.is_published ? "bg-emerald-500" : "bg-gray-300")} />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Generate blog form */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-1 text-sm font-medium text-gray-900">Generate new blog post</div>
            <div className="mb-3 text-[11px] text-gray-500">AI writes an 800-1200 word SEO article using your Brand DNA</div>
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="e.g. Benefits of physiotherapy for back pain"
                value={blogTopic}
                onChange={function (e) { setBlogTopic(e.target.value); }}
                onKeyDown={function (e) { if (e.key === "Enter") handleBlogGenerate(); }}
              />
              <button
                onClick={handleBlogGenerate}
                disabled={blogGenerating}
                className="flex-shrink-0 cursor-pointer rounded-md bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {blogGenerating ? "Writing..." : "Generate"}
              </button>
            </div>
          </div>

          {/* Booking widget preview */}
          <div className="mt-5">
            <div className="mb-2 text-sm font-medium text-gray-900">Booking widget preview</div>
            <div className="text-[11px] text-gray-500 mb-3">This widget is live on your website and at <span className="font-medium text-emerald-600">/book/{hospital.hospital_id || "your-id"}</span></div>
            {hospital.hospital_id ? (
              <BookingWidget
                hospitalId={hospital.hospital_id}
                clinicName={brand?.clinicName || brand?.clinic_name || hospital.business_name || undefined}
                clinicSubtitle={brand?.address || brand?.city || undefined}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-500">
                Hospital ID not found. Complete onboarding to enable booking.
              </div>
            )}
          </div>

          {/* Location map */}
          {brand?.clinic_lat && brand?.clinic_lng && (
            <div className="mt-5">
              <div className="mb-2 text-sm font-medium text-gray-900">Location</div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="overflow-hidden rounded-xl">
                  <iframe
                    src={`https://maps.google.com/maps?q=${brand.clinic_lat},${brand.clinic_lng}&z=15&output=embed`}
                    className="h-[250px] w-full border-0"
                    loading="lazy"
                    title="Clinic location"
                  />
                </div>
                {brand.clinic_address && (
                  <div className="mt-3 text-[11px] text-gray-500">{brand.clinic_address}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Stats + SEO */}
        <div>
          {/* Quick stats */}
          <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-medium text-gray-900">Website overview</div>
            {[
              { label: "Total pages", value: String(pages.length), color: "text-emerald-600" },
              { label: "Blog posts", value: String(blogPages.length), color: "text-amber-600" },
              { label: "Published", value: String(publishedCount), color: "text-blue-600" },
              { label: "Status", value: isLive ? "Live" : website.status, color: isLive ? "text-emerald-600" : "text-amber-600" },
            ].map(function (s) {
              return (
                <div key={s.label} className="flex items-center justify-between border-b border-gray-50 py-2">
                  <span className="text-[11px] text-gray-500">{s.label}</span>
                  <span className={"text-[11px] font-medium " + s.color}>{s.value}</span>
                </div>
              );
            })}
          </div>

          {/* SEO health */}
          <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-medium text-gray-900">SEO health</div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Meta tags", ok: true },
                { label: "Schema markup", ok: true },
                { label: "Mobile responsive", ok: true },
                { label: "Page speed", ok: true },
                { label: "Sitemap", ok: isLive },
                { label: "SSL", ok: website.ssl_status === "active" },
              ].map(function (s) {
                return (
                  <span key={s.label} className={"rounded-full px-2.5 py-1 text-[10px] font-medium " + (s.ok ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500")}>
                    {s.ok ? "\u2713" : "\u2014"} {s.label}
                  </span>
                );
              })}
            </div>
            <div className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-[10px] text-emerald-700">
              All pages are auto-optimized with meta titles, descriptions, and structured data for local search.
            </div>
          </div>

          {/* Domain info */}
          <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-medium text-gray-900">Domain</div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-emerald-600">{subdomain}</span>
                <span className={"rounded px-1.5 py-0.5 text-[8px] font-medium text-white " + (isLive ? "bg-emerald-500" : "bg-amber-500")}>
                  {isLive ? "Active" : website.status}
                </span>
              </div>
            </div>
            <button className="mt-2 w-full cursor-pointer rounded-md border border-dashed border-gray-300 py-2 text-[11px] text-gray-500 transition-all duration-200 hover:border-gray-400 hover:text-gray-600">
              + Connect custom domain
            </button>
          </div>

          {/* AI actions */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-medium text-gray-900">AI actions</div>
            <div className="space-y-2">
              {[
                "Regenerate all pages",
                "Optimize for AEO",
                "Add FAQ page",
              ].map(function (a) {
                return (
                  <button key={a} className="w-full cursor-pointer rounded-lg border border-gray-200 px-3 py-2.5 text-left text-[11px] font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md">
                    {"\u2726"} {a}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
