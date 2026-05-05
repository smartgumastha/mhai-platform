"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePatientAuth } from "../providers/patient-auth-context";
import { getPatientToken } from "../providers/patient-auth-context";

var BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
var GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

export default function PatientSetupPage() {
  var { register } = usePatientAuth();
  var router = useRouter();

  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");

  var [form, setForm] = useState({
    full_name: "",
    email: "",
    date_of_birth: "",
    gender: "",
    blood_group: "",
    allergies: "",
    chronic_conditions: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  function set(key: string, val: string) {
    setForm(function (prev) { return { ...prev, [key]: val }; });
  }

  // If someone lands here without a token, send to login
  if (typeof window !== "undefined" && !getPatientToken()) {
    router.replace("/patient/login");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("Full name is required."); return; }
    setLoading(true);
    setError("");
    try {
      var res = await register(form);
      if (res.success) router.push("/patient/dashboard");
      else setError(res.message || "Could not save your profile. Please try again.");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0a2d3d]">
            <span className="font-bold italic text-white text-lg">HB</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your Health Bank</h1>
          <p className="mt-1.5 text-sm text-gray-400">
            Your personal health profile — doctors, labs, and services connect to this
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">

          {/* Section: Basic Info */}
          <div className="mb-5">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#1ba3d6]">About You</div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Full Name *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={function (e) { set("full_name", e.target.value); }}
                  placeholder="As on your ID"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none focus:ring-2 focus:ring-[#1ba3d6]/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Date of Birth</label>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={function (e) { set("date_of_birth", e.target.value); }}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Gender</label>
                  <select
                    value={form.gender}
                    onChange={function (e) { set("gender", e.target.value); }}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none"
                  >
                    <option value="">Select</option>
                    {GENDERS.map(function (g) { return <option key={g} value={g}>{g}</option>; })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Blood Group</label>
                  <select
                    value={form.blood_group}
                    onChange={function (e) { set("blood_group", e.target.value); }}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none"
                  >
                    <option value="">Unknown</option>
                    {BLOOD_GROUPS.map(function (b) { return <option key={b} value={b}>{b}</option>; })}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={function (e) { set("email", e.target.value); }}
                    placeholder="optional"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Health Profile */}
          <div className="mb-5">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#1ba3d6]">Health Profile (optional)</div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Known Allergies</label>
                <input
                  type="text"
                  value={form.allergies}
                  onChange={function (e) { set("allergies", e.target.value); }}
                  placeholder="e.g. Penicillin, Dust mites"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Chronic Conditions</label>
                <input
                  type="text"
                  value={form.chronic_conditions}
                  onChange={function (e) { set("chronic_conditions", e.target.value); }}
                  placeholder="e.g. Diabetes, Hypertension"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Emergency Contact */}
          <div className="mb-6">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#1ba3d6]">Emergency Contact (optional)</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Contact Name</label>
                <input
                  type="text"
                  value={form.emergency_contact_name}
                  onChange={function (e) { set("emergency_contact_name", e.target.value); }}
                  placeholder="Full name"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Contact Phone</label>
                <input
                  type="tel"
                  value={form.emergency_contact_phone}
                  onChange={function (e) { set("emergency_contact_phone", e.target.value); }}
                  placeholder="Mobile number"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-[#1ba3d6] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !form.full_name.trim()}
            className="w-full rounded-xl bg-[#1ba3d6] py-3 text-sm font-bold text-white transition-colors hover:bg-[#0e7ba8] disabled:opacity-50"
          >
            {loading ? "Creating your Health Bank…" : "Create Health Bank →"}
          </button>

          <p className="mt-4 text-center text-[11px] text-gray-300">
            You can update any of this later from your profile settings
          </p>
        </form>

        {/* What you get */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: "📂", label: "Health Folder", desc: "Store all your records" },
            { icon: "📅", label: "Appointments", desc: "Book with any provider" },
            { icon: "✦", label: "AI Insights", desc: "Personalised health AI" },
          ].map(function (f) {
            return (
              <div key={f.label} className="rounded-xl bg-white p-3 text-center ring-1 ring-gray-100">
                <div className="mb-1 text-xl">{f.icon}</div>
                <div className="text-[11px] font-semibold text-gray-700">{f.label}</div>
                <div className="text-[10px] text-gray-400">{f.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
