"use client";

import { useState, useEffect } from "react";
import {
  getReviews,
  generateReviewReply,
  updateReviewResponse,
} from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";

/* ── filter tabs ── */
var filterTabs = [
  { id: "pending", label: "Needs reply" },
  { id: "all", label: "All" },
  { id: "replied", label: "Replied" },
];

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`flex h-4 w-7 items-center rounded-full px-0.5 ${on ? "bg-emerald-500" : "bg-gray-300"}`}>
      <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-all duration-200 ${on ? "ml-auto" : ""}`} />
    </div>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <span className="text-[12px] tracking-wider">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < count ? "text-amber-400" : "text-gray-200"}>&#9733;</span>
      ))}
    </span>
  );
}

type Review = {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  ai_response_status: string;
  ai_reply?: string;
  source?: string;
  created_at?: string;
  time?: string;
};

export default function GoogleReviewsPage() {
  var notify = useNotification();
  var [filter, setFilter] = useState("pending");
  var [reviews, setReviews] = useState<Review[]>([]);
  var [loading, setLoading] = useState(true);

  /* per-review UI state */
  var [aiReplies, setAiReplies] = useState<Record<string, string>>({});
  var [regenerating, setRegenerating] = useState<Record<string, boolean>>({});
  var [approving, setApproving] = useState<Record<string, boolean>>({});

  /* ── fetch reviews ── */
  useEffect(() => {
    getReviews()
      .then((res) => {
        if (res.success && res.reviews) {
          var sorted = [...res.reviews].sort((a: any, b: any) => {
            // pending first
            if (a.ai_response_status === "pending" && b.ai_response_status !== "pending") return -1;
            if (a.ai_response_status !== "pending" && b.ai_response_status === "pending") return 1;
            // then by rating ascending (negative on top)
            return (Number(a.rating) || 0) - (Number(b.rating) || 0);
          });
          setReviews(sorted);
          // seed any existing AI replies
          var replies: Record<string, string> = {};
          sorted.forEach((r: any) => {
            if (r.ai_reply) replies[r.id] = r.ai_reply;
          });
          setAiReplies(replies);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ── computed stats ── */
  var totalCount = reviews.length;
  var pendingCount = reviews.filter((r) => r.ai_response_status === "pending").length;
  var repliedCount = reviews.filter((r) => r.ai_response_status === "approved" || r.ai_response_status === "replied").length;
  var avgRating = totalCount > 0
    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / totalCount).toFixed(1)
    : "—";
  var positiveCount = reviews.filter((r) => (Number(r.rating) || 0) >= 4).length;
  var sentimentPct = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 0;

  var metrics = [
    { label: "Overall rating", value: avgRating + " \u2605", change: totalCount + " total", accent: "border-t-amber-400", pill: "bg-emerald-50 text-emerald-600" },
    { label: "Total reviews", value: String(totalCount), change: "from all sources", accent: "border-t-blue-500", pill: "bg-gray-100 text-gray-600" },
    { label: "Pending replies", value: String(pendingCount), change: pendingCount > 0 ? "needs attention" : "all caught up", accent: "border-t-purple-500", pill: pendingCount > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600" },
    { label: "AI replied", value: String(repliedCount), change: totalCount > 0 ? Math.round((repliedCount / totalCount) * 100) + "% reply rate" : "—", accent: "border-t-emerald-500", pill: "bg-emerald-50 text-emerald-600" },
    { label: "Sentiment", value: sentimentPct + "%", change: "Positive (\u22654\u2605)", accent: "border-t-pink-500", pill: "bg-emerald-50 text-emerald-600" },
    { label: "Response time", value: "AI", change: "instant replies", accent: "border-t-amber-500", pill: "bg-blue-50 text-blue-600" },
  ];

  /* ── sentiment bars computed from real data ── */
  var starCounts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    var s = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
    if (s >= 1) starCounts[s - 1]++;
  });
  var sentimentColors = ["bg-red-500", "bg-red-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"];
  var sentimentBars = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: starCounts[stars - 1],
    pct: totalCount > 0 ? Math.round((starCounts[stars - 1] / totalCount) * 100) : 0,
    color: sentimentColors[stars - 1],
  }));

  /* ── filtered reviews ── */
  var filteredReviews = reviews.filter((r) => {
    if (filter === "pending") return r.ai_response_status === "pending";
    if (filter === "replied") return r.ai_response_status === "approved" || r.ai_response_status === "replied";
    return true;
  });

  /* ── regenerate AI reply ── */
  async function handleRegenerate(review: Review) {
    setRegenerating((prev) => ({ ...prev, [review.id]: true }));
    try {
      var res = await generateReviewReply({
        review_text: review.review_text,
        rating: review.rating,
      });
      if (res.success && res.reply_text) {
        setAiReplies((prev) => ({ ...prev, [review.id]: res.reply_text }));
      } else {
        notify.error("AI generation failed", res.error || res.message || "Please try again.");
      }
    } catch {
      notify.error("Network error", "Please try again.");
    } finally {
      setRegenerating((prev) => ({ ...prev, [review.id]: false }));
    }
  }

  /* ── approve + post reply ── */
  async function handleApprove(review: Review) {
    var replyText = aiReplies[review.id];
    if (!replyText) {
      notify.warning("No reply", "No AI reply to approve. Tap Regenerate first.");
      return;
    }
    setApproving((prev) => ({ ...prev, [review.id]: true }));
    try {
      var res = await updateReviewResponse(review.id, {
        reply_text: replyText,
        status: "approved",
      });
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === review.id ? { ...r, ai_response_status: "approved", ai_reply: replyText } : r
          )
        );
        notify.success("Reply posted", "Reply posted to Google!");
      } else {
        notify.error("Failed", res.error || res.message || "Failed to approve reply.");
      }
    } catch {
      notify.error("Network error", "Please try again.");
    } finally {
      setApproving((prev) => ({ ...prev, [review.id]: false }));
    }
  }

  /* ── helpers ── */
  function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  var avatarColors = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-amber-500", "bg-emerald-500", "bg-red-500", "bg-cyan-500"];
  function getAvatarColor(name: string) {
    var sum = 0;
    for (var i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return avatarColors[sum % avatarColors.length];
  }

  function getBorderColor(rating: number) {
    if (rating <= 2) return "border-l-red-400";
    if (rating <= 3) return "border-l-amber-400";
    return "border-l-amber-400";
  }

  function getStatusBadge(status: string, rating: number) {
    if (status === "approved" || status === "replied") {
      return { text: "Replied", cls: "border-emerald-100 bg-emerald-50 text-emerald-600" };
    }
    if (rating <= 2) {
      return { text: "Negative \u2014 needs attention", cls: "border-red-100 bg-red-50 text-red-600" };
    }
    return { text: "Pending reply", cls: "border-amber-100 bg-amber-50 text-amber-600" };
  }

  return (
    <div className="px-8 py-6">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Reviews AI</h1>
          <p className="mt-1 text-sm text-gray-500">Your review-powered marketing engine &mdash; every review becomes social proof, content, and patients</p>
        </div>
        <div className="flex gap-2">
          <button className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:text-emerald-600">Request reviews</button>
          <button className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md">
            Auto-reply all{pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-5 grid grid-cols-6 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className={`rounded-2xl border border-gray-100 border-t-2 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md ${m.accent}`}>
            <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{m.label}</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{m.value}</div>
            <div className="mt-1"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${m.pill}`}>{m.change}</span></div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-0 border-b border-gray-100">
        {filterTabs.map((t) => {
          var count = t.id === "pending" ? pendingCount : t.id === "replied" ? repliedCount : totalCount;
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`cursor-pointer pb-2 pr-5 text-sm transition-all duration-200 ${
                filter === t.id ? "border-b-2 border-emerald-500 font-medium text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.label}
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                t.id === "pending" && count > 0 ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-5">
        {/* LEFT — Review cards */}
        <div>
          {loading ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <div className="text-sm text-gray-400">Loading reviews...</div>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center">
              <div className="mb-2 text-sm font-medium text-gray-700">
                {filter === "pending" ? "No reviews pending reply" : filter === "replied" ? "No replied reviews yet" : "No reviews yet"}
              </div>
              <p className="max-w-sm text-xs text-gray-500">
                {filter === "pending"
                  ? "All caught up! Reviews needing AI replies will appear here."
                  : "Reviews will appear here as patients leave feedback on Google and other platforms."}
              </p>
            </div>
          ) : (
            filteredReviews.map((review) => {
              var badge = getStatusBadge(review.ai_response_status, review.rating);
              var isReplied = review.ai_response_status === "approved" || review.ai_response_status === "replied";
              var isPending = review.ai_response_status === "pending";
              var replyText = aiReplies[review.id] || "";
              var isNegative = (Number(review.rating) || 0) <= 2;

              return (
                <div
                  key={review.id}
                  className={`mb-3 rounded-2xl border border-gray-100 border-l-[3px] bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md ${getBorderColor(review.rating)} ${isReplied ? "opacity-60" : ""}`}
                >
                  {/* Review header */}
                  <div className="mb-3 flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white shadow-sm ${getAvatarColor(review.reviewer_name)}`}>
                      {getInitials(review.reviewer_name)}
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-gray-900">{review.reviewer_name}</div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[11px] text-gray-400">{review.time || review.created_at || ""}</span>
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[9px] font-medium text-blue-600">
                          <b>{(review.source || "Google")[0].toUpperCase()}</b> {review.source || "Google"}
                        </span>
                      </div>
                      <div className="mt-1"><Stars count={Number(review.rating) || 0} /></div>
                    </div>
                    <span className={`rounded-lg border px-2.5 py-1 text-[9px] font-medium ${badge.cls}`}>{badge.text}</span>
                  </div>

                  {/* Review text */}
                  <div className="text-[13px] leading-relaxed text-gray-700">{review.review_text}</div>

                  {/* AI reply section — pending reviews */}
                  {isPending && (
                    <div className={`mt-3 rounded-xl border p-4 ${isNegative ? "border-red-100/50 bg-red-50/30" : "border-emerald-100/50 bg-emerald-50/30"}`}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded-md px-2.5 py-0.5 text-[9px] font-medium text-white ${isNegative ? "bg-red-500" : "bg-emerald-500"}`}>
                          {replyText ? "AI drafted" : "No AI reply yet"}
                        </span>
                        {isNegative && (
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[9px] font-medium text-amber-700">Sensitive: addresses complaint</span>
                        )}
                      </div>
                      {replyText && (
                        <div className="text-[12px] italic leading-relaxed text-gray-700">{replyText}</div>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleApprove(review)}
                          disabled={approving[review.id] || !replyText}
                          className="cursor-pointer rounded-lg bg-emerald-500 px-3 py-1.5 text-[10px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {approving[review.id] ? "Posting..." : "Approve + post"}
                        </button>
                        <button className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] text-gray-700 transition-all duration-200 hover:border-emerald-500">Edit reply</button>
                        <button
                          onClick={() => handleRegenerate(review)}
                          disabled={regenerating[review.id]}
                          className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[10px] text-gray-700 transition-all duration-200 hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {regenerating[review.id] ? "Generating..." : "Regenerate"}
                        </button>
                        {isNegative && (
                          <button className="cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[10px] text-red-500 transition-all duration-200 hover:bg-red-50">Flag for owner</button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Replied state */}
                  {isReplied && review.ai_reply && (
                    <div className="mt-2 text-[10px] italic text-emerald-500">
                      Replied by AI: &ldquo;{review.ai_reply.length > 120 ? review.ai_reply.slice(0, 120) + "..." : review.ai_reply}&rdquo;
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Card 1: Auto-marketing rules */}
          <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-900">&#10022; Auto-marketing rules</div>
            <div className="mb-3 text-[10px] text-gray-400">Every review triggers these automatically</div>
            {[
              "Review \u2192 website feed",
              "Review \u2192 social post",
              "Review \u2192 GBP update",
              "Review \u2192 WhatsApp leads",
              "Review \u2192 testimonial page",
              "Keywords \u2192 SEO pages",
              "Negative \u2192 recovery pipeline",
            ].map((r) => (
              <div key={r} className="flex items-center justify-between border-b border-gray-50 py-2">
                <span className="text-[11px] text-gray-700">{r}</span>
                <Toggle on />
              </div>
            ))}
          </div>

          {/* Card 2: Request campaigns */}
          <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-medium text-gray-900">Request campaigns</div>
            {[
              { icon: "W", color: "bg-emerald-500", name: "WhatsApp", when: "2hr after visit", on: true },
              { icon: "S", color: "bg-blue-500", name: "SMS", when: "if no WhatsApp", on: true },
              { icon: "E", color: "bg-gray-500", name: "Email", when: "day after visit", on: true },
              { icon: "Q", color: "bg-amber-500", name: "QR code", when: "at reception", on: false },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-2 border-b border-gray-50 py-2">
                <div className={`flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold text-white ${c.color}`}>{c.icon}</div>
                <span className="flex-1 text-[11px] text-gray-700">{c.name}</span>
                <span className="text-[9px] text-gray-400">{c.when}</span>
                <Toggle on={c.on} />
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 text-[10px] text-gray-400">Smart gating: Happy &rarr; Google review. Unhappy &rarr; private feedback &rarr; recovery.</div>
          </div>

          {/* Card 3: Competitor watch */}
          <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-medium text-gray-900">Competitor watch</div>
            {[
              { name: "City Physiotherapy", rating: "4.6 \u2605 \u00b7 89 reviews" },
              { name: "PhysioFirst Clinic", rating: "4.3 \u2605 \u00b7 34 reviews" },
              { name: "HealthPlus Rehab", rating: "4.1 \u2605 \u00b7 21 reviews" },
            ].map((c) => (
              <div key={c.name} className="flex items-center justify-between border-b border-gray-50 py-2">
                <span className="text-[11px] text-gray-700">{c.name}</span>
                <span className="text-[11px] text-gray-500">{c.rating}</span>
              </div>
            ))}
            <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-[10px] text-emerald-700">
              You&apos;re rated {avgRating} &mdash; {Number(avgRating) >= 4.5 ? "leading the pack!" : "room to grow."}
            </div>
          </div>

          {/* Card 4: Sentiment breakdown */}
          <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-medium text-gray-900">Sentiment breakdown</div>
            {sentimentBars.map((s) => (
              <div key={s.stars} className="flex items-center gap-2 py-1">
                <span className="w-4 text-right text-[10px] text-gray-500">{s.stars}&#9733;</span>
                <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                </div>
                <span className="w-12 text-right text-[10px] text-gray-400">{s.count} ({s.pct}%)</span>
              </div>
            ))}
          </div>

          {/* Card 5: Platform monitoring */}
          <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-medium text-gray-900">Platform monitoring</div>
            {[
              { icon: "G", color: "bg-blue-500", name: "Google", rating: avgRating + " \u00b7 " + totalCount + " reviews", badge: "Connected", badgeClass: "bg-emerald-50 text-emerald-600" },
              { icon: "P", color: "bg-pink-500", name: "Practo", rating: "Monitoring", badge: "Monitoring", badgeClass: "bg-amber-50 text-amber-600" },
              { icon: "f", color: "bg-blue-600", name: "Facebook", rating: "Connected", badge: "Connected", badgeClass: "bg-emerald-50 text-emerald-600" },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-2 border-b border-gray-50 py-2">
                <div className={`flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold text-white ${p.color}`}>{p.icon}</div>
                <span className="flex-1 text-[11px] text-gray-700">{p.name}</span>
                <span className="text-[10px] text-gray-400">{p.rating}</span>
                <span className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${p.badgeClass}`}>{p.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
