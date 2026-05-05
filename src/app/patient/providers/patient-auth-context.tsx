"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type PatientUser = {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  uhid?: string;
  full_name?: string;
  date_of_birth?: string;
  dob?: string;
  gender?: string;
  blood_group?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  hospital_id?: string;
  hospital_name?: string;
  total_visits?: number;
  last_visit_at?: string;
  _source?: "clinic" | "healthbank";
};

type PatientAuthCtx = {
  patient: PatientUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendOtp: (phone: string) => Promise<{ success: boolean; message?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; message?: string; isNewUser?: boolean }>;
  register: (data: Record<string, string>) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

var PatientAuthContext = createContext<PatientAuthCtx>({
  patient: null,
  isLoading: true,
  isAuthenticated: false,
  sendOtp: async () => ({ success: false }),
  verifyOtp: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  refreshProfile: async () => {},
});

export function getPatientToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mhai_patient_token");
}

function setPatientToken(t: string) {
  localStorage.setItem("mhai_patient_token", t);
}

function clearPatientToken() {
  localStorage.removeItem("mhai_patient_token");
}

export async function patientApi<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    var headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    var tok = getPatientToken();
    if (tok) headers["Authorization"] = "Bearer " + tok;
    var res = await fetch(path, { ...options, headers });
    try { return await res.json() as T; } catch { return { success: false, error: "Invalid response" } as T; }
  } catch { return { success: false, message: "Network error" } as T; }
}

export function PatientAuthProvider({ children }: { children: React.ReactNode }) {
  var [patient, setPatient] = useState<PatientUser | null>(null);
  var [isLoading, setIsLoading] = useState(true);

  var refreshProfile = useCallback(async function () {
    var tok = getPatientToken();
    if (!tok) { setIsLoading(false); return; }
    try {
      var res: any = await patientApi("/api/patient/me");
      if (res.success && res.patient) setPatient(res.patient);
      else if (res.isNewUser) setIsLoading(false); // new user — let setup page handle it
      else clearPatientToken();
    } catch {} finally { setIsLoading(false); }
  }, []);

  useEffect(function () { refreshProfile(); }, [refreshProfile]);

  async function sendOtp(phone: string) {
    return patientApi<{ success: boolean; message?: string }>(
      "/api/presence/patient-auth/send-otp",
      { method: "POST", body: JSON.stringify({ phone }) }
    );
  }

  async function verifyOtp(phone: string, otp: string) {
    var res: any = await patientApi<{ success: boolean; token?: string; patient?: PatientUser; message?: string; isNewUser?: boolean }>(
      "/api/presence/patient-auth/verify-otp",
      { method: "POST", body: JSON.stringify({ phone, otp }) }
    );
    if (res.success && res.token) {
      setPatientToken(res.token);
      if (res.patient) setPatient(res.patient);
      // isNewUser=true: caller handles redirect to /patient/setup
    }
    return { success: res.success, message: res.message, isNewUser: res.isNewUser };
  }

  async function register(data: Record<string, string>) {
    var res: any = await patientApi<{ success: boolean; patient?: PatientUser; message?: string }>(
      "/api/presence/patient-auth/register",
      { method: "POST", body: JSON.stringify(data) }
    );
    if (res.success && res.patient) setPatient(res.patient);
    return { success: res.success, message: res.message };
  }

  function logout() {
    clearPatientToken();
    setPatient(null);
  }

  return (
    <PatientAuthContext.Provider value={{
      patient, isLoading, isAuthenticated: !!patient,
      sendOtp, verifyOtp, register, logout, refreshProfile
    }}>
      {children}
    </PatientAuthContext.Provider>
  );
}

export function usePatientAuth() { return useContext(PatientAuthContext); }
