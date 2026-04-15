"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/providers/auth-context";
import { getAiActivity, getDashboardStats, createAppointment } from "@/lib/api";

var channels = [
  {
    name: "Instagram",
    icon: "Ig",
    bg: "linear-gradient(45deg, #f09433, #dc2743, #bc1888)",
    stats: "847 reach · 12 posts this month",
    status: "green",
  },
  {
    name: "Facebook",
    icon: "Fb",
    bg: "#1877F2",
    stats: "2.3K reach · 8 posts this month",
    status: "green",
  },
  {
    name: "Google",
    icon: "G",
    bg: "#4285F4",
    stats: "",
    status: "green",
  },
  {
    name: "WhatsApp",
    icon: "Wa",
    bg: "#25D366",
    stats: "156 reminders sent · 32% no-show reduction",
    status: "green",
  },
  {
    name: "SEO",
    icon: "SEO",
    bg: "#1a1a2e",
    stats: "Rank #4 for 'physiotherapy Hyderabad'",
    status: "green",
    textColor: "text-emerald-500",
    textSize: "text-[11px]",
  },
];

var STATUS_COLORS: Record<string, string> = {
  success: "bg-emerald-500",
  info: "bg-blue-500",
  warning: "bg-amber-500",
};

function getGreeting() {
  var h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

type Activity = { color: string; text: string; time: string };

export default function DashboardPage() {
  var { user } = useAuth();
  var [activities, setActivities] = useState<Activity[]>([]);
  var [todayAppts, setTodayAppts] = useState(0);
  var [totalReviews, setTotalReviews] = useState(0);
  var [avgRating, setAvgRating] = useState(0);
  var [pendingReviews, setPendingReviews] = useState(0);
  var [totalPosts, setTotalPosts] = useState(0);
  var [revenueMtd, setRevenueMtd] = useState(0);
  var [apptList, setApptList] = useState<any[]>([]);

  /* ── Patient Done state ── */
  var [showPatientDone, setShowPatientDone] = useState(false);
  var [pdName, setPdName] = useState("");
  var [pdPhone, setPdPhone] = useState("");
  var [pdSubmitting, setPdSubmitting] = useState(false);
  var [pdToast, setPdToast] = useState("");

  useEffect(() => {
    getDashboardStats()
      .then((res) => {
        if (res.success) {
          setTodayAppts(res.today_appointments || 0);
          setTotalReviews(res.total_reviews || 0);
          setAvgRating(res.avg_rating || 0);
          setPendingReviews(res.pending_replies || 0);
          setTotalPosts(res.total_posts || 0);
          setRevenueMtd(res.revenue_mtd || 0);
          if (res.appointments_list) setApptList(res.appointments_list);
        }
      })
      .catch(() => {});

    getAiActivity()
      .then((res) => {
        if (res.success && res.activities && res.activities.length > 0) {
          setActivities(
            res.activities.map((a: any) => ({
              color: STATUS_COLORS[a.status] || "bg-emerald-500",
              text: a.text || a.message || "",
              time: a.time || a.created_at || "",
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  /* ── Patient Done submit ── */
  async function handlePatientDone() {
    if (!pdName.trim() || !pdPhone.trim()) {
      alert("Please fill in both name and phone number.");
      return;
    }
    setPdSubmitting(true);
    try {
      var now = new Date();
      var date = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
      var time = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      var res = await createAppointment({
        patient_name: pdName.trim(),
        patient_phone: pdPhone.trim(),
        slot_date: date,
        slot_time: time,
        status: "completed",
        source: "walk_in",
      });
      if (res.success) {
        setShowPatientDone(false);
        setPdName("");
        setPdPhone("");
        setPdToast("Patient logged — automation triggered");
        setTimeout(() => setPdToast(""), 3000);
        // Refresh stats
        getDashboardStats().then((s) => {
          if (s.success) {
            setTodayAppts(s.today_appointments || 0);
            if (s.appointments_list) setApptList(s.appointments_list);
          }
        }).catch(() => {});
      } else {
        alert(res.error || res.message || "Failed to log patient.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setPdSubmitting(false);
    }
  }

  function formatRevenue(v: number) {
    if (v >= 100000) return "\u20B9" + (v / 100000).toFixed(1) + "L";
    if (v >= 1000) return "\u20B9" + (v / 1000).toFixed(1) + "K";
    if (v > 0) return "\u20B9" + v;
    return "\u20B90";
  }

  var metrics = [
    {
      label: "Appointments today",
      value: String(todayAppts),
      change: todayAppts > 0 ? todayAppts + " patients seen" : "No appointments yet",
      accent: "border-t-emerald-500",
    },
    {
      label: "Google rating",
      value: avgRating > 0 ? avgRating.toFixed(1) + " \u2605" : "\u2014 \u2605",
      change: pendingReviews > 0
        ? pendingReviews + " AI replies pending"
        : totalReviews > 0
          ? totalReviews + " reviews"
          : "No reviews yet",
      accent: "border-t-blue-500",
    },
    {
      label: "Content posted",
      value: String(totalPosts),
      change: totalPosts > 0 ? totalPosts + " posts published" : "No posts yet",
      accent: "border-t-purple-500",
    },
    {
      label: "Revenue (MTD)",
      value: formatRevenue(revenueMtd),
      change: revenueMtd > 0 ? "collected this month" : "No payments yet",
      accent: "border-t-amber-500",
    },
  ];

  var renderedChannels = channels.map((ch) => {
    if (ch.name === "Google") {
      var stats = avgRating > 0 ? avgRating.toFixed(1) + " avg" : "\u2014";
      if (pendingReviews > 0) stats += " \u00B7 " + pendingReviews + " AI replies pending";
      else if (totalReviews > 0) stats += " \u00B7 " + totalReviews + " reviews";
      return { ...ch, stats, status: pendingReviews > 0 ? "amber" : "green" };
    }
    return ch;
  });

  return (
    <div className="px-8 py-6">
      {/* Section A: Greeting */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900">
            {getGreeting()}, {user?.business_name || "Partner"}!
          </h1>
          <p className="mt-0.5 text-sm italic text-gray-500">
            {totalPosts > 0 || totalReviews > 0
              ? "Your AI engine has created " + totalPosts + " posts and handled " + totalReviews + " reviews"
              : "Your AI engine is ready \u2014 log your first patient to start"}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="cursor-pointer rounded-md bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md">
            + New post
          </button>
          <button className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-xs text-gray-700 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:text-emerald-600 hover:shadow-md">
            View website
          </button>
        </div>
      </div>

      {/* Patient Done — Layer 1 trigger */}
      <button
        onClick={() => setShowPatientDone(true)}
        className="mb-5 flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5 text-xl font-semibold text-white shadow-lg transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl active:scale-[0.99]"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        Patient done
      </button>

      {/* Patient Done modal */}
      {showPatientDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Log patient visit</h2>
              <button onClick={() => { setShowPatientDone(false); setPdName(""); setPdPhone(""); }} className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600">&times;</button>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Patient name</label>
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="e.g. Rajesh Kumar"
                value={pdName}
                onChange={(e) => setPdName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-xs text-gray-500">Phone number</label>
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="e.g. 9553053446"
                value={pdPhone}
                onChange={(e) => setPdPhone(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handlePatientDone(); }}
              />
            </div>
            <button
              onClick={handlePatientDone}
              disabled={pdSubmitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pdSubmitting ? "Logging..." : "Log patient"}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {pdToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          <span className="mr-2">✓</span>{pdToast}
        </div>
      )}

      {/* Section B: Metric cards */}
      <div className="grid grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md border-t-2 ${m.accent}`}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              {m.label}
            </div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {m.value}
            </div>
            <div className="mt-1.5">
              <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                {m.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Section C: Two columns */}
      <div className="mt-4 grid grid-cols-[1fr_280px] gap-4">
        {/* Left: Channel performance */}
        <div>
          <h2 className="mb-3 text-sm font-medium tracking-tight text-gray-900">
            Channel performance
          </h2>
          {renderedChannels.map((ch) => (
            <div
              key={ch.name}
              className="mb-2 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium shadow-sm ${
                  ch.textColor || "text-white"
                } ${ch.textSize || ""}`}
                style={{ background: ch.bg }}
              >
                {ch.icon}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-gray-900">
                  {ch.name}
                </div>
                <div className="text-[11px] text-gray-500">{ch.stats}</div>
              </div>
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  ch.status === "amber"
                    ? "bg-amber-500"
                    : "bg-emerald-500 animate-pulse"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Right column */}
        <div>
          {/* AI activity feed */}
          <h2 className="mb-3 text-sm font-medium tracking-tight text-gray-900">
            AI activity feed
          </h2>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            {activities.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">
                AI activity will appear here as you use the platform
              </div>
            ) : (
              activities.map((a, i) => (
                <div
                  key={i}
                  className="flex gap-2.5 rounded-md px-2 py-2 transition-all duration-200 hover:bg-gray-50"
                >
                  <div
                    className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${a.color}`}
                  />
                  <div>
                    <div className="text-xs text-gray-900">{a.text}</div>
                    <div className="text-[11px] text-gray-300">{a.time}</div>
                  </div>
                </div>
              ))
            )}
            <div className="mt-2 border-t border-gray-100 pt-2 text-center">
              <span className="cursor-pointer text-[11px] text-emerald-600 transition-all duration-200 hover:text-emerald-700">
                View all →
              </span>
            </div>
          </div>

          {/* Today's appointments */}
          <h2 className="mb-2.5 mt-4 text-sm font-medium tracking-tight text-gray-900">
            Today&apos;s appointments
          </h2>
          <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            {apptList.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">
                No appointments today — tap Patient Done to log visits
              </div>
            ) : (
              apptList.map((a: any) => {
                var badgeClass = a.status === "completed"
                  ? "bg-emerald-100 text-emerald-800"
                  : a.status === "booked"
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800";
                var badgeText = a.status === "completed" ? "Done" : a.status === "booked" ? "Confirmed" : a.status || "Pending";
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-md px-1 py-2 transition-all duration-200 hover:bg-gray-50"
                  >
                    <div>
                      <div className="text-xs font-medium text-gray-900">
                        {a.patient_name || "Patient"}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {a.slot_time || ""}{a.reason ? " \u00B7 " + a.reason : ""}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>
                );
              })
            )}
            <div className="mt-2 border-t border-gray-100 pt-2 text-center">
              <span className="cursor-pointer text-[11px] text-emerald-600 transition-all duration-200 hover:text-emerald-700">
                View calendar →
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
