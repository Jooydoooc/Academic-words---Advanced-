export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return res.status(500).json({
        ok: false,
        error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables'
      });
    }

    // Vercel may provide body as string; handle both cases.
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const text = String(body.text || '').trim();
    const parse_mode = body.parse_mode || undefined;

    if (!text) {
      return res.status(400).json({ ok: false, error: 'Missing "text" in request body' });
    }

    const tgResp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...(parse_mode ? { parse_mode } : {})
      })
    });

    const data = await tgResp.json().catch(() => ({}));

    if (!tgResp.ok || data.ok === false) {
      return res.status(502).json({
        ok: false,
        error: 'Telegram API error',
        details: data
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Server error' });
  }
}
