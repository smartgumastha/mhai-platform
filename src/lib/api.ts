// API calls go through Next.js rewrites (/api/* → Railway backend)
// This avoids CORS — browser sees same-origin requests.

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
export function getAppointments(filter?: string) {
  var url = "/api/mhai/appointments";
  if (filter) url += "?filter=" + encodeURIComponent(filter);
  return api<{ success: boolean; appointments?: any[]; error?: string }>(url);
}

export function createAppointment(data: {
  patient_name: string;
  patient_phone: string;
  slot_date: string;
  slot_time: string;
  status?: string;
  source?: string;
  notes?: string;
}) {
  return api<{ success: boolean; appointment?: any; error?: string; message?: string }>(
    "/api/mhai/appointments",
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function updateAppointment(
  appointmentId: string,
  data: { status?: string; notes?: string }
) {
  return api<{ success: boolean; appointment?: any; error?: string; message?: string }>(
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
