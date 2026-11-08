/* Lingo Brain v3: каталог тем, «Нет сил», Surprise Box, заморозка серии,
   тренажёр уха, конструктор фраз, шпаргалки и сценарии. Контент: content/*.json */
(function () {
  var VER = "6";
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
  function arr(k) { if (!Array.isArray(S[k])) S[k] = []; return S[k]; }
  function isPassed(id) { return arr("passed").indexOf(id) >= 0; }
  function prevOf(id) { var o = readyOrder(trackOf(id)), i = o.map(function (x) { return x.id; }).indexOf(id); return i > 0 ? o[i - 1] : null; }
  function nextOf(id) { var o = readyOrder(trackOf(id)), i = o.map(function (x) { return x.id; }).indexOf(id); return i >= 0 && i + 1 < o.length ? o[i + 1] : null; }
  function isOpen(id) {
    var o = readyOrder(trackOf(id)).map(function (x) { return x.id; }), i = o.indexOf(id);
    if (i < 0) return false; if (i === 0) return true;
    return arr("unlocked").indexOf(id) >= 0 || isPassed(id) || isPassed(o[i - 1]);
  }
  function checkUnlock(id, ratio) {
    var nx = nextOf(id), wasOpen = nx ? isOpen(nx.id) : true;
    if (!(ratio >= PASS)) {
      if (nx && !wasOpen) setTimeout(function () { toast("Ещё раунд от 60% — и откроется «" + nx.title + "» 💪"); }, 1600);
      return null;
    }
    if (!isPassed(id)) arr("passed").push(id);
    var res = null;
    if (nx && !wasOpen) { if (arr("unlocked").indexOf(nx.id) < 0) arr("unlocked").push(nx.id); V.fresh = nx.id; res = nx; }
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
  function say(text, lang, rate) {
    if (!window.speechSynthesis) { toast("🔇 Озвучка недоступна"); return; }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = rate || 1;
    var vs = speechSynthesis.getVoices(), low = lang.toLowerCase();
    var v = vs.filter(function (x) { return x.lang && x.lang.split("_").join("-").toLowerCase() === low; })[0];
    if (!v && low === "es-mx") v = vs.filter(function (x) { return x.lang && x.lang.split("_").join("-").toLowerCase() === "es-us"; })[0];
    if (!v) v = vs.filter(function (x) { return x.lang && x.lang.toLowerCase().indexOf(low.slice(0, 2)) === 0; })[0];
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

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
    ".v3t .st{font-size:14px;color:var(--acc);font-weight:800}.v3t.planned .tt,.v3t.planned .lv,.v3t.planned .st{opacity:.5}.v3t.planned .em{filter:grayscale(.7);opacity:.75}.v3t.locked .tt{opacity:.8}.v3t.locked .em{filter:grayscale(.35)}.v3t.locked .st{color:var(--muted)}.v3t.fresh{border-color:var(--ok);animation:v3glow 1.2s ease-in-out 3}.v3t.ready{border-color:var(--acc)}" +
    ".v3hero{padding:20px;margin-bottom:14px;text-align:center}.v3hero .em{font-size:46px;line-height:1.2;min-height:60px;display:flex;align-items:center;justify-content:center}.v3hero h2{font-size:21px;margin:6px 0 4px}.v3hero p{color:var(--muted);font-size:13px}" +
    ".v3act{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:15px 14px;margin-bottom:10px;border-radius:20px;background:var(--card);border:1px solid var(--line);color:var(--text);font-weight:800;font-size:15px;font-family:inherit;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.25)}" +
    ".v3act .e{font-size:24px;width:32px;flex:none;display:flex;justify-content:center;line-height:1}.v3act small{display:block;color:var(--muted);font-weight:700;font-size:12px;margin-top:2px}.v3act:active{transform:translateY(3px)}" +
    ".v3bar{height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;margin:4px 0 16px}.v3bar i{display:block;height:100%;width:100%;background:var(--acc);transition:width 1s linear}" +
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
  var fzCard = E("div", "pcard glass", '<div class="v3fz"><span class="e">🧊</span><div style="flex:1"><b>Заморозка серии: <span id="v3fzP">0</span>/2</b><p>Пропустил день — заморозка сама спасёт серию. Без чувства вины.</p></div></div><button class="btn" id="v3fzBuy" style="margin-top:12px">Купить за 50 XP</button>');
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
      var bl = E("div", "v3block", '<div class="v3bh"><b>' + b.emoji + " " + esc(b.title) + "</b><span>" + esc(b.levelRange) + "</span></div>");
      b.topics.forEach(function (tp) {
        var has = !!(tp.status === "ready" && V.topics[tp.id]), open = has && isOpen(tp.id), done = has && isPassed(tp.id), pv = has && !open ? prevOf(tp.id) : null;
        var cls = open ? "ready" : (has ? "locked" : "planned"); if (open && V.fresh === tp.id) cls += " fresh";
        var st = open ? (done ? "✅" : "▶") : (has ? "🔒" : "🛠");
        var r = E("div", "v3t glass " + cls, '<span class="em">' + tp.emoji + '</span><span class="tt">' + esc(tp.title) + (pv ? "<small>Откроется после «" + esc(pv.title) + "» от 60%</small>" : "") + '</span><span class="lv">' + esc(tp.level) + '</span><span class="st">' + st + "</span>");
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
    V.track = t.track; setTrack(t.track); LAST = { lang: t.track, topic: id };
    $("v3tTitle").textContent = t.emoji + " " + t.title;
    var box = $("v3topic"); box.innerHTML = "";
    box.appendChild(E("div", "v3hero glass", '<div class="em">' + t.emoji + "</div><h2>" + esc(t.title) + "</h2><p>Уровень " + esc(t.level) + " · " + t.cards.length + " карточек · " + (t.scenarios || []).length + " сценарий</p>"));
    function act(e, title, sub, fn) { var b = E("button", "v3act", '<span class="e">' + e + "</span><span>" + title + "<small>" + sub + "</small></span>"); b.onclick = fn; box.appendChild(b); }
    if (t.cheatsheet && t.cheatsheet.length) act("⚡", "Шпаргалка за 30 сек", t.cheatsheet.length + " ключевых слов, нажми — услышишь", function () { openCheat(id); });
    act("🃏", "Раунд · 2 мин", "5 карточек: выбор, слух, конструктор, речь", function () { runTopicCards(id, "normal"); });
    (t.scenarios || []).forEach(function (s) { act(s.emoji || "🎭", "Сценарий: " + esc(s.title), "Живой диалог с выбором реплик", function () { runScenario(id, s.id); }); });
    act("🚀", "Гиперфокус", "Все " + t.cards.length + " карточек · XP ×1.5", function () { runTopicCards(id, "boost"); });
    show("topic"); haptic("light");
  }

  // ---------- шпаргалка ----------
  var cheatT = null;
  function stopCheat() { if (cheatT) { clearInterval(cheatT); cheatT = null; } }
  function openCheat(id) {
    var t = V.topics[id]; V.cheatId = id;
    var lang = DEF_LANG[t.track], box = $("v3cheat"); box.innerHTML = "";
    t.cheatsheet.forEach(function (c) {
      var r = E("div", "v3cs glass", '<div class="w"><b></b><div class="tr"></div>' + (c.ex ? '<div class="ex"></div>' : "") + "</div><span>🔊</span>");
      r.querySelector("b").textContent = c.term; r.querySelector(".tr").textContent = c.tr; if (c.ex) r.querySelector(".ex").textContent = c.ex;
      r.onclick = function () { haptic("light"); say(c.ex && r.classList.contains("heard") ? c.ex : c.term, lang, 0.9); r.classList.add("heard"); };
      box.appendChild(r);
    });
    var go = E("button", "btn", "🃏 Закрепить карточками →"); go.style.marginTop = "8px"; go.onclick = function () { runTopicCards(id, "normal"); }; box.appendChild(go);
    $("v3cBack").onclick = function () { openTopic(id); };
    var left = 30, bar = $("v3cBar"); bar.style.transition = "none"; bar.style.width = "100%";
    show("cheat");
    setTimeout(function () { bar.style.transition = "width 1s linear"; }, 30);
    stopCheat();
    cheatT = setInterval(function () { left--; bar.style.width = Math.max(0, left / 30 * 100) + "%"; if (left <= 0) { stopCheat(); haptic("success"); toast("⏱ 30 сек! Теперь закрепим 💪"); } }, 1000);
  }

  // ---------- карточки ----------
  function fromLegacy(l, c) { return { type: "choice", q: c.q, options: c.o, answer: c.a, explain: c.tip, sayText: c.say, lang: DATA[l].tts, track: l }; }
  function prep(t, c) { var x = {}; for (var k in c) x[k] = c[k]; x.track = t.track; x.lang = c.lang || (c.audio && c.audio.lang) || DEF_LANG[t.track]; return x; }
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
    Object.keys(V.topics).forEach(function (id) { var t = V.topics[id]; t.cards.forEach(function (c) { if (c.energy === "low") pool.push(prep(t, c)); }); });
    ["es", "en"].forEach(function (l) { Object.keys(DATA[l].topics).forEach(function (k) { var tp = DATA[l].topics[k]; if (!tp.speak) tp.cards.forEach(function (c) { pool.push(fromLegacy(l, c)); }); }); });
    var cards = shuffle(pool).slice(0, m.cards || 3);
    LAST = { lang: cards[0] ? cards[0].track : "es", topic: "low" };
    V.lastRun = { key: "low", fn: lowEnergy };
    toast("🪫 Мини-раунд. 3 лёгкие карточки — и серия цела 💛");
    startRun({ cards: cards, topicId: null, mult: 1, seconds: m.seconds || 45, title: "🪫 Нет сил" });
  }

  var timerT = null;
  function stopTimer() { if (timerT) { clearInterval(timerT); timerT = null; } }
  function startRun(r) {
    r.pos = 0; r.score = 0; r.xp = 0; r.combo = 0; V.run = r;
    stopTimer();
    var tm = $("v3timer");
    if (r.seconds) {
      r.left = r.seconds; tm.textContent = r.left; tm.style.color = "var(--ok)";
      timerT = setInterval(function () { r.left--; tm.textContent = Math.max(0, r.left); if (r.left <= 10) tm.style.color = "var(--es)"; if (r.left <= 0) { stopTimer(); toast("⏱ Время! Ты всё равно молодец 💛"); finishRun(); } }, 1000);
    } else tm.textContent = "⚡";
    show("play"); haptic("medium"); renderStep();
  }
  function finishRun() {
    var r = V.run; stopTimer(); if (window.speechSynthesis) speechSynthesis.cancel();
    var n = Math.max(1, r.cards.length);
    var un = (r.topicId && V.topics[r.topicId]) ? checkUnlock(r.topicId, r.score / n) : null;
    complete(r.score, n, Math.round(r.xp * (r.mult || 1)));
    if (un) setTimeout(function () { haptic("success"); toast("🔓 Открыта новая тема: " + un.emoji + " " + un.title); }, 1600);
    renderFreeze();
  }
  function nextStep() { var r = V.run; haptic("light"); r.pos++; if (r.pos >= r.cards.length) finishRun(); else renderStep(); }
  function feedback(ok, title, tip, sayIt) {
    var r = V.run, body = $("v3body");
    var fb = E("div", "v3fb " + (ok ? "ok" : "bad"), "<h3></h3>" + (tip ? "<p></p>" : "") + '<div class="v3row2">' + (sayIt ? '<button class="btn ghost" style="flex:0 0 64px;margin:0">🔊</button>' : "") + '<button class="btn ' + (ok ? "ok" : "err") + '"></button></div>');
    fb.querySelector("h3").innerHTML = title; if (tip) fb.querySelector("p").innerHTML = tip;
    var btns = fb.querySelectorAll("button"), nx = btns[btns.length - 1];
    nx.textContent = r.pos + 1 >= r.cards.length ? "🏁 Итог" : "Дальше →"; nx.onclick = nextStep;
    if (sayIt) btns[0].onclick = sayIt;
    body.appendChild(fb);
    $("v3dots").innerHTML = dots(r.pos + 1, r.cards.length, false);
    setTimeout(function () { fb.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 50);
  }
  function grade(ok, pts) {
    var r = V.run;
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
    card.appendChild(E("div", "qlabel", label + " · " + esc(r.title)));

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
      var pb = E("button", "v3play", "🔊"); pb.onclick = function () { haptic("light"); say(a.text, a.lang, rate); }; card.appendChild(pb);
      var sl = E("button", "pill", "🐢 Медленнее"); sl.onclick = function () { haptic("light"); say(a.text, a.lang, Math.max(0.5, rate * 0.7)); };
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
      var sp = E("div", "v3center"); var pl = E("button", "pill", "🔊 Послушать"); pl.onclick = function () { say(c.front, c.lang, 0.9); }; sp.appendChild(pl); card.appendChild(sp);
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
      var sw = E("div", "v3center"); sw.style.marginTop = "12px"; var lb = E("button", "pill", "🔊 Послушать"); lb.onclick = function () { say(c.text, c.lang, 0.9); }; sw.appendChild(lb); card.appendChild(sw);
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
    var m = E("div", "v3msg bot", '<div class="who"></div><span class="tx"></span><button class="sp">🔊</button>' + (n.tr ? '<div class="tr"></div>' : ""));
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
        var me = E("div", "v3msg me"); me.textContent = c.text; chat.appendChild(me);
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
  renderHome();
  twStart();
  window.addEventListener("online", function () { if (V.offline || V.failed) loadAll().then(function () { if (current === "catalog") renderCatalog(); }); });
  loadAll().then(function () {
    var n = 0; if (V.cat) V.cat.tracks.forEach(function (t) { t.blocks.forEach(function (b) { n += b.topics.length; }); });
    if (n) $("v3catN").textContent = n + " тем";
    renderFreeze();
    if (current === "catalog") renderCatalog();
  });
})();
