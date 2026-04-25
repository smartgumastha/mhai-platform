"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/providers/auth-context";
import { getToken } from "@/lib/api";
import PrintFormatModal from "@/app/components/PrintFormatModal";
import RegulatoryIdsGate from "@/app/components/RegulatoryIdsGate";
import { logPrintAudit, formatCurrency, type Bill, type PrintPrefs, type CountryCode, type PaperSize } from "@/app/components/print/lib";

type ProfileStatus = {
  success?: boolean;
  onboarding_profile_completed?: boolean;
  country_code?: string;
  required_fields?: string[];
  missing_fields?: string[];
  regulatory_ids?: Record<string, string>;
};

export default function BillDetailPage() {
  var params = useParams();
  var router = useRouter();
  var billId = String(params?.id || "");
  var { user } = useAuth();

  var [bill, setBill] = useState<Bill | null>(null);
  var [prefs, setPrefs] = useState<PrintPrefs | null>(null);
  var [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  var [loading, setLoading] = useState(true);
  var [printModalOpen, setPrintModalOpen] = useState(false);
  var [gateOpen, setGateOpen] = useState(false);

  useEffect(function () {
    if (!billId) return;
    async function load() {
      try {
        var token = getToken();
        if (!token) {
          setLoading(false);
          return;
        }
        var hospitalId = user?.hospital_id;

        var billPromise = fetch("/api/bills/" + billId, {
          headers: { Authorization: "Bearer " + token },
        });
        var prefsPromise = hospitalId
          ? fetch("/api/presence/partners/" + hospitalId + "/billing-preferences", {
              headers: { Authorization: "Bearer " + token },
            })
          : Promise.resolve(null as any);
        var statusPromise = fetch("/api/presence/partners/me/profile-status", {
          headers: { Authorization: "Bearer " + token },
        });

        var [billResp, prefsResp, statusResp] = await Promise.all([billPromise, prefsPromise, statusPromise]);

        var billData = billResp ? await billResp.json() : null;
        var prefsData = prefsResp ? await prefsResp.json() : null;
        var statusData = statusResp ? await statusResp.json() : null;

        if (billData && billData.success) setBill(billData.bill);
        if (prefsData && prefsData.success) setPrefs(prefsData);
        if (statusData && statusData.success) setProfileStatus(statusData);
      } catch (e) {
        // silent — UI handles nulls
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [billId, user?.hospital_id]);

  function getEffectiveFormat(): string {
    if (prefs?.user_preferences?.default_print_format) return prefs.user_preferences.default_print_format;
    if (prefs?.clinic_preferences && (prefs.clinic_preferences as any).clinic_default_print_format)
      return (prefs.clinic_preferences as any).clinic_default_print_format;
    return "standard";
  }

  function getEffectiveSize(format: string): string {
    if (prefs?.user_preferences?.default_paper_size) return prefs.user_preferences.default_paper_size;
    var psf =
      (prefs?.clinic_preferences && (prefs.clinic_preferences as any).paper_size_per_format) || null;
    if (psf && psf[format]) return psf[format];
    return "a4";
  }

  function profileIncomplete(): boolean {
    if (!profileStatus) return false;
    if (profileStatus.onboarding_profile_completed) return false;
    return (profileStatus.missing_fields || []).length > 0;
  }

  function handleQuickPrint() {
    if (profileIncomplete()) {
      setGateOpen(true);
      return;
    }
    var format = getEffectiveFormat();
    var size = getEffectiveSize(format);
    if (bill?.id) logPrintAudit(String(bill.id), format, size, countryCode);
    if (typeof window !== "undefined") window.print();
  }

  function handleChangeFormat() {
    if (profileIncomplete()) {
      setGateOpen(true);
      return;
    }
    setPrintModalOpen(true);
  }

  async function handleSetDefault(format: string, size: string) {
    setPrintModalOpen(false);
    var token = getToken();
    var hospitalId = user?.hospital_id;
    if (!token || !hospitalId) return;
    try {
      await fetch("/api/presence/partners/" + hospitalId + "/billing-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ default_print_format: format, default_paper_size: size }),
      });
      setPrefs(function (prev) {
        var next = Object.assign({}, prev || {});
        next.user_preferences = Object.assign({}, next.user_preferences || {}, {
          default_print_format: format,
          default_paper_size: size,
        });
        return next as PrintPrefs;
      });
    } catch (e) { /* silent */ }
  }

  if (loading) return <div className="p-10 text-text-muted">Loading bill...</div>;
  if (!bill) return <div className="p-10 text-rose-500">Bill not found.</div>;

  var countryCode = ((profileStatus && profileStatus.country_code) || "IN") as CountryCode;
  var effectiveFormat = getEffectiveFormat();
  var effectiveSize = getEffectiveSize(effectiveFormat);

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-line-soft bg-paper/90 px-9 py-6 backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
              <Link href="/dashboard" className="hover:text-coral-deep">Billing</Link>
              <span className="mx-1.5 text-line">/</span>
              <Link href="/dashboard/bills" className="hover:text-coral-deep">Patient bills</Link>
              <span className="mx-1.5 text-line">/</span>
              {bill.bill_number || billId}
            </div>
            <h1 className="font-fraunces text-3xl font-light tracking-tight text-ink">
              {bill.patient_name || "Patient"} {"\u00B7 "}
              <em className="italic font-normal text-coral-deep">
                {formatCurrency(bill.total_amount, countryCode)}
              </em>
            </h1>
            <p className="mt-1.5 text-sm text-text-dim">
              {(bill as any).bill_description || "Patient bill"} {"\u00B7 "}
              Status: {(bill as any).payment_status || "Pending"} {"\u00B7 "}
              Your default: <strong className="text-coral-deep">{effectiveFormat} {"\u00B7 "} {effectiveSize.toUpperCase()}</strong>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm">Edit</button>
            <button className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm">Resend WhatsApp</button>
            <button
              onClick={handleQuickPrint}
              className="rounded-lg bg-coral px-5 py-2.5 text-sm font-medium text-white hover:bg-coral-deep"
            >
              {"\uD83D\uDDA8 Quick print"}
            </button>
            <button
              onClick={handleChangeFormat}
              className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm"
            >
              Change format...
            </button>
            {/* Stage 5: Collect Payment for unpaid cash bills */}
            {(bill as any)?.supply_type !== "TPA" && Number((bill as any)?.balance_amount || 0) > 0 && (
              <button
                onClick={function () { router.push("/dashboard/billing/opd?collect=" + billId); }}
                className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Collect Payment
              </button>
            )}
            {/* Stage 5: Submit to NHCX / eClaimLink for insurance bills */}
            {(bill as any)?.supply_type === "B2B" && !(bill as any)?.claim_submitted_at && (
              <button
                onClick={function () { router.push("/dashboard/claims?bill=" + billId); }}
                className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                Submit to {(bill as any)?.country_code === "AE" ? "eClaimLink" : "NHCX"}
              </button>
            )}
            {/* Stage 5: WhatsApp receipt */}
            {(bill as any)?.patient_phone && (
              <button
                onClick={function () {
                  fetch("/api/hospitals/" + user?.hospital_id + "/rcm/billing/bills/" + billId + "/whatsapp-receipt", { method: "POST" })
                    .then(function () { alert("Receipt sent via WhatsApp"); })
                    .catch(function () { alert("Could not send receipt"); });
                }}
                className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm hover:bg-paper-soft"
              >
                WhatsApp Receipt
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-9 py-7">
        {/* Status pills */}
        <div className="mb-5 flex flex-wrap gap-2">
          <Pill color="emerald">{"\u25CF " + ((bill as any).payment_status || "Pending")}</Pill>
          <Pill color="gray">{bill.supply_type || "B2C"}</Pill>
          {countryCode === "IN" && (
            <Pill color="coral">GST {(bill as any).gst_rate_total || "18"}% {"\u00B7"} CGST+SGST</Pill>
          )}
          {countryCode === "US" && (
            <Pill color="teal">Sales Tax {(bill as any).sales_tax_rate || "7.25"}%</Pill>
          )}
          {countryCode === "GB" && <Pill color="blue">VAT 20%</Pill>}
          {countryCode === "AE" && <Pill color="amber">VAT 5%</Pill>}
          {prefs && profileStatus && profileStatus.onboarding_profile_completed && (
            <Pill color="coral">{"\u2605 DEFAULT FORMAT IS SET"}</Pill>
          )}
        </div>

        {/* Line items */}
        <div className="mb-5 rounded-2xl border border-line bg-white">
          <div className="border-b border-line-soft px-6 py-5">
            <div className="font-fraunces text-lg text-ink">
              Line <em className="italic text-coral-deep">items</em>
            </div>
          </div>
          <div className="px-6 py-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    Description
                  </th>
                  <th className="py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    Qty
                  </th>
                  <th className="py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    Rate
                  </th>
                  <th className="py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {(bill.items || []).map(function (item, i) {
                  return (
                    <tr key={i} className="border-b border-line-soft">
                      <td className="py-3">{item.description || item.name || "—"}</td>
                      <td className="py-3 text-right">{item.quantity || 1}</td>
                      <td className="py-3 text-right font-mono">
                        {formatCurrency(item.rate ?? item.amount, countryCode)}
                      </td>
                      <td className="py-3 text-right font-mono">
                        {formatCurrency(item.amount, countryCode)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-4 text-right text-sm text-text-dim">
                    Subtotal
                  </td>
                  <td className="pt-4 text-right font-mono">
                    {formatCurrency(bill.taxable_amount ?? bill.subtotal, countryCode)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-1 text-right text-sm text-text-dim">
                    Tax
                  </td>
                  <td className="py-1 text-right font-mono">
                    {formatCurrency(
                      bill.tax_amount ??
                        ((bill.cgst_amount || 0) + (bill.sgst_amount || 0) + (bill.igst_amount || 0)),
                      countryCode
                    )}
                  </td>
                </tr>
                <tr className="border-t border-ink">
                  <td colSpan={3} className="pt-3 text-right font-fraunces text-lg text-ink">
                    Total
                  </td>
                  <td className="pt-3 text-right font-fraunces text-lg font-semibold text-ink">
                    {formatCurrency(bill.total_amount, countryCode)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <PrintFormatModal
        open={printModalOpen}
        onClose={function () { setPrintModalOpen(false); }}
        bill={bill}
        prefs={prefs}
        countryCode={countryCode}
        onSetDefault={function (format, size) { handleSetDefault(format, size as PaperSize); }}
      />

      <RegulatoryIdsGate
        open={gateOpen}
        onClose={function () { setGateOpen(false); }}
        initialStatus={profileStatus as any}
        mode="hard"
        onSaved={function () {
          if (typeof window !== "undefined") window.location.reload();
        }}
      />
    </div>
  );
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  var colorClasses: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600",
    gray: "bg-gray-500/10 text-text-muted",
    coral: "bg-coral/10 text-coral-deep",
    teal: "bg-teal-500/10 text-teal-600",
    blue: "bg-blue-500/10 text-blue-600",
    amber: "bg-amber-500/10 text-amber-600",
  };
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-wider " +
        (colorClasses[color] || colorClasses.gray)
      }
    >
      {children}
    </span>
  );
}
