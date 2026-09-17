import 'dotenv/config'
import { InlineKeyboard } from 'grammy'
import { createBot } from './bot.js'

const { bot, supabase, getActiveChatId } = createBot()

// Periodic reminder daemon loop for local testing (runs every 60s)
setInterval(async () => {
  const targetChatId = getActiveChatId() || (process.env.TELEGRAM_CHAT_ID ? Number(process.env.TELEGRAM_CHAT_ID) : null)
  if (!targetChatId) return

  try {
    const nowIso = new Date().toISOString()
    const { data: dueTasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'pending')
      .eq('reminder_sent', false)
      .lte('remind_at', nowIso)

    if (error || !dueTasks || dueTasks.length === 0) return

    for (const task of dueTasks) {
      const keyboard = new InlineKeyboard()
        .text('✓ Mark Done', `done:${task.id}`)
        .text('+1h Snooze', `snooze:${task.id}`)

      const msg = `🚨 *REMINDER* (${task.urgency?.toUpperCase() || 'REMINDER'})\n\n*${task.title}*${task.notes ? `\n_${task.notes}_` : ''}`

      await bot.api.sendMessage(targetChatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      })

      await supabase
        .from('tasks')
        .update({ reminder_sent: true })
        .eq('id', task.id)
    }
  } catch (err) {
    console.error('Reminder check error:', err.message)
  }
}, 60000)

// Start bot polling
console.log('Quarterly Restoration Telegram Bot starting...')
bot.start({
  onStart: (botInfo) => {
    console.log(`✓ Bot @${botInfo.username} is live and listening for commands!`)
    console.log(`NOTE: Keep this process running if testing locally. In production, Vercel Serverless Webhook handles it automatically at /api/bot.`)
  },
})
