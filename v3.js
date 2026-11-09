/* Lingo Brain v3: каталог тем, «Нет сил», Surprise Box, заморозка серии,
   тренажёр уха, конструктор фраз, шпаргалки и сценарии. Контент: content/*.json */
(function () {
  var VER = "14";
  var V = { cat: null, cfg: null, sur: null, topics: {}, failed: false, track: "es", run: null, lastRun: null };
  var DEF_LANG = { es: "es-ES", en: "en-US" };
  var ACCENT = { "es-ES": "🇪🇸 Кастилья", "es-MX": "🇲🇽 Латино", "es-US": "🌎 Латино", "en-GB": "🇬🇧 Британский", "en-US": "🇺🇸 Американский" };
  var LETTERS = "ABCD";

  // ---------- v3.1: эмодзи через Twemoji SVG (с откатом на системные) ----------
  var TW = { base: "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/", ok: 0, bad: 0, off: false };
  function isRI(c) { return c >= 0x1F1E6 && c <= 0x1F1FF; }
  function isMod(c) { return c >= 0x1F3FB && c <= 0x1F3FF; }
  var PICT_EXTRA = [0x231A, 0x231B, 0x2328, 0x23CF, 0x23E9, 0x23EA, 0x23EB, 0x23EC, 0x23ED, 0x23EE, 0x23EF, 0x23F0, 0x23F1, 0x23F2, 0x23F3, 0x23F8, 0x23F9, 0x23FA, 0x2B50, 0x2B55, 0x2B1B, 0x2B1C, 0x2B05, 0x2B06, 0x2B07, 0x2934, 0x2935, 0x25B6, 0x25C0, 0x25FB, 0x25FC, 0x25FD, 0x25FE, 0x2139, 0x3030, 0x303D, 0x3297, 0x3299];
  function isPict(c) {
    if (c >= 0x1F000 && c <= 0x1FAFF) return !isMod(c) && !isRI(c);
    if (c >= 0x2600 && c <= 0x27BF) return true;
    return PICT_EXTRA.indexOf(c) >= 0;
  }
  function emojiRuns(s) {
    var cps = Array.from(s), out = [], txt = "", i = 0, found = false;
    function cp(k) { return k < cps.length ? cps[k].codePointAt(0) : -1; }
    while (i < cps.length) {
      var c = cp(i), j = i;
      if (isRI(c) && isRI(cp(i + 1))) j = i + 2;
      else if (isPict(c)) {
        j = i + 1;
        if (cp(j) === 0xFE0F) j++;
        if (isMod(cp(j))) j++;
        while (cp(j) >= 0xE0020 && cp(j) <= 0xE007F) j++;
        while (cp(j) === 0x200D && isPict(cp(j + 1))) { j += 2; if (cp(j) === 0xFE0F) j++; if (isMod(cp(j))) j++; }
      }
      if (j > i) {
        var seq = cps.slice(i, j), codes = seq.map(function (x) { return x.codePointAt(0); });
        var zwj = codes.indexOf(0x200D) >= 0;
        var code = codes.filter(function (x) { return zwj || x !== 0xFE0F; }).map(function (x) { return x.toString(16); }).join("-");
        if (txt) { out.push({ t: txt }); txt = ""; }
        out.push({ e: seq.join(""), code: code }); found = true; i = j;
      } else { txt += cps[i]; i++; }
    }
    if (txt) out.push({ t: txt });
    return found ? out : null;
  }
  function twFallback(im) { var sp = document.createElement("span"); sp.className = "emjf"; sp.textContent = im.alt; if (im.parentNode) im.parentNode.replaceChild(sp, im); }
  function twOff() { TW.off = true; Array.prototype.forEach.call(document.querySelectorAll("img.emj"), twFallback); }
  function twImg(e, code) {
    var im = document.createElement("img"); im.className = "emj"; im.alt = e; im.draggable = false; im.setAttribute("aria-hidden", "true");
    im.onload = function () { TW.ok++; };
    im.onerror = function () { TW.bad++; twFallback(im); if (!TW.ok && TW.bad >= 3) twOff(); };
    im.src = TW.base + code + ".svg"; return im;
  }
  function twText(n) {
    if (TW.off) return;
    var p = n.parentNode; if (!p || !n.nodeValue || p.nodeType !== 1) return;
    var tag = p.nodeName; if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "INPUT" || tag === "TITLE") return;
    if (p.closest && p.closest(".emjf,.noemj")) return;
    var runs; try { runs = emojiRuns(n.nodeValue); } catch (e) { return; }
    if (!runs) return;
    var f = document.createDocumentFragment();
    runs.forEach(function (r) { f.appendChild(r.e ? twImg(r.e, r.code) : document.createTextNode(r.t)); });
    p.replaceChild(f, n);
  }
  function twParse(root) {
    if (TW.off || !root) return;
    if (root.nodeType === 3) { twText(root); return; }
    if (root.nodeType !== 1 || root.nodeName === "SCRIPT" || root.nodeName === "STYLE") return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], n;
    while ((n = w.nextNode())) list.push(n);
    list.forEach(twText);
  }
  function twStart() {
    try {
      twParse(document.body);
      new MutationObserver(function (ms) { if (TW.off) return; ms.forEach(function (m) { if (m.type === "characterData") twText(m.target); else Array.prototype.forEach.call(m.addedNodes, twParse); }); })
        .observe(document.body, { childList: true, subtree: true, characterData: true });
    } catch (e) { TW.off = true; }
  }
  // виброотклик на любые карточки/кнопки навигации
  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest ? e.target.closest(".track,.iconbtn,nav button,.v3b,.pill,.chip,.v3act") : null;
    if (el) haptic("light");
  }, true);

  // ---------- v3.1: офлайн-кэш контента ----------
  var CKEY = "lingo_content_cache_v1";
  function cacheContent() {
    var old = null; try { old = JSON.parse(localStorage.getItem(CKEY) || "null"); } catch (e) {}
    if (old && old.topics) readyRefs().forEach(function (tp) { if (!V.topics[tp.id] && old.topics[tp.id]) V.topics[tp.id] = old.topics[tp.id]; });
    try { localStorage.setItem(CKEY, JSON.stringify({ cat: V.cat, cfg: V.cfg, sur: V.sur, topics: V.topics, at: Date.now() })); } catch (e) {}
  }
  function fromCache() {
    var c = null; try { c = JSON.parse(localStorage.getItem(CKEY) || "null"); } catch (e) {}
    if (c && c.cat && c.cat.tracks) { V.cat = c.cat; V.cfg = c.cfg; V.sur = c.sur; V.topics = c.topics || {}; V.offline = true; V.failed = false; }
    else V.failed = true;
  }

  // ---------- v3.1: разблокировка тем ----------
  var PASS = 0.6;
  function readyOrder(tr) {
    var out = []; if (!V.cat) return out;
    var t = V.cat.tracks.filter(function (x) { return x.id === tr; })[0]; if (!t) return out;
    t.blocks.slice().sort(function (a, b) { return a.order - b.order; }).forEach(function (b) { b.topics.forEach(function (tp) { if (tp.status === "ready" && V.topics[tp.id]) out.push(tp); }); });
    return out;
  }
  // v3.3: разблокировка внутри блока (первая тема каждого блока открыта)
  function blockOrder(id) {
    var out = []; if (!V.cat) return out;
    V.cat.tracks.forEach(function (t) { t.blocks.forEach(function (b) {
      if (b.topics.some(function (tp) { return tp.id === id; })) b.topics.forEach(function (tp) { if (tp.status === "ready" && V.topics[tp.id]) out.push(tp); });
    }); });
    return out;
  }
  function trk(ev, p) { try { if (window.lbTrack) window.lbTrack(ev, p || {}); } catch (e) {} }
  function arr(k) { if (!Array.isArray(S[k])) S[k] = []; return S[k]; }
  function isPassed(id) { return arr("passed").indexOf(id) >= 0; }
  function prevOf(id) { var o = blockOrder(id), i = o.map(function (x) { return x.id; }).indexOf(id); return i > 0 ? o[i - 1] : null; }
  function nextOf(id) { var o = blockOrder(id), i = o.map(function (x) { return x.id; }).indexOf(id); return i >= 0 && i + 1 < o.length ? o[i + 1] : null; }
  function isOpen(id) {
    var o = blockOrder(id).map(function (x) { return x.id; }), i = o.indexOf(id);
    if (i < 0) return false; if (i === 0) return true;
    if (!(V.cfg && V.cfg.unlock && V.cfg.unlock.mode === "chain")) return true;
    if (V.cfg && V.cfg.unlock && (V.cfg.unlock.alwaysOpen || []).indexOf(id) >= 0) return true;
    return arr("unlocked").indexOf(id) >= 0 || isPassed(id) || isPassed(o[i - 1]);
  }
  function checkUnlock(id, ratio) {
    V.nextHint = null; var nx = nextOf(id), wasOpen = nx ? isOpen(nx.id) : true;
    if (!(ratio >= PASS)) {
      if (nx && !wasOpen) setTimeout(function () { toast("Ещё раунд от 60% — и откроется «" + nx.title + "» 💪"); }, 1600);
      return null;
    }
    if (!isPassed(id)) arr("passed").push(id);
    var res = null;
    if (nx && !wasOpen) { if (arr("unlocked").indexOf(nx.id) < 0) arr("unlocked").push(nx.id); V.fresh = nx.id; res = nx; } else if (nx && !isPassed(nx.id)) { V.fresh = nx.id; V.nextHint = nx; }
    save();
    return res;
  }
  window.__v3 = { V: V, isOpen: isOpen, emojiRuns: emojiRuns, TW: TW };


  function E(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  function getJ(p) { return fetch("content/" + p + "?v=" + VER).then(function (r) { if (!r.ok) throw new Error(p); return r.json(); }); }
  function readyRefs() { var out = []; if (!V.cat) return out; V.cat.tracks.forEach(function (t) { t.blocks.forEach(function (b) { b.topics.forEach(function (tp) { if (tp.status === "ready" && tp.file) out.push(tp); }); }); }); return out; }
  function trackOf(id) { return id.split(".")[0]; }
  function cfgXp(k, d) { return (V.cfg && V.cfg.xp && V.cfg.xp[k] != null) ? V.cfg.xp[k] : d; }

  function loadAll() {
    return Promise.all([getJ("catalog.json"), getJ("config.json"), getJ("surprise.json")]).then(function (r) {
      V.cat = r[0]; V.cfg = r[1]; V.sur = r[2]; V.failed = false; V.offline = false;
      return Promise.all(readyRefs().map(function (tp) { return getJ(tp.file).then(function (t) { V.topics[tp.id] = t; }).catch(function () {}); })).then(cacheContent);
    }).catch(function () { fromCache(); });
  }

  // ---------- озвучка с акцентом и темпом ----------
  // ---------- v3.4: озвучка (Web Speech API, без блокировки UI) ----------
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
  // v3.5: выбираем самый живой голос (Natural/Neural/Google/Enhanced), можно сменить вручную
  var VSKEY = "lingo_voice", VS = {};
  try { VS = JSON.parse(localStorage.getItem(VSKEY) || "{}") || {}; } catch (e) { VS = {}; }
  if (VS.neural === false) { delete VS.neural; try { localStorage.setItem(VSKEY, JSON.stringify(VS)); } catch (e) {} } // v3.7.1
  function vsSave() { try { localStorage.setItem(VSKEY, JSON.stringify(VS)); } catch (e) {} }
  function vNorm(x) { return String(x.lang || "").split("_").join("-").toLowerCase(); }
  var BADV = /compact|espeak|novelty|whisper|bad news|bells|bubbles|cellos|jester|organ|trinoids|zarvox|superstar|wobble|boing|albert|bahh|fred|junior|ralph|kathy|grandpa|grandma|rocko|shelley|flo|eddy|reed|sandy/i;
  function vScore(v, low) {
    var n = String(v.name || ""), s = 0, l = vNorm(v);
    if (l === low) s += 20; else if (low === "es-es" && l === "es-us") s += 5;
    if (/natural|neural|online/i.test(n)) s += 60;
    if (/premium|enhanced/i.test(n)) s += 50;
    if (/google/i.test(n)) s += 35;
    if (BADV.test(n)) s -= 80;
    if (v.localService === false) s += 3;
    return s;
  }
  function voicesFor(lang) {
    if (!VOICES.length) loadVoices();
    var low = String(lang || "").toLowerCase(), base = low.slice(0, 2);
    return VOICES.filter(function (x) { return vNorm(x).indexOf(base) === 0; })
      .sort(function (a, b) { return vScore(b, low) - vScore(a, low); });
  }
  function pickVoice(lang) {
    var list = voicesFor(lang), want = VS[String(lang || "").slice(0, 2).toLowerCase()];
    if (want) { var w = list.filter(function (x) { return x.voiceURI === want || x.name === want; })[0]; if (w) return w; }
    return list[0] || null;
  }
  function speakNow(text, lang, rate) {
    var u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = Math.max(0.5, Math.min(1.5, (rate || 1) * (VS.rate || 1)));
    var v = pickVoice(lang); if (v) u.voice = v;
    speechSynthesis.speak(u);
  }
  // ---- v3.6: живые нейроголоса (mp3 из edge-tts), иначе лучший голос браузера ----
  var AUD = {}, AUD_N = 0, AUD_TOPICS = -1, CUR_AUDIO = null, BS = String.fromCharCode(92), WRX = null;
  try { WRX = new RegExp("[" + BS + "p{L}" + BS + "p{N}]+", "gu"); } catch (e) { WRX = /[a-z0-9À-ɏЀ-ӿ]+/gi; }
  function aKey(lang, text) {
    var t = String(text || "").replace(/<[^>]*>/g, " ");
    try { t = t.normalize("NFC"); } catch (e) {}
    var w = t.toLowerCase().match(WRX) || [];
    return String(lang || "es").slice(0, 2).toLowerCase() + "|" + w.join(" ");
  }
  function regTopicUrls() {
    var ids = Object.keys(V.topics || {}); if (ids.length === AUD_TOPICS) return; AUD_TOPICS = ids.length;
    ids.forEach(function (id) {
      (function walk(o, lang) {
        if (!o || typeof o !== "object") return;
        if (Array.isArray(o)) { o.forEach(function (x) { walk(x, lang); }); return; }
        var lg = o.lang || lang;
        if (o.audio_url) { var tx = o.text || o.term || o.front || o.say; if (tx) AUD[aKey(lg, tx)] = o.audio_url; }
        if (o.ex_audio_url && o.ex) AUD[aKey(lg, o.ex)] = o.ex_audio_url;
        Object.keys(o).forEach(function (k) { var x = o[k]; if (x && typeof x === "object") walk(x, lg); });
      })(V.topics[id], String(id).slice(0, 2));
    });
  }
  var AUDB = (/github\.io$/.test(location.hostname) ? "" : "https://aratacoder.github.io/lingo-app/") + "assets/audio/";
  function audioFor(text, lang) { if (!text) return null; regTopicUrls(); return AUD[aKey(lang, text)] || null; }
  function loadAudioMap(tries) {
    tries = tries || 0;
    try {
      fetch(AUDB + "manifest.json?v=" + VER + "." + Math.floor(Date.now() / 600000), { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (!j || !j.items) { if (tries < 2) setTimeout(function () { loadAudioMap(tries + 1); }, 4000); return; } var n = 0;
        Object.keys(j.items).forEach(function (k) { if (!AUD[k]) AUD[k] = AUDB + j.items[k]; n++; });
        AUD_N = n; document.body.classList.add("hasmp3");
        if (window.current === "words" && window.lbNeuralBox) window.lbNeuralBox();
      }).catch(function () { if (tries < 2) setTimeout(function () { loadAudioMap(tries + 1); }, 4000); });
    } catch (e) {}
  }
  function playUrl(url, text, lang, rate) {
    var done = false; function fb() { if (done) return; done = true; ttsSay(text, lang, rate); }
    try {
      if (CUR_AUDIO) { try { CUR_AUDIO.pause(); } catch (e) {} }
      if (SAY_OK) { try { speechSynthesis.cancel(); } catch (e) {} }
      var a = new Audio(url); CUR_AUDIO = a;
      a.playbackRate = Math.max(0.5, Math.min(1.5, (rate || 1) * (VS.rate || 1)));
      a.onerror = fb;
      var p = a.play(); if (p && p.catch) p.catch(function (e) { if (e && e.name === "NotAllowedError") return; fb(); });
    } catch (e) { fb(); }
  }
  function ttsSay(text, lang, rate) {
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
  function say(text, lang, rate, url) {
    if (!text) return;
    lang = lang || "es-ES";
    var u = url || audioFor(text, lang); if (u) { playUrl(u, text, lang, rate); return; }
    try { if (SAY_OK && speechSynthesis.getVoices().length && !voicesFor(lang).length) { if (window.toast) toast("🔇 " + text); return; } } catch (e) {}
    ttsSay(text, lang, rate);
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

  // ---------- v3.5: экран «Мои слова» + настройки голоса ----------
  var WF = "learning";
  function hasCyr(s) { return /[а-яё]/i.test(s || ""); }
  function strip(s) { var d = document.createElement("div"); d.innerHTML = s == null ? "" : String(s); return (d.textContent || "").trim(); }
  function wEntry(c) {
    var t = "", r = "";
    if (c.type === "flash") { t = c.front; r = c.back; }
    else if (c.type === "listen") { t = c.audio && c.audio.text; r = "🎧 " + (c.q || ""); }
    else if (c.type === "build") { t = (c.tokens || []).join(" "); r = c.prompt; }
    else if (c.type === "speak") { t = c.text; r = c.tr; }
    else {
      var ans = c.options ? c.options[c.answer] : "", m = /«([^»]+)»/.exec(strip(c.q));
      if (ans && !hasCyr(strip(ans))) { t = ans; r = c.q; }
      else if (m && !hasCyr(m[1])) { t = m[1]; r = ans; }
      else { t = ans; r = c.q; }
    }
    return { t: strip(t), r: strip(r) };
  }
  window.lbWordFilter = function (f) { WF = f; haptic("light"); window.lbRenderWords(); };
  window.lbRenderWords = function () {
    var box = document.getElementById("wList"); if (!box) return;
    var c = wCounts(), a = document.getElementById("wcL"), b = document.getElementById("wcD");
    if (a) a.textContent = c.learning; if (b) b.textContent = c.learned;
    var tabs = document.querySelectorAll("[data-wf]");
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle("on", tabs[i].getAttribute("data-wf") === WF);
    box.innerHTML = ""; var shown = 0;
    Object.keys(WD).forEach(function (tid) {
      var tp = V.topics[tid]; if (!tp || !tp.cards) return;
      var s = WD[tid] || "", items = [];
      for (var k = 0; k < s.length; k++) {
        var v = wv(s.charAt(k)), cd = tp.cards[k];
        if (v < 0 || !cd || cd.type === "speak") continue;
        if (WF === "learning" && v >= WMAX) continue;
        if (WF === "learned" && v < WMAX) continue;
        items.push({ v: v, c: cd });
      }
      if (!items.length) return;
      var g = E("div", "wgrp glass");
      g.appendChild(E("div", "wgh", esc((tp.emoji || "") + " " + (tp.title || tid)) + ' <span>' + (tp.track === "es" ? "испанский" : "английский") + "</span>"));
      items.sort(function (x, y) { return y.v - x.v; }).forEach(function (it) {
        var en = wEntry(it.c), done = it.v >= WMAX, row = E("div", "wrow" + (done ? " done" : ""));
        var dots = ""; for (var d = 0; d < WMAX; d++) dots += '<i class="' + (d < it.v ? "on" : "") + '"></i>';
        row.innerHTML = '<div class="wtx"><b>' + esc(en.t) + "</b><small>" + esc(en.r) + '</small></div><div class="wdots">' + (done ? "🎓" : dots) + "</div>";
        if (en.t && !hasCyr(en.t)) {
          var sb = E("button", "v3sb sayb", "🔊"), lang = DEF_LANG[tp.track];
          sb.onclick = function () { haptic("light"); say(en.t, lang, 0.9); };
          row.appendChild(sb);
        }
        g.appendChild(row); shown++;
      });
      box.appendChild(g);
    });
    if (!shown) box.appendChild(E("div", "wempty glass", WF === "learned" ? "Пока пусто. Ответь верно 5 раз на слово — и оно переедет сюда 🎓" : "Пройди любой раунд — слова из него появятся здесь 📚"));
    renderVoiceBox();
  };
  var SAMPLE = { es: "Hola, ¿qué tal? Me alegro mucho de verte.", en: "Hi! Nice to meet you. How's your day going?" };
  function renderVoiceBox() {
    var vb = document.getElementById("voiceBox"); if (!vb) return;
    var r0 = VS.rate || 1;
    vb.innerHTML = '<div class="vrow" style="margin:0"><span>🐢 Темп речи</span><div class="vrate">' + [[0.8, "медленно"], [1, "норм"], [1.15, "быстро"]].map(function (x) { return '<button data-vr="' + x[0] + '" class="' + (Math.abs(r0 - x[0]) < 0.01 ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + "</div></div>";
    Array.prototype.forEach.call(vb.querySelectorAll("[data-vr]"), function (b) { b.onclick = function () { VS.rate = parseFloat(b.getAttribute("data-vr")); vsSave(); renderVoiceBox(); say(SAMPLE.es, "es-ES", 1); }; });
    return;
    if (!SAY_OK) { vb.innerHTML = '<div class="label">🎙 Голос</div><p class="vhint">В этом браузере озвучки нет 😕</p>'; return; }
    var h = '<div class="label">🎙 Голос озвучки</div>';
    [["es", "es-ES", "Испанский"], ["en", "en-US", "Английский"]].forEach(function (L) {
      var list = voicesFor(L[1]), cur = pickVoice(L[1]);
      h += '<div class="vrow"><span>' + L[2] + '</span><select data-vl="' + L[0] + '">';
      if (!list.length) h += "<option>голос не найден</option>";
      list.forEach(function (v) { h += '<option value="' + esc(v.voiceURI || v.name) + '"' + (cur && v === cur ? " selected" : "") + ">" + esc(v.name + " · " + v.lang) + "</option>"; });
      h += '</select><button class="v3sb" data-vt="' + L[1] + '">▶️</button></div>';
    });
    var r = VS.rate || 1;
    h += '<div class="vrow"><span>Темп</span><div class="vrate">' + [[0.8, "🐢 медленно"], [1, "норм"], [1.15, "🐇 быстро"]].map(function (x) { return '<button data-vr="' + x[0] + '" class="' + (Math.abs(r - x[0]) < 0.01 ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + "</div></div>";
    h += '<p class="vhint">Самые живые голоса: <b>Edge</b> (Natural), <b>Android</b> — Google. iPhone: Настройки → Универсальный доступ → Устный контент → Голоса → скачай голос с пометкой «Улучшенный».</p>';
    vb.innerHTML = h;
    Array.prototype.forEach.call(vb.querySelectorAll("select[data-vl]"), function (sel) { sel.onchange = function () { VS[sel.getAttribute("data-vl")] = sel.value; vsSave(); trk("voice_changed", { lang: sel.getAttribute("data-vl") }); }; });
    Array.prototype.forEach.call(vb.querySelectorAll("[data-vt]"), function (b) { b.onclick = function () { var l = b.getAttribute("data-vt"); say(SAMPLE[l.slice(0, 2)], l, 1); }; });
    Array.prototype.forEach.call(vb.querySelectorAll("[data-vr]"), function (b) { b.onclick = function () { VS.rate = parseFloat(b.getAttribute("data-vr")); vsSave(); renderVoiceBox(); say(SAMPLE.es, "es-ES", 1); }; });
  }
  if (SAY_OK) { try { speechSynthesis.addEventListener("voiceschanged", function () { if (window.current === "words") renderVoiceBox(); }); } catch (e) {} }

  // ---------- v3.4: поделиться с другом ----------
  window.shareResult = function () {
    var xp = window.LB_LAST_XP || 0, app = "https://t.me/LingoBrainBOT";
    var text = "Мой раунд в Lingo Brain: " + xp + " XP! Попробуй обогнать меня 🧠";
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
  window.__v3.say = say; window.__v3.wordMark = wordMark; window.__v3.wCounts = wCounts; window.__v3.WD = function () { return WD; }; window.__v3.wMerge = wMerge; window.__v3.startRun = startRun; window.__v3.aKey = aKey; window.__v3.audioFor = audioFor; window.__v3.audioInfo = function () { return { count: AUD_N }; }; window.__v3.setNeural = function (on) { VS.neural = !!on; vsSave(); }; loadAudioMap(); window.__v3.wEntry = wEntry; window.__v3.voicesFor = voicesFor; window.__v3.pickVoice = pickVoice; window.__v3.VS = function () { return VS; };

  // ---------- стили ----------
  var css = "" +
    ".v3row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:12px 0 18px}" +
    ".v3b{background:var(--card);border:1px solid var(--line);color:var(--text);border-radius:20px;padding:12px 6px;font-weight:800;font-size:13px;font-family:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;box-shadow:0 4px 0 rgba(0,0,0,.25);transition:transform .1s}" +
    ".v3b:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.25)}" +
    ".v3b .e{font-size:24px;line-height:1.2}.v3b small{color:var(--muted);font-weight:700;font-size:11px}" +
    ".v3b.low{border-color:rgba(16,185,129,.45)}.v3b.sur{border-color:rgba(247,160,70,.45)}.v3b.cat{border-color:rgba(157,124,216,.45)}" +
    ".v3seg{display:flex;gap:8px;margin-bottom:16px}.v3seg button{flex:1;padding:12px;border-radius:16px;border:1px solid var(--line);background:var(--card);color:var(--muted);font-weight:800;font-size:15px;font-family:inherit;cursor:pointer}" +
    ".v3seg button.on{color:#1A1B26;background:var(--acc);border-color:transparent}" +
    ".v3block{margin-bottom:18px}.v3bh{display:flex;justify-content:space-between;align-items:baseline;margin:0 2px 8px}.v3bh b{font-size:16px}.v3bh span{font-size:12px;color:var(--dim);font-weight:800}" +
    ".v3code{display:inline-block;font-size:11px;font-weight:900;letter-spacing:.5px;padding:2px 6px;border-radius:7px;background:rgba(0,0,0,.2);margin-right:6px;vertical-align:1px}" +
    "img.emj{width:1.2em;height:1.2em;display:inline-block;vertical-align:-0.22em;margin:0 .04em;pointer-events:none;user-select:none}.emjf{font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif}" +
    ".v3off{font-size:13px;color:var(--muted);padding:10px 12px;border-radius:14px;background:rgba(247,118,142,.1);border:1px solid rgba(247,118,142,.3);margin-bottom:12px}" +
    "@keyframes v3glow{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}50%{box-shadow:0 0 0 4px rgba(16,185,129,.35)}}" +
    ".v3t{display:flex;align-items:center;gap:12px;padding:12px 14px;margin-bottom:8px;cursor:pointer;border-radius:18px}" +
    ".v3t .em{width:40px;height:40px;flex:none;display:flex;align-items:center;justify-content:center;font-size:24px;line-height:1;border-radius:12px;background:rgba(255,255,255,.05)}.v3t .em img.emj,.v3hero .em img.emj,.v3act .e img.emj,.v3b .e img.emj{width:1em;height:1em;margin:0;vertical-align:0}.v3t .tt{min-width:0;overflow-wrap:anywhere}.v3t .tt small{display:block;font-size:11px;color:var(--muted);font-weight:700;margin-top:2px}.v3t .tt{flex:1;font-weight:700;font-size:15px;line-height:1.3}.v3t .lv{font-size:11px;font-weight:800;color:var(--muted);padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.06)}" +
    ".v3t .st{font-size:14px;color:var(--acc);font-weight:800}.v3t.planned .tt,.v3t.planned .lv,.v3t.planned .st{opacity:.5}.v3t.planned .em{filter:grayscale(.7);opacity:.75}.v3t.locked{background:rgba(255,255,255,.025)!important;border-color:rgba(255,255,255,.05)!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}.v3t.locked .tt{color:#7A80A3;opacity:1}.v3t.locked .tt small{color:#6B7194}.v3t.locked .em{filter:grayscale(1);opacity:.4}.v3t.locked .lv{color:#5C6390;background:rgba(255,255,255,.035)}.v3t.locked .st{color:#5C6390;filter:grayscale(1);opacity:.55}.v3t.fresh{border-color:var(--ok);animation:v3glow 1.2s ease-in-out 3}.v3t.ready{border-color:var(--acc)}" +
    ".v3hero{padding:20px;margin-bottom:14px;text-align:center}.v3hero .em{font-size:46px;line-height:1.2;min-height:60px;display:flex;align-items:center;justify-content:center}.v3hero h2{font-size:21px;margin:6px 0 4px}.v3hero p{color:var(--muted);font-size:13px}" +
    ".v3act{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:15px 14px;margin-bottom:10px;border-radius:20px;background:var(--card);border:1px solid var(--line);color:var(--text);font-weight:800;font-size:15px;font-family:inherit;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.25)}" +
    ".v3act .e{font-size:24px;width:32px;flex:none;display:flex;justify-content:center;line-height:1}.v3act small{display:block;color:var(--muted);font-weight:700;font-size:12px;margin-top:2px}.v3act:active{transform:translateY(3px)}" +
    ".v3bar{height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;margin:4px 0 16px}.v3bar i{display:block;height:100%;width:100%;background:var(--acc);border-radius:99px;transform-origin:left center;will-change:transform}" +
    ".v3cs{padding:13px 14px;margin-bottom:8px;display:flex;gap:10px;align-items:flex-start;cursor:pointer}.v3cs .w{flex:1}.v3cs b{font-size:16px}.v3cs .tr{color:var(--muted);font-size:13px;margin-top:2px}.v3cs .ex{color:var(--dim);font-size:13px;font-style:italic;margin-top:4px}" +
    ".v3timer{min-width:44px;height:44px;border-radius:15px;display:grid;place-items:center;font-weight:800;background:var(--card);border:1px solid var(--line);color:var(--ok)}" +
    ".v3fb{padding:16px;margin-top:6px;border-radius:20px;border:1px solid var(--line);animation:fade .25s}" +
    ".v3fb.ok{background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.5)}.v3fb.bad{background:rgba(247,118,142,.1);border-color:rgba(247,118,142,.5)}" +
    ".v3fb h3{font-size:17px;margin-bottom:6px}.v3fb p{color:var(--muted);font-size:14px;line-height:1.45;margin-bottom:12px}" +
    ".v3slot{min-height:58px;padding:10px;border-radius:18px;border:2px dashed var(--line);display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}" +
    ".v3pool{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}" +
    ".v3chip{padding:11px 14px;border-radius:14px;background:var(--card);border:1px solid var(--line);color:var(--text);font-weight:800;font-size:16px;font-family:inherit;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.25)}" +
    ".v3chip.in{background:rgba(255,255,255,.1);border-color:var(--acc)}.v3chip.used{visibility:hidden}" +
    ".v3big{font-size:28px;font-weight:800;text-align:center;margin:10px 0}.v3sub{text-align:center;color:var(--muted);font-size:15px}" +
    ".v3play{width:84px;height:84px;border-radius:50%;border:none;background:var(--acc);font-size:34px;cursor:pointer;display:block;margin:6px auto 10px;box-shadow:0 0 0 8px rgba(255,255,255,.05),0 0 30px var(--acc)}" +
    ".v3center{text-align:center}.v3row2{display:flex;gap:10px}.v3row2 .btn{margin-top:0}" +
    ".v3chat{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}" +
    ".v3msg{max-width:86%;padding:12px 14px;border-radius:18px;font-size:16px;line-height:1.4;animation:fade .25s}" +
    ".v3msg.bot{align-self:flex-start;background:var(--card);border:1px solid var(--line);border-bottom-left-radius:6px}" +
    ".v3msg.me{align-self:flex-end;background:var(--acc);color:#1A1B26;font-weight:700;border-bottom-right-radius:6px}" +
    ".v3msg .who{font-size:11px;font-weight:800;color:var(--dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}" +
    ".v3msg .tr{font-size:13px;color:var(--muted);margin-top:4px}.v3msg .sp{background:none;border:none;font-size:16px;cursor:pointer;padding:0 0 0 6px}" +
    ".v3note{align-self:center;font-size:13px;color:var(--muted);text-align:center;padding:2px 10px}" +
    ".v3modal{position:fixed;inset:0;background:rgba(10,11,18,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:50;display:none;align-items:flex-end;justify-content:center;padding:16px}" +
    ".v3modal.show{display:flex}.v3box{width:100%;max-width:480px;padding:22px 18px;animation:v3up .3s ease}" +
    ".v3gift{font-size:56px;text-align:center;animation:v3pop .5s ease}.v3box h3{text-align:center;font-size:19px;margin:6px 0 10px}.v3box .tx{font-size:16px;line-height:1.5;text-align:center;margin-bottom:16px}" +
    "@keyframes v3up{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}@keyframes v3pop{0%{transform:scale(.3) rotate(-20deg)}70%{transform:scale(1.15) rotate(6deg)}100%{transform:none}}" +
    ".v3fz{display:flex;align-items:center;gap:12px}.v3fz .e{font-size:30px}.v3fz p{color:var(--muted);font-size:13px;margin-top:2px}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---------- разметка ----------
  function section(id, html) { var s = E("section", "screen", html); s.id = "scr_" + id; $("sheet").parentNode.insertBefore(s, $("sheet")); return s; }
  section("catalog", '<div class="header"><button class="iconbtn" onclick="show(\'home\')">←</button><h1>📚 Все темы</h1></div><div class="v3seg"><button data-t="es">🇪🇸 Испанский</button><button data-t="en">🇬🇧 Английский</button></div><div id="v3cat"></div>');
  section("topic", '<div class="header"><button class="iconbtn" onclick="show(\'catalog\')">←</button><h1 id="v3tTitle"></h1></div><div id="v3topic"></div>');
  section("cheat", '<div class="header"><button class="iconbtn" id="v3cBack">←</button><h1>⚡ Шпаргалка · 30 сек</h1></div><div class="v3bar"><i id="v3cBar"></i></div><div id="v3cheat"></div>');
  section("play", '<div class="qtop"><button class="iconbtn" onclick="goBack()" style="font-size:24px">×</button><div class="dots center big" id="v3dots"></div><div class="v3timer" id="v3timer">⚡</div></div><div id="v3body"></div>');
  section("scen", '<div class="qtop"><button class="iconbtn" onclick="goBack()" style="font-size:24px">×</button><div style="font-weight:800;text-align:center;flex:1" id="v3sTitle"></div><div class="v3timer" id="v3sPts">0</div></div><div class="v3chat" id="v3chat"></div><div id="v3choices"></div>');
  var modal = E("div", "v3modal", '<div class="v3box glass" id="v3box"></div>'); modal.id = "v3modal"; document.body.appendChild(modal);
  modal.addEventListener("click", function (e) { if (e.target === modal) modal.classList.remove("show"); });

  // главная: три кнопки + чип заморозок
  var quick = document.querySelector(".quick");
  var row = E("div", "v3row", '<button class="v3b low" id="v3low"><span class="e">🪫</span>Нет сил<small>45 сек</small></button><button class="v3b sur" id="v3sur"><span class="e">🎁</span>Сюрприз<small>+5 XP</small></button><button class="v3b cat" id="v3catBtn"><span class="e">📚</span>Все темы<small id="v3catN">50</small></button>');
  quick.parentNode.insertBefore(row, quick.nextSibling);
  var chips = document.querySelector("#scr_home .chips");
  var fz = E("div", "chip glass", '🧊 <span id="v3fzN">0</span>'); fz.onclick = function () { show("profile"); }; chips.insertBefore(fz, chips.firstChild);
  var nav = document.querySelector(".nav");
  var nb = E("button", null, '<span class="i">📚</span>Темы'); nb.setAttribute("data-go", "catalog"); nb.onclick = function () { show("catalog"); };
  nav.insertBefore(nb, nav.lastElementChild);
  // прогресс: заморозки
  var prof = $("scr_profile");
  var fzCard = E("div", "pcard glass", '<div class="v3fz"><span class="e">🧊</span><div style="flex:1"><b>Заморозка серии: <span id="v3fzP">0</span>/2</b><p>День пропущен — заморозка сама спасёт серию. Без чувства вины.</p></div></div><button class="btn" id="v3fzBuy" style="margin-top:12px">Купить за 50 XP</button>');
  prof.insertBefore(fzCard, prof.children[2] || null);

  $("v3low").onclick = function () { lowEnergy(); };
  $("v3sur").onclick = function () { surprise(); };
  $("v3catBtn").onclick = function () { show("catalog"); };
  $("v3fzBuy").onclick = function () { buyFreeze(); };
  Array.prototype.forEach.call(document.querySelectorAll(".v3seg button"), function (b) { b.onclick = function () { V.track = b.getAttribute("data-t"); haptic("select"); renderCatalog(); }; });

  // ---------- заморозка серии ----------
  function fzCost() { return (V.cfg && V.cfg.streakFreeze && V.cfg.streakFreeze.costXp) || 50; }
  function fzMax() { return (V.cfg && V.cfg.streakFreeze && V.cfg.streakFreeze.maxStored) || 2; }
  function daysBetween(a, b) { var x = new Date(a + "T12:00:00"), y = new Date(b + "T12:00:00"); return Math.round((y - x) / 86400000); }
  function applyFreeze() {
    if (!S.lastDay || !S.streak) return;
    var gap = daysBetween(S.lastDay, dayStr()), missed = gap - 1;
    if (missed < 1 || (S.freezes || 0) < missed) return;
    S.freezes -= missed; S.lastDay = yesterday(); save();
    setTimeout(function () { toast((V.cfg && V.cfg.streakFreeze && V.cfg.streakFreeze.message) || "🧊 Серия заморожена"); }, 400);
  }
  function buyFreeze() {
    var c = fzCost();
    if ((S.freezes || 0) >= fzMax()) { toast("🧊 Уже максимум заморозок"); return; }
    if (S.xp < c) { toast("Нужно ещё " + (c - S.xp) + " XP ⚡"); haptic("warning"); return; }
    S.xp -= c; S.freezes = (S.freezes || 0) + 1; save(); haptic("success"); toast("🧊 Заморозка в запасе!"); renderFreeze();
  }
  function renderFreeze() {
    var n = S.freezes || 0, c = fzCost();
    if ($("v3fzN")) $("v3fzN").textContent = n;
    $("v3fzP").textContent = n; $("v3fzP").parentNode.lastChild.textContent = "/" + fzMax();
    var b = $("v3fzBuy"); b.textContent = n >= fzMax() ? "🧊 Запас полный" : "Купить за " + c + " XP";
    b.style.opacity = (n >= fzMax() || S.xp < c) ? ".5" : "1";
  }

  // ---------- обёртки над старыми функциями ----------
  var _show = window.show, _goBack = window.goBack, _renderHome = window.renderHome, _again = window.again, _start = window.start;
  window.show = function (n) {
    _show(n);
    if (n === "play" || n === "scen" || n === "cheat") document.body.classList.add("focus");
    if (n === "catalog") renderCatalog();
    if (n === "profile") renderFreeze();
    if (n !== "play") stopTimer();
    if (n !== "cheat") stopCheat();
  };
  window.goBack = function () {
    if (current === "play" || current === "scen") { if (window.speechSynthesis) speechSynthesis.cancel(); toast("Пауза — это ок 💛"); if (V.run && V.run.topicId) openTopic(V.run.topicId); else show("home"); return; }
    if (current === "cheat") { openTopic(V.cheatId); return; }
    if (current === "topic") { show("catalog"); return; }
    if (current === "catalog") { show("home"); return; }
    _goBack();
  };
  window.renderHome = function () { _renderHome(); applyFreeze(); $("streak").textContent = currentStreak(); $("xp").textContent = S.xp; renderFreeze(); };
  window.again = function () { if (V.lastRun && LAST.topic === V.lastRun.key) V.lastRun.fn(); else _again(); };
  window.start = function (l, k) { if (k && String(k).indexOf(".") > 0) return openTopic(k); return _start(l, k); };
  if (window.tg && ver("6.1")) { try { tg.BackButton.offClick(_goBack); } catch (e) {} tg.BackButton.onClick(function () { window.goBack(); }); }

  window.__v3.openTopic = openTopic; window.__v3.renderCatalog = renderCatalog; window.__v3.lowEnergy = lowEnergy; window.__v3.surprise = surprise; window.__v3.openCheat = openCheat; window.__v3.runTopicCards = runTopicCards; window.__v3.prep = prep; window.__v3.isPassed = isPassed; window.__v3.setTrack = setTrack;
  // ---------- каталог ----------
  function renderCatalog() {
    Array.prototype.forEach.call(document.querySelectorAll(".v3seg button"), function (b) { b.classList.toggle("on", b.getAttribute("data-t") === V.track); });
    setTrack(V.track);
    var box = $("v3cat"); box.innerHTML = "";
    if (!V.cat) {
      box.appendChild(E("div", "pcard glass v3center", V.failed ? '<p style="margin-bottom:12px">Не получилось загрузить темы 😕 Проверь интернет.</p><button class="btn" id="v3retry">🔄 Ещё раз</button>' : "<p>Загружаю темы… 🧠</p>"));
      if ($("v3retry")) $("v3retry").onclick = function () { V.failed = false; renderCatalog(); loadAll().then(function () { if (current === "catalog") renderCatalog(); }); };
      return;
    }
    var t = V.cat.tracks.filter(function (x) { return x.id === V.track; })[0];
    if (V.offline) box.appendChild(E("div", "v3off", "📴 Нет интернета — показываю сохранённые темы. Прогресс сохраняется на телефоне."));
    var all = 0, rd = 0;
    t.blocks.forEach(function (b) { b.topics.forEach(function (tp) { all++; if (tp.status === "ready") rd++; }); });
    box.appendChild(E("p", null, '<span style="color:var(--muted);font-size:13px">' + esc(t.subtitle) + " · готово " + rd + " из " + all + " · новые темы появляются регулярно</span>")).style.marginBottom = "14px";
    t.blocks.slice().sort(function (a, b) { return a.order - b.order; }).forEach(function (b) {
      var nextId = null; b.topics.forEach(function (x) { if (!nextId && x.status === "ready" && V.topics[x.id] && !isPassed(x.id)) nextId = x.id; });
      var bl = E("div", "v3block", '<div class="v3bh"><b>' + b.emoji + " " + esc(b.title) + "</b><span>" + esc(b.levelRange) + "</span></div>");
      b.topics.forEach(function (tp) {
        var has = !!(tp.status === "ready" && V.topics[tp.id]), open = has && isOpen(tp.id), done = has && isPassed(tp.id), pv = has && !open ? prevOf(tp.id) : null;
        var cls = open ? "ready" : (has ? "locked" : "planned"); if (open && V.fresh === tp.id) cls += " fresh";
        var st = open ? (done ? "✅" : "▶") : (has ? "🔒" : "🛠");
        var r = E("div", "v3t glass " + cls, '<span class="em">' + tp.emoji + '</span><span class="tt">' + esc(tp.title) + (pv ? "<small>Откроется после «" + esc(pv.title) + "» от 60%</small>" : "") + (open && tp.id === nextId ? "<small>👉 Следующая по порядку</small>" : "") + '</span><span class="lv">' + esc(tp.level) + '</span><span class="st">' + st + "</span>");
        r.onclick = function () { if (open) { haptic("medium"); V.fresh = null; openTopic(tp.id); } else if (has) { haptic("warning"); toast("🔒 Сначала пройди «" + (pv ? pv.title : "предыдущую тему") + "» — раунд от 60%"); } else { haptic("soft"); toast("🛠 Скоро! Тема в работе"); } };
        bl.appendChild(r);
      });
      box.appendChild(bl);
    });
  }

  // ---------- экран темы ----------
  function openTopic(id) {
    if (V.cat && V.topics[id] && !isOpen(id)) { haptic("warning"); toast("🔒 Тема пока закрыта — пройди предыдущую от 60%"); return; }
    var t = V.topics[id]; if (!t) { toast("🛠 Скоро!"); return; }
    V.track = t.track; setTrack(t.track); LAST = { lang: t.track, topic: id }; trk("topic_selected", { topic_id: id, track: t.track, level: t.level || null });
    $("v3tTitle").textContent = t.emoji + " " + t.title;
    var box = $("v3topic"); box.innerHTML = "";
    box.appendChild(E("div", "v3hero glass", '<div class="em">' + t.emoji + "</div><h2>" + esc(t.title) + "</h2><p>Уровень " + esc(t.level) + " · " + t.cards.length + " карточек · " + (t.scenarios || []).length + " сценарий</p>"));
    function act(e, title, sub, fn) { var b = E("button", "v3act", '<span class="e">' + e + "</span><span>" + title + "<small>" + sub + "</small></span>"); b.onclick = fn; box.appendChild(b); }
    if (t.cheatsheet && t.cheatsheet.length) act("⚡", "Шпаргалка за 30 сек", t.cheatsheet.length + " ключевых слов, " + (SAY_OK ? "нажми 🔊 — услышишь" : "прочитай и запомни"), function () { openCheat(id); });
    act("🃏", "Раунд · 2 мин", "5 карточек: выбор, слух, конструктор, речь", function () { runTopicCards(id, "normal"); });
    (t.scenarios || []).forEach(function (s) { act(s.emoji || "🎭", "Сценарий: " + esc(s.title), "Живой диалог с выбором реплик", function () { runScenario(id, s.id); }); });
    act("🚀", "Гиперфокус", "Все " + t.cards.length + " карточек · XP ×1.5", function () { runTopicCards(id, "boost"); });
    show("topic"); haptic("light");
  }

  // ---------- шпаргалка ----------
  var cheatT = null;
  function stopCheat() { if (cheatT) { cancelAnimationFrame(cheatT); cheatT = null; } }
  function openCheat(id) {
    var t = V.topics[id]; V.cheatId = id;
    var lang = DEF_LANG[t.track], box = $("v3cheat"); box.innerHTML = "";
    t.cheatsheet.forEach(function (c) {
      var r = E("div", "v3cs glass", '<div class="w"><b></b><div class="tr"></div>' + (c.ex ? '<div class="ex"><span></span><button class="v3sb sayb x" aria-label="пример">🔊</button></div>' : "") + '</div><button class="v3sb sayb t" aria-label="слово">🔊</button>');
      r.querySelector("b").textContent = c.term; r.querySelector(".tr").textContent = c.tr; if (c.ex) r.querySelector(".ex span").textContent = c.ex;
      r.querySelector(".v3sb.t").onclick = function (e) { e.stopPropagation(); haptic("light"); say(c.term, lang, 0.9); };
      if (c.ex) r.querySelector(".v3sb.x").onclick = function (e) { e.stopPropagation(); haptic("light"); say(c.ex, lang, 0.9); };
      r.onclick = function () { haptic("light"); say(c.ex && r.classList.contains("heard") ? c.ex : c.term, lang, 0.9); r.classList.add("heard"); };
      box.appendChild(r);
    });
    var go = E("button", "btn", "🃏 Закрепить карточками →"); go.style.marginTop = "8px"; go.onclick = function () { runTopicCards(id, "normal"); }; box.appendChild(go);
    $("v3cBack").onclick = function () { openTopic(id); };
    var bar = $("v3cBar"), t0 = 0, DUR = 30000; bar.style.transition = "none"; bar.style.width = "100%"; bar.style.transform = "scaleX(1)";
    show("cheat");
    stopCheat();
    var tick = function (now) { if (!t0) t0 = now; var k = Math.max(0, 1 - (now - t0) / DUR); bar.style.transform = "scaleX(" + k.toFixed(4) + ")"; if (k > 0) cheatT = requestAnimationFrame(tick); else { cheatT = null; haptic("success"); toast("⏱ 30 сек! Теперь закрепим 💪"); } };
    cheatT = requestAnimationFrame(tick);
  }

  // ---------- карточки ----------
  function fromLegacy(l, c) { return { type: "choice", q: c.q, options: c.o, answer: c.a, explain: c.tip, sayText: c.say, lang: DATA[l].tts, track: l }; }
  function prep(t, c) { var x = {}; for (var k in c) x[k] = c[k]; x.track = t.track; x.topicId = t.id; x.idx = t.cards.indexOf(c); x.lang = c.lang || (c.audio && c.audio.lang) || DEF_LANG[t.track]; return x; }
  function runTopicCards(id, mode) {
    var t = V.topics[id], m = (V.cfg && V.cfg.energyModes && V.cfg.energyModes[mode]) || { cards: 5, cardEnergy: ["low", "normal"], xpMultiplier: 1 };
    var pool = t.cards.filter(function (c) { return m.cardEnergy.indexOf(c.energy || "normal") >= 0; });
    if (mode === "boost") pool = t.cards.slice();
    var cards = (mode === "boost" ? pool : shuffle(pool.slice()).slice(0, m.cards)).map(function (c) { return prep(t, c); });
    LAST = { lang: t.track, topic: id };
    V.lastRun = { key: id, fn: function () { runTopicCards(id, mode); } };
    startRun({ cards: cards, topicId: id, mult: m.xpMultiplier || 1, seconds: 0, title: t.emoji + " " + t.title });
  }
  function lowEnergy() {
    var m = (V.cfg && V.cfg.energyModes && V.cfg.energyModes.low) || { seconds: 45, cards: 3 };
    var pool = [];
    var LL = window.lbLang ? window.lbLang() : null;
    Object.keys(V.topics).forEach(function (id) { var t = V.topics[id]; if (LL && t.track !== LL) return; t.cards.forEach(function (c) { if (c.energy === "low") pool.push(prep(t, c)); }); });
    ["es", "en"].forEach(function (l) { if (LL && l !== LL) return; Object.keys(DATA[l].topics).forEach(function (k) { var tp = DATA[l].topics[k]; if (!tp.speak) tp.cards.forEach(function (c) { pool.push(fromLegacy(l, c)); }); }); });
    var cards = shuffle(pool).slice(0, m.cards || 3);
    LAST = { lang: cards[0] ? cards[0].track : "es", topic: "low" };
    V.lastRun = { key: "low", fn: lowEnergy }; trk("energy_mode_used", { track: LAST.lang, cards: cards.length });
    toast("🪫 Мини-раунд. 3 лёгкие карточки — и серия цела 💛");
    startRun({ cards: cards, topicId: null, mult: 1, seconds: m.seconds || 45, title: "🪫 Нет сил" });
  }

  var timerT = null;
  function stopTimer() { if (timerT) { clearInterval(timerT); timerT = null; } }
  function startRun(r) {
    r.pos = 0; r.score = 0; r.xp = 0; r.combo = 0; r.mistakes = []; r.review = false; r.hadReview = false; r.fixed = 0; r.mainN = r.cards.length; V.run = r;
    stopTimer();
    var tm = $("v3timer");
    if (r.seconds) {
      r.left = r.seconds; tm.textContent = r.left; tm.style.color = "var(--ok)";
      timerT = setInterval(function () { r.left--; tm.textContent = Math.max(0, r.left); if (r.left <= 10) tm.style.color = "var(--es)"; if (r.left <= 0) { stopTimer(); toast("⏱ Время! Ты всё равно молодец 💛"); endMain(); } }, 1000);
    } else tm.textContent = "⚡";
    show("play"); haptic("medium"); renderStep();
  }
  function finishRun() {
    var r = V.run; stopTimer(); if (window.speechSynthesis) speechSynthesis.cancel(); wSaveCloud();
    var n = Math.max(1, r.mainN || r.cards.length);
    var un = (r.topicId && V.topics[r.topicId]) ? checkUnlock(r.topicId, r.score / n) : null;
    complete(r.score, n, Math.round(r.xp * (r.mult || 1)));
    if (r.hadReview) { try { $("resTitle").textContent = "Идеально! 💪"; $("resEmoji").textContent = "⚡️"; $("resSub").textContent = "Сразу верно " + r.score + " из " + n + " · ошибки исправлены: " + r.fixed + ". Так и запоминается!"; } catch (e) {} }
    if (un) setTimeout(function () { haptic("success"); toast("🔓 Открыта новая тема: " + un.emoji + " " + un.title); }, 1600); else if (V.nextHint) { var nh = V.nextHint; V.nextHint = null; setTimeout(function () { toast("👉 Дальше по порядку: " + nh.emoji + " " + nh.title); }, 1600); }
    renderFreeze();
  }
  function endMain() {
    var r = V.run; if (!r) return;
    stopTimer();
    if (r.mistakes && r.mistakes.length) {
      r.review = true; r.hadReview = true; r.cards = r.mistakes; r.mistakes = []; r.pos = 0;
      var tm = $("v3timer"); if (tm) { tm.textContent = "⚡"; tm.style.color = "var(--es)"; }
      haptic("medium"); toast("⚡️ Работа над ошибками — закрепи результат");
      try { trk("mistake_review", { n: r.cards.length }); } catch (e) {}
      renderStep();
    } else finishRun();
  }
  function nextStep() { var r = V.run; haptic("light"); r.pos++; if (r.pos >= r.cards.length) endMain(); else renderStep(); }
  function feedback(ok, title, tip, sayIt) {
    var r = V.run, body = $("v3body");
    var fb = E("div", "v3fb " + (ok ? "ok" : "bad"), "<h3></h3>" + (tip ? "<p></p>" : "") + '<div class="v3row2">' + (sayIt ? '<button class="btn ghost sayb" style="flex:0 0 64px;margin:0">🔊</button>' : "") + '<button class="btn ' + (ok ? "ok" : "err") + '"></button></div>');
    fb.querySelector("h3").innerHTML = title; if (tip) fb.querySelector("p").innerHTML = tip;
    var btns = fb.querySelectorAll("button"), nx = btns[btns.length - 1];
    nx.textContent = r.pos + 1 >= r.cards.length ? (r.mistakes && r.mistakes.length ? "⚡️ Работа над ошибками" : "🏁 Итог") : "Дальше →"; nx.onclick = nextStep;
    if (sayIt) btns[0].onclick = sayIt;
    body.appendChild(fb);
    $("v3dots").innerHTML = dots(r.pos + 1, r.cards.length, false);
    setTimeout(function () { fb.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 50);
  }
  function grade(ok, pts) {
    try { if (window.lbOnGrade) window.lbOnGrade(V.run && V.run.cards && V.run.cards[V.run.pos], ok, V.run); } catch (e) {}
    try { wordMark(V.run && V.run.cards && V.run.cards[V.run.pos], ok); } catch (e) {}
    var r = V.run, cur = r.cards && r.cards[r.pos];
    if (!ok && r.mistakes && cur && r.mistakes.indexOf(cur) < 0) r.mistakes.push(cur);
    if (ok && r.review) { r.fixed++; r.combo++; r.xp += Math.round(cfgXp("correct", 10) / 2); haptic("success"); return; }
    if (ok) { r.score++; r.combo++; r.xp += pts || cfgXp("correct", 10); haptic("success"); if (r.combo >= 3) toast("🔥 Комбо x" + r.combo + "!"); }
    else { r.combo = 0; r.xp += cfgXp("wrongButTried", 3); haptic("error"); }
  }
  function options(c, onDone) {
    var wrap = E("div"), locked = false;
    shuffle(c.options.map(function (_, i) { return i; })).forEach(function (i, n) {
      var b = E("button", "opt", '<span class="k">' + LETTERS.charAt(n) + "</span><span></span>"); b.lastChild.textContent = c.options[i]; b.setAttribute("data-i", i);
      b.onclick = function () {
        if (locked) return; locked = true;
        var ok = i === c.answer;
        Array.prototype.forEach.call(wrap.children, function (x) { var xi = +x.getAttribute("data-i"); x.classList.add(xi === c.answer ? "ok" : (x === b ? "bad" : "dim")); });
        onDone(ok);
      };
      wrap.appendChild(b);
    });
    return wrap;
  }
  function renderStep() {
    var r = V.run, c = r.cards[r.pos], body = $("v3body");
    if (!c) { finishRun(); return; }
    setTrack(c.track); body.innerHTML = "";
    $("v3dots").innerHTML = dots(r.pos, r.cards.length, true);
    var card = E("div", "qcard glass"); body.appendChild(card);
    var label = { choice: "🎯 Выбери", flash: "🃏 Вспомни", listen: "👂 Тренажёр уха", build: "🧩 Собери фразу", speak: "🎙 Скажи вслух" }[c.type] || "";
    card.appendChild(E("div", "qlabel", r.review ? "⚡️ Работа над ошибками (закрепи результат) · " + label : label + " · " + esc(r.title))); if (r.review) card.style.boxShadow = "0 0 0 2px var(--es) inset";

    if (c.type === "choice") {
      card.appendChild(E("div", "qtext", c.q));
      body.appendChild(options(c, function (ok) {
        grade(ok);
        var right = esc(c.options[c.answer]);
        feedback(ok, ok ? pick(PRAISE) : "Почти! Правильно: <b>" + right + "</b>", c.explain || "", c.sayText ? function () { say(c.sayText, c.lang, 0.95); } : null);
      }));
    } else if (c.type === "listen") {
      var a = c.audio, rate = a.rate || 1;
      card.appendChild(E("div", "v3center", '<div style="color:var(--muted);font-size:13px;font-weight:800">' + (ACCENT[a.lang] || a.lang) + " · темп " + rate + "</div>"));
      var pb = E("button", "v3play sayb", "🔊"); pb.onclick = function () { haptic("light"); say(a.text, a.lang, rate); }; card.appendChild(pb); if (!SAY_OK && !audioFor(a.text, a.lang)) card.appendChild(E("div", "v3sub", "🔇 Озвучка недоступна — прочитай: <b>" + esc(a.text) + "</b>"));
      var sl = E("button", "pill sayb", "🐢 Медленнее"); sl.onclick = function () { haptic("light"); say(a.text, a.lang, Math.max(0.5, rate * 0.7)); };
      var cw = E("div", "v3center"); cw.appendChild(sl); card.appendChild(cw);
      card.appendChild(E("div", "qtext", esc(c.q))).style.marginTop = "14px";
      setTimeout(function () { say(a.text, a.lang, rate); }, 350);
      body.appendChild(options(c, function (ok) {
        grade(ok);
        feedback(ok, ok ? pick(PRAISE) : "Почти! Правильно: <b>" + esc(c.options[c.answer]) + "</b>", "Звучало: <b>" + esc(a.text) + "</b>", function () { say(a.text, a.lang, rate); });
      }));
    } else if (c.type === "flash") {
      card.appendChild(E("div", "v3big", esc(c.front)));
      var back = E("div", "v3sub", esc(c.back)); back.style.display = "none"; card.appendChild(back);
      var sp = E("div", "v3center"); var pl = E("button", "pill sayb", "🔊 Послушать"); pl.onclick = function () { say(c.front, c.lang, 0.9); }; sp.appendChild(pl); card.appendChild(sp);
      var showB = E("button", "btn", "👀 Показать перевод"); body.appendChild(showB);
      showB.onclick = function () {
        haptic("light"); back.style.display = "block"; showB.remove();
        var row2 = E("div", "v3row2", '<button class="btn err">😅 Не помню</button><button class="btn ok">✅ Помню</button>');
        row2.children[0].onclick = function () { row2.remove(); grade(false); feedback(false, "Ничего, запомнится 🌱", "<b>" + esc(c.front) + "</b> = " + esc(c.back), function () { say(c.front, c.lang, 0.9); }); };
        row2.children[1].onclick = function () { row2.remove(); grade(true); feedback(true, pick(PRAISE), "", null); };
        body.appendChild(row2);
      };
    } else if (c.type === "build") {
      card.appendChild(E("div", "qtext", esc(c.prompt)));
      var slot = E("div", "v3slot"), pool = E("div", "v3pool"), picked = [];
      body.appendChild(slot); body.appendChild(pool);
      var chk = E("button", "btn", "Проверить"); chk.style.opacity = ".5"; body.appendChild(chk);
      var words = shuffle(c.tokens.concat(c.distractors || []).map(function (w, i) { return { w: w, i: i }; }));
      function redraw() {
        slot.innerHTML = "";
        picked.forEach(function (p, idx) { var ch = E("button", "v3chip in"); ch.textContent = p.w; ch.onclick = function () { haptic("light"); picked.splice(idx, 1); p.el.classList.remove("used"); redraw(); }; slot.appendChild(ch); });
        if (!picked.length) slot.appendChild(E("span", null, '<span style="color:var(--dim);font-size:14px;padding:8px">Нажимай на слова снизу 👇</span>'));
        chk.style.opacity = picked.length ? "1" : ".5";
      }
      words.forEach(function (o) { var ch = E("button", "v3chip"); ch.textContent = o.w; o.el = ch; ch.onclick = function () { if (ch.classList.contains("used")) return; haptic("light"); ch.classList.add("used"); picked.push(o); redraw(); }; pool.appendChild(ch); });
      redraw();
      chk.onclick = function () {
        if (!picked.length) return;
        var ok = picked.map(function (p) { return p.w; }).join(" ") === c.tokens.join(" ");
        chk.remove(); pool.style.pointerEvents = "none"; slot.style.pointerEvents = "none";
        grade(ok);
        var sent = c.tokens.join(" ");
        feedback(ok, ok ? pick(PRAISE) : "Почти! Правильно: <b>" + esc(sent) + "</b>", c.pattern ? "🧩 Шаблон: <b>" + esc(c.pattern) + "</b>" : "", function () { say(sent, c.lang, 0.95); });
        say(sent, c.lang, 0.95);
      };
    } else if (c.type === "speak") {
      card.appendChild(E("div", "v3big", esc(c.text)));
      card.appendChild(E("div", "v3sub", esc(c.tr || "")));
      var sw = E("div", "v3center"); sw.style.marginTop = "12px"; var lb = E("button", "pill sayb", "🔊 Послушать"); lb.onclick = function () { say(c.text, c.lang, 0.9); }; sw.appendChild(lb); card.appendChild(sw);
      setTimeout(function () { say(c.text, c.lang, 0.9); }, 350);
      body.appendChild(E("p", null, '<span style="color:var(--muted);font-size:14px">Скажи вслух 2 раза. Никто не слышит — можно смешно 😄</span>')).style.textAlign = "center";
      var done = E("button", "btn ok", "✅ Сказал(а) вслух"); done.style.marginTop = "12px"; body.appendChild(done);
      done.onclick = function () { done.remove(); grade(true, cfgXp("speak", 10)); feedback(true, "🎙 Голос прокачан!", "Каждая фраза вслух — минус один барьер.", null); };
    } else { nextStep(); }
  }

  // ---------- сценарии ----------
  function runScenario(topicId, sid) {
    var t = V.topics[topicId], s = (t.scenarios || []).filter(function (x) { return x.id === sid; })[0]; if (!s) return;
    setTrack(t.track); LAST = { lang: t.track, topic: sid };
    V.lastRun = { key: sid, fn: function () { runScenario(topicId, sid); } };
    V.run = { topicId: topicId, pts: 0, max: 0, steps: 0 };
    $("v3sTitle").textContent = (s.emoji || "🎭") + " " + s.title; $("v3sPts").textContent = "0";
    $("v3chat").innerHTML = ""; $("v3choices").innerHTML = "";
    $("v3chat").appendChild(E("div", "v3note", "Ты: " + esc(s.userRole || "ты") + " · собеседник: " + esc(s.botRole) + ". Выбирай реплики — ошибаться можно 💛"));
    show("scen"); haptic("medium");
    setTimeout(function () { node(s, s.start); }, 250);
  }
  function node(s, id) {
    var n = s.nodes[id], chat = $("v3chat"), ch = $("v3choices"), lang = s.voice || DEF_LANG[LAST.lang];
    var m = E("div", "v3msg bot", '<div class="who"></div><span class="tx"></span><button class="sp sayb">🔊</button>' + (n.tr ? '<div class="tr"></div>' : ""));
    m.querySelector(".who").textContent = s.botRole; m.querySelector(".tx").textContent = n.say; if (n.tr) m.querySelector(".tr").textContent = n.tr;
    m.querySelector(".sp").onclick = function () { say(n.say, lang, 0.9); };
    chat.appendChild(m); say(n.say, lang, 0.9);
    ch.innerHTML = "";
    if (n.end || !n.choices || !n.choices.length) {
      var r = V.run, fin = E("button", "btn ok", "🏁 Итог"); fin.style.marginTop = "8px";
      fin.onclick = function () { if (window.speechSynthesis) speechSynthesis.cancel(); complete(r.pts, Math.max(1, r.max), r.pts * cfgXp("scenarioChoicePerPoint", 5)); renderFreeze(); };
      ch.appendChild(fin); haptic("success");
      setTimeout(function () { fin.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 80);
      return;
    }
    V.run.max += Math.max.apply(null, n.choices.map(function (c) { return c.score || 0; }));
    shuffle(n.choices.slice()).forEach(function (c, i) {
      var b = E("button", "opt", '<span class="k">' + LETTERS.charAt(i) + "</span><span></span>"); b.lastChild.textContent = c.text;
      b.onclick = function () {
        ch.innerHTML = "";
        var me = E("div", "v3msg me", '<span class="tx"></span> <button class="sp sayb">🔊</button>'); me.querySelector(".tx").textContent = c.text; me.querySelector(".sp").onclick = function () { say(c.text, lang, 0.95); }; chat.appendChild(me);
        var sc = c.score || 0; V.run.pts += sc; $("v3sPts").textContent = V.run.pts;
        haptic(sc >= 2 ? "success" : sc === 1 ? "light" : "error");
        if (c.feedback) chat.appendChild(E("div", "v3note", (sc >= 2 ? "✅ " : sc === 1 ? "👍 " : "💡 ") + esc(c.feedback)));
        say(c.text, lang, 0.95);
        setTimeout(function () { node(s, c.next); setTimeout(function () { ch.scrollIntoView({ behavior: "smooth", block: "end" }); }, 60); }, 1100);
      };
      ch.appendChild(b);
    });
    setTimeout(function () { ch.scrollIntoView({ behavior: "smooth", block: "end" }); }, 60);
  }

  // ---------- Surprise Box ----------
  function surprise() {
    var box = $("v3box");
    if (!V.sur || !V.sur.items || !V.sur.items.length) { toast(V.failed ? "Нет связи 😕" : "Секунду, загружаю… 🎁"); return; }
    var it = pick(V.sur.items), xp = (V.cfg && V.cfg.surpriseBox && V.cfg.surpriseBox.xp) || 5, today = dayStr();
    var gift = S.surpriseDay !== today;
    if (gift) { S.surpriseDay = today; S.xp += xp; save(); renderHome(); }
    var head = { fact: "🤯 Факт", meme: "😂 Мем", question: "❓ Вопрос", challenge: "🔥 Челлендж" }[it.type] || "🎁 Сюрприз";
    box.innerHTML = '<div class="v3gift">🎁</div><h3></h3><div class="tx"></div><div id="v3sq"></div><div class="v3row2" style="margin-top:6px"><button class="btn ghost" style="margin:0">Закрыть</button><button class="btn">🎲 Ещё</button></div>';
    box.querySelector("h3").textContent = head + (gift ? " · +" + xp + " XP" : "");
    box.querySelector(".tx").textContent = it.type === "question" ? it.q : it.text;
    if (it.type === "question") {
      var q = $("v3sq");
      q.appendChild(options({ options: it.options, answer: it.answer }, function (ok) {
        haptic(ok ? "success" : "error");
        var p = E("p", null); p.style.cssText = "text-align:center;color:var(--muted);margin:4px 0 10px"; p.textContent = (ok ? "✅ Да! " : "💡 Правильно: " + it.options[it.answer] + ". ") + (it.explain || ""); q.appendChild(p);
      }));
    }
    var bs = box.querySelectorAll(".v3row2 .btn");
    bs[0].onclick = function () { modal.classList.remove("show"); };
    bs[1].onclick = function () { haptic("light"); surprise(); };
    modal.classList.add("show"); haptic("success");
  }

  // ---------- старт ----------
  wLoad();
  renderHome();
  twStart();
  trk("app_opened", { start_param: (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.start_param) || null });
  window.addEventListener("online", function () { if (V.offline || V.failed) loadAll().then(function () { if (current === "catalog") renderCatalog(); }); });
  loadAll().then(function () {
    try { if (window.lbTrackInit) window.lbTrackInit((V.cfg && V.cfg.analytics) || {}); } catch (e) {}
    var n = 0; if (V.cat) V.cat.tracks.forEach(function (t) { t.blocks.forEach(function (b) { n += b.topics.length; }); });
    if (n) $("v3catN").textContent = n + " тем";
    renderFreeze();
    if (current === "catalog") renderCatalog();
  });
})();
