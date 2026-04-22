'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AppointmentType,
  ConsultationMode,
  UrgencyLevel,
  PublicBookingInput,
  PublicBookingResponse,
  AttributionUrgencySignal,
} from '@/lib/types/MhaiAppointment';
import { resolveLocale, getDevLocaleOverride } from '@/lib/locale-config';
import { getOrCaptureAttribution } from '@/lib/attribution';
import TabBar, { TAB_DEFS, type TabDef } from './booking/TabBar';
import UrgencySelector from './booking/UrgencySelector';
import ItemizedConsent, { type ItemizedConsentState } from './booking/ItemizedConsent';
import NPPAcknowledgment, { type NPPAckState } from './booking/NPPAcknowledgment';
import './booking/booking.css';

var BACKEND = 'https://smartgumastha-backend-production.up.railway.app';

interface BookingWidgetProps {
  hospitalId: string;
  countryCode?: string;     // from hospital.country_code; falls back to IN
  clinicName?: string;
  clinicSubtitle?: string;
  consultationFee?: number; // in whole currency units per market
  onBooked?: (apptId: string) => void;
}

export default function BookingWidget(props: BookingWidgetProps) {
  // Locale resolution (with ?locale= override in dev/preview)
  const override = typeof window !== 'undefined' ? getDevLocaleOverride() : null;
  const resolvedCountry = override || props.countryCode || 'IN';

  const [activeLang, setActiveLang] = useState<string>(() => {
    const b = resolveLocale(resolvedCountry);
    return b.config.default_language;
  });
  const bundle = useMemo(
    () => resolveLocale(resolvedCountry, activeLang),
    [resolvedCountry, activeLang]
  );
  const { config: locale, labels } = bundle;

  // Form state
  const [activeTab, setActiveTab] = useState<TabDef>(TAB_DEFS[0]);
  const [urgency, setUrgency] = useState<UrgencyLevel>(activeTab.defaultUrgency);
  const [mode, setMode] = useState<ConsultationMode>(activeTab.defaultMode as ConsultationMode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(locale.phone_prefix + ' ');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Consent state
  const [itemizedConsent, setItemizedConsent] = useState<ItemizedConsentState>({
    purpose1_share: false,
    purpose2_reminders: true,
    purpose3_marketing: false,
  });
  const [nppAck, setNppAck] = useState<NPPAckState>({ acknowledged: false });

  // Attribution
  const attributionRef = useRef<AttributionUrgencySignal | null>(null);
  const mountedAtRef = useRef<number>(Date.now());
  useEffect(() => {
    const captured = getOrCaptureAttribution();
    attributionRef.current = (captured as unknown) as AttributionUrgencySignal | null;
    mountedAtRef.current = Date.now();
  }, []);

  // Tab change resets mode + urgency to tab defaults
  function handleTabSelect(tab: TabDef) {
    setActiveTab(tab);
    setMode(tab.defaultMode as ConsultationMode);
    setUrgency(tab.defaultUrgency);
  }

  // Consent-accepted computation for submit gate
  const consentOk =
    locale.consent_pattern === 'itemized'
      ? itemizedConsent.purpose1_share === true
      : nppAck.acknowledged === true;

  const submitDisabled = !name || !phone || !date || !time || !consentOk || submitting;

  async function sha256(text: string): Promise<string> {
    if (typeof window === 'undefined' || !window.crypto?.subtle) return '';
    const buf = new TextEncoder().encode(text);
    const hash = await window.crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitDisabled) return;
    setSubmitError(null);
    setSubmitting(true);

    // Compose consent text for hashing (the visible notice content)
    const consentText = JSON.stringify({
      version: locale.consent_version,
      lang: activeLang,
      jurisdiction: locale.consent_jurisdiction,
      pattern: locale.consent_pattern,
      purposes:
        locale.consent_pattern === 'itemized'
          ? itemizedConsent
          : { npp_ack: nppAck.acknowledged },
    });
    const consent_text_hash = await sha256(consentText);

    const input: PublicBookingInput = {
      hospital_id: props.hospitalId,
      slot_date: date,
      slot_time: time,
      duration_minutes: 30,
      patient_name: name.trim(),
      patient_phone: phone.trim(),
      reason: reason.trim() || undefined,
      source: 'website',
      appointment_type: activeTab.type as AppointmentType,
      consultation_mode: mode,
      urgency: urgency,
      consent_accepted: consentOk,
      consent_text_hash: consent_text_hash,
      consent_text_language: activeLang,
      consent_version: locale.consent_version,
      consent_jurisdiction: locale.consent_jurisdiction,
      attribution: attributionRef.current || undefined,
      time_to_book_seconds: Math.round((Date.now() - mountedAtRef.current) / 1000),
    };

    try {
      const res = await fetch(BACKEND + '/api/public/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data: PublicBookingResponse = await res.json();
      if (data.success && data.appointment_id) {
        props.onBooked?.(data.appointment_id);
      } else {
        console.error('[BookingWidget] booking failed:', data);
        setSubmitError(data.message || data.error || 'Booking failed. Please try again.');
      }
    } catch (err) {
      console.error('[BookingWidget] network error:', err);
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const currencyLine = props.consultationFee
    ? ` · ${locale.currency_symbol} ${props.consultationFee}`
    : '';

  const submitLabel =
    submitDisabled && !consentOk
      ? labels.submit_disabled_msg
      : (activeTab.isEmergency ? labels.submit_emergency : labels.submit_confirm) + currencyLine;

  const clinicName = props.clinicName || 'Clinic';

  return (
    <div className="booking-widget" dir={locale.text_direction}>
      <div className="widget-header">
        <div className="clinic-line">
          <div className="clinic-avatar">{clinicName.charAt(0).toUpperCase()}</div>
          <div>
            <div className="clinic-name">{clinicName}</div>
            {props.clinicSubtitle && <div className="clinic-sub">{props.clinicSubtitle}</div>}
          </div>
        </div>
        <div className="widget-title">Book an appointment</div>
      </div>

      <TabBar
        activeType={activeTab.type}
        onSelect={handleTabSelect}
        labels={labels}
        direction={locale.text_direction}
      />
      <div className={`tab-subtext${activeTab.isEmergency ? ' emergency' : ''}`}>
        {labels[activeTab.subtextKey]}
      </div>

      <form className="form-body" onSubmit={handleSubmit}>
        <div className="row">
          <div>
            <label className="booking-label required">{labels.label_name}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="booking-label required">{labels.label_phone}</label>
            <input
              type="tel"
              placeholder={locale.phone_placeholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="row">
          <div>
            <label className="booking-label required">{labels.label_date}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="booking-label required">{labels.label_time}</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="row-full">
          <label className="booking-label">{labels.label_reason}</label>
          <textarea
            value={reason}
            placeholder={labels.reason_placeholder}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <UrgencySelector value={urgency} onChange={setUrgency} labels={labels} config={locale} />

        {locale.consent_pattern === 'itemized' ? (
          <ItemizedConsent
            value={itemizedConsent}
            onChange={setItemizedConsent}
            labels={labels}
            config={locale}
            activeLang={activeLang}
            onLangChange={setActiveLang}
          />
        ) : (
          <NPPAcknowledgment
            value={nppAck}
            onChange={setNppAck}
            labels={labels}
            config={locale}
          />
        )}

        {submitError && (
          <div style={{ color: '#b91c1c', fontSize: 12, padding: '6px 2px' }}>{submitError}</div>
        )}

        <div className="submit-area">
          <button
            className={`btn-primary${activeTab.isEmergency ? ' emergency' : ''}`}
            type="submit"
            disabled={submitDisabled}
          >
            {submitLabel}
          </button>
          <div className="trust-line">🛡 {labels.trust_line}</div>
          {locale.emergency_call_disclaimer && activeTab.isEmergency && (
            <div className="emergency-disclaimer">{locale.emergency_call_disclaimer}</div>
          )}
        </div>
      </form>
    </div>
  );
}
