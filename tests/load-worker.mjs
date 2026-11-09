// bot/worker.js is an ES module with a .js extension and no package.json, so Node would load it as CommonJS.
// Copy it to a temporary .mjs file and import that instead.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function loadWorker(tag) {
  const dst = path.join(os.tmpdir(), "lingo-worker-" + tag + "-" + process.pid + ".mjs");
  fs.copyFileSync(new URL("../bot/worker.js", import.meta.url), dst);
  try { return (await import(pathToFileURL(dst).href)).default; }
  finally { fs.unlinkSync(dst); }
}
