// bot/worker.js is an ES module with a .js extension and no package.json, so Node would load it as CommonJS.
// Copy it to a temporary .mjs file and import that instead. `patch` can rewrite the source (e.g. flip a flag).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function loadWorker(tag, patch) {
  const dst = path.join(os.tmpdir(), "lingo-worker-" + tag + "-" + process.pid + ".mjs");
  let src = fs.readFileSync(new URL("../bot/worker.js", import.meta.url), "utf8");
  if (patch) { const out = patch(src); if (out === src) throw new Error("patch did not change the worker"); src = out; }
  fs.writeFileSync(dst, src);
  try { return (await import(pathToFileURL(dst).href)).default; }
  finally { fs.unlinkSync(dst); }
}
