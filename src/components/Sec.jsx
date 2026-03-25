import { useState } from 'react'
import s from './Sec.module.css'

export default function Sec({ title, badge, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={s.wrap}>
      <button className={s.head} onClick={() => setOpen(o => !o)}>
        <span className={s.title}>
          {title}
          {badge !== undefined && (
            <span className={s.badge}>{badge}</span>
          )}
        </span>
        <span className={s.toggle}>{open ? '−' : '+'}</span>
      </button>
      {open && <div className={s.body}>{children}</div>}
    </div>
  )
}
