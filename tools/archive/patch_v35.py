# v3.5: buttons fix, 'My words' tab, voice picker + settings, de-personalized content
import json, os, glob
R = '/data/lr34/'
def rd(p): return open(R + p, encoding='utf-8').read()
def wr(p, s): open(R + p, 'w', encoding='utf-8').write(s)
def rep(s, a, b, name):
    assert a in s, 'marker not found: ' + name
    return s.replace(a, b, 1)

# ---------------- v3.js ----------------
js = rd('v3.js')
js = rep(js, 'var VER = "9";', 'var VER = "10";', 'ver')

start = js.index('  function pickVoice(lang) {')
end = js.index('    return v || null;', start)
end = js.index('}', end) + 1
VOICE = r'''  // v3.5: выбираем самый живой голос (Natural/Neural/Google/Enhanced), можно сменить вручную
  var VSKEY = "lingo_voice", VS = {};
  try { VS = JSON.parse(localStorage.getItem(VSKEY) || "{}") || {}; } catch (e) { VS = {}; }
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
  }'''
js = js[:start] + VOICE + js[end:]
js = rep(js, 'u.rate = rate || 1;', 'u.rate = Math.max(0.5, Math.min(1.5, (rate || 1) * (VS.rate || 1)));', 'rate')

WORDS = r'''  // ---------- v3.5: экран «Мои слова» + настройки голоса ----------
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

'''
js = rep(js, '  // ---------- v3.4: поделиться с другом ----------', WORDS + '  // ---------- v3.4: поделиться с другом ----------', 'words')
js = rep(js, 'window.__v3.wMerge = wMerge;', 'window.__v3.wMerge = wMerge; window.__v3.wEntry = wEntry; window.__v3.voicesFor = voicesFor; window.__v3.pickVoice = pickVoice; window.__v3.VS = function () { return VS; };', 'expose')
wr('v3.js', js)

# ---------------- index.html ----------------
h = rd('index.html')
CSS = '''.result .btn{margin-top:10px}.result .stats{margin-bottom:8px}
.btn{-webkit-tap-highlight-color:transparent}.btn:focus{outline:none}.btn:focus-visible{outline:2px solid rgba(238,238,255,.35);outline-offset:2px}
.tile.tap{cursor:pointer;position:relative}.tile.tap:after{content:"›";position:absolute;right:14px;top:12px;color:var(--muted);font-size:20px}
.wtabs{display:flex;gap:8px;margin-bottom:12px}.wtabs button{flex:1;border:1px solid var(--line);background:var(--card);color:var(--muted);border-radius:14px;padding:10px 6px;font:800 14px inherit;font-family:inherit;cursor:pointer}
.wtabs button.on{color:#1A1B26;background:var(--ok);border-color:transparent}.wtabs b{opacity:.8}
.wgrp{padding:12px 12px 4px;margin-bottom:12px}.wgh{font-weight:800;margin:0 4px 8px}.wgh span{font-weight:600;font-size:12px;color:var(--muted)}
.wrow{display:flex;align-items:center;gap:10px;padding:10px;border-radius:14px;margin-bottom:8px;background:rgba(255,255,255,.03);border:1px solid transparent}
.wrow.done{background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.45);box-shadow:0 0 14px rgba(16,185,129,.18)}
.wtx{flex:1;min-width:0}.wtx b{display:block;font-size:15px}.wtx small{display:block;color:var(--muted);font-size:12px;margin-top:2px}
.wdots{display:flex;gap:3px;flex-shrink:0}.wdots i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.14)}.wdots i.on{background:var(--ok)}
.wempty{padding:18px;text-align:center;color:var(--muted);margin-bottom:12px}
.vrow{display:flex;align-items:center;gap:8px;margin:10px 0}.vrow>span{width:92px;font-size:13px;color:var(--muted);flex-shrink:0}
.vrow select{flex:1;min-width:0;background:#1A1B26;color:var(--text);border:1px solid var(--line);border-radius:12px;padding:9px;font-family:inherit}
.vrate{display:flex;gap:6px;flex:1}.vrate button{flex:1;border:1px solid var(--line);background:#1A1B26;color:var(--muted);border-radius:12px;padding:8px 4px;font-family:inherit;font-weight:700;font-size:12px;cursor:pointer}.vrate button.on{color:var(--text);border-color:var(--es)}
.vhint{color:var(--muted);font-size:12px;line-height:1.45;margin-top:8px}
</style>'''
h = rep(h, '</style>', CSS, 'css')
h = rep(h, '<div class="tile glass"><div class="v" id="pWLearn">', '<div class="tile glass tap" onclick="show(&quot;words&quot;)"><div class="v" id="pWLearn">', 'tile1')
h = rep(h, '<div class="tile glass"><div class="v" id="pWDone">', '<div class="tile glass tap" onclick="show(&quot;words&quot;)"><div class="v" id="pWDone">', 'tile2')
SEC = '''<section class="screen" id="scr_words">
  <div class="header"><h1>📚 Мои слова</h1></div>
  <div class="wtabs"><button data-wf="learning" class="on" onclick="lbWordFilter('learning')">Учу <b id="wcL">0</b></button><button data-wf="learned" onclick="lbWordFilter('learned')">Выучено <b id="wcD">0</b></button><button data-wf="all" onclick="lbWordFilter('all')">Все</button></div>
  <div id="wList"></div>
  <div class="pcard glass" id="voiceBox"></div>
</section>

<div class="sheet" id="sheet">'''
h = rep(h, '<div class="sheet" id="sheet">', SEC, 'section')
h = rep(h, '<span class="i">📊</span>Прогресс</button>', '<span class="i">📊</span>Прогресс</button><button data-go="words" onclick="show(&quot;words&quot;)"><span class="i">📚</span>Слова</button>', 'nav')
h = rep(h, '  if (name === "profile") renderProfile();', '  if (name === "profile") renderProfile();\n  if (name === "words" && window.lbRenderWords) window.lbRenderWords();', 'show')
h = rep(h, 'v3.js?v=9', 'v3.js?v=10', 'cachebust')
# legacy v2 data: generic name
h = h.replace('Me llamo Aleks', 'Me llamo Leo').replace('Yo llamo Aleks', 'Yo llamo Leo').replace('Mi nombre Aleks', 'Mi nombre Leo').replace('Меня зовут</b> Алекс', 'Меня зовут</b> Лео')
wr('index.html', h)

# ---------------- content: убираем личные детали ----------------
PAIRS = [
  ('Me llamo Aleks, soy de Ucrania y vivo en Torrevieja.', 'Me llamo Leo y vivo en Valencia.'),
  ('Torrevieja, in the south of Spain', 'Valencia, on the east coast of Spain'),
  ('remote-first EU fintech company', 'remote-first European tech company'),
  ('Aleks', 'Leo'), ('Алекс', 'Лео'),
  ('Torrevieja', 'Valencia'), ('Торревьехе', 'Валенсии'), ('Торревьехи', 'Валенсии'),
]
changed = []
for p in glob.glob(R + 'content/topics/**/*.json', recursive=True):
    s = open(p, encoding='utf-8').read(); o = s
    for a, b in PAIRS: s = s.replace(a, b)
    if s != o:
        json.loads(s); open(p, 'w', encoding='utf-8').write(s); changed.append(os.path.relpath(p, R))
print('patched OK; content files changed:', changed)
