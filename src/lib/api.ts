// API calls go through Next.js rewrites (/api/* → Railway backend)
// This avoids CORS — browser sees same-origin requests.

import type {
  MhaiAppointment,
  AppointmentFilter,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  CreateAppointmentResponse,
  UpdateAppointmentResponse,
} from "./types/MhaiAppointment";

// ── Token management ──
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mhai_token");
}
export function setToken(token: string) {
  localStorage.setItem("mhai_token", token);
}
export function clearToken() {
  localStorage.removeItem("mhai_token");
  localStorage.removeItem("mhai_hms_token");
}

// ── Fetch wrapper ──
async function api<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    var headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    var token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;

    var res = await fetch(path, { ...options, headers });
    var data: any;
    try {
      data = await res.json();
    } catch {
      data = { success: false, error: "Invalid response" };
    }

    if (res.status === 401 && typeof window !== "undefined") {
      // Only redirect to login for auth endpoints, not feature API calls
      var isAuthEndpoint =
        path.includes("/partner-auth/") ||
        path.includes("/auth/") ||
        path === "/api/presence/partner-auth/me";
      if (isAuthEndpoint) {
        clearToken();
        window.location.href = "/login";
      }
    }

    return data as T;
  } catch (error: any) {
    console.error("[API]", path, error?.message);
    return { success: false, message: "Network error. Please try again." } as T;
  }
}

// ── Auth endpoints ──
export function signup(data: {
  email: string;
  business_name: string;
  phone: string;
  password: string;
}) {
  return api<{
    success: boolean;
    token?: string;
    partner?: { id: string; email: string; business_name: string };
    error?: string;
    message?: string;
  }>("/api/presence/partner-auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(data: { email: string; password: string }) {
  return api<{
    success: boolean;
    token?: string;
    partner?: {
      id: string;
      hospital_id: string;
      business_name: string;
      slug: string;
      owner_name: string;
      phone: string;
      email: string;
    };
    message?: string;
  }>("/api/presence/partner-auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMe() {
  return api<{
    success: boolean;
    partner?: any;
    error?: string;
  }>("/api/presence/partner-auth/me");
}

export function getHmsToken() {
  return api<{ success: boolean; hms_token?: string }>("/api/presence/partner-auth/hms-token", {
    method: "POST",
  });
}

export function googleAuth(data: { google_token: string }) {
  return api("/api/presence/partner-auth/google", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Subscription ──
export function getPlans() {
  return api<{ success: boolean; plans?: any[] }>("/api/subscription/plans");
}

export function createCheckout(data: {
  plan_tier: string;
  billing_cycle: string;
  country_code: string;
}) {
  return api("/api/subscription/create-checkout", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getCurrentSubscription() {
  return api("/api/subscription/current");
}

// ── Onboarding ──
export function onboardComplete(data: {
  clinic_info: { name: string; city?: string; phone?: string; type?: string };
  modules?: string[];
  country_code?: string;  // ORetrofit-1
  regulatory_ids?: Record<string, unknown>;  // OB1
}) {
  return api("/api/presence/onboard/complete", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Domain ──
export function checkDomain(domain: string, tld: string = "in") {
  return api(
    "/api/presence/domains/check?domain=" +
      encodeURIComponent(domain) +
      "&tld=" +
      encodeURIComponent(tld)
  );
}

// ── HMS token cache (AI routes need HMS-signed JWT, not partner JWT) ──
function getHmsTokenCached(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mhai_hms_token");
}

async function ensureHmsToken(): Promise<string | null> {
  var cached = getHmsTokenCached();
  if (cached) return cached;
  var res = await getHmsToken();
  if (res.success && res.hms_token) {
    localStorage.setItem("mhai_hms_token", res.hms_token);
    return res.hms_token;
  }
  return null;
}

async function aiApi<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  var hmsToken = await ensureHmsToken();
  if (!hmsToken) {
    return { success: false, message: "Could not obtain HMS token." } as T;
  }
  var headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + hmsToken,
    ...(options.headers as Record<string, string>),
  };
  try {
    var res = await fetch(path, { ...options, headers });
    var data: any;
    try { data = await res.json(); } catch { data = { success: false, error: "Invalid response" }; }
    if (res.status === 401) {
      // HMS token expired — clear cache and retry once
      localStorage.removeItem("mhai_hms_token");
      var freshToken = await ensureHmsToken();
      if (freshToken) {
        headers["Authorization"] = "Bearer " + freshToken;
        var retry = await fetch(path, { ...options, headers });
        try { data = await retry.json(); } catch { data = { success: false, error: "Invalid response" }; }
      }
    }
    return data as T;
  } catch (error: any) {
    console.error("[AI API]", path, error?.message);
    return { success: false, message: "Network error. Please try again." } as T;
  }
}

// ── AI ──
export function generateSocialPost(data: {
  specialty: string;
  topic?: string;
  occasion?: string;
  platform?: string;
  tone?: string;
  language?: string;
}) {
  return aiApi("/api/ai/social-posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function generateReviewReply(data: {
  review_text: string;
  rating?: number;
  clinic_name?: string;
  doctor_name?: string;
  language?: string;
}) {
  return aiApi("/api/ai/review-reply", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Social Posts ──
export function getSocialPosts() {
  return api<{ success: boolean; posts?: any[]; error?: string }>(
    "/api/mhai/social-posts"
  );
}

export function createSocialPost(data: {
  post_type: string;
  content: string;
  platforms: string[];
  hashtags: string;
}) {
  return api<{ success: boolean; post?: any; error?: string; message?: string }>(
    "/api/mhai/social-posts",
    { method: "POST", body: JSON.stringify(data) }
  );
}

// ── Brand ──
export function getBrandSettings() {
  return api<{ success: boolean; data?: any; completeness?: number; error?: string }>(
    "/api/presence/brand-settings"
  );
}

export function saveBrandSettings(data: Record<string, any>) {
  return api<{ success: boolean; completeness?: number; error?: string; message?: string }>(
    "/api/presence/brand-settings",
    { method: "POST", body: JSON.stringify(data) }
  );
}

// ── Dashboard ──
export function getDashboardStats() {
  return api<{
    success: boolean;
    today_appointments?: number;
    total_reviews?: number;
    avg_rating?: number;
    pending_replies?: number;
    total_posts?: number;
    revenue_mtd?: number;
    appointments_list?: any[];
    error?: string;
  }>("/api/mhai/dashboard-stats");
}

export function getAiActivity() {
  return api<{ success: boolean; activities?: any[]; error?: string }>(
    "/api/mhai/ai-activity"
  );
}

export function getReviews() {
  return api<{ success: boolean; reviews?: any[]; error?: string }>(
    "/api/mhai/reviews"
  );
}

// ── Review Actions ──
export function updateReviewResponse(
  reviewId: string,
  data: { reply_text: string; status: string }
) {
  return api<{ success: boolean; error?: string; message?: string }>(
    "/api/mhai/reviews/" + encodeURIComponent(reviewId) + "/ai-response",
    { method: "PUT", body: JSON.stringify(data) }
  );
}

// ── Appointments ──
// Re-export type aliases so callers can `import type { AppointmentFilter, ... } from "@/lib/api"` if preferred.
export type {
  MhaiAppointment,
  AppointmentFilter,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  CreateAppointmentResponse,
  UpdateAppointmentResponse,
};

// ARetrofit-1 Step 5c-frontend: filter kept as string for impl backward-compat.
// Structured AppointmentFilter type is exported for future use when the backend
// endpoint contract supports multi-field filtering.
export function getAppointments(filter?: string) {
  var url = "/api/mhai/appointments";
  if (filter) url += "?filter=" + encodeURIComponent(filter);
  return api<{ success: boolean; appointments?: MhaiAppointment[]; error?: string }>(url);
}

export function createAppointment(data: CreateAppointmentInput) {
  return api<CreateAppointmentResponse>(
    "/api/mhai/appointments",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function updateAppointment(
  appointmentId: string,
  data: UpdateAppointmentInput
) {
  return api<UpdateAppointmentResponse>(
    "/api/mhai/appointments/" + encodeURIComponent(appointmentId),
    { method: "PUT", body: JSON.stringify(data) }
  );
}

// ── Patients ──
export function getPatients() {
  return api<{ success: boolean; patients?: any[]; error?: string }>(
    "/api/mhai/patients"
  );
}

// ── Payments ──
export function createPaymentLink(data: {
  patient_name: string;
  patient_phone: string;
  amount: number;
  purpose: string;
}) {
  return api<{
    success: boolean;
    payment?: {
      id: string;
      hospital_id: string;
      patient_name: string;
      patient_phone: string;
      amount: number;
      purpose: string;
      status: string;
      razorpay_link_id: string;
      short_url: string;
    };
    error?: string;
    message?: string;
  }>("/api/mhai/payments/create-link", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getPayments(status?: string) {
  var url = "/api/mhai/payments";
  if (status) url += "?status=" + encodeURIComponent(status);
  return api<{ success: boolean; payments?: any[]; error?: string }>(url);
}

// ── Website ──
export function getWebsite() {
  return api<{ success: boolean; website?: any; error?: string }>(
    "/api/mhai/websites"
  );
}

export function createWebsite(data: {
  subdomain?: string;
  status?: string;
}) {
  return api<{ success: boolean; website?: any; error?: string; message?: string }>(
    "/api/mhai/websites",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function updateWebsite(id: string, data: Record<string, any>) {
  return api<{ success: boolean; website?: any; error?: string }>(
    "/api/mhai/websites/" + encodeURIComponent(id),
    { method: "PUT", body: JSON.stringify(data) }
  );
}

export function getWebsitePages(websiteId: string) {
  return api<{ success: boolean; pages?: any[]; error?: string }>(
    "/api/mhai/websites/" + encodeURIComponent(websiteId) + "/pages"
  );
}

export function generateBlogPost(topic: string, language?: string) {
  return aiApi<{
    success: boolean;
    page_id?: string;
    website_id?: string;
    title?: string;
    slug?: string;
    meta_description?: string;
    body?: string;
    faq_schema?: any[];
    tags?: string[];
    error?: string;
    message?: string;
  }>("/api/ai/blog-post", {
    method: "POST",
    body: JSON.stringify({ topic, language: language || "English" }),
  });
}

// ── Social Post Actions ──
export function publishPost(postId: string, platforms: string[]) {
  return api<{ success: boolean; post?: any; error?: string; message?: string }>(
    "/api/mhai/social-posts/" + encodeURIComponent(postId) + "/publish",
    { method: "POST", body: JSON.stringify({ platforms }) }
  );
}

export function schedulePost(
  postId: string,
  data: { platforms: string[]; scheduled_at: string }
) {
  return api<{ success: boolean; post?: any; error?: string; message?: string }>(
    "/api/mhai/social-posts/" + encodeURIComponent(postId) + "/schedule",
    { method: "POST", body: JSON.stringify(data) }
  );
}

// ── Connections ──
export function getConnections() {
  return api<{ success: boolean; connections?: any[]; error?: string }>(
    "/api/mhai/connections"
  );
}

export function connectPlatform(
  platform: string,
  credentials?: { access_token?: string; page_id?: string }
) {
  return api<{ success: boolean; auth_url?: string; connection?: any; error?: string; message?: string }>(
    "/api/mhai/connections/connect",
    { method: "POST", body: JSON.stringify({ platform, ...credentials }) }
  );
}

export function disconnectPlatform(platform: string) {
  return api<{ success: boolean; error?: string; message?: string }>(
    "/api/mhai/connections/disconnect",
    { method: "POST", body: JSON.stringify({ platform }) }
  );
}

// ── Chatbot ──
export function sendChatbotMessage(
  hospitalId: string,
  sessionId: string | null,
  message: string,
  language?: string
) {
  // Public endpoint — no auth needed, uses fetch directly
  return fetch("/api/mhai/chatbot/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hospital_id: hospitalId,
      session_id: sessionId || undefined,
      message,
      language: language || undefined,
    }),
  }).then((r) => r.json()) as Promise<{ success: boolean; reply?: string; session_id?: string; error?: string }>;
}

export function getChatbotSessions() {
  return api<{ success: boolean; sessions?: any[]; error?: string }>(
    "/api/mhai/chatbot/sessions"
  );
}

export function getChatbotSession(sessionId: string) {
  return api<{ success: boolean; session?: any; error?: string }>(
    "/api/mhai/chatbot/sessions/" + encodeURIComponent(sessionId)
  );
}

export function handoffSession(sessionId: string) {
  return api<{ success: boolean; message?: string; error?: string }>(
    "/api/mhai/chatbot/handoff/" + encodeURIComponent(sessionId),
    { method: "POST" }
  );
}

// ── Locale ──
export function getLocale(countryCode: string) {
  return api("/api/locale/" + encodeURIComponent(countryCode));
}

var BACKEND_URL = "https://smartgumastha-backend-production.up.railway.app";

export function detectLocale() {
  return fetch(BACKEND_URL + "/api/mhai/locale/detect")
    .then((r) => r.json()) as Promise<{
      success: boolean;
      detected?: { country_code: string; country_name?: string; city?: string; timezone?: string; source?: string };
      locale?: { currency: string; symbol: string; payment: string; phone_format: string; date_format: string; compliance: string; tld: string; languages: string[]; country_code: string };
    }>;
}

export function getLocaleConfig(countryCode: string) {
  return fetch(BACKEND_URL + "/api/mhai/locale/config/" + encodeURIComponent(countryCode))
    .then((r) => r.json()) as Promise<{
      success: boolean;
      country_code?: string;
      locale?: { currency: string; symbol: string; payment: string; phone_format: string; date_format: string; compliance: string; tld: string; languages: string[]; country_code: string };
    }>;
}

// ════════════════════════════════════════════════════════════
//  TELECALLER CRM
// ════════════════════════════════════════════════════════════

// ── Leads ──
export function getLeads(filters?: { status?: string; source?: string; assigned_to?: string; dnd_status?: string; search?: string; limit?: number; offset?: number }) {
  var params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(function ([k, v]) { if (v != null) params.set(k, String(v)); });
  }
  var qs = params.toString();
  return aiApi<{ success: boolean; data?: any[]; total?: number; error?: string }>(
    "/api/mhai/telecaller/leads" + (qs ? "?" + qs : "")
  );
}

export function getLead(id: string) {
  return aiApi<{ success: boolean; data?: { lead: any; calls: any[] }; error?: string }>(
    "/api/mhai/telecaller/leads/" + encodeURIComponent(id)
  );
}

export function createLead(data: { name?: string; phone: string; email?: string; source: string; source_tag?: string; inquiry?: string; specialty?: string; assigned_to?: string; consent_type?: string; language_pref?: string; notes?: string; metadata?: Record<string, any> }) {
  return aiApi<{ success: boolean; data?: { id: string; dnd_status: string }; error?: string }>(
    "/api/mhai/telecaller/leads",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function updateLead(id: string, data: Record<string, any>) {
  return aiApi<{ success: boolean; data?: { id: string }; error?: string }>(
    "/api/mhai/telecaller/leads/" + encodeURIComponent(id),
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

export function deleteLead(id: string) {
  return aiApi<{ success: boolean; data?: { id: string }; error?: string }>(
    "/api/mhai/telecaller/leads/" + encodeURIComponent(id),
    { method: "DELETE" }
  );
}

export function scoreLead(id: string) {
  return aiApi<{ success: boolean; data?: any; error?: string }>(
    "/api/mhai/telecaller/leads/" + encodeURIComponent(id) + "/score",
    { method: "POST" }
  );
}

export function scoreBatchLeads(lead_ids: string[]) {
  return aiApi<{ success: boolean; data?: any[]; error?: string }>(
    "/api/mhai/telecaller/leads/batch-score",
    { method: "POST", body: JSON.stringify({ lead_ids }) }
  );
}

export function bulkScrubLeads() {
  return aiApi<{ success: boolean; data?: { total: number; updated: number }; error?: string }>(
    "/api/mhai/telecaller/leads/bulk-scrub",
    { method: "POST" }
  );
}

// ── Imports ──
export function importLeads(leads: any[], meta: { source_tag: string; file_name?: string }) {
  return aiApi<{ success: boolean; data?: { import_id: string; status: string; total_rows: number }; error?: string }>(
    "/api/mhai/telecaller/leads/import",
    { method: "POST", body: JSON.stringify({ leads, ...meta }) }
  );
}

export function getImportStatus(id: string) {
  return aiApi<{ success: boolean; data?: any; error?: string }>(
    "/api/mhai/telecaller/leads/import/" + encodeURIComponent(id)
  );
}

// ── Campaigns ──
export function getCampaigns() {
  return aiApi<{ success: boolean; data?: any[]; error?: string }>(
    "/api/mhai/telecaller/campaigns"
  );
}

export function createCampaign(data: { name: string; description?: string; target_segment?: any; script_id?: string; time_window_start?: string; time_window_end?: string; timezone?: string; assigned_to?: string[]; use_ai_voice?: boolean; max_attempts?: number }) {
  return aiApi<{ success: boolean; data?: { id: string }; error?: string }>(
    "/api/mhai/telecaller/campaigns",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function updateCampaign(id: string, data: Record<string, any>) {
  return aiApi<{ success: boolean; data?: { id: string }; error?: string }>(
    "/api/mhai/telecaller/campaigns/" + encodeURIComponent(id),
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

export function startCampaign(id: string) {
  return aiApi<{ success: boolean; data?: { id: string; status: string }; error?: string }>(
    "/api/mhai/telecaller/campaigns/" + encodeURIComponent(id) + "/start",
    { method: "POST" }
  );
}

export function pauseCampaign(id: string) {
  return aiApi<{ success: boolean; data?: { id: string; status: string }; error?: string }>(
    "/api/mhai/telecaller/campaigns/" + encodeURIComponent(id) + "/pause",
    { method: "POST" }
  );
}

export function getCampaignQueue(id: string) {
  return aiApi<{ success: boolean; data?: any; message?: string; error?: string }>(
    "/api/mhai/telecaller/campaigns/" + encodeURIComponent(id) + "/queue"
  );
}

// ── Calls ──
export function logCall(data: { lead_id: string; campaign_id?: string; telecaller_id?: string; call_type?: string; started_at: number; ended_at?: number; duration_seconds?: number; disposition?: string; disposition_notes?: string; ai_disclosed?: boolean; consent_verified?: boolean; follow_up_at?: number }) {
  return aiApi<{ success: boolean; data?: { id: string; compliance_flags: any }; error?: string; message?: string }>(
    "/api/mhai/telecaller/calls/log",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function uploadRecording(callId: string, url: string) {
  return aiApi<{ success: boolean; data?: { id: string }; error?: string }>(
    "/api/mhai/telecaller/calls/" + encodeURIComponent(callId) + "/recording",
    { method: "POST", body: JSON.stringify({ recording_url: url }) }
  );
}

export function saveTranscript(callId: string, transcript: string) {
  return aiApi<{ success: boolean; data?: { id: string }; error?: string }>(
    "/api/mhai/telecaller/calls/" + encodeURIComponent(callId) + "/transcript",
    { method: "POST", body: JSON.stringify({ transcript }) }
  );
}

export function analyzeCall(callId: string) {
  return aiApi<{ success: boolean; data?: any; error?: string }>(
    "/api/mhai/telecaller/calls/" + encodeURIComponent(callId) + "/analyze",
    { method: "POST" }
  );
}

// ── Scripts ──
export function getScripts(filters?: { specialty?: string; language?: string }) {
  var params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(function ([k, v]) { if (v) params.set(k, v); });
  }
  var qs = params.toString();
  return aiApi<{ success: boolean; data?: any[]; error?: string }>(
    "/api/mhai/telecaller/scripts" + (qs ? "?" + qs : "")
  );
}

export function getScript(id: string) {
  return aiApi<{ success: boolean; data?: any; error?: string }>(
    "/api/mhai/telecaller/scripts/" + encodeURIComponent(id)
  );
}

export function createScript(data: { name: string; specialty?: string; language?: string; opening?: string; qualifying_questions?: string[]; value_props?: string[]; objection_handlers?: Record<string, string>; closing?: string; ai_disclosure?: string; is_default?: boolean }) {
  return aiApi<{ success: boolean; data?: { id: string }; error?: string }>(
    "/api/mhai/telecaller/scripts",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function generateScript(data: { specialty: string; language?: string; goal?: string; clinic_name?: string }) {
  return aiApi<{ success: boolean; data?: { id: string; script: any; model: string; latency_ms: number }; error?: string }>(
    "/api/mhai/telecaller/scripts/generate",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function updateScript(id: string, data: Record<string, any>) {
  return aiApi<{ success: boolean; data?: { id: string }; error?: string }>(
    "/api/mhai/telecaller/scripts/" + encodeURIComponent(id),
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

export function deleteScript(id: string) {
  return aiApi<{ success: boolean; data?: { id: string }; error?: string }>(
    "/api/mhai/telecaller/scripts/" + encodeURIComponent(id),
    { method: "DELETE" }
  );
}

// ── Coaching ──
export function getCoachingReports(telecallerId?: string) {
  var qs = telecallerId ? "?telecaller_id=" + encodeURIComponent(telecallerId) : "";
  return aiApi<{ success: boolean; data?: any[]; error?: string }>(
    "/api/mhai/telecaller/coaching" + qs
  );
}

export function generateCoachingReport(data: { telecaller_id: string; week_start: string; week_end: string }) {
  return aiApi<{ success: boolean; data?: any; error?: string }>(
    "/api/mhai/telecaller/coaching/generate",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function generateAllCoachingReports() {
  return aiApi<{ success: boolean; data?: any; error?: string }>(
    "/api/mhai/telecaller/coaching/generate-all",
    { method: "POST" }
  );
}

// ── Consent ──
export function recordConsent(data: { phone: string; consent_type: string; consent_source?: string; consent_text?: string; proof_url?: string }) {
  return aiApi<{ success: boolean; data?: { id: string }; error?: string }>(
    "/api/mhai/telecaller/consent",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function checkConsent(phone: string) {
  return aiApi<{ success: boolean; data?: any[]; error?: string }>(
    "/api/mhai/telecaller/consent/" + encodeURIComponent(phone)
  );
}

export function withdrawConsent(phone: string) {
  return aiApi<{ success: boolean; message?: string; error?: string }>(
    "/api/mhai/telecaller/consent/" + encodeURIComponent(phone),
    { method: "DELETE" }
  );
}

// ── Stats ──
export function getTelecallerStats() {
  return aiApi<{ success: boolean; data?: { total_leads: string; new_leads: string; converted_leads: string; pending_followups: string; dnd_blocked: string; calls_today: string; active_campaigns: string; total_scripts: string }; error?: string }>(
    "/api/mhai/telecaller/stats"
  );
}

// ── v2 locale wrappers (T1.2.4a) ──

var BACKEND_URL_V2 = "https://smartgumastha-backend-production.up.railway.app";

export type V2Locale = {
  country_code: string;
  country_name: string;
  is_supported: boolean;
  is_active: boolean;
  currency: { code: string; symbol: string; decimal_places: number; format_locale: string };
  compliance: {
    frameworks: string[];
    display_badges: string[];
    ruleset_id: string | null;
    medical_advertising_rules_url: string | null;
  };
  payment: {
    primary_gateway: string | null;
    fallback_gateway: string | null;
    methods: string[];
    tax_rate: number;
    tax_label: string | null;
  };
  phone: {
    country_code: string;
    regex: string;
    display_format: string | null;
    digit_count: number | null;
    placeholder: string | null;
  };
  domain: {
    primary_tld: string | null;
    alternate_tlds: string[];
    recommendation_note: string | null;
  };
  ai_content: {
    primary_language: string;
    language_options: string[];
    cultural_tone: string | null;
    terminology_style: Record<string, string>;
    content_safety_rules: string[];
  };
  datetime: {
    date_format: string;
    time_format: string;
    timezone: string | null;
    clock_style: string;
  };
  social_proof: {
    clinic_count: number;
    clinic_count_text: string;
    regulatory_authority_name: string;
    featured_badge_url: string | null;
  };
  cascade: {
    detected_via: string;
    switched_from_country: string | null;
    switched_from_city: string | null;
  };
  patient_identity?: any;
  insurance?: any;
  clinical_coding?: any;
  state_province?: any;
  address_schema?: any;
  postal_code?: any;
  rtl_language?: boolean;
  version?: string;
  served_at?: number;
};

export type V2LocaleResponse = { success: true; locale: V2Locale };
export type V2DetectResponse = {
  success: true;
  detected: { ip: string; country_code: string; country_name: string | null; city: string | null; source: string };
  locale: V2Locale;
};
export type V2CityLookupResponse = {
  success: true;
  matched: boolean;
  input: string;
  normalized: string;
  city: { key: string; display: string; country_code: string; region: string | null; is_capital: boolean } | null;
  locale: V2Locale | null;
  note?: string;
};

/** Fetch the canonical v2 locale contract for a country code. */
export async function getLocaleV2(countryCode: string, signal?: AbortSignal): Promise<V2LocaleResponse> {
  var res = await fetch(BACKEND_URL_V2 + "/api/mhai/locale/v2/" + encodeURIComponent(countryCode), { signal: signal });
  if (!res.ok) throw new Error("getLocaleV2 " + countryCode + " failed: " + res.status);
  return res.json();
}

/** IP-based detection returning full v2 locale. */
export async function detectLocaleV2(signal?: AbortSignal): Promise<V2DetectResponse> {
  var res = await fetch(BACKEND_URL_V2 + "/api/mhai/locale/v2/detect", { signal: signal });
  if (!res.ok) throw new Error("detectLocaleV2 failed: " + res.status);
  return res.json();
}

/** Backend city-name cascade. Returns matched=false when city is unknown. */
export async function cityLookupV2(city: string, signal?: AbortSignal): Promise<V2CityLookupResponse> {
  var res = await fetch(
    BACKEND_URL_V2 + "/api/mhai/locale/v2/city-lookup?city=" + encodeURIComponent(city),
    { signal: signal }
  );
  if (!res.ok) throw new Error("cityLookupV2 " + city + " failed: " + res.status);
  return res.json();
}
