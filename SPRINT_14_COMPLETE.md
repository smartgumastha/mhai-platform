# Sprint 14 — Telecaller CRM: Completion Summary

**Completed:** 2026-04-16
**Repos:** smartgumastha-backend + mhai-platform

---

## Pages Created (7 frontend routes)

| # | Page | Route | Description |
|---|------|-------|-------------|
| 1 | CRM Dashboard | `/dashboard/telecaller` | Lead pipeline, metrics, compliance ribbon, country-aware actions |
| 2 | CSV Import Wizard | `/dashboard/telecaller/import` | 4-step: upload, map fields, DND scrub, confirm |
| 3 | Campaign List | `/dashboard/telecaller/campaigns` | Stats cards, campaign table, start/pause toggle |
| 4 | Campaign Builder | `/dashboard/telecaller/campaigns/new` | 7-section form: details, segment, consent, script, time window, assign, retry |
| 5 | Active Call Screen | `/dashboard/telecaller/call/[leadId]` | Two-column: patient context + Clara coaching, script stepper, sentiment meter |
| 6 | Coaching Reports | `/dashboard/telecaller/coaching` | Weekly reports, team metrics, individual cards with AI insights |
| 7 | Scripts Library | `/dashboard/telecaller/scripts` | Grid view, detail modal, auto-generate defaults, Clara AI generation |

## Backend API Endpoints (33 routes in telecaller.js)

### Leads (8)
- `POST /api/mhai/telecaller/leads` — create with DND check
- `GET /api/mhai/telecaller/leads` — list with filters
- `GET /api/mhai/telecaller/leads/:id` — detail + call history
- `PATCH /api/mhai/telecaller/leads/:id` — update
- `DELETE /api/mhai/telecaller/leads/:id` — soft delete
- `POST /api/mhai/telecaller/leads/bulk-scrub` — re-scrub DND
- `POST /api/mhai/telecaller/leads/import` — CSV/JSON import
- `GET /api/mhai/telecaller/leads/import/:id` — import status

### Campaigns (6)
- `POST /api/mhai/telecaller/campaigns` — create
- `GET /api/mhai/telecaller/campaigns` — list with metrics
- `GET /api/mhai/telecaller/campaigns/:id/queue` — next lead to call
- `PATCH /api/mhai/telecaller/campaigns/:id` — update
- `POST /api/mhai/telecaller/campaigns/:id/start` — activate
- `POST /api/mhai/telecaller/campaigns/:id/pause` — pause

### Calls (5)
- `POST /api/mhai/telecaller/calls/log` — log with compliance checks
- `POST /api/mhai/telecaller/calls/:id/recording` — upload recording
- `POST /api/mhai/telecaller/calls/:id/transcript` — save transcript
- `POST /api/mhai/telecaller/calls/:id/analyze` — AI analysis

### Scripts (7)
- `GET /api/mhai/telecaller/scripts` — list
- `GET /api/mhai/telecaller/scripts/:id` — detail
- `POST /api/mhai/telecaller/scripts` — create manual
- `POST /api/mhai/telecaller/scripts/generate` — AI generate
- `PATCH /api/mhai/telecaller/scripts/:id` — update
- `DELETE /api/mhai/telecaller/scripts/:id` — delete

### AI Scoring (2)
- `POST /api/mhai/telecaller/leads/:id/score` — score single lead
- `POST /api/mhai/telecaller/leads/batch-score` — batch score

### Coaching (3)
- `GET /api/mhai/telecaller/coaching` — list reports
- `POST /api/mhai/telecaller/coaching/generate` — single telecaller
- `POST /api/mhai/telecaller/coaching/generate-all` — all telecallers

### Consent (3)
- `POST /api/mhai/telecaller/consent` — record
- `GET /api/mhai/telecaller/consent/:phone` — check
- `DELETE /api/mhai/telecaller/consent/:phone` — withdraw

### Stats (1)
- `GET /api/mhai/telecaller/stats` — dashboard stats

## Shared Components (6)

| Component | Location | Purpose |
|-----------|----------|---------|
| LeadDetailModal | `_components/LeadDetailModal.tsx` | Full lead detail, call history, consent, notes |
| CallDispositionModal | `_components/CallDispositionModal.tsx` | Timer, script, disposition, compliance |
| ScriptGenerateModal | `_components/ScriptGenerateModal.tsx` | AI script generation with preview |
| TranscriptViewerModal | `_components/TranscriptViewerModal.tsx` | Call transcript viewer with coaching notes |
| CoachingInsightsChart | `_components/CoachingInsightsChart.tsx` | Recharts conversion rate trend (12 weeks) |
| useCompliance | `hooks/useCompliance.ts` | Time window + DND + consent enforcement |

## Database Tables (7, all with RLS)

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| telecaller_leads | Lead pipeline | hospital+status, hospital+phone, hospital+followup, assigned_to |
| lead_imports | CSV import tracking | hospital+created DESC |
| telecaller_campaigns | Campaign management | hospital+status |
| call_logs | Call attempt records | hospital+started, lead+started, telecaller+started |
| call_scripts | Script templates | hospital+specialty |
| consent_registry | TRAI/TCPA consent | hospital+phone, UNIQUE(hospital,phone,consent_type) |
| coaching_reports | Weekly performance | hospital+week DESC, UNIQUE(telecaller,week_start) |

## AI Services (6 backend files)

| Service | Purpose |
|---------|---------|
| claudeClient.js | Claude API wrapper — strict JSON, PHI strip, token logging |
| callAnalyzer.js | Transcript analysis — sentiment, objections, summary |
| leadScorer.js | Lead scoring 0-100 + LTV estimate |
| scriptGenerator.js | Call script generation by specialty/language/goal |
| coachingGenerator.js | Weekly telecaller performance reports |
| coachingScheduler.js | Cron: Monday 06:00 IST auto-generates reports |

## Compliance Services (2 backend files)

| Service | Purpose |
|---------|---------|
| dndScrub.js | DND check via consent_registry (NCPR placeholder ready) |
| timeWindow.js | TRAI 09:00-21:00 enforcement, canCallNow() |

## Compliance Coverage

| Country | Regulation | Enforcement |
|---------|-----------|-------------|
| India | TRAI DND/NCPR | Time window 9-21, DND scrub, consent registry |
| USA | TCPA | Time window, consent verification |
| UK | PECR | Time window, opt-out respect |
| EU | GDPR | Consent-first, right to withdraw |
| UAE | TDRA | Time window enforcement |
| Singapore | PDPA | DND registry check |
| Australia | Spam Act | Time window, consent |
| Canada | CRTC | Time window, DND |

## Dependencies Added

- `papaparse` + `@types/papaparse` — CSV parsing (frontend)
- `libphonenumber-js` — Phone formatting (frontend)
- `recharts` — Chart visualization (frontend)
- `@anthropic-ai/sdk` — Claude AI (backend, pre-existing)
- `node-cron` — Scheduling (backend, pre-existing)

## Known Gaps for Future Sprints

1. **Real DND API integration** — Currently uses internal consent_registry; needs Airtel/Jio DLT API for true NCPR scrub
2. **AI voice calling** — Infrastructure for Clara AI voice agent (Twilio/Exotel integration)
3. **Real-time transcript** — Currently manual entry; needs speech-to-text integration
4. **Recording storage** — Needs S3/Railway storage integration for call recordings
5. **Coaching PDF export** — UI button exists but export not implemented
6. **Multi-language script editing** — Scripts are generated in-language but editing is text-only
7. **Campaign analytics** — Deep funnel analysis, A/B testing of scripts
8. **WhatsApp consent campaigns** — Auto-generate consent-collection campaigns for DND-blocked leads
9. **Lead scoring model training** — Current scoring uses Claude; needs custom model on conversion data
10. **RBAC for telecaller role** — Restrict telecaller view to assigned leads only
