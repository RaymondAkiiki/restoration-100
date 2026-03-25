import { useState, useEffect } from 'react'
import { fetchAllDaysSummary } from '../lib/db.js'
import {
  TOTAL_DAYS, todayDayN, dayDate, fmtShort, phase, dayChecks, dayScore,
} from '../lib/constants.js'
import s from './CalPage.module.css'

const PHASES = [
  { label: 'Phase 1 — Stabilize', a: 1,  b: 39,  target: '4 May 2026' },
  { label: 'Phase 2 — Build',     a: 40, b: 74,  target: '8 Jun 2026' },
  { label: 'Phase 3 — Prove',     a: 75, b: 99,  target: '3 Jul 2026' },
  { label: 'Day 100 — Arrival',   a: 100, b: 100, target: '4 Jul 2026 — Birthday' },
]

export default function CalPage({ onSelect }) {
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const tn = todayDayN()

  useEffect(() => {
    fetchAllDaysSummary()
      .then(rows => { setSummary(rows); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const byDay = {}
  summary.forEach(r => { byDay[r.day_number] = r })

  const totalDone = summary.filter(r => dayChecks(r) >= 3).length

  return (
    <div>
      <div className={s.h2}>100-Day Overview</div>

      {/* top stats */}
      <div className={s.stats}>
        {[
          { l: 'Days completed', v: totalDone },
          { l: 'Days entered',   v: summary.length },
          { l: 'Days remaining', v: Math.max(0, TOTAL_DAYS - Math.max(0, tn - 1)) },
          { l: 'Today',          v: tn >= 1 && tn <= TOTAL_DAYS ? `Day ${tn}` : tn < 1 ? 'Not started' : 'Complete' },
        ].map(({ l, v }) => (
          <div key={l} className={s.stat}>
            <div className={s.statLabel}>{l}</div>
            <div className={s.statVal}>{v}</div>
          </div>
        ))}
      </div>

      {loading && <div className={s.loading}>Loading...</div>}

      {PHASES.map(({ label, a, b, target }) => {
        const days     = Array.from({ length: b - a + 1 }, (_, i) => a + i)
        const pastDays = days.filter(n => n < tn)
        const done     = pastDays.filter(n => dayChecks(byDay[n] || {}) >= 3).length

        return (
          <div key={label} className={s.phase}>
            <div className={s.phaseHead}>
              <div className={s.phaseLabel}>{label}</div>
              <div className={s.phaseMeta}>
                <span>Ends {target}</span>
                {pastDays.length > 0 && (
                  <span>{done}/{pastDays.length} days done</span>
                )}
              </div>
            </div>
            <div className={s.grid}>
              {days.map(n => {
                const info    = byDay[n] || {}
                const isToday = n === tn
                const past    = n < tn
                const chk     = dayChecks(info)
                const score   = dayScore(info)
                const full    = past && chk >= 3
                const partial = past && chk > 0 && chk < 3
                const empty   = past && chk === 0 && summary.some(r => r.day_number === n) === false && n < tn

                let cls = s.dayCell
                if (isToday)  cls += ' ' + s.today
                if (full)     cls += ' ' + s.full
                else if (partial) cls += ' ' + s.partial
                else if (past)    cls += ' ' + s.past

                return (
                  <div
                    key={n}
                    className={cls}
                    onClick={() => onSelect(n)}
                    title={`Day ${n} — ${fmtShort(dayDate(n))}${past ? ` | ${chk}/6 checks, ${score}/25` : ''}`}
                  >
                    <span className={s.dayCellNum}>{n}</span>
                    {past && chk > 0 && (
                      <span className={s.dayCellDot} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className={s.legend}>
        <span className={`${s.swatch} ${s.swFull}`} /> 3+ tasks done &nbsp;
        <span className={`${s.swatch} ${s.swPartial}`} /> partially done &nbsp;
        <span className={`${s.swatch} ${s.swPast}`} /> past, no entry &nbsp;
        <span className={`${s.swatch} ${s.swToday}`} style={{ border: '2px solid var(--fg)' }} /> today
      </div>
    </div>
  )
}
