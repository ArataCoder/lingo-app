#!/usr/bin/env node
// Safe Cloudflare Worker deployment script for lingo-brain-bot and lingo-brain-app.
// Preserves D1 binding and all secrets via keep_bindings.
const fs = require("node:fs");
const path = require("node:path");

const ACC = "6744b480c4663e86edadcfff8ecbeed3";
const D1_ID = "a6acc254-9562-4724-b94b-f9a8f448a521";
const TOKEN = (process.env.CF_API_TOKEN || "").trim();
const API = "https://api.cloudflare.com/client/v4/accounts/" + ACC + "/workers/scripts";

if (!TOKEN) {
  console.log("CF_API_TOKEN is not set — skipping Cloudflare deploy.");
  process.exit(0);
}

async function deployBot() {
  const code = fs.readFileSync("bot/worker.js", "utf8");
  const meta = {
    main_module: "worker.js",
    compatibility_date: "2026-11-01",
    bindings: [{ type: "d1", name: "DB", id: D1_ID }],
    keep_bindings: ["secret_text", "plain_text", "d1"]
  };
  const fd = new FormData();
  fd.append("metadata", new Blob([JSON.stringify(meta)], { type: "application/json" }));
  fd.append("worker.js", new Blob([code], { type: "application/javascript+module" }), "worker.js");
  const r = await fetch(API + "/lingo-brain-bot", {
    method: "PUT",
    headers: { Authorization: "Bearer " + TOKEN },
    body: fd
  });
  const j = await r.json();
  if (!j.success) throw new Error("Bot deploy failed: " + JSON.stringify(j.errors));
  console.log("Deployed lingo-brain-bot (all secrets & D1 preserved)");
}

async function deployApp() {
  const F = {};
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name).replace(/\\/g, "/");
      if (ent.isDirectory()) walk(p);
      else if (/\.(html|css|js|json)$/.test(p)) F["/" + p] = fs.readFileSync(p, "utf8");
    }
  };
  F["/index.html"] = fs.readFileSync("index.html", "utf8");
  walk("css");
  walk("js");
  walk("content");

  const build = "v6.4-" + new Date().toISOString();
  const appWorkerCode = [
    "const F = " + JSON.stringify(F) + ";",
    "const BUILD = " + JSON.stringify(build) + ";",
    'const GH_PAGES = "https://aratacoder.github.io/lingo-app";',
    'const GH_RAW = "https://raw.githubusercontent.com/ArataCoder/lingo-app/main";',
    'const MIME = { html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "application/javascript; charset=utf-8", json: "application/json; charset=utf-8", mp3: "audio/mpeg", webp: "image/webp", png: "image/png", jpg: "image/jpeg", gif: "image/gif", mp4: "video/mp4", svg: "image/svg+xml" };',
    "export default {",
    "  async fetch(req) {",
    "    const u = new URL(req.url);",
    "    let p = u.pathname;",
    '    if (p === "/" || p === "") p = "/index.html";',
    '    if (p === "/__build") {',
    '      return new Response(JSON.stringify({ build: BUILD, files: Object.keys(F).length, mode: "inline" }), {',
    '        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" }',
    "      });",
    "    }",
    "    if (Object.prototype.hasOwnProperty.call(F, p)) {",
    '      const ext = p.split(".").pop().toLowerCase();',
    '      const isHtml = ext === "html";',
    '      const isJson = ext === "json";',
    '      const hasV = u.searchParams.has("v");',
    '      const cc = isHtml ? "no-cache" : isJson ? "public, max-age=300" : hasV ? "public, max-age=31536000, immutable" : "public, max-age=600, stale-while-revalidate=86400";',
    "      return new Response(F[p], {",
    "        headers: {",
    '          "content-type": MIME[ext] || "text/plain; charset=utf-8",',
    '          "cache-control": cc,',
    '          "access-control-allow-origin": "*"',
    "        }",
    "      });",
    "    }",
    '    if (p.startsWith("/assets/")) {',
    '      const ext = p.split(".").pop().toLowerCase();',
    "      let r = await fetch(GH_PAGES + p, { cf: { cacheTtl: 86400, cacheEverything: true } });",
    "      if (!r.ok) r = await fetch(GH_RAW + p, { cf: { cacheTtl: 86400, cacheEverything: true } });",
    "      if (r.ok) {",
    "        return new Response(r.body, {",
    "          status: 200,",
    "          headers: {",
    '            "content-type": MIME[ext] || r.headers.get("content-type") || "application/octet-stream",',
    '            "cache-control": "public, max-age=86400",',
    '            "access-control-allow-origin": "*"',
    "          }",
    "        });",
    "      }",
    "    }",
    '    return new Response("Not found", { status: 404 });',
    "  }",
    "};"
  ].join("\n");

  const fd = new FormData();
  fd.append("metadata", new Blob([JSON.stringify({ main_module: "worker.js", compatibility_date: "2026-11-01", keep_bindings: ["secret_text", "plain_text"] })], { type: "application/json" }));
  fd.append("worker.js", new Blob([appWorkerCode], { type: "application/javascript+module" }), "worker.js");
  const r = await fetch(API + "/lingo-brain-app", {
    method: "PUT",
    headers: { Authorization: "Bearer " + TOKEN },
    body: fd
  });
  const j = await r.json();
  if (!j.success) throw new Error("App deploy failed: " + JSON.stringify(j.errors));
  console.log("Deployed lingo-brain-app:", build, "files:", Object.keys(F).length);
}

(async () => {
  await deployBot();
  await deployApp();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
