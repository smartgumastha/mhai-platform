// src/lib/types/MhaiAppointment.ts
//
// TypeScript types for the MHAI appointment domain.
//
// Schema source: smartgumastha-backend mhai_appointments table
//   (after ARetrofit-1 Step 3 DDL, 2026-04-22).
//
// 9 Step 3 additions: appointment_type, appointment_type_snomed,
//   service_type_snomed, consultation_mode, urgency, cancellation_reason,
//   triage_source, attribution_urgency_signal, ai_suggested_urgency.

// ─────────────────────────────────────────────────────────────
// Enums (mirror backend src/api/helpers/appointmentValidation.js)
// ─────────────────────────────────────────────────────────────

export type AppointmentType =
  | 'ROUTINE'
  | 'WALKIN'
  | 'CHECKUP'
  | 'FOLLOWUP'
  | 'EMERGENCY'
  | 'TELECONSULT'
  | 'SECOND_OPINION'
  | 'HOME_VISIT'
  | 'DAY_CARE'
  | 'ANC_VISIT'
  | 'IMMUNIZATION'
  | 'PRE_SURGERY'
  | 'POST_SURGERY'
  | 'DIAGNOSTIC';

export type ConsultationMode =
  | 'IMP'
  | 'VIRTUAL'
  | 'VIDEO'
  | 'AUDIO'
  | 'CHAT'
  | 'ASYNC'
  | 'HOME';

export type UrgencyLevel =
  | 'EMERGENCY'
  | 'URGENT'
  | 'SOON'
  | 'ROUTINE'
  | 'SCHEDULED';

export type TriageSource =
  | 'manual'
  | 'ai_suggested'
  | 'ai_confirmed'
  | 'ai_overridden'
  | 'patient_self_rated'
  | 'attribution_signal'
  | 'protocol_based';

export type CancellationReason =
  | 'patient_request'
  | 'clinic_request'
  | 'no_show'
  | 'weather'
  | 'technical'
  | 'duplicate_booking'
  | 'admin_error'
  | 'other';

export type AppointmentStatus =
  | 'booked'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'no_show'
  | 'cancelled';

// ─────────────────────────────────────────────────────────────
// Attribution signal (JSONB column)
// ─────────────────────────────────────────────────────────────

export interface AttributionUrgencySignalConsent {
  accepted: boolean;
  text_hash?: string | null;
  text_language?: string | null;
  version?: string | null;
  jurisdiction?: string | null;
  captured_at?: number;
}

export interface AttributionUrgencySignal {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  landing_page?: string | null;
  referrer_url?: string | null;
  first_touch_at?: string | null;
  device_type?: string | null;
  session_id?: string | null;
  keyword_urgency_score?: number;
  time_to_book_seconds?: number | null;
  signals_triggered?: string[];
  captured_at?: number;
  // Present when public booking captures DPDPA consent payload
  consent?: AttributionUrgencySignalConsent;
}

// ─────────────────────────────────────────────────────────────
// Main appointment record
// ─────────────────────────────────────────────────────────────

export interface MhaiAppointment {
  id: string;                   // Snowflake BIGINT serialized as string
  hospital_id: string;
  patient_id?: string | null;
  doctor_id?: string | null;

  // Temporal (canonical in this table — NOT start_at)
  slot_date: string;            // 'YYYY-MM-DD'
  slot_time: string;            // 'HH:MM:SS'
  duration_minutes: number;

  // Status + origin
  status: AppointmentStatus;
  source: string;               // 'website' | 'whatsapp' | 'walk_in' | 'phone' | 'referral'

  // Patient contact
  patient_name?: string | null;
  patient_phone?: string | null;
  patient_email?: string | null;
  specialty?: string | null;
  reason?: string | null;
  notes?: string | null;

  // Step 3 DDL additions (2026-04-22)
  appointment_type: AppointmentType;
  appointment_type_snomed?: string | null;
  service_type_snomed?: string | null;
  consultation_mode: ConsultationMode;
  urgency: UrgencyLevel;
  cancellation_reason?: CancellationReason | null;
  triage_source: TriageSource;
  attribution_urgency_signal?: AttributionUrgencySignal | null;
  ai_suggested_urgency?: UrgencyLevel | null;

  // Attribution (April 20 schema; populated by Step 5c route rewrite)
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  first_touch_at?: string | null;
  referrer_url?: string | null;

  // Lifecycle
  created_at: string;
  updated_at: string;
  cancelled_by?: string | null;
  cancelled_reason?: string | null;
  reminder_sent?: boolean | null;
  coin_earned?: number | null;
}

// ─────────────────────────────────────────────────────────────
// Wrapper input types
// ─────────────────────────────────────────────────────────────

export interface AppointmentFilter {
  status?: AppointmentStatus;
  from_date?: string;           // 'YYYY-MM-DD'
  to_date?: string;
  doctor_id?: string;
  patient_id?: string;
  urgency?: UrgencyLevel;
}

// createAppointment on AUTHENTICATED path (mhaiAppointments.js POST)
// hospital_id + slot_date + slot_time are the only hard requirements;
// the rest are optional and get DB defaults if absent.
export interface CreateAppointmentInput {
  slot_date: string;
  slot_time: string;
  duration_minutes?: number;
  patient_id?: string;
  doctor_id?: string;
  status?: AppointmentStatus;
  source?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  specialty?: string;
  reason?: string;
  notes?: string;

  // Step 3 DDL fields
  appointment_type?: AppointmentType;
  appointment_type_snomed?: string;
  service_type_snomed?: string;
  consultation_mode?: ConsultationMode;
  urgency?: UrgencyLevel;
  triage_source?: TriageSource;
  ai_suggested_urgency?: UrgencyLevel;

  // Optional attribution context (authenticated path may pass through)
  attribution?: AttributionUrgencySignal;
  time_to_book_seconds?: number;
}

export interface UpdateAppointmentInput {
  slot_date?: string;
  slot_time?: string;
  duration_minutes?: number;
  status?: AppointmentStatus;
  source?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  specialty?: string;
  reason?: string;
  notes?: string;
  doctor_id?: string;
  patient_id?: string;
  cancelled_by?: string;
  cancelled_reason?: string;
  reminder_sent?: boolean;
  coin_earned?: number;

  // Step 3 DDL fields (all PUT-allowlisted)
  appointment_type?: AppointmentType;
  appointment_type_snomed?: string;
  service_type_snomed?: string;
  consultation_mode?: ConsultationMode;
  urgency?: UrgencyLevel;
  cancellation_reason?: CancellationReason;
  triage_source?: TriageSource;
  attribution_urgency_signal?: AttributionUrgencySignal;
  ai_suggested_urgency?: UrgencyLevel;
}

// ─────────────────────────────────────────────────────────────
// Wrapper response types
// ─────────────────────────────────────────────────────────────

export interface CreateAppointmentResponse {
  success: boolean;
  appointment: MhaiAppointment;
  error?: string;
  message?: string;
  details?: string[];
}

export interface UpdateAppointmentResponse {
  success: boolean;
  appointment?: MhaiAppointment;
  error?: string;
  message?: string;
  details?: string[];
}

// ─────────────────────────────────────────────────────────────
// Public booking (anonymous path — /api/public/book-appointment)
// ─────────────────────────────────────────────────────────────

export interface PublicBookingInput {
  hospital_id: string;
  slot_date: string;
  slot_time: string;
  duration_minutes?: number;
  patient_name: string;
  patient_phone: string;
  specialty?: string;
  reason?: string;
  source?: string;

  // Step 3 DDL fields (all optional — patient-self-rated allowed)
  appointment_type?: AppointmentType;
  consultation_mode?: ConsultationMode;
  urgency?: UrgencyLevel;
  appointment_type_snomed?: string;
  service_type_snomed?: string;

  // DPDPA consent (REQUIRED after CONSENT_ENFORCEMENT_START 2026-04-29)
  consent_accepted?: boolean;
  consent_text_hash?: string;
  consent_text_language?: string;          // full BCP 47 tag, e.g. 'en-IN'
  consent_version?: string;                // e.g. 'v1_2026_04'
  consent_jurisdiction?: string;           // e.g. 'DPDPA_2023_IN'

  // Frontend attribution context (captured by lib/attribution.ts)
  attribution?: AttributionUrgencySignal;
  time_to_book_seconds?: number;
}

export interface PublicBookingResponse {
  success: boolean;
  appointment_id?: string;
  lead_id?: string;
  attribution_captured?: boolean;
  consent_captured?: boolean;
  legacy_prep_period?: boolean;          // true until 2026-04-29
  error?: string;
  message?: string;
  details?: string[];
}
