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
      clearToken();
      window.location.href = "/login";
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

// ── AI ──
export function generateSocialPost(data: {
  specialty: string;
  topic?: string;
  occasion?: string;
  platform?: string;
  tone?: string;
  language?: string;
}) {
  return api("/api/ai/social-posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function generateReviewReply(data: {
  review_text: string;
  rating?: number;
  clinic_name?: string;
  doctor_name?: string;
}) {
  return api("/api/ai/review-reply", {
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

// ── Locale ──
export function getLocale(countryCode: string) {
  return api("/api/locale/" + encodeURIComponent(countryCode));
}
