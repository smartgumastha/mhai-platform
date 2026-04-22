'use client';

import React from 'react';
import type { LocaleConfig, LocaleLabels } from '@/lib/types/LocaleConfig';

export interface NPPAckState {
  acknowledged: boolean;
}

interface NPPAcknowledgmentProps {
  value: NPPAckState;
  onChange: (v: NPPAckState) => void;
  labels: LocaleLabels;
  config: LocaleConfig;
}

export default function NPPAcknowledgment({ value, onChange, labels }: NPPAcknowledgmentProps) {
  return (
    <div className="npp-block">
      <div className="npp-title">{labels.npp_title || 'Notice of Privacy Practices'}</div>
      <div className="npp-summary">{labels.npp_summary || ''}</div>
      <label className="npp-checkbox-row">
        <input
          type="checkbox"
          checked={value.acknowledged}
          onChange={(e) => onChange({ acknowledged: e.target.checked })}
        />
        <span className="npp-label">
          {labels.npp_acknowledgment_label || 'I acknowledge receipt of the Notice of Privacy Practices.'}
        </span>
      </label>
      <div className="npp-footer">{labels.npp_footer || ''}</div>
    </div>
  );
}
