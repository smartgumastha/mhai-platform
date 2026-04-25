export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "UNKNOWN";
export type PaymentType = "SELF" | "TPA" | "CASHLESS" | "PMJAY" | "CORPORATE" | "NHS" | "MEDICARE" | "MEDICAID";

export interface Patient {
  id: string;
  patient_id?: string;
  hospital_id?: string;
  uhid: string;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  phone?: string;
  phone_alt?: string;
  email?: string;
  date_of_birth?: string;         // exact DB column name (DATE)
  age?: number;
  age_unit?: string;
  gender?: Gender;
  blood_group?: BloodGroup;
  occupation?: string;
  // Address
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;                 // DB column: state (not state_province)
  pincode?: string;               // DB column: pincode (not postal_code)
  district?: string;
  // Emergency contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string; // exact DB column name
  // Government IDs
  abha_id?: string;               // exact DB column name (not abha_number)
  abha_address?: string;
  abha_verified?: boolean;
  emirates_id?: string;
  nationality_code?: string;
  passport_number?: string;
  id_type?: string;
  // Insurance
  insurance_card_number?: string;
  insurance_card_expiry?: string; // DATE
  insurance_payer_id?: string;
  insurance_status?: string;
  insurance_id?: string;
  payment_type?: string;          // alias for insurance_status
  // Other IDs
  pm_jay_id?: string;
  aadhar_number?: string;
  // Registration
  referred_by?: string;
  registration_mode?: string;
  notes?: string;
  preferred_language?: string;
  // Status & visits
  is_active?: boolean;
  first_visit_at?: string | number;
  last_visit_at?: string | number;
  last_visit_date?: string | number;
  total_visits?: number;
  visit_count?: number;
  created_at?: string | number;
  updated_at?: string | number;
}

export interface ICD10Code {
  code: string;
  description: string;
}

export interface PatientDeposit {
  id?: string;
  patient_id?: string;
  hospital_id?: string;
  amount: number;
  deposit_date: string;
  receipt_ref?: string;
  deposit_type?: string;
  status?: string;
  created_at?: string | number;
}
