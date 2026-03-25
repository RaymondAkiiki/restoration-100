import { todayDayN, TOTAL_DAYS, phase, fmtDate, dayDate } from '../lib/constants.js'
import s from './Nav.module.css'

export default function Nav({ view, setView, role, setRole, stats }) {
  const tn    = todayDayN()
  const inChallenge = tn >= 1 && tn <= TOTAL_DAYS
  const ph    = inChallenge ? phase(tn) : null
  const pct   = inChallenge ? Math.round((tn / TOTAL_DAYS) * 100) : (tn > TOTAL_DAYS ? 100 : 0)
  const done  = stats?.completed ?? 0

  return (
    <header className={s.header}>
      <div className={s.top}>
        <div>
          <div className={s.title}>100-Day Restoration</div>
          <div className={s.sub}>
            {tn < 1
              ? 'Starts 27 March 2026'
              : tn > TOTAL_DAYS
              ? 'Challenge complete — 4 Jul 2026'
              : `Day ${tn} of ${TOTAL_DAYS} — ${ph?.name}`}
          </div>
          {inChallenge && (
            <div className={s.sub2}>{fmtDate(dayDate(tn))}</div>
          )}
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

      {(inChallenge || tn > TOTAL_DAYS) && (
        <div className={s.progress}>
          <div className={s.bar}>
            <div className={s.fill} style={{ width: `${pct}%` }} />
          </div>
          <div className={s.barMeta}>
            <span>{done} days completed ({Math.round((done / Math.max(1, Math.min(tn, TOTAL_DAYS))) * 100)}%)</span>
            <span>avg score {stats?.avgScore ?? '—'}/25</span>
            <span>{Math.max(0, TOTAL_DAYS - tn)} days remaining</span>
          </div>
        </div>
      )}

      <nav className={s.nav}>
        {[
          ['today',    'Today'],
          ['calendar', 'Calendar'],
          ['weekly',   'Weekly'],
          ['targets',  'Targets'],
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
