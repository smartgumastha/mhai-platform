"use client";

import { QRCodeSVG } from "qrcode.react";
import {
  formatCurrency,
  formatDate,
  getQRVerifyUrl,
  getCompliancePhrase,
  type PrintComponentProps,
} from "./lib";

var MONO = "JetBrains Mono, monospace";
var SERIF = "Fraunces, Georgia, serif";

export default function PrintReceipt({ bill, prefs, countryCode, size }: PrintComponentProps) {
  var clinic = (prefs && prefs.clinic_preferences) || {};
  var cc = countryCode;
  var paid = bill.paid_amount ?? bill.total_amount ?? 0;
  var balance = bill.balance ?? Math.max(0, (bill.total_amount || 0) - paid);

  return (
    <div className={"print-paper size-" + size}>
      {/* Header — green Payment Receipt */}
      <div
        style={{
          borderBottom: "2px solid #16a34a",
          paddingBottom: size === "thermal" ? "6px" : "14px",
          marginBottom: size === "thermal" ? "8px" : "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div style={{ flex: 1 }}>
          {clinic.logo_url && (
            <img
              src={clinic.logo_url}
              alt=""
              style={{ height: size === "thermal" ? "22px" : "42px", marginBottom: "6px" }}
            />
          )}
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: size === "a4" ? "19px" : size === "a5" ? "15px" : "13px",
              margin: 0,
            }}
          >
            {clinic.clinic_name || "Clinic Name"}
          </h1>
          <div style={{ fontSize: size === "thermal" ? "9px" : "10.5px", color: "#555", marginTop: "2px" }}>
            {clinic.address || ""}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: "9.5px",
              color: "#16a34a",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Payment Receipt
          </div>
          <div
            style={{
              display: "inline-block",
              border: "2px solid #16a34a",
              padding: "3px 10px",
              borderRadius: "3px",
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: "13px",
              color: "#16a34a",
              letterSpacing: "0.1em",
              marginTop: "4px",
              transform: "rotate(-2deg)",
            }}
          >
            PAID
          </div>
          <div style={{ fontFamily: MONO, fontSize: "10px", color: "#666", marginTop: "6px" }}>
            {formatDate(bill.paid_at || bill.bill_date || Date.now(), cc)}
          </div>
        </div>
      </div>

      {/* Patient + receipt no */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
        <div>
          <div style={miniLabel()}>Received from</div>
          <div style={{ fontWeight: 600, fontSize: size === "a4" ? "12px" : "11px" }}>
            {bill.patient_name || "—"}
          </div>
          <div style={{ fontSize: "10px", color: "#555" }}>{bill.patient_phone || ""}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={miniLabel()}>Receipt No</div>
          <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: size === "a4" ? "13px" : "11px" }}>
            {bill.bill_number || "—"}
          </div>
        </div>
      </div>

      {/* Payment details grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "12px",
          padding: "10px 12px",
          background: "#f0fdf4",
          border: "1px solid #86efac",
          borderRadius: "4px",
          marginBottom: "14px",
        }}
      >
        <div>
          <div style={miniLabel("#15803d")}>Method</div>
          <div style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 600 }}>
            {bill.payment_method || "Cash"}
          </div>
        </div>
        <div>
          <div style={miniLabel("#15803d")}>Transaction ID</div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: "11px",
              fontWeight: 600,
              wordBreak: "break-all",
            }}
          >
            {bill.payment_ref || "\u2014"}
          </div>
        </div>
        <div>
          <div style={miniLabel("#15803d")}>Paid at</div>
          <div style={{ fontFamily: MONO, fontSize: "11px", fontWeight: 600 }}>
            {new Date(bill.paid_at || Date.now()).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {/* Invoice reference */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}>
        <thead>
          <tr>
            <th style={th("left")}>Invoice reference</th>
            <th style={th("right")}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid #eee" }}>
            <td style={td("left")}>{"Bill " + (bill.bill_number || "\u2014")}</td>
            <td style={{ ...td("right"), fontFamily: MONO }}>
              {formatCurrency(bill.total_amount, cc)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Balance box */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "14px", marginBottom: "12px" }}>
        <div></div>
        <div style={{ border: "1.5px solid #16a34a", borderRadius: "3px", padding: "10px 12px" }}>
          <Row label="Bill total" value={formatCurrency(bill.total_amount, cc)} />
          <Row label="Paid" value={formatCurrency(paid, cc)} highlight />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "7px 0 0",
              borderTop: "1px solid #16a34a",
              marginTop: "4px",
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: "14px",
              color: balance > 0 ? "#dc2626" : "#16a34a",
            }}
          >
            <span>Balance</span>
            <span style={{ fontFamily: MONO }}>{formatCurrency(balance, cc)}</span>
          </div>
        </div>
      </div>

      {/* Footer with green QR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: "14px",
          paddingTop: "12px",
          borderTop: "1px solid #ddd",
          gap: "14px",
        }}
      >
        <div style={{ flex: 1, fontSize: "9.5px", color: "#555", lineHeight: 1.45 }}>
          {getCompliancePhrase(cc)}
          <br />
          Thank you for your payment.
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <QRCodeSVG
            value={getQRVerifyUrl(bill.bill_number, cc) + "?type=receipt"}
            size={size === "thermal" ? 80 : 70}
            level="M"
            fgColor="#16a34a"
          />
          <div
            style={{
              fontFamily: MONO,
              fontSize: "7.5px",
              color: "#16a34a",
              marginTop: "2px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              fontWeight: 600,
            }}
          >
            Verify
          </div>
        </div>
        {clinic.default_signature_url && (
          <div style={{ textAlign: "right", minWidth: "160px" }}>
            <img
              src={clinic.default_signature_url}
              alt=""
              style={{ height: "28px", display: "block", marginLeft: "auto" }}
            />
            <div
              style={{
                fontSize: "9.5px",
                color: "#555",
                borderTop: "1px solid #333",
                paddingTop: "2px",
                marginTop: "2px",
              }}
            >
              Authorized Signatory
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "3px 0",
        fontSize: "10.5px",
        color: highlight ? "#16a34a" : undefined,
        fontWeight: highlight ? 600 : undefined,
      }}
    >
      <span>{label}</span>
      <span style={{ fontFamily: MONO }}>{value}</span>
    </div>
  );
}

function miniLabel(color?: string): React.CSSProperties {
  return {
    fontFamily: MONO,
    fontSize: "8.5px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: color || "#666",
    marginBottom: "3px",
    fontWeight: color ? 600 : 400,
  };
}

function th(align: "left" | "right"): React.CSSProperties {
  return {
    padding: "6px 5px",
    textAlign: align,
    background: "#f0fdf4",
    fontFamily: MONO,
    fontSize: "9px",
    textTransform: "uppercase",
    borderBottom: "1px solid #16a34a",
    color: "#15803d",
  };
}

function td(align: "left" | "right"): React.CSSProperties {
  return { padding: "6px 5px", fontSize: "10.5px", textAlign: align };
}
