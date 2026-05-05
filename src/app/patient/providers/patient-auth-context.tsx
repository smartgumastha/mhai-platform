"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type PatientUser = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  uhid?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  hospital_id?: string;
  hospital_name?: string;
  total_visits?: number;
  last_visit_at?: string;
};

type PatientAuthCtx = {
  patient: PatientUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendOtp: (phone: string) => Promise<{ success: boolean; message?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
};

var PatientAuthContext = createContext<PatientAuthCtx>({
  patient: null,
  isLoading: true,
  isAuthenticated: false,
  sendOtp: async () => ({ success: false }),
  verifyOtp: async () => ({ success: false }),
  logout: () => {},
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

  var loadMe = useCallback(async function () {
    var tok = getPatientToken();
    if (!tok) { setIsLoading(false); return; }
    try {
      var res: any = await patientApi("/api/patient/me");
      if (res.success && res.patient) setPatient(res.patient);
      else clearPatientToken();
    } catch {} finally { setIsLoading(false); }
  }, []);

  useEffect(function () { loadMe(); }, [loadMe]);

  async function sendOtp(phone: string) {
    return patientApi<{ success: boolean; message?: string }>(
      "/api/presence/patient-auth/send-otp",
      { method: "POST", body: JSON.stringify({ phone }) }
    );
  }

  async function verifyOtp(phone: string, otp: string) {
    var res: any = await patientApi<{ success: boolean; token?: string; patient?: PatientUser; message?: string }>(
      "/api/presence/patient-auth/verify-otp",
      { method: "POST", body: JSON.stringify({ phone, otp }) }
    );
    if (res.success && res.token) {
      setPatientToken(res.token);
      if (res.patient) setPatient(res.patient);
      else await loadMe();
    }
    return { success: res.success, message: res.message };
  }

  function logout() {
    clearPatientToken();
    setPatient(null);
  }

  return (
    <PatientAuthContext.Provider value={{ patient, isLoading, isAuthenticated: !!patient, sendOtp, verifyOtp, logout }}>
      {children}
    </PatientAuthContext.Provider>
  );
}

export function usePatientAuth() { return useContext(PatientAuthContext); }
