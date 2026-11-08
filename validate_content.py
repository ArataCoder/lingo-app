#!/usr/bin/env python3
# Lingo Brain content validator v3.4
# Usage: python3 validate_content.py [--dump]
#   checks catalog, topic structure, scenarios graph, card logic and language lint.
#   --dump writes content/_vocab_es.txt and content/_vocab_en.txt for manual proofreading.
import json, os, sys, re

B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "content")
NEW = {"es.life.rent", "es.life.doctor", "es.life.repairs", "es.work.interview",
       "en.barriers.paraphrase", "en.barriers.clarify", "en.interview.star", "en.interview.strengths",
       "en.interview.questions", "en.biz.meetings", "en.biz.async", "en.social.openers"}
err = []; warn = []; ready = []
vocab = {"es": {}, "en": {}}

CYR = re.compile("[а-яА-ЯёЁіїєҐґ]")
PUNCT = ",.?!:;"
EN_BAD = ["how is it called", "informations", "advices", "discuss about", "explain me", "say me",
          "i am agree", "depends of", "more better", "didn't understand nothing", "waiting you"]
EN_BAD_RE = [re.compile("how does [a-z' ]+ look like")]
EN_UK = ["analysed", "prioritise", "organise", "colour", "favour", "centre", "realise"]
ES_BAD = ["la problema", "la día", "el mano", "el foto", "la sistema", "la mapa", "la idioma",
          "el calle", "el gente", "la tema", "el radio", "un agua fría"]
ES_NOACCENT = ["despues", "tambien", "adios", "medico", "telefono", "numero", "dia", "facil",
               "rapido", "ingles", "aqui", "informacion", "direccion", "reparacion", "estomago",
               "alergico", "jamas", "nino", "manana", "senor", "espanol", "ano", "anos", "curriculum"]

def has_emoji(s):
    for c in s:
        o = ord(c)
        if o >= 0x1F000 or 0x2600 <= o <= 0x27BF or 0x2B00 <= o <= 0x2BFF:
            return True
    return False

def words(s):
    t = s.lower()
    for p in PUNCT + "¿¡…«»()/" + '"':
        t = t.replace(p, " ")
    return [w for w in t.split() if w]

def padded(s):
    return " " + " ".join(words(s)) + " "

def lint(lang, s, where, strict=True):
    """lang: es | en | ru. strict=False for intentionally wrong (score 0) answers."""
    if not isinstance(s, str) or not s.strip():
        err.append(where + ": empty text"); return
    if lang == "ru":
        if not CYR.search(s) and any(c.isalpha() for c in s): err.append(where + ": translation has no Cyrillic: " + s)
        return
    if CYR.search(s): err.append(where + ": Cyrillic inside " + lang + " text: " + s)
    if has_emoji(s): err.append(where + ": emoji in spoken text (TTS reads it aloud): " + s)
    if not strict: return
    if "  " in s: err.append(where + ": double space")
    if s != s.strip(): err.append(where + ": leading/trailing space")
    for p in PUNCT:
        if " " + p in s: err.append(where + ": space before '" + p + "': " + s)
    ws = s.split()
    for a, b in zip(ws, ws[1:]):
        if not a.endswith((",", "…", "?", "!")) and words(a) and words(b) and words(a) == words(b):
            err.append(where + ": repeated word '" + b + "': " + s)
    pd = padded(s)
    if lang == "es":
        if s.count("¿") != s.count("?"): err.append(where + ": unbalanced ¿? : " + s)
        if s.count("¡") != s.count("!"): err.append(where + ": unbalanced ¡! : " + s)
        for b in ES_BAD:
            if " " + b + " " in pd: err.append(where + ": wrong article '" + b + "': " + s)
        for w in ES_NOACCENT:
            if " " + w + " " in pd: err.append(where + ": missing accent/ñ '" + w + "': " + s)
    if lang == "en":
        if "¿" in s or "¡" in s: err.append(where + ": Spanish punctuation in English: " + s)
        low = s.lower()
        for b in EN_BAD:
            if b in low: err.append(where + ": unnatural English '" + b + "': " + s)
        for r in EN_BAD_RE:
            if r.search(low): err.append(where + ": 'how does ... look like' error: " + s)
        for b in EN_UK:
            if " " + b + " " in pd: warn.append(where + ": UK spelling '" + b + "' (app uses en-US)")
    for w in words(s):
        vocab[lang][w] = vocab[lang].get(w, 0) + 1

cat = json.load(open(os.path.join(B, "catalog.json"), encoding="utf-8"))
seen = set()
for tr in cat["tracks"]:
    L = tr["id"]  # es | en
    LOC = "es-ES" if L == "es" else "en-US"
    for b in tr["blocks"]:
        for tp in b["topics"]:
            i = tp["id"]
            if i in seen: err.append("dup id " + i)
            seen.add(i)
            if not i.startswith(L + "."): err.append(i + ": id not in track " + L)
            if tp.get("status") != "ready": continue
            ready.append(i)
            f = os.path.join(B, tp.get("file") or "-")
            if not os.path.isfile(f): err.append(i + ": missing file"); continue
            try: t = json.load(open(f, encoding="utf-8"))
            except Exception as e: err.append(i + ": bad json " + str(e)); continue
            new = i in NEW
            if t.get("id") != i: err.append(i + ": id mismatch")
            if t.get("track") != L: err.append(i + ": track mismatch")
            if tp.get("emoji") and t.get("emoji") and tp["emoji"] != t["emoji"]: err.append(i + ": emoji mismatch")
            # cheatsheet
            cs = t.get("cheatsheet") or []
            if len(cs) < 8 or (new and len(cs) != 8): err.append(i + ": cheatsheet %d (need 8)" % len(cs))
            terms = set()
            for n, w in enumerate(cs):
                k = i + "/cheat" + str(n)
                if w.get("term") in terms: err.append(k + ": dup term")
                terms.add(w.get("term"))
                lint(L, w.get("term"), k + ".term"); lint(L, w.get("ex"), k + ".ex"); lint("ru", w.get("tr"), k + ".tr")
            # cards
            cards = t.get("cards") or []
            if len(cards) < 9 or (new and len(cards) != 9): err.append(i + ": cards %d (need 9)" % len(cards))
            if not any(c.get("energy") == "low" for c in cards): err.append(i + ": no low-energy card")
            cids = set()
            for c in cards:
                k = i + "/" + str(c.get("id"))
                if c.get("id") in cids: err.append(k + ": dup card id")
                cids.add(c.get("id"))
                if c.get("energy") not in ("low", "normal", "boost"): err.append(k + ": bad energy")
                ty = c.get("type")
                if ty in ("choice", "listen"):
                    o = c.get("options") or []
                    if len(o) < 2 or (new and len(o) != 3): err.append(k + ": options count %d" % len(o))
                    if len(set(o)) != len(o): err.append(k + ": dup options")
                    a = c.get("answer")
                    if not isinstance(a, int) or not 0 <= a < len(o): err.append(k + ": answer out of range"); continue
                    lint("ru", c.get("q"), k + ".q")
                    right = o[a]
                    if CYR.search(right): lint("ru", right, k + ".answer")
                    else: lint(L, right, k + ".answer")
                    for x in o:
                        if x != right and not CYR.search(x): lint(L, x, k + ".distractor", strict=False)
                    if ty == "listen":
                        au = c.get("audio") or {}
                        if not au.get("text"): err.append(k + ": no audio"); continue
                        if not str(au.get("lang", "")).startswith(L): err.append(k + ": audio lang " + str(au.get("lang")))
                        lint(L, au["text"], k + ".audio")
                elif ty == "build":
                    tok = c.get("tokens") or []
                    if not tok: err.append(k + ": no tokens"); continue
                    lint(L, " ".join(tok), k + ".tokens")
                    lint("ru", c.get("prompt"), k + ".prompt")
                    ds = c.get("distractors") or []
                    if new and not ds: err.append(k + ": no distractors")
                    low = [x.lower() for x in tok]
                    for d in ds:
                        if d.lower() in low: err.append(k + ": distractor duplicates a token " + d)
                elif ty == "speak":
                    if not c.get("text") or not c.get("lang"): err.append(k + ": speak fields"); continue
                    if c["lang"] != LOC: err.append(k + ": speak lang " + c["lang"] + " != " + LOC)
                    lint(L, c["text"], k + ".text")
                    if c.get("tr"): lint("ru", c["tr"], k + ".tr")
                elif ty == "flash":
                    if not c.get("front") or not c.get("back"): err.append(k + ": flash fields"); continue
                    if not CYR.search(c["front"]): lint(L, c["front"], k + ".front")
                else: err.append(k + ": unknown type " + str(ty))
            # scenarios
            sc = t.get("scenarios") or []
            if not sc: err.append(i + ": no scenario")
            for s in sc:
                k = i + "/" + str(s.get("id")); nodes = s.get("nodes") or {}
                if s.get("voice") and s["voice"] != LOC: err.append(k + ": voice " + s["voice"])
                if s.get("start") not in nodes: err.append(k + ": bad start"); continue
                for nid, n in nodes.items():
                    lint(L, n.get("say"), k + "." + nid + ".say")
                    if n.get("tr"): lint("ru", n["tr"], k + "." + nid + ".tr")
                    chs = n.get("choices") or []
                    if not chs and not n.get("end"): err.append(k + ": dead end " + nid)
                    if chs and not any(c.get("score") == 2 for c in chs): err.append(k + ": no 2-point choice at " + nid)
                    for c in chs:
                        if c.get("next") not in nodes: err.append(k + ": bad next " + nid + "->" + str(c.get("next")))
                        if c.get("score") not in (0, 1, 2): err.append(k + ": score " + nid)
                        lint(L, c.get("text"), k + "." + nid + ".choice", strict=c.get("score", 0) >= 1)
                        if not c.get("feedback"): err.append(k + ": no feedback " + nid)
                reach = set(); st = [s["start"]]
                while st:
                    x = st.pop()
                    if x in reach or x not in nodes: continue
                    reach.add(x); st += [c.get("next") for c in nodes[x].get("choices") or []]
                for nid in nodes:
                    if nid not in reach: err.append(k + ": unreachable " + nid)
                # every reachable node must be able to reach an end (no infinite loops)
                canend = {x for x in nodes if nodes[x].get("end")}
                changed = True
                while changed:
                    changed = False
                    for x in nodes:
                        if x not in canend and any(c.get("next") in canend for c in nodes[x].get("choices") or []):
                            canend.add(x); changed = True
                for x in reach:
                    if x not in canend: err.append(k + ": node can't reach an end " + x)

nl = chr(10)
print("ready", len(ready))
print("new topics ready:", len([x for x in ready if x in NEW]), "/", len(NEW))
missing = NEW - set(ready)
if missing: err.append("new topics not ready: " + ", ".join(sorted(missing)))
print("vocab: es %d words, en %d words" % (len(vocab["es"]), len(vocab["en"])))
if "--dump" in sys.argv:
    for lg in ("es", "en"):
        with open(os.path.join(B, "_vocab_" + lg + ".txt"), "w", encoding="utf-8") as fh:
            fh.write(nl.join(sorted(vocab[lg])))
    print("vocab dumped to content/_vocab_es.txt, content/_vocab_en.txt")
for w in warn: print("WARN", w)
for e in err: print("ERROR", e)
print("OK" if not err else "FAILED: %d errors" % len(err))
sys.exit(1 if err else 0)
