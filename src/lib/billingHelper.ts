// doc_type auto-selection per GST rules
// GST Notification 12/2017-Central Tax (Rate) — SAC 9993 healthcare exemption

export type BillDocType =
  | 'BILL_OF_SUPPLY'   // GST-exempt medical services (consultation, surgery, nursing)
  | 'TAX_INVOICE'      // GST-applicable (diagnostics, pharmacy, food, non-medical)
  | 'RECEIPT'
  | 'PROFORMA'
  | 'DEBIT_NOTE'
  | 'CREDIT_NOTE'

export type BillCategory =
  | 'CONSULTATION'     // SAC 9993, exempt
  | 'DIAGNOSTIC_LAB'  // GST 12%
  | 'PHARMACY'        // GST 0-12% by HSN
  | 'PROCEDURE'       // Exempt
  | 'PACKAGE'         // Exempt
  | 'IPD_ROOM'        // Exempt
  | 'IPD_FOOD'        // GST 5%
  | 'PHYSIOTHERAPY'   // Exempt
  | 'AMBULANCE'       // Exempt
  | 'INSURANCE_TPA'   // B2B insurance claim
  | 'SELF_PAY_OPD'    // Exempt

export function getDocType(billCategory: BillCategory, countryCode: string): BillDocType {
  if (countryCode === 'AE' || countryCode === 'GB' || countryCode === 'US') {
    return 'TAX_INVOICE'
  }
  // IN: SAC 9993 exempt categories
  const exempt: BillCategory[] = [
    'CONSULTATION', 'PROCEDURE', 'PACKAGE', 'IPD_ROOM',
    'PHYSIOTHERAPY', 'AMBULANCE', 'SELF_PAY_OPD'
  ]
  return exempt.includes(billCategory) ? 'BILL_OF_SUPPLY' : 'TAX_INVOICE'
}

export function getDocTypeLabel(docType: BillDocType, countryCode: string): string {
  if (countryCode === 'AE') return 'Tax Invoice'
  if (countryCode === 'GB') return docType === 'BILL_OF_SUPPLY' ? 'Medical Invoice' : 'VAT Invoice'
  if (countryCode === 'US') return 'Statement / Superbill'
  return docType === 'BILL_OF_SUPPLY' ? 'Bill of Supply' : 'Tax Invoice'
}

export function getEncounterType(billCategory: BillCategory): string {
  if (billCategory === 'IPD_ROOM' || billCategory === 'IPD_FOOD') return 'IPD'
  if (billCategory === 'AMBULANCE') return 'EMERGENCY'
  return 'OPD'
}

export const HSN_SAC_MAP: Record<BillCategory, string> = {
  CONSULTATION:    'SAC 9993',
  DIAGNOSTIC_LAB:  'SAC 9993',
  PHARMACY:        'HSN 3004',
  PROCEDURE:       'SAC 9993',
  PACKAGE:         'SAC 9993',
  IPD_ROOM:        'SAC 9993',
  IPD_FOOD:        'SAC 9963',
  PHYSIOTHERAPY:   'SAC 9993',
  AMBULANCE:       'SAC 9993',
  INSURANCE_TPA:   'SAC 9971',
  SELF_PAY_OPD:    'SAC 9993',
}
