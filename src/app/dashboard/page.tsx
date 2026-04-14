"use client";

import { useAuth } from "@/app/providers/auth-context";

var metrics = [
  { label: "Appointments today", value: "8", change: "↑ 3 from yesterday" },
  { label: "Google rating", value: "4.8 ★", change: "12 new reviews" },
  { label: "Website visits", value: "347", change: "↑ 18% this week" },
  { label: "Revenue (MTD)", value: "₹1.2L", change: "₹84K collected online" },
];

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
    stats: "4.8 avg · 3 AI replies pending",
    status: "amber",
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

var activities = [
  { color: "bg-emerald-500", text: "AI replied to Google review from Priya R.", time: "2 min ago" },
  { color: "bg-emerald-500", text: "Instagram post created: 'World Diabetes Day'", time: "15 min ago" },
  { color: "bg-blue-500", text: "WhatsApp: 8 appointment reminders sent", time: "1 hour ago" },
  { color: "bg-amber-500", text: "SEO: meta tags updated for 3 pages", time: "3 hours ago" },
  { color: "bg-emerald-500", text: "Website: booking widget updated", time: "5 hours ago" },
  { color: "bg-emerald-500", text: "MHAI Pay: ₹2,400 collected via UPI", time: "Yesterday" },
];

var appointments = [
  { name: "Rajesh Kumar", detail: "10:30 AM · Knee pain", badge: "Confirmed", badgeClass: "bg-green-100 text-green-800" },
  { name: "Sunita Devi", detail: "11:00 AM · Back rehab", badge: "Pending", badgeClass: "bg-amber-100 text-amber-800" },
  { name: "Arun Sharma", detail: "2:00 PM · Shoulder", badge: "Confirmed", badgeClass: "bg-green-100 text-green-800" },
];

function getGreeting() {
  var h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  var { user } = useAuth();

  return (
    <div className="p-6">
      {/* Section A: Greeting */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900">
            {getGreeting()}, {user?.business_name || "Partner"}!
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Your AI engine processed 23 tasks while you slept
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md bg-emerald-500 px-4 py-2 text-xs text-white hover:bg-emerald-600">
            + New post
          </button>
          <button className="rounded-md border border-gray-300 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">
            View website
          </button>
        </div>
      </div>

      {/* Section B: Metric cards */}
      <div className="grid grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-[11px] text-gray-500">{m.label}</div>
            <div className="mt-1 text-2xl font-medium text-gray-900">{m.value}</div>
            <div className="mt-1 text-[11px] text-emerald-500">{m.change}</div>
          </div>
        ))}
      </div>

      {/* Section C: Two columns */}
      <div className="mt-4 grid grid-cols-[1fr_280px] gap-4">
        {/* Left: Channel performance */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-gray-900">Channel performance</h2>
          {channels.map((ch) => (
            <div
              key={ch.name}
              className="mb-2 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg font-medium text-sm ${
                  ch.textColor || "text-white"
                } ${ch.textSize || ""}`}
                style={{ background: ch.bg }}
              >
                {ch.icon}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-gray-900">{ch.name}</div>
                <div className="text-[11px] text-gray-500">{ch.stats}</div>
              </div>
              <div
                className={`h-2 w-2 rounded-full ${
                  ch.status === "amber" ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Right column */}
        <div>
          {/* AI activity feed */}
          <h2 className="mb-3 text-sm font-medium text-gray-900">AI activity feed</h2>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            {activities.map((a, i) => (
              <div key={i} className="flex gap-2.5 py-2">
                <div className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${a.color}`} />
                <div>
                  <div className="text-xs text-gray-900">{a.text}</div>
                  <div className="text-[11px] text-gray-400">{a.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Today's appointments */}
          <h2 className="mb-2.5 mt-4 text-sm font-medium text-gray-900">Today&apos;s appointments</h2>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            {appointments.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-xs font-medium text-gray-900">{a.name}</div>
                  <div className="text-[11px] text-gray-400">{a.detail}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${a.badgeClass}`}>
                  {a.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
