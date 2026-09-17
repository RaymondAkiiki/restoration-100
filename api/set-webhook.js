export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is missing in environment variables' })
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'restoration-100.vercel.app'
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const webhookUrl = `${proto}://${host}/api/bot`

  try {
    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`)
    const data = await telegramRes.json()

    return res.status(200).json({
      webhookUrl,
      telegramResponse: data,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
