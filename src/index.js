const BTN = {
  complaint: "📩 Shikoyat",
  suggestion: "💡 Taklif",
  contact: "☎️ Admin bilan bog'lanish",
  cancel: "⬅️ Bekor qilish",
};

const REMINDERS = {
  complaint:
    "📩 <b>Shikoyat bo'limi</b>\n\nQanday va qaysi do'konning ustidan shikoyatingiz bo'lsa, batafsil ma'lumotlar bilan yozing — biz uni bartaraf etishimiz oson bo'lishi uchun.\n\nRahmat!",
  suggestion:
    "💡 <b>Taklif bo'limi</b>\n\nBiz har qanday takliflaringizga ochiqmiz! Fikr-mulohaza yoki taklifingizni shu yerga yozib qoldiring.",
  contact:
    "☎️ <b>Admin bilan bog'lanish</b>\n\nIsmingiz, telefon raqamingiz va murojaat sababingizni yozib qoldiring.\nTez orada admin siz bilan bog'lanadi.",
};

const THANKS = {
  complaint: "✅ Shikoyatingiz qabul qilindi. Tez orada ko'rib chiqamiz. Rahmat!",
  suggestion: "✅ Taklifingiz uchun rahmat! Fikringiz biz uchun muhim.",
  contact: "✅ Ma'lumotlaringiz qabul qilindi. Tez orada admin siz bilan bog'lanadi. Rahmat!",
};

const ADMIN_LABELS = {
  complaint: "🔴 Yangi SHIKOYAT",
  suggestion: "🟢 Yangi TAKLIF",
  contact: "🟡 Admin bilan bog'lanish so'rovi",
};

const mainMenu = {
  keyboard: [[{ text: BTN.complaint }, { text: BTN.suggestion }], [{ text: BTN.contact }]],
  resize_keyboard: true,
};
const cancelMenu = { keyboard: [[{ text: BTN.cancel }]], resize_keyboard: true };

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function tg(env, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

const send = (env, chat_id, text, reply_markup) =>
  tg(env, "sendMessage", { chat_id, text, parse_mode: "HTML", reply_markup });

async function handleMessage(env, message) {
  const chatId = message.chat.id;
  const text = message.text;
  if (!text) return;
  const stateKey = `state:${chatId}`;

  if (text === "/start" || text === "/menu") {
    await env.STATE.delete(stateKey);
    return send(env, chatId, "🏗 <b>Qurilish Mollari Market</b> botiga xush kelibsiz!\n\nKerakli bo'limni tanlang:", mainMenu);
  }
  if (text === BTN.cancel) {
    await env.STATE.delete(stateKey);
    return send(env, chatId, "Bekor qilindi.", mainMenu);
  }
  for (const kind of ["complaint", "suggestion", "contact"]) {
    if (text === BTN[kind]) {
      await env.STATE.put(stateKey, kind, { expirationTtl: 3600 });
      return send(env, chatId, REMINDERS[kind], cancelMenu);
    }
  }

  const kind = await env.STATE.get(stateKey);
  if (!kind) {
    return send(env, chatId, "Iltimos, quyidagi menyudan kerakli bo'limni tanlang 👇", mainMenu);
  }

  const u = message.from;
  const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ");
  const time = new Date().toISOString();
  await env.STATE.put(`entry:${time}:${u.id}`, JSON.stringify({ time, kind, user_id: u.id, username: u.username, fullName, text }));

  if (env.ADMIN_ID) {
    await send(
      env,
      env.ADMIN_ID,
      `${ADMIN_LABELS[kind]}\n\n👤 Ism: ${esc(fullName || "-")}\n🔗 Username: ${u.username ? "@" + esc(u.username) : "yo'q"}\n🆔 ID: <code>${u.id}</code>\n🕒 Vaqt: ${time}\n\n✉️ Xabar:\n${esc(text)}`
    );
  }
  await env.STATE.delete(stateKey);
  return send(env, chatId, THANKS[kind], mainMenu);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/webhook") {
      if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) {
        return new Response("forbidden", { status: 403 });
      }
      const update = await request.json();
      if (update.message) await handleMessage(env, update.message);
      return new Response("ok");
    }
    return new Response("Qurilish Mollari Market bot ishlab turibdi ✅");
  },
};
