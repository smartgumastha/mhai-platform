'use client';

import React, { useState } from 'react';
import type { LocaleConfig, LocaleLabels } from '@/lib/types/LocaleConfig';

export interface ItemizedConsentState {
  purpose1_share: boolean;         // REQUIRED for booking
  purpose2_reminders: boolean;
  purpose3_marketing: boolean;     // explicit opt-in (unchecked default)
}

interface ItemizedConsentProps {
  value: ItemizedConsentState;
  onChange: (v: ItemizedConsentState) => void;
  labels: LocaleLabels;
  config: LocaleConfig;
  activeLang: string;
  onLangChange: (lang: string) => void;
}

export default function ItemizedConsent({
  value,
  onChange,
  labels,
  config,
  activeLang,
  onLangChange,
}: ItemizedConsentProps) {
  const [showFull, setShowFull] = useState(false);
  const showLangSwitch = config.supported_languages.length > 1;

  function renderLangCode(code: string): string {
    // Compact display for language buttons
    const short: Record<string, string> = {
      'en-IN': 'EN',
      'hi-IN': 'हिं',
      'te-IN': 'తె',
      'ta-IN': 'தமி',
      'bn-IN': 'বাং',
      'mr-IN': 'मरा',
      'ar-AE': 'ع',
      'en-AE': 'EN',
      'en-GB': 'EN',
      'en-US': 'EN',
      'es-US': 'ES',
    };
    return short[code] || code;
  }

  return (
    <div className="consent-block">
      <div className="consent-head">
        <div className="consent-title">{labels.consent_title}</div>
        {showLangSwitch && (
          <div className="lang-switch">
            {config.supported_languages.map((l) => (
              <button
                key={l}
                type="button"
                className={`lang-btn${activeLang === l ? ' active' : ''}`}
                onClick={() => onLangChange(l)}
              >
                {renderLangCode(l)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="consent-summary">{labels.consent_summary}</div>

      {/* Purpose 1 — REQUIRED */}
      <label className="consent-item">
        <input
          type="checkbox"
          checked={value.purpose1_share}
          onChange={(e) => onChange({ ...value, purpose1_share: e.target.checked })}
        />
        <div className="consent-item-body">
          <div className="consent-item-title required-item">
            {labels.consent_purpose_1_title}
            <span className="required-suffix">{labels.consent_required_suffix}</span>
          </div>
          <div className="consent-item-desc">{labels.consent_purpose_1_desc}</div>
        </div>
      </label>

      {/* Purpose 2 — reminders */}
      <label className="consent-item">
        <input
          type="checkbox"
          checked={value.purpose2_reminders}
          onChange={(e) => onChange({ ...value, purpose2_reminders: e.target.checked })}
        />
        <div className="consent-item-body">
          <div className="consent-item-title">{labels.consent_purpose_2_title}</div>
          <div className="consent-item-desc">{labels.consent_purpose_2_desc}</div>
        </div>
      </label>

      {/* Purpose 3 — marketing (only if locale allows it in widget) */}
      {config.marketing_in_widget && labels.consent_purpose_3_title && (
        <label className="consent-item">
          <input
            type="checkbox"
            checked={value.purpose3_marketing}
            onChange={(e) => onChange({ ...value, purpose3_marketing: e.target.checked })}
          />
          <div className="consent-item-body">
            <div className="consent-item-title">{labels.consent_purpose_3_title}</div>
            <div className="consent-item-desc">{labels.consent_purpose_3_desc}</div>
          </div>
        </label>
      )}

      <div className="consent-footer">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setShowFull(!showFull);
          }}
        >
          {labels.consent_read_full}
        </a>
        <a href="/account/consents">{labels.consent_manage}</a>
      </div>

      {showFull && (
        <div className="full-notice">
          <strong>Data Fiduciary:</strong> MediHost AI Technologies · {config.consent_jurisdiction}
          <br />
          <br />
          <strong>Regulator:</strong> {config.regulator_name}
          <br />
          <br />
          <strong>Your rights:</strong> access, correction, erasure, grievance redressal, withdrawal of
          consent — as simple as giving consent.
          <br />
          <br />
          <strong>Grievance officer:</strong> grievance@medihost.ai
          <br />
          <br />
          <strong>Consent version:</strong> {config.consent_version} · {activeLang}
        </div>
      )}
    </div>
  );
}
