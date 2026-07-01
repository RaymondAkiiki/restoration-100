import { useState, useEffect, useCallback } from 'react'
import { fetchActiveQuarter, fetchStats } from './lib/db.js'
import { todayDayN, totalDays } from './lib/constants.js'
import Nav from './components/Nav.jsx'
import DayPage from './components/DayPage.jsx'
import CalPage from './components/CalPage.jsx'
import WeekPage from './components/WeekPage.jsx'
import TargetsPage from './components/TargetsPage.jsx'
import s from './App.module.css'

export default function App() {
  const [view, setView] = useState('today')
  const [role, setRole] = useState('owner')
  const [selDay, setSelDay] = useState(null)
  const [stats, setStats] = useState(null)
  const [quarter, setQuarter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStats = useCallback((quarterId = quarter?.id) => {
    if (!quarterId) return
    fetchStats(quarterId).then(setStats).catch(() => {})
  }, [quarter?.id])

  useEffect(() => {
    fetchActiveQuarter()
      .then(q => {
        setQuarter(q)
        setLoading(false)
        fetchStats(q.id).then(setStats).catch(() => {})
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className={s.app}><div className={s.inner}>Loading quarter...</div></div>
  }

  if (error || !quarter) {
    return (
      <div className={s.app}>
        <div className={s.inner}>
          <div className={s.errorTitle}>Quarter system is not ready.</div>
          <div className={s.errorText}>
            Run the updated schema.sql in Supabase, then refresh. Error: {error || 'No active quarter found.'}
          </div>
        </div>
      </div>
    )
  }

  const tn = todayDayN(quarter)
  const days = totalDays(quarter)
  const todayN = Math.max(1, Math.min(days, tn || 1))

  function goDay(n) {
    setSelDay(n)
    setView('day')
  }

  function handleViewChange(v) {
    setView(v)
    if (v === 'today') loadStats()
  }

  function handleQuarterChanged(nextQuarter) {
    setQuarter(nextQuarter)
    setStats(null)
    setSelDay(null)
    setView('today')
    loadStats(nextQuarter.id)
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
          quarter={quarter}
        />

        {view === 'today' && (
          <DayPage
            quarter={quarter}
            n={todayN}
            role={role}
            onBack={null}
          />
        )}

        {view === 'calendar' && (
          <CalPage quarter={quarter} onSelect={n => goDay(n)} />
        )}

        {view === 'day' && selDay !== null && (
          <DayPage
            quarter={quarter}
            n={selDay}
            role={role}
            onBack={() => setView('calendar')}
          />
        )}

        {view === 'weekly' && (
          <WeekPage quarter={quarter} role={role} />
        )}

        {view === 'targets' && (
          <TargetsPage quarter={quarter} onQuarterChanged={handleQuarterChanged} />
        )}
      </div>
    </div>
  )
}
