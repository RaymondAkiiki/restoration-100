import { webhookCallback } from 'grammy'
import { createBot } from '../bot/bot.js'

let webhookHandler

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'Restoration Telegram Bot Webhook',
      timestamp: new Date().toISOString(),
    })
  }

  if (req.method === 'POST') {
    try {
      if (!webhookHandler) {
        const { bot } = createBot()
        webhookHandler = webhookCallback(bot, 'node:http')
      }
      return await webhookHandler(req, res)
    } catch (err) {
      console.error('Webhook execution error:', err)
      return res.status(500).json({ error: err.message })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end('Method Not Allowed')
}
