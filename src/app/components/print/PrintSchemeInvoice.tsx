"use client";

import { QRCodeSVG } from "qrcode.react";
import {
  formatCurrency,
  formatDate,
  getQRVerifyUrl,
  amountInWords,
  getCompliancePhrase,
  type PrintComponentProps,
} from "./lib";

var MONO = "JetBrains Mono, monospace";
var SERIF = "Fraunces, Georgia, serif";

export default function PrintSchemeInvoice({ bill, prefs, countryCode, size }: PrintComponentProps) {
  if (countryCode !== "IN") {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          background: "white",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ fontFamily: SERIF, fontSize: "18px", marginBottom: "8px" }}>
          Scheme invoice format not available for your country.
        </h3>
        <p style={{ fontSize: "13px", color: "#666" }}>
          PM-JAY, CGHS, and ESI are India-only government health schemes.
          {" "}Use Standard tax invoice for {countryCode} patients.
        </p>
      </div>
    );
  }

  var clinic = (prefs && prefs.clinic_preferences) || {};
  var amtWords = amountInWords(bill.total_amount, "IN");
  var schemeName = bill.scheme_name || "Scheme";

  return (
    <div className={"print-paper size-" + size}>
      {/* Header with scheme badge */}
      <div
        style={{
          borderBottom: "2px solid #1a1a1a",
          paddingBottom: "14px",
          marginBottom: "14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div style={{ flex: 1 }}>
          {clinic.logo_url && (
            <img src={clinic.logo_url} alt="" style={{ height: "42px", marginBottom: "6px" }} />
          )}
          <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "19px", margin: 0 }}>
            {clinic.clinic_name || "Clinic Name"}
          </h1>
          <div style={{ fontSize: "10.5px", color: "#555", marginTop: "2px" }}>
            {clinic.address || ""}
            <br />
            GSTIN: {clinic.gstin || "\u2014"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 10px",
              background: "#7c3aed",
              color: "white",
              fontFamily: MONO,
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              borderRadius: "3px",
              marginBottom: "4px",
            }}
          >
            {schemeName}
          </div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "20px", margin: "2px 0 0" }}>
            {bill.bill_number || "—"}
          </h2>
          <div style={{ fontFamily: MONO, fontSize: "10px", color: "#666", marginTop: "2px" }}>
            {formatDate(bill.bill_date || Date.now(), "IN")}
          </div>
        </div>
      </div>

      {/* Beneficiary + scheme details */}
      <div
        style={{
          border: "1.5px solid #7c3aed",
          borderRadius: "4px",
          padding: "10px 12px",
          marginBottom: "14px",
          background: "#faf5ff",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "12px",
        }}
      >
        <div>
          <div style={miniLabel("#7c3aed")}>Beneficiary ID</div>
          <div style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 600 }}>
            {bill.beneficiary_id || "\u2014"}
          </div>
          <div style={{ fontSize: "10.5px", marginTop: "2px" }}>{bill.patient_name || "—"}</div>
        </div>
        <div>
          <div style={miniLabel("#7c3aed")}>Pre-auth Approval</div>
          <div style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 600 }}>
            {bill.preauth_no || "\u2014"}
          </div>
        </div>
        <div>
          <div style={miniLabel("#7c3aed")}>Package Code</div>
          <div style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 600 }}>
            {bill.package_code || "\u2014"}
          </div>
        </div>
      </div>

      {/* Line items: scheme rate + co-pay + scheme-payable */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}>
        <thead>
          <tr>
            <th style={th("left")}>Service</th>
            <th style={th("left")}>HSN/SAC</th>
            <th style={th("right")}>Qty</th>
            <th style={th("right")}>Scheme Rate</th>
            <th style={th("right")}>Patient Co-pay</th>
            <th style={th("right")}>Scheme Payable</th>
          </tr>
        </thead>
        <tbody>
          {(bill.items || []).map(function (item, i) {
            return (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={td("left")}>{item.description || item.name || "—"}</td>
                <td style={{ ...td("left"), fontFamily: MONO, color: "#666" }}>
                  {item.hsn_sac || "\u2014"}
                </td>
                <td style={{ ...td("right"), fontFamily: MONO }}>{item.quantity || 1}</td>
                <td style={{ ...td("right"), fontFamily: MONO }}>
                  {formatCurrency(item.rate ?? item.amount, "IN")}
                </td>
                <td style={{ ...td("right"), fontFamily: MONO }}>
                  {formatCurrency(0, "IN")}
                </td>
                <td style={{ ...td("right"), fontFamily: MONO }}>
                  {formatCurrency(item.amount, "IN")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "14px", marginBottom: "12px" }}>
        <div
          style={{
            padding: "8px 10px",
            background: "#f9f9f9",
            borderRadius: "3px",
            fontSize: "10px",
            color: "#555",
            fontStyle: "italic",
          }}
        >
          {amtWords && (
            <span>
              <strong style={{ color: "#333", fontStyle: "normal" }}>Amount in words:</strong> {amtWords}
            </span>
          )}
        </div>
        <div style={{ border: "1.5px solid #7c3aed", borderRadius: "3px", padding: "10px 12px" }}>
          <Row label="Scheme Total" value={formatCurrency(bill.taxable_amount ?? bill.subtotal, "IN")} />
          <Row label="Patient Co-pay" value={formatCurrency(bill.patient_copay || 0, "IN")} />
          <Row label="Scheme Payable" value={formatCurrency(bill.scheme_payable ?? bill.total_amount, "IN")} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "7px 0 0",
              borderTop: "1px solid #7c3aed",
              marginTop: "4px",
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: "14px",
              color: "#7c3aed",
            }}
          >
            <span>Total</span>
            <span style={{ fontFamily: MONO }}>{formatCurrency(bill.total_amount, "IN")}</span>
          </div>
        </div>
      </div>

      {/* Footer with purple-accented QR */}
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
          {getCompliancePhrase("IN")} <br />
          {"Verified " + schemeName + " package \u00B7 patient acknowledged co-pay."}
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <QRCodeSVG
            value={getQRVerifyUrl(bill.bill_number, "IN") + "?scheme=" + encodeURIComponent(schemeName)}
            size={70}
            level="M"
            fgColor="#7c3aed"
          />
          <div
            style={{
              fontFamily: MONO,
              fontSize: "7.5px",
              color: "#7c3aed",
              marginTop: "2px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              fontWeight: 600,
            }}
          >
            Scheme Verify
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "10.5px" }}>
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
    background: "#faf5ff",
    fontFamily: MONO,
    fontSize: "9px",
    textTransform: "uppercase",
    borderBottom: "1px solid #7c3aed",
    color: "#581c87",
  };
}

function td(align: "left" | "right"): React.CSSProperties {
  return { padding: "6px 5px", fontSize: "10.5px", textAlign: align };
}
