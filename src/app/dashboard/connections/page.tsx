"use client";

import { useState, useEffect } from "react";
import {
  getConnections,
  connectPlatform,
  disconnectPlatform,
  getBrandSettings,
  saveBrandSettings,
} from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";

/* ── platform definitions ── */
var platforms = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    desc: "Send messages and automations",
    icon: "Wa",
    iconBg: "bg-[#25D366]",
    pending: true,
    pendingText: "Backend ready, Meta approval pending",
  },
  {
    id: "facebook",
    name: "Facebook",
    desc: "Publish posts to your page",
    icon: "f",
    iconBg: "bg-[#1877F2]",
  },
  {
    id: "instagram",
    name: "Instagram",
    desc: "Share posts and reels",
    icon: "Ig",
    iconBg: "bg-gradient-to-br from-[#f09433] to-[#bc1888]",
  },
  {
    id: "gbp",
    name: "Google Business",
    desc: "Update your business profile",
    icon: "G",
    iconBg: "bg-[#4285F4]",
  },
  {
    id: "google_maps",
    name: "Google Maps",
    desc: "Show clinic location to patients",
    icon: "M",
    iconBg: "bg-[#34A853]",
    isLocation: true,
  },
];

type Connection = {
  platform: string;
  status: string;
  page_name?: string;
  connected_at?: string;
};

export default function ConnectionsPage() {
  var notify = useNotification();
  var [connections, setConnections] = useState<Connection[]>([]);
  var [loading, setLoading] = useState(true);

  /* connect modal state */
  var [connectModal, setConnectModal] = useState<string | null>(null);
  var [tokenInput, setTokenInput] = useState("");
  var [pageIdInput, setPageIdInput] = useState("");
  var [saving, setSaving] = useState(false);

  /* location modal state */
  var [locationModal, setLocationModal] = useState(false);
  var [locAddress, setLocAddress] = useState("");
  var [locLat, setLocLat] = useState("");
  var [locLng, setLocLng] = useState("");
  var [locSaving, setLocSaving] = useState(false);

  /* brand location data */
  var [brandLoc, setBrandLoc] = useState<{ clinic_address?: string; clinic_lat?: string; clinic_lng?: string }>({});

  useEffect(() => {
    getConnections()
      .then((res) => {
        if (res.success && res.connections) setConnections(res.connections);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    getBrandSettings()
      .then((res) => {
        if (res.success && res.data) {
          setBrandLoc({
            clinic_address: res.data.clinic_address || "",
            clinic_lat: res.data.clinic_lat || "",
            clinic_lng: res.data.clinic_lng || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  function getConnection(platformId: string): Connection | undefined {
    return connections.find((c) => c.platform === platformId);
  }

  /* ── connect ── */
  async function handleConnect() {
    if (!connectModal) return;
    if (!tokenInput.trim()) {
      notify.warning("Missing token", "Please enter your access token.");
      return;
    }
    setSaving(true);
    try {
      var res = await connectPlatform(connectModal, {
        access_token: tokenInput.trim(),
        page_id: pageIdInput.trim() || undefined,
      });
      if (res.success) {
        notify.success("Connected!", connectModal + " has been connected.");
        setConnections((prev) => [
          ...prev.filter((c) => c.platform !== connectModal),
          { platform: connectModal!, status: "connected", page_name: pageIdInput || undefined, connected_at: new Date().toISOString() },
        ]);
        setConnectModal(null);
        setTokenInput("");
        setPageIdInput("");
      } else {
        notify.error("Failed", res.error || res.message || "Could not connect. Check your credentials.");
      }
    } catch {
      notify.error("Network error", "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ── disconnect ── */
  async function handleDisconnect(platformId: string) {
    setSaving(true);
    try {
      var res = await disconnectPlatform(platformId);
      if (res.success) {
        notify.success("Disconnected", platformId + " has been disconnected.");
        setConnections((prev) => prev.filter((c) => c.platform !== platformId));
      } else {
        notify.error("Failed", res.error || res.message || "Could not disconnect.");
      }
    } catch {
      notify.error("Network error", "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ── save location ── */
  async function handleSaveLocation() {
    if (!locAddress.trim()) {
      notify.warning("Missing address", "Please enter your clinic address.");
      return;
    }
    setLocSaving(true);
    try {
      var res = await saveBrandSettings({
        clinic_address: locAddress.trim(),
        clinic_lat: locLat.trim(),
        clinic_lng: locLng.trim(),
      });
      if (res.success) {
        notify.success("Location saved", "Your clinic location has been updated.");
        setBrandLoc({ clinic_address: locAddress.trim(), clinic_lat: locLat.trim(), clinic_lng: locLng.trim() });
        setLocationModal(false);
      } else {
        notify.error("Failed", res.error || res.message || "Could not save location.");
      }
    } catch {
      notify.error("Network error", "Please try again.");
    } finally {
      setLocSaving(false);
    }
  }

  var connectedCount = connections.filter((c) => c.status === "connected").length + (brandLoc.clinic_lat ? 1 : 0);

  var inputClass =
    "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  return (
    <div className="px-8 py-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-gray-900">Connections hub</h1>
          <p className="mt-0.5 text-sm text-gray-500">Connect your accounts once — AI uses them everywhere</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{connectedCount} of {platforms.length} connected</span>
          <div className="h-2 w-20 rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: (connectedCount / platforms.length * 100) + "%" }} />
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 shadow-sm">
        Connect your accounts to publish content directly from MHAI. OAuth login coming in the next update.
      </div>

      {loading ? (
        <div className="mt-10 flex items-center justify-center">
          <div className="text-sm text-gray-400">Loading connections...</div>
        </div>
      ) : (
        <>
          {/* Platform cards grid */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {platforms.map((plat) => {
              /* ── WhatsApp: pending card ── */
              if (plat.pending) {
                return (
                  <div key={plat.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-[10px] font-medium text-white shadow-sm ${plat.iconBg}`}>{plat.icon}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{plat.name}</div>
                        <div className="text-[11px] text-gray-500">{plat.desc}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span className="text-[11px] font-medium text-amber-600">{plat.pendingText}</span>
                    </div>
                    <button disabled className="mt-3 w-full cursor-not-allowed rounded-md bg-gray-100 py-2.5 text-xs font-medium text-gray-400">
                      Pending Meta approval
                    </button>
                  </div>
                );
              }

              /* ── Google Maps: location card ── */
              if (plat.isLocation) {
                var hasLocation = !!(brandLoc.clinic_lat && brandLoc.clinic_lng);
                return (
                  <div key={plat.id} className={`rounded-2xl border p-4 shadow-sm ${hasLocation ? "border-emerald-200" : "border-gray-100"} bg-white`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-[10px] font-medium text-white shadow-sm ${plat.iconBg}`}>{plat.icon}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{plat.name}</div>
                        <div className="text-[11px] text-gray-500">{plat.desc}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${hasLocation ? "bg-emerald-500" : "bg-gray-400"}`} />
                      <span className="text-[11px] font-medium text-gray-900">{hasLocation ? "Location set" : "No location set"}</span>
                    </div>
                    {hasLocation && brandLoc.clinic_address && (
                      <div className="mt-1 text-[11px] text-gray-500">{brandLoc.clinic_address}</div>
                    )}
                    <button
                      onClick={() => {
                        setLocAddress(brandLoc.clinic_address || "");
                        setLocLat(brandLoc.clinic_lat || "");
                        setLocLng(brandLoc.clinic_lng || "");
                        setLocationModal(true);
                      }}
                      className={`mt-3 w-full cursor-pointer rounded-md py-2.5 text-xs font-medium shadow-sm transition-all duration-200 ${
                        hasLocation
                          ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          : "bg-emerald-500 text-white hover:bg-emerald-600"
                      }`}
                    >
                      {hasLocation ? "Update location" : "Set location"}
                    </button>
                    {hasLocation && brandLoc.clinic_lat && brandLoc.clinic_lng && (
                      <div className="mt-3 overflow-hidden rounded-xl">
                        <iframe
                          src={`https://maps.google.com/maps?q=${brandLoc.clinic_lat},${brandLoc.clinic_lng}&z=15&output=embed`}
                          className="h-32 w-full border-0"
                          loading="lazy"
                          title="Clinic location"
                        />
                      </div>
                    )}
                  </div>
                );
              }

              /* ── Standard platform card (FB, IG, GBP) ── */
              var conn = getConnection(plat.id);
              var isConnected = conn?.status === "connected";

              return (
                <div key={plat.id} className={`rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md ${isConnected ? "border-emerald-200" : "border-gray-100"} bg-white`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-[10px] font-medium text-white shadow-sm ${plat.iconBg}`}>{plat.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{plat.name}</div>
                      <div className="text-[11px] text-gray-500">{plat.desc}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-gray-400"}`} />
                    <span className="text-[11px] font-medium text-gray-900">{isConnected ? "Connected" : "Not connected"}</span>
                    {isConnected && conn?.page_name && (
                      <span className="text-[11px] text-gray-500">{conn.page_name}</span>
                    )}
                  </div>
                  {isConnected && conn?.connected_at && (
                    <div className="mt-0.5 text-[10px] text-gray-400">
                      Connected {new Date(conn.connected_at).toLocaleDateString()}
                    </div>
                  )}
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(plat.id)}
                      disabled={saving}
                      className="mt-3 w-full cursor-pointer rounded-md bg-gray-100 py-2.5 text-xs font-medium text-gray-600 transition-all duration-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => { setConnectModal(plat.id); setTokenInput(""); setPageIdInput(""); }}
                      className="mt-3 w-full cursor-pointer rounded-md bg-emerald-500 py-2.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md"
                    >
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom coming soon */}
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div>
              <div className="text-sm font-medium tracking-tight text-gray-900">Coming soon: EMR integration</div>
              <div className="text-[11px] text-gray-500">Sync with Epic, Athena, or your HMS for appointment data</div>
            </div>
            <button className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-[11px] text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm">
              Notify me
            </button>
          </div>
        </>
      )}

      {/* ── Connect modal ── */}
      {connectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Connect {platforms.find((p) => p.id === connectModal)?.name}
              </h2>
              <button onClick={() => setConnectModal(null)} className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600">&times;</button>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Access Token</label>
              <input
                className={inputClass}
                placeholder="Paste your access token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Page ID (optional)</label>
              <input
                className={inputClass}
                placeholder="e.g. 123456789"
                value={pageIdInput}
                onChange={(e) => setPageIdInput(e.target.value)}
              />
            </div>

            <div className="mb-4 rounded-lg bg-gray-50 p-3 text-[11px] text-gray-500">
              Get your access token from the platform's developer settings. For Facebook and Instagram, use a Page Access Token with publish permissions. OAuth flow coming soon.
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setConnectModal(null)} className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs text-gray-700 transition-all duration-200 hover:border-gray-400">Cancel</button>
              <button
                onClick={handleConnect}
                disabled={saving}
                className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Connecting..." : "Save connection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Location modal ── */}
      {locationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Set clinic location</h2>
              <button onClick={() => setLocationModal(false)} className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600">&times;</button>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Clinic address</label>
              <input
                className={inputClass}
                placeholder="123 Main Street, City, State"
                value={locAddress}
                onChange={(e) => setLocAddress(e.target.value)}
              />
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Latitude</label>
                <input
                  className={inputClass}
                  placeholder="e.g. 17.385044"
                  value={locLat}
                  onChange={(e) => setLocLat(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Longitude</label>
                <input
                  className={inputClass}
                  placeholder="e.g. 78.486671"
                  value={locLng}
                  onChange={(e) => setLocLng(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-4 rounded-lg bg-gray-50 p-3 text-[11px] text-gray-500">
              Enter your clinic address. This will show on your website and booking page. Find coordinates by searching your clinic on Google Maps and copying from the URL.
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setLocationModal(false)} className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs text-gray-700 transition-all duration-200 hover:border-gray-400">Cancel</button>
              <button
                onClick={handleSaveLocation}
                disabled={locSaving}
                className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {locSaving ? "Saving..." : "Save location"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
