import { Bot, InlineKeyboard } from 'grammy'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID ? Number(process.env.TELEGRAM_CHAT_ID) : null

  if (!BOT_TOKEN || !CHAT_ID || !SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(200).json({ status: 'skipped', reason: 'Missing credentials' })
  }

  const bot = new Bot(BOT_TOKEN)
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  try {
    const nowIso = new Date().toISOString()
    const { data: dueTasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending')
      .eq('reminder_sent', false)
      .lte('remind_at', nowIso)

    if (error) throw error

    if (!dueTasks || dueTasks.length === 0) {
      return res.status(200).json({ status: 'ok', sent: 0 })
    }

    let sentCount = 0
    for (const task of dueTasks) {
      const keyboard = new InlineKeyboard()
        .text('✓ Mark Done', `done:${task.id}`)
        .text('+1h Snooze', `snooze:${task.id}`)

      const msg = `🚨 *REMINDER* (${task.urgency?.toUpperCase() || 'REMINDER'})\n\n*${task.title}*${task.notes ? `\n_${task.notes}_` : ''}`

      await bot.api.sendMessage(CHAT_ID, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      })

      await supabase
        .from('tasks')
        .update({ reminder_sent: true })
        .eq('id', task.id)

      sentCount++
    }

    return res.status(200).json({ status: 'ok', sent: sentCount })
  } catch (err) {
    console.error('Cron reminder error:', err)
    return res.status(500).json({ error: err.message })
  }
}
