"use client";

var connectedCards = [
  {
    name: "Google Business Profile",
    desc: "Reviews, SEO, business updates",
    icon: "G",
    iconBg: "bg-[#4285F4]",
    status: "Connected",
    statusColor: "bg-emerald-500",
    account: "as Kamakya Physiotherapy Clinic",
    btnLabel: "Manage connection",
    btnClass: "bg-gray-100 text-gray-600 hover:bg-gray-200",
    detail:
      "Last synced: 2 min ago | 12 reviews | 4.8 rating | 347 profile views this month",
    tags: ["Review replies", "Local SEO", "Business updates", "Q&A answers"],
  },
  {
    name: "WhatsApp Business",
    desc: "Reminders, follow-ups, broadcasts",
    icon: "Wa",
    iconBg: "bg-[#25D366]",
    status: "Connected",
    statusColor: "bg-emerald-500",
    account: "+91 95530 53446",
    btnLabel: "Manage connection",
    btnClass: "bg-gray-100 text-gray-600 hover:bg-gray-200",
    detail:
      "156 messages sent this month | 94% delivery rate | 67% read rate",
    tags: [
      "Reminders",
      "Follow-ups",
      "Broadcasts",
      "Chatbot",
      "Report delivery",
    ],
  },
];

var disconnectedCards = [
  {
    name: "Instagram Business",
    desc: "Auto-posts, reels, content calendar",
    icon: "Ig",
    iconBg: "bg-[#E4405F]",
    btnLabel: "Connect with Instagram",
    below:
      "Requires a Facebook Page linked to Instagram Business. We'll guide you step by step.",
    tags: ["Auto-posts", "Reels scripts", "Content calendar", "Analytics"],
  },
  {
    name: "Facebook Page",
    desc: "Posts, ads, messenger bot",
    icon: "f",
    iconBg: "bg-[#1877F2]",
    btnLabel: "Connect with Facebook",
    below:
      "Don't have a page? AI will create one for you in 30 seconds using your Brand DNA.",
    tags: ["Auto-posts", "Ad campaigns", "Messenger bot", "Page insights"],
  },
  {
    name: "YouTube Channel",
    desc: "Shorts, video SEO, thumbnails",
    icon: "Yt",
    iconBg: "bg-[#FF0000]",
    btnLabel: "Connect with Google",
    below:
      "AI will generate Shorts scripts and upload directly. Same Google account as your GBP.",
    tags: ["Shorts upload", "Video SEO", "Thumbnail gen"],
  },
  {
    name: "LinkedIn Page",
    desc: "Professional content, articles",
    icon: "in",
    iconBg: "bg-[#0A66C2]",
    btnLabel: "Connect with LinkedIn",
    below: "",
    tags: ["Professional posts", "Article publishing", "Recruitment posts"],
  },
];

var optionalCards = [
  {
    name: "Review platforms",
    desc: "Practo, Healthgrades, Zocdoc, Doctify, NHS.uk",
    icon: "★",
    iconBg: "bg-gray-700",
    btnLabel: "Set up monitoring",
    below:
      "We'll monitor reviews on these platforms and alert you. Replies may need to be posted manually on some platforms.",
    tags: ["Multi-platform alerts", "Sentiment tracking", "Review dashboard"],
    optionalLabel: "country-specific",
  },
  {
    name: "Print partners",
    desc: "Vistaprint, PrintStop, or your local printer",
    icon: "P",
    iconBg: "bg-gray-700",
    btnLabel: "Add print partner",
    below:
      "Design flyers in Print Studio, click 'Order prints' and they ship to your clinic.",
    tags: ["1-click print orders", "Delivery tracking", "Reorder reminders"],
    optionalLabel: "for offline marketing",
  },
];

export default function ConnectionsPage() {
  return (
    <div className="px-8 py-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-gray-900">
            Connections hub
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Connect your accounts once — AI uses them everywhere
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">2 of 8 connected</span>
          <div className="h-2 w-20 rounded-full bg-gray-200">
            <div className="h-full w-1/4 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 shadow-sm">
        Each connection unlocks AI superpowers: Google lets AI reply to reviews.
        Instagram lets AI post content. WhatsApp lets AI send reminders. The
        more you connect, the smarter your AI engine gets.
      </div>

      {/* Connection cards */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Connected */}
        {connectedCards.map((c) => (
          <div
            key={c.name}
            className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-[10px] font-medium text-white shadow-sm ${c.iconBg}`}
              >
                {c.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {c.name}
                </div>
                <div className="text-[11px] text-gray-500">{c.desc}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${c.statusColor}`} />
              <span className="text-[11px] font-medium text-gray-900">
                {c.status}
              </span>
              <span className="text-[11px] text-gray-500">{c.account}</span>
            </div>
            <button
              className={`mt-3 w-full cursor-pointer rounded-md py-2.5 text-xs font-medium transition-all duration-200 ${c.btnClass}`}
            >
              {c.btnLabel}
            </button>
            <div className="mt-2 text-[11px] text-gray-500">{c.detail}</div>
            <div className="mt-2 border-t border-gray-100 pt-2">
              <div className="flex flex-wrap gap-1">
                {c.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] text-gray-600"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Not connected */}
        {disconnectedCards.map((c) => (
          <div
            key={c.name}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-[10px] font-medium text-white shadow-sm ${c.iconBg}`}
              >
                {c.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {c.name}
                </div>
                <div className="text-[11px] text-gray-500">{c.desc}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span className="text-[11px] font-medium text-gray-900">
                Not connected
              </span>
            </div>
            <button className="mt-3 w-full cursor-pointer rounded-md bg-emerald-500 py-2.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md">
              {c.btnLabel}
            </button>
            {c.below && (
              <div className="mt-2 text-[11px] text-gray-500">{c.below}</div>
            )}
            <div className="mt-2 border-t border-gray-100 pt-2">
              <div className="flex flex-wrap gap-1">
                <span className="mr-0.5 text-[10px] text-gray-400">
                  AI will unlock:
                </span>
                {c.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] text-gray-600"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Optional */}
        {optionalCards.map((c) => (
          <div
            key={c.name}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-[10px] font-medium text-white shadow-sm ${c.iconBg}`}
              >
                {c.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {c.name}
                </div>
                <div className="text-[11px] text-gray-500">{c.desc}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="text-[11px] font-medium text-gray-900">
                Optional
              </span>
              <span className="text-[11px] text-gray-500">
                — {c.optionalLabel}
              </span>
            </div>
            <button className="mt-3 w-full cursor-pointer rounded-md bg-blue-500 py-2.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-600 hover:shadow-md">
              {c.btnLabel}
            </button>
            <div className="mt-2 text-[11px] text-gray-500">{c.below}</div>
            <div className="mt-2 border-t border-gray-100 pt-2">
              <div className="flex flex-wrap gap-1">
                {c.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] text-gray-600"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom coming soon */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div>
          <div className="text-sm font-medium tracking-tight text-gray-900">
            Coming soon: EMR integration
          </div>
          <div className="text-[11px] text-gray-500">
            Sync with Epic, Athena, or your HMS for appointment data
          </div>
        </div>
        <button className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-[11px] text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm">
          Notify me
        </button>
      </div>
    </div>
  );
}
