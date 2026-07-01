import { useState, useEffect } from 'react'
import { fetchAllDaysSummary } from '../lib/db.js'
import {
  dayChecks, dayDate, dayScore, fmtShort, quarterPhase, todayDayN, totalDays,
} from '../lib/constants.js'
import s from './CalPage.module.css'

function segmentsForQuarter(quarter) {
  const days = totalDays(quarter)
  const one = Math.ceil(days / 3)
  const two = Math.ceil((days * 2) / 3)
  return [
    { label: 'Month 1 - Stabilize', a: 1, b: one },
    { label: 'Month 2 - Build', a: one + 1, b: two },
    { label: 'Month 3 - Prove', a: two + 1, b: days },
  ]
}

export default function CalPage({ quarter, onSelect }) {
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const tn = todayDayN(quarter)
  const daysTotal = totalDays(quarter)

  useEffect(() => {
    setLoading(true)
    fetchAllDaysSummary(quarter.id)
      .then(rows => { setSummary(rows); setLoading(false) })
      .catch(() => setLoading(false))
  }, [quarter.id])

  const byDay = {}
  summary.forEach(r => { byDay[r.day_number] = r })

  const totalDone = summary.filter(r => dayChecks(r) >= 3).length

  return (
    <div>
      <div className={s.h2}>Quarter Overview</div>

      <div className={s.stats}>
        {[
          { l: 'Days completed', v: totalDone },
          { l: 'Days entered', v: summary.length },
          { l: 'Days remaining', v: Math.max(0, daysTotal - Math.max(0, tn - 1)) },
          { l: 'Today', v: tn >= 1 && tn <= daysTotal ? `Day ${tn}` : tn < 1 ? 'Not started' : 'Complete' },
        ].map(({ l, v }) => (
          <div key={l} className={s.stat}>
            <div className={s.statLabel}>{l}</div>
            <div className={s.statVal}>{v}</div>
          </div>
        ))}
      </div>

      {loading && <div className={s.loading}>Loading...</div>}

      {segmentsForQuarter(quarter).map(({ label, a, b }) => {
        const days = Array.from({ length: b - a + 1 }, (_, i) => a + i)
        const pastDays = days.filter(n => n < tn)
        const done = pastDays.filter(n => dayChecks(byDay[n] || {}) >= 3).length
        const endDate = fmtShort(dayDate(quarter, b))
        const current = tn >= a && tn <= b

        return (
          <div key={label} className={s.phase}>
            <div className={s.phaseHead}>
              <div className={s.phaseLabel}>
                {label}{current ? ` - ${quarterPhase(quarter, tn).desc}` : ''}
              </div>
              <div className={s.phaseMeta}>
                <span>Ends {endDate}</span>
                {pastDays.length > 0 && (
                  <span>{done}/{pastDays.length} days done</span>
                )}
              </div>
            </div>
            <div className={s.grid}>
              {days.map(n => {
                const info = byDay[n] || {}
                const isToday = n === tn
                const past = n < tn
                const chk = dayChecks(info)
                const score = dayScore(info)
                const full = past && chk >= 3
                const partial = past && chk > 0 && chk < 3

                let cls = s.dayCell
                if (isToday) cls += ' ' + s.today
                if (full) cls += ' ' + s.full
                else if (partial) cls += ' ' + s.partial
                else if (past) cls += ' ' + s.past

                return (
                  <div
                    key={n}
                    className={cls}
                    onClick={() => onSelect(n)}
                    title={`Day ${n} - ${fmtShort(dayDate(quarter, n))}${past ? ` | ${chk}/6 checks, ${score}/25` : ''}`}
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
