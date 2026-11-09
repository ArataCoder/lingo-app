#!/usr/bin/env python3
"""Lingo Brain: neural voice-over with edge-tts (free Microsoft Edge voices).

Usage (locally or in GitHub Actions):
    pip install edge-tts
    python generate_audio.py               # every phrase from content/catalog.json (+ surprise.json)
    python generate_audio.py --limit 20    # quick test run
    python generate_audio.py --dry-run     # only count, no network
    python generate_audio.py --check       # CI: validate manifest vs files, no network
    python generate_audio.py --prune       # also delete mp3 files nobody references

Output: assets/audio/<lang>/<hash>.mp3 + assets/audio/manifest.json
    {"version": 2, "voices": {...}, "count": N, "items": {"es|hola que tal": "es/1a2b3c4d5e6f.mp3"}}
The key format is the same as aKey() in js/engine.js, so the app finds an mp3 by the phrase text.
Anything missing is spoken by the phone voice (speechSynthesis fallback).

The script is incremental and idempotent: file name = sha1(key|voice), so existing files are
skipped and changing a voice re-voices only that language. Until a new mp3 exists, the old one
stays in the manifest as a fallback.

Note: edge-tts uses the unofficial Edge read-aloud service. It may stop working; for a personal
learning project that is fine. Plan B is a local Piper voice with the same manifest format.
"""
import argparse, asyncio, hashlib, json, os, re, sys, unicodedata

VOICES = {"es": "es-ES-AlvaroNeural", "en": "en-US-GuyNeural"}
# Voices of the oldest files (name = sha1(key)). Any other voice: name = sha1(key|voice).
LEGACY_VOICES = {"es": "es-ES-ElviraNeural", "en": "en-US-AriaNeural"}
SPOKEN_KEYS = {"term", "ex", "front", "text", "say", "phrase", "target"}
CYR = re.compile("[\u0400-\u04ff]")
TAG = re.compile("<[^>]*>")
WORD = re.compile(r"[^\W_]+", re.UNICODE)
EMOJI = re.compile("[\U0001F000-\U0001FAFF\u2600-\u27BF\uFE0F]")


def clean(text):
    return " ".join(EMOJI.sub(" ", TAG.sub(" ", str(text))).split())


def akey(lang, text):
    """Same key as aKey() in js/engine.js: lang|lower-case words separated by one space."""
    t = unicodedata.normalize("NFC", TAG.sub(" ", str(text))).lower()
    return lang[:2].lower() + "|" + " ".join(WORD.findall(t))


def add(out, lg, text):
    t = clean(text)
    if not t or len(t) > 300 or CYR.search(t) or lg not in VOICES:
        return
    key = akey(lg, t)
    if key.split("|", 1)[1]:
        out.setdefault(key, (lg, t))


def collect(node, lang, out):
    if isinstance(node, list):
        for x in node:
            collect(x, lang, out)
        return
    if not isinstance(node, dict):
        return
    lg = str(node.get("lang") or lang)[:2].lower()
    for k, v in node.items():
        if isinstance(v, (dict, list)):
            collect(v, lg, out)
        elif k in SPOKEN_KEYS and isinstance(v, str):
            add(out, lg, v)
    # a phrase built from pieces is spoken as a whole
    toks = node.get("tokens") or node.get("answer")
    if isinstance(toks, list) and toks and all(isinstance(x, str) for x in toks):
        add(out, lg, " ".join(toks))


def load_items(root):
    cat = json.load(open(os.path.join(root, "content", "catalog.json"), encoding="utf-8"))
    items, missing = {}, []
    for tr in cat.get("tracks", []):
        for b in tr.get("blocks", []):
            for tp in b.get("topics", []):
                if tp.get("status") != "ready" or not tp.get("file"):
                    continue
                path = os.path.join(root, "content", tp["file"])
                if not os.path.exists(path):
                    path = os.path.join(root, tp["file"])
                if os.path.exists(path):
                    collect(json.load(open(path, encoding="utf-8")), tr["id"], items)
                else:
                    missing.append(tp["file"])
    sp = os.path.join(root, "content", "surprise.json")
    if os.path.exists(sp):
        collect(json.load(open(sp, encoding="utf-8")), "es", items)
    return items, missing


def rel_for(key, lg):
    hk = key if VOICES[lg] == LEGACY_VOICES.get(lg) else key + "|" + VOICES[lg]
    return lg + "/" + hashlib.sha1(hk.encode("utf-8")).hexdigest()[:12] + ".mp3"


def good(path):
    return os.path.exists(path) and os.path.getsize(path) > 500


def check(root, items, missing):
    """CI mode: no network. Fails only on real breakage (bad JSON, dangling paths)."""
    man_path = os.path.join(root, "assets", "audio", "manifest.json")
    problems = ["topic file missing: " + m for m in missing]
    try:
        man = json.load(open(man_path, encoding="utf-8"))
        assert isinstance(man.get("items"), dict)
    except Exception as e:
        print("manifest invalid:", e)
        return 1
    have_files = os.path.isdir(os.path.join(root, "assets", "audio", "es")) or os.path.isdir(os.path.join(root, "assets", "audio", "en"))
    dangling = [k for k, v in man["items"].items() if have_files and not good(os.path.join(root, "assets", "audio", v))]
    covered = sum(1 for k in items if k in man["items"])
    new_voice = sum(1 for k, (lg, _) in items.items() if man["items"].get(k) == rel_for(k, lg))
    print("phrases: %d, in manifest: %d (%.0f%%), already in the new voice: %d" % (len(items), covered, 100.0 * covered / max(1, len(items)), new_voice))
    if dangling:
        problems.append("%d manifest entries point to missing mp3, e.g. %s" % (len(dangling), dangling[0]))
    for p in problems:
        print("ERROR:", p)
    return 1 if problems else 0


def save(path, manifest, items):
    # drop entries for phrases that are no longer in the content
    manifest["items"] = {k: v for k, v in sorted(manifest["items"].items()) if k in items}
    manifest["version"] = 2
    manifest["voices"] = dict(VOICES)
    manifest["count"] = len(manifest["items"])
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=0, sort_keys=True)
    os.replace(tmp, path)  # atomic: the app never sees a half-written manifest
    print("manifest:", manifest["count"], "entries ->", path)


def prune(out_dir, manifest):
    used = set(manifest["items"].values())
    n = 0
    for lg in ("es", "en"):
        d = os.path.join(out_dir, lg)
        if not os.path.isdir(d):
            continue
        for f in os.listdir(d):
            if f.endswith(".mp3") and lg + "/" + f not in used:
                os.remove(os.path.join(d, f))
                n += 1
    print("pruned old mp3:", n)


def main():
    ap = argparse.ArgumentParser(description="Generate mp3 voice-over for Lingo Brain")
    ap.add_argument("--root", default=os.path.dirname(os.path.abspath(__file__)))
    ap.add_argument("--voice-es", default=VOICES["es"])
    ap.add_argument("--voice-en", default=VOICES["en"])
    ap.add_argument("--rate", default="-5%", help="speed, e.g. -10%% (slower) or +0%%")
    ap.add_argument("--lang", choices=["es", "en"], help="only one language")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--concurrency", type=int, default=4)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--prune", action="store_true")
    a = ap.parse_args()
    VOICES["es"], VOICES["en"] = a.voice_es, a.voice_en

    root = a.root
    items, missing = load_items(root)
    if a.check:
        sys.exit(check(root, items, missing))

    out_dir = os.path.join(root, "assets", "audio")
    man_path = os.path.join(out_dir, "manifest.json")
    manifest = {"version": 2, "items": {}}
    if os.path.exists(man_path):
        try:
            manifest = json.load(open(man_path, encoding="utf-8"))
        except Exception:
            pass
    manifest.setdefault("items", {})

    todo = []
    for key, (lg, text) in sorted(items.items()):
        if a.lang and lg != a.lang:
            continue
        rel = rel_for(key, lg)
        full = os.path.join(out_dir, rel)
        if good(full):
            manifest["items"][key] = rel
        else:
            todo.append((key, lg, text, rel, full))
    if a.limit:
        todo = todo[: a.limit]
    print("voices: %s | phrases: %d, to generate: %d" % (VOICES, len(items), len(todo)))
    if a.dry_run or not todo:
        save(man_path, manifest, items)
        if a.prune and not a.dry_run:
            prune(out_dir, manifest)
        return

    try:
        import edge_tts
    except ImportError:
        sys.exit("Missing library: pip install edge-tts")

    sem = asyncio.Semaphore(max(1, a.concurrency))
    stats = {"ok": 0, "fail": 0}

    async def one(key, lg, text, rel, full):
        async with sem:
            os.makedirs(os.path.dirname(full), exist_ok=True)
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(text, VOICES[lg], rate=a.rate).save(full)
                    if good(full):
                        manifest["items"][key] = rel
                        stats["ok"] += 1
                        if stats["ok"] % 200 == 0:
                            save(man_path, manifest, items)  # checkpoint: progress survives a crash
                        return
                except Exception:
                    pass
                await asyncio.sleep(1.5 * (attempt + 1))
            stats["fail"] += 1
            if os.path.exists(full):
                os.remove(full)
            print("  failed:", text[:60])

    async def run():
        await asyncio.gather(*[one(*t) for t in todo])

    asyncio.run(run())
    save(man_path, manifest, items)
    if a.prune and stats["fail"] == 0:
        prune(out_dir, manifest)
    print("done: +%d mp3, failed: %d" % (stats["ok"], stats["fail"]))
    if todo and stats["ok"] == 0:
        sys.exit("edge-tts produced nothing: the service may be down, try again later")


if __name__ == "__main__":
    main()
