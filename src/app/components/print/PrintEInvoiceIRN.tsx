"use client";

import { QRCodeSVG } from "qrcode.react";
import { StandardInvoiceBody } from "./PrintStandardInvoice";
import type { PrintComponentProps } from "./lib";

var MONO = "JetBrains Mono, monospace";
var SERIF = "Fraunces, Georgia, serif";

export default function PrintEInvoiceIRN(props: PrintComponentProps) {
  if (props.countryCode !== "IN") return <NotAvailableCard cc={props.countryCode} />;

  var bill = props.bill;

  return (
    <div className={"print-paper size-" + props.size}>
      {/* IRN callout at top */}
      <div
        style={{
          padding: "10px 12px",
          background: "#f0f4ff",
          border: "1px solid #5b8def",
          borderRadius: "4px",
          marginBottom: "12px",
          display: "grid",
          gridTemplateColumns: "1fr 70px",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <div>
          <div style={miniLabel()}>IRN (Invoice Reference Number)</div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: "9.5px",
              wordBreak: "break-all",
              color: "#1a1a1a",
            }}
          >
            {bill.irn || "pending IRN generation"}
          </div>
          <div style={{ ...miniLabel(), marginTop: "6px" }}>{"Ack No \u00B7 Date"}</div>
          <div style={{ fontFamily: MONO, fontSize: "10px", color: "#1a1a1a" }}>
            {(bill.ack_no || "\u2014") + " \u00B7 " + (bill.ack_date || "\u2014")}
          </div>
        </div>
        <QRCodeSVG
          value={bill.gstn_qr_data || "https://einvoice1.gst.gov.in"}
          size={66}
          level="M"
        />
      </div>

      <StandardInvoiceBody {...props} />
    </div>
  );
}

function NotAvailableCard({ cc }: { cc: string }) {
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
        E-invoice format not available for your country.
      </h3>
      <p style={{ fontSize: "13px", color: "#666" }}>
        E-invoice with IRN is India-only (GSTN-specific). Use Standard tax invoice for {cc} patients.
      </p>
    </div>
  );
}

function miniLabel(): React.CSSProperties {
  return {
    fontFamily: MONO,
    fontSize: "8.5px",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#555",
    marginBottom: "2px",
  };
}
