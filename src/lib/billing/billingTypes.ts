// Billing Suite — TypeScript types
// Shared across /dashboard/billing/* pages

export type BillType        = 'OPD' | 'IPD' | 'LAB' | 'PHARMACY' | 'PACKAGE'
export type BillStatus      = 'DRAFT' | 'PENDING_APPROVAL' | 'FINAL' | 'VOID' | 'CANCELLED'
export type BillCategory    = 'CONSULTATION' | 'DIAGNOSTIC_LAB' | 'PHARMACY' | 'PROCEDURE' | 'PACKAGE' | 'PHYSIOTHERAPY' | 'DENTAL' | 'DIET'
export type BillDiscountType = 'PERCENT' | 'AMOUNT'
export type PaymentMode     = 'CASH' | 'UPI' | 'CARD' | 'ONLINE_LINK' | 'TPA' | 'CREDIT'
export type SupplyType      = 'B2C' | 'B2B'
export type DocType         = 'BILL_OF_SUPPLY' | 'TAX_INVOICE'
export type Gender          = 'MALE' | 'FEMALE' | 'OTHER'

export interface LineItem {
  id: string
  description: string
  hsnSac: string
  serviceDate: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
  amount: number
}

export interface IpdCharges {
  roomRentPerDay: number
  nursingCharges: number
  icuCharges: number
  otCharges: number
  consultationCharges: number
  pharmacyCharges: number
  equipmentImplants: number
  consumables: number
  investigationLab: number
  radiologyCharges: number
  dietFoodCharges: number
  miscellaneous: number
}

export interface OPDBillForm {
  billDate: string
  serviceDate: string
  admissionDate: string
  dischargeDate: string
  wardCategory: string
  billType: BillType
  billStatus: BillStatus
  billCategory: BillCategory
  supplyType: SupplyType
  patientId: string
  uhid: string
  patientName: string
  patientPhone: string
  patientAddress: string
  patientAge: string
  patientGender: Gender | ''
  abhaNumber: string
  emiratesId: string
  nationalityCode: string
  passportNumber: string
  referringDoctor: string
  attendingDoctor: string
  doctorSpecialty: string
  visitType: string
  icd10Primary: string
  cptCode: string
  presentingComplaint: string
  payerId: string
  memberCardNumber: string
  policyNumber: string
  cardExpiryDate: string
  cashlessOrReimbursement: string
  insuranceApprovedAmount: number
  patientCopay: number
  preAuthNumber: string
  ipdCharges: IpdCharges
  lineItems: LineItem[]
  discountType: BillDiscountType
  discountValue: number
  discountReason: string
  approvedBy: string
  approvalStatus: string
  advanceAmount: number
  advanceDate: string
  advanceRef: string
  advanceType: string
  paymentMode: PaymentMode
  amountPaid: number
  notes: string
}

export interface BillSummary {
  subtotal: number
  discountAmount: number
  taxAmount: number
  netAmount: number
  advancePaid: number
  balanceDue: number
}

export interface PayerOption {
  id: string
  payer_name: string
  payer_code: string
  country_code: string
  payer_type: string
  claim_format: string
  network_name: string | null
}
