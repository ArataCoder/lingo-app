import { createHmac } from "node:crypto";
import fs from "node:fs";
fs.copyFileSync("/data/lingo_release/bot/worker.js", "/data/lingo_release/bot/_w.mjs");
const W = (await import("/data/lingo_release/bot/_w.mjs")).default;
const NL = String.fromCharCode(10);
const TOKEN = "123456789:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
let sent = [], tgMode = "ok", fails = 0;
globalThis.fetch = async (url, opt) => {
  if (tgMode === "throw") throw new Error("network down");
  sent.push(JSON.parse(opt.body));
  return { status: 200, json: async () => ({ ok: true }) };
};
function mkDB(mode) {
  const log = [];
  const st = (sql) => ({ sql, bind: (...a) => ({
    first: async () => { if (mode === "throw") throw new Error("D1 down"); log.push(sql); return sql.includes("GROUP BY") ? { track: "es", n: 4 } : { n: 3, xp: 120 }; },
    run: async () => { if (mode === "throw") throw new Error("D1 down"); log.push(sql); return { success: true }; }
  }) });
  return { log, prepare: st, batch: async () => { if (mode === "batchthrow") throw new Error("batch"); return []; } };
}
function initData(token, age) {
  const f = { auth_date: String(Math.floor(Date.now() / 1000) - (age || 0)), query_id: "AAH", user: JSON.stringify({ id: 777, first_name: "A" }) };
  const dcs = Object.keys(f).sort().map((k) => k + "=" + f[k]).join(NL);
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  f.hash = createHmac("sha256", secret).update(dcs).digest("hex");
  return new URLSearchParams(f).toString();
}
const ev = (env, body) => W.fetch(new Request("https://x.dev/api/event", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify(body) }), env);
const hook = (env, text, fromId) => W.fetch(new Request("https://x.dev/webhook", { method: "POST", headers: { "X-Telegram-Bot-Api-Secret-Token": "S" }, body: JSON.stringify({ message: { chat: { id: fromId, type: "private" }, from: { id: fromId, first_name: "A" }, text } }) }), env);
const ok = (name, c) => { console.log((c ? "PASS " : "FAIL ") + name); if (!c) fails++; };
const base = { BOT_TOKEN: TOKEN, WEBHOOK_SECRET: "S", ADMIN_CHAT_ID: "777" };

let db = mkDB(), env = { ...base, DB: db };
let r = await ev(env, { initData: initData(TOKEN), event: "round_completed", track: "es", xp: 55 });
ok("valid event 204", r.status === 204 && r.headers.get("Access-Control-Allow-Origin") === "https://aratacoder.github.io");
ok("valid event inserted", db.log.some((s) => s.startsWith("INSERT INTO events")) && db.log.some((s) => s.startsWith("INSERT INTO users")));
db.log.length = 0;
r = await ev(env, { initData: initData("999:WRONGTOKENWRONGTOKENWRONGTOKEN12345"), event: "app_opened" });
ok("forged initData ignored", r.status === 204 && db.log.length === 0);
r = await ev(env, { initData: initData(TOKEN, 8 * 86400), event: "app_opened" });
ok("stale initData ignored", db.log.length === 0);
r = await ev(env, { initData: initData(TOKEN), event: "drop_table" });
ok("unknown event ignored", db.log.length === 0);
r = await W.fetch(new Request("https://x.dev/api/event", { method: "POST", body: "not json{" }), env);
ok("garbage body 204", r.status === 204);
r = await W.fetch(new Request("https://x.dev/api/event", { method: "OPTIONS" }), env);
ok("OPTIONS preflight", r.status === 204 && r.headers.get("Access-Control-Allow-Methods").includes("POST"));

sent = []; await hook(env, "/stats", 777);
const st = sent.find((b) => (b.text || "").includes("Всего юзеров"));
ok("admin /stats", !!st && st.text.includes("DAU") && st.text.includes("Испанский") && st.text.includes("Раундов"));
sent = []; await hook(env, "/stats", 555);
ok("non-admin /stats hidden", sent.length === 1 && !sent[0].text.includes("юзеров"));
sent = []; await hook({ ...base, ADMIN_CHAT_ID: "", DB: db }, "/stats", 555);
ok("unset admin shows own id", sent[0] && sent[0].text.includes("555"));
sent = []; await hook({ ...base }, "/stats", 777);
ok("no DB binding", sent[0] && sent[0].text.includes("База не подключена"));
sent = []; r = await hook({ ...base, DB: mkDB("throw") }, "/stats", 777);
ok("D1 throwing: still replies", (await r.text()) === "ok" && sent[0] && sent[0].text.includes("Часть запросов"));
r = await ev({ ...base, DB: mkDB("throw") }, { initData: initData(TOKEN), event: "app_opened" });
ok("D1 throwing: event 204", r.status === 204);
tgMode = "throw"; r = await hook(env, "/start", 777);
ok("Telegram down: webhook ok", (await r.text()) === "ok");
tgMode = "ok";
sent = []; await hook(env, "/start", 1);
ok("/start keyboard v7", JSON.stringify(sent[0]).includes("lingo-app/?v=7"));
r = await hook({ ...base, WEBHOOK_SECRET: "other" }, "/start", 1);
ok("bad webhook secret 403", r.status === 403);
fs.unlinkSync("/data/lingo_release/bot/_w.mjs");
console.log(fails ? "FAILED " + fails : "ALL WORKER TESTS PASSED");
process.exit(fails ? 1 : 0);
