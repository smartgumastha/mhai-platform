// Billing Suite — Helper functions
import type { BillCategory, BillDiscountType, DocType, LineItem, IpdCharges, BillSummary, OPDBillForm } from './billingTypes'

export const HSN_SAC_MAP: Record<BillCategory, string> = {
  CONSULTATION:   'SAC 9993',
  DIAGNOSTIC_LAB: 'SAC 9987',
  PHARMACY:       'HSN 3004',
  PROCEDURE:      'SAC 9993',
  PACKAGE:        'SAC 9993',
  PHYSIOTHERAPY:  'SAC 9993',
  DENTAL:         'SAC 9993',
  DIET:           'HSN 2106',
}

export function getDocType(category: BillCategory, cc: string): DocType {
  if (cc === 'AE' || cc === 'GB' || cc === 'US') return 'TAX_INVOICE'
  if (category === 'DIAGNOSTIC_LAB' || category === 'PHARMACY') return 'TAX_INVOICE'
  return 'BILL_OF_SUPPLY'
}

export function getDocTypeLabel(docType: DocType, cc: string): string {
  if (cc === 'AE') return 'Tax Invoice (5% VAT)'
  if (cc === 'GB') return 'VAT Invoice'
  if (cc === 'US') return 'Superbill'
  return docType === 'BILL_OF_SUPPLY' ? 'Bill of Supply (SAC 9993)' : 'Tax Invoice'
}

export function getHsnSac(category: BillCategory): string {
  return HSN_SAC_MAP[category] || 'SAC 9993'
}

export function getLengthOfStay(admissionDate: string, dischargeDate: string): number {
  if (!admissionDate || !dischargeDate) return 0
  var diff = new Date(dischargeDate).getTime() - new Date(admissionDate).getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function calcLineItemsSubtotal(lineItems: LineItem[]): { subtotal: number; taxAmount: number } {
  var subtotal = 0, taxAmount = 0
  lineItems.forEach(li => {
    var base = li.quantity * li.unitPrice - li.discount
    subtotal += base
    taxAmount += base * li.taxRate / 100
  })
  return { subtotal, taxAmount }
}

function calcIpdSubtotal(charges: IpdCharges, los: number): { subtotal: number; taxAmount: number } {
  var roomTotal = charges.roomRentPerDay * Math.max(1, los)
  var subtotal = roomTotal + charges.nursingCharges + charges.icuCharges +
    charges.otCharges + charges.consultationCharges + charges.pharmacyCharges +
    charges.equipmentImplants + charges.consumables + charges.investigationLab +
    charges.radiologyCharges + charges.dietFoodCharges + charges.miscellaneous
  var taxAmount = charges.dietFoodCharges * 0.05
  return { subtotal, taxAmount }
}

export function calcBillSummary(
  form: Pick<OPDBillForm, 'billType' | 'lineItems' | 'ipdCharges' | 'discountType' | 'discountValue' | 'advanceAmount' | 'admissionDate' | 'dischargeDate'>
): BillSummary {
  var los = getLengthOfStay(form.admissionDate, form.dischargeDate)
  var { subtotal, taxAmount } = form.billType === 'IPD'
    ? calcIpdSubtotal(form.ipdCharges, los)
    : calcLineItemsSubtotal(form.lineItems)
  var discountAmount = form.discountType === 'PERCENT'
    ? Math.round(subtotal * form.discountValue) / 100
    : form.discountValue
  var netAmount = Math.max(0, subtotal - discountAmount + taxAmount)
  var balanceDue = Math.max(0, netAmount - form.advanceAmount)
  return { subtotal, discountAmount, taxAmount, netAmount, advancePaid: form.advanceAmount, balanceDue }
}

export function validateBillForm(form: OPDBillForm, cc: string): { valid: boolean; errors: Record<string, string> } {
  var errors: Record<string, string> = {}
  if (!form.patientName.trim()) errors.patientName = 'Patient name is required'
  if (!form.billDate)           errors.billDate    = 'Bill date is required'
  if (!form.serviceDate)        errors.serviceDate = 'Service date is required'
  if (!form.patientGender)      errors.patientGender = 'Please select a gender'
  if (form.billType === 'IPD') {
    if (!form.admissionDate) errors.admissionDate = 'Admission date required for IPD'
    if (!form.dischargeDate) errors.dischargeDate = 'Discharge date required for IPD'
  }
  if (form.supplyType === 'B2B' && cc === 'AE') {
    if (!form.emiratesId && !form.passportNumber)
      errors.emiratesId = 'Emirates ID or Passport required for insured AE patients'
    if (!form.icd10Primary)
      errors.icd10Primary = 'ICD-10-CM diagnosis code required for AE insurance'
    if (form.cardExpiryDate && new Date(form.cardExpiryDate) < new Date())
      errors.cardExpiryDate = 'Insurance card has expired — DHA will reject this claim'
  }
  if (form.billType !== 'IPD' && !form.lineItems.some(li => li.description.trim()))
    errors.lineItems = 'Add at least one service or item'
  return { valid: Object.keys(errors).length === 0, errors }
}

// Currency → bill API field
export function getCurrency(cc: string): string {
  if (cc === 'AE') return 'AED'
  if (cc === 'GB') return 'GBP'
  if (cc === 'US') return 'USD'
  return 'INR'
}

// Map form billType to API expected lowercase value
export function apiBillType(bt: string): string {
  const map: Record<string, string> = {
    OPD: 'consultation', IPD: 'inpatient', LAB: 'diagnostic', PHARMACY: 'pharmacy', PACKAGE: 'consultation'
  }
  return map[bt] || 'consultation'
}

// Map supplyType to API bill_category
export function apiBillCategory(supplyType: string): string {
  return supplyType === 'B2B' ? 'insurance' : 'self_pay'
}
