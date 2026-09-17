import { useState, useEffect, useCallback } from 'react'
import { fetchDay, fetchQuarterGoals, upsertDay } from '../lib/db.js'
import {
  CHECKS, SCORE_ITEMS, arenaLabel, blankDay, dayChecks, dayDate,
  dayScore, fmtDate, quarterPhase, todayDayN, totalDays,
} from '../lib/constants.js'
import Sec from './Sec.jsx'
import s from './DayPage.module.css'

const LBL = ({ children }) => (
  <span className={s.lbl}>{children}</span>
)

const FieldRow = ({ label, value, onChange, disabled, multiline, placeholder }) => (
  <div className={s.fieldRow}>
    <LBL>{label}</LBL>
    {multiline
      ? <textarea rows={3} disabled={disabled} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)} />
      : <input type="text" disabled={disabled} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)} />
    }
  </div>
)

export default function DayPage({ quarter, n, role, onBack }) {
  const [currN, setCurrN] = useState(n)
  const [day, setDay] = useState(null)
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [dirty, setDirty] = useState(false)

  const own = role === 'owner'
  const maxDays = totalDays(quarter)
  const ph = quarterPhase(quarter, currN)
  const draftKey = `draft_day_${quarter.id}_${currN}`

  useEffect(() => {
    setCurrN(n)
  }, [n])

  useEffect(() => {
    setLoading(true)
    setDirty(false)
    setStatus('')

    const savedDraft = localStorage.getItem(draftKey)
    let localDraft = null
    if (savedDraft) {
      try {
        localDraft = JSON.parse(savedDraft)
      } catch {
        // ignore parse error
      }
    }

    Promise.all([
      fetchDay(quarter, currN),
      fetchQuarterGoals(quarter.id),
    ])
      .then(([d, g]) => {
        if (localDraft && own) {
          setDay({ ...d, ...localDraft })
          setDirty(true)
          setStatus('Restored unsaved draft from local storage.')
        } else {
          setDay(d)
        }
        setGoals(g.filter(goal => goal.status === 'active' || goal.status === 'achieved'))
        setLoading(false)
      })
      .catch(() => {
        if (localDraft && own) {
          setDay(localDraft)
          setDirty(true)
          setStatus('Restored unsaved draft from local storage.')
        } else {
          setDay(blankDay(quarter, currN))
        }
        setLoading(false)
      })
  }, [quarter, currN, draftKey, own])

  function patch(fn) {
    setDay(prev => {
      const next = { ...prev }
      fn(next)
      if (own) {
        try {
          localStorage.setItem(draftKey, JSON.stringify(next))
        } catch {
          // ignore
        }
      }
      return next
    })
    setDirty(true)
    setStatus('')
  }

  const save = useCallback(async () => {
    if (!day) return
    setSaving(true)
    try {
      const saved = await upsertDay(quarter, day)
      setDay(saved)
      setDirty(false)
      try {
        localStorage.removeItem(draftKey)
      } catch {
        // ignore
      }
      setStatus('saved')
      setTimeout(() => setStatus(''), 2500)
    } catch (err) {
      setStatus('error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }, [day, quarter, draftKey])

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (dirty && !saving && own) {
          save()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dirty, saving, own, save])

  if (loading) return <div className={s.loading}>Loading day {currN}...</div>
  if (!day) return <div className={s.loading}>Could not load day {currN}.</div>

  const score = dayScore(day)
  const checks = dayChecks(day)
  const isToday = currN === todayDayN(quarter)

  return (
    <div>
      <div className={s.navRow}>
        <div>
          {onBack && (
            <button className="sm" onClick={onBack}>
              Back to Quarter
            </button>
          )}
        </div>
        <div className={s.navBtns}>
          <button
            className="sm"
            disabled={currN <= 1}
            onClick={() => setCurrN(prev => Math.max(1, prev - 1))}
          >
            ← Prev Day
          </button>
          <button
            className="sm"
            disabled={currN >= maxDays}
            onClick={() => setCurrN(prev => Math.min(maxDays, prev + 1))}
          >
            Next Day →
          </button>
        </div>
      </div>

      <div className={s.dayHeader}>
        <div>
          <div className={s.dayNum}>Day {currN}</div>
          <div className={s.dayDate}>{fmtDate(dayDate(quarter, currN))}</div>
          <div className={s.phaseName}>{ph.name}</div>
          <div className={s.phaseDesc}>{ph.desc}</div>
          {isToday && <div className={s.todayBadge}>Today</div>}
        </div>
        <div className={s.scoreBox}>
          <div className={s.scoreBig}>{score}<span className={s.scoreOf}>/25</span></div>
          <div className={s.scoreLabel}>score</div>
          <div className={s.checkBig}>{checks}<span className={s.scoreOf}>/6</span></div>
          <div className={s.scoreLabel}>tasks</div>
        </div>
      </div>

      <Sec title="Morning Plan" defaultOpen={isToday}>
        <div className={s.hint}>Three outcomes max. Each one should move the quarter, not just fill the day.</div>
        {[0, 1, 2].map(i => (
          <div key={i} className={s.fieldRow}>
            <LBL>Outcome {i + 1}</LBL>
            <div className={s.outcomeStack}>
              <input type="text" disabled={!own}
                placeholder={`${i + 1}.`}
                value={day.top3?.[i] ?? ''}
                onChange={e => patch(d => {
                  d.top3 = [...(d.top3 || ['', '', ''])]
                  d.top3[i] = e.target.value
                })} />
              <select disabled={!own}
                value={day.top3_goal_ids?.[i] ?? ''}
                onChange={e => patch(d => {
                  d.top3_goal_ids = [...(d.top3_goal_ids || ['', '', ''])]
                  d.top3_goal_ids[i] = e.target.value
                })}>
                <option value="">No linked goal</option>
                {goals.map(goal => (
                  <option key={goal.id} value={String(goal.id)}>
                    {arenaLabel(goal.arena)} - {goal.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        <FieldRow label="Must-not-fail commitment" value={day.must_not_fail ?? ''} disabled={!own}
          placeholder="The one thing that absolutely must happen today"
          onChange={v => patch(d => { d.must_not_fail = v })} />
        <FieldRow label="Likely distraction or weakness today" value={day.distraction ?? ''} disabled={!own}
          placeholder="Name the leak before it starts"
          onChange={v => patch(d => { d.distraction = v })} />
      </Sec>

      <Sec title="Daily Checklist" badge={`${checks} / 6`} defaultOpen={isToday}>
        {CHECKS.map(c => (
          <label key={c.key} className={`${s.checkRow} ${!own ? s.disabled : ''}`}>
            <input type="checkbox"
              checked={day.checks?.[c.key] ?? false}
              disabled={!own}
              onChange={e => patch(d => {
                d.checks = { ...d.checks, [c.key]: e.target.checked }
              })} />
            <span className={s.checkLabel}>{c.label}</span>
          </label>
        ))}
      </Sec>

      <Sec title="Daily Score" badge={`${score} / 25`} defaultOpen={isToday}>
        <div className={s.hint}>Rate 1-5. The question is simple: did your behavior match your ambition?</div>
        {SCORE_ITEMS.map(si => {
          const val = day.scores?.[si.key] ?? 0
          return (
            <div key={si.key} className={s.scoreRow}>
              <div className={s.scoreRowTop}>
                <span className={s.scoreItemLabel}>{si.label}</span>
                <span className={s.scoreVal}>{val} / 5</span>
              </div>
              <div className={s.scorePips}>
                {[1, 2, 3, 4, 5].map(v => (
                  <button key={v}
                    className={val >= v ? 'inv sm' : 'sm'}
                    disabled={!own}
                    onClick={() => patch(d => {
                      d.scores = { ...d.scores, [si.key]: v }
                    })}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </Sec>

      <Sec title="End-of-Day Review">
        <FieldRow label="Did I do what I said?" value={day.avoided ?? ''} disabled={!own}
          multiline placeholder="Where did I keep or break my word?"
          onChange={v => patch(d => { d.avoided = v })} />
        <FieldRow label="What moved today?" value={day.moved ?? ''} disabled={!own}
          multiline placeholder="Revenue, sales, body, emotional recovery, relationship repair, or discipline evidence."
          onChange={v => patch(d => { d.moved = v })} />
        <FieldRow label="What moves first tomorrow?" value={day.tomorrow ?? ''} disabled={!own}
          placeholder="Name the first concrete action."
          onChange={v => patch(d => { d.tomorrow = v })} />
      </Sec>

      <Sec title="Notes">
        <FieldRow label="Owner note" value={day.owner_note ?? ''} disabled={!own}
          multiline placeholder="Significant wins, failures, decisions, or observations today."
          onChange={v => patch(d => { d.owner_note = v })} />
        <FieldRow label="Partner note - accountability"
          value={day.partner_note ?? ''}
          disabled={role !== 'partner'}
          multiline
          placeholder="Partner: does the evidence match the stated ambition?"
          onChange={v => patch(d => { d.partner_note = v })} />
      </Sec>

      <div className={s.saveBar}>
        <button className="inv" onClick={save} disabled={saving || !dirty}>
          {saving ? 'Saving...' : 'Save to Supabase'}
        </button>
        {!dirty && !saving && <span className={s.saveHint}>No unsaved changes</span>}
        {dirty && !saving && <span className={s.saveHint}>Unsaved changes</span>}
        {status === 'saved' && <span className={s.saveOk}>Saved to database.</span>}
        {status.startsWith('error') && <span className={s.saveErr}>{status}</span>}
      </div>
    </div>
  )
}
