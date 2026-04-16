"use client";

import { useState, useEffect } from "react";
import { getCampaigns, startCampaign, pauseCampaign, getTelecallerStats } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";
import Link from "next/link";

var STATUS_PILL: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-emerald-50 text-emerald-700",
  paused: "bg-amber-50 text-amber-700",
  completed: "bg-blue-50 text-blue-700",
};

export default function CampaignsPage() {
  var notify = useNotification();
  var [campaigns, setCampaigns] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);
  var [stats, setStats] = useState<any>(null);

  function fetchCampaigns() {
    setLoading(true);
    getCampaigns().then(function (res) {
      if (res.success && res.data) setCampaigns(res.data);
    }).finally(function () { setLoading(false); });
  }

  useEffect(function () {
    fetchCampaigns();
    getTelecallerStats().then(function (r) { if (r.success && r.data) setStats(r.data); });
  }, []);

  async function handleToggle(id: string, currentStatus: string) {
    if (currentStatus === "active") {
      var res = await pauseCampaign(id);
      if (res.success) { notify.success("Campaign paused"); fetchCampaigns(); }
      else notify.error("Failed", res.error || "");
    } else {
      var res2 = await startCampaign(id);
      if (res2.success) { notify.success("Campaign started"); fetchCampaigns(); }
      else notify.error("Failed", res2.error || "");
    }
  }

  return (
    <div className="min-h-screen p-6">
      <p className="text-xs text-gray-400 mb-1">Telecaller CRM / Campaigns</p>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Campaigns</h1>
        <Link href="/dashboard/telecaller/campaigns/new" className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
          New campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border bg-white px-4 py-3">
          <p className="text-xs text-gray-400">Active campaigns</p>
          <p className="text-xl font-bold text-gray-900">{stats?.active_campaigns || 0}</p>
        </div>
        <div className="rounded-xl border bg-white px-4 py-3">
          <p className="text-xs text-gray-400">Total leads</p>
          <p className="text-xl font-bold text-gray-900">{stats?.total_leads || 0}</p>
        </div>
        <div className="rounded-xl border bg-white px-4 py-3">
          <p className="text-xs text-gray-400">Calls today</p>
          <p className="text-xl font-bold text-gray-900">{stats?.calls_today || 0}</p>
        </div>
        <div className="rounded-xl border bg-white px-4 py-3">
          <p className="text-xs text-gray-400">Converted</p>
          <p className="text-xl font-bold text-gray-900">{stats?.converted_leads || 0}</p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(function (i) { return <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />; })}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border bg-white py-16 text-center">
          <div className="text-3xl mb-3">{"\uD83D\uDCE3"}</div>
          <h3 className="text-lg font-semibold text-gray-800">Your campaigns will appear here</h3>
          <p className="text-sm text-gray-400 mt-1">Create your first campaign to start reaching leads.</p>
          <Link href="/dashboard/telecaller/campaigns/new" className="mt-4 inline-block rounded-md bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600">
            Create campaign
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-gray-400">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Called</th>
                <th className="px-4 py-3 font-medium">Converted</th>
                <th className="px-4 py-3 font-medium">Conv. rate</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(function (c: any) {
                var convRate = c.contacted > 0 ? Math.round((c.converted / c.contacted) * 100) : 0;
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium " + (STATUS_PILL[c.status] || "bg-gray-100")}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.total_leads || 0}</td>
                    <td className="px-4 py-3 text-gray-600">{c.contacted || 0}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">{c.converted || 0}</td>
                    <td className="px-4 py-3 text-gray-600">{convRate}%</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={function () { handleToggle(c.id, c.status); }}
                          className={"rounded-md px-2.5 py-1 text-[11px] font-medium " +
                            (c.status === "active" ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100")}
                        >
                          {c.status === "active" ? "Pause" : "Start"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
