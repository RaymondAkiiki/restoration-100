import { Bot, InlineKeyboard } from 'grammy'
import { createClient } from '@supabase/supabase-js'

export function createBot() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID ? Number(process.env.TELEGRAM_CHAT_ID) : null

  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is missing in environment variables')
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const bot = new Bot(BOT_TOKEN)

  let activeChatId = CHAT_ID

  async function getActiveQuarter() {
    const { data, error } = await supabase
      .from('quarters')
      .select('*')
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data
  }

  function urgencyEmoji(urgency) {
    switch (urgency) {
      case 'urgent': return '🔴 URGENT'
      case 'high': return '🟠 HIGH'
      case 'medium': return '🟡 MEDIUM'
      case 'low': return '⚪ LOW'
      default: return '🟡'
    }
  }

  function formatSupabaseError(err) {
    const msg = err?.message || String(err)
    if (err?.code === 'PGRST205' || msg.includes('schema cache') || msg.includes('does not exist')) {
      return "⚠️ The database table 'public.tasks' has not been created in Supabase yet!\n\nPlease open your Supabase SQL Editor and run migration_tasks.sql to enable tasks."
    }
    return `Error: ${msg}`
  }

  bot.command('start', async (ctx) => {
    activeChatId = ctx.chat.id
    const msg = [
      '⚡ *Quarterly Restoration Bot Connected*',
      '',
      `Your Chat ID: \`${ctx.chat.id}\``,
      'Save this to `TELEGRAM_CHAT_ID` in your `.env` and Vercel Environment Variables.',
      '',
      '*Available Commands:*',
      '• `/tasks` - View active tasks with quick check-off buttons',
      '• `/add <task>` - Quick add a task',
      '• `/urgent <task>` - Quick add an urgent task (🔴)',
      '• `/remind <time> <task>` - Set reminder (e.g. `/remind 30m review deals` or `/remind 17:00 submit proposal`)',
      '• `/today` - Today\'s Top 3 priorities & stats',
    ].join('\n')

    await ctx.reply(msg, { parse_mode: 'Markdown' })
  })

  bot.command('tasks', async (ctx) => {
    try {
      const quarter = await getActiveQuarter()
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!tasks || tasks.length === 0) {
        return ctx.reply('No pending tasks! All clear.')
      }

      const order = { urgent: 0, high: 1, medium: 2, low: 3 }
      const sorted = [...tasks].sort((a, b) => (order[a.urgency] ?? 2) - (order[b.urgency] ?? 2))

      await ctx.reply(`📋 *Active Tasks (${sorted.length})*`, { parse_mode: 'Markdown' })

      for (const task of sorted.slice(0, 15)) {
        const keyboard = new InlineKeyboard()
          .text('✓ Mark Done', `done:${task.id}`)
          .text('+1h Snooze', `snooze:${task.id}`)

        const dueInfo = task.due_date ? ` | Due: ${task.due_date}` : ''
        const text = `${urgencyEmoji(task.urgency)}: *${task.title}*${dueInfo}`

        await ctx.reply(text, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        })
      }

      if (sorted.length > 15) {
        await ctx.reply(`... and ${sorted.length - 15} more in the web app.`)
      }
    } catch (err) {
      console.error(err)
      await ctx.reply(formatSupabaseError(err))
    }
  })

  bot.command('add', async (ctx) => {
    const text = ctx.match?.trim()
    if (!text) {
      return ctx.reply('Usage: `/add Finish quarterly review`', { parse_mode: 'Markdown' })
    }

    try {
      const quarter = await getActiveQuarter()
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          quarter_id: quarter?.id || null,
          title: text,
          urgency: 'medium',
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      const keyboard = new InlineKeyboard().text('✓ Mark Done', `done:${data.id}`)
      await ctx.reply(`✓ Added: *${data.title}* (🟡 MEDIUM)`, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      })
    } catch (err) {
      await ctx.reply(formatSupabaseError(err))
    }
  })

  bot.command('urgent', async (ctx) => {
    const text = ctx.match?.trim()
    if (!text) {
      return ctx.reply('Usage: `/urgent Call landlord immediately`', { parse_mode: 'Markdown' })
    }

    try {
      const quarter = await getActiveQuarter()
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          quarter_id: quarter?.id || null,
          title: text,
          urgency: 'urgent',
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      const keyboard = new InlineKeyboard().text('✓ Mark Done', `done:${data.id}`)
      await ctx.reply(`🔴 Urgent task added: *${data.title}*`, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      })
    } catch (err) {
      await ctx.reply(formatSupabaseError(err))
    }
  })

  bot.command('remind', async (ctx) => {
    const raw = ctx.match?.trim()
    if (!raw) {
      return ctx.reply('Usage: `/remind 30m review contracts` or `/remind 15:30 call tenant`', { parse_mode: 'Markdown' })
    }

    const parts = raw.split(' ')
    const timeSpec = parts[0]
    const title = parts.slice(1).join(' ')

    if (!title) {
      return ctx.reply('Please provide both a time and a task description.\nExample: `/remind 45m follow up on proposal`', { parse_mode: 'Markdown' })
    }

    let remindDate = new Date()

    if (timeSpec.endsWith('m')) {
      const mins = parseInt(timeSpec.slice(0, -1), 10)
      if (isNaN(mins)) return ctx.reply('Invalid minutes format. Example: 30m')
      remindDate = new Date(Date.now() + mins * 60 * 1000)
    } else if (timeSpec.endsWith('h')) {
      const hours = parseInt(timeSpec.slice(0, -1), 10)
      if (isNaN(hours)) return ctx.reply('Invalid hours format. Example: 2h')
      remindDate = new Date(Date.now() + hours * 60 * 60 * 1000)
    } else if (timeSpec.includes(':')) {
      const [h, m] = timeSpec.split(':').map(Number)
      if (isNaN(h) || isNaN(m)) return ctx.reply('Invalid time format. Example: 14:30')
      remindDate.setHours(h, m, 0, 0)
      if (remindDate.getTime() <= Date.now()) {
        remindDate.setDate(remindDate.getDate() + 1)
      }
    } else {
      return ctx.reply('Unrecognized time. Use format like `30m`, `2h`, or `16:00`.', { parse_mode: 'Markdown' })
    }

    try {
      const quarter = await getActiveQuarter()
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          quarter_id: quarter?.id || null,
          title,
          urgency: 'high',
          status: 'pending',
          remind_at: remindDate.toISOString(),
          reminder_sent: false,
        })
        .select()
        .single()

      if (error) throw error

      await ctx.reply(`⏰ Reminder scheduled for *${remindDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}*:\n*${title}*`, { parse_mode: 'Markdown' })
    } catch (err) {
      await ctx.reply(formatSupabaseError(err))
    }
  })

  bot.command('today', async (ctx) => {
    try {
      const quarter = await getActiveQuarter()
      if (!quarter) return ctx.reply('No active quarter found.')

      const start = new Date(quarter.start_date)
      const now = new Date()
      const todayN = Math.floor((now - start) / 86400000) + 1

      const { data: day } = await supabase
        .from('days')
        .select('*')
        .eq('quarter_id', quarter.id)
        .eq('day_number', todayN)
        .maybeSingle()

      const top3 = (day?.top3 || []).filter(Boolean)
      const lines = [
        `🎯 *Today: Day ${todayN} (${quarter.label})*`,
        '',
        '*Top 3 Outcomes:*',
        top3.length > 0
          ? top3.map((t, i) => `${i + 1}. ${t}`).join('\n')
          : '_No top 3 planned yet._',
        '',
        `*Must Not Fail:* ${day?.must_not_fail || '_None set_'}`,
        `*Distraction Alert:* ${day?.distraction || '_None set_'}`,
      ]

      await ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' })
    } catch (err) {
      await ctx.reply(formatSupabaseError(err))
    }
  })

  // Callback queries
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data

    if (data.startsWith('done:')) {
      const taskId = Number(data.replace('done:', ''))
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ status: 'completed' })
          .eq('id', taskId)

        if (error) throw error

        await ctx.answerCallbackQuery({ text: '✓ Task marked completed!' })
        const originalText = ctx.callbackQuery.message?.text || ''
        await ctx.editMessageText(`~${originalText}~ \n✅ *COMPLETED*`, { parse_mode: 'Markdown' })
      } catch (err) {
        await ctx.answerCallbackQuery({ text: 'Failed to update task: ' + err.message })
      }
    } else if (data.startsWith('snooze:')) {
      const taskId = Number(data.replace('snooze:', ''))
      try {
        const newRemindAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
        const { error } = await supabase
          .from('tasks')
          .update({ remind_at: newRemindAt, reminder_sent: false })
          .eq('id', taskId)

        if (error) throw error

        await ctx.answerCallbackQuery({ text: '⏰ Snoozed for 1 hour.' })
        await ctx.editMessageText(`${ctx.callbackQuery.message?.text || ''}\n⏰ *Snoozed for 1 hour*`)
      } catch (err) {
        await ctx.answerCallbackQuery({ text: 'Failed to snooze: ' + err.message })
      }
    }
  })

  return { bot, supabase, getActiveChatId: () => activeChatId }
}
