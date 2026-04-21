"use client";

import { QRCodeSVG } from "qrcode.react";
import {
  formatCurrency,
  formatDate,
  getQRVerifyUrl,
  amountInWords,
  getCompliancePhrase,
  getDocTypeLabel,
  getCodeLabel,
  getTaxIdLabel,
  type PrintComponentProps,
  type CountryCode,
} from "./lib";

var MONO = "JetBrains Mono, monospace";
var SERIF = "Fraunces, Georgia, serif";

export function StandardInvoiceBody({ bill, prefs, countryCode, size }: PrintComponentProps) {
  var clinic = (prefs && prefs.clinic_preferences) || {};
  var cc = countryCode;
  var amtWords = amountInWords(bill.total_amount, cc);

  return (
    <div>
      {/* Clinic header */}
      <div
        style={{
          borderBottom: "2px solid #1a1a1a",
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
            <br />
            <ClinicTaxIds cc={cc} clinic={clinic} bill={bill} />
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: "9.5px",
              color: "#555",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {getDocTypeLabel(cc)}
          </div>
          <h2
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: size === "a4" ? "20px" : "15px",
              marginTop: "2px",
              margin: "2px 0 0",
            }}
          >
            {bill.bill_number || "—"}
          </h2>
          <div style={{ fontFamily: MONO, fontSize: "10px", color: "#666", marginTop: "2px" }}>
            {formatDate(bill.bill_date || Date.now(), cc)}
          </div>
        </div>
      </div>

      {/* Billed to + place of supply */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
        <div>
          <div style={miniLabel()}>Billed to</div>
          <div style={{ fontWeight: 600, fontSize: size === "a4" ? "12px" : "11px" }}>
            {bill.patient_name || "—"}
          </div>
          <div style={{ fontSize: "10px", color: "#555" }}>
            {bill.patient_phone || ""} {bill.supply_type ? "\u00B7 " + bill.supply_type : "\u00B7 B2C"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={miniLabel()}>
            {cc === "IN" ? "Place of supply" : cc === "AE" ? "Emirate" : "Provider"}
          </div>
          <div style={{ fontWeight: 600, fontSize: size === "a4" ? "12px" : "11px" }}>
            {bill.place_of_supply_name || clinic.state || "—"}
          </div>
        </div>
      </div>

      {/* Line items */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}>
        <thead>
          <tr>
            <th style={th("left")}>Description</th>
            <th style={th("left")}>{getCodeLabel(cc)}</th>
            <th style={th("right")}>Qty</th>
            <th style={th("right")}>Rate</th>
            <th style={th("right")}>{cc === "IN" ? "GST%" : "Tax%"}</th>
            <th style={th("right")}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(bill.items || []).map(function (item, i) {
            return (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={td("left")}>{item.description || item.name || "—"}</td>
                <td style={{ ...td("left"), fontFamily: MONO, color: "#666" }}>
                  {item.hsn_sac || item.cpt_code || item.snomed_code || "—"}
                </td>
                <td style={{ ...td("right"), fontFamily: MONO }}>{item.quantity || 1}</td>
                <td style={{ ...td("right"), fontFamily: MONO }}>
                  {formatCurrency(item.rate ?? item.amount, cc)}
                </td>
                <td style={{ ...td("right"), fontFamily: MONO }}>
                  {item.gst_rate ?? item.tax_rate ?? 0}
                </td>
                <td style={{ ...td("right"), fontFamily: MONO }}>{formatCurrency(item.amount, cc)}</td>
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
          {amtWords ? (
            <span>
              <strong style={{ color: "#333", fontStyle: "normal" }}>Amount in words:</strong> {amtWords}
            </span>
          ) : (
            <em style={{ color: "#999" }}>Amount-in-words not required in {cc}.</em>
          )}
        </div>
        <div style={{ border: "1.5px solid #1a1a1a", borderRadius: "3px", padding: "10px 12px" }}>
          <Row label="Taxable" value={formatCurrency(bill.taxable_amount ?? bill.subtotal, cc)} />
          {cc === "IN" && (
            <>
              <Row label="CGST" value={formatCurrency(bill.cgst_amount || 0, cc)} />
              <Row label="SGST" value={formatCurrency(bill.sgst_amount || 0, cc)} />
            </>
          )}
          {cc === "US" && <Row label="Sales Tax" value={formatCurrency(bill.tax_amount, cc)} />}
          {(cc === "GB" || cc === "AE") && <Row label="VAT" value={formatCurrency(bill.tax_amount, cc)} />}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "7px 0 0",
              borderTop: "1px solid #1a1a1a",
              marginTop: "4px",
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            <span>Total</span>
            <span style={{ fontFamily: MONO }}>{formatCurrency(bill.total_amount, cc)}</span>
          </div>
        </div>
      </div>

      {/* Footer with QR + signature */}
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
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <QRCodeSVG
            value={getQRVerifyUrl(bill.bill_number, cc)}
            size={size === "thermal" ? 80 : 70}
            level="M"
          />
          <div
            style={{
              fontFamily: MONO,
              fontSize: "7.5px",
              color: "#666",
              marginTop: "2px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
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

export default function PrintStandardInvoice(props: PrintComponentProps) {
  return (
    <div className={"print-paper size-" + props.size}>
      <StandardInvoiceBody {...props} />
    </div>
  );
}

function ClinicTaxIds({ cc, clinic, bill }: { cc: CountryCode; clinic: any; bill: any }) {
  if (cc === "IN") return <span>{getTaxIdLabel(cc)}: {bill.gstin || clinic.gstin || "\u2014"}</span>;
  if (cc === "US") return <span>{"NPI: " + (clinic.npi || "\u2014") + " \u00B7 EIN: " + (clinic.ein || "\u2014")}</span>;
  if (cc === "GB") return <span>{"VAT: " + (clinic.vat_number || "\u2014") + " \u00B7 Co: " + (clinic.company_number || "\u2014")}</span>;
  if (cc === "AE") return <span>TRN: {clinic.trn || "\u2014"}</span>;
  return null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "10.5px" }}>
      <span>{label}</span>
      <span style={{ fontFamily: MONO }}>{value}</span>
    </div>
  );
}

function miniLabel(): React.CSSProperties {
  return {
    fontFamily: MONO,
    fontSize: "8.5px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#666",
    marginBottom: "3px",
  };
}

function th(align: "left" | "right"): React.CSSProperties {
  return {
    padding: "6px 5px",
    textAlign: align,
    background: "#f5f5f5",
    fontFamily: MONO,
    fontSize: "9px",
    textTransform: "uppercase",
    borderBottom: "1px solid #1a1a1a",
  };
}

function td(align: "left" | "right"): React.CSSProperties {
  return { padding: "6px 5px", fontSize: "10.5px", textAlign: align };
}
