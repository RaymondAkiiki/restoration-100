import { useState, useEffect } from 'react'
import { fetchDay, upsertDay } from '../lib/db.js'
import {
  CHECKS, SCORE_ITEMS, phase, fmtDate, dayDate,
  dayScore, dayChecks, blankDay, todayDayN,
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

export default function DayPage({ n, role, onBack }) {
  const [day,    setDay]    = useState(null)
  const [loading,setLoading]= useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [dirty,  setDirty]  = useState(false)

  const own = role === 'owner'
  const ph  = phase(n)

  useEffect(() => {
    setLoading(true)
    setDirty(false)
    setStatus('')
    fetchDay(n)
      .then(d  => { setDay(d); setLoading(false) })
      .catch(() => { setDay(blankDay(n)); setLoading(false) })
  }, [n])

  function patch(fn) {
    setDay(prev => { const next = { ...prev }; fn(next); return next })
    setDirty(true)
    setStatus('')
  }

  async function save() {
    setSaving(true)
    try {
      const saved = await upsertDay(day)
      setDay(saved)
      setDirty(false)
      setStatus('saved')
      setTimeout(() => setStatus(''), 2500)
    } catch (err) {
      setStatus('error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className={s.loading}>Loading day {n}...</div>
  if (!day)    return <div className={s.loading}>Could not load day {n}.</div>

  const score   = dayScore(day)
  const checks  = dayChecks(day)
  const isToday = n === todayDayN()

  return (
    <div>
      {onBack && (
        <button className="sm" style={{ marginBottom: 13 }} onClick={onBack}>
          left Calendar
        </button>
      )}

      <div className={s.dayHeader}>
        <div>
          <div className={s.dayNum}>Day {n}</div>
          <div className={s.dayDate}>{fmtDate(dayDate(n))}</div>
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

      <Sec title="Morning Plan — complete before 7:00 AM" defaultOpen={isToday}>
        <div className={s.hint}>Three outcomes max. Write them and commit.</div>
        {[0, 1, 2].map(i => (
          <div key={i} className={s.fieldRow}>
            <LBL>Outcome {i + 1}</LBL>
            <input type="text" disabled={!own}
              placeholder={`${i + 1}.`}
              value={day.top3?.[i] ?? ''}
              onChange={e => patch(d => {
                d.top3 = [...(d.top3 || ['', '', ''])]
                d.top3[i] = e.target.value
              })} />
          </div>
        ))}
        <FieldRow label="Must-not-fail commitment" value={day.must_not_fail ?? ''} disabled={!own}
          placeholder="The one thing that absolutely must happen today"
          onChange={v => patch(d => { d.must_not_fail = v })} />
        <FieldRow label="Likely distraction or weakness today" value={day.distraction ?? ''} disabled={!own}
          placeholder="Name it now. Low energy? Outreach avoidance? Resentment?"
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

      <Sec title="Daily Score — do not lie to yourself" badge={`${score} / 25`} defaultOpen={isToday}>
        <div className={s.hint}>Rate 1-5. 5 = fully delivered. 1 = failed completely.</div>
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
        <div className={s.scoreSummary}>
          Total: {score}/25
          {score >= 20 && ' - Strong day.'}
          {score >= 15 && score < 20 && ' - Decent. Push harder tomorrow.'}
          {score >= 10 && score < 15 && ' - Below standard. Be honest about why.'}
          {score > 0 && score < 10 && ' - Poor. Name what broke down.'}
          {score === 0 && ' - Not scored yet.'}
        </div>
      </Sec>

      <Sec title="End-of-Day Review">
        <FieldRow label="What did I avoid today?" value={day.avoided ?? ''} disabled={!own}
          multiline placeholder="Be specific. Not just outreach - which call? Which task? Why?"
          onChange={v => patch(d => { d.avoided = v })} />
        <FieldRow label="What moves first tomorrow?" value={day.tomorrow ?? ''} disabled={!own}
          placeholder="Name the first action. Not a category. A real task."
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
          placeholder="Partner: your honest observation. Does the evidence match the stated ambition?"
          onChange={v => patch(d => { d.partner_note = v })} />
      </Sec>

      <div className={s.saveBar}>
        <button className="inv" onClick={save} disabled={saving || !dirty}>
          {saving ? 'Saving...' : 'Save to Supabase'}
        </button>
        {!dirty && !saving && <span className={s.saveHint}>No unsaved changes</span>}
        {dirty  && !saving && <span className={s.saveHint}>Unsaved changes</span>}
        {status === 'saved'           && <span className={s.saveOk}>Saved to database.</span>}
        {status.startsWith('error')   && <span className={s.saveErr}>{status}</span>}
      </div>
    </div>
  )
}
