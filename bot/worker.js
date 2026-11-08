// Lingo Brain ADHD: Telegram-бот на Cloudflare Workers (бесплатно, работает 24/7)
// Секреты (Worker -> Settings -> Variables and Secrets, тип Secret):
//   BOT_TOKEN       токен от BotFather (только тут, нигде больше!)
//   WEBHOOK_SECRET  любая длинная строка, например 40 случайных букв
//   SETUP_KEY       ещё одна случайная строка, для одноразовой настройки
// Необязательно (тип Text): ADMIN_CHAT_ID, твой chat id, сюда придут отзывы и доступна /stats
// Binding D1 (имя DB): база lingo-brain-db для статистики (users, events)
// Настройка одним кликом: открой https://<твой-воркер>.workers.dev/setup?key=<SETUP_KEY>

const APP_URL = "https://aratacoder.github.io/lingo-app/?v=12";
const BOT_USERNAME = "LingoBrainBOT";
const APP_ORIGIN = "https://aratacoder.github.io";
const EVENTS = ["app_opened", "topic_selected", "round_completed", "energy_mode_used"];
const TRACK_NAME = { es: "🇪🇸 Испанский", en: "🇬🇧 Английский" };
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
      env.DB.prepare("CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY, name TEXT, username TEXT, xp INTEGER DEFAULT 0, week_key TEXT, week_base INTEGER DEFAULT 0, streak INTEGER DEFAULT 0, learned INTEGER DEFAULT 0, rounds INTEGER DEFAULT 0, updated INTEGER)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS friends (a INTEGER, b INTEGER, ts INTEGER, PRIMARY KEY (a, b))"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS cards (id TEXT PRIMARY KEY, user_id INTEGER, data TEXT, ts INTEGER)")
    ]);
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
  const row = await env.DB.prepare("SELECT id FROM players WHERE id = ?").bind(Number(id)).first();
  if (!row) return new Response("not found", { status: 404, headers: h });
  const ph = await tg(env, "getUserProfilePhotos", { user_id: Number(id), limit: 1 });
  const sizes = ph && ph.ok && ph.result && ph.result.photos && ph.result.photos[0];
  if (!sizes || !sizes.length) return new Response("no photo", { status: 404, headers: { ...h, "Cache-Control": "public, max-age=3600" } });
  const ps = sizes.filter(s => s.width >= 160)[0] || sizes[sizes.length - 1];
  const f = await tg(env, "getFile", { file_id: ps.file_id });
  if (!f || !f.ok || !f.result || !f.result.file_path) return new Response("no file", { status: 404, headers: h });
  const img = await fetch("https://api.telegram.org/file/bot" + token(env) + "/" + f.result.file_path);
  if (!img.ok) return new Response("fetch fail", { status: 502, headers: h });
  return new Response(await img.arrayBuffer(), { status: 200, headers: { ...h, "content-type": "image/jpeg" } });
}

function cors(status) {
  return new Response(null, {
    status: status || 204,
    headers: {
      "Access-Control-Allow-Origin": APP_ORIGIN,
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
      "Access-Control-Allow-Origin": APP_ORIGIN,
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
  await dbRun(env,
    "INSERT INTO players (id, name, username, xp, week_key, week_base, streak, learned, rounds, updated) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10) " +
    "ON CONFLICT(id) DO UPDATE SET name = excluded.name, username = excluded.username, xp = excluded.xp, week_key = excluded.week_key, " +
    "week_base = excluded.week_base, streak = excluded.streak, learned = excluded.learned, rounds = excluded.rounds, updated = excluded.updated",
    [u.id, cleanName(u), u.username || null, xp, wk, base, clampInt(st.streak, 100000), clampInt(st.learned, 1000000), clampInt(st.rounds, 10000000), now()]);
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
  const wk = weekKey();
  try {
    const r = await env.DB.prepare("SELECT id, name, xp, week_key, week_base, streak, learned, rounds, updated FROM players WHERE id = ?1 OR id IN (SELECT b FROM friends WHERE a = ?1) LIMIT 201").bind(id).all();
    const rows = ((r && r.results) || []).map((p) => ({
      id: p.id, name: p.name || "Игрок", xp: p.xp || 0,
      week: p.week_key === wk ? Math.max(0, (p.xp || 0) - (p.week_base || 0)) : 0,
      streak: p.streak || 0, learned: p.learned || 0, rounds: p.rounds || 0, me: p.id === id, seen: p.updated || 0
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

// POST /api/sync {initData, stats?, ref?} -> {ok, me, friends, invite}
async function onSync(request, env) {
  let body;
  try { const raw = await request.text(); if (raw.length > 8192) return json({ ok: false, error: "too big" }, 413); body = JSON.parse(raw); }
  catch (e) { return json({ ok: false, error: "bad json" }, 400); }
  const user = await verifyInitData(body && body.initData, env);
  if (!user) return json({ ok: false, error: "auth" }, 401);
  if (!(await ensureSchema(env))) return json({ ok: false, error: "db" }, 503);
  if (body.stats && typeof body.stats === "object") await upsertPlayer(env, user, body.stats);
  else await ensurePlayer(env, user);
  const ref = parseRef(body.ref);
  if (ref && ref !== user.id && (await link(env, user.id, ref))) await notifyNewFriend(env, ref, user);
  return json({ ok: true, me: user.id, friends: await listFriends(env, user.id), invite: refLink(user.id) });
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
  catch (e) { return json({ ok: false, error: "bad json" }, 400); }
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

  if (m.from && m.from.id) await touchUser(env, m.from.id, null);

  const cmd = text.startsWith("/") ? text.split(" ")[0].split("@")[0].slice(1).toLowerCase() : "";
  if (cmd === "stats") return onStats(m, env);
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
    if (url.pathname === "/api/event") {
      if (request.method === "OPTIONS") return cors();
      if (request.method === "POST") return onEvent(request, env);
      return cors(405);
    }
    if (url.pathname === "/api/sync" || url.pathname === "/api/card") {
      if (request.method === "OPTIONS") return cors();
      if (request.method !== "POST") return cors(405);
      try { return url.pathname === "/api/sync" ? await onSync(request, env) : await onCard(request, env); }
      catch (e) { console.log("api error", e && e.stack); return json({ ok: false, error: "server" }, 500); }
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
        await onUpdate(await request.json(), env);
      } catch (e) {
        console.log("update error", e && e.stack);
      }
      return new Response("ok");
    }
    return new Response("Lingo Brain bot is alive 🧠");
  }
};
