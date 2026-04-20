"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  login as apiLogin,
  signup as apiSignup,
  getMe,
  getToken,
  setToken,
  clearToken,
} from "@/lib/api";

type Partner = {
  id: string;
  email: string;
  business_name: string;
  hospital_id?: string;
  slug?: string;
  owner_name?: string;
  phone?: string;
  // Day 5 — subscription-aware fields (legacy-schema names, populated by
  // GET /api/presence/partner-auth/me from presence_partners). Audit 2026-04-20
  // confirmed all three already return from /me via the passthrough;
  // typing them here just surfaces them to consumers.
  subscription_status?: "trial" | "trialing" | "active" | "expired" | "cancelled" | string | null;
  plan_tier?: string | null;
  trial_ends_at?: number | null; // epoch ms
  is_super_admin?: boolean;
  [key: string]: any;
};

type AuthCtx = {
  user: Partner | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginUser: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signupUser: (
    email: string,
    business_name: string,
    phone: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
};

var AuthContext = createContext<AuthCtx>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  loginUser: async () => ({ success: false }),
  signupUser: async () => ({ success: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  var [user, setUser] = useState<Partner | null>(null);
  var [token, setTokenState] = useState<string | null>(null);
  var [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    var t = getToken();
    if (!t) {
      setIsLoading(false);
      return;
    }
    setTokenState(t);
    getMe()
      .then((res) => {
        if (res.success && res.partner) {
          setUser(res.partner);
        } else {
          clearToken();
          setTokenState(null);
        }
      })
      .catch(() => {
        clearToken();
        setTokenState(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  var loginUser = useCallback(
    async (email: string, password: string) => {
      var res = await apiLogin({ email, password });
      if (res.success && res.token) {
        setToken(res.token);
        setTokenState(res.token);
        setUser(res.partner || null);
        return { success: true };
      }
      return { success: false, error: res.message || "Login failed" };
    },
    []
  );

  var signupUser = useCallback(
    async (
      email: string,
      business_name: string,
      phone: string,
      password: string
    ) => {
      var res = await apiSignup({ email, business_name, phone, password });
      if (res.success && res.token) {
        setToken(res.token);
        setTokenState(res.token);
        setUser(res.partner || null);
        return { success: true };
      }
      return {
        success: false,
        error: res.message || res.error || "Signup failed",
      };
    },
    []
  );

  var logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        loginUser,
        signupUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
