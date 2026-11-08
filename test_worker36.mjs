// v3.6 worker tests: friends/sync/referral/cards on a real SQLite (fake D1)
import { createHmac } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
fs.copyFileSync("/data/lr34/bot/worker.js", "/tmp/_w36.mjs");
const W = (await import("/tmp/_w36.mjs")).default;
const NL = String.fromCharCode(10);
const TOKEN = "123456789:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
let sent = [], photos = [], fails = 0;
globalThis.fetch = async (url, opt) => {
  if (opt.body instanceof FormData) { photos.push({ url, chat: opt.body.get("chat_id"), caption: opt.body.get("caption"), markup: JSON.parse(opt.body.get("reply_markup")), size: (await opt.body.get("photo").arrayBuffer()).byteLength }); }
  else sent.push(JSON.parse(opt.body));
  return { status: 200, json: async () => ({ ok: true }) };
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
ok("sync ok + CORS header", r.status === 200 && j.ok && r.headers.get("Access-Control-Allow-Origin") === "https://aratacoder.github.io");
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
console.log(fails ? "WORKER TESTS FAILED: " + fails : "WORKER TESTS ALL PASSED");
process.exit(fails ? 1 : 0);
