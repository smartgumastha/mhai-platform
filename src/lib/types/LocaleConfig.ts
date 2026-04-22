// src/lib/types/LocaleConfig.ts
//
// Types for the LOCALE_CONFIG contract. Each country's widget rendering
// reads from here. DB enum values stay identical across markets —
// only display strings and consent pattern vary.

import type { UrgencyLevel, AppointmentType, ConsultationMode } from './MhaiAppointment';

export type CountryCode = 'IN' | 'AE' | 'GB' | 'US';

export type ConsentPattern = 'itemized' | 'npp_acknowledgment';

export type TextDirection = 'ltr' | 'rtl';

export type PaymentGateway = 'razorpay' | 'stripe' | 'telr' | 'checkout';

export interface LocaleLabels {
  // Tab labels (localised per country vocabulary)
  tab_in_person: string;
  tab_teleconsult: string;
  tab_followup: string;
  tab_second_opinion: string;
  tab_home_visit: string;
  tab_emergency: string;

  // Tab subtexts
  subtext_in_person: string;
  subtext_teleconsult: string;
  subtext_followup: string;
  subtext_second_opinion: string;
  subtext_home_visit: string;
  subtext_emergency: string;

  // Form labels
  label_name: string;
  label_phone: string;
  label_date: string;
  label_time: string;
  label_reason: string;
  label_urgency: string;
  reason_placeholder: string;

  // Urgency tier labels (localised)
  urgency_scheduled: string;
  urgency_scheduled_sub: string;
  urgency_routine: string;
  urgency_routine_sub: string;
  urgency_soon: string;
  urgency_soon_sub: string;
  urgency_urgent: string;
  urgency_urgent_sub: string;

  // Consent block
  consent_title: string;
  consent_summary: string;
  consent_purpose_1_title: string;
  consent_purpose_1_desc: string;
  consent_purpose_2_title: string;
  consent_purpose_2_desc: string;
  consent_purpose_3_title?: string;
  consent_purpose_3_desc?: string;
  consent_required_suffix: string;
  consent_read_full: string;
  consent_manage: string;

  // NPP (US only)
  npp_title?: string;
  npp_summary?: string;
  npp_acknowledgment_label?: string;
  npp_footer?: string;

  // Submit
  submit_confirm: string;
  submit_emergency: string;
  submit_disabled_msg: string;
  trust_line: string;
}

export interface LocaleConfig {
  country_code: CountryCode;

  // Formatting
  phone_prefix: string;
  phone_placeholder: string;
  currency: 'INR' | 'AED' | 'GBP' | 'USD';
  currency_symbol: string;
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  text_direction: TextDirection;

  // Languages (BCP 47 tags)
  default_language: string;      // e.g. 'en-IN'
  supported_languages: string[]; // e.g. ['en-IN', 'hi-IN', 'te-IN', ...]

  // Consent
  consent_pattern: ConsentPattern;
  consent_jurisdiction: string;  // e.g. 'DPDPA_2023_IN'
  consent_version: string;       // e.g. 'v1_2026_04'
  marketing_in_widget: boolean;  // US=false (HIPAA §164.508)

  // Urgency vocabulary
  urgency_style: 'standard' | 'nhs_colours'; // NHS colours for GB

  // Emergency CTA addendum (US: "call 911", UK: "call 999")
  emergency_call_disclaimer?: string;

  // Compliance footer
  footer_compliance: string;
  regulator_name: string;
  grievance_required: boolean;

  // Payments (for Step 6+)
  payment_gateway: PaymentGateway;

  // Tab visibility overrides (future — all markets show all 6 for now)
  // hidden_tabs?: string[];
}

export interface LocaleBundle {
  config: LocaleConfig;
  labels: LocaleLabels;
  lang_code: string;           // active language from supported_languages
}
