import { useState, useEffect } from 'react'
import { fetchWeek, upsertWeek, fetchAllWeeks } from '../lib/db.js'
import { BIZ_FIELDS, TOTAL_DAYS, todayDayN, weekForDay, blankWeek } from '../lib/constants.js'
import Sec from './Sec.jsx'
import s from './WeekPage.module.css'

const TOTAL_WEEKS = Math.ceil(TOTAL_DAYS / 7)

export default function WeekPage({ role }) {
  const tn    = Math.max(1, Math.min(TOTAL_DAYS, todayDayN() || 1))
  const [w,    setW]    = useState(weekForDay(tn))
  const [week, setWeek] = useState(null)
  const [allW, setAllW] = useState([])
  const [saving,  setSaving]  = useState(false)
  const [status,  setStatus]  = useState('')
  const [dirty,   setDirty]   = useState(false)

  const own = role === 'owner'

  useEffect(() => {
    fetchAllWeeks().then(rows => setAllW(rows))
  }, [])

  useEffect(() => {
    setDirty(false)
    setStatus('')
    fetchWeek(w).then(d => setWeek(d))
  }, [w])

  function patch(fn) {
    setWeek(prev => { const next = { ...prev }; fn(next); return next })
    setDirty(true)
    setStatus('')
  }

  async function save() {
    setSaving(true)
    try {
      const saved = await upsertWeek(week)
      setWeek(saved)
      setAllW(prev => {
        const idx = prev.findIndex(x => x.week_number === saved.week_number)
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
        return [...prev, saved]
      })
      setDirty(false)
      setStatus('saved')
      setTimeout(() => setStatus(''), 2500)
    } catch (err) {
      setStatus('error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const sa = (w - 1) * 7 + 1
  const ea = Math.min(w * 7, TOTAL_DAYS)

  // chart data for biz metric across weeks
  const filledWeeks = allW.filter(x => x.biz_metrics?.revenue)

  return (
    <div>
      {/* week selector */}
      <div className={s.weekNav}>
        <button className="sm" onClick={() => setW(v => Math.max(1, v - 1))} disabled={w <= 1}>Prev</button>
        <div className={s.weekTitle}>
          <span>Week {w}</span>
          <span className={s.weekRange}>Days {sa}–{ea}</span>
        </div>
        <button className="sm" onClick={() => setW(v => Math.min(TOTAL_WEEKS, v + 1))} disabled={w >= TOTAL_WEEKS}>Next</button>
      </div>

      {/* mini week picker */}
      <div className={s.weekPicker}>
        {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(wn => {
          const entered = allW.some(x => x.week_number === wn && x.biz_metrics?.revenue)
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
          <Sec title="Business Numbers — fill every row. Blank is a lie." defaultOpen>
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

          <Sec title="Personal Leadership Review">
            <div className={s.fieldRow}>
              <span className={s.lbl}>Where did I break my word this week?</span>
              <textarea rows={3} disabled={!own} value={week.broke_word ?? ''}
                onChange={e => patch(d => { d.broke_word = e.target.value })} />
            </div>
            <div className={s.fieldRow}>
              <span className={s.lbl}>What pattern showed up again?</span>
              <textarea rows={3} disabled={!own} value={week.pattern ?? ''}
                onChange={e => patch(d => { d.pattern = e.target.value })} />
            </div>
            <div className={s.fieldRow}>
              <span className={s.lbl}>Money note — wasteful spend or rule broken?</span>
              <textarea rows={2} disabled={!own} value={week.money_note ?? ''}
                onChange={e => patch(d => { d.money_note = e.target.value })} />
            </div>
          </Sec>

          <Sec title="Next Week — Top 3 Priorities">
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
              {dirty  && !saving && <span className={s.hint}>Unsaved changes</span>}
              {status === 'saved'        && <span className={s.ok}>Saved.</span>}
              {status.startsWith('error')&& <span className={s.err}>{status}</span>}
            </div>
          )}
        </>
      )}

      {/* historical revenue trend */}
      {filledWeeks.length > 1 && (
        <div className={s.trend}>
          <div className={s.trendTitle}>Revenue Trend (weeks with data)</div>
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
          <div className={s.trendNote}>Bar height relative to 10,000,000 UGX. Adjust scale as needed.</div>
        </div>
      )}
    </div>
  )
}
