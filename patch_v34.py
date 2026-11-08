# Lingo Brain v3.4 patch: open topics + recommended order, robust TTS (Web Speech API),
# vocabulary tracker (5 correct = learned), share-with-friend button.
# Every anchor must match exactly once (or the declared count), otherwise the patch aborts.
import json, re, sys

NL = chr(10)

def sub(src, old, new, count=1, name=""):
    n = src.count(old)
    if n != count:
        print("ANCHOR FAIL", name or old[:60], "found", n, "expected", count); sys.exit(1)
    return src.replace(old, new)

# ---------------- v3.js ----------------
js = open("v3.js", encoding="utf-8").read()
if "lingo_w" in js:
    print("v3.js already patched"); sys.exit(0)

js = sub(js, 'var VER = "8";', 'var VER = "9";', name="VER")

# 1) unlock: all ready topics open (config unlock.mode = "chain" restores the old lock)
js = sub(js, "if (i < 0) return false; if (i === 0) return true;",
         "if (i < 0) return false; if (i === 0) return true;" + NL +
         '    if (!(V.cfg && V.cfg.unlock && V.cfg.unlock.mode === "chain")) return true;', name="isOpen")
js = sub(js, "var nx = nextOf(id), wasOpen = nx ? isOpen(nx.id) : true;",
         "V.nextHint = null; var nx = nextOf(id), wasOpen = nx ? isOpen(nx.id) : true;", name="checkUnlock1")
js = sub(js, 'if (nx && !wasOpen) { if (arr("unlocked").indexOf(nx.id) < 0) arr("unlocked").push(nx.id); V.fresh = nx.id; res = nx; }',
         'if (nx && !wasOpen) { if (arr("unlocked").indexOf(nx.id) < 0) arr("unlocked").push(nx.id); V.fresh = nx.id; res = nx; }'
         ' else if (nx && !isPassed(nx.id)) { V.fresh = nx.id; V.nextHint = nx; }', name="checkUnlock2")

# 2) replace say() with the robust TTS + vocab + share block
a = js.index("  function say(text, lang, rate) {")
b = js.index("    speechSynthesis.speak(u);" + NL + "  }", a) + len("    speechSynthesis.speak(u);" + NL + "  }")
BLOCK = r'''  // ---------- v3.4: озвучка (Web Speech API, без блокировки UI) ----------
  var SAY_OK = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  var VOICES = [], sayUnlocked = false;
  function loadVoices() { try { VOICES = speechSynthesis.getVoices() || []; } catch (e) { VOICES = []; } }
  if (SAY_OK) {
    loadVoices();
    try { if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", loadVoices); else speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {}
    // iOS/Android WebView: первый звук должен родиться из жеста пользователя — "будим" движок тихой фразой
    var unlockSay = function () {
      if (sayUnlocked) return; sayUnlocked = true;
      try { var u0 = new SpeechSynthesisUtterance(" "); u0.volume = 0; speechSynthesis.speak(u0); } catch (e) {}
    };
    ["pointerdown", "touchstart", "click"].forEach(function (ev) { document.addEventListener(ev, unlockSay, { capture: true, once: true, passive: true }); });
  } else {
    document.documentElement.classList.add("nosay");
  }
  function pickVoice(lang) {
    if (!VOICES.length) loadVoices();
    var low = String(lang || "").toLowerCase(), norm = function (x) { return String(x.lang || "").split("_").join("-").toLowerCase(); };
    var v = VOICES.filter(function (x) { return norm(x) === low; })[0];
    if (!v && low === "es-mx") v = VOICES.filter(function (x) { return norm(x) === "es-us"; })[0];
    if (!v) v = VOICES.filter(function (x) { return norm(x).indexOf(low.slice(0, 2)) === 0; })[0];
    return v || null;
  }
  function speakNow(text, lang, rate) {
    var u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = rate || 1;
    var v = pickVoice(lang); if (v) u.voice = v;
    speechSynthesis.speak(u);
  }
  function say(text, lang, rate) {
    if (!SAY_OK || !text) return;
    lang = lang || "es-ES";
    try {
      if (speechSynthesis.paused) speechSynthesis.resume();
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        // cancel()+speak() в одном тике глотает фразу в Chrome/Android — даём движку 60 мс
        speechSynthesis.cancel();
        setTimeout(function () { try { speakNow(text, lang, rate); } catch (e) {} }, 60);
      } else speakNow(text, lang, rate); // синхронно — иначе iOS теряет жест
    } catch (e) {}
  }
  // старые экраны (v1/v2) тоже говорят через новый движок
  window.speak = function (t, l) { say(t, l, 0.85); };

  // ---------- v3.4: словарный трекер (Учу / Выучено) ----------
  // WD = { topicId: "строка, 1 символ на карточку" }  "-" не видел, "0".."4" учу, "5" выучено
  var WKEY = "lingo_w", WMAX = 5, WD = {};
  function wv(ch) { if (!ch || ch === "-") return -1; var n = parseInt(ch, 10); return isNaN(n) ? 0 : Math.max(0, Math.min(WMAX, n)); }
  function wParse(s) { try { var o = JSON.parse(s || "{}"); return (o && typeof o === "object" && !Array.isArray(o)) ? o : {}; } catch (e) { return {}; } }
  function wMerge(a, b) {
    var out = {};
    [a, b].forEach(function (o) {
      Object.keys(o).forEach(function (k) {
        if (typeof o[k] !== "string") return;
        var x = out[k] || "", y = o[k], n = Math.max(x.length, y.length), s = "";
        for (var i = 0; i < n; i++) { var v = Math.max(wv(x.charAt(i)), wv(y.charAt(i))); s += v < 0 ? "-" : String(v); }
        out[k] = s;
      });
    });
    return out;
  }
  function wCloudOk() { try { var tg = window.Telegram && Telegram.WebApp; return !!(tg && tg.CloudStorage && tg.isVersionAtLeast && tg.isVersionAtLeast("6.9")); } catch (e) { return false; } }
  function wSaveLocal() { try { localStorage.setItem(WKEY, JSON.stringify(WD)); } catch (e) {} }
  function wSaveCloud() {
    if (!wCloudOk()) return;
    var j = JSON.stringify(WD); if (j.length >= 4000) return; // лимит CloudStorage 4096 символов на ключ
    try { Telegram.WebApp.CloudStorage.setItem(WKEY, j, function () {}); } catch (e) {}
  }
  function wLoad() {
    try { WD = wMerge({}, wParse(localStorage.getItem(WKEY))); } catch (e) { WD = {}; }
    if (!wCloudOk()) return;
    try {
      Telegram.WebApp.CloudStorage.getItem(WKEY, function (err, val) {
        if (err || !val) return;
        WD = wMerge(WD, wParse(val)); wSaveLocal(); if (window.lbWords) window.lbWords();
      });
    } catch (e) {}
  }
  function wName(c) {
    var s = c.front || c.text || (c.tokens && c.tokens.join(" ")) || (c.audio && c.audio.text) || (c.options && c.options[c.answer]) || "";
    return s.length > 42 ? s.slice(0, 40) + "…" : s;
  }
  function wordMark(c, ok) {
    if (!c || !c.topicId || !(c.idx >= 0) || c.type === "speak") return; // "скажи вслух" — самооценка, не считаем
    var s = WD[c.topicId] || "";
    while (s.length <= c.idx) s += "-";
    var v = wv(s.charAt(c.idx));
    if (ok) { if (v >= WMAX) return; v = v < 0 ? 1 : v + 1; }
    else { if (v >= 0) return; v = 0; } // ошибка на новом слове = "в процессе"
    WD[c.topicId] = s.slice(0, c.idx) + String(v) + s.slice(c.idx + 1);
    wSaveLocal();
    if (ok && v === WMAX) {
      var nm = wName(c);
      setTimeout(function () { toast("🎓 Выучено: " + nm); }, 900);
      trk("word_learned", { topic_id: c.topicId, idx: c.idx });
    }
  }
  function wCounts() {
    var learning = 0, learned = 0;
    Object.keys(WD).forEach(function (k) { var s = WD[k] || ""; for (var i = 0; i < s.length; i++) { var v = wv(s.charAt(i)); if (v >= WMAX) learned++; else if (v >= 0) learning++; } });
    return { learning: learning, learned: learned };
  }
  window.lbWords = function () {
    var c = wCounts(), a = document.getElementById("pWLearn"), b = document.getElementById("pWDone");
    if (a) a.textContent = c.learning; if (b) b.textContent = c.learned;
  };

  // ---------- v3.4: поделиться с другом ----------
  window.shareResult = function () {
    var xp = window.LB_LAST_XP || 0, app = "https://t.me/LingoBrainBOT";
    var text = "Я прошёл раунд в Lingo Brain и набрал " + xp + " XP! Попробуй обогнать меня 🧠";
    var url = "https://t.me/share/url?url=" + encodeURIComponent(app) + "&text=" + encodeURIComponent(text);
    haptic("medium"); trk("share_clicked", { xp: xp, track: (window.LAST && LAST.lang) || null });
    var tg = window.Telegram && Telegram.WebApp;
    try { if (tg && tg.initData && tg.openTelegramLink) { tg.openTelegramLink(url); return; } } catch (e) {}
    try { if (navigator.share) { navigator.share({ text: text, url: app }).catch(function () {}); return; } } catch (e) {}
    try { if (navigator.clipboard) navigator.clipboard.writeText(text + " " + app); toast("📋 Текст скопирован"); } catch (e) {}
    try { window.open(url, "_blank"); } catch (e) {}
  };

  (function () {
    var st = document.createElement("style");
    st.textContent = ".nosay .sayb{display:none!important}" +
      ".v3sb{background:rgba(255,255,255,.07);border:1px solid var(--line);border-radius:12px;color:var(--text);font-size:17px;min-width:42px;height:42px;cursor:pointer;flex:none;font-family:inherit}" +
      ".v3sb:active{transform:scale(.94)}.v3cs .ex .v3sb{min-width:30px;height:30px;font-size:13px;margin-left:6px;vertical-align:middle;border-radius:10px}" +
      ".v3msg.me .sp{background:rgba(0,0,0,.14);color:#1A1B26;border:none}";
    document.head.appendChild(st);
  })();
  window.__v3.say = say; window.__v3.wordMark = wordMark; window.__v3.wCounts = wCounts; window.__v3.WD = function () { return WD; }; window.__v3.wMerge = wMerge;'''
js = js[:a] + BLOCK + js[b:]

# 3) каталог: подсказка "следующая по порядку"
js = sub(js, 'var bl = E("div", "v3block", ',
         'var nextId = null; b.topics.forEach(function (x) { if (!nextId && x.status === "ready" && V.topics[x.id] && !isPassed(x.id)) nextId = x.id; });' + NL +
         '      var bl = E("div", "v3block", ', name="catalog nextId")
js = sub(js, 'esc(tp.title) + (pv ? "<small>Откроется после «" + esc(pv.title) + "» от 60%</small>" : "")',
         'esc(tp.title) + (pv ? "<small>Откроется после «" + esc(pv.title) + "» от 60%</small>" : "") + (open && tp.id === nextId ? "<small>👉 Следующая по порядку</small>" : "")', name="catalog hint")

# 4) шпаргалка: 🔊 у слова и у примера
js = sub(js, 't.cheatsheet.length + " ключевых слов, нажми — услышишь"',
         't.cheatsheet.length + " ключевых слов, " + (SAY_OK ? "нажми 🔊 — услышишь" : "прочитай и запомни")', name="cheat sub")
js = sub(js, '''var r = E("div", "v3cs glass", '<div class="w"><b></b><div class="tr"></div>' + (c.ex ? '<div class="ex"></div>' : "") + "</div><span>🔊</span>");''',
         '''var r = E("div", "v3cs glass", '<div class="w"><b></b><div class="tr"></div>' + (c.ex ? '<div class="ex"><span></span><button class="v3sb sayb x" aria-label="пример">🔊</button></div>' : "") + '</div><button class="v3sb sayb t" aria-label="слово">🔊</button>');''', name="cheat row")
js = sub(js, 'r.querySelector("b").textContent = c.term; r.querySelector(".tr").textContent = c.tr; if (c.ex) r.querySelector(".ex").textContent = c.ex;',
         'r.querySelector("b").textContent = c.term; r.querySelector(".tr").textContent = c.tr; if (c.ex) r.querySelector(".ex span").textContent = c.ex;' + NL +
         '      r.querySelector(".v3sb.t").onclick = function (e) { e.stopPropagation(); haptic("light"); say(c.term, lang, 0.9); };' + NL +
         '      if (c.ex) r.querySelector(".v3sb.x").onclick = function (e) { e.stopPropagation(); haptic("light"); say(c.ex, lang, 0.9); };', name="cheat fill")

# 5) prep: id темы и индекс карточки для трекера
js = sub(js, "x.track = t.track; x.lang =", "x.track = t.track; x.topicId = t.id; x.idx = t.cards.indexOf(c); x.lang =", name="prep")

# 6) finishRun: облако 1 раз за раунд + тост "дальше по порядку"
js = sub(js, "var r = V.run; stopTimer(); if (window.speechSynthesis) speechSynthesis.cancel();",
         "var r = V.run; stopTimer(); if (window.speechSynthesis) speechSynthesis.cancel(); wSaveCloud();", name="finishRun")
js = sub(js, 'if (un) setTimeout(function () { haptic("success"); toast("🔓 Открыта новая тема: " + un.emoji + " " + un.title); }, 1600);',
         'if (un) setTimeout(function () { haptic("success"); toast("🔓 Открыта новая тема: " + un.emoji + " " + un.title); }, 1600);' +
         ' else if (V.nextHint) { var nh = V.nextHint; V.nextHint = null; setTimeout(function () { toast("👉 Дальше по порядку: " + nh.emoji + " " + nh.title); }, 1600); }', name="finish toast")

# 7) трекер в grade()
js = sub(js, "function grade(ok, pts) {", "function grade(ok, pts) {" + NL +
         "    try { wordMark(V.run && V.run.cards && V.run.cards[V.run.pos], ok); } catch (e) {}", name="grade")

# 8) все кнопки 🔊 получают класс sayb (прячутся без Web Speech API)
js = sub(js, '''<button class="btn ghost" style="flex:0 0 64px;margin:0">🔊</button>''',
         '''<button class="btn ghost sayb" style="flex:0 0 64px;margin:0">🔊</button>''', name="feedback say")
js = sub(js, 'var pb = E("button", "v3play", "🔊"); pb.onclick = function () { haptic("light"); say(a.text, a.lang, rate); }; card.appendChild(pb);',
         'var pb = E("button", "v3play sayb", "🔊"); pb.onclick = function () { haptic("light"); say(a.text, a.lang, rate); }; card.appendChild(pb);' +
         ' if (!SAY_OK) card.appendChild(E("div", "v3sub", "🔇 Озвучка недоступна — прочитай: <b>" + esc(a.text) + "</b>"));', name="listen")
js = sub(js, 'E("button", "pill", "🐢 Медленнее")', 'E("button", "pill sayb", "🐢 Медленнее")', name="slow")
js = sub(js, 'E("button", "pill", "🔊 Послушать")', 'E("button", "pill sayb", "🔊 Послушать")', count=2, name="pills")
js = sub(js, '<button class="sp">🔊</button>', '<button class="sp sayb">🔊</button>', name="scen bot")
js = sub(js, 'var me = E("div", "v3msg me"); me.textContent = c.text; chat.appendChild(me);',
         '''var me = E("div", "v3msg me", '<span class="tx"></span> <button class="sp sayb">🔊</button>'); me.querySelector(".tx").textContent = c.text; me.querySelector(".sp").onclick = function () { say(c.text, lang, 0.95); }; chat.appendChild(me);''', name="scen me")

# 9) старт
js = sub(js, "  renderHome();" + NL + "  twStart();", "  wLoad();" + NL + "  renderHome();" + NL + "  twStart();", name="start")
open("v3.js", "w", encoding="utf-8").write(js)

# ---------------- index.html ----------------
h = open("index.html", encoding="utf-8").read()
h = sub(h, "xp += 20;", "xp += 20; window.LB_LAST_XP = xp;", name="xp")
h = sub(h, '''<button class="btn" onclick="again()">🔁 Ещё раунд</button>''',
        '''<button class="btn ok" id="shareBtn" onclick="shareResult()">Поделиться с другом 🚀</button>''' + NL +
        '''    <button class="btn" onclick="again()">🔁 Ещё раунд</button>''', name="share btn")
h = sub(h, '''<div class="tile glass"><div class="v" id="pBest"></div><div class="n">🏅 лучшая серия</div></div>''',
        '''<div class="tile glass"><div class="v" id="pBest"></div><div class="n">🏅 лучшая серия</div></div>''' + NL +
        '''    <div class="tile glass"><div class="v" id="pWLearn">0</div><div class="n">📚 слов в процессе</div></div>''' + NL +
        '''    <div class="tile glass"><div class="v" id="pWDone">0</div><div class="n">🎓 выучено слов</div></div>''', name="tiles")
h = sub(h, '''<p style="color:var(--muted);font-size:13px;text-align:center">Пропустил день?''',
        '''<p style="color:var(--muted);font-size:13px;text-align:center;margin-bottom:6px">5 верных ответов на слово — и оно «Выучено» 🎓</p>''' + NL +
        '''  <p style="color:var(--muted);font-size:13px;text-align:center">Пропустил день?''', name="hint")
h = sub(h, '$("pBest").textContent = S.bestStreak + " дн.";',
        '$("pBest").textContent = S.bestStreak + " дн.";' + NL + '  try { if (window.lbWords) window.lbWords(); } catch (e) {}', name="renderProfile")
h = sub(h, 'class="btn ghost say"', 'class="btn ghost say sayb"', name="legacy say")
h = sub(h, "v3.js?v=8", "v3.js?v=9", name="script ver")
open("index.html", "w", encoding="utf-8").write(h)

# ---------------- config.json ----------------
cp = "content/config.json"
cfg = json.load(open(cp, encoding="utf-8"))
cfg.setdefault("unlock", {})["mode"] = "open"
cfg["unlock"]["modeHelp"] = "open = все готовые темы открыты, порядок подсказывается; chain = замок до 60% в предыдущей теме"
json.dump(cfg, open(cp, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("patched OK: v3.js", len(js), "chars; index.html", len(h), "chars")
