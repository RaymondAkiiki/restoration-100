import { useState, useEffect, useCallback } from 'react'
import { fetchActiveQuarter, fetchQuarters, fetchQuarterById, fetchStats } from './lib/db.js'
import { todayDayN, totalDays } from './lib/constants.js'
import Nav from './components/Nav.jsx'
import DayPage from './components/DayPage.jsx'
import CalPage from './components/CalPage.jsx'
import WeekPage from './components/WeekPage.jsx'
import TargetsPage from './components/TargetsPage.jsx'
import TasksPage from './components/TasksPage.jsx'
import s from './App.module.css'

export default function App() {
  const [view, setView] = useState('today')
  const [role, setRole] = useState('owner')
  const [selDay, setSelDay] = useState(null)
  const [stats, setStats] = useState(null)
  const [quarter, setQuarter] = useState(null)
  const [quarters, setQuarters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStats = useCallback((quarterId = quarter?.id) => {
    if (!quarterId) return
    fetchStats(quarterId).then(setStats).catch(() => {})
  }, [quarter?.id])

  const refreshQuarters = useCallback(async () => {
    try {
      const qList = await fetchQuarters()
      setQuarters(qList)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    Promise.all([
      fetchActiveQuarter(),
      fetchQuarters(),
    ])
      .then(([q, qList]) => {
        setQuarter(q)
        setQuarters(qList || [])
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

  async function handleSelectQuarter(quarterId) {
    const targetQ = quarters.find(q => q.id === quarterId) || await fetchQuarterById(quarterId)
    if (targetQ) {
      setQuarter(targetQ)
      setStats(null)
      setSelDay(null)
      loadStats(targetQ.id)
    }
  }

  function handleQuarterChanged(nextQuarter) {
    setQuarter(nextQuarter)
    setStats(null)
    setSelDay(null)
    setView('today')
    loadStats(nextQuarter.id)
    refreshQuarters()
  }

  const effectiveRole = quarter.status === 'archived' ? 'archived' : role

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
          quarters={quarters}
          onSelectQuarter={handleSelectQuarter}
        />

        {quarter.status === 'archived' && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '8px 12px',
            marginBottom: 16,
            fontSize: 11,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Viewing historical archived quarter: <strong>{quarter.label}</strong> (Read-Only)</span>
            {quarters.some(q => q.status === 'active') && (
              <button
                className="sm"
                onClick={() => {
                  const active = quarters.find(q => q.status === 'active')
                  if (active) handleSelectQuarter(active.id)
                }}
              >
                Return to Active
              </button>
            )}
          </div>
        )}

        {view === 'today' && (
          <DayPage
            quarter={quarter}
            n={todayN}
            role={effectiveRole}
            onBack={null}
          />
        )}

        {view === 'tasks' && (
          <TasksPage quarter={quarter} />
        )}

        {view === 'calendar' && (
          <CalPage quarter={quarter} onSelect={n => goDay(n)} />
        )}

        {view === 'day' && selDay !== null && (
          <DayPage
            quarter={quarter}
            n={selDay}
            role={effectiveRole}
            onBack={() => setView('calendar')}
          />
        )}

        {view === 'weekly' && (
          <WeekPage quarter={quarter} role={effectiveRole} />
        )}

        {view === 'targets' && (
          <TargetsPage
            quarter={quarter}
            onQuarterChanged={handleQuarterChanged}
            readOnly={quarter.status === 'archived'}
          />
        )}
      </div>
    </div>
  )
}
