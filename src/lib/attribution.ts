// ============================================================
// MHAI Attribution Capture Helper
// Part of Option D: phone-based late-binding attribution
// Captures UTM params + referrer on public landing pages
// Persists to localStorage with 30-day TTL
// ============================================================

var ATTR_KEY = "mhai_attribution_v1";
var TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type AttributionPayload = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  first_touch_at: number;
  referrer_url: string | null;
};

// Read UTM params + referrer from current browser context.
// Returns null on SSR (window undefined) or if no UTM data found.
export function captureFromUrl(): AttributionPayload | null {
  if (typeof window === "undefined") return null;

  var params = new URLSearchParams(window.location.search);
  var utm_source   = params.get("utm_source");
  var utm_medium   = params.get("utm_medium");
  var utm_campaign = params.get("utm_campaign");
  var utm_term     = params.get("utm_term");
  var utm_content  = params.get("utm_content");
  var referrer_url = document.referrer || null;

  // If NO attribution signals at all, return null
  if (!utm_source && !utm_medium && !utm_campaign && !referrer_url) {
    return null;
  }

  return {
    utm_source:   utm_source,
    utm_medium:   utm_medium,
    utm_campaign: utm_campaign,
    utm_term:     utm_term,
    utm_content:  utm_content,
    first_touch_at: Date.now(),
    referrer_url: referrer_url,
  };
}

// Load cached attribution from localStorage, checking TTL.
// Returns null if expired or missing.
export function loadCached(): AttributionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    var raw = window.localStorage.getItem(ATTR_KEY);
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.first_touch_at !== "number") return null;
    // TTL check
    if (Date.now() - parsed.first_touch_at > TTL_MS) {
      window.localStorage.removeItem(ATTR_KEY);
      return null;
    }
    return parsed as AttributionPayload;
  } catch (e) {
    return null;
  }
}

// Save attribution payload to localStorage
export function saveToCache(p: AttributionPayload): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ATTR_KEY, JSON.stringify(p));
  } catch (e) {
    // quota exceeded or disabled — fail silently
  }
}

// Main entry point: called on landing page mount.
// First-touch model: if cached exists, use cached (first-touch preserved).
// If no cached, try URL capture, save to cache if found.
// Returns the attribution payload that should be attached to bookings,
// or null if no attribution signals available.
export function getOrCaptureAttribution(): AttributionPayload | null {
  var cached = loadCached();
  if (cached) {
    // First-touch model: existing attribution wins, preserve it
    return cached;
  }

  // No cache — try fresh capture from URL
  var fresh = captureFromUrl();
  if (fresh) {
    saveToCache(fresh);
    return fresh;
  }

  return null;
}

// For testing / debugging — clears cached attribution
export function clearAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ATTR_KEY);
  } catch (e) {}
}
