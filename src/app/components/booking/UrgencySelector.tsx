'use client';

import React from 'react';
import type { UrgencyLevel } from '@/lib/types/MhaiAppointment';
import type { LocaleConfig, LocaleLabels } from '@/lib/types/LocaleConfig';

interface UrgencyOption {
  value: UrgencyLevel;
  labelKey: keyof LocaleLabels;
  subKey: keyof LocaleLabels;
  nhsClass?: string; // only applies when urgency_style === 'nhs_colours'
}

// Mapping: DB value -> UI tier. UK collapses Amber+Yellow into one UI tier mapped to SOON.
const URGENCY_OPTIONS: UrgencyOption[] = [
  { value: 'SCHEDULED', labelKey: 'urgency_scheduled', subKey: 'urgency_scheduled_sub', nhsClass: 'nhs-green' },
  { value: 'ROUTINE', labelKey: 'urgency_routine', subKey: 'urgency_routine_sub', nhsClass: 'nhs-green' },
  { value: 'SOON', labelKey: 'urgency_soon', subKey: 'urgency_soon_sub', nhsClass: 'nhs-amber' },
  { value: 'URGENT', labelKey: 'urgency_urgent', subKey: 'urgency_urgent_sub', nhsClass: 'nhs-red' },
];

interface UrgencySelectorProps {
  value: UrgencyLevel;
  onChange: (v: UrgencyLevel) => void;
  labels: LocaleLabels;
  config: LocaleConfig;
}

export default function UrgencySelector({ value, onChange, labels, config }: UrgencySelectorProps) {
  const useNhs = config.urgency_style === 'nhs_colours';
  return (
    <div className="urgency-group">
      <label className="booking-label">{labels.label_urgency}</label>
      <div className="urgency-options">
        {URGENCY_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          const cls = ['urgency-opt'];
          if (selected) cls.push('selected');
          if (useNhs && opt.nhsClass) cls.push(opt.nhsClass);
          return (
            <button
              key={opt.value}
              type="button"
              className={cls.join(' ')}
              onClick={() => onChange(opt.value)}
              aria-pressed={selected}
            >
              <div className="urgency-opt-title">{labels[opt.labelKey] || opt.value}</div>
              <div className="urgency-opt-sub">{labels[opt.subKey] || ''}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
