// Lingo Brain ADHD: Telegram-бот на Cloudflare Workers (бесплатно, работает 24/7)
// Секреты (Worker -> Settings -> Variables and Secrets, тип Secret):
//   BOT_TOKEN       токен от BotFather (только тут, нигде больше!)
//   WEBHOOK_SECRET  любая длинная строка, например 40 случайных букв
//   SETUP_KEY       ещё одна случайная строка, для одноразовой настройки
// Необязательно (тип Text): ADMIN_CHAT_ID, твой chat id, сюда придут отзывы и доступна /stats
// Binding D1 (имя DB): база lingo-brain-db для статистики (users, events)
// Настройка одним кликом: открой https://<твой-воркер>.workers.dev/setup?key=<SETUP_KEY>

const APP_URL = "https://lingo-brain-app.lingobrain.workers.dev/"; // v5.3: приложение на Cloudflare (lingo-brain-app), index.html без кэша
const APP_URL_FALLBACK = "https://aratacoder.github.io/lingo-app/";
const BOT_USERNAME = "LingoBrainBOT";
const EVENTS = ["app_opened", "topic_selected", "round_completed", "energy_mode_used"];
const TRACK_NAME = { es: "🇪🇸 Испанский", en: "🇬🇧 Английский" };
const NL = String.fromCharCode(10);
const FEEDBACK_MARK = "📝 Отзыв";

// Premium subscription in Telegram Stars. Off until enabled: no invoice can be created and the app gets
// premium.enabled = false. To launch: set enabled to true, deploy, open /setup?key=SETUP_KEY once
// (re-registers the webhook with pre_checkout_query). Telegram allows only a 30-day period, max 10000 Stars.
const PREMIUM = {
  enabled: false,
  stars: 150,
  period: 2592000,
  title: "Lingo Brain Плюс",
  description: "Поддержка проекта ⭐ Золотая рамка и значок «⭐» в рейтинге друзей, эксклюзивные темы для Карточки игрока и тёплая благодарность от автора. Все 80 тем обучения всегда бесплатны! Подписка на 30 дней."
};
const WEBHOOK_UPDATES = ["message", "pre_checkout_query", "callback_query"];
const BOT_URL = "https://lingo-brain-bot.lingobrain.workers.dev";

// Daily reminders. One message a day at the user's chosen local hour, only if no round was done today.
// Placeholders: {name}, {streak}. Owner edits these lists; keep each line short and guilt-free.
const REMIND = {
  defaultHour: 19,
  defaultTz: 60,          // minutes east of UTC until the app reports the real offset (CET)
  quietAfterDays: 14,     // no reminders to people who have not opened the bot/app for this long
  comebackAfterDays: 2,   // after this many days without a round, use the gentler "comeback" texts
  hours: [9, 13, 19, 21],
  regular: [
    "{name}, 2 минуты? 🧠 Одна тема, и день засчитан.",
    "Пара карточек, пока закипает чайник? ☕",
    "Мозг просит маленькую порцию языка 🍬 2 минуты, и свободен.",
    "Тук-тук 😺 Я тут. Одна карточка — уже победа.",
    "Сегодня без подвигов: короткий раунд и отдыхать 💛",
    "Испанец в тебе скучает 🇪🇸 Заглянешь на минутку?",
    "Нет сил? Есть режим на 45 секунд 🪫 Серия будет жить.",
    "Маленький шаг на сегодня: один раунд. Остальное — бонус ✨",
    "{name}, давай закроем цель дня? Это реально 2 минуты ⏱",
    "Новые слова сами не выучатся… но почти 😼 Жми кнопку.",
    "Кофе, карточка, готово ☕ Поехали?",
    "Я приготовила лёгкую тему. Проверим? 🎧"
  ],
  streak: [
    "Серия {streak} 🔥 Пара карточек, и она цела.",
    "Уже {streak} дн. подряд! Не дадим огоньку погаснуть 🔥",
    "{name}, серия {streak} — это круто. 2 минуты, и завтра будет {streak}+1 🙂",
    "Огонёк {streak} дн. ждёт дров 🔥 Один раунд?",
    "{streak} дней подряд — твой мозг уже привык. Продолжим? 💪"
  ],
  comeback: [
    "Скучаю 😿 Без давления: одна карточка, и мы снова в деле.",
    "{name}, привет! Пропуски — это нормально. Вернёмся с лёгкой темы? 🌱",
    "Никакой вины, только 45 секунд в режиме «Нет сил» 🪫",
    "Я сохранила твой прогресс 💾 Заглянешь на минутку?",
    "С возвращением можно и сегодня 💛 Одна карточка."
  ]
};

const BOT = {
  menuButtonText: "Учиться",
  commands: [
    { command: "start", description: "🚀 Начать" },
    { command: "app", description: "📱 Открыть приложение" },
    { command: "help", description: "❓ Как это работает" },
    { command: "remind", description: "⏰ Напоминания" },
    { command: "feedback", description: "📝 Написать отзыв" }
  ].concat(PREMIUM.enabled ? [{ command: "paysupport", description: "⭐ Вопросы по оплате" }] : []),
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
    "/app приложение · /remind напоминания · /feedback отзыв"
  ].join(NL),
  app: "Поехали! Одна кнопка, и ты в деле 👇",
  feedbackAsk: FEEDBACK_MARK + ": что улучшить или что сломалось? Ответь на это сообщение 👇",
  feedbackThanks: "Спасибо! 💛 Прочитаю лично. Ты делаешь Lingo Brain лучше.",
  paysupport: [
    "<b>Вопросы по оплате</b> ⭐",
    "",
    "Подписка оплачивается звёздами Telegram и продлевается раз в 30 дней.",
    "Отменить: Настройки Telegram → Мои звёзды → подписка Lingo Brain. Доступ остаётся до конца оплаченного периода.",
    "",
    "Если что-то не так с оплатой, напиши /feedback и опиши проблему, разберусь лично."
  ].join(NL),
  premiumThanks: (until) => "Спасибо за поддержку! ⭐ Lingo Brain Плюс активен до <b>" + new Date(until * 1000).toISOString().slice(0, 10) + "</b>.",
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

// Все вызовы Telegram API: никогда не бросают исключение
async function tg(env, method, body) {
  try {
    const r = await fetch("https://api.telegram.org/bot" + token(env) + "/" + method, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    try { return await r.json(); } catch (e) { return { ok: false, error: "bad json", status: r.status }; }
  } catch (e) {
    console.log("tg error", method, e && e.message);
    return { ok: false, error: String((e && e.message) || e) };
  }
}

// ---------- D1: все вызовы обёрнуты, при ошибке возвращают null ----------
let schemaReady = false;
async function ensureSchema(env) {
  if (schemaReady || !env.DB) return !!env.DB;
  try {
    await env.DB.batch([
      env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, first_seen INTEGER, last_seen INTEGER, track TEXT)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, event TEXT, track TEXT, xp INTEGER, ts INTEGER)"),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_events_event_ts ON events(event, ts)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY, name TEXT, username TEXT, xp INTEGER DEFAULT 0, week_key TEXT, week_base INTEGER DEFAULT 0, streak INTEGER DEFAULT 0, learned INTEGER DEFAULT 0, rounds INTEGER DEFAULT 0, updated INTEGER, frame TEXT, title TEXT)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS friends (a INTEGER, b INTEGER, ts INTEGER, PRIMARY KEY (a, b))"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS cards (id TEXT PRIMARY KEY, user_id INTEGER, data TEXT, ts INTEGER)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS subs (user_id INTEGER PRIMARY KEY, until INTEGER, charge_id TEXT, updated INTEGER)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS payments (charge_id TEXT PRIMARY KEY, user_id INTEGER, amount INTEGER, payload TEXT, until INTEGER, recurring INTEGER, refunded INTEGER DEFAULT 0, ts INTEGER)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS remind (user_id INTEGER PRIMARY KEY, enabled INTEGER DEFAULT 1, hour INTEGER, tz INTEGER, last_sent TEXT, last_round INTEGER, blocked INTEGER DEFAULT 0)")
    ]);
    try { await env.DB.prepare("ALTER TABLE payments ADD COLUMN refunded INTEGER DEFAULT 0").run(); } catch (e) {}
    try { await env.DB.prepare("ALTER TABLE players ADD COLUMN frame TEXT").run(); } catch (e) {}
    try { await env.DB.prepare("ALTER TABLE players ADD COLUMN title TEXT").run(); } catch (e) {}
    schemaReady = true;
  } catch (e) {
    console.log("d1 schema error", e && e.message);
  }
  return schemaReady;
}

async function dbFirst(env, sql, args) {
  if (!env.DB) return null;
  try { return await env.DB.prepare(sql).bind(...(args || [])).first(); }
  catch (e) { console.log("d1 error", e && e.message); return null; }
}

async function dbRun(env, sql, args) {
  if (!env.DB) return null;
  try { return await env.DB.prepare(sql).bind(...(args || [])).run(); }
  catch (e) { console.log("d1 error", e && e.message); return null; }
}

const now = () => Math.floor(Date.now() / 1000);

async function touchUser(env, id, track) {
  if (!id || !(await ensureSchema(env))) return;
  await dbRun(env,
    "INSERT INTO users (id, first_seen, last_seen, track) VALUES (?1, ?2, ?2, ?3) " +
    "ON CONFLICT(id) DO UPDATE SET last_seen = excluded.last_seen, track = COALESCE(excluded.track, users.track)",
    [id, now(), track || null]);
}

// ---------- Проверка подписи Telegram initData (HMAC-SHA256) ----------
const enc = (s) => new TextEncoder().encode(s);
async function hmac(keyBytes, data) {
  const k = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, typeof data === "string" ? enc(data) : data));
}
const hex = (b) => Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");

async function verifyInitData(initData, env) {
  try {
    if (typeof initData !== "string" || initData.length > 4096) return null;
    const p = new URLSearchParams(initData);
    const hash = p.get("hash");
    if (!hash) return null;
    const pairs = [];
    p.forEach((v, k) => { if (k !== "hash") pairs.push(k + "=" + v); });
    pairs.sort();
    const secret = await hmac(enc("WebAppData"), token(env));
    if (hex(await hmac(secret, pairs.join(NL))) !== hash) return null;
    const authDate = Number(p.get("auth_date") || 0);
    if (!authDate || now() - authDate > 7 * 86400) return null;
    const user = JSON.parse(p.get("user") || "null");
    return user && user.id ? user : null;
  } catch (e) {
    return null;
  }
}

// GET /ava/<id>.jpg — фото профиля игрока из Telegram (через бота, токен наружу не уходит)
async function onAva(id, env) {
  const h = { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=43200" };
  if (!/^[0-9]{1,15}$/.test(id)) return new Response("bad id", { status: 400, headers: h });
  const ph = await tg(env, "getUserProfilePhotos", { user_id: Number(id), limit: 1 });
  const sizes = ph && ph.ok && ph.result && ph.result.photos && ph.result.photos[0];
  if (!sizes || !sizes.length) return new Response("no photo", { status: 404, headers: { ...h, "Cache-Control": "public, max-age=600" } });
  const ps = sizes.filter(s => s.width >= 160)[0] || sizes[sizes.length - 1];
  const f = await tg(env, "getFile", { file_id: ps.file_id });
  if (!f || !f.ok || !f.result || !f.result.file_path) return new Response("no file", { status: 404, headers: { ...h, "Cache-Control": "public, max-age=600" } });
  const img = await fetch("https://api.telegram.org/file/bot" + token(env) + "/" + f.result.file_path);
  if (!img.ok) return new Response("fetch fail", { status: 502, headers: h });
  return new Response(await img.arrayBuffer(), { status: 200, headers: { ...h, "content-type": "image/jpeg" } });
}

function cors(status) {
  return new Response(null, {
    status: status || 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Max-Age": "86400"
    }
  });
}

// POST /api/event из Mini App. Всегда отвечает 204, чтобы не мешать приложению.
async function onEvent(request, env) {
  try {
    const raw = await request.text();
    if (raw.length > 8192) return cors();
    const body = JSON.parse(raw);
    if (!body || EVENTS.indexOf(body.event) < 0) return cors();
    const user = await verifyInitData(body.initData, env);
    if (!user) return cors();
    if (!(await ensureSchema(env))) return cors();
    const track = body.track === "es" || body.track === "en" ? body.track : null;
    const xp = Number.isFinite(body.xp) ? Math.max(0, Math.min(10000, Math.round(body.xp))) : null;
    await dbRun(env, "INSERT INTO events (user_id, event, track, xp, ts) VALUES (?1, ?2, ?3, ?4, ?5)",
      [user.id, body.event, track, xp, now()]);
    await touchUser(env, user.id, track);
    if (body.event === "round_completed") {
      await dbRun(env, "INSERT INTO remind (user_id, last_round) VALUES (?1, ?2) ON CONFLICT(user_id) DO UPDATE SET last_round = excluded.last_round", [user.id, now()]);
    }
  } catch (e) {
    console.log("event error", e && e.message);
  }
  return cors();
}


// ---------- v3.6: друзья, рейтинг, карточка игрока ----------
const refLink = (id) => "https://t.me/" + BOT_USERNAME + "?start=ref_" + id;
// номер недели (понедельник — начало), UTC
const weekKey = () => String(Math.floor((Math.floor(Date.now() / 86400000) + 3) / 7));
const clampInt = (v, max) => { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(max, Math.round(n))) : 0; };
const cleanName = (u) => String((u && (u.first_name || u.username)) || "Игрок").slice(0, 32);

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type"
    }
  });
}

function parseRef(v) {
  const s = String(v || "").trim();
  if (!s.startsWith("ref_")) return 0;
  const d = s.slice(4);
  return /^[0-9]{3,15}$/.test(d) ? Number(d) : 0;
}

async function ensurePlayer(env, u) {
  await dbRun(env, "INSERT OR IGNORE INTO players (id, name, username, xp, week_key, week_base, streak, learned, rounds, updated) VALUES (?1, ?2, ?3, 0, NULL, 0, 0, 0, 0, ?4)",
    [u.id, cleanName(u), u.username || null, now()]);
}

async function upsertPlayer(env, u, st) {
  const wk = weekKey();
  const old = await dbFirst(env, "SELECT xp, week_key, week_base, rounds FROM players WHERE id = ?1", [u.id]);
  let xp = clampInt(st.xp, 100000000);
  const fresh = !old || old.week_key == null;   // нет строки или только заглушка из /start
  if (old && !fresh) xp = Math.max(xp, old.xp || 0);
  let base;
  if (fresh) base = xp;                       // первая синхронизация: неделя считается с этого момента
  else if (old.week_key !== wk) base = old.xp || 0;
  else base = old.week_base || 0;
  if (base > xp) base = xp;
  const frame = typeof st.frame === "string" && st.frame ? st.frame.slice(0, 24) : null;
  const title = typeof st.title === "string" && st.title ? st.title.slice(0, 40) : null;
  await dbRun(env,
    "INSERT INTO players (id, name, username, xp, week_key, week_base, streak, learned, rounds, updated, frame, title) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12) " +
    "ON CONFLICT(id) DO UPDATE SET name = excluded.name, username = excluded.username, xp = excluded.xp, week_key = excluded.week_key, " +
    "week_base = excluded.week_base, streak = excluded.streak, learned = excluded.learned, rounds = excluded.rounds, updated = excluded.updated, " +
    "frame = COALESCE(excluded.frame, players.frame), title = COALESCE(excluded.title, players.title)",
    [u.id, cleanName(u), u.username || null, xp, wk, base, clampInt(st.streak, 100000), clampInt(st.learned, 1000000), clampInt(st.rounds, 10000000), now(), frame, title]);
}

// дружба в обе стороны; true, если она новая
async function link(env, a, b) {
  if (!a || !b || a === b || !env.DB) return false;
  const ex = await dbFirst(env, "SELECT 1 AS x FROM friends WHERE a = ?1 AND b = ?2", [a, b]);
  if (ex) return false;
  const cnt = await dbFirst(env, "SELECT COUNT(*) AS n FROM friends WHERE a = ?1", [a]);
  if (cnt && cnt.n >= 200) return false;
  try {
    await env.DB.batch([
      env.DB.prepare("INSERT OR IGNORE INTO friends (a, b, ts) VALUES (?1, ?2, ?3)").bind(a, b, now()),
      env.DB.prepare("INSERT OR IGNORE INTO friends (a, b, ts) VALUES (?1, ?2, ?3)").bind(b, a, now())
    ]);
    return true;
  } catch (e) {
    console.log("link error", e && e.message);
    return false;
  }
}

async function listFriends(env, id) {
  const wk = weekKey(), t = now();
  try {
    const r = await env.DB.prepare("SELECT p.id, p.name, p.xp, p.week_key, p.week_base, p.streak, p.learned, p.rounds, p.updated, p.frame, p.title, s.until FROM players p LEFT JOIN subs s ON s.user_id = p.id WHERE p.id = ?1 OR p.id IN (SELECT b FROM friends WHERE a = ?1) LIMIT 201").bind(id).all();
    const rows = ((r && r.results) || []).map((p) => ({
      id: p.id, name: p.name || "Игрок", xp: p.xp || 0,
      week: p.week_key === wk ? Math.max(0, (p.xp || 0) - (p.week_base || 0)) : 0,
      streak: p.streak || 0, learned: p.learned || 0, rounds: p.rounds || 0, me: p.id === id, seen: p.updated || 0,
      plus: (p.until || 0) > t,
      frame: p.frame || null,
      title: p.title || null
    }));
    rows.sort((a, b) => (b.week - a.week) || (b.xp - a.xp));
    return rows;
  } catch (e) {
    console.log("friends error", e && e.message);
    return [];
  }
}

async function notifyNewFriend(env, inviterId, friend) {
  await send(env, inviterId, "🎉 <b>" + esc(cleanName(friend)) + "</b> теперь у тебя в друзьях в Lingo Brain!" + NL + "Смотри, кто впереди на этой неделе 👇",
    { reply_markup: appKeyboard("👥 Открыть рейтинг") });
}

// v5.5: диагностика синхронизации (без хранения initData)
async function diagInit(initData, env) {
  const d = { len: typeof initData === "string" ? initData.length : -1 };
  try {
    const p = new URLSearchParams(initData || "");
    d.keys = [...p.keys()].join(",");
    d.age = now() - Number(p.get("auth_date") || 0);
    const hash = p.get("hash"); const pairs = [];
    p.forEach((v, k) => { if (k !== "hash") pairs.push(k + "=" + v); });
    pairs.sort();
    const secret = await hmac(enc("WebAppData"), token(env));
    d.match = !!hash && hex(await hmac(secret, pairs.join(NL))) === hash;
  } catch (e) { d.err = String((e && e.message) || e).slice(0, 120); }
  d.tok = /^[0-9]{6,}:[A-Za-z0-9_-]{30,}$/.test(token(env));
  return d;
}
async function noteMeta(env, k, v) {
  try { if (await ensureSchema(env)) await env.DB.prepare("INSERT OR REPLACE INTO meta (k, v) VALUES (?1, ?2)").bind(k, JSON.stringify(v)).run(); } catch (e) {}
}

// POST /api/sync {initData, stats?, ref?} -> {ok, me, friends, invite}
async function onSync(request, env) {
  let body;
  try { const raw = await request.text(); if (raw.length > 8192) return json({ ok: false, error: "too big" }, 413); body = JSON.parse(raw); }
  catch (e) { await noteMeta(env, "last_sync_err", { t: now(), e: "bad json" }); return json({ ok: false, error: "bad json" }, 400); }
  const user = await verifyInitData(body && body.initData, env);
  if (!user) { await noteMeta(env, "last_sync_err", { t: now(), e: "auth", d: await diagInit(body && body.initData, env) }); return json({ ok: false, error: "auth" }, 401); }
  if (!(await ensureSchema(env))) return json({ ok: false, error: "db" }, 503);
  if (body.stats && typeof body.stats === "object") await upsertPlayer(env, user, body.stats);
  else await ensurePlayer(env, user);
  const tz = typeof body.tz === "number" ? body.tz : NaN;
  if (Number.isFinite(tz) && Math.abs(tz) <= 14 * 60) {
    await dbRun(env, "INSERT INTO remind (user_id, tz) VALUES (?1, ?2) ON CONFLICT(user_id) DO UPDATE SET tz = excluded.tz", [user.id, Math.round(tz)]);
  }
  const ref = parseRef(body.ref);
  if (ref && ref !== user.id && (await link(env, user.id, ref))) await notifyNewFriend(env, ref, user);
  const fl = await listFriends(env, user.id);
  await noteMeta(env, "last_sync_ok", { t: now(), n: (fl || []).length });
  return json({ ok: true, me: user.id, friends: fl, invite: refLink(user.id), premium: await premiumState(env, user.id) });
}

// ---------- v6.2: Premium & Support (Telegram Stars) ----------
const SUPPORT_TIERS = [50, 150, 500];

async function premiumState(env, userId) {
  const row = await dbFirst(env, "SELECT until FROM subs WHERE user_id = ?1", [userId]);
  const until = (row && row.until) || 0;
  return { enabled: PREMIUM.enabled, active: until > now(), until: until, stars: PREMIUM.stars, tiers: SUPPORT_TIERS };
}

// POST /api/invoice {initData, tier?: 50|150|500} -> {ok, url}: link for Telegram.WebApp.openInvoice
async function onInvoice(request, env) {
  let body;
  try { const raw = await request.text(); if (raw.length > 8192) return json({ ok: false, error: "too big" }, 413); body = JSON.parse(raw); }
  catch (e) { return json({ ok: false, error: "bad json" }, 400); }
  const tier = body && SUPPORT_TIERS.indexOf(Number(body.tier)) >= 0 ? Number(body.tier) : 0;
  if (!tier && !PREMIUM.enabled) return json({ ok: false, error: "disabled" }, 404);
  const user = await verifyInitData(body && body.initData, env);
  if (!user) return json({ ok: false, error: "auth" }, 401);
  const req = tier ? {
    title: "Поддержка Lingo Brain (" + tier + " ⭐)",
    description: "Разовый донат на развитие бесплатного приложения + VIP-рамка, титул «Меценат» и все стили карточки навсегда 💛",
    payload: "support:" + user.id + ":" + tier,
    provider_token: "",
    currency: "XTR",
    prices: [{ label: "Поддержка Lingo Brain", amount: tier }]
  } : {
    title: PREMIUM.title,
    description: PREMIUM.description,
    payload: "premium:" + user.id,
    provider_token: "",
    currency: "XTR",
    prices: [{ label: PREMIUM.title, amount: PREMIUM.stars }],
    subscription_period: PREMIUM.period
  };
  const r = await tg(env, "createInvoiceLink", req);
  if (!r || !r.ok) return json({ ok: false, error: (r && r.description) || "invoice" }, 502);
  return json({ ok: true, url: r.result });
}

// Telegram waits ~10 s for this answer, otherwise the payment fails.
async function onPreCheckout(q, env) {
  const p = String(q.invoice_payload || ""), uid = q.from && q.from.id;
  const isSup = /^support:[0-9]+:(50|150|500)$/.test(p) && p === "support:" + uid + ":" + q.total_amount;
  const isPrem = PREMIUM.enabled && q.total_amount === PREMIUM.stars && p === "premium:" + uid;
  const good = q.currency === "XTR" && (isSup || isPrem);
  return tg(env, "answerPreCheckoutQuery", good
    ? { pre_checkout_query_id: q.id, ok: true }
    : { pre_checkout_query_id: q.id, ok: false, error_message: "Платёж сейчас недоступен. Попробуй позже 🙏" });
}

async function onPayment(m, env) {
  const sp = m.successful_payment, uid = m.from && m.from.id;
  if (!sp || !uid) return;
  const chId = String(sp.telegram_payment_charge_id || "");
  if (!chId) return;
  if (!(await ensureSchema(env))) throw new Error("db schema failed");
  const seen = await env.DB.prepare("SELECT until FROM payments WHERE charge_id = ?1").bind(chId).first();
  if (seen) return; // duplicate webhook delivery: do not extend subscription or re-send thanks
  const old = await env.DB.prepare("SELECT until FROM subs WHERE user_id = ?1").bind(uid).first();
  const base = Math.max(now(), (old && old.until) || 0);
  const isSup = String(sp.invoice_payload || "").startsWith("support:");
  const until = isSup ? (now() + 100 * 365 * 86400) : (Number(sp.subscription_expiration_date) || base + PREMIUM.period);
  // Every payment is kept (charge id is needed for refunds and for editUserStarSubscription).
  await env.DB.batch([
    env.DB.prepare("INSERT INTO payments (charge_id, user_id, amount, payload, until, recurring, refunded, ts) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7)")
      .bind(chId, uid, Number(sp.total_amount) || 0, String(sp.invoice_payload || "").slice(0, 128), until, sp.is_recurring ? 1 : 0, now()),
    env.DB.prepare("INSERT INTO subs (user_id, until, charge_id, updated) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(user_id) DO UPDATE SET until = MAX(subs.until, excluded.until), charge_id = excluded.charge_id, updated = excluded.updated")
      .bind(uid, until, chId, now())
  ]);
  const msg = isSup
    ? ("💛 <b>Огромное спасибо за поддержку Lingo Brain!</b>" + NL + NL + "Золотая VIP-рамка, титул «⭐ Меценат» и все стили карточки игрока открыты для тебя навсегда!")
    : TEXT.premiumThanks(until);
  if (!sp.is_recurring || sp.is_first_recurring) await send(env, m.chat.id, msg, { reply_markup: appKeyboard("🚀 Открыть Lingo Brain") });
}

async function onRefund(m, env) {
  const rp = m.refunded_payment, uid = m.from && m.from.id;
  if (!rp || !uid) return;
  const chId = String(rp.telegram_payment_charge_id || "");
  if (!chId) return;
  if (!(await ensureSchema(env))) throw new Error("db schema failed");
  await env.DB.batch([
    env.DB.prepare("UPDATE payments SET refunded = 1 WHERE charge_id = ?1").bind(chId),
    env.DB.prepare("UPDATE subs SET until = 0, updated = ?2 WHERE user_id = ?1 AND charge_id = ?3").bind(uid, now(), chId)
  ]);
}

// POST /api/remind {initData, on, hour, tz, lang} -> {ok, enabled, hour}
async function onRemindApi(request, env) {
  let body;
  try { const raw = await request.text(); if (raw.length > 8192) return json({ ok: false, error: "too big" }, 413); body = JSON.parse(raw); }
  catch (e) { return json({ ok: false, error: "bad json" }, 400); }
  const user = await verifyInitData(body && body.initData, env);
  if (!user) return json({ ok: false, error: "auth" }, 401);
  if (!(await ensureSchema(env))) return json({ ok: false, error: "db" }, 503);
  const on = body.on ? 1 : 0;
  const hour = Number.isFinite(Number(body.hour)) ? Math.max(0, Math.min(23, Math.round(Number(body.hour)))) : REMIND.defaultHour;
  const tz = Number.isFinite(Number(body.tz)) && Math.abs(Number(body.tz)) <= 14 * 60 ? Math.round(Number(body.tz)) : REMIND.defaultTz;
  const track = body.lang === "es" || body.lang === "en" ? body.lang : null;
  await touchUser(env, user.id, track);
  await dbRun(env,
    "INSERT INTO remind (user_id, enabled, hour, tz, blocked) VALUES (?1, ?2, ?3, ?4, 0) " +
    "ON CONFLICT(user_id) DO UPDATE SET enabled = excluded.enabled, hour = excluded.hour, tz = excluded.tz, blocked = 0",
    [user.id, on, hour, tz]);
  return json({ ok: true, enabled: on, hour: hour });
}

// ---------- v6.3: daily reminders (Cron Trigger, hourly) ----------
// Local time = UTC + tz minutes. Day keys are "YYYY-MM-DD" in that local time.
function localNow(tz, t) {
  const d = new Date(((t == null ? now() : t) + tz * 60) * 1000);
  return { hour: d.getUTCHours(), day: d.toISOString().slice(0, 10) };
}
function fillText(tpl, p) {
  return tpl.replace(/\{name\}/g, p.name).replace(/\{streak\}/g, String(p.streak));
}
function pickReminder(p) {
  const pool = p.daysIdle >= REMIND.comebackAfterDays ? REMIND.comeback : (p.streak >= 2 ? REMIND.streak : REMIND.regular);
  return fillText(pool[Math.floor(Math.random() * pool.length)], p);
}
const remindKeyboard = () => ({
  inline_keyboard: [[{ text: "🚀 2 минуты", web_app: { url: APP_URL } }], [{ text: "⏰ Время / выключить", callback_data: "rm:menu" }]]
});

async function runReminders(env, t) {
  if (!(await ensureSchema(env))) return { sent: 0 };
  t = t == null ? now() : t;
  const rows = await env.DB.prepare(
    "SELECT u.id, u.last_seen, r.enabled, r.hour, r.tz, r.last_sent, r.last_round, p.streak, p.name " +
    "FROM users u LEFT JOIN remind r ON r.user_id = u.id LEFT JOIN players p ON p.id = u.id " +
    "WHERE COALESCE(r.enabled, 1) = 1 AND COALESCE(r.blocked, 0) = 0 AND u.last_seen > ?1"
  ).bind(t - REMIND.quietAfterDays * 86400).all().catch((e) => { console.log("remind query", e && e.message); return { results: [] }; });
  let sent = 0, skipped = 0;
  for (const r of rows.results || []) {
    if (sent >= 300) break; // stays well under Telegram's ~30 msg/s and the Worker time limit
    const tz = r.tz == null ? REMIND.defaultTz : r.tz, hour = r.hour == null ? REMIND.defaultHour : r.hour;
    const ln = localNow(tz, t);
    if (ln.hour !== hour || r.last_sent === ln.day) { skipped++; continue; }
    if (r.last_round && localNow(tz, r.last_round).day === ln.day) { skipped++; continue; }
    const lastAct = Math.max(r.last_round || 0, r.last_seen || 0);
    const daysIdle = r.last_round ? Math.floor((t - r.last_round) / 86400) : Math.floor((t - lastAct) / 86400);
    const text = pickReminder({ name: esc(r.name || "друг"), streak: r.streak || 0, daysIdle: daysIdle });
    const res = await send(env, r.id, text, { reply_markup: remindKeyboard() });
    if (res && res.ok) {
      sent++;
      await dbRun(env, "INSERT INTO remind (user_id, last_sent) VALUES (?1, ?2) ON CONFLICT(user_id) DO UPDATE SET last_sent = excluded.last_sent", [r.id, ln.day]);
    } else if (res && (res.error_code === 403 || (res.error_code === 400 && /chat not found/i.test(res.description || "")))) {
      // blocked the bot / never started it: stop trying. Other 400s (e.g. a broken template) must not block anyone.
      await dbRun(env, "INSERT INTO remind (user_id, blocked) VALUES (?1, 1) ON CONFLICT(user_id) DO UPDATE SET blocked = 1", [r.id]);
    }
  }
  if (sent) await noteMeta(env, "last_remind", { t: t, sent: sent });
  return { sent: sent, skipped: skipped };
}

function remindMenu(cur) {
  const label = (h) => (cur && cur.enabled !== 0 && (cur.hour == null ? REMIND.defaultHour : cur.hour) === h ? "✅ " : "") + h + ":00";
  return {
    inline_keyboard: [
      REMIND.hours.map((h) => ({ text: label(h), callback_data: "rm:" + h })),
      [{ text: "👀 Пример", callback_data: "rm:test" }, { text: (cur && cur.enabled === 0 ? "✅ " : "") + "🔕 Выключить", callback_data: "rm:off" }]
    ]
  };
}
async function remindState(env, id) {
  return (await dbFirst(env, "SELECT enabled, hour, tz FROM remind WHERE user_id = ?1", [id])) || { enabled: 1, hour: null, tz: null };
}
const remindText = (st) => st.enabled === 0
  ? "🔕 Напоминания выключены. Выбери время, чтобы включить:"
  : "⏰ Напоминаю раз в день, только если ты ещё не занимался. Сейчас: <b>" + (st.hour == null ? REMIND.defaultHour : st.hour) + ":00</b> по твоему времени.";

async function onRemindCmd(m, env) {
  if (!(await ensureSchema(env))) return;
  const st = await remindState(env, m.from.id);
  return send(env, m.chat.id, remindText(st), { reply_markup: remindMenu(st) });
}

async function onCallback(q, env) {
  const data = String(q.data || ""), uid = q.from && q.from.id, msg = q.message;
  if (!data.startsWith("rm:") || !uid || !(await ensureSchema(env))) return tg(env, "answerCallbackQuery", { callback_query_id: q.id });
  const v = data.slice(3);
  if (v === "test") {
    const p = await dbFirst(env, "SELECT name, streak FROM players WHERE id = ?1", [uid]);
    await send(env, uid, pickReminder({ name: esc((p && p.name) || (q.from.first_name) || "друг"), streak: (p && p.streak) || 0, daysIdle: 0 }), { reply_markup: remindKeyboard() });
    return tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "Вот так это выглядит 👇" });
  }
  if (v === "off") {
    await dbRun(env, "INSERT INTO remind (user_id, enabled) VALUES (?1, 0) ON CONFLICT(user_id) DO UPDATE SET enabled = 0", [uid]);
  } else if (v !== "menu") {
    const h = Number(v);
    if (REMIND.hours.indexOf(h) < 0) return tg(env, "answerCallbackQuery", { callback_query_id: q.id });
    await dbRun(env, "INSERT INTO remind (user_id, enabled, hour, blocked) VALUES (?1, 1, ?2, 0) ON CONFLICT(user_id) DO UPDATE SET enabled = 1, hour = excluded.hour, blocked = 0", [uid, h]);
  }
  const st = await remindState(env, uid);
  if (v === "menu" || !msg) await send(env, uid, remindText(st), { reply_markup: remindMenu(st) });
  else await tg(env, "editMessageText", { chat_id: msg.chat.id, message_id: msg.message_id, text: remindText(st), parse_mode: "HTML", reply_markup: remindMenu(st) });
  return tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: v === "off" ? "Выключено 🔕" : v === "menu" ? "" : "Готово ✅" });
}

// Keeps the webhook's allowed_updates and the command menu in sync with the code without a manual /setup
// (same webhook URL and secret). Runs from the webhook and from the cron.
let botConfigSynced = false;
async function syncBotConfig(env) {
  if (botConfigSynced || !env.WEBHOOK_SECRET || !(await ensureSchema(env))) return;
  const want = JSON.stringify({ u: WEBHOOK_UPDATES, c: BOT.commands });
  const row = await dbFirst(env, "SELECT v FROM meta WHERE k = 'bot_config'");
  if (row && row.v === want) { botConfigSynced = true; return; }
  const wh = await tg(env, "setWebhook", { url: BOT_URL + "/webhook", secret_token: env.WEBHOOK_SECRET, allowed_updates: WEBHOOK_UPDATES });
  const cm = await tg(env, "setMyCommands", { commands: BOT.commands });
  if (wh && wh.ok && cm && cm.ok) { await dbRun(env, "INSERT OR REPLACE INTO meta (k, v) VALUES ('bot_config', ?1)", [want]); botConfigSynced = true; }
}

function b64bytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function tgPhoto(env, chatId, bytes, caption, markup) {
  try {
    const fd = new FormData();
    fd.append("chat_id", String(chatId));
    fd.append("caption", caption);
    fd.append("parse_mode", "HTML");
    fd.append("reply_markup", JSON.stringify(markup));
    fd.append("photo", new Blob([bytes], { type: "image/jpeg" }), "lingo-brain.jpg");
    const r = await fetch("https://api.telegram.org/bot" + token(env) + "/sendPhoto", { method: "POST", body: fd });
    try { return await r.json(); } catch (e) { return { ok: false, status: r.status }; }
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

// POST /api/card {initData, image: dataURL jpeg, send?: bool} -> {ok, url, sent}
async function onCard(request, env) {
  let body;
  try { const raw = await request.text(); if (raw.length > 2600000) return json({ ok: false, error: "too big" }, 413); body = JSON.parse(raw); }
  catch (e) { await noteMeta(env, "last_sync_err", { t: now(), e: "bad json" }); return json({ ok: false, error: "bad json" }, 400); }
  const user = await verifyInitData(body && body.initData, env);
  if (!user) return json({ ok: false, error: "auth" }, 401);
  const b64 = String(body.image || "").split(",").pop();
  let bytes;
  try { bytes = b64bytes(b64); } catch (e) { return json({ ok: false, error: "bad image" }, 400); }
  if (bytes.length < 1000 || bytes.length > 1900000 || bytes[0] !== 0xFF || bytes[1] !== 0xD8) return json({ ok: false, error: "bad image" }, 400);
  if (!(await ensureSchema(env))) return json({ ok: false, error: "db" }, 503);
  const id = hex(crypto.getRandomValues(new Uint8Array(12)));
  await dbRun(env, "DELETE FROM cards WHERE ts < ?1", [now() - 2 * 86400]);
  await dbRun(env, "INSERT INTO cards (id, user_id, data, ts) VALUES (?1, ?2, ?3, ?4)", [id, user.id, b64, now()]);
  const url = new URL(request.url).origin + "/card/" + id + ".jpg";
  let sent = false, error = null;
  if (body.send) {
    const r = await tgPhoto(env, user.id, bytes, "🧠 Мой результат в <b>Lingo Brain</b>!" + NL + "Перешли другу — пусть попробует обогнать 👇",
      { inline_keyboard: [[{ text: "🚀 Обогнать меня", url: refLink(user.id) }]] });
    sent = !!(r && r.ok);
    if (!sent) error = (r && (r.description || r.error)) || "send failed";
  }
  return json({ ok: true, url: url, sent: sent, error: error, invite: refLink(user.id) });
}

async function onCardGet(id, env) {
  if (!/^[0-9a-f]{24}$/.test(id) || !(await ensureSchema(env))) return new Response("not found", { status: 404 });
  const row = await dbFirst(env, "SELECT data FROM cards WHERE id = ?1", [id]);
  if (!row || !row.data) return new Response("not found", { status: 404 });
  return new Response(b64bytes(row.data), {
    headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=86400", "Access-Control-Allow-Origin": "*" }
  });
}

// /stats: только для ADMIN_CHAT_ID
async function onStats(m, env) {
  const fromId = String((m.from && m.from.id) || "");
  if (!env.ADMIN_CHAT_ID) {
    return send(env, m.chat.id, "⚙️ /stats пока не настроена." + NL + "Твой Telegram ID: <code>" + esc(fromId) + "</code>" + NL +
      "Добавь его в Cloudflare → Worker → Settings → Variables как ADMIN_CHAT_ID (тип Text).");
  }
  if (fromId !== String(env.ADMIN_CHAT_ID).trim()) {
    return send(env, m.chat.id, TEXT.fallback, { reply_markup: appKeyboard() });
  }
  if (!env.DB || !(await ensureSchema(env))) return send(env, m.chat.id, "⚠️ База не подключена (нет binding DB).");
  const day = now() - 86400;
  const total = await dbFirst(env, "SELECT COUNT(*) AS n FROM users");
  const dau = await dbFirst(env, "SELECT COUNT(*) AS n FROM users WHERE last_seen >= ?1", [day]);
  const rounds = await dbFirst(env, "SELECT COUNT(*) AS n, COALESCE(SUM(xp), 0) AS xp FROM events WHERE event = 'round_completed'");
  const rounds24 = await dbFirst(env, "SELECT COUNT(*) AS n FROM events WHERE event = 'round_completed' AND ts >= ?1", [day]);
  let top = await dbFirst(env, "SELECT track, COUNT(*) AS n FROM events WHERE event = 'round_completed' AND track IN ('es', 'en') GROUP BY track ORDER BY n DESC LIMIT 1");
  if (!top) top = await dbFirst(env, "SELECT track, COUNT(*) AS n FROM events WHERE event = 'topic_selected' AND track IN ('es', 'en') GROUP BY track ORDER BY n DESC LIMIT 1");
  const low = await dbFirst(env, "SELECT COUNT(*) AS n FROM events WHERE event = 'energy_mode_used'");
  const v = (r, k) => (r && r[k] != null ? r[k] : "?");
  const lines = [
    "📊 <b>Lingo Brain: статистика</b>",
    "",
    "👥 Всего юзеров: <b>" + v(total, "n") + "</b>",
    "🔥 Активные за 24 ч (DAU): <b>" + v(dau, "n") + "</b>",
    "✅ Раундов за всё время: <b>" + v(rounds, "n") + "</b> (за 24 ч: " + v(rounds24, "n") + ")",
    "🏆 Самый популярный трек: <b>" + (top && top.track ? TRACK_NAME[top.track] + " (" + top.n + ")" : "пока нет данных") + "</b>",
    "🪫 Режим «Нет сил»: " + v(low, "n") + " раз",
    "⭐ XP заработано: " + v(rounds, "xp")
  ];
  if ([total, dau, rounds].some((x) => x === null)) lines.push("", "⚠️ Часть запросов к базе не удалась, смотри логи Worker.");
  return send(env, m.chat.id, lines.join(NL));
}

// /gift: бесплатное переключение Плюс-косметики для админа (или /gift off)
async function onGift(m, env) {
  const fromId = String((m.from && m.from.id) || "");
  if (!env.ADMIN_CHAT_ID || fromId !== String(env.ADMIN_CHAT_ID).trim()) {
    return send(env, m.chat.id, TEXT.fallback, { reply_markup: appKeyboard() });
  }
  if (!env.DB || !(await ensureSchema(env))) return send(env, m.chat.id, "⚠️ База не подключена.");
  const arg = String(m.text || "").trim().split(/\s+/)[1] || "";
  const cur = await dbFirst(env, "SELECT until FROM subs WHERE user_id = ?1", [m.from.id]);
  const isAct = cur && cur.until > now();
  const turnOff = arg === "off" || (arg !== "on" && isAct);
  const until = turnOff ? 0 : now() + PREMIUM.period;
  await dbRun(env, "INSERT INTO subs (user_id, until, charge_id, updated) VALUES (?1, ?2, 'gift', ?3) ON CONFLICT(user_id) DO UPDATE SET until = excluded.until, charge_id = excluded.charge_id, updated = excluded.updated",
    [m.from.id, until, now()]);
  return send(env, m.chat.id, turnOff
    ? "🔕 Тестовый статус Плюс <b>выключен</b>. Открой приложение (или напиши /gift снова, чтобы включить)."
    : "🎁 Тестовый статус <b>Lingo Brain Плюс</b> включён на 30 дней! Открой приложение — рамка, значок ⭐ и все 4 стиля карточки уже работают 👇",
    { reply_markup: appKeyboard("🚀 Проверить косметику") });
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
  if (update.pre_checkout_query) return onPreCheckout(update.pre_checkout_query, env);
  if (update.callback_query) return onCallback(update.callback_query, env);
  const m = update.message;
  if (!m || !m.chat || m.chat.type !== "private") return;
  if (m.successful_payment) return onPayment(m, env);
  if (m.refunded_payment) return onRefund(m, env);
  const chatId = m.chat.id;
  const name = esc((m.from && m.from.first_name) || "друг");
  const text = (m.text || "").trim();

  const r = m.reply_to_message;
  if (r && r.from && r.from.is_bot && (r.text || "").startsWith(FEEDBACK_MARK)) {
    return onFeedback(m, env);
  }

  if (m.from && m.from.id) await touchUser(env, m.from.id, null);

  const cmd = text.startsWith("/") ? text.split(" ")[0].split("@")[0].slice(1).toLowerCase() : "";
  if (cmd === "stats") return onStats(m, env);
  if (cmd === "gift") return onGift(m, env);
  if (cmd === "start") {
    let extra = "";
    const ref = parseRef(text.split(" ")[1]);
    if (ref && m.from && m.from.id && ref !== m.from.id && (await ensureSchema(env))) {
      await ensurePlayer(env, m.from);
      if (await link(env, m.from.id, ref)) {
        const inv = await dbFirst(env, "SELECT name FROM players WHERE id = ?1", [ref]);
        extra = NL + NL + "🤝 Вы с <b>" + esc((inv && inv.name) || "другом") + "</b> теперь друзья: сравнивайте прогресс во вкладке «👥 Друзья».";
        await notifyNewFriend(env, ref, m.from);
      }
    }
    return send(env, chatId, TEXT.start(name) + extra, { reply_markup: appKeyboard("🚀 Начать раунд") });
  }
  if (cmd === "app") return send(env, chatId, TEXT.app, { reply_markup: appKeyboard() });
  if (cmd === "help") return send(env, chatId, TEXT.help, { reply_markup: appKeyboard() });
  if (cmd === "remind") return onRemindCmd(m, env);
  if (cmd === "paysupport") return send(env, chatId, TEXT.paysupport);
  if (cmd === "feedback") {
    return send(env, chatId, TEXT.feedbackAsk, {
      reply_markup: { force_reply: true, input_field_placeholder: "Мне бы хотелось…" }
    });
  }
  return send(env, chatId, TEXT.fallback, { reply_markup: appKeyboard() });
}

// Автообновление кнопки меню: если APP_URL поменялся — бот сам переставит кнопку (без /setup и SETUP_KEY)
let menuSynced = false;
async function syncMenu(env, force) {
  if (menuSynced && !force) return { ok: true, cached: true };
  await ensureSchema(env);
  const row = await dbFirst(env, "SELECT v FROM meta WHERE k = 'menu_url'");
  if (!force && row && row.v === APP_URL) { menuSynced = true; return { ok: true, same: true }; }
  const res = await tg(env, "setChatMenuButton", { menu_button: { type: "web_app", text: BOT.menuButtonText, web_app: { url: APP_URL } } });
  if (res && res.ok) { await dbRun(env, "INSERT OR REPLACE INTO meta (k, v) VALUES ('menu_url', ?1)", [APP_URL]); menuSynced = true; }
  return res;
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
    allowed_updates: WEBHOOK_UPDATES,
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
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/sync-menu") {
      const res = await syncMenu(env, url.searchParams.has("force"));
      return new Response(JSON.stringify({ app: APP_URL, result: res }), { headers: { "content-type": "application/json; charset=utf-8" } });
    }
    if (url.pathname === "/api/event") {
      if (request.method === "OPTIONS") return cors();
      if (request.method === "POST") return onEvent(request, env);
      return cors(405);
    }
    if (url.pathname === "/api/health") {
      const hh = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "Access-Control-Allow-Origin": "*" };
      // Player count and sync diagnostics are admin-only: /api/health?key=<SETUP_KEY>
      if (!env.SETUP_KEY || url.searchParams.get("key") !== env.SETUP_KEY) return new Response(JSON.stringify({ ok: true }), { headers: hh });
      const db = await ensureSchema(env); const out = { db, now: now(), tok: /^[0-9]{6,}:[A-Za-z0-9_-]{30,}$/.test(token(env)) };
      if (db) {
        try { out.players = (await env.DB.prepare("SELECT COUNT(*) AS n FROM players").first()).n; } catch (e) { out.pe = String(e && e.message).slice(0, 120); }
        try { const r = await env.DB.prepare("SELECT k, v FROM meta WHERE k IN ('last_sync_err','last_sync_ok')").all(); (r.results || []).forEach((x) => { out[x.k] = JSON.parse(x.v); }); } catch (e) {}
      }
      return new Response(JSON.stringify(out), { headers: hh });
    }
    if (url.pathname === "/api/sync" || url.pathname === "/api/card" || url.pathname === "/api/invoice" || url.pathname === "/api/remind") {
      if (request.method === "OPTIONS") return cors();
      if (request.method !== "POST") return cors(405);
      try {
        if (url.pathname === "/api/sync") return await onSync(request, env);
        if (url.pathname === "/api/invoice") return await onInvoice(request, env);
        if (url.pathname === "/api/remind") return await onRemindApi(request, env);
        return await onCard(request, env);
      }
      catch (e) { console.log("api error", e && e.stack); await noteMeta(env, "last_sync_err", { t: now(), e: "server", m: String((e && e.message) || e).slice(0, 200), p: url.pathname }); return json({ ok: false, error: "server" }, 500); }
    }
    if (url.pathname.startsWith("/ava/") && request.method === "GET") {
      try { return await onAva(url.pathname.slice(5).replace(".jpg", ""), env); } catch (e) { return new Response("err", { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }); }
    }
    if (url.pathname.startsWith("/card/") && request.method === "GET") {
      return onCardGet(url.pathname.slice(6).replace(".jpg", ""), env);
    }
    if (url.pathname === "/setup") {
      try { return await setup(url, env); }
      catch (e) { return new Response("setup error: " + ((e && e.message) || e), { status: 500 }); }
    }
    if (url.pathname === "/webhook" && request.method === "POST") {
      if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) {
        return new Response("forbidden", { status: 403 });
      }
      try {
        if (ctx && ctx.waitUntil) ctx.waitUntil(Promise.all([syncMenu(env).catch(() => {}), syncBotConfig(env).catch(() => {})]));
        await onUpdate(await request.json(), env);
      } catch (e) {
        console.log("update error", e && e.stack);
        return new Response("error", { status: 500 });
      }
      return new Response("ok");
    }
    return new Response("Lingo Brain bot is alive 🧠");
  },

  // Cron Trigger "0 * * * *": every hour, sends reminders to users whose local reminder hour is now.
  async scheduled(event, env, ctx) {
    const job = Promise.all([
      syncBotConfig(env).catch((e) => console.log("bot config", e && e.message)),
      runReminders(env).catch((e) => console.log("reminders", e && e.stack))
    ]);
    if (ctx && ctx.waitUntil) ctx.waitUntil(job); else await job;
  }
};
