import { supabase } from './supabase.js'
import {
  DEFAULT_GOALS,
  DEFAULT_QUARTER,
  blankDay,
  blankReview,
  blankWeek,
  dayDate,
  isoDate,
  parseDate,
  weekRange,
} from './constants.js'

export async function fetchActiveQuarter() {
  const { data, error } = await supabase
    .from('quarters')
    .select('*')
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (data) return data
  return createQuarter(DEFAULT_QUARTER, true)
}

export async function fetchQuarters() {
  const { data, error } = await supabase
    .from('quarters')
    .select('*')
    .order('start_date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createQuarter(input = DEFAULT_QUARTER, seedGoals = false) {
  const payload = {
    label: input.label,
    theme: input.theme || '',
    start_date: input.start_date,
    end_date: input.end_date,
    status: input.status || 'active',
  }

  const { data, error } = await supabase
    .from('quarters')
    .insert(payload)
    .select()
    .single()
  if (error) throw error

  if (seedGoals) await seedDefaultGoals(data.id)
  return data
}

export async function setActiveQuarter(quarterId) {
  const { error: archiveError } = await supabase
    .from('quarters')
    .update({ status: 'archived' })
    .eq('status', 'active')
  if (archiveError) throw archiveError

  const { data, error } = await supabase
    .from('quarters')
    .update({ status: 'active' })
    .eq('id', quarterId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function archiveQuarter(quarterId) {
  const { data, error } = await supabase
    .from('quarters')
    .update({ status: 'archived' })
    .eq('id', quarterId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createNextQuarter(current, options = {}) {
  const start = parseDate(current.end_date)
  start.setUTCDate(start.getUTCDate() + 1)
  const end = new Date(start)
  end.setUTCMonth(end.getUTCMonth() + 3)
  end.setUTCDate(end.getUTCDate() - 1)

  const quarterNumber = Math.floor(start.getUTCMonth() / 3) + 1
  const payload = {
    label: options.label || `${start.getUTCFullYear()} Q${quarterNumber}`,
    theme: options.theme || options.next_theme || '',
    start_date: isoDate(start),
    end_date: isoDate(end),
    status: 'active',
  }

  await archiveQuarter(current.id)
  const newQuarter = await createQuarter(payload, false)

  if (options.rolloverGoalIds && options.rolloverGoalIds.length > 0) {
    const { data: goalsToRoll } = await supabase
      .from('quarter_goals')
      .select('*')
      .in('id', options.rolloverGoalIds)

    if (goalsToRoll && goalsToRoll.length > 0) {
      const rows = goalsToRoll.map((g, idx) => ({
        quarter_id: newQuarter.id,
        arena: g.arena,
        title: g.title,
        target_value: g.target_value,
        current_value: '',
        status: 'active',
        notes: g.notes ? `Rolled over: ${g.notes}` : 'Rolled over',
        sort_order: idx,
      }))
      await supabase.from('quarter_goals').insert(rows)
    }
  } else {
    await seedDefaultGoals(newQuarter.id)
  }

  return newQuarter
}

async function seedDefaultGoals(quarterId) {
  const rows = DEFAULT_GOALS.map((goal, index) => ({
    quarter_id: quarterId,
    arena: goal.arena,
    title: goal.title,
    target_value: goal.target_value,
    current_value: '',
    status: 'active',
    notes: '',
    sort_order: index,
  }))

  const { error } = await supabase.from('quarter_goals').insert(rows)
  if (error) throw error
}

export async function fetchQuarterGoals(quarterId) {
  const { data, error } = await supabase
    .from('quarter_goals')
    .select('*')
    .eq('quarter_id', quarterId)
    .order('sort_order')
    .order('created_at')
  if (error) throw error
  return data || []
}

export async function upsertQuarterGoal(goal) {
  const payload = {
    quarter_id: goal.quarter_id,
    arena: goal.arena,
    title: goal.title,
    target_value: goal.target_value || '',
    current_value: goal.current_value || '',
    status: goal.status || 'active',
    notes: goal.notes || '',
    sort_order: goal.sort_order || 0,
  }

  const query = goal.id
    ? supabase.from('quarter_goals').update(payload).eq('id', goal.id)
    : supabase.from('quarter_goals').insert(payload)

  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

export async function deleteQuarterGoal(goalId) {
  const { error } = await supabase.from('quarter_goals').delete().eq('id', goalId)
  if (error) throw error
}

export async function fetchDay(quarter, n) {
  const { data, error } = await supabase
    .from('days')
    .select('*')
    .eq('quarter_id', quarter.id)
    .eq('day_number', n)
    .maybeSingle()
  if (error) throw error
  return data || blankDay(quarter, n)
}

export async function upsertDay(quarter, day) {
  const payload = {
    quarter_id: quarter.id,
    day_number: day.day_number,
    day_date: isoDate(dayDate(quarter, day.day_number)),
    top3: day.top3,
    top3_goal_ids: day.top3_goal_ids || ['', '', ''],
    must_not_fail: day.must_not_fail,
    distraction: day.distraction,
    checks: day.checks,
    scores: day.scores,
    avoided: day.avoided,
    moved: day.moved || '',
    tomorrow: day.tomorrow,
    owner_note: day.owner_note,
    partner_note: day.partner_note,
  }
  const { data, error } = await supabase
    .from('days')
    .upsert(payload, { onConflict: 'quarter_id,day_number' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchAllDaysSummary(quarterId) {
  const { data, error } = await supabase
    .from('days')
    .select('day_number, checks, scores')
    .eq('quarter_id', quarterId)
    .order('day_number')
  if (error) throw error
  return data || []
}

export async function fetchWeek(quarter, w) {
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .eq('quarter_id', quarter.id)
    .eq('week_number', w)
    .maybeSingle()
  if (error) throw error
  return data || blankWeek(quarter, w)
}

export async function upsertWeek(quarter, week) {
  const payload = {
    quarter_id: quarter.id,
    week_number: week.week_number,
    biz_metrics: week.biz_metrics,
    kept_word: week.kept_word || '',
    broke_word: week.broke_word,
    pattern: week.pattern,
    money_note: week.money_note,
    goal_progress: week.goal_progress || '',
    next3: week.next3,
  }
  const { data, error } = await supabase
    .from('weeks')
    .upsert(payload, { onConflict: 'quarter_id,week_number' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchAllWeeks(quarterId) {
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .eq('quarter_id', quarterId)
    .order('week_number')
  if (error) throw error
  return data || []
}

export async function fetchQuarterReview(quarter) {
  const { data, error } = await supabase
    .from('quarter_reviews')
    .select('*')
    .eq('quarter_id', quarter.id)
    .maybeSingle()
  if (error) throw error
  return data || blankReview(quarter)
}

export async function upsertQuarterReview(quarter, review) {
  const payload = {
    quarter_id: quarter.id,
    wins: review.wins || '',
    misses: review.misses || '',
    patterns: review.patterns || '',
    lessons: review.lessons || '',
    rollover: review.rollover || '',
    next_theme: review.next_theme || '',
  }
  const { data, error } = await supabase
    .from('quarter_reviews')
    .upsert(payload, { onConflict: 'quarter_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchStats(quarterId) {
  const { data, error } = await supabase
    .from('days')
    .select('day_number, checks, scores, updated_at')
    .eq('quarter_id', quarterId)
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

  const avgScore = days.length > 0 ? (totalScore / days.length).toFixed(1) : '-'

  return { completed, totalScore, avgScore, enteredDays: days.length }
}

export async function fetchQuarterById(quarterId) {
  const { data, error } = await supabase
    .from('quarters')
    .select('*')
    .eq('id', quarterId)
    .single()
  if (error) throw error
  return data
}

export async function fetchGoalTargetedCounts(quarterId) {
  const { data, error } = await supabase
    .from('days')
    .select('top3_goal_ids')
    .eq('quarter_id', quarterId)
  if (error) throw error
  const counts = {}
  ;(data || []).forEach(row => {
    const ids = Array.isArray(row.top3_goal_ids) ? row.top3_goal_ids : []
    ids.forEach(id => {
      if (id) {
        const key = String(id)
        counts[key] = (counts[key] || 0) + 1
      }
    })
  })
  return counts
}

export async function fetchWeekDaysSummary(quarter, weekNumber) {
  const { startDay, endDay } = weekRange(quarter, weekNumber)
  const { data, error } = await supabase
    .from('days')
    .select('day_number, checks, scores')
    .eq('quarter_id', quarter.id)
    .gte('day_number', startDay)
    .lte('day_number', endDay)
    .order('day_number')
  if (error) throw error
  return data || []
}

export async function fetchTasks(quarterId = null, filter = {}) {
  let query = supabase.from('tasks').select('*')
  if (quarterId) {
    query = query.or(`quarter_id.eq.${quarterId},quarter_id.is.null`)
  }
  if (filter.status && filter.status !== 'all') {
    query = query.eq('status', filter.status)
  }
  if (filter.urgency && filter.urgency !== 'all') {
    query = query.eq('urgency', filter.urgency)
  }
  query = query.order('created_at', { ascending: false })
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function upsertTask(task) {
  const payload = {
    quarter_id: task.quarter_id || null,
    title: task.title,
    urgency: task.urgency || 'medium',
    arena: task.arena || null,
    status: task.status || 'pending',
    due_date: task.due_date || null,
    remind_at: task.remind_at || null,
    reminder_sent: task.reminder_sent ?? false,
    notes: task.notes || '',
  }
  const query = task.id
    ? supabase.from('tasks').update(payload).eq('id', task.id)
    : supabase.from('tasks').insert(payload)

  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

export async function deleteTask(taskId) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
}

