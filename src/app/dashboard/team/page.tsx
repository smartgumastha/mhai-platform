"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/providers/auth-context";
import { getStaff, createStaffMember, deleteStaffMember } from "@/lib/api";
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

var emptyForm = { first_name: "", last_name: "", email: "", phone_number: "", role_master_id: 3 };

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

  return (
    <div className="px-9 py-8">
      <div className="mb-1 font-fraunces text-2xl font-light text-ink">
        Team <em className="italic text-coral-deep">management</em>
      </div>
      <p className="mb-7 text-sm text-text-dim">Staff members who have access to this hospital&apos;s dashboard.</p>

      <div className="rounded-2xl border border-line bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line-soft px-6 py-5">
          <div className="font-fraunces text-lg text-ink">
            Staff <em className="italic text-coral-deep">members</em>
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
                  {ROLES.map(function (r) {
                    return <option key={r.id} value={r.id}>{r.name}</option>;
                  })}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleAdd}
                disabled={saving}
                className="rounded-lg bg-coral px-4 py-2.5 text-sm font-medium text-white hover:bg-coral-deep disabled:opacity-50"
              >
                {saving ? "Adding…" : "Add & send login"}
              </button>
              <button
                onClick={function () { setShowAdd(false); setForm({ ...emptyForm }); }}
                className="rounded-lg border border-line px-4 py-2.5 text-sm text-text-dim hover:bg-paper-soft"
              >
                Cancel
              </button>
            </div>
            <p className="mt-2 text-xs text-text-dim">A temporary password will be generated and sent to the staff member&apos;s email and WhatsApp.</p>
          </div>
        )}

        {/* Staff list */}
        {loading ? (
          <div className="divide-y divide-line-soft">
            {[1, 2, 3].map(function (i) {
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
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-text-dim">
            <div className="mb-2 text-3xl">👥</div>
            <div className="text-sm font-medium">No staff members yet</div>
            <div className="mt-1 text-xs">Click &quot;Add staff&quot; to invite your first team member.</div>
          </div>
        ) : (
          <div className="divide-y divide-line-soft">
            {staff.map(function (member) {
              var initials = (member.first_name?.[0] || "") + (member.last_name?.[0] || "");
              var roleColor = ROLE_COLORS[member.role_master_id] || "bg-gray-100 text-gray-600";
              return (
                <div key={member.user_id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-coral/10 text-sm font-bold text-coral-deep">
                    {initials.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {member.first_name} {member.last_name}
                      </span>
                      <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + roleColor}>
                        {member.role_name}
                      </span>
                      {!member.is_active && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">Inactive</span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-text-dim">
                      {member.email}
                      {member.phone_number && " · " + member.phone_number}
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
    </div>
  );
}
