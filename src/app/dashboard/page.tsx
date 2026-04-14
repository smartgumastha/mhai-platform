"use client";

import { useAuth } from "@/app/providers/auth-context";

var metrics = [
  {
    label: "Appointments today",
    value: "8",
    change: "↑ 3 from yesterday",
    accent: "border-t-emerald-500",
  },
  {
    label: "Google rating",
    value: "4.8 ★",
    change: "12 new reviews",
    accent: "border-t-blue-500",
  },
  {
    label: "Website visits",
    value: "347",
    change: "↑ 18% this week",
    accent: "border-t-purple-500",
  },
  {
    label: "Revenue (MTD)",
    value: "₹1.2L",
    change: "₹84K collected online",
    accent: "border-t-amber-500",
  },
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
  {
    color: "bg-emerald-500",
    text: "AI replied to Google review from Priya R.",
    time: "2 min ago",
  },
  {
    color: "bg-emerald-500",
    text: "Instagram post created: 'World Diabetes Day'",
    time: "15 min ago",
  },
  {
    color: "bg-blue-500",
    text: "WhatsApp: 8 appointment reminders sent",
    time: "1 hour ago",
  },
  {
    color: "bg-amber-500",
    text: "SEO: meta tags updated for 3 pages",
    time: "3 hours ago",
  },
  {
    color: "bg-emerald-500",
    text: "Website: booking widget updated",
    time: "5 hours ago",
  },
  {
    color: "bg-emerald-500",
    text: "MHAI Pay: ₹2,400 collected via UPI",
    time: "Yesterday",
  },
];

var appointments = [
  {
    name: "Rajesh Kumar",
    detail: "10:30 AM · Knee pain",
    badge: "Confirmed",
    badgeClass: "bg-green-100 text-green-800",
  },
  {
    name: "Sunita Devi",
    detail: "11:00 AM · Back rehab",
    badge: "Pending",
    badgeClass: "bg-amber-100 text-amber-800",
  },
  {
    name: "Arun Sharma",
    detail: "2:00 PM · Shoulder",
    badge: "Confirmed",
    badgeClass: "bg-green-100 text-green-800",
  },
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
    <div className="px-8 py-6">
      {/* Section A: Greeting */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900">
            {getGreeting()}, {user?.business_name || "Partner"}!
          </h1>
          <p className="mt-0.5 text-sm italic text-gray-500">
            Your AI engine processed 23 tasks while you slept
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
          {channels.map((ch) => (
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
            {activities.map((a, i) => (
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
            ))}
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
            {appointments.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md px-1 py-2 transition-all duration-200 hover:bg-gray-50"
              >
                <div>
                  <div className="text-xs font-medium text-gray-900">
                    {a.name}
                  </div>
                  <div className="text-[11px] text-gray-400">{a.detail}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${a.badgeClass}`}
                >
                  {a.badge}
                </span>
              </div>
            ))}
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
