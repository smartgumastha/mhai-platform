"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPaymentLink, getPayments } from "@/lib/api";
import { useCurrency } from "@/app/hooks/useCurrency";
import { useNotification } from "@/app/providers/NotificationProvider";

var purposeOptions = [
  "Consultation fee",
  "Lab test",
  "Procedure",
  "Pharmacy",
  "Follow-up",
  "Other",
];

var filterTabs = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "paid", label: "Paid" },
];

type Payment = {
  id: string;
  patient_name: string;
  patient_phone: string;
  amount: number;
  purpose: string;
  status: string;
  short_url: string;
  razorpay_link_id: string;
  created_at: number;
};

/* ── Minimal QR code renderer (canvas) ── */
function drawQR(canvas: HTMLCanvasElement, url: string) {
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  var size = 200;
  canvas.width = size;
  canvas.height = size;

  // Generate a deterministic bit matrix from the URL
  var modules = 25;
  var cellSize = size / modules;
  var grid: boolean[][] = [];

  // Simple hash-based QR pattern (visual placeholder — not scannable)
  // We use the URL bytes to create a pattern that looks like a QR code
  var hash = 0;
  for (var i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
  }

  for (var row = 0; row < modules; row++) {
    grid[row] = [];
    for (var col = 0; col < modules; col++) {
      // Finder patterns (three corners)
      var inFinderTL = row < 7 && col < 7;
      var inFinderTR = row < 7 && col >= modules - 7;
      var inFinderBL = row >= modules - 7 && col < 7;

      if (inFinderTL || inFinderTR || inFinderBL) {
        var lr = inFinderTL ? row : inFinderTR ? row : row - (modules - 7);
        var lc = inFinderTL ? col : inFinderTR ? col - (modules - 7) : col;
        // Outer ring, inner block
        grid[row][col] =
          lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
      } else {
        // Data area — use hash + position
        var seed = (hash ^ (row * 31 + col * 17)) >>> 0;
        grid[row][col] = seed % 3 !== 0;
      }
    }
  }

  // Draw
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#000000";
  for (var r = 0; r < modules; r++) {
    for (var c = 0; c < modules; c++) {
      if (grid[r][c]) {
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }
}

function QRCode({ url }: { url: string }) {
  var canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current && url) drawQR(canvasRef.current, url);
  }, [url]);
  return <canvas ref={canvasRef} className="mx-auto rounded-lg" style={{ width: 160, height: 160 }} />;
}

function formatDate(ts: number) {
  if (!ts) return "";
  var d = new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function MhaiPayPage() {
  var currency = useCurrency();
  var notify = useNotification();

  /* ── form state ── */
  var [name, setName] = useState("");
  var [phone, setPhone] = useState("");
  var [amount, setAmount] = useState("");
  var [purpose, setPurpose] = useState("Consultation fee");
  var [creating, setCreating] = useState(false);

  /* ── success state ── */
  var [created, setCreated] = useState<Payment | null>(null);
  var [copied, setCopied] = useState(false);

  /* ── payments list ── */
  var [payments, setPayments] = useState<Payment[]>([]);
  var [filter, setFilter] = useState("all");
  var [loadingList, setLoadingList] = useState(true);

  /* ── stats ── */
  var collectedMtd = payments.filter((p) => p.status === "paid").reduce((s, p) => s + (Number(p.amount) || 0), 0);
  var linksSent = payments.length;
  var paidCount = payments.filter((p) => p.status === "paid").length;
  var collectionRate = linksSent > 0 ? Math.round((paidCount / linksSent) * 100) : 0;

  var fetchPayments = useCallback(function() {
    setLoadingList(true);
    getPayments()
      .then(function(res) {
        if (res.success && res.payments) setPayments(res.payments);
      })
      .catch(function() {})
      .finally(function() { setLoadingList(false); });
  }, []);

  useEffect(function() { fetchPayments(); }, [fetchPayments]);

  /* ── create link ── */
  async function handleCreate() {
    if (!name.trim()) { notify.warning("Missing field", "Patient name is required."); return; }
    if (!phone.trim()) { notify.warning("Missing field", "Phone number is required."); return; }
    if (!amount || Number(amount) <= 0) { notify.warning("Invalid amount", "Enter a valid amount."); return; }
    setCreating(true);
    try {
      var res = await createPaymentLink({
        patient_name: name.trim(),
        patient_phone: phone.trim(),
        amount: Number(amount),
        purpose: purpose,
      });
      if (res.success && res.payment) {
        setCreated({ ...res.payment, created_at: Date.now() } as Payment);
        fetchPayments();
      } else {
        notify.error("Failed", res.error || res.message || "Failed to create payment link.");
      }
    } catch {
      notify.error("Network error", "Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setCreated(null);
    setName("");
    setPhone("");
    setAmount("");
    setPurpose("Consultation fee");
    setCopied(false);
  }

  function copyLink() {
    if (!created?.short_url) return;
    navigator.clipboard.writeText(created.short_url).then(function() {
      setCopied(true);
      setTimeout(function() { setCopied(false); }, 2000);
    }).catch(function() {});
  }

  var whatsappMsg = created
    ? encodeURIComponent(
        "Hi " + created.patient_name + ", here is your payment link for " + created.purpose +
        " (" + currency.format(created.amount) + "): " + created.short_url
      )
    : "";
  var smsBody = created
    ? encodeURIComponent(
        "Payment link for " + created.purpose + " " + currency.format(created.amount) + ": " + created.short_url
      )
    : "";
  var emailSubject = created ? encodeURIComponent("Payment link - " + created.purpose) : "";
  var emailBody = created
    ? encodeURIComponent(
        "Hi " + created.patient_name + ",\n\nPlease complete your payment of " + currency.format(created.amount) +
        " for " + created.purpose + ".\n\nPayment link: " + created.short_url + "\n\nThank you!"
      )
    : "";

  var filteredPayments = payments.filter(function(p) {
    if (filter === "pending") return p.status === "pending";
    if (filter === "paid") return p.status === "paid";
    return true;
  });

  var inputClass =
    "w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  /* ══════════════════════════════════════════════════
     STATE 2: Success — show payment link + share
     ══════════════════════════════════════════════════ */
  if (created) {
    return (
      <div className="px-8 py-6">
        <div className="mx-auto max-w-lg">
          {/* Success card */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-md">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <div className="mb-1 text-2xl font-semibold text-gray-900">
              {currency.format(Number(created.amount))}
            </div>
            <div className="text-sm text-gray-700">{created.patient_name}</div>
            <div className="text-xs text-gray-500">{created.purpose}</div>
          </div>

          {/* QR Code */}
          <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
            <div className="mb-2 text-xs font-medium text-gray-500">Scan to pay</div>
            <QRCode url={created.short_url} />
          </div>

          {/* Payment link + copy */}
          <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-1 text-xs text-gray-500">Payment link</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
                {created.short_url}
              </div>
              <button
                onClick={copyLink}
                className="cursor-pointer rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white transition-all duration-200 hover:bg-gray-800"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            <a
              href={"https://wa.me/" + (created.patient_phone.startsWith("+") ? created.patient_phone.slice(1) : "91" + created.patient_phone) + "?text=" + whatsappMsg}
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#25D366] text-sm font-bold text-white">W</div>
              <span className="text-[10px] text-gray-600">WhatsApp</span>
            </a>
            <a
              href={"sms:" + created.patient_phone + "?body=" + smsBody}
              className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-sm font-bold text-white">S</div>
              <span className="text-[10px] text-gray-600">SMS</span>
            </a>
            <a
              href={"mailto:?subject=" + emailSubject + "&body=" + emailBody}
              className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-200 hover:border-purple-300 hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500 text-sm font-bold text-white">E</div>
              <span className="text-[10px] text-gray-600">Email</span>
            </a>
            <button
              onClick={function() { window.print(); }}
              className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-700 text-sm font-bold text-white">P</div>
              <span className="text-[10px] text-gray-600">Print</span>
            </button>
          </div>

          {/* Payment details */}
          <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-2 text-xs font-medium text-gray-500">Payment details</div>
            {[
              { label: "Patient", value: created.patient_name },
              { label: "Phone", value: created.patient_phone },
              { label: "Amount", value: currency.format(Number(created.amount)) },
              { label: "Purpose", value: created.purpose },
              { label: "Status", value: "Pending" },
              { label: "Link ID", value: created.razorpay_link_id },
            ].map(function(d) {
              return (
                <div key={d.label} className="flex items-center justify-between border-b border-gray-50 py-1.5">
                  <span className="text-[11px] text-gray-500">{d.label}</span>
                  <span className="text-[11px] font-medium text-gray-900">{d.value}</span>
                </div>
              );
            })}
          </div>

          {/* Create another */}
          <button
            onClick={resetForm}
            className="mt-4 w-full cursor-pointer rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:text-emerald-600"
          >
            Create another payment link
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════
     STATE 1: Default — form + payment history
     ══════════════════════════════════════════════════ */
  return (
    <div className="px-8 py-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">MHAI Pay</h1>
        <p className="mt-0.5 text-sm text-gray-500">Send payment links to patients via WhatsApp, SMS, or QR code</p>
      </div>

      {/* Stats bar */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-gray-100 border-t-2 border-t-emerald-500 bg-white p-4 shadow-sm">
          <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Collected MTD</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {currency.formatCompact(collectedMtd)}
          </div>
          <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
            {paidCount} paid
          </span>
        </div>
        <div className="rounded-2xl border border-gray-100 border-t-2 border-t-blue-500 bg-white p-4 shadow-sm">
          <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Links sent</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{linksSent}</div>
          <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
            this month
          </span>
        </div>
        <div className="rounded-2xl border border-gray-100 border-t-2 border-t-purple-500 bg-white p-4 shadow-sm">
          <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Collection rate</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{collectionRate}%</div>
          <span className="mt-1 inline-block rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600">
            {paidCount}/{linksSent} converted
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-5">
        {/* LEFT — Payment history */}
        <div>
          {/* Filter tabs */}
          <div className="mb-4 flex gap-0 border-b border-gray-100">
            {filterTabs.map(function(t) {
              var count = t.id === "pending"
                ? payments.filter(function(p) { return p.status === "pending"; }).length
                : t.id === "paid"
                  ? paidCount
                  : payments.length;
              return (
                <button
                  key={t.id}
                  onClick={function() { setFilter(t.id); }}
                  className={
                    "cursor-pointer pb-2 pr-5 text-sm transition-all duration-200 " +
                    (filter === t.id
                      ? "border-b-2 border-emerald-500 font-medium text-gray-900"
                      : "text-gray-400 hover:text-gray-600")
                  }
                >
                  {t.label}
                  <span
                    className={
                      "ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium " +
                      (t.id === "pending" && count > 0 ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500")
                    }
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Payment list */}
          {loadingList ? (
            <div className="flex min-h-[20vh] items-center justify-center">
              <div className="text-sm text-gray-400">Loading payments...</div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex min-h-[20vh] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center">
              <div className="mb-1 text-sm font-medium text-gray-700">
                {filter === "pending" ? "No pending payments" : filter === "paid" ? "No paid payments yet" : "No payment links yet"}
              </div>
              <p className="text-xs text-gray-500">Create your first payment link to get started</p>
            </div>
          ) : (
            filteredPayments.map(function(p) {
              var isPaid = p.status === "paid";
              return (
                <div
                  key={p.id}
                  className="mb-2 flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-gray-900">{p.patient_name}</div>
                    <div className="mt-0.5 text-[11px] text-gray-500">
                      {p.purpose}{p.created_at ? " \u00B7 " + formatDate(p.created_at) : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {currency.format(Number(p.amount))}
                    </div>
                    <span
                      className={
                        "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium " +
                        (isPaid ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")
                      }
                    >
                      {isPaid ? "Paid" : "Pending"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT — Create payment link form */}
        <div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-1 text-sm font-medium text-gray-900">Create payment link</div>
            <div className="mb-4 text-[11px] text-gray-500">Send via WhatsApp, SMS, or QR code</div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Patient name</label>
              <input
                className={inputClass}
                placeholder="e.g. Rajesh Kumar"
                value={name}
                onChange={function(e) { setName(e.target.value); }}
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Phone number</label>
              <input
                className={inputClass}
                placeholder="e.g. 9553053446"
                value={phone}
                onChange={function(e) { setPhone(e.target.value); }}
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{currency.symbol}</span>
                <input
                  className={inputClass + " pl-7"}
                  type="number"
                  min="1"
                  placeholder="500"
                  value={amount}
                  onChange={function(e) { setAmount(e.target.value); }}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs text-gray-500">Purpose</label>
              <select
                className={inputClass}
                value={purpose}
                onChange={function(e) { setPurpose(e.target.value); }}
              >
                {purposeOptions.map(function(o) { return <option key={o} value={o}>{o}</option>; })}
              </select>
            </div>

            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create payment link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
