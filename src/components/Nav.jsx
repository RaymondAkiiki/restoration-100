import { fmtDate, dayDate, quarterPhase, todayDayN, totalDays } from '../lib/constants.js'
import s from './Nav.module.css'

export default function Nav({ view, setView, role, setRole, stats, quarter }) {
  const tn = todayDayN(quarter)
  const days = totalDays(quarter)
  const inQuarter = tn >= 1 && tn <= days
  const ph = inQuarter ? quarterPhase(quarter, tn) : null
  const pct = inQuarter ? Math.round((tn / days) * 100) : (tn > days ? 100 : 0)
  const done = stats?.completed ?? 0
  const elapsed = Math.max(1, Math.min(tn || 1, days))

  return (
    <header className={s.header}>
      <div className={s.top}>
        <div>
          <div className={s.title}>Quarterly Restoration</div>
          <div className={s.sub}>
            {quarter.label} - {quarter.theme || 'Build the operator, then build the outcomes.'}
          </div>
          <div className={s.sub2}>
            {tn < 1
              ? `Starts ${fmtDate(quarter.start_date)}`
              : tn > days
              ? `Quarter complete - ended ${fmtDate(quarter.end_date)}`
              : `Day ${tn} of ${days} - ${ph?.name} - ${fmtDate(dayDate(quarter, tn))}`}
          </div>
        </div>
        <div className={s.roleWrap}>
          <div className={s.roleLabel}>View</div>
          <div className={s.roleBtns}>
            <button
              className={role === 'owner' ? 'inv sm' : 'sm'}
              onClick={() => setRole('owner')}
            >Owner</button>
            <button
              className={role === 'partner' ? 'inv sm' : 'sm'}
              onClick={() => setRole('partner')}
            >Partner</button>
          </div>
        </div>
      </div>

      {(inQuarter || tn > days) && (
        <div className={s.progress}>
          <div className={s.bar}>
            <div className={s.fill} style={{ width: `${pct}%` }} />
          </div>
          <div className={s.barMeta}>
            <span>{done} days completed ({Math.round((done / elapsed) * 100)}%)</span>
            <span>avg score {stats?.avgScore ?? '-'}/25</span>
            <span>{Math.max(0, days - Math.max(0, tn))} days remaining</span>
          </div>
        </div>
      )}

      <nav className={s.nav}>
        {[
          ['today', 'Today'],
          ['calendar', 'Quarter'],
          ['weekly', 'Weekly'],
          ['targets', 'Goals'],
        ].map(([v, l]) => (
          <button
            key={v}
            className={`sm ${view === v ? 'inv' : ''}`}
            onClick={() => setView(v)}
          >{l}</button>
        ))}
      </nav>
    </header>
  )
}
