# Lingo Brain: helpers for topic generators (stage 2)
import json, os
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "content")
ES = "es-ES"; EN = "en-US"

def ch(text, nxt, score, fb):
    return {"text": text, "next": nxt, "score": score, "feedback": fb}
def W(term, tr, ex):
    return {"term": term, "tr": tr, "ex": ex}
def C(i, q, opts, ex, en="low"):
    return {"id": i, "type": "choice", "energy": en, "q": q, "options": opts, "answer": 0, "explain": ex}
def F(i, front, back):
    return {"id": i, "type": "flash", "energy": "low", "front": front, "back": back}
def L(i, text, lang, q, opts, ex, rate=0.85):
    return {"id": i, "type": "listen", "energy": "normal", "audio": {"text": text, "lang": lang, "rate": rate}, "q": q, "options": opts, "answer": 0, "explain": ex}
def B(i, prompt, tokens, distr, pattern):
    return {"id": i, "type": "build", "energy": "normal", "prompt": prompt, "tokens": tokens, "distractors": distr, "pattern": pattern}
def S(i, text, tr, lang, en="normal"):
    return {"id": i, "type": "speak", "energy": en, "text": text, "tr": tr, "lang": lang}
def N(say, tr, choices=None):
    if choices is None:
        return {"say": say, "tr": tr, "end": True}
    return {"say": say, "tr": tr, "choices": choices}
def SC(sid, title, emoji, user, bot, voice, nodes):
    return {"id": sid, "title": title, "emoji": emoji, "userRole": user, "botRole": bot, "voice": voice, "start": "n1", "nodes": nodes, "ai": {"enabled": False}}
def T(tid, track, level, title, emoji, cheat, cards, scen, mins=4):
    return {"id": tid, "track": track, "level": level, "title": title, "emoji": emoji, "estMinutes": mins, "cheatsheet": cheat, "cards": cards, "scenarios": [scen]}

def write_topics(topics, new_refs=None):
    """topics: list of (topic, relpath). new_refs: catalog entries to add if missing: (blockId, entry)."""
    cp = os.path.join(BASE, "catalog.json")
    cat = json.load(open(cp, encoding="utf-8"))
    for block_id, entry in (new_refs or []):
        for tr in cat["tracks"]:
            for b in tr["blocks"]:
                if b["id"] == block_id and not any(tp["id"] == entry["id"] for tp in b["topics"]):
                    b["topics"].append(entry)
    refs = {}
    for tr in cat["tracks"]:
        for b in tr["blocks"]:
            for tp in b["topics"]:
                refs[tp["id"]] = tp
    n = 0
    for t, path in topics:
        ref = refs.get(t["id"])
        if ref is None:
            raise SystemExit("not in catalog: " + t["id"])
        # catalog is the source of truth for title/emoji/level
        t["title"] = ref["title"]; t["emoji"] = ref["emoji"]; t["level"] = ref.get("level", t["level"])
        full = os.path.join(BASE, path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            json.dump(t, f, ensure_ascii=False, indent=2)
        ref["status"] = "ready"; ref["file"] = path
        n += 1
    with open(cp, "w", encoding="utf-8") as f:
        json.dump(cat, f, ensure_ascii=False, indent=2)
    print("written", n)
