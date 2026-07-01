export const DEFAULT_QUARTER = {
  label: '2026 Q3',
  theme: 'Become a disciplined, emotionally stable, revenue-generating operator.',
  start_date: '2026-07-01',
  end_date: '2026-09-30',
  status: 'active',
}

export const ARENAS = [
  { key: 'discipline', label: 'Discipline & Consistency' },
  { key: 'revenue', label: 'Revenue Creation' },
  { key: 'sales', label: 'Sales Activity' },
  { key: 'emotional', label: 'Emotional Mastery' },
  { key: 'relationships', label: 'Relationships' },
]

export const DEFAULT_GOALS = [
  { arena: 'discipline', title: 'Wake on time 5 days each week', target_value: '5 wake-ups/week' },
  { arena: 'discipline', title: 'Exercise 4 times each week', target_value: '4 sessions/week' },
  { arena: 'discipline', title: 'Complete every weekly review', target_value: '13 reviews' },
  { arena: 'revenue', title: 'Grow Threalty recurring revenue', target_value: 'Set monthly UGX target' },
  { arena: 'revenue', title: 'Track every expense the same day', target_value: 'Daily expense record' },
  { arena: 'sales', title: 'Contact 20 landlords each week', target_value: '20 contacts/week' },
  { arena: 'sales', title: 'Send 5 proposals each week', target_value: '5 proposals/week' },
  { arena: 'sales', title: 'Follow up every active prospect weekly', target_value: '100% follow-up' },
  { arena: 'emotional', title: 'Recover from setbacks within 24 hours', target_value: 'Same-day reset' },
  { arena: 'relationships', title: 'Have one meaningful parent conversation weekly', target_value: '1/week' },
  { arena: 'relationships', title: 'Have one meaningful partner conversation weekly', target_value: '1/week' },
]

export const CHECKS = [
  { key: 'morning', label: 'Morning plan completed' },
  { key: 'deep', label: 'Protected deep work block' },
  { key: 'sales', label: 'Sales or revenue action completed' },
  { key: 'body', label: 'Body moved or trained' },
  { key: 'money', label: 'Expense or money decision tracked' },
  { key: 'eod', label: 'End-of-day review completed' },
]

export const SCORE_ITEMS = [
  { key: 'word', label: 'Kept my word' },
  { key: 'focus', label: 'Protected focus' },
  { key: 'revenue', label: 'Created revenue or opportunity' },
  { key: 'emotions', label: 'Recovered emotionally like an adult' },
  { key: 'relationships', label: 'Strengthened key relationships' },
]

export const BIZ_FIELDS = [
  { key: 'revenue', label: 'Revenue generated this week (UGX)' },
  { key: 'units', label: 'Units under management' },
  { key: 'leads', label: 'Landlord leads generated' },
  { key: 'contacts', label: 'Landlords contacted' },
  { key: 'followups', label: 'Prospect follow-ups completed' },
  { key: 'meetings', label: 'Meetings booked' },
  { key: 'proposals', label: 'Proposals sent' },
  { key: 'closed', label: 'Deals closed' },
  { key: 'exercise', label: 'Exercise sessions' },
  { key: 'expenses', label: 'Expense tracking days' },
  { key: 'relationships', label: 'Meaningful conversations' },
]

export function parseDate(value) {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isoDate(date) {
  const d = parseDate(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function totalDays(quarter) {
  const start = parseDate(quarter.start_date)
  const end = parseDate(quarter.end_date)
  return Math.floor((end - start) / 86400000) + 1
}

export function dayDate(quarter, n) {
  const d = parseDate(quarter.start_date)
  d.setDate(d.getDate() + n - 1)
  return d
}

export function todayDayN(quarter) {
  if (!quarter) return 0
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const start = parseDate(quarter.start_date)
  const n = Math.floor((now - start) / 86400000) + 1
  const days = totalDays(quarter)
  if (n < 1) return 0
  if (n > days) return days + 1
  return n
}

export function weekForDay(n) {
  return Math.ceil(n / 7)
}

export function weekRange(quarter, w) {
  const days = totalDays(quarter)
  const startDay = (w - 1) * 7 + 1
  const endDay = Math.min(w * 7, days)
  return { startDay, endDay }
}

export function quarterPhase(quarter, n) {
  const days = totalDays(quarter)
  const first = Math.ceil(days / 3)
  const second = Math.ceil((days * 2) / 3)
  if (n <= first) return { num: 1, name: 'Month 1 - Stabilize', desc: 'Set rhythm, remove leaks, build trust with yourself.' }
  if (n <= second) return { num: 2, name: 'Month 2 - Build', desc: 'Push revenue, sales reps, health, and relationship repair.' }
  return { num: 3, name: 'Month 3 - Prove', desc: 'Finish strong, measure honestly, prepare the next quarter.' }
}

export function fmtDate(d) {
  return parseDate(d).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function fmtShort(d) {
  return parseDate(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function arenaLabel(key) {
  return ARENAS.find(a => a.key === key)?.label || key
}

export function blankDay(quarter, n) {
  return {
    quarter_id: quarter.id,
    day_number: n,
    day_date: isoDate(dayDate(quarter, n)),
    top3: ['', '', ''],
    top3_goal_ids: ['', '', ''],
    must_not_fail: '',
    distraction: '',
    checks: Object.fromEntries(CHECKS.map(c => [c.key, false])),
    scores: Object.fromEntries(SCORE_ITEMS.map(s => [s.key, 0])),
    avoided: '',
    moved: '',
    tomorrow: '',
    owner_note: '',
    partner_note: '',
  }
}

export function blankWeek(quarter, w) {
  return {
    quarter_id: quarter.id,
    week_number: w,
    biz_metrics: Object.fromEntries(BIZ_FIELDS.map(f => [f.key, ''])),
    kept_word: '',
    broke_word: '',
    pattern: '',
    money_note: '',
    goal_progress: '',
    next3: ['', '', ''],
  }
}

export function blankReview(quarter) {
  return {
    quarter_id: quarter.id,
    wins: '',
    misses: '',
    patterns: '',
    lessons: '',
    rollover: '',
    next_theme: '',
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
