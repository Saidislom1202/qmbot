# Qurilish Mollari Market — Telegram bot

Shikoyat, taklif va admin bilan bog'lanish uchun Telegram bot. Cloudflare Worker (JavaScript, webhook) sifatida ishlaydi.

- Kod: `src/index.js`
- Sozlamalar: `wrangler.jsonc` (KV binding: `STATE`)
- Maxfiy o'zgaruvchilar (Cloudflare'da Secret): `BOT_TOKEN`, `ADMIN_ID`, `WEBHOOK_SECRET`
- Webhook: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WORKER_URL>/webhook&secret_token=<WEBHOOK_SECRET>`
