"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers/auth-context";
import { getStaff, createStaffMember, deleteStaffMember, getToken } from "@/lib/api";
import { useNotification } from "@/app/providers/NotificationProvider";

type StaffMember = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  is_active: boolean;
  role_name: string;
  role_master_id: number;
};

type DoctorProfile = {
  specialty?: string;
  qualification?: string;
  reg_number?: string;
  signature_url?: string | null;
};

var ROLES = [
  { id: 3, name: "Doctor" },
  { id: 4, name: "Receptionist" },
  { id: 5, name: "Nurse" },
  { id: 6, name: "Pharmacist" },
  { id: 7, name: "Lab Technician" },
];

var ROLE_COLORS: Record<number, string> = {
  3: "bg-blue-100 text-blue-700",
  4: "bg-teal-100 text-teal-700",
  5: "bg-emerald-100 text-emerald-700",
  6: "bg-amber-100 text-amber-700",
  7: "bg-purple-100 text-purple-700",
};

var SPECIALTIES = [
  "General Medicine", "Physiotherapy", "Orthopedics", "Dentistry", "Dermatology",
  "Pediatrics", "Cardiology", "Ophthalmology", "Gynecology & Obstetrics", "Neurology",
  "Psychiatry", "ENT (Otolaryngology)", "Urology", "Nephrology", "Gastroenterology",
  "Endocrinology", "Pulmonology", "Oncology", "Radiology", "Pathology",
  "Anesthesiology", "Emergency Medicine", "Family Medicine", "Other",
];

var emptyForm = { first_name: "", last_name: "", email: "", phone_number: "", role_master_id: 3 };

function lsKey(hospitalId: string) { return "mhai_doctor_profiles_" + hospitalId; }

function loadProfilesFromStorage(hospitalId: string): Record<string, DoctorProfile> {
  try { return JSON.parse(localStorage.getItem(lsKey(hospitalId)) || "{}"); } catch { return {}; }
}

function saveProfilesToStorage(hospitalId: string, profiles: Record<string, DoctorProfile>) {
  try { localStorage.setItem(lsKey(hospitalId), JSON.stringify(profiles)); } catch {}
}

export default function TeamPage() {
  var { user } = useAuth();
  var notify = useNotification();
  var hospitalId = user?.hospital_id || "";

  var [staff, setStaff] = useState<StaffMember[]>([]);
  var [loading, setLoading] = useState(true);
  var [showAdd, setShowAdd] = useState(false);
  var [form, setForm] = useState({ ...emptyForm });
  var [saving, setSaving] = useState(false);
  var [deletingId, setDeletingId] = useState<string | null>(null);

  // Doctor profile state
  var [doctorProfiles, setDoctorProfiles] = useState<Record<string, DoctorProfile>>({});
  var [profilesLoading, setProfilesLoading] = useState(true);
  var [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  var [editForm, setEditForm] = useState<DoctorProfile>({});
  var [savingProfile, setSavingProfile] = useState(false);
  var [uploadingSignature, setUploadingSignature] = useState(false);

  var fetchStaff = useCallback(function () {
    if (!hospitalId) return;
    setLoading(true);
    getStaff(hospitalId)
      .then(function (res) {
        if (res.success && res.data) setStaff(res.data as StaffMember[]);
        else setStaff([]);
      })
      .catch(function () { setStaff([]); })
      .finally(function () { setLoading(false); });
  }, [hospitalId]);

  useEffect(function () { fetchStaff(); }, [fetchStaff]);

  // Load doctor profiles: API first (server-persistent), merge over localStorage fallback
  useEffect(function () {
    if (!hospitalId) { setProfilesLoading(false); return; }
    // Load localStorage immediately so UI is never blank
    var local = loadProfilesFromStorage(hospitalId);
    if (Object.keys(local).length) setDoctorProfiles(local);
    var tok = getToken();
    if (!tok) { setProfilesLoading(false); return; }
    fetch("/api/presence/partners/" + hospitalId + "/billing-preferences", {
      headers: { Authorization: "Bearer " + tok },
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d?.success && d.clinic_preferences?.doctor_profiles) {
          // API wins — merge over localStorage so server is source of truth
          var merged = Object.assign({}, local, d.clinic_preferences.doctor_profiles);
          setDoctorProfiles(merged);
          saveProfilesToStorage(hospitalId, merged);
        }
      })
      .catch(function () {})
      .finally(function () { setProfilesLoading(false); });
  }, [hospitalId]);

  async function handleAdd() {
    if (!form.first_name.trim() || !form.email.trim()) {
      notify.warning("Missing fields", "First name and email are required.");
      return;
    }
    if (!hospitalId) { notify.error("Error", "No hospital ID found."); return; }
    setSaving(true);
    try {
      var res = await createStaffMember(hospitalId, {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim() || undefined,
        role_master_id: form.role_master_id,
      });
      if (res.success) {
        notify.success("Staff added", res.message || form.first_name + " has been added and notified by email.");
        setShowAdd(false);
        setForm({ ...emptyForm });
        fetchStaff();
      } else {
        notify.error("Failed", res.message || res.error || "Could not add staff member.");
      }
    } catch {
      notify.error("Error", "Network error adding staff member.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(member: StaffMember) {
    if (!confirm("Remove " + member.first_name + " " + member.last_name + " from this hospital?")) return;
    setDeletingId(member.user_id);
    try {
      var res = await deleteStaffMember(hospitalId, member.user_id);
      if (res.success) {
        notify.success("Removed", member.first_name + " has been removed.");
        setStaff(function (prev) { return prev.filter(function (s) { return s.user_id !== member.user_id; }); });
      } else {
        notify.error("Failed", res.message || res.error || "Could not remove staff member.");
      }
    } catch {
      notify.error("Error", "Network error removing staff member.");
    } finally {
      setDeletingId(null);
    }
  }

  function startEditDoctor(member: StaffMember) {
    var profile = doctorProfiles[member.user_id] || {};
    setEditForm({ ...profile });
    setEditingDoctorId(member.user_id);
  }

  async function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    var fileRaw = e.target.files && e.target.files[0];
    if (!fileRaw) return;
    var file: File = fileRaw;
    if (file.size > 500 * 1024) { notify.error("File too large", "Max 500KB allowed."); return; }
    setUploadingSignature(true);
    try {
      var tok = getToken();
      if (!tok) throw new Error("not signed in");
      var dataUrl = await new Promise<string>(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () { resolve(reader.result as string); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      var resp = await fetch("/api/presence/uploads/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok },
        body: JSON.stringify({ asset_type: "signature", data_url: dataUrl, filename: file.name }),
      });
      var data = await resp.json();
      if (data?.success) {
        setEditForm(function (f) { return { ...f, signature_url: data.url }; });
        notify.success("Uploaded", "Signature uploaded. Click Save profile to apply.");
      } else {
        notify.error("Upload failed", data?.error || "Unknown error");
      }
    } catch (err: any) {
      notify.error("Upload failed", err?.message || "Unknown error");
    } finally {
      setUploadingSignature(false);
    }
  }

  async function handleSaveProfile() {
    if (!editingDoctorId) return;
    setSavingProfile(true);
    try {
      var updated = { ...doctorProfiles, [String(editingDoctorId)]: { ...editForm } };
      // Always save to localStorage first — works offline, survives API failures
      saveProfilesToStorage(hospitalId, updated);
      setDoctorProfiles(updated);
      setEditingDoctorId(null);
      notify.success("Profile saved", "Doctor profile updated.");
      // Best-effort sync to server (billing-preferences JSONB)
      var tok = getToken();
      if (tok && hospitalId) {
        fetch("/api/presence/partners/" + hospitalId + "/billing-preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok },
          body: JSON.stringify({ doctor_profiles: updated }),
        }).catch(function () {});
      }
    } catch (err: any) {
      notify.error("Save failed", err?.message || "Unknown error");
    } finally {
      setSavingProfile(false);
    }
  }

  var doctors = staff.filter(function (s) { return Number(s.role_master_id) === 3 || (s.role_name || "").toLowerCase() === "doctor"; });
  var otherStaff = staff.filter(function (s) { return Number(s.role_master_id) !== 3 && (s.role_name || "").toLowerCase() !== "doctor"; });

  return (
    <div className="px-9 py-8">
      {/* Header */}
      <nav className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
        <Link href="/dashboard" className="hover:text-coral">Dashboard</Link>
        <span>/</span>
        <span className="text-ink">Team & Staff</span>
      </nav>
      <div className="mb-1 font-fraunces text-2xl font-light text-ink">
        Team <em className="italic text-coral-deep">& Staff</em>
      </div>
      <p className="mb-7 text-sm text-text-dim">
        Manage clinical and admin staff. Doctors can have individual profiles — specialty, qualification, registration number, and personal signature used on prescriptions.
      </p>

      {/* ── Doctors section ── */}
      <div className="mb-4 rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line-soft px-6 py-5">
          <div>
            <div className="font-fraunces text-lg text-ink">
              Doctors <em className="italic text-coral-deep">& profiles</em>
            </div>
            <div className="mt-0.5 text-xs text-text-muted">Each doctor can have a specialty, qualification, and personal signature printed on their prescriptions.</div>
          </div>
          <button
            onClick={function () { setShowAdd(true); }}
            className="rounded-lg bg-coral px-4 py-2.5 text-sm font-medium text-white hover:bg-coral-deep"
          >
            + Add staff
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="border-b border-line-soft bg-paper-soft px-6 py-5">
            <div className="mb-4 text-sm font-semibold text-ink">New staff member</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">First name *</label>
                <input
                  value={form.first_name}
                  onChange={function (e) { setForm(function (p) { return { ...p, first_name: e.target.value }; }); }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                  placeholder="e.g. Priya"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Last name</label>
                <input
                  value={form.last_name}
                  onChange={function (e) { setForm(function (p) { return { ...p, last_name: e.target.value }; }); }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                  placeholder="e.g. Sharma"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={function (e) { setForm(function (p) { return { ...p, email: e.target.value }; }); }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                  placeholder="priya@clinic.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Phone</label>
                <input
                  value={form.phone_number}
                  onChange={function (e) { setForm(function (p) { return { ...p, phone_number: e.target.value }; }); }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Role *</label>
                <select
                  value={form.role_master_id}
                  onChange={function (e) { setForm(function (p) { return { ...p, role_master_id: Number(e.target.value) }; }); }}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-coral focus:outline-none"
                >
                  {ROLES.map(function (r) { return <option key={r.id} value={r.id}>{r.name}</option>; })}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={handleAdd} disabled={saving} className="rounded-lg bg-coral px-4 py-2.5 text-sm font-medium text-white hover:bg-coral-deep disabled:opacity-50">
                {saving ? "Adding…" : "Add & send login"}
              </button>
              <button onClick={function () { setShowAdd(false); setForm({ ...emptyForm }); }} className="rounded-lg border border-line px-4 py-2.5 text-sm text-text-dim hover:bg-paper-soft">
                Cancel
              </button>
            </div>
            <p className="mt-2 text-xs text-text-dim">A temporary password will be generated and sent to the staff member&apos;s email and WhatsApp.</p>
          </div>
        )}

        {/* Doctor list */}
        {loading || profilesLoading ? (
          <div className="divide-y divide-line-soft">
            {[1, 2].map(function (i) {
              return (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-line" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-line" />
                    <div className="h-3 w-48 animate-pulse rounded bg-line" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-text-dim">
            <div className="mb-2 text-3xl">🩺</div>
            <div className="text-sm font-medium">No doctors added yet</div>
            <div className="mt-1 text-xs">Click &quot;Add staff&quot; and select Doctor role to add your first doctor.</div>
          </div>
        ) : (
          <div className="divide-y divide-line-soft">
            {doctors.map(function (member) {
              var initials = (member.first_name?.[0] || "") + (member.last_name?.[0] || "");
              var profile = doctorProfiles[member.user_id] || {};
              var isEditing = editingDoctorId === member.user_id;
              var hasProfile = !!(profile.specialty || profile.qualification);

              return (
                <div key={member.user_id}>
                  <div className="flex items-center gap-4 px-6 py-4">
                    <div className="relative flex-shrink-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                        {initials.toUpperCase()}
                      </div>
                      {profile.signature_url && (
                        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white" title="Signature uploaded">✓</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink">
                          Dr. {member.first_name} {member.last_name}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Doctor</span>
                        {!member.is_active && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">Inactive</span>}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-text-dim">
                        <span>{member.email}</span>
                        {member.phone_number && <span>· {member.phone_number}</span>}
                        {profile.specialty && <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700">{profile.specialty}</span>}
                        {profile.qualification && <span className="text-text-muted">{profile.qualification}</span>}
                        {profile.reg_number && <span className="text-text-muted">Reg: {profile.reg_number}</span>}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <button
                        onClick={function () { isEditing ? setEditingDoctorId(null) : startEditDoctor(member); }}
                        className={"rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors " + (hasProfile ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100")}
                      >
                        {isEditing ? "Close" : (hasProfile ? "Edit profile" : "Set up profile")}
                      </button>
                      <button
                        onClick={function () { handleDelete(member); }}
                        disabled={deletingId === member.user_id}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                      >
                        {deletingId === member.user_id ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </div>

                  {/* Inline doctor profile editor */}
                  {isEditing && (
                    <div className="border-t border-blue-100 bg-blue-50/30 px-6 pb-6 pt-4">
                      <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-blue-700">
                        Dr. {member.first_name} {member.last_name} — Doctor profile
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-text-muted">Specialty</label>
                          <select
                            value={editForm.specialty || ""}
                            onChange={function (e) { setEditForm(function (f) { return { ...f, specialty: e.target.value }; }); }}
                            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-coral focus:outline-none"
                          >
                            <option value="">Select specialty…</option>
                            {SPECIALTIES.map(function (s) { return <option key={s} value={s}>{s}</option>; })}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-text-muted">Qualification / degrees</label>
                          <input
                            value={editForm.qualification || ""}
                            onChange={function (e) { setEditForm(function (f) { return { ...f, qualification: e.target.value }; }); }}
                            placeholder="e.g. MBBS, MD (Gen. Medicine)"
                            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-coral focus:outline-none"
                          />
                          <div className="mt-0.5 text-[11px] text-text-muted">Printed below doctor name on Rx</div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-text-muted">Registration number</label>
                          <input
                            value={editForm.reg_number || ""}
                            onChange={function (e) { setEditForm(function (f) { return { ...f, reg_number: e.target.value }; }); }}
                            placeholder="e.g. MCI/12345 or AP-12345"
                            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-coral focus:outline-none"
                          />
                          <div className="mt-0.5 text-[11px] text-text-muted">MCI / state council / NMC / GMC number</div>
                        </div>
                      </div>

                      {/* Signature upload */}
                      <div className="mt-4">
                        <label className="mb-1.5 block text-xs font-medium text-text-muted">
                          Doctor signature
                          <span className="ml-1.5 font-normal text-text-dim">— PNG or JPG, max 500KB, white or transparent background</span>
                        </label>
                        {editForm.signature_url ? (
                          <div className="flex items-center gap-4 rounded-xl border border-blue-200 bg-white px-4 py-3">
                            <img src={editForm.signature_url} alt="signature" className="h-12 max-w-[180px] object-contain" />
                            <div className="flex items-center gap-3 text-xs">
                              <label className="cursor-pointer font-medium text-coral-deep hover:underline">
                                Replace
                                <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} disabled={uploadingSignature} />
                              </label>
                              <button
                                onClick={function () { setEditForm(function (f) { return { ...f, signature_url: null }; }); }}
                                className="text-rose-500 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="ml-auto text-[11px] text-emerald-600">✓ Signature set — overrides clinic default on this doctor&apos;s Rx</div>
                          </div>
                        ) : (
                          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-line bg-white px-4 py-3 hover:border-coral hover:bg-coral/5">
                            <div className="text-xl text-coral">↑</div>
                            <div>
                              <div className="text-sm font-medium text-ink">
                                {uploadingSignature ? "Uploading…" : "Upload signature"}
                              </div>
                              <div className="text-xs text-text-muted">Overrides the clinic-wide default on this doctor&apos;s prescriptions</div>
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} disabled={uploadingSignature} />
                          </label>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={handleSaveProfile}
                          disabled={savingProfile}
                          className="rounded-lg bg-coral px-5 py-2 text-sm font-medium text-white hover:bg-coral-deep disabled:opacity-50"
                        >
                          {savingProfile ? "Saving…" : "Save profile"}
                        </button>
                        <button
                          onClick={function () { setEditingDoctorId(null); }}
                          className="rounded-lg border border-line px-4 py-2 text-sm text-text-dim hover:bg-paper-soft"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Other staff section ── */}
      {(otherStaff.length > 0 || !loading) && (
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line-soft px-6 py-4">
            <div className="font-fraunces text-base text-ink">
              Clinical & admin <em className="italic text-coral-deep">staff</em>
            </div>
          </div>
          {loading ? (
            <div className="px-6 py-4 text-sm text-text-muted">Loading…</div>
          ) : otherStaff.length === 0 ? (
            <div className="px-6 py-6 text-center text-sm text-text-dim">
              No non-doctor staff added yet. Use &quot;Add staff&quot; above.
            </div>
          ) : (
            <div className="divide-y divide-line-soft">
              {otherStaff.map(function (member) {
                var initials = (member.first_name?.[0] || "") + (member.last_name?.[0] || "");
                var roleColor = ROLE_COLORS[Number(member.role_master_id)] || "bg-gray-100 text-gray-600";
                return (
                  <div key={member.user_id} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-coral/10 text-sm font-bold text-coral-deep">
                      {initials.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{member.first_name} {member.last_name}</span>
                        <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + roleColor}>{member.role_name}</span>
                        {!member.is_active && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">Inactive</span>}
                      </div>
                      <div className="mt-0.5 text-xs text-text-dim">
                        {member.email}{member.phone_number && " · " + member.phone_number}
                      </div>
                    </div>
                    <button
                      onClick={function () { handleDelete(member); }}
                      disabled={deletingId === member.user_id}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                    >
                      {deletingId === member.user_id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Info card */}
      <div className="mt-4 rounded-xl border border-line bg-white px-5 py-4">
        <div className="flex items-start gap-4">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <div className="text-xs font-semibold text-ink">Clinic branding</div>
              <div className="mt-0.5 text-xs text-text-muted">Logo, letterhead, and clinic-wide default signature (used when a doctor has no personal signature)</div>
              <Link href="/dashboard/settings/billing-preferences" className="mt-1 inline-block text-xs font-medium text-coral-deep hover:underline">Clinic & Billing Settings →</Link>
            </div>
            <div>
              <div className="text-xs font-semibold text-ink">Prescription print settings</div>
              <div className="mt-0.5 text-xs text-text-muted">Paper size, sections to print on Rx, custom footer/disclaimer</div>
              <Link href="/dashboard/hms/settings" className="mt-1 inline-block text-xs font-medium text-coral-deep hover:underline">HMS Settings →</Link>
            </div>
            <div>
              <div className="text-xs font-semibold text-ink">AI marketing identity</div>
              <div className="mt-0.5 text-xs text-text-muted">Clinic tone of voice, specialties for AI content, social media, compliance badges</div>
              <Link href="/dashboard/brand" className="mt-1 inline-block text-xs font-medium text-coral-deep hover:underline">Brand DNA →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
