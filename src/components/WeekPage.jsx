import { useState, useEffect, useCallback } from 'react'
import { fetchAllWeeks, fetchWeek, fetchWeekDaysSummary, upsertWeek } from '../lib/db.js'
import { BIZ_FIELDS, fmtShort, dayDate, todayDayN, totalDays, weekForDay, weekRange } from '../lib/constants.js'
import Sec from './Sec.jsx'
import s from './WeekPage.module.css'

export default function WeekPage({ quarter, role }) {
  const days = totalDays(quarter)
  const totalWeeks = Math.ceil(days / 7)
  const tn = Math.max(1, Math.min(days, todayDayN(quarter) || 1))
  const [w, setW] = useState(weekForDay(tn))
  const [week, setWeek] = useState(null)
  const [weekDays, setWeekDays] = useState([])
  const [allW, setAllW] = useState([])
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [dirty, setDirty] = useState(false)

  const own = role === 'owner'
  const draftKey = `draft_week_${quarter.id}_${w}`

  useEffect(() => {
    fetchAllWeeks(quarter.id).then(rows => setAllW(rows))
  }, [quarter.id])

  useEffect(() => {
    setDirty(false)
    setStatus('')

    const savedDraft = localStorage.getItem(draftKey)
    let localDraft = null
    if (savedDraft) {
      try {
        localDraft = JSON.parse(savedDraft)
      } catch {
        // ignore
      }
    }

    Promise.all([
      fetchWeek(quarter, w),
      fetchWeekDaysSummary(quarter, w),
    ]).then(([d, dDays]) => {
      if (localDraft && own) {
        setWeek({ ...d, ...localDraft })
        setDirty(true)
        setStatus('Restored unsaved draft from local storage.')
      } else {
        setWeek(d)
      }
      setWeekDays(dDays || [])
    })
  }, [quarter, w, draftKey, own])

  function patch(fn) {
    setWeek(prev => {
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
    if (!week) return
    setSaving(true)
    try {
      const saved = await upsertWeek(quarter, week)
      setWeek(saved)
      setAllW(prev => {
        const idx = prev.findIndex(x => x.week_number === saved.week_number)
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
        return [...prev, saved]
      })
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
  }, [week, quarter, draftKey])

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

  const { startDay, endDay } = weekRange(quarter, w)
  const filledWeeks = allW.filter(x => x.biz_metrics?.revenue)

  const countChecks = key => weekDays.filter(d => d.checks?.[key]).length
  const bodyCount = countChecks('body')
  const salesCount = countChecks('sales')
  const moneyCount = countChecks('money')
  const deepCount = countChecks('deep')

  return (
    <div>
      <div className={s.weekNav}>
        <button className="sm" onClick={() => setW(v => Math.max(1, v - 1))} disabled={w <= 1}>Prev</button>
        <div className={s.weekTitle}>
          <span>Week {w}</span>
          <span className={s.weekRange}>
            Days {startDay}-{endDay} / {fmtShort(dayDate(quarter, startDay))}-{fmtShort(dayDate(quarter, endDay))}
          </span>
        </div>
        <button className="sm" onClick={() => setW(v => Math.min(totalWeeks, v + 1))} disabled={w >= totalWeeks}>Next</button>
      </div>

      <div className={s.weekPicker}>
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(wn => {
          const entered = allW.some(x => x.week_number === wn && (
            x.biz_metrics?.revenue || x.biz_metrics?.contacts || x.kept_word || x.broke_word
          ))
          return (
            <button key={wn} className={`sm ${w === wn ? 'inv' : ''}`}
              style={{ width: 34, padding: '4px 0', position: 'relative' }}
              onClick={() => setW(wn)}>
              {wn}
              {entered && (
                <span style={{ position: 'absolute', top: 2, right: 3, width: 4, height: 4,
                  borderRadius: '50%', background: w === wn ? 'var(--bg)' : 'var(--fg)' }} />
              )}
            </button>
          )
        })}
      </div>

      {!week && <div className={s.loading}>Loading week {w}...</div>}

      {week && (
        <>
          <Sec title="Weekly Scoreboard" defaultOpen>
            <div className={s.bridgeBanner}>
              <div className={s.bridgeTitle}>Daily Checks Evidence ({weekDays.length}/7 days logged this week):</div>
              <div className={s.bridgeBadges}>
                <span className={s.bridgeBadge}>Body / Workout: <strong>{bodyCount} / 7</strong></span>
                <span className={s.bridgeBadge}>Sales Action: <strong>{salesCount} / 7</strong></span>
                <span className={s.bridgeBadge}>Money Tracked: <strong>{moneyCount} / 7</strong></span>
                <span className={s.bridgeBadge}>Deep Work: <strong>{deepCount} / 7</strong></span>
              </div>
            </div>
            <div className={s.bizGrid}>
              {BIZ_FIELDS.map(({ key, label }) => (
                <div key={key} className={s.bizRow}>
                  <span className={s.bizLabel}>{label}</span>
                  <input type="text" disabled={!own}
                    value={(week.biz_metrics?.[key]) ?? ''}
                    onChange={e => patch(d => {
                      d.biz_metrics = { ...d.biz_metrics, [key]: e.target.value }
                    })} />
                </div>
              ))}
            </div>
          </Sec>

          <Sec title="Weekly Accountability Review">
            <div className={s.fieldRow}>
              <span className={s.lbl}>Where did I keep my word this week?</span>
              <textarea rows={3} disabled={!own} value={week.kept_word ?? ''}
                onChange={e => patch(d => { d.kept_word = e.target.value })} />
            </div>
            <div className={s.fieldRow}>
              <span className={s.lbl}>Where did I break my word this week?</span>
              <textarea rows={3} disabled={!own} value={week.broke_word ?? ''}
                onChange={e => patch(d => { d.broke_word = e.target.value })} />
            </div>
            <div className={s.fieldRow}>
              <span className={s.lbl}>Which quarterly goal moved?</span>
              <textarea rows={2} disabled={!own} value={week.goal_progress ?? ''}
                onChange={e => patch(d => { d.goal_progress = e.target.value })} />
            </div>
            <div className={s.fieldRow}>
              <span className={s.lbl}>What pattern showed up again?</span>
              <textarea rows={3} disabled={!own} value={week.pattern ?? ''}
                onChange={e => patch(d => { d.pattern = e.target.value })} />
            </div>
            <div className={s.fieldRow}>
              <span className={s.lbl}>Money note</span>
              <textarea rows={2} disabled={!own} value={week.money_note ?? ''}
                onChange={e => patch(d => { d.money_note = e.target.value })} />
            </div>
          </Sec>

          <Sec title="Next Week - Top 3 Priorities">
            {[0, 1, 2].map(i => (
              <div key={i} className={s.fieldRow}>
                <span className={s.lbl}>Priority {i + 1}</span>
                <input type="text" disabled={!own}
                  value={(week.next3?.[i]) ?? ''}
                  onChange={e => patch(d => {
                    d.next3 = [...(d.next3 || ['', '', ''])]
                    d.next3[i] = e.target.value
                  })} />
              </div>
            ))}
          </Sec>

          {own && (
            <div className={s.saveBar}>
              <button className="inv" onClick={save} disabled={saving || !dirty}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              {!dirty && !saving && <span className={s.hint}>No unsaved changes</span>}
              {dirty && !saving && <span className={s.hint}>Unsaved changes</span>}
              {status === 'saved' && <span className={s.ok}>Saved.</span>}
              {status.startsWith('error') && <span className={s.err}>{status}</span>}
            </div>
          )}
        </>
      )}

      {filledWeeks.length > 1 && (
        <div className={s.trend}>
          <div className={s.trendTitle}>Revenue Trend</div>
          <div className={s.trendBars}>
            {filledWeeks.map(wk => {
              const raw = wk.biz_metrics?.revenue ?? ''
              const num = parseFloat(String(raw).replace(/[^0-9.]/g, ''))
              return (
                <div key={wk.week_number} className={s.trendCol}>
                  <div className={s.trendBarWrap}>
                    <div className={s.trendBar} style={{
                      height: isNaN(num) ? 0 : `${Math.min(100, (num / 10000000) * 100)}%`
                    }} />
                  </div>
                  <div className={s.trendLbl}>W{wk.week_number}</div>
                </div>
              )
            })}
          </div>
          <div className={s.trendNote}>Bar height relative to 10,000,000 UGX.</div>
        </div>
      )}
    </div>
  )
}
