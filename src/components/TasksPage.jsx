import { useState, useEffect } from 'react'
import { fetchTasks, upsertTask, deleteTask } from '../lib/db.js'
import { ARENAS, TASK_URGENCIES, arenaLabel, isoDate } from '../lib/constants.js'
import s from './TasksPage.module.css'

export default function TasksPage({ quarter }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const [draft, setDraft] = useState({
    title: '',
    urgency: 'medium',
    arena: '',
    due_date: isoDate(new Date()),
    notes: '',
  })

  useEffect(() => {
    loadTasks()
  }, [quarter.id])

  async function loadTasks() {
    setLoading(true)
    try {
      const data = await fetchTasks(quarter.id)
      setTasks(data)
    } catch (err) {
      setStatus('Error loading tasks: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddTask(e) {
    if (e) e.preventDefault()
    if (!draft.title.trim()) return

    setSaving(true)
    try {
      const newTask = {
        quarter_id: quarter.id,
        title: draft.title.trim(),
        urgency: draft.urgency,
        arena: draft.arena || null,
        status: 'pending',
        due_date: draft.due_date || null,
        notes: draft.notes || '',
      }
      const saved = await upsertTask(newTask)
      setTasks(prev => [saved, ...prev])
      setDraft({
        title: '',
        urgency: 'medium',
        arena: '',
        due_date: isoDate(new Date()),
        notes: '',
      })
      setStatus('Task added.')
      setTimeout(() => setStatus(''), 2000)
    } catch (err) {
      setStatus('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(task) {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
    const updated = { ...task, status: nextStatus }
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t))

    try {
      await upsertTask(updated)
    } catch (err) {
      setStatus('Error updating task: ' + err.message)
      loadTasks()
    }
  }

  async function handleDeleteTask(taskId) {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    try {
      await deleteTask(taskId)
      setStatus('Task deleted.')
      setTimeout(() => setStatus(''), 2000)
    } catch (err) {
      setStatus('Error deleting task: ' + err.message)
      loadTasks()
    }
  }

  async function handleUpdateTask(task) {
    try {
      await upsertTask(task)
      setTasks(prev => prev.map(t => t.id === task.id ? task : t))
      setStatus('Saved.')
      setTimeout(() => setStatus(''), 2000)
    } catch (err) {
      setStatus('Error saving task: ' + err.message)
    }
  }

  const todayStr = isoDate(new Date())

  const activeTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress')
  const urgentTasks = activeTasks.filter(t => t.urgency === 'urgent' || t.urgency === 'high')
  const dueTodayTasks = activeTasks.filter(t => t.due_date === todayStr)
  const completedTasks = tasks.filter(t => t.status === 'completed')

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return t.status === 'pending' || t.status === 'in_progress'
    if (filter === 'today') return (t.status === 'pending' || t.status === 'in_progress') && t.due_date === todayStr
    if (filter === 'urgent') return (t.status === 'pending' || t.status === 'in_progress') && (t.urgency === 'urgent' || t.urgency === 'high')
    if (filter === 'completed') return t.status === 'completed'
    return true
  })

  // Sort by urgency weight descending, then due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (b.status === 'completed' && a.status !== 'completed') return -1
    const wA = TASK_URGENCIES.find(u => u.key === a.urgency)?.weight || 0
    const wB = TASK_URGENCIES.find(u => u.key === b.urgency)?.weight || 0
    if (wA !== wB) return wB - wA
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date) return -1
    if (b.due_date) return 1
    return 0
  })

  return (
    <div>
      <div className={s.h2}>Tasks & Reminders</div>
      <div className={s.intro}>
        Tactical minute-by-minute execution. Synced with Telegram bot for notifications and inline check-offs.
      </div>

      <div className={s.summaryCards}>
        <div className={s.card}>
          <div className={s.cardLabel}>Active</div>
          <div className={s.cardVal}>{activeTasks.length}</div>
        </div>
        <div className={s.card}>
          <div className={s.cardLabel}>Urgent / High</div>
          <div className={s.cardVal}>{urgentTasks.length}</div>
        </div>
        <div className={s.card}>
          <div className={s.cardLabel}>Due Today</div>
          <div className={s.cardVal}>{dueTodayTasks.length}</div>
        </div>
        <div className={s.card}>
          <div className={s.cardLabel}>Completed</div>
          <div className={s.cardVal}>{completedTasks.length}</div>
        </div>
      </div>

      <form className={s.quickAdd} onSubmit={handleAddTask}>
        <div className={s.quickAddRow}>
          <input
            type="text"
            className={s.titleInput}
            placeholder="Add new task or reminder..."
            value={draft.title}
            onChange={e => setDraft({ ...draft, title: e.target.value })}
          />
          <div className={s.selectWrap}>
            <select
              value={draft.urgency}
              onChange={e => setDraft({ ...draft, urgency: e.target.value })}
            >
              {TASK_URGENCIES.map(u => (
                <option key={u.key} value={u.key}>{u.icon} {u.label}</option>
              ))}
            </select>
          </div>
          <div className={s.selectWrap}>
            <select
              value={draft.arena}
              onChange={e => setDraft({ ...draft, arena: e.target.value })}
            >
              <option value="">No Arena</option>
              {ARENAS.map(a => (
                <option key={a.key} value={a.key}>{a.label}</option>
              ))}
            </select>
          </div>
          <input
            type="date"
            className={s.dateInput}
            value={draft.due_date}
            onChange={e => setDraft({ ...draft, due_date: e.target.value })}
          />
          <button type="submit" className="inv" disabled={saving || !draft.title.trim()}>
            {saving ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>

      <div className={s.filterBar}>
        {[
          { id: 'active', label: `Active (${activeTasks.length})` },
          { id: 'today', label: `Due Today (${dueTodayTasks.length})` },
          { id: 'urgent', label: `Urgent (${urgentTasks.length})` },
          { id: 'completed', label: `Completed (${completedTasks.length})` },
          { id: 'all', label: `All (${tasks.length})` },
        ].map(btn => (
          <button
            key={btn.id}
            className={`sm ${s.filterBtn} ${filter === btn.id ? 'inv' : ''}`}
            onClick={() => setFilter(btn.id)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {loading && <div className={s.emptyState}>Loading tasks...</div>}

      {!loading && sortedTasks.length === 0 && (
        <div className={s.emptyState}>
          No tasks found for this view. Add one above or send a message via Telegram.
        </div>
      )}

      <div className={s.taskList}>
        {sortedTasks.map(task => {
          const isDone = task.status === 'completed'
          const isOverdue = !isDone && task.due_date && task.due_date < todayStr
          const isToday = !isDone && task.due_date === todayStr
          const urgencyObj = TASK_URGENCIES.find(u => u.key === task.urgency) || TASK_URGENCIES[2]
          const isExpanded = expandedId === task.id

          const badgeCls = task.urgency === 'urgent'
            ? s.badgeUrgent
            : task.urgency === 'high'
            ? s.badgeHigh
            : task.urgency === 'medium'
            ? s.badgeMedium
            : s.badgeLow

          return (
            <div key={task.id} className={`${s.taskItem} ${isDone ? s.taskDone : ''}`}>
              <div className={s.taskMain}>
                <input
                  type="checkbox"
                  className={s.taskCheck}
                  checked={isDone}
                  onChange={() => handleToggleStatus(task)}
                />
                <div className={s.taskBody}>
                  <div className={s.taskTitleRow}>
                    <span className={s.taskTitle}>{task.title}</span>
                  </div>
                  <div className={s.taskMeta}>
                    <span className={`${s.badge} ${badgeCls}`}>
                      {urgencyObj.icon} {urgencyObj.label}
                    </span>
                    {task.arena && (
                      <span className={s.arenaTag}>
                        {arenaLabel(task.arena)}
                      </span>
                    )}
                    {task.due_date && (
                      <span className={`${s.dateTag} ${isOverdue ? s.overdue : ''} ${isToday ? s.dueToday : ''}`}>
                        {isOverdue ? `Overdue: ${task.due_date}` : isToday ? 'Due Today' : `Due: ${task.due_date}`}
                      </span>
                    )}
                    {task.notes && !isExpanded && (
                      <span className={s.dateTag} style={{ fontStyle: 'italic' }}>
                        - {task.notes.slice(0, 40)}{task.notes.length > 40 ? '...' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className={s.taskActions}>
                  <button
                    className={s.iconBtn}
                    title="Toggle notes"
                    onClick={() => setExpandedId(isExpanded ? null : task.id)}
                  >
                    {isExpanded ? '▲' : '▼'}
                  </button>
                  <button
                    className={s.iconBtn}
                    title="Delete task"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    ×
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className={s.taskNotesRow}>
                  <input
                    type="text"
                    className={s.notesInput}
                    placeholder="Add details, notes, or link..."
                    defaultValue={task.notes || ''}
                    onBlur={e => {
                      if (e.target.value !== (task.notes || '')) {
                        handleUpdateTask({ ...task, notes: e.target.value })
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.target.blur()
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {status && <div className={s.statusLine}>{status}</div>}
    </div>
  )
}
