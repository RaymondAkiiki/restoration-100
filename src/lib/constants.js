export const START_DATE = new Date(2026, 2, 27)   // 27 March 2026
export const TOTAL_DAYS = 100
export const END_DATE   = new Date(2026, 6, 4)    // 4 July 2026

export function dayDate(n) {
  const d = new Date(START_DATE)
  d.setDate(d.getDate() + n - 1)
  return d
}

export function todayDayN() {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const s   = new Date(START_DATE); s.setHours(0, 0, 0, 0)
  const n   = Math.floor((now - s) / 86400000) + 1
  if (n < 1) return 0
  if (n > TOTAL_DAYS) return TOTAL_DAYS + 1
  return n
}

export function weekForDay(n) {
  return Math.ceil(n / 7)
}

export function fmtDate(d) {
  return d.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function fmtShort(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function phase(n) {
  if (n <= 39)         return { num: 1, name: 'Phase 1 — Stabilize', desc: 'Build foundations. Prove reliability. End: 4 May 2026.' }
  if (n <= 74)         return { num: 2, name: 'Phase 2 — Build',     desc: 'Commercial and operating rhythm. End: 8 Jun 2026.' }
  if (n <= 99)         return { num: 3, name: 'Phase 3 — Prove',     desc: 'Prove compounding. End: 3 Jul 2026.' }
  return               { num: 4, name: 'Day 100 — Arrival',          desc: '4 July 2026. Your birthday.' }
}

export const CHECKS = [
  { key: 'morning',   label: 'Morning plan completed before 7:00 AM' },
  { key: 'deep',      label: '90-min deep work block before reactive work' },
  { key: 'finance',   label: 'No unplanned spend above UGX 30,000' },
  { key: 'ritual',    label: '10-min self-trust ritual completed' },
  { key: 'promises',  label: 'All promises made today kept' },
  { key: 'eod',       label: 'End-of-day review completed' },
]

export const SCORE_ITEMS = [
  { key: 'word',      label: 'Kept my word' },
  { key: 'focus',     label: 'Protected focus' },
  { key: 'game',      label: 'Moved the main game — real estate' },
  { key: 'money',     label: 'Controlled spending' },
  { key: 'emotions',  label: 'Handled emotions like an adult' },
]

export const BIZ_FIELDS = [
  { key: 'units',       label: 'Units under management' },
  { key: 'revenue',     label: 'Monthly recurring revenue (UGX)' },
  { key: 'leads',       label: 'Landlord leads generated' },
  { key: 'outreach',    label: 'Outreach attempts this week' },
  { key: 'meetings',    label: 'Meetings booked' },
  { key: 'proposals',   label: 'Proposals sent' },
  { key: 'closed',      label: 'Deals closed' },
  { key: 'collected',   label: '% Rent collected on time' },
  { key: 'arrears',     label: 'Arrears followed up within 24h' },
  { key: 'sops',        label: 'SOPs created or updated' },
  { key: 'landlords',   label: 'Active landlord clients' },
]

export const PHASE_TARGETS = {
  1: [
    'Complete morning plan ≥ 34 of 39 days',
    'End-of-day review ≥ 30 of 39 days',
    'No unplanned spend ≥ 30 days',
    '20 serious landlord prospects identified',
    '8+ outreach attempts per week',
    '5 core SOPs drafted by 30 April',
    '2 proposal/meeting opportunities created',
  ],
  2: [
    '10 landlord outreach attempts per week',
    '3 meetings or serious conversations per month',
    '1 new client or property in final negotiation',
    '8 core SOPs completed',
    'Rent collection and arrears follow-up systemised',
    'Monthly landlord reporting standardised',
    '1 software/process improvement implemented',
  ],
  3: [
    '12–15 outreach attempts per week',
    '4 serious meetings per month',
    '2–3 new properties or management mandates added',
    '90% landlord reports sent on time',
    '90% arrears followed up within 24h',
    '1 internal dashboard actively used',
    'Operational case studies documented',
  ],
  4: [
    'Recurring revenue materially higher than Day 1',
    'Operations running on documented standards',
    'Landlord acquisition engine consistent',
    'Software/process advantage visible',
    'You behaving like an operator, not a scattered dreamer',
  ],
}

export function blankDay(n) {
  return {
    day_number:    n,
    day_date:      dayDate(n).toISOString().slice(0, 10),
    top3:          ['', '', ''],
    must_not_fail: '',
    distraction:   '',
    checks:        Object.fromEntries(CHECKS.map(c => [c.key, false])),
    scores:        Object.fromEntries(SCORE_ITEMS.map(s => [s.key, 0])),
    avoided:       '',
    tomorrow:      '',
    owner_note:    '',
    partner_note:  '',
  }
}

export function blankWeek(w) {
  return {
    week_number: w,
    biz_metrics: Object.fromEntries(BIZ_FIELDS.map(f => [f.key, ''])),
    broke_word:  '',
    pattern:     '',
    money_note:  '',
    next3:       ['', '', ''],
  }
}

export function dayScore(day) {
  if (!day?.scores) return 0
  return SCORE_ITEMS.reduce((a, s) => a + (Number(day.scores[s.key]) || 0), 0)
}

export function dayChecks(day) {
  if (!day?.checks) return 0
  return CHECKS.filter(c => day.checks[c.key]).length
}
