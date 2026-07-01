import { useEffect, useState } from 'react'
import {
  createNextQuarter,
  deleteQuarterGoal,
  fetchQuarterGoals,
  fetchQuarterReview,
  upsertQuarterGoal,
  upsertQuarterReview,
} from '../lib/db.js'
import { ARENAS, arenaLabel, fmtDate, totalDays } from '../lib/constants.js'
import Sec from './Sec.jsx'
import s from './TargetsPage.module.css'

const emptyGoal = quarter => ({
  quarter_id: quarter.id,
  arena: 'discipline',
  title: '',
  target_value: '',
  current_value: '',
  status: 'active',
  notes: '',
  sort_order: 99,
})

const Field = ({ label, children }) => (
  <div className={s.formRow}>
    <span className={s.formLabel}>{label}</span>
    {children}
  </div>
)

export default function TargetsPage({ quarter, onQuarterChanged }) {
  const [goals, setGoals] = useState([])
  const [review, setReview] = useState(null)
  const [draft, setDraft] = useState(emptyGoal(quarter))
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    setStatus('')
    setDraft(emptyGoal(quarter))
    Promise.all([
      fetchQuarterGoals(quarter.id),
      fetchQuarterReview(quarter),
    ]).then(([goalRows, reviewRow]) => {
      setGoals(goalRows)
      setReview(reviewRow)
    })
  }, [quarter])

  function replaceGoal(next) {
    setGoals(prev => prev.map(goal => goal.id === next.id ? next : goal))
  }

  async function saveGoal(goal) {
    setSaving(true)
    try {
      const saved = await upsertQuarterGoal(goal)
      if (goal.id) replaceGoal(saved)
      else {
        setGoals(prev => [...prev, saved])
        setDraft(emptyGoal(quarter))
      }
      setStatus('saved')
      setTimeout(() => setStatus(''), 2200)
    } catch (err) {
      setStatus('error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeGoal(goalId) {
    setSaving(true)
    try {
      await deleteQuarterGoal(goalId)
      setGoals(prev => prev.filter(goal => goal.id !== goalId))
      setStatus('deleted')
      setTimeout(() => setStatus(''), 2200)
    } catch (err) {
      setStatus('error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveReview() {
    setSaving(true)
    try {
      const saved = await upsertQuarterReview(quarter, review)
      setReview(saved)
      setStatus('review saved')
      setTimeout(() => setStatus(''), 2200)
    } catch (err) {
      setStatus('error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function startNextQuarter() {
    setSaving(true)
    try {
      if (review) await upsertQuarterReview(quarter, review)
      const next = await createNextQuarter(quarter, { next_theme: review?.next_theme })
      onQuarterChanged(next)
    } catch (err) {
      setStatus('error: ' + err.message)
      setSaving(false)
    }
  }

  const goalGroups = ARENAS.map(arena => ({
    ...arena,
    goals: goals.filter(goal => goal.arena === arena.key),
  }))

  return (
    <div>
      <div className={s.h2}>Quarter Goals</div>
      <div className={s.intro}>
        {quarter.label}: {fmtDate(quarter.start_date)} to {fmtDate(quarter.end_date)}.
        {' '}Keep this lean. The point is daily accountability, not an impressive list.
      </div>

      <div className={s.quarterCard}>
        <div>
          <div className={s.quarterTitle}>{quarter.theme || 'No theme set'}</div>
          <div className={s.quarterMeta}>{totalDays(quarter)} days. Five arenas. One operator being built.</div>
        </div>
      </div>

      {goalGroups.map(group => (
        <Sec key={group.key} title={group.label} defaultOpen={group.key === 'discipline' || group.key === 'sales'}>
          {group.goals.length === 0 && (
            <div className={s.empty}>No goal in this arena yet.</div>
          )}

          {group.goals.map(goal => (
            <GoalEditor
              key={goal.id}
              goal={goal}
              saving={saving}
              onChange={next => replaceGoal(next)}
              onSave={() => saveGoal(goal)}
              onDelete={() => removeGoal(goal.id)}
            />
          ))}
        </Sec>
      ))}

      <Sec title="Add Goal">
        <div className={s.goalEdit}>
          <Field label="Arena">
            <select value={draft.arena} onChange={e => setDraft({ ...draft, arena: e.target.value })}>
              {ARENAS.map(arena => <option key={arena.key} value={arena.key}>{arena.label}</option>)}
            </select>
          </Field>
          <Field label="Goal">
            <input type="text" value={draft.title}
              placeholder="Example: Contact 20 landlords each week"
              onChange={e => setDraft({ ...draft, title: e.target.value })} />
          </Field>
          <Field label="Target">
            <input type="text" value={draft.target_value}
              placeholder="Example: 20 contacts/week"
              onChange={e => setDraft({ ...draft, target_value: e.target.value })} />
          </Field>
          <button className="inv" disabled={saving || !draft.title.trim()} onClick={() => saveGoal(draft)}>
            Add Goal
          </button>
        </div>
      </Sec>

      {review && (
        <Sec title="Quarter Review & Rollover">
          <div className={s.reviewGrid}>
            {[
              ['wins', 'Wins achieved'],
              ['misses', 'Goals missed'],
              ['patterns', 'Pattern that kept showing up'],
              ['lessons', 'Lessons to carry forward'],
              ['rollover', 'What should roll into next quarter'],
              ['next_theme', 'Next quarter theme'],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <textarea rows={key === 'next_theme' ? 2 : 3}
                  value={review[key] ?? ''}
                  onChange={e => setReview({ ...review, [key]: e.target.value })} />
              </Field>
            ))}
          </div>
          <div className={s.actionRow}>
            <button onClick={saveReview} disabled={saving}>Save Review</button>
            <button className="inv" onClick={startNextQuarter} disabled={saving}>
              Start Next Quarter
            </button>
          </div>
        </Sec>
      )}

      <Sec title="Daily Standard">
        {[
          'Morning: choose three outcomes that move quarter goals.',
          'Daytime: protect deep work and complete one revenue or sales action.',
          'Evening: score honestly, name the leak, choose tomorrow first move.',
          'Weekly: review evidence, not mood.',
        ].map(item => (
          <div key={item} className={s.targetRow}>
            <span className={s.targetBullet}>-</span>
            <span className={s.targetText}>{item}</span>
          </div>
        ))}
      </Sec>

      <div className={s.statusLine}>
        {saving && 'Saving...'}
        {!saving && status && status}
      </div>
    </div>
  )
}

function GoalEditor({ goal, saving, onChange, onSave, onDelete }) {
  return (
    <div className={s.goalEdit}>
      <div className={s.goalTop}>
        <div>
          <div className={s.goalArena}>{arenaLabel(goal.arena)}</div>
          <input type="text" value={goal.title}
            onChange={e => onChange({ ...goal, title: e.target.value })} />
        </div>
        <select value={goal.status} onChange={e => onChange({ ...goal, status: e.target.value })}>
          <option value="active">Active</option>
          <option value="achieved">Achieved</option>
          <option value="paused">Paused</option>
          <option value="dropped">Dropped</option>
        </select>
      </div>
      <div className={s.goalTwo}>
        <Field label="Target">
          <input type="text" value={goal.target_value ?? ''}
            onChange={e => onChange({ ...goal, target_value: e.target.value })} />
        </Field>
        <Field label="Current">
          <input type="text" value={goal.current_value ?? ''}
            onChange={e => onChange({ ...goal, current_value: e.target.value })} />
        </Field>
      </div>
      <Field label="Notes">
        <textarea rows={2} value={goal.notes ?? ''}
          onChange={e => onChange({ ...goal, notes: e.target.value })} />
      </Field>
      <div className={s.actionRow}>
        <button className="inv" disabled={saving || !goal.title.trim()} onClick={onSave}>Save Goal</button>
        <button disabled={saving} onClick={onDelete}>Delete</button>
      </div>
    </div>
  )
}
