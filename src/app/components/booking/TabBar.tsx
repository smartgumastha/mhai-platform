'use client';

import React from 'react';
import type { AppointmentType } from '@/lib/types/MhaiAppointment';
import type { LocaleLabels } from '@/lib/types/LocaleConfig';

interface TabDef {
  type: AppointmentType;
  icon: string;
  labelKey: keyof LocaleLabels;
  subtextKey: keyof LocaleLabels;
  isEmergency?: boolean;
  defaultMode: 'IMP' | 'VIDEO' | 'HOME';
  defaultUrgency: 'ROUTINE' | 'EMERGENCY';
  showModeChips?: boolean;
}

export const TAB_DEFS: TabDef[] = [
  { type: 'ROUTINE', icon: '🏥', labelKey: 'tab_in_person', subtextKey: 'subtext_in_person', defaultMode: 'IMP', defaultUrgency: 'ROUTINE' },
  { type: 'TELECONSULT', icon: '📹', labelKey: 'tab_teleconsult', subtextKey: 'subtext_teleconsult', defaultMode: 'VIDEO', defaultUrgency: 'ROUTINE', showModeChips: true },
  { type: 'FOLLOWUP', icon: '🔄', labelKey: 'tab_followup', subtextKey: 'subtext_followup', defaultMode: 'IMP', defaultUrgency: 'ROUTINE' },
  { type: 'SECOND_OPINION', icon: '💭', labelKey: 'tab_second_opinion', subtextKey: 'subtext_second_opinion', defaultMode: 'VIDEO', defaultUrgency: 'ROUTINE' },
  { type: 'HOME_VISIT', icon: '🏠', labelKey: 'tab_home_visit', subtextKey: 'subtext_home_visit', defaultMode: 'HOME', defaultUrgency: 'ROUTINE' },
  { type: 'EMERGENCY', icon: '🚨', labelKey: 'tab_emergency', subtextKey: 'subtext_emergency', isEmergency: true, defaultMode: 'IMP', defaultUrgency: 'EMERGENCY' },
];

interface TabBarProps {
  activeType: AppointmentType;
  onSelect: (tab: TabDef) => void;
  labels: LocaleLabels;
  direction: 'ltr' | 'rtl';
}

export default function TabBar({ activeType, onSelect, labels, direction }: TabBarProps) {
  const tabs = direction === 'rtl' ? [...TAB_DEFS].reverse() : TAB_DEFS;
  return (
    <div className="booking-tabs-wrap">
      <div className="booking-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.type}
            role="tab"
            aria-selected={activeType === tab.type}
            className={`booking-tab${activeType === tab.type ? ' active' : ''}${tab.isEmergency ? ' emergency' : ''}`}
            onClick={() => onSelect(tab)}
            type="button"
          >
            <span className="tab-icon">{tab.icon}</span>
            {labels[tab.labelKey] || String(tab.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

export type { TabDef };
