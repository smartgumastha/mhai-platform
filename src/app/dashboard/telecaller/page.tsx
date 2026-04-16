"use client";

import { useState, useEffect } from "react";
import { getLeads, createLead, getTelecallerStats } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";
import { useCurrency } from "@/app/hooks/useCurrency";
import { useDashboard } from "@/app/dashboard/contexts/DashboardContext";
import LeadDetailModal from "./_components/LeadDetailModal";
import CallDispositionModal from "./_components/CallDispositionModal";

// ── Constants ──
var COMPLIANCE_BADGES = [
  { code: "IN", label: "IN TRAI" },
  { code: "US", label: "US TCPA" },
  { code: "UK", label: "UK PECR" },
  { code: "EU", label: "EU GDPR" },
  { code: "AE", label: "AE TDRA" },
  { code: "SG", label: "SG PDPA" },
  { code: "AU", label: "AU Spam Act" },
  { code: "CA", label: "CA CRTC" },
];

var STATUS_COLORS: Record<string, string> = {
  new: "bg-teal-500",
  contacted: "bg-amber-500",
  follow_up: "bg-orange-400",
  converted: "bg-emerald-500",
  lost: "bg-gray-300",
  dnd: "bg-red-400",
};

var STATUS_PILL: Record<string, string> = {
  new: "bg-teal-50 text-teal-700",
  assigned: "bg-blue-50 text-blue-700",
  contacted: "bg-amber-50 text-amber-700",
  follow_up: "bg-orange-50 text-orange-700",
  converted: "bg-emerald-50 text-emerald-700",
  lost: "bg-gray-100 text-gray-500",
  dnd: "bg-red-50 text-red-600",
};

var SOURCE_PILL: Record<string, string> = {
  website: "bg-blue-50 text-blue-600",
  whatsapp: "bg-green-50 text-green-600",
  clara_bot: "bg-purple-50 text-purple-600",
  walk_in: "bg-amber-50 text-amber-600",
  csv_import: "bg-gray-100 text-gray-600",
  referral: "bg-pink-50 text-pink-600",
};

var FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "mine", label: "Assigned to me" },
  { id: "followup", label: "Follow-up due" },
  { id: "high", label: "High intent" },
];

var SOURCE_OPTIONS = ["website", "whatsapp", "clara_bot", "walk_in", "csv_import", "referral"];

function isWithinCallingHours(): { allowed: boolean; nextOpen: string } {
  var now = new Date();
  var hours = now.getHours();
  if (hours >= 9 && hours < 21) return { allowed: true, nextOpen: "" };
  var hoursUntil = hours < 9 ? 9 - hours : 24 - hours + 9;
  return { allowed: false, nextOpen: hoursUntil + " hours" };
}

function getInitials(name: string) {
  if (!name) return "?";
  var parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

function getCountryFromPhone(phone: string): string {
  if (!phone) return "IN";
  if (phone.startsWith("+1")) return "US";
  if (phone.startsWith("+44")) return "UK";
  if (phone.startsWith("+61")) return "AU";
  if (phone.startsWith("+971")) return "AE";
  if (phone.startsWith("+65")) return "SG";
  if (phone.startsWith("+49") || phone.startsWith("+33") || phone.startsWith("+39")) return "EU";
  if (phone.startsWith("+91")) return "IN";
  return "IN";
}

function getCountryName(code: string): string {
  var names: Record<string, string> = { IN: "India", US: "United States", UK: "United Kingdom", AU: "Australia", AE: "UAE", SG: "Singapore", EU: "Europe", CA: "Canada" };
  return names[code] || code;
}

export default function TelecallerPage() {
  var notify = useNotification();
  var currency = useCurrency();
  var { brand, hospital } = useDashboard();

  // ── State ──
  var [leads, setLeads] = useState<any[]>([]);
  var [total, setTotal] = useState(0);
  var [loading, setLoading] = useState(true);
  var [stats, setStats] = useState<any>(null);
  var [statsLoading, setStatsLoading] = useState(true);

  // Filters
  var [tab, setTab] = useState("all");
  var [sourceFilter, setSourceFilter] = useState("");
  var [searchQuery, setSearchQuery] = useState("");

  // Modals
  var [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  var [callLead, setCallLead] = useState<any>(null);

  // Add lead modal
  var [showAddLead, setShowAddLead] = useState(false);
  var [newLead, setNewLead] = useState({ name: "", phone: "", email: "", source: "website", inquiry: "", specialty: "" });
  var [addingLead, setAddingLead] = useState(false);

  // Time window
  var callingWindow = isWithinCallingHours();

  // Operating countries
  var operatingCountries = (brand?.operating_countries as string[]) || ["IN"];

  // ── Data fetching ──
  function fetchLeads() {
    setLoading(true);
    var filters: any = {};
    if (tab === "new") filters.status = "new";
    if (tab === "followup") filters.status = "follow_up";
    if (sourceFilter) filters.source = sourceFilter;
    if (searchQuery) filters.search = searchQuery;
    filters.limit = 50;

    getLeads(filters).then(function (res) {
      if (res.success) {
        var data = res.data || [];
        // Client-side filter for "mine" and "high"
        if (tab === "high") data = data.filter(function (l: any) { return (l.lead_score || 0) >= 70; });
        setLeads(data);
        setTotal(res.total || data.length);
      } else {
        notify.error("Failed to load leads", res.error || "");
        setLeads([]);
      }
    }).catch(function () {
      notify.error("Network error", "Could not load leads.");
      setLeads([]);
    }).finally(function () { setLoading(false); });
  }

  function fetchStats() {
    setStatsLoading(true);
    getTelecallerStats().then(function (res) {
      if (res.success && res.data) setStats(res.data);
    }).finally(function () { setStatsLoading(false); });
  }

  useEffect(function () { fetchLeads(); }, [tab, sourceFilter, searchQuery]);
  useEffect(function () { fetchStats(); }, []);

  // ── Pipeline bar ──
  var pipeline = { new: 0, contacted: 0, follow_up: 0, converted: 0, lost: 0 };
  leads.forEach(function (l) {
    var s = l.status as keyof typeof pipeline;
    if (pipeline[s] !== undefined) pipeline[s]++;
  });
  var pipelineTotal = Object.values(pipeline).reduce(function (a, b) { return a + b; }, 0) || 1;

  // ── Revenue pipeline ──
  var revenuePipeline = leads.reduce(function (sum, l) {
    if (l.status !== "converted" && l.status !== "lost" && l.status !== "dnd") {
      return sum + (parseInt(l.ltv_estimate) || 0);
    }
    return sum;
  }, 0);

  // ── Add lead ──
  async function handleAddLead() {
    if (!newLead.phone.trim()) {
      notify.warning("Phone required");
      return;
    }
    setAddingLead(true);
    var res = await createLead({
      name: newLead.name || undefined,
      phone: newLead.phone,
      email: newLead.email || undefined,
      source: newLead.source || "website",
      inquiry: newLead.inquiry || undefined,
      specialty: newLead.specialty || undefined,
    });
    setAddingLead(false);
    if (res.success) {
      notify.success("Lead created", "DND status: " + (res.data?.dnd_status || "unknown"));
      setShowAddLead(false);
      setNewLead({ name: "", phone: "", email: "", source: "website", inquiry: "", specialty: "" });
      fetchLeads();
      fetchStats();
    } else {
      notify.error("Failed", res.error || "");
    }
  }

  // ── Render ──
  return (
    <div className="min-h-screen p-6">
      {/* Compliance ribbon */}
      <div className="mb-4 flex flex-wrap items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-emerald-800">All systems compliant</span>
          <div className="flex flex-wrap gap-1.5 ml-2">
            {COMPLIANCE_BADGES.filter(function (b) { return operatingCountries.includes(b.code); }).map(function (b) {
              return (
                <span key={b.code} className="rounded-full bg-white/80 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  {b.label}
                </span>
              );
            })}
          </div>
        </div>
        <span className="text-xs text-emerald-600">
          {callingWindow.allowed
            ? "Calling window: 9 AM to 9 PM local time"
            : "Next calling window opens in " + callingWindow.nextOpen
          }
        </span>
      </div>

      {/* Outside calling hours warning */}
      {!callingWindow.allowed && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500"><circle cx="9" cy="9" r="8" /><path d="M9 5v4l2 2" /></svg>
          <span className="text-sm text-amber-800">
            Calls can only be made between 9 AM and 9 PM. Next window opens in {callingWindow.nextOpen}.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400">Telecaller CRM / Lead pipeline</p>
          <h1 className="text-xl font-bold text-gray-900">Telecaller CRM</h1>
        </div>
        <div className="flex gap-2">
          <a href="/dashboard/telecaller/import" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Import contacts
          </a>
          <a href="/dashboard/telecaller/campaigns" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            New campaign
          </a>
          <button
            onClick={function () { setShowAddLead(true); }}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            + Add lead
          </button>
        </div>
      </div>

      {/* Metrics row */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Total leads", value: stats?.total_leads || "0" },
          { label: "Called today", value: stats?.calls_today || "0" },
          { label: "Converted", value: stats?.converted_leads || "0" },
          { label: "Conversion rate", value: stats ? (parseInt(stats.total_leads) > 0 ? Math.round((parseInt(stats.converted_leads) / parseInt(stats.total_leads)) * 100) + "%" : "0%") : "..." },
          { label: "Revenue pipeline", value: statsLoading ? "..." : currency.formatCompact(revenuePipeline) },
        ].map(function (m) {
          return (
            <div key={m.label} className="rounded-xl border bg-white px-4 py-3.5">
              <p className="text-xs text-gray-400">{m.label}</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{statsLoading && m.value === "..." ? "..." : m.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick nav cards */}
      {stats && (parseInt(stats.active_campaigns) > 0 || parseInt(stats.converted_leads) > 0) && (
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <a href="/dashboard/telecaller/coaching" className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 hover:shadow-sm transition">
            <div>
              <p className="text-xs text-gray-400">This week's coaching</p>
              <p className="text-sm font-medium text-gray-800">Team score available</p>
            </div>
            <span className="text-xs text-emerald-600 font-medium">View reports &rarr;</span>
          </a>
          <a href="/dashboard/telecaller/campaigns" className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 hover:shadow-sm transition">
            <div>
              <p className="text-xs text-gray-400">Active campaigns</p>
              <p className="text-sm font-medium text-gray-800">{stats.active_campaigns} running</p>
            </div>
            <span className="text-xs text-emerald-600 font-medium">Manage &rarr;</span>
          </a>
        </div>
      )}

      {/* Pipeline bar */}
      {total > 0 && (
        <div className="mb-5">
          <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
            {(["new", "contacted", "follow_up", "converted", "lost"] as const).map(function (s) {
              var pct = (pipeline[s] / pipelineTotal) * 100;
              if (pct < 1) return null;
              return <div key={s} className={STATUS_COLORS[s] + " transition-all"} style={{ width: pct + "%" }} />;
            })}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-gray-500">
            {(["new", "contacted", "follow_up", "converted", "lost"] as const).map(function (s) {
              return (
                <span key={s} className="flex items-center gap-1">
                  <span className={"inline-block h-2 w-2 rounded-full " + STATUS_COLORS[s]} />
                  {s.replace("_", " ")} ({pipeline[s]})
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {FILTER_TABS.map(function (f) {
            return (
              <button
                key={f.id}
                onClick={function () { setTab(f.id); }}
                className={"rounded-full px-3 py-1.5 text-xs font-medium transition " + (tab === f.id ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <select
            value={sourceFilter}
            onChange={function (e) { setSourceFilter(e.target.value); }}
            className="rounded-md border px-3 py-1.5 text-xs text-gray-600"
          >
            <option value="">All sources</option>
            {SOURCE_OPTIONS.map(function (s) { return <option key={s} value={s}>{s}</option>; })}
          </select>
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={function (e) { setSearchQuery(e.target.value); }}
            className="rounded-md border px-3 py-1.5 text-xs text-gray-600 w-48 focus:border-emerald-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Lead table / empty state */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(function (i) {
            return <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />;
          })}
        </div>
      ) : leads.length === 0 ? (
        tab !== "all" || sourceFilter || searchQuery ? (
          /* No results for filter */
          <div className="rounded-xl border bg-white py-16 text-center">
            <p className="text-gray-400">No leads match your filters</p>
            <button
              onClick={function () { setTab("all"); setSourceFilter(""); setSearchQuery(""); }}
              className="mt-3 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-600 hover:bg-gray-200"
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* Empty state */
          <div className="rounded-xl border bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-500">
                <path d="M8 4h16a2 2 0 012 2v20a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
                <path d="M12 10h8M12 14h8M12 18h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Your lead pipeline starts here</h3>
            <p className="mt-1 text-sm text-gray-400">Import contacts, create a campaign, or add your first lead</p>
            <div className="mt-5 flex justify-center gap-3">
              <a href="/dashboard/telecaller/import" className="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Import contacts
              </a>
              <a href="/dashboard/telecaller/campaigns" className="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Create campaign
              </a>
              <button onClick={function () { setShowAddLead(true); }} className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
                Add first lead
              </button>
            </div>
          </div>
        )
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-400">
                  <th className="px-4 py-3 font-medium" style={{ width: "22%" }}>Patient</th>
                  <th className="px-4 py-3 font-medium" style={{ width: "14%" }}>Phone</th>
                  <th className="px-4 py-3 font-medium" style={{ width: "10%" }}>Country</th>
                  <th className="px-4 py-3 font-medium" style={{ width: "10%" }}>Source</th>
                  <th className="px-4 py-3 font-medium" style={{ width: "8%" }}>Score</th>
                  <th className="px-4 py-3 font-medium" style={{ width: "10%" }}>LTV</th>
                  <th className="px-4 py-3 font-medium" style={{ width: "10%" }}>Status</th>
                  <th className="px-4 py-3 font-medium" style={{ width: "16%" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(function (lead) {
                  var country = lead.metadata?.country || getCountryFromPhone(lead.phone || "");
                  var fullPhone = lead.phone?.startsWith("+") ? lead.phone : "+91" + lead.phone;
                  var score = lead.lead_score || 0;
                  var scoreClass = score >= 70 ? "bg-emerald-50 text-emerald-600" : score >= 40 ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500";

                  return (
                    <tr
                      key={lead.id}
                      className="border-b last:border-0 hover:bg-gray-50/50 cursor-pointer transition"
                      onClick={function () { setSelectedLeadId(lead.id); }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                            {getInitials(lead.name || "")}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{lead.name || "Unknown"}</p>
                            {lead.inquiry && <p className="text-xs text-gray-400 truncate max-w-[180px]">{lead.inquiry}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{fullPhone}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{getCountryName(country)}</td>
                      <td className="px-4 py-3">
                        <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium " + (SOURCE_PILL[lead.source] || "bg-gray-100 text-gray-600")}>
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + scoreClass}>{score}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{lead.ltv_estimate ? currency.formatCompact(parseInt(lead.ltv_estimate)) : "\u2014"}</td>
                      <td className="px-4 py-3">
                        <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium " + (STATUS_PILL[lead.status] || "bg-gray-100 text-gray-600")}>
                          {lead.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={function (e) { e.stopPropagation(); }}>
                        <div className="flex gap-1.5">
                          {callingWindow.allowed ? (
                            <a
                              href={"tel:" + fullPhone}
                              onClick={function (e) { e.stopPropagation(); setTimeout(function () { setCallLead(lead); }, 500); }}
                              className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
                            >
                              Call
                            </a>
                          ) : (
                            <span className="flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-[11px] text-gray-400 cursor-not-allowed">
                              <svg width="10" height="10" fill="currentColor"><rect x="3" y="1" width="4" height="3" rx="1" /><rect x="1" y="4" width="8" height="5" rx="1" /></svg>
                              Call
                            </span>
                          )}
                          {(country === "IN" || country === "AE" || country === "SG") && (
                            <a
                              href={"https://wa.me/" + fullPhone.replace("+", "") + "?text=" + encodeURIComponent("Hi " + (lead.name || "") + ", reaching out from our clinic.")}
                              target="_blank" rel="noopener noreferrer"
                              className="rounded-md bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700 hover:bg-green-100"
                              onClick={function (e) { e.stopPropagation(); }}
                            >
                              WhatsApp
                            </a>
                          )}
                          {(country === "US" || country === "CA") && (
                            <a href={"sms:" + fullPhone} className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100" onClick={function (e) { e.stopPropagation(); }}>
                              SMS
                            </a>
                          )}
                          {(country === "UK" || country === "EU" || country === "AU") && (
                            <a href={"mailto:" + (lead.email || "")} className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100" onClick={function (e) { e.stopPropagation(); }}>
                              Email
                            </a>
                          )}
                          {!(["IN", "AE", "SG", "US", "CA", "UK", "EU", "AU"].includes(country)) && (
                            <a href={"mailto:" + (lead.email || "")} className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100" onClick={function (e) { e.stopPropagation(); }}>
                              Message
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {leads.map(function (lead) {
              var country = lead.metadata?.country || getCountryFromPhone(lead.phone || "");
              var fullPhone = lead.phone?.startsWith("+") ? lead.phone : "+91" + lead.phone;
              var score = lead.lead_score || 0;
              var scoreClass = score >= 70 ? "bg-emerald-50 text-emerald-600" : score >= 40 ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500";

              return (
                <div
                  key={lead.id}
                  className="rounded-xl border bg-white p-4 cursor-pointer hover:shadow-sm transition"
                  onClick={function () { setSelectedLeadId(lead.id); }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                        {getInitials(lead.name || "")}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{lead.name || "Unknown"}</p>
                        <p className="text-xs text-gray-400">{fullPhone}</p>
                      </div>
                    </div>
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium " + (STATUS_PILL[lead.status] || "bg-gray-100")}>
                      {lead.status?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className={"rounded-full px-1.5 py-0.5 text-[10px] " + (SOURCE_PILL[lead.source] || "bg-gray-100")}>{lead.source}</span>
                    <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + scoreClass}>{score}</span>
                    <span>{getCountryName(country)}</span>
                  </div>
                  <div className="mt-2 flex gap-2" onClick={function (e) { e.stopPropagation(); }}>
                    {callingWindow.allowed ? (
                      <a href={"tel:" + fullPhone} onClick={function () { setTimeout(function () { setCallLead(lead); }, 500); }} className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Call</a>
                    ) : (
                      <span className="rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-400 cursor-not-allowed">Call</span>
                    )}
                    {(country === "IN" || country === "AE" || country === "SG") && (
                      <a href={"https://wa.me/" + fullPhone.replace("+", "")} target="_blank" rel="noopener noreferrer" className="rounded-md bg-green-50 px-3 py-1 text-xs font-medium text-green-700">WhatsApp</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Lead detail modal */}
      {selectedLeadId && (
        <LeadDetailModal
          leadId={selectedLeadId}
          onClose={function () { setSelectedLeadId(null); }}
          onCallClick={function (l) { setSelectedLeadId(null); setCallLead(l); }}
          onUpdated={function () { fetchLeads(); fetchStats(); }}
        />
      )}

      {/* Call disposition modal */}
      {callLead && (
        <CallDispositionModal
          lead={callLead}
          onClose={function () { setCallLead(null); }}
          onSubmitted={function () { setCallLead(null); fetchLeads(); fetchStats(); }}
        />
      )}

      {/* Add lead modal */}
      {showAddLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={function () { setShowAddLead(false); }}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={function (e) { e.stopPropagation(); }}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Add Lead</h3>
            <div className="space-y-3">
              <input
                placeholder="Name"
                value={newLead.name}
                onChange={function (e) { setNewLead({ ...newLead, name: e.target.value }); }}
                className="w-full rounded-md border px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
              <input
                placeholder="Phone *"
                value={newLead.phone}
                onChange={function (e) { setNewLead({ ...newLead, phone: e.target.value }); }}
                className="w-full rounded-md border px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
              <input
                placeholder="Email"
                value={newLead.email}
                onChange={function (e) { setNewLead({ ...newLead, email: e.target.value }); }}
                className="w-full rounded-md border px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
              <select
                value={newLead.source}
                onChange={function (e) { setNewLead({ ...newLead, source: e.target.value }); }}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                {SOURCE_OPTIONS.map(function (s) { return <option key={s} value={s}>{s}</option>; })}
              </select>
              <input
                placeholder="Inquiry / reason"
                value={newLead.inquiry}
                onChange={function (e) { setNewLead({ ...newLead, inquiry: e.target.value }); }}
                className="w-full rounded-md border px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
              <input
                placeholder="Specialty (e.g. dental, ortho)"
                value={newLead.specialty}
                onChange={function (e) { setNewLead({ ...newLead, specialty: e.target.value }); }}
                className="w-full rounded-md border px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={function () { setShowAddLead(false); }} className="rounded-md px-4 py-2 text-sm text-gray-500 hover:bg-gray-100">Cancel</button>
              <button
                onClick={handleAddLead}
                disabled={addingLead}
                className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {addingLead ? "Adding..." : "Add lead"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
