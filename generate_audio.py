#!/usr/bin/env python3
"""Lingo Brain: живая озвучка через бесплатные нейроголоса Microsoft (edge-tts).

Запуск (локально или в GitHub Actions):
    pip install edge-tts
    python generate_audio.py               # все слова и фразы из content/catalog.json
    python generate_audio.py --limit 20    # тестовый прогон
    python generate_audio.py --dry-run     # только посчитать

Результат: assets/audio/<lang>/<hash>.mp3 + assets/audio/manifest.json.
Приложение само находит mp3 по тексту фразы; чего нет — произносит лучший голос телефона.
Скрипт инкрементальный: уже готовые файлы не перегенерируются.

Важно: edge-tts ходит в неофициальный сервис озвучки браузера Edge. Он может перестать работать,
а его коммерческое использование — серая зона. Для личного/учебного проекта — ок; если
сломается, запасной план — локальный Piper (тоже бесплатный), формат manifest.json тот же.
"""
import argparse, asyncio, hashlib, json, os, re, sys, unicodedata

VOICES = {"es": "es-ES-ElviraNeural", "en": "en-US-AriaNeural"}
SPOKEN_KEYS = {"term", "ex", "front", "text", "say", "phrase", "target"}
CYR = re.compile("[\u0400-\u04ff]")
TAG = re.compile("<[^>]*>")
WORD = re.compile(r"[^\W_]+", re.UNICODE)


def clean(text):
    return " ".join(TAG.sub(" ", str(text)).split())


def akey(lang, text):
    """Тот же ключ, что и aKey() в v3.js: язык|слова в нижнем регистре через пробел."""
    t = unicodedata.normalize("NFC", TAG.sub(" ", str(text))).lower()
    return lang[:2].lower() + "|" + " ".join(WORD.findall(t))


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
            t = clean(v)
            if t and len(t) <= 300 and not CYR.search(t) and lg in VOICES:
                key = akey(lg, t)
                if key.split("|", 1)[1]:
                    out.setdefault(key, (lg, t))
    # сборка фразы из кусочков: озвучиваем целиком
    toks = node.get("tokens") or node.get("answer")
    if isinstance(toks, list) and toks and all(isinstance(x, str) for x in toks):
        t = clean(" ".join(toks))
        if t and not CYR.search(t) and lg in VOICES:
            out.setdefault(akey(lg, t), (lg, t))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=os.path.dirname(os.path.abspath(__file__)))
    ap.add_argument("--voice-es", default=VOICES["es"])
    ap.add_argument("--voice-en", default=VOICES["en"])
    ap.add_argument("--rate", default="-5%", help="скорость, например -10% (медленнее) или +0%")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    VOICES["es"], VOICES["en"] = a.voice_es, a.voice_en

    root = a.root
    cat = json.load(open(os.path.join(root, "content", "catalog.json"), encoding="utf-8"))
    items = {}
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

    out_dir = os.path.join(root, "assets", "audio")
    man_path = os.path.join(out_dir, "manifest.json")
    manifest = {"version": 1, "items": {}}
    if os.path.exists(man_path):
        try:
            manifest = json.load(open(man_path, encoding="utf-8"))
        except Exception:
            pass

    todo = []
    for key, (lg, text) in sorted(items.items()):
        rel = lg + "/" + hashlib.sha1(key.encode("utf-8")).hexdigest()[:12] + ".mp3"
        full = os.path.join(out_dir, rel)
        if os.path.exists(full) and os.path.getsize(full) > 500:
            manifest["items"][key] = rel
        else:
            todo.append((key, lg, text, rel, full))
    if a.limit:
        todo = todo[: a.limit]
    print("фраз всего: %d, уже есть: %d, сгенерировать: %d" % (len(items), len(manifest["items"]), len(todo)))
    if a.dry_run or not todo:
        save(man_path, manifest, items)
        return

    try:
        import edge_tts
    except ImportError:
        sys.exit("Нужна библиотека: pip install edge-tts")

    sem = asyncio.Semaphore(4)
    stats = {"ok": 0, "fail": 0}

    async def one(key, lg, text, rel, full):
        async with sem:
            os.makedirs(os.path.dirname(full), exist_ok=True)
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(text, VOICES[lg], rate=a.rate).save(full)
                    if os.path.getsize(full) > 500:
                        manifest["items"][key] = rel
                        stats["ok"] += 1
                        return
                except Exception as e:
                    err = e
                await asyncio.sleep(1.5 * (attempt + 1))
            stats["fail"] += 1
            if os.path.exists(full):
                os.remove(full)
            print("  не вышло:", text[:60])

    async def run():
        await asyncio.gather(*[one(*t) for t in todo])

    asyncio.run(run())
    save(man_path, manifest, items)
    print("готово: +%d mp3, ошибок: %d" % (stats["ok"], stats["fail"]))


def save(path, manifest, items):
    # выкидываем записи для фраз, которых больше нет в контенте
    manifest["items"] = {k: v for k, v in sorted(manifest["items"].items()) if k in items}
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=0)
    print("manifest:", len(manifest["items"]), "записей →", path)


if __name__ == "__main__":
    main()
