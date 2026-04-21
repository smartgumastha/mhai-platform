import { getToken } from "@/lib/api";

export type CountryCode = "IN" | "US" | "GB" | "AE";

export type Bill = {
  id?: string;
  bill_number?: string;
  bill_date?: number;
  patient_name?: string;
  patient_phone?: string;
  supply_type?: string;
  place_of_supply_name?: string;
  taxable_amount?: number;
  subtotal?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  tax_amount?: number;
  total_amount?: number;
  paid_amount?: number;
  balance?: number;
  payment_method?: string;
  payment_ref?: string;
  paid_at?: number;
  buyer_gstin?: string;
  buyer_vat?: string;
  buyer_trn?: string;
  buyer_name?: string;
  buyer_address?: string;
  insurer_name?: string;
  insurer_npi?: string;
  scheme_name?: string;
  beneficiary_id?: string;
  preauth_no?: string;
  package_code?: string;
  patient_copay?: number;
  scheme_payable?: number;
  irn?: string;
  ack_no?: string;
  ack_date?: string;
  gstn_qr_data?: string;
  gstin?: string;
  items?: BillItem[];
};

export type BillItem = {
  description?: string;
  name?: string;
  hsn_sac?: string;
  cpt_code?: string;
  snomed_code?: string;
  quantity?: number;
  rate?: number;
  amount?: number;
  gst_rate?: number;
  tax_rate?: number;
};

export type ClinicPreferences = {
  hospital_id?: string;
  clinic_name?: string;
  address?: string;
  state?: string;
  logo_url?: string;
  letterhead_url?: string;
  default_signature_url?: string;
  gstin?: string;
  vat_number?: string;
  company_number?: string;
  trn?: string;
  npi?: string;
  ein?: string;
};

export type PrintPrefs = {
  clinic_preferences?: ClinicPreferences;
  user_preferences?: { default_print_format?: string; default_paper_size?: string };
};

export type PaperSize = "a4" | "a5" | "thermal";

export type PrintComponentProps = {
  bill: Bill;
  prefs?: PrintPrefs;
  countryCode: CountryCode;
  size: PaperSize;
};

export function formatCurrency(amount: number | undefined, countryCode: CountryCode): string {
  var locales: Record<CountryCode, { code: string; locale: string }> = {
    IN: { code: "INR", locale: "en-IN" },
    US: { code: "USD", locale: "en-US" },
    GB: { code: "GBP", locale: "en-GB" },
    AE: { code: "AED", locale: "en-AE" },
  };
  var cfg = locales[countryCode] || locales.IN;
  var n = amount || 0;
  try {
    return new Intl.NumberFormat(cfg.locale, { style: "currency", currency: cfg.code, minimumFractionDigits: 2 }).format(n);
  } catch (e) {
    var sym: Record<string, string> = { INR: "\u20B9", USD: "$", GBP: "\u00A3", AED: "AED " };
    return (sym[cfg.code] || "") + n.toFixed(2);
  }
}

export function formatDate(timestamp: number | undefined, countryCode: CountryCode): string {
  var d = new Date(timestamp || Date.now());
  if (countryCode === "IN") return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
  if (countryCode === "US") return d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
  if (countryCode === "GB") return d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  if (countryCode === "AE") return d.toLocaleDateString("en-GB");
  return d.toISOString().slice(0, 10);
}

export function getTaxIdLabel(countryCode: CountryCode): string {
  var labels: Record<CountryCode, string> = { IN: "GSTIN", US: "NPI / EIN", GB: "VAT No", AE: "TRN" };
  return labels[countryCode] || "Tax ID";
}

export function getDocTypeLabel(countryCode: CountryCode): string {
  var labels: Record<CountryCode, string> = { IN: "Tax Invoice", US: "Invoice", GB: "VAT Invoice", AE: "Tax Invoice" };
  return labels[countryCode] || "Invoice";
}

export function getCodeLabel(countryCode: CountryCode): string {
  var labels: Record<CountryCode, string> = { IN: "HSN/SAC", US: "CPT", GB: "SNOMED", AE: "Code" };
  return labels[countryCode] || "Code";
}

export function getCompliancePhrase(countryCode: CountryCode): string {
  var phrases: Record<CountryCode, string> = {
    IN: "Computer-generated invoice \u00B7 FY 2026-27",
    US: "Computer-generated invoice \u00B7 Fiscal year: calendar",
    GB: "Registered in England & Wales \u00B7 GDPR",
    AE: "DED registered \u00B7 Fiscal year: calendar",
  };
  return phrases[countryCode] || "";
}

export function getQRVerifyUrl(billNumber: string | undefined, countryCode: CountryCode): string {
  var domains: Record<CountryCode, string> = { IN: "medihost.in", US: "medihost.com", GB: "medihost.co.uk", AE: "medihost.ae" };
  var domain = domains[countryCode] || "medihost.in";
  return "https://" + domain + "/verify/" + (billNumber || "unknown");
}

export function amountInWords(amount: number | undefined, countryCode: CountryCode): string | null {
  if (countryCode !== "IN") return null;
  if (!amount) return "Zero rupees only";
  var n = Math.floor(amount);
  return n.toLocaleString("en-IN") + " rupees only (in words)";
}

export async function logPrintAudit(billId: string, format: string, size: string, countryCode: string): Promise<void> {
  try {
    var token = getToken();
    if (!token) return;
    await fetch("/api/bills/" + billId + "/print-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ format: format, paper_size: size, country_code: countryCode, action: "print" }),
    });
  } catch (e) {
    // silent — audit is advisory
  }
}
