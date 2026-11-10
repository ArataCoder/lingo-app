// v3.6 worker tests: friends/sync/referral/cards on a real SQLite (fake D1)
import { createHmac } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { loadWorker } from "./load-worker.mjs";
const W = await loadWorker("social");
const NL = String.fromCharCode(10);
const TOKEN = "123456789:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
let sent = [], photos = [], fails = 0;
globalThis.fetch = async (url, opt) => {
  if (opt.body instanceof FormData) { photos.push({ url, chat: opt.body.get("chat_id"), caption: opt.body.get("caption"), markup: JSON.parse(opt.body.get("reply_markup")), size: (await opt.body.get("photo").arrayBuffer()).byteLength }); }
  else sent.push(JSON.parse(opt.body));
  const reply = globalThis.tgReply ? globalThis.tgReply(String(url), JSON.parse(opt.body || "{}")) : null;
  return { status: 200, json: async () => reply || ({ ok: true }) };
};
function mkD1() {
  const db = new DatabaseSync(":memory:");
  const prepare = (sql) => { const o = { sql, args: [], bind: (...a) => { o.args = a; return o; },
    first: async () => db.prepare(sql).get(...o.args) ?? null,
    run: async () => { db.prepare(sql).run(...o.args); return { success: true }; },
    all: async () => ({ results: db.prepare(sql).all(...o.args) }) }; return o; };
  return { db, prepare, batch: async (sts) => { for (const s of sts) await s.run(); return []; } };
}
function initData(id, name, token) {
  const f = { auth_date: String(Math.floor(Date.now() / 1000)), query_id: "AAH", user: JSON.stringify({ id, first_name: name }) };
  const dcs = Object.keys(f).sort().map((k) => k + "=" + f[k]).join(NL);
  const secret = createHmac("sha256", "WebAppData").update(token || TOKEN).digest();
  f.hash = createHmac("sha256", secret).update(dcs).digest("hex");
  return new URLSearchParams(f).toString();
}
const ok = (name, c) => { console.log((c ? "PASS " : "FAIL ") + name); if (!c) fails++; };
const env = { BOT_TOKEN: TOKEN, WEBHOOK_SECRET: "S", SETUP_KEY: "K", DB: mkD1() };
const post = (path, body) => W.fetch(new Request("https://x.dev" + path, { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify(body) }), env);
const hook = (text, id, name) => W.fetch(new Request("https://x.dev/webhook", { method: "POST", headers: { "X-Telegram-Bot-Api-Secret-Token": "S" }, body: JSON.stringify({ message: { chat: { id, type: "private" }, from: { id, first_name: name }, text } }) }), env);

let r = await post("/api/sync", { initData: initData(777, "Aleks"), stats: { xp: 300, streak: 2, learned: 4, rounds: 6 } });
let j = await r.json();
ok("sync ok + CORS header", r.status === 200 && j.ok && r.headers.get("Access-Control-Allow-Origin") === "*");
ok("first sync: only me, week starts at 0", j.friends.length === 1 && j.friends[0].me && j.friends[0].week === 0 && j.friends[0].xp === 300);
ok("invite link is personal", j.invite === "https://t.me/LingoBrainBOT?start=ref_777");
j = await (await post("/api/sync", { initData: initData(777, "Aleks"), stats: { xp: 340, streak: 3, learned: 5, rounds: 7 } })).json();
ok("weekly XP grows with rounds (40)", j.friends[0].week === 40 && j.friends[0].streak === 3);
j = await (await post("/api/sync", { initData: initData(777, "Aleks"), stats: { xp: 100, streak: 3, learned: 5, rounds: 7 } })).json();
ok("stale device cannot lower XP", j.friends[0].xp === 340);

sent = [];
r = await post("/api/sync", { initData: initData(888, "Masha"), stats: { xp: 0, streak: 0, learned: 0, rounds: 0 }, ref: "ref_777" });
j = await r.json();
ok("referral links friends (888 sees 777)", j.friends.length === 2 && j.friends.some((f) => f.id === 777));
ok("inviter notified once", sent.length === 1 && sent[0].chat_id === 777 && sent[0].text.includes("Masha"));
sent = [];
await post("/api/sync", { initData: initData(888, "Masha"), stats: { xp: 90, streak: 1, learned: 1, rounds: 2 }, ref: "ref_777" });
ok("no duplicate notification", sent.length === 0);
j = await (await post("/api/sync", { initData: initData(777, "Aleks") })).json();
ok("777 sees 888, sorted by weekly XP", j.friends.length === 2 && j.friends[0].id === 888 && j.friends[0].week === 90 && j.friends[1].week === 40);
ok("self-referral ignored", (await (await post("/api/sync", { initData: initData(999, "Self"), ref: "ref_999" })).json()).friends.length === 1);
ok("bad signature -> 401", (await post("/api/sync", { initData: initData(777, "Aleks", "1:BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB") })).status === 401);
ok("OPTIONS preflight ok", (await W.fetch(new Request("https://x.dev/api/sync", { method: "OPTIONS" }), env)).status === 204);

// /start ref_ via bot
sent = [];
await hook("/start ref_777", 555, "Dima");
ok("/start ref_777: welcome mentions friendship", sent.some((m) => m.chat_id === 555 && m.text.includes("Aleks") && m.text.includes("друзья")));
ok("/start ref_777: inviter notified", sent.some((m) => m.chat_id === 777 && m.text.includes("Dima")));
j = await (await post("/api/sync", { initData: initData(777, "Aleks") })).json();
ok("777 now has 2 friends", j.friends.length === 3);
sent = [];
await hook("/start", 556, "Plain");
ok("plain /start still works", sent.length === 1 && sent[0].text.includes("Lingo Brain"));

// week rollover
env.DB.db.prepare("UPDATE players SET week_key = '1' WHERE id = 777").run();
j = await (await post("/api/sync", { initData: initData(777, "Aleks"), stats: { xp: 400, streak: 4, learned: 6, rounds: 8 } })).json();
ok("new week: counter restarts (60)", j.friends.find((f) => f.me).week === 60);

// player card
const jpg = new Uint8Array(5000); jpg[0] = 0xFF; jpg[1] = 0xD8; for (let i = 2; i < jpg.length; i++) jpg[i] = i % 251;
const b64 = Buffer.from(jpg).toString("base64");
r = await post("/api/card", { initData: initData(777, "Aleks"), image: "data:image/jpeg;base64," + b64, send: true });
j = await r.json();
ok("card stored + sent to chat", j.ok && j.sent && /^https:[/][/]x[.]dev[/]card[/][0-9a-f]{24}[.]jpg$/.test(j.url));
ok("sendPhoto to user with ref button", photos.length === 1 && photos[0].chat === "777" && photos[0].size === 5000 && photos[0].markup.inline_keyboard[0][0].url.endsWith("ref_777"));
const g = await W.fetch(new Request(j.url), env);
const gb = new Uint8Array(await g.arrayBuffer());
ok("public card URL serves the jpeg", g.status === 200 && g.headers.get("content-type") === "image/jpeg" && gb.length === 5000 && gb[4999] === jpg[4999]);
ok("unknown card -> 404", (await W.fetch(new Request("https://x.dev/card/000000000000000000000000.jpg"), env)).status === 404);
ok("non-jpeg rejected", (await post("/api/card", { initData: initData(777, "Aleks"), image: Buffer.from("hello world".repeat(200)).toString("base64") })).status === 400);
// old routes still alive
ok("/api/event still 204", (await post("/api/event", { initData: initData(777, "Aleks"), event: "app_opened" })).status === 204);
ok("root alive", (await (await W.fetch(new Request("https://x.dev/"), env)).text()).includes("alive"));
const health = async (q) => (await W.fetch(new Request("https://x.dev/api/health" + q), env)).json();
ok("health without key hides details", JSON.stringify(await health("")) === '{"ok":true}');
ok("health with wrong key hides details", JSON.stringify(await health("?key=nope")) === '{"ok":true}');
ok("health with SETUP_KEY shows diagnostics", (await health("?key=K")).players >= 1);

// v6.2 premium groundwork (PREMIUM.enabled = false in the code)
const upd = (u) => W.fetch(new Request("https://x.dev/webhook", { method: "POST", headers: { "X-Telegram-Bot-Api-Secret-Token": "S" }, body: JSON.stringify(u) }), env);
j = await (await post("/api/sync", { initData: initData(777, "Aleks") })).json();
ok("sync reports premium off", j.premium && j.premium.enabled === false && j.premium.active === false);
r = await post("/api/invoice", { initData: initData(777, "Aleks") });
ok("invoice disabled -> 404", r.status === 404 && (await r.json()).error === "disabled");
sent = [];
await upd({ update_id: 1, pre_checkout_query: { id: "q1", from: { id: 777 }, currency: "XTR", total_amount: 150, invoice_payload: "premium:777" } });
ok("pre-checkout declined while disabled", sent.length === 1 && sent[0].pre_checkout_query_id === "q1" && sent[0].ok === false && !!sent[0].error_message);
const until = Math.floor(Date.now() / 1000) + 2592000;
sent = [];
await upd({ update_id: 2, message: { message_id: 5, chat: { id: 777, type: "private" }, from: { id: 777, first_name: "Aleks" },
  successful_payment: { currency: "XTR", total_amount: 150, invoice_payload: "premium:777", telegram_payment_charge_id: "ch_1", subscription_expiration_date: until, is_recurring: true, is_first_recurring: true } } });
j = await (await post("/api/sync", { initData: initData(777, "Aleks") })).json();
ok("successful payment activates premium", j.premium.active === true && j.premium.until === until);
ok("payment thanks sent", sent.some((m) => m.chat_id === 777 && /Плюс/.test(m.text)));
sent = [];
await upd({ update_id: 3, message: { message_id: 6, chat: { id: 777, type: "private" }, from: { id: 777, first_name: "Aleks" },
  successful_payment: { currency: "XTR", total_amount: 150, invoice_payload: "premium:777", telegram_payment_charge_id: "ch_1", is_recurring: true, is_first_recurring: true } } });
j = await (await post("/api/sync", { initData: initData(777, "Aleks") })).json();
ok("duplicate payment update is stored once and does not double-extend or re-send thanks",
  env.DB.db.prepare("SELECT COUNT(*) AS n, SUM(refunded) AS rf FROM payments").get().n === 1 &&
  env.DB.db.prepare("SELECT refunded FROM payments WHERE charge_id = 'ch_1'").get().refunded === 0 &&
  j.premium.until === until && j.friends.find((f) => f.me).plus === true && sent.length === 0);
await upd({ update_id: 4, message: { message_id: 7, chat: { id: 777, type: "private" }, from: { id: 777, first_name: "Aleks" },
  successful_payment: { currency: "XTR", total_amount: 150, invoice_payload: "premium:777", telegram_payment_charge_id: "ch_2", subscription_expiration_date: until + 2592000, is_recurring: true } } });
j = await (await post("/api/sync", { initData: initData(777, "Aleks") })).json();
ok("renewal extends premium", j.premium.until === until + 2592000);
await upd({ update_id: 41, message: { message_id: 71, chat: { id: 777, type: "private" }, from: { id: 777, first_name: "Aleks" },
  refunded_payment: { currency: "XTR", total_amount: 150, invoice_payload: "premium:777", telegram_payment_charge_id: "ch_2" } } });
j = await (await post("/api/sync", { initData: initData(777, "Aleks") })).json();
ok("refunded_payment marks payment refunded and revokes active sub",
  env.DB.db.prepare("SELECT refunded FROM payments WHERE charge_id = 'ch_2'").get().refunded === 1 && j.premium.active === false);
const brokenEnv = { ...env, DB: { prepare: () => ({ bind: () => ({ first: async () => { throw new Error("D1 down"); } }) }), batch: async () => { throw new Error("D1 down"); } } };
const failRes = await W.fetch(new Request("https://x.dev/webhook", { method: "POST", headers: { "X-Telegram-Bot-Api-Secret-Token": "S" },
  body: JSON.stringify({ update_id: 42, message: { message_id: 72, chat: { id: 777, type: "private" }, from: { id: 777 }, successful_payment: { telegram_payment_charge_id: "ch_fail", total_amount: 150 } } }) }), brokenEnv);
ok("webhook returns 500 when DB fails during payment so Telegram retries", failRes.status === 500);
sent = []; await hook("/paysupport", 777, "Aleks");
ok("/paysupport answers", sent.length === 1 && /оплат/.test(sent[0].text));
env.ADMIN_CHAT_ID = "777";
sent = []; await hook("/gift", 777, "Aleks");
j = await (await post("/api/sync", { initData: initData(777, "Aleks") })).json();
ok("admin /gift activates free 30-day Plus cosmetics", j.premium.active === true && j.friends.find((f) => f.me).plus === true);
sent = []; await hook("/gift off", 777, "Aleks");
j = await (await post("/api/sync", { initData: initData(777, "Aleks") })).json();
ok("admin /gift off disables test Plus", j.premium.active === false);

// Same worker with PREMIUM.enabled = true
const WP = await loadWorker("premium-on", (s) => s.replace("  enabled: false,", "  enabled: true,"));
const postP = (path, body) => WP.fetch(new Request("https://x.dev" + path, { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify(body) }), env);
const updP = (u) => WP.fetch(new Request("https://x.dev/webhook", { method: "POST", headers: { "X-Telegram-Bot-Api-Secret-Token": "S" }, body: JSON.stringify(u) }), env);
sent = [];
r = await postP("/api/invoice", { initData: initData(777, "Aleks") });
const inv = sent.find((m) => m.currency === "XTR");
ok("enabled: invoice link requested as a 30-day Stars subscription", r.status === 200 && inv && inv.subscription_period === 2592000 && inv.provider_token === "" && inv.prices.length === 1 && inv.payload === "premium:777");
ok("enabled: invoice needs auth", (await postP("/api/invoice", { initData: "x" })).status === 401);
sent = [];
await updP({ update_id: 5, pre_checkout_query: { id: "q2", from: { id: 777 }, currency: "XTR", total_amount: inv.prices[0].amount, invoice_payload: "premium:777" } });
ok("enabled: valid pre-checkout approved", sent.length === 1 && sent[0].ok === true);
sent = [];
await updP({ update_id: 6, pre_checkout_query: { id: "q3", from: { id: 778 }, currency: "XTR", total_amount: inv.prices[0].amount, invoice_payload: "premium:777" } });
ok("enabled: someone else's payload declined", sent.length === 1 && sent[0].ok === false);
sent = [];
await updP({ update_id: 7, pre_checkout_query: { id: "q4", from: { id: 777 }, currency: "XTR", total_amount: 1, invoice_payload: "premium:777" } });
ok("enabled: wrong amount declined", sent.length === 1 && sent[0].ok === false);

// v6.3 daily reminders
const db = env.DB.db, nowS = () => Math.floor(Date.now() / 1000), hourUtc = new Date().getUTCHours();
const cron = () => W.scheduled({ cron: "0 * * * *" }, env, null);
const toUser = (id) => sent.filter((m) => m.chat_id === id && typeof m.text === "string");
db.prepare("UPDATE users SET last_seen = 0").run(); // earlier test users must not get reminders
for (const [id, name] of [[901, "Ana"], [902, "Bo"], [903, "Cy"], [904, "Di"], [905, "Ed"]]) await hook("/start", id, name);
const setRemind = (id, hour, extra) => db.prepare("INSERT INTO remind (user_id, hour, tz) VALUES (?, ?, 0) ON CONFLICT(user_id) DO UPDATE SET hour = excluded.hour, tz = 0").run(id, hour);
[901, 902, 903, 905].forEach((id) => setRemind(id, hourUtc));
setRemind(904, (hourUtc + 5) % 24);
await post("/api/event", { initData: initData(902, "Bo"), event: "round_completed", xp: 30 });            // 902 already practised today
db.prepare("INSERT INTO players (id, name, streak) VALUES (905, 'Ed', 5) ON CONFLICT(id) DO UPDATE SET streak = 5").run();
globalThis.tgReply = (url, b) => (url.endsWith("/sendMessage") && b.chat_id === 903) ? { ok: false, error_code: 403, description: "Forbidden: bot was blocked by the user" } : null;
const rnd = Math.random; Math.random = () => 0; // first text of each pool
sent = [];
await cron();
const hookCfg = sent.find((m) => Array.isArray(m.allowed_updates));
ok("cron syncs webhook updates (callback_query) and command menu", hookCfg && hookCfg.allowed_updates.includes("callback_query") && hookCfg.url.endsWith("/webhook") && hookCfg.secret_token === "S"
  && sent.some((m) => Array.isArray(m.commands) && m.commands.some((c) => c.command === "remind")));
ok("reminder sent at the user's hour with an app button (no app profile yet -> \"друг\")", toUser(901).length === 1 && /^друг, 2 минуты/.test(toUser(901)[0].text) && toUser(901)[0].reply_markup.inline_keyboard[0][0].web_app);
ok("no reminder after a round today", toUser(902).length === 0);
ok("no reminder at another hour", toUser(904).length === 0);
ok("streak text uses the streak", toUser(905).length === 1 && /Серия 5/.test(toUser(905)[0].text));
ok("blocked user is marked and skipped later", db.prepare("SELECT blocked FROM remind WHERE user_id = 903").get().blocked === 1);
sent = []; await cron();
ok("at most one reminder a day", toUser(901).length === 0 && toUser(905).length === 0 && toUser(903).length === 0);
ok("bot config synced only once", !sent.some((m) => Array.isArray(m.allowed_updates)));
db.prepare("UPDATE remind SET last_sent = NULL, last_round = ? WHERE user_id = 901").run(nowS() - 3 * 86400);
sent = []; await cron();
ok("after 3 idle days the gentle comeback text is used", toUser(901).length === 1 && /Скучаю/.test(toUser(901)[0].text));
Math.random = rnd; globalThis.tgReply = null;
const cb = (id, data) => W.fetch(new Request("https://x.dev/webhook", { method: "POST", headers: { "X-Telegram-Bot-Api-Secret-Token": "S" },
  body: JSON.stringify({ callback_query: { id: "cb" + data, from: { id, first_name: "Ana" }, data, message: { message_id: 9, chat: { id } } } }) }), env);
sent = []; await hook("/remind", 901, "Ana");
ok("/remind shows hour buttons", toUser(901).length === 1 && toUser(901)[0].reply_markup.inline_keyboard[0].length === 4);
sent = []; await cb(901, "rm:21");
const r901 = db.prepare("SELECT enabled, hour FROM remind WHERE user_id = 901").get();
ok("choosing 21:00 saves it and edits the menu", r901.enabled === 1 && r901.hour === 21 && sent.some((m) => m.message_id === 9 && /21:00/.test(m.text)) && sent.some((m) => m.callback_query_id === "cbrm:21"));
await cb(901, "rm:off");
ok("turning reminders off", db.prepare("SELECT enabled FROM remind WHERE user_id = 901").get().enabled === 0);
setRemind(901, hourUtc); db.prepare("UPDATE remind SET last_sent = NULL, last_round = NULL WHERE user_id = 901").run();
sent = []; await cron();
ok("disabled user gets nothing", toUser(901).length === 0);
sent = []; await cb(901, "rm:test");
ok("example reminder on request", toUser(901).length === 1 && toUser(901)[0].reply_markup.inline_keyboard[0][0].web_app);
ok("unknown hour ignored", (await cb(901, "rm:7"), db.prepare("SELECT hour FROM remind WHERE user_id = 901").get().hour === hourUtc));
await post("/api/sync", { initData: initData(901, "Ana"), tz: 120 });
ok("app reports the time zone", db.prepare("SELECT tz FROM remind WHERE user_id = 901").get().tz === 120);
await post("/api/sync", { initData: initData(901, "Ana"), tz: null });
ok("missing tz keeps the stored one", db.prepare("SELECT tz FROM remind WHERE user_id = 901").get().tz === 120);
console.log(fails ? "WORKER TESTS FAILED: " + fails : "WORKER TESTS ALL PASSED");
process.exit(fails ? 1 : 0);
