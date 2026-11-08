import json, os, sys
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "content")
err = []; ready = []
cat = json.load(open(os.path.join(B, "catalog.json"), encoding="utf-8"))
seen = set()
for tr in cat["tracks"]:
    for b in tr["blocks"]:
        for tp in b["topics"]:
            i = tp["id"]
            if i in seen: err.append("dup id " + i)
            seen.add(i)
            if tp.get("status") != "ready": continue
            ready.append(i)
            f = os.path.join(B, tp.get("file") or "-")
            if not os.path.isfile(f): err.append(i + ": missing file"); continue
            try: t = json.load(open(f, encoding="utf-8"))
            except Exception as e: err.append(i + ": bad json " + str(e)); continue
            if t.get("id") != i: err.append(i + ": id mismatch")
            if t.get("track") != tr["id"]: err.append(i + ": track mismatch")
            if tp.get("emoji") and t.get("emoji") and tp["emoji"] != t["emoji"]: err.append(i + ": emoji mismatch")
            cards = t.get("cards") or []
            if not 6 <= len(cards) <= 15: err.append(i + ": cards %d" % len(cards))
            if not any(c.get("energy") == "low" for c in cards): err.append(i + ": no low card")
            cids = set()
            for c in cards:
                k = i + "/" + str(c.get("id"))
                if c.get("id") in cids: err.append(k + ": dup card id")
                cids.add(c.get("id"))
                ty = c.get("type")
                if ty in ("choice", "listen"):
                    o = c.get("options") or []
                    if len(o) < 2: err.append(k + ": options")
                    if len(set(o)) != len(o): err.append(k + ": dup options")
                    if not isinstance(c.get("answer"), int) or not 0 <= c["answer"] < len(o): err.append(k + ": answer range")
                    if ty == "listen" and not (c.get("audio") or {}).get("text"): err.append(k + ": no audio")
                elif ty == "build":
                    if not c.get("tokens"): err.append(k + ": no tokens")
                    for d in c.get("distractors") or []:
                        if d in c.get("tokens", []): err.append(k + ": distractor in tokens " + d)
                elif ty == "speak":
                    if not c.get("text") or not c.get("lang"): err.append(k + ": speak fields")
                elif ty == "flash":
                    if not c.get("front") or not c.get("back"): err.append(k + ": flash fields")
                else: err.append(k + ": unknown type " + str(ty))
            for s in t.get("scenarios") or []:
                k = i + "/" + str(s.get("id")); nodes = s.get("nodes") or {}
                if s.get("start") not in nodes: err.append(k + ": bad start"); continue
                for nid, n in nodes.items():
                    chs = n.get("choices") or []
                    if not chs and not n.get("end"): err.append(k + ": dead end " + nid)
                    for c in chs:
                        if c.get("next") not in nodes: err.append(k + ": bad next " + nid + "->" + str(c.get("next")))
                        if c.get("score") not in (0, 1, 2): err.append(k + ": score " + nid)
                reach = set(); st = [s["start"]]
                while st:
                    x = st.pop()
                    if x in reach or x not in nodes: continue
                    reach.add(x); st += [c.get("next") for c in nodes[x].get("choices") or []]
                for nid in nodes:
                    if nid not in reach: err.append(k + ": unreachable " + nid)
                if not any(nodes[x].get("end") for x in reach): err.append(k + ": no reachable end")
print("ready", len(ready), ready)
print("ERRORS", err)
sys.exit(1 if err else 0)
