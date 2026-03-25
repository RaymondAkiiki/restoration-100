import { useState } from 'react'
import { PHASE_TARGETS, todayDayN, TOTAL_DAYS, phase } from '../lib/constants.js'
import Sec from './Sec.jsx'
import s from './TargetsPage.module.css'

const STOPS = [
  { label: 'Phase 1', desc: 'Stabilize', dates: '27 Mar → 4 May 2026', days: '1–39',   key: 1 },
  { label: 'Phase 2', desc: 'Build',     dates: '5 May → 8 Jun 2026',  days: '40–74',  key: 2 },
  { label: 'Phase 3', desc: 'Prove',     dates: '9 Jun → 3 Jul 2026',  days: '75–99',  key: 3 },
  { label: 'Day 100', desc: 'Arrival',   dates: '4 Jul 2026',           days: '100',    key: 4 },
]

const DAILY_SCHEDULE = [
  { t: '6:15 AM',  a: 'Wake. No phone.' },
  { t: '6:20 AM',  a: 'Wash, settle.' },
  { t: '6:35 AM',  a: '10 min quiet — prayer / reflection / self-command.' },
  { t: '6:45 AM',  a: 'Daily planning. Top 3 outcomes. Must-not-fail.' },
  { t: '7:00 AM',  a: 'Exercise / walk / stretch.' },
  { t: '8:00 AM',  a: 'DEEP WORK BLOCK — hardest high-value work: outreach, proposals, SOPs, financial review, system building. No reactive work.' },
  { t: '10:00 AM', a: 'Messages, admin, follow-ups.' },
  { t: '10:30 AM', a: 'Client operations / team coordination.' },
  { t: '1:00 PM',  a: 'Lunch. Rest. No work.' },
  { t: '2:00 PM',  a: 'Meetings, site work, collections, ops follow-up.' },
  { t: '4:00 PM',  a: 'Systems / admin / SOP block.' },
  { t: '5:00 PM',  a: 'End-of-day review. Score yourself.' },
  { t: '8:30 PM',  a: 'Light review of tomorrow. No spiralling.' },
  { t: '10:30 PM', a: 'Sleep. Non-negotiable.' },
]

const SPENDING_RULES = [
  'Any non-essential spend above UGX 30,000 requires a pause and written justification.',
  'Never risk a larger loss to save a small amount. (The phone incident.)',
  'No unplanned transport decisions that increase security risk.',
  'All discretionary spending written down same day.',
  'Every Sunday: review the week\'s spending honestly.',
  'Before spending ask: does this protect stability, strengthen work, or just feed impulse?',
]

const TRIGGERS = [
  { t: 'Feeling behind',               r: 'Return to scoreboard. No comparison during workday. Ask: what is today\'s next concrete move?' },
  { t: 'Lack of visible progress',     r: 'Track lead indicators, not just outcomes. Judge yourself by actions completed this week, not mood.' },
  { t: 'Feeling unappreciated',        r: 'Say what you need clearly. Stop making silent sacrifice your identity.' },
  { t: 'Low energy',                   r: 'Shorten the task. Start with 15 minutes. Move your body. Low energy is not a verdict on the day.' },
  { t: 'Fear of failure / exposure',   r: 'Define success as sending, calling, proposing — not as being admired or immediately winning.' },
  { t: 'Ego bruises in relationships', r: 'Ask: am I hurt, ashamed, or controlling? Speak directly before silence hardens.' },
]

const STOP_DOING = [
  'Feeding every interesting idea that arrives.',
  'Confusing motion with traction.',
  'Drawing identity from future greatness.',
  'Letting shame create escape cycles.',
  'Consuming so much that your own signal gets weak.',
  'Being casual with your days while speaking seriously about empire.',
  'Allowing internal chaos to be treated as "just how I am."',
  'Using mood as a deciding factor for whether key work gets done.',
  'Starting tasks without defining the business outcome first.',
  'Emotional withdrawal as punishment in close relationships.',
]

export default function TargetsPage() {
  const tn  = todayDayN()
  const cur = tn >= 1 && tn <= TOTAL_DAYS ? phase(tn).num : null

  return (
    <div>
      <div className={s.h2}>Targets, Rules, and Non-Negotiables</div>
      <div className={s.intro}>
        This is the standard. Review it when you feel lost. Return to it when you drift.
        It does not negotiate with your mood.
      </div>

      {/* Phase timeline */}
      <div className={s.timeline}>
        {STOPS.map(({ label, desc, dates, days, key }) => (
          <div key={key} className={`${s.phase} ${cur === key ? s.phaseCurrent : ''}`}>
            <div className={s.phaseDot} />
            <div className={s.phaseContent}>
              <div className={s.phaseLabel}>{label} — {desc}</div>
              <div className={s.phaseDates}>{dates}</div>
              <div className={s.phaseDays}>Days {days}</div>
              {cur === key && <div className={s.phaseActive}>You are here</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Phase targets */}
      {STOPS.map(({ label, desc, key }) => (
        <Sec key={key} title={`${label} — ${desc} targets`} defaultOpen={cur === key}>
          {PHASE_TARGETS[key].map((t, i) => (
            <div key={i} className={s.targetRow}>
              <span className={s.targetBullet}>—</span>
              <span className={s.targetText}>{t}</span>
            </div>
          ))}
        </Sec>
      ))}

      {/* Core business focus */}
      <Sec title="Core Business Focus — 12 months">
        <div className={s.focusBlock}>
          <div className={s.focusTitle}>
            One arena: Property management + software leverage + strong operations.
          </div>
          <div className={s.focusDesc}>
            Redefine real estate in Uganda. Not a hustle business. A systems business.
          </div>
          <div className={s.pillars}>
            {[
              { p: 'A', label: 'Commercial Growth',      desc: 'Get more landlords, more units, more revenue.' },
              { p: 'B', label: 'Operational Excellence', desc: 'Run properties better with visible standards and proof.' },
              { p: 'C', label: 'Internal Systems',       desc: 'Document and standardise the business.' },
              { p: 'D', label: 'Software Leverage',      desc: 'Build only tools that improve A, B, and C.' },
            ].map(({ p, label, desc }) => (
              <div key={p} className={s.pillar}>
                <div className={s.pillarLetter}>{p}</div>
                <div>
                  <div className={s.pillarLabel}>{label}</div>
                  <div className={s.pillarDesc}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Sec>

      {/* Daily schedule */}
      <Sec title="Daily Schedule — non-negotiable structure">
        <div className={s.schedHint}>
          This structure does not negotiate with your moods.
        </div>
        {DAILY_SCHEDULE.map(({ t, a }) => (
          <div key={t} className={s.schedRow}>
            <span className={s.schedTime}>{t}</span>
            <span className={s.schedAct}>{a}</span>
          </div>
        ))}
      </Sec>

      {/* Spending rules */}
      <Sec title="Spending Rules">
        {SPENDING_RULES.map((r, i) => (
          <div key={i} className={s.targetRow}>
            <span className={s.targetBullet}>—</span>
            <span className={s.targetText}>{r}</span>
          </div>
        ))}
      </Sec>

      {/* Triggers */}
      <Sec title="Known Triggers and Responses">
        <div className={s.schedHint}>
          Know your patterns before they hit. Choose the response in advance.
        </div>
        {TRIGGERS.map(({ t, r }) => (
          <div key={t} className={s.triggerRow}>
            <div className={s.triggerLabel}>{t}</div>
            <div className={s.triggerResponse}>{r}</div>
          </div>
        ))}
      </Sec>

      {/* Stop doing */}
      <Sec title="Stop Doing — this season">
        {STOP_DOING.map((item, i) => (
          <div key={i} className={s.targetRow}>
            <span className={s.targetBullet}>—</span>
            <span className={s.targetText}>{item}</span>
          </div>
        ))}
      </Sec>

      {/* Emotional adulthood rules */}
      <Sec title="Emotional Adulthood — the five rules">
        {[
          { r: '1', l: 'Feel, then govern.', d: 'Do not deny feelings. But feelings do not get final authority. Say: "I feel this. I am not required to obey it."' },
          { r: '2', l: 'Replace reaction with named response.', d: 'Ask: What am I feeling? What story am I telling? What is actually true? What action is mature here?' },
          { r: '3', l: 'End silent punishment.', d: 'Any time you withdraw to make someone feel something, that is manipulation. Catch it early. Name what you actually need.' },
          { r: '4', l: 'Build recovery rituals.', d: 'When triggered: breathe 60 seconds. No texting while activated. Write what happened. Identify the wound. Choose direct speech.' },
          { r: '5', l: 'Stop worshipping pride.', d: 'Some of "I like what I like" is not authenticity. Some of it is undeveloped ego. Kill what is childish even if it feels familiar.' },
        ].map(({ r, l, d }) => (
          <div key={r} className={s.ruleRow}>
            <div className={s.ruleNum}>{r}</div>
            <div>
              <div className={s.ruleLabel}>{l}</div>
              <div className={s.ruleDesc}>{d}</div>
            </div>
          </div>
        ))}
      </Sec>

      {/* The hard truth */}
      <div className={s.truth}>
        <div className={s.truthTitle}>The standard you must hold yourself to</div>
        <div className={s.truthBody}>
          Reliable men become exceptional.<br />
          Unreliable men just keep imagining it.<br /><br />
          Work is what survives contact with measurement.<br />
          Revenue created. Clients closed. Product shipped. SOP finished.<br />
          Follow-ups sent. Expenses tracked. Tenants resolved. Team trained.<br /><br />
          Your biggest enemy is not lack of opportunity.<br />
          It is the gap between what you know and what you repeatedly do.<br />
          That gap is where dreams go to die.
        </div>
      </div>
    </div>
  )
}
