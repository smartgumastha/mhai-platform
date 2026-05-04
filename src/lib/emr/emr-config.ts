// EMR locale config — single source of truth for per-country EMR behaviour
// Driven by hospital.country_code via useLocale()
// Competitor research: HealthPlix (IN), MedicoPlus (AE), Semble (GB), Tebra (US)
// Library refs: mhai-library/01_countries/{IN,AE,GB,US}/04_EMR/

import type { EmrConfig, CountryCode, DrugSchedule } from './emr-types';

var IN_DRUG_SCHEDULES: { value: DrugSchedule; label: string }[] = [
  { value: 'none',  label: 'Regular' },
  { value: 'IN_H',  label: 'Schedule H (Rx-only)' },
  { value: 'IN_H1', label: 'Schedule H1 (Antibiotic)' },
  { value: 'IN_X',  label: 'Schedule X (Controlled)' },
];

var AE_DRUG_SCHEDULES: { value: DrugSchedule; label: string }[] = [
  { value: 'none',      label: 'Regular' },
  { value: 'AE_ListIV', label: 'List IV (Controlled)' },
  { value: 'AE_ListIII',label: 'List III (Controlled)' },
  { value: 'AE_ListII', label: 'List II — Psychotropic' },
  { value: 'AE_ListI',  label: 'List I — Narcotic' },
];

var GB_DRUG_SCHEDULES: { value: DrugSchedule; label: string }[] = [
  { value: 'none',   label: 'Regular' },
  { value: 'GB_CD3', label: 'CD Schedule 3' },
  { value: 'GB_CD2', label: 'CD Schedule 2' },
];

var US_DRUG_SCHEDULES: { value: DrugSchedule; label: string }[] = [
  { value: 'none',    label: 'Regular' },
  { value: 'US_CV',   label: 'Schedule V' },
  { value: 'US_CIV',  label: 'Schedule IV' },
  { value: 'US_CIII', label: 'Schedule III' },
  { value: 'US_CII',  label: 'Schedule II (requires DEA)' },
];

export var EMR_CONFIG: Record<CountryCode, EmrConfig> = {

  IN: {
    cc: 'IN',

    // ICD-10 is primary; SNOMED CT used in ABDM FHIR resources
    diagnosis_system: 'ICD-10',
    diagnosis_system_label: 'ICD-10',
    procedure_system: 'none',
    show_procedure_code: false,

    // NMC mandate: generic names first, brand optional in brackets
    drug_name_style: 'generic_first',
    drug_name_hint: 'Generic name (e.g. Amoxicillin)',
    show_drug_brand: true,
    show_drug_form: true,
    show_drug_schedule: true,
    drug_schedules: IN_DRUG_SCHEDULES,
    rx_header_fields: ['nmc_reg_no'],
    controlled_drug_warning: 'Schedule X: Issue 2-copy prescription. Retain pharmacy copy for 2 years.',

    patient_id_fields: [
      { key: 'uhid',    label: 'UHID',        required: false },
      { key: 'abha_id', label: 'ABHA Number', required: false, format: 'XX-XXXX-XXXX-XXXX' },
      { key: 'phone',   label: 'Phone',       required: true,  format: '+91 XXXXX XXXXX' },
    ],

    has_sick_note: true,
    sick_note_label: 'Medical Certificate',
    sick_note_max_days: 90,
    has_referral_letter: true,

    diagnosis_label: 'Diagnosis',
    plan_label: 'Plan / Management',
    subjective_label: 'Subjective — Chief Complaint & History',
    objective_label: 'Objective — Examination Findings',

    compliance_badge: 'NMC',
    compliance_note: 'Generic names mandatory (NMC). ABHA linkage recommended for ABDM.',

    temp_unit: '°F',
    date_format: 'DD/MM/YYYY',
    rtl: false,
  },

  AE: {
    cc: 'AE',

    // ICD-10 mandatory for NABIDH; CPT mandatory for insurance procedure billing
    diagnosis_system: 'ICD-10',
    diagnosis_system_label: 'ICD-10 (DHA/NABIDH)',
    procedure_system: 'CPT',
    show_procedure_code: true,

    // UAE: both generic AND brand name required
    drug_name_style: 'both_required',
    drug_name_hint: 'Generic name (INN)',
    show_drug_brand: true,
    show_drug_form: true,
    show_drug_schedule: true,
    drug_schedules: AE_DRUG_SCHEDULES,
    rx_header_fields: ['dha_license_no'],
    controlled_drug_warning: 'List I (Narcotic): Use DHA narcotic form. Dispensable within 2 days. List II (Psychotropic): Dispensable within 3 days.',

    patient_id_fields: [
      { key: 'emirates_id',      label: 'Emirates ID',      required: true,  format: '784-XXXX-XXXXXXX-X' },
      { key: 'insurance_member', label: 'Insurance Card No',required: false },
      { key: 'uhid',             label: 'NABIDH UHID',       required: false },
    ],

    has_sick_note: true,
    sick_note_label: 'Sick Leave (DHA)',
    sick_note_max_days: 30,         // GP max 3 days; specialist max 30 per visit
    has_referral_letter: true,

    diagnosis_label: 'Diagnosis (ICD-10)',
    plan_label: 'Management Plan',
    subjective_label: 'Subjective — Presenting Complaint',
    objective_label: 'Objective — Clinical Examination',

    compliance_badge: 'DHA/NABIDH',
    compliance_note: 'Emirates ID + ICD-10 + CPT required for all NABIDH submissions and insurance claims.',

    temp_unit: '°F',
    date_format: 'DD/MM/YYYY',
    rtl: false,  // clinic UI is English; prescription can be bilingual
  },

  GB: {
    cc: 'GB',

    // SNOMED CT mandatory under SCCI0034 (Health & Social Care Act 2012)
    diagnosis_system: 'SNOMED-CT',
    diagnosis_system_label: 'SNOMED CT (NHS mandate)',
    procedure_system: 'OPCS-4',
    show_procedure_code: false,  // OPCS-4 is secondary care; private clinics rarely need it

    // UK: generic preferred; brand only if clinically required
    drug_name_style: 'generic_or_brand',
    drug_name_hint: 'Generic / BNF name (e.g. amoxicillin)',
    show_drug_brand: true,
    show_drug_form: true,
    show_drug_schedule: true,
    drug_schedules: GB_DRUG_SCHEDULES,
    rx_header_fields: ['gmc_number'],
    controlled_drug_warning: 'CD Schedule 2 & 3: Quantity must appear in words AND figures. Prescriber CD identifier required.',

    patient_id_fields: [
      { key: 'nhs_number', label: 'NHS Number', required: false, format: 'XXX XXX XXXX' },
      { key: 'uhid',       label: 'Patient Ref', required: false },
      { key: 'phone',      label: 'Phone',       required: true, format: '+44 XXXX XXXXXX' },
    ],

    has_sick_note: true,
    sick_note_label: 'Fit Note (Med3)',
    sick_note_max_days: 28,         // Med3 guidance: max 3 months first cert; GP norm ~1-4 weeks
    has_referral_letter: true,

    diagnosis_label: 'Clinical Impression (SNOMED CT)',
    plan_label: 'Management Plan',
    subjective_label: 'Presenting Complaint & History',
    objective_label: 'Examination Findings',

    compliance_badge: 'CQC/UK GDPR',
    compliance_note: 'SNOMED CT required (SCCI0034). GMC number on private prescription. Med3 valid from private GPs.',

    temp_unit: '°C',
    date_format: 'DD/MM/YYYY',
    rtl: false,
  },

  US: {
    cc: 'US',

    // ICD-10-CM mandatory under HIPAA; CPT for procedures (AMA)
    diagnosis_system: 'ICD-10-CM',
    diagnosis_system_label: 'ICD-10-CM (HIPAA)',
    procedure_system: 'CPT',
    show_procedure_code: true,

    // US: prescriber specifies generic or "dispense as written" (brand)
    drug_name_style: 'generic_or_brand',
    drug_name_hint: 'Drug name (generic preferred)',
    show_drug_brand: true,
    show_drug_form: true,
    show_drug_schedule: true,
    drug_schedules: US_DRUG_SCHEDULES,
    rx_header_fields: ['npi', 'dea_number'],
    controlled_drug_warning: 'Schedule II: EPCS required (CMS mandate Jan 2023). DEA number mandatory. Two-factor authentication required for e-signing.',

    patient_id_fields: [
      { key: 'mrn',       label: 'MRN',             required: false },
      { key: 'ins_member',label: 'Insurance Member', required: false },
      { key: 'dob',       label: 'Date of Birth',    required: true, format: 'MM/DD/YYYY' },
    ],

    has_sick_note: true,
    sick_note_label: 'Return to Work Letter',
    sick_note_max_days: 365,        // No statutory limit; physician discretion
    has_referral_letter: true,

    diagnosis_label: 'Diagnosis (ICD-10-CM)',
    plan_label: 'Assessment & Plan',
    subjective_label: 'Subjective — HPI & ROS',
    objective_label: 'Objective — Physical Examination',

    compliance_badge: 'HIPAA',
    compliance_note: 'ICD-10-CM + CPT required for CMS-1500 claims. DEA number for Schedule II–V. EPCS mandatory.',

    temp_unit: '°F',
    date_format: 'MM/DD/YYYY',
    rtl: false,
  },
};

export function getEmrConfig(countryCode: string | null | undefined): EmrConfig {
  var cc = (countryCode as CountryCode) || 'IN';
  return EMR_CONFIG[cc] || EMR_CONFIG.IN;
}
