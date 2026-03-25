import { useState, useEffect, useCallback } from 'react'
import { fetchStats } from './lib/db.js'
import { todayDayN, TOTAL_DAYS } from './lib/constants.js'
import Nav       from './components/Nav.jsx'
import DayPage   from './components/DayPage.jsx'
import CalPage   from './components/CalPage.jsx'
import WeekPage  from './components/WeekPage.jsx'
import TargetsPage from './components/TargetsPage.jsx'
import s from './App.module.css'

export default function App() {
  const [view,    setView]    = useState('today')
  const [role,    setRole]    = useState('owner')   // 'owner' | 'partner'
  const [selDay,  setSelDay]  = useState(null)
  const [stats,   setStats]   = useState(null)

  const tn = todayDayN()
  const todayN = Math.max(1, Math.min(TOTAL_DAYS, tn || 1))

  const loadStats = useCallback(() => {
    fetchStats().then(setStats).catch(() => {})
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  function goDay(n) {
    setSelDay(n)
    setView('day')
  }

  function handleViewChange(v) {
    setView(v)
    if (v === 'today') loadStats()
  }

  return (
    <div className={s.app}>
      <div className={s.inner}>
        <Nav
          view={view === 'day' ? 'calendar' : view}
          setView={handleViewChange}
          role={role}
          setRole={setRole}
          stats={stats}
        />

        {view === 'today' && (
          <DayPage
            n={todayN}
            role={role}
            onBack={null}
          />
        )}

        {view === 'calendar' && (
          <CalPage onSelect={n => goDay(n)} />
        )}

        {view === 'day' && selDay !== null && (
          <DayPage
            n={selDay}
            role={role}
            onBack={() => setView('calendar')}
          />
        )}

        {view === 'weekly' && (
          <WeekPage role={role} />
        )}

        {view === 'targets' && (
          <TargetsPage />
        )}
      </div>
    </div>
  )
}
