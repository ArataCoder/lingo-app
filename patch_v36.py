# v3.6 client: mp3 neural voices (manifest + audio_url) in v3.js; friends tab, player card button, v36.js in index.html
v = open('/data/lr34/v3.js', encoding='utf-8').read()
h = open('/data/lr34/index.html', encoding='utf-8').read()

def rep(src, old, new, tag):
    assert src.count(old) == 1, 'marker missing/not unique: ' + tag + ' (' + str(src.count(old)) + ')'
    return src.replace(old, new)

v = rep(v, 'var VER = "10";', 'var VER = "11";', 'ver')

AUDIO = r'''  // ---- v3.6: живые нейроголоса (mp3 из edge-tts), иначе лучший голос браузера ----
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
  function audioFor(text, lang) { if (!text) return null; regTopicUrls(); return AUD[aKey(lang, text)] || null; }
  function loadAudioMap() {
    try {
      fetch("assets/audio/manifest.json?v=" + VER).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (!j || !j.items) return; var n = 0;
        Object.keys(j.items).forEach(function (k) { if (!AUD[k]) AUD[k] = "assets/audio/" + j.items[k]; n++; });
        AUD_N = n; document.body.classList.add("hasmp3");
        if (window.current === "words" && window.lbNeuralBox) window.lbNeuralBox();
      }).catch(function () {});
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
    if (!SAY_OK || !text) return;'''
v = rep(v, '  function say(text, lang, rate) {\n    if (!SAY_OK || !text) return;', AUDIO, 'say')

NEWSAY = r'''  function say(text, lang, rate, url) {
    if (!text) return;
    lang = lang || "es-ES";
    if (VS.neural !== false) { var u = url || audioFor(text, lang); if (u) { playUrl(u, text, lang, rate); return; } }
    ttsSay(text, lang, rate);
  }
  // старые экраны (v1/v2)'''
v = rep(v, '  // старые экраны (v1/v2)', NEWSAY, 'newsay')

v = rep(v, 'if (!SAY_OK) card.appendChild(E("div", "v3sub", "🔇', 'if (!SAY_OK && !audioFor(a.text, a.lang)) card.appendChild(E("div", "v3sub", "🔇', 'listen')

v = rep(v, 'window.__v3.wMerge = wMerge;', 'window.__v3.wMerge = wMerge; window.__v3.aKey = aKey; window.__v3.audioFor = audioFor; window.__v3.audioInfo = function () { return { count: AUD_N }; }; window.__v3.setNeural = function (on) { VS.neural = !!on; vsSave(); }; loadAudioMap();', 'expose')

# ---------- index.html ----------
h = rep(h, '<span class="i">📚</span>Слова</button></nav>', '<span class="i">📚</span>Слова</button><button data-go="friends" onclick="show(&quot;friends&quot;)"><span class="i">👥</span>Друзья</button></nav>', 'nav')
FR = '''<!-- ДРУЗЬЯ -->
<section class="screen" id="scr_friends">
  <div class="fr">
    <h2>👥 Друзья</h2>
    <p class="frsub">Кто больше занимался — соревнуйтесь по XP</p>
    <div class="seg" id="frSeg"><button data-m="week" class="on" onclick="lbFriendsMode('week')">Неделя</button><button data-m="all" onclick="lbFriendsMode('all')">Всё время</button></div>
    <div id="frList"></div>
    <button class="btn ok" onclick="lbInvite()">Пригласить друга 🚀</button>
    <p class="frhint">Друг открывает бота по твоей ссылке — и вы сразу видите прогресс друг друга.<br>Недельный счёт обнуляется каждый понедельник.</p>
  </div>
</section>

<!-- ИТОГ -->'''
h = rep(h, '<!-- ИТОГ -->', FR, 'friends')
h = rep(h, '<button class="btn ok" id="shareBtn" onclick="shareResult()">Поделиться с другом 🚀</button>', '<button class="btn ok" id="shareBtn" onclick="shareResult()">Поделиться с другом 🚀</button>\n    <button class="btn" id="cardBtn" onclick="lbCard()">🖼 Карточка игрока</button>', 'card')
h = rep(h, '<script src="v3.js?v=10"></script>', '<script src="v3.js?v=11"></script>\n<script src="v36.js?v=11"></script>', 'script')

open('/data/lr34/v3.js', 'w', encoding='utf-8').write(v)
open('/data/lr34/index.html', 'w', encoding='utf-8').write(h)
print('client patched')
