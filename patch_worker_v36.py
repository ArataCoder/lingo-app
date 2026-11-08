# v3.6 worker: friends leaderboard (/api/sync), referral /start ref_<id>, player cards (/api/card, /card/<id>.jpg)
p = '/data/lr34/bot/worker.js'
s = open(p, encoding='utf-8').read()

def rep(old, new, tag):
    global s
    assert s.count(old) == 1, 'marker not unique/missing: ' + tag
    s = s.replace(old, new)

rep('const APP_URL = "https://aratacoder.github.io/lingo-app/?v=7";', 'const APP_URL = "https://aratacoder.github.io/lingo-app/?v=11";\nconst BOT_USERNAME = "LingoBrainBOT";', 'appurl')

rep('      env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_events_event_ts ON events(event, ts)")', '''      env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_events_event_ts ON events(event, ts)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY, name TEXT, username TEXT, xp INTEGER DEFAULT 0, week_key TEXT, week_base INTEGER DEFAULT 0, streak INTEGER DEFAULT 0, learned INTEGER DEFAULT 0, rounds INTEGER DEFAULT 0, updated INTEGER)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS friends (a INTEGER, b INTEGER, ts INTEGER, PRIMARY KEY (a, b))"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS cards (id TEXT PRIMARY KEY, user_id INTEGER, data TEXT, ts INTEGER)")''', 'schema')

FRIENDS = r'''
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
'''
rep('// /stats: только для ADMIN_CHAT_ID', FRIENDS + '\n// /stats: только для ADMIN_CHAT_ID', 'friends')

rep('  if (cmd === "start") return send(env, chatId, TEXT.start(name), { reply_markup: appKeyboard("🚀 Начать раунд") });', '''  if (cmd === "start") {
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
  }''', 'start')

rep('''    if (url.pathname === "/setup") {''', '''    if (url.pathname === "/api/sync" || url.pathname === "/api/card") {
      if (request.method === "OPTIONS") return cors();
      if (request.method !== "POST") return cors(405);
      try { return url.pathname === "/api/sync" ? await onSync(request, env) : await onCard(request, env); }
      catch (e) { console.log("api error", e && e.stack); return json({ ok: false, error: "server" }, 500); }
    }
    if (url.pathname.startsWith("/card/") && request.method === "GET") {
      return onCardGet(url.pathname.slice(6).replace(".jpg", ""), env);
    }
    if (url.pathname === "/setup") {''', 'routes')

open(p, 'w', encoding='utf-8').write(s)
print('worker patched', len(s.splitlines()), 'lines')
