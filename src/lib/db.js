import { supabase } from './supabase.js'
import { blankDay, blankWeek, dayDate } from './constants.js'

// ── Days ──────────────────────────────────────────────────────────────────────

export async function fetchDay(n) {
  const { data, error } = await supabase
    .from('days')
    .select('*')
    .eq('day_number', n)
    .maybeSingle()
  if (error) throw error
  return data || blankDay(n)
}

export async function upsertDay(day) {
  const payload = {
    day_number:    day.day_number,
    day_date:      dayDate(day.day_number).toISOString().slice(0, 10),
    top3:          day.top3,
    must_not_fail: day.must_not_fail,
    distraction:   day.distraction,
    checks:        day.checks,
    scores:        day.scores,
    avoided:       day.avoided,
    tomorrow:      day.tomorrow,
    owner_note:    day.owner_note,
    partner_note:  day.partner_note,
  }
  const { data, error } = await supabase
    .from('days')
    .upsert(payload, { onConflict: 'day_number' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePartnerNote(dayNumber, note) {
  const existing = await fetchDay(dayNumber)
  return upsertDay({ ...existing, partner_note: note })
}

// Fetch all days summary (for calendar heat-map)
export async function fetchAllDaysSummary() {
  const { data, error } = await supabase
    .from('days')
    .select('day_number, checks, scores')
    .order('day_number')
  if (error) throw error
  return data || []
}

// ── Weeks ─────────────────────────────────────────────────────────────────────

export async function fetchWeek(w) {
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .eq('week_number', w)
    .maybeSingle()
  if (error) throw error
  return data || blankWeek(w)
}

export async function upsertWeek(week) {
  const payload = {
    week_number: week.week_number,
    biz_metrics: week.biz_metrics,
    broke_word:  week.broke_word,
    pattern:     week.pattern,
    money_note:  week.money_note,
    next3:       week.next3,
  }
  const { data, error } = await supabase
    .from('weeks')
    .upsert(payload, { onConflict: 'week_number' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchAllWeeks() {
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .order('week_number')
  if (error) throw error
  return data || []
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function fetchStats() {
  const { data, error } = await supabase
    .from('days')
    .select('day_number, checks, scores, updated_at')
    .order('day_number')
  if (error) throw error

  const days = data || []
  const completed = days.filter(d => {
    const c = Object.values(d.checks || {}).filter(Boolean).length
    return c >= 3
  }).length

  const totalScore = days.reduce((sum, d) => {
    return sum + Object.values(d.scores || {}).reduce((a, v) => a + (Number(v) || 0), 0)
  }, 0)

  const avgScore = days.length > 0 ? (totalScore / days.length).toFixed(1) : '—'

  return { completed, totalScore, avgScore, enteredDays: days.length }
}
