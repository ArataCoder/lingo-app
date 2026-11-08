// Lingo Brain ADHD: Telegram-бот на Cloudflare Workers (бесплатно, работает 24/7)
// Секреты (Worker -> Settings -> Variables and Secrets, тип Secret):
//   BOT_TOKEN       токен от BotFather (только тут, нигде больше!)
//   WEBHOOK_SECRET  любая длинная строка, например 40 случайных букв
//   SETUP_KEY       ещё одна случайная строка, для одноразовой настройки
// Необязательно (тип Text): ADMIN_CHAT_ID, твой chat id, сюда придут отзывы
// Настройка одним кликом: открой https://<твой-воркер>.workers.dev/setup?key=<SETUP_KEY>

const APP_URL = "https://aratacoder.github.io/lingo-app/?v=4";
const NL = String.fromCharCode(10);
const FEEDBACK_MARK = "📝 Отзыв";

const BOT = {
  menuButtonText: "Учиться",
  commands: [
    { command: "start", description: "🚀 Начать" },
    { command: "app", description: "📱 Открыть приложение" },
    { command: "help", description: "❓ Как это работает" },
    { command: "feedback", description: "📝 Написать отзыв" }
  ],
  // Description: экран "Что умеет этот бот?" до нажатия Start (до 512 символов)
  description: [
    "🧠 Lingo Brain: языки для СДВГ-мозга.",
    "",
    "🇪🇸 Испанский с нуля до A2/B1",
    "🇬🇧 Английский B1 → C1: разговор, собеседования, бизнес",
    "",
    "⏱ Раунды по 2 минуты (или 45 секунд, когда нет сил)",
    "🎙 Говоришь вслух и проживаешь сценарии: полиция, аренда, собеседование",
    "🧊 Пропустил день? Серия замораживается, без чувства вины",
    "",
    "Бесплатно. Жми «Начать» 👇"
  ].join(NL),
  // About / short description: шапка профиля бота (до 120 символов)
  shortDescription: "Испанский и английский для СДВГ-мозга: раунды по 2 минуты, говоришь вслух, без зубрёжки 🧠"
};

const TEXT = {
  start: (name) => [
    "Привет, <b>" + name + "</b>! 👋",
    "",
    "Я <b>Lingo Brain</b>, языки для мозга, которому быстро скучно 🧠",
    "",
    "🇪🇸 Испанский с нуля",
    "🇬🇧 Английский B1+: говорить и работать",
    "",
    "⏱ Раунд = 2 минуты. Нет сил? Есть режим на 45 секунд.",
    "🧊 Пропустил день? Серия замораживается, без чувства вины.",
    "",
    "Жми кнопку 👇"
  ].join(NL),
  help: [
    "<b>Как это работает</b>",
    "",
    "1️⃣ Открой приложение: кнопка «Учиться» слева от поля ввода",
    "2️⃣ Выбери трек 🇪🇸 или 🇬🇧",
    "3️⃣ Пройди раунд: 2 минуты, 5 карточек",
    "",
    "🪫 «Нет сил»: 45 секунд, серия не сгорит",
    "🎁 Surprise Box: случайный вопрос или мем",
    "🎙 Говори вслух, так мозг запоминает быстрее",
    "",
    "/app приложение · /feedback отзыв"
  ].join(NL),
  app: "Поехали! Одна кнопка, и ты в деле 👇",
  feedbackAsk: FEEDBACK_MARK + ": что улучшить или что сломалось? Ответь на это сообщение 👇",
  feedbackThanks: "Спасибо! 💛 Прочитаю лично. Ты делаешь Lingo Brain лучше.",
  fallback: "Я пока не болтаю в чате 🙂 Вся магия в приложении 👇"
};

const appKeyboard = (label) => ({
  inline_keyboard: [[{ text: label || "🚀 Открыть Lingo Brain", web_app: { url: APP_URL } }]]
});

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Чистим токен от пробелов, кавычек, переносов и лишнего префикса bot
function token(env) {
  let t = String(env.BOT_TOKEN || "").trim().replace(/["'`]/g, "").split(" ").join("").trim();
  if (t.toLowerCase().startsWith("bot")) t = t.slice(3);
  return t;
}

function tokenCheck(env) {
  const raw = String(env.BOT_TOKEN || "");
  const t = token(env);
  return {
    rawLength: raw.length,
    cleanLength: t.length,
    hasColon: t.indexOf(":") > 0,
    looksValid: /^[0-9]{6,}:[A-Za-z0-9_-]{30,}$/.test(t)
  };
}

async function tg(env, method, body) {
  const r = await fetch("https://api.telegram.org/bot" + token(env) + "/" + method, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return r.json();
}

function send(env, chatId, text, extra) {
  return tg(env, "sendMessage", Object.assign({
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true }
  }, extra || {}));
}

async function onFeedback(m, env) {
  await send(env, m.chat.id, TEXT.feedbackThanks);
  if (!env.ADMIN_CHAT_ID) return;
  const f = m.from || {};
  const who = esc(f.first_name || "?") + (f.username ? " @" + esc(f.username) : "") + " (id " + f.id + ")";
  await send(env, env.ADMIN_CHAT_ID, "📝 <b>Отзыв</b> от " + who + NL + NL + esc(m.text || "[не текст]"));
}

async function onUpdate(update, env) {
  const m = update.message;
  if (!m || !m.chat || m.chat.type !== "private") return;
  const chatId = m.chat.id;
  const name = esc((m.from && m.from.first_name) || "друг");
  const text = (m.text || "").trim();

  const r = m.reply_to_message;
  if (r && r.from && r.from.is_bot && (r.text || "").startsWith(FEEDBACK_MARK)) {
    return onFeedback(m, env);
  }

  const cmd = text.startsWith("/") ? text.split(" ")[0].split("@")[0].slice(1).toLowerCase() : "";
  if (cmd === "start") return send(env, chatId, TEXT.start(name), { reply_markup: appKeyboard("🚀 Начать раунд") });
  if (cmd === "app") return send(env, chatId, TEXT.app, { reply_markup: appKeyboard() });
  if (cmd === "help") return send(env, chatId, TEXT.help, { reply_markup: appKeyboard() });
  if (cmd === "feedback") {
    return send(env, chatId, TEXT.feedbackAsk, {
      reply_markup: { force_reply: true, input_field_placeholder: "Мне бы хотелось…" }
    });
  }
  return send(env, chatId, TEXT.fallback, { reply_markup: appKeyboard() });
}

async function setup(url, env) {
  if (url.searchParams.get("key") !== env.SETUP_KEY) return new Response("forbidden", { status: 403 });
  const check = tokenCheck(env);
  const me = await tg(env, "getMe", {});
  if (!me.ok) {
    return new Response(JSON.stringify({ allOk: false, tokenCheck: check, getMe: me }, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
  const out = {};
  out.setWebhook = await tg(env, "setWebhook", {
    url: url.origin + "/webhook",
    secret_token: env.WEBHOOK_SECRET,
    allowed_updates: ["message"],
    drop_pending_updates: true
  });
  out.setMyCommands = await tg(env, "setMyCommands", { commands: BOT.commands });
  out.setMyDescription = await tg(env, "setMyDescription", { description: BOT.description });
  out.setMyShortDescription = await tg(env, "setMyShortDescription", { short_description: BOT.shortDescription });
  out.setChatMenuButton = await tg(env, "setChatMenuButton", {
    menu_button: { type: "web_app", text: BOT.menuButtonText, web_app: { url: APP_URL } }
  });
  const allOk = Object.values(out).every((x) => x && x.ok);
  return new Response(JSON.stringify({ allOk: allOk, bot: "@" + me.result.username, results: out }, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/setup") return setup(url, env);
    if (url.pathname === "/webhook" && request.method === "POST") {
      if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) {
        return new Response("forbidden", { status: 403 });
      }
      try {
        await onUpdate(await request.json(), env);
      } catch (e) {
        console.log("update error", e && e.stack);
      }
      return new Response("ok");
    }
    return new Response("Lingo Brain bot is alive 🧠");
  }
};
