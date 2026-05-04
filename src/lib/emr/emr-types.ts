// EMR types — shared across all locales
// Country-specific behaviour is driven by EmrConfig (emr-config.ts)

export type CountryCode = 'IN' | 'AE' | 'GB' | 'US';

// ─── Clinical coding ──────────────────────────────────────────────────────────

export type DiagnosisCodingSystem = 'ICD-10' | 'ICD-10-CM' | 'SNOMED-CT';
export type ProcedureCodingSystem = 'CPT' | 'OPCS-4' | 'ICD-10-PCS' | 'none';

export type DiagnosisCode = {
  code: string;
  description: string;
  system: DiagnosisCodingSystem;
};

export type ProcedureCode = {
  code: string;
  description: string;
  system: ProcedureCodingSystem;
};

// ─── Prescription ─────────────────────────────────────────────────────────────

export type DrugSchedule =
  | 'none'
  | 'IN_H'      // India Schedule H (prescription-only)
  | 'IN_H1'     // India Schedule H1 (narrow-spectrum antibiotics)
  | 'IN_X'      // India Schedule X (controlled)
  | 'AE_ListI'  // UAE List I (narcotics)
  | 'AE_ListII' // UAE List II (psychotropics)
  | 'AE_ListIII'
  | 'AE_ListIV'
  | 'GB_CD2'    // UK Controlled Drug Schedule 2
  | 'GB_CD3'    // UK Controlled Drug Schedule 3
  | 'US_CII'    // US DEA Schedule II
  | 'US_CIII'   // US DEA Schedule III
  | 'US_CIV'    // US DEA Schedule IV
  | 'US_CV';    // US DEA Schedule V

export type RxRow = {
  id: string;
  drug_generic: string;
  drug_brand: string;
  strength: string;
  form: string;           // Tablet, Capsule, Syrup, Injection, Cream, Drops
  route: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions: string;
  schedule: DrugSchedule;
  is_controlled: boolean;
};

// ─── Allergies ────────────────────────────────────────────────────────────────

export type AllergyReactionType = 'anaphylaxis' | 'rash' | 'nausea' | 'other' | 'unknown';

export type AllergyRow = {
  id: string;
  allergen: string;       // drug name or substance
  reaction: string;       // free text
  reaction_type: AllergyReactionType;
  severity: 'mild' | 'moderate' | 'severe' | 'unknown';
};

// ─── Vitals ───────────────────────────────────────────────────────────────────

export type VitalsRecord = {
  bp_systolic?: number;
  bp_diastolic?: number;
  pulse_rate?: number;
  temperature?: number;   // °F (standard in IN/AE); converted from °C for GB/US
  spo2?: number;
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
  chief_complaint?: string;
  nurse_notes?: string;
  recorded_at?: number;
};

// ─── Lab orders ───────────────────────────────────────────────────────────────

export type LabOrder = {
  id: string;
  test_name: string;
  loinc_code?: string;
  clinical_indication: string;
  urgent: boolean;
};

// ─── SOAP note ────────────────────────────────────────────────────────────────

export type SoapNote = {
  subjective: string;           // HPI + patient-reported symptoms
  objective: string;            // Examination findings (vitals captured separately)
  assessment: string;           // Clinical impression / differential
  plan: string;                 // Management plan, investigations, referrals
  follow_up_date?: string;      // ISO date
  follow_up_notes?: string;
};

// ─── Regulatory documents ─────────────────────────────────────────────────────

export type SickNoteData = {
  duration_days: number;
  general_reason: string;       // "illness/fever" — not full diagnosis (for IN/GB)
  diagnosis_for_ae?: string;    // UAE sick leave requires diagnosis text
  icd10_for_ae?: string;        // UAE sick leave requires ICD-10
  fit_for_work?: 'not_fit' | 'may_be_fit';    // GB Med3 wording
  restrictions?: string;        // GB Med3 restrictions when "may be fit"
};

export type ReferralData = {
  referred_to_specialty: string;
  referred_to_facility?: string;
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  summary: string;
};

// ─── Full visit record ────────────────────────────────────────────────────────

export type VisitRecord = {
  token_id: string;
  patient_id: string;
  doctor_id: string;
  soap: SoapNote;
  primary_diagnosis?: DiagnosisCode;
  differential_diagnoses?: DiagnosisCode[];
  procedure_codes?: ProcedureCode[];     // AE (CPT) + US (CPT) mandatory for billing
  prescriptions: RxRow[];
  lab_orders?: LabOrder[];
  allergies?: AllergyRow[];              // Updated during this visit
  sick_note?: SickNoteData;
  referral?: ReferralData;
  nmc_reg_no?: string;                   // IN: NMC/MCI registration number
  dha_license_no?: string;               // AE: DHA physician license
  gmc_number?: string;                   // GB: GMC registration
  npi?: string;                          // US: National Provider Identifier
  dea_number?: string;                   // US: DEA for controlled substances
};

// ─── Per-locale EMR config ────────────────────────────────────────────────────

export type EmrConfig = {
  cc: CountryCode;

  // Clinical coding
  diagnosis_system: DiagnosisCodingSystem;
  diagnosis_system_label: string;         // "ICD-10", "SNOMED CT"
  procedure_system: ProcedureCodingSystem;
  show_procedure_code: boolean;

  // Prescription
  drug_name_style: 'generic_first' | 'both_required' | 'generic_or_brand';
  drug_name_hint: string;                 // placeholder text
  show_drug_brand: boolean;
  show_drug_form: boolean;
  show_drug_schedule: boolean;
  drug_schedules: { value: DrugSchedule; label: string }[];
  rx_header_fields: Array<'nmc_reg_no' | 'dha_license_no' | 'gmc_number' | 'npi' | 'dea_number'>;
  controlled_drug_warning: string | null;

  // Patient identifiers displayed in EMR header
  patient_id_fields: Array<{
    key: string;
    label: string;
    required: boolean;
    format?: string;
  }>;

  // Regulatory documents available
  has_sick_note: boolean;
  sick_note_label: string;               // "Medical Certificate" / "Sick Leave (DHA)" / "Fit Note (Med3)" / "Return to Work"
  sick_note_max_days: number;
  has_referral_letter: boolean;

  // UI labels
  diagnosis_label: string;              // "Diagnosis" or "Clinical Impression"
  plan_label: string;                   // "Plan" or "Management"
  subjective_label: string;
  objective_label: string;

  // Compliance
  compliance_badge: string;             // "NMC", "DHA/NABIDH", "CQC/GDPR", "HIPAA"
  compliance_note: string;             // Short note shown in UI

  // Temp unit display
  temp_unit: '°F' | '°C';

  // Date format
  date_format: string;

  // Language / direction
  rtl: boolean;
};
