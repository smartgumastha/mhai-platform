"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/providers/auth-context";
import { useCurrency } from "@/app/hooks/useCurrency";
import { useLocale } from "@/app/providers/locale-context";
import { useNotification } from "@/app/providers/NotificationProvider";
import { getToken } from "@/lib/api";
import RegulatoryIdsGate from "@/app/components/RegulatoryIdsGate";

type LineItem = {
  id: string;
  description: string;
  code: string;
  qty: number;
  rate: number;
  gst_rate: number;
};

type ProfileStatus = {
  success?: boolean;
  onboarding_profile_completed?: boolean;
  country_code?: string;
  required_fields?: string[];
  missing_fields?: string[];
  regulatory_ids?: Record<string, string>;
};

export default function NewBillPage() {
  var router = useRouter();
  var { user } = useAuth();
  var currency = useCurrency();
  var { localeV2 } = useLocale();
  var notify = useNotification();

  var [loading, setLoading] = useState(true);
  var [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  var [profileIncomplete, setProfileIncomplete] = useState(false);
  var [gateOpen, setGateOpen] = useState(false);

  var [patientName, setPatientName] = useState("");
  var [patientPhone, setPatientPhone] = useState("");
  var [doctorName, setDoctorName] = useState("");
  var [supplyType, setSupplyType] = useState<"B2C" | "B2B">("B2C");
  var [buyerGstin, setBuyerGstin] = useState("");
  var [buyerName, setBuyerName] = useState("");
  var [items, setItems] = useState<LineItem[]>([
    { id: "i1", description: "", code: "", qty: 1, rate: 0, gst_rate: 18 },
  ]);
  var [notes, setNotes] = useState("");
  var [dueDate, setDueDate] = useState("");
  var [saving, setSaving] = useState(false);

  useEffect(function () {
    if (!user?.hospital_id) return;
    checkProfileStatus();
  }, [user?.hospital_id]);

  async function checkProfileStatus() {
    setLoading(true);
    try {
      var token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      var res = await fetch("/api/presence/partners/me/profile-status", {
        headers: { Authorization: "Bearer " + token },
      });
      var data = await res.json();
      if (data && data.success) {
        setProfileStatus(data);
        var incomplete =
          !data.onboarding_profile_completed &&
          (data.missing_fields || []).length > 0;
        setProfileIncomplete(incomplete);
        if (incomplete) setGateOpen(true);
      }
    } catch (e) {
      // silent — let the user attempt save
    } finally {
      setLoading(false);
    }
  }

  function addItem() {
    setItems(items.concat([{ id: "i" + Date.now(), description: "", code: "", qty: 1, rate: 0, gst_rate: 18 }]));
  }
  function removeItem(id: string) {
    setItems(items.filter(function (i) { return i.id !== id; }));
  }
  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems(items.map(function (i) { return i.id === id ? Object.assign({}, i, patch) : i; }));
  }

  var subtotal = items.reduce(function (s, i) { return s + i.qty * i.rate; }, 0);
  var totalGst = items.reduce(function (s, i) { return s + (i.qty * i.rate * i.gst_rate) / 100; }, 0);
  var total = subtotal + totalGst;

  async function saveBill() {
    if (profileIncomplete) {
      setGateOpen(true);
      return;
    }
    if (!patientName.trim()) {
      notify.error("Patient name required");
      return;
    }
    if (items.length === 0 || items.every(function (i) { return !i.description.trim(); })) {
      notify.error("At least one line item required");
      return;
    }
    var hospitalId = user?.hospital_id;
    var token = getToken();
    if (!hospitalId || !token) {
      notify.error("Not signed in");
      return;
    }

    setSaving(true);
    try {
      var body = {
        patient_name: patientName.trim(),
        patient_phone: patientPhone.trim() || null,
        doctor_name: doctorName.trim() || null,
        supply_type: supplyType,
        buyer_gstin: supplyType === "B2B" ? buyerGstin.trim() || null : null,
        buyer_name: supplyType === "B2B" ? buyerName.trim() || null : null,
        items: items
          .filter(function (i) { return i.description.trim(); })
          .map(function (i) {
            return {
              description: i.description.trim(),
              code: i.code.trim(),
              qty: i.qty,
              rate: i.rate,
              gst_rate: i.gst_rate,
              amount: i.qty * i.rate * (1 + i.gst_rate / 100),
            };
          }),
        subtotal: subtotal,
        tax_amount: totalGst,
        total_amount: total,
        notes: notes.trim() || null,
        due_at: dueDate ? new Date(dueDate).getTime() : null,
      };
      var res = await fetch("/api/hospitals/" + hospitalId + "/rcm/billing/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(body),
      });
      var data = await res.json();
      if (data && data.success) {
        var bill = data.bill || data.data;
        notify.success("Bill created", bill?.bill_number ? "Bill " + bill.bill_number : undefined);
        if (bill?.id) router.push("/dashboard/bills/" + bill.id);
        else router.push("/dashboard/bills");
      } else {
        notify.error("Could not save bill", (data && data.error) || (data && data.message) || "Try again");
      }
    } catch (e) {
      notify.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-text-muted">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="sticky top-0 z-10 border-b border-line-soft bg-paper/90 px-8 py-6 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-text-muted">
              <Link href="/dashboard/bills" className="hover:text-coral-deep">
                Billing
              </Link>{" "}
              <span className="mx-1">/</span> New bill
            </div>
            <h1 className="font-fraunces text-3xl font-light leading-none tracking-tight text-ink">
              New <em className="italic font-normal text-coral-deep">bill</em>.
            </h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/bills"
              className="rounded-lg border border-line px-4 py-2.5 text-sm text-ink hover:border-coral hover:text-coral-deep"
            >
              Cancel
            </Link>
            <button
              onClick={saveBill}
              disabled={saving}
              className="rounded-lg bg-coral px-5 py-2.5 text-sm font-medium text-white hover:bg-coral-deep disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save & send"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-8 py-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Patient details */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <h3 className="mb-4 font-fraunces text-lg font-medium text-ink">
              Patient <em className="italic text-coral-deep">details</em>
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Patient name *</Label>
                <input
                  type="text"
                  value={patientName}
                  onChange={function (e) { setPatientName(e.target.value); }}
                  className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-coral focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={function (e) { setPatientPhone(e.target.value); }}
                  placeholder={(localeV2 as any)?.phone?.placeholder || "+91 98765 43210"}
                  className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-coral focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <Label>Attending doctor</Label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={function (e) { setDoctorName(e.target.value); }}
                  placeholder="e.g. Dr. Priya Sharma"
                  className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-coral focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <Label>Supply type</Label>
                <div className="flex gap-2">
                  <button
                    onClick={function () { setSupplyType("B2C"); }}
                    className={
                      "flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " +
                      (supplyType === "B2C"
                        ? "bg-ink text-white"
                        : "border border-line bg-white text-text-dim hover:border-coral")
                    }
                  >
                    B2C (patient)
                  </button>
                  <button
                    onClick={function () { setSupplyType("B2B"); }}
                    className={
                      "flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " +
                      (supplyType === "B2B"
                        ? "bg-ink text-white"
                        : "border border-line bg-white text-text-dim hover:border-coral")
                    }
                  >
                    B2B (insurer)
                  </button>
                </div>
              </div>
            </div>

            {supplyType === "B2B" && (
              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-line-soft pt-4 md:grid-cols-2">
                <div>
                  <Label>Buyer name *</Label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={function (e) { setBuyerName(e.target.value); }}
                    className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink"
                  />
                </div>
                <div>
                  <Label>Buyer GSTIN/TRN/VAT *</Label>
                  <input
                    type="text"
                    value={buyerGstin}
                    onChange={function (e) { setBuyerGstin(e.target.value); }}
                    className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 font-mono text-sm text-ink"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-fraunces text-lg font-medium text-ink">
                Line <em className="italic text-coral-deep">items</em>
              </h3>
              <button
                onClick={addItem}
                className="text-sm text-coral-deep hover:underline"
              >
                + Add item
              </button>
            </div>
            <div className="space-y-2">
              {items.map(function (i) {
                return (
                  <div
                    key={i.id}
                    className="grid items-center gap-2"
                    style={{ gridTemplateColumns: "minmax(0,1fr) 110px 70px 100px 80px 110px 30px" }}
                  >
                    <input
                      type="text"
                      value={i.description}
                      onChange={function (e) { updateItem(i.id, { description: e.target.value }); }}
                      placeholder="Service description"
                      className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
                    />
                    <input
                      type="text"
                      value={i.code}
                      onChange={function (e) { updateItem(i.id, { code: e.target.value }); }}
                      placeholder="HSN/CPT"
                      className="rounded-lg border border-line bg-paper px-3 py-2 font-mono text-sm text-ink"
                    />
                    <input
                      type="number"
                      value={i.qty}
                      onChange={function (e) { updateItem(i.id, { qty: Number(e.target.value) || 0 }); }}
                      className="rounded-lg border border-line bg-paper px-3 py-2 text-right font-mono text-sm text-ink"
                    />
                    <input
                      type="number"
                      value={i.rate}
                      onChange={function (e) { updateItem(i.id, { rate: Number(e.target.value) || 0 }); }}
                      placeholder="Rate"
                      className="rounded-lg border border-line bg-paper px-3 py-2 text-right font-mono text-sm text-ink"
                    />
                    <select
                      value={i.gst_rate}
                      onChange={function (e) { updateItem(i.id, { gst_rate: Number(e.target.value) }); }}
                      className="rounded-lg border border-line bg-paper px-2 py-2 font-mono text-sm text-ink"
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                    <div className="px-3 py-2 text-right font-mono text-sm text-ink">
                      {currency.format(i.qty * i.rate * (1 + i.gst_rate / 100))}
                    </div>
                    <button
                      onClick={function () { removeItem(i.id); }}
                      disabled={items.length === 1}
                      className="text-rose-500 hover:text-rose-700 disabled:opacity-30"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes + due */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Notes to patient</Label>
                <textarea
                  value={notes}
                  onChange={function (e) { setNotes(e.target.value); }}
                  rows={3}
                  placeholder="e.g. Next review in 7 days"
                  className="w-full resize-none rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink"
                />
              </div>
              <div>
                <Label>Due date (optional)</Label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={function (e) { setDueDate(e.target.value); }}
                  className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="sticky top-28 rounded-2xl border border-line bg-white p-6">
            <h3 className="mb-4 font-fraunces text-lg font-medium text-ink">
              Bill <em className="italic text-coral-deep">summary</em>
            </h3>
            <div className="space-y-2 text-sm">
              <Row label="Subtotal" value={currency.format(subtotal)} />
              <Row label="Tax" value={currency.format(totalGst)} />
              <div className="mt-3 flex items-baseline justify-between border-t-2 border-ink pt-3">
                <span className="font-fraunces text-base">Total</span>
                <span className="font-fraunces text-2xl font-medium text-ink">
                  {currency.format(total)}
                </span>
              </div>
            </div>
            <div className="mt-5 border-t border-line-soft pt-4 text-xs leading-relaxed text-text-muted">
              After saving, you can print, email PDF, or send WhatsApp payment link from the bill detail page.
            </div>
          </div>
        </div>
      </div>

      <RegulatoryIdsGate
        open={gateOpen}
        onClose={function () {
          setGateOpen(false);
          if (profileIncomplete) router.push("/dashboard/bills");
        }}
        initialStatus={profileStatus as any}
        mode="hard"
        onSaved={function () {
          setGateOpen(false);
          setProfileIncomplete(false);
          checkProfileStatus();
        }}
      />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-coral-deep">
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-dim">{label}</span>
      <span className="font-mono text-ink">{value}</span>
    </div>
  );
}
