/* Lingo Brain v5.2: маскот (start / error / win) + онбординг в 1 шаг (A0 / A1+).
   Подключается ПОСЛЕ v51.js. Старые файлы не меняются, кроме экспорта в v50.js. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var V3 = function () { return window.__v3 || {}; };
  var V5 = function () { return window.__v5 || {}; };
  function hap(t) { try { if (t === "success") Telegram.WebApp.HapticFeedback.notificationOccurred("success"); else Telegram.WebApp.HapticFeedback.impactOccurred(t || "light"); } catch (e) {} }
  function trk(ev, p) { try { if (window.lbTrack) window.lbTrack(ev, p || {}); } catch (e) {} }
  function E(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // ---------- 0. CSS ----------
  var css = [
    ".lbm{display:flex;align-items:center;gap:12px;margin:4px 0 14px;animation:lbmIn .35s ease-out}",
    ".lbm .pic{flex:0 0 72px;width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#24283B;overflow:hidden}",
    ".lbm .pic img{width:100%;height:100%;object-fit:contain}",
    ".lbm .pic .fb{font-size:40px;line-height:1}",
    ".lbm .say{position:relative;flex:1;background:#24283B;color:#EEEEFF;border-radius:16px;padding:10px 14px;font-size:15px;line-height:1.35;font-weight:600}",
    ".lbm .say:before{content:'';position:absolute;left:-7px;top:50%;margin-top:-7px;border:7px solid transparent;border-right-color:#24283B;border-left:0}",
    ".lbm.err .pic{box-shadow:0 0 0 2px #F7A046}",
    ".lbm.win{flex-direction:column;text-align:center;gap:10px;margin:0 auto 6px}",
    ".lbm.win .pic{flex-basis:140px;width:140px;height:140px}",
    ".lbm.win .pic .fb{font-size:76px}",
    ".lbm.win .say{flex:none}.lbm.win .say:before{display:none}",
    "@keyframes lbmIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}",
    "@media (prefers-reduced-motion:reduce){.lbm{animation:none}}",
    ".lbonb{position:fixed;inset:0;z-index:9999;background:#12131C;color:#EEEEFF;display:flex;flex-direction:column;justify-content:center;gap:14px;padding:24px 20px calc(24px + env(safe-area-inset-bottom));overflow-y:auto}",
    ".lbonb h1{font-size:26px;line-height:1.2;margin:0}",
    ".lbonb p{margin:0;color:#A9B1D6;font-size:15px}",
    ".lbonb .lang{display:flex;gap:8px}",
    ".lbonb .lang button{flex:1;min-height:44px;border-radius:999px;border:1px solid #3B4261;background:transparent;color:#EEEEFF;font:inherit;font-size:15px;font-weight:700}",
    ".lbonb .lang button[aria-pressed=true]{background:#F7A046;color:#12131C;border-color:transparent}",
    ".lbonb .big{display:flex;align-items:center;gap:14px;width:100%;min-height:76px;padding:14px 16px;border-radius:18px;border:2px solid transparent;background:#24283B;color:#EEEEFF;font:inherit;text-align:left;cursor:pointer}",
    ".lbonb .big .e{font-size:30px}",
    ".lbonb .big b{display:block;font-size:18px}",
    ".lbonb .big small{display:block;color:#A9B1D6;font-size:14px;margin-top:2px}",
    ".lbonb .big:active,.lbonb .big:focus-visible{border-color:#F7A046}"
  ].join("\n");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---------- 1. Маскот ----------
  // Файлы: assets/mascot/mascot_start.webp, mascot_error.webp, mascot_win.webp
  // Если файла нет — показываем 🧠 / 🏆, ничего не ломается.
  var MV = "1";
  var POSE = {
    start: { fb: "\uD83E\uDDE0", lines: ["Поехали! Пара минут — и готово.", "Одна карточка за раз. Я рядом.", "Начинаем с лёгкого, не спеши."] },
    error: { fb: "\uD83E\uDDE0", lines: ["Почти! Давай закрепим эти карточки.", "Ошибки — это и есть учёба. Ещё разок!", "Ничего, сейчас запомнится \uD83C\uDF31"] },
    win: { fb: "\uD83C\uDFC6", lines: ["Идеально! Мозг прокачан.", "Вот это да! Всё исправлено.", "Супер! Так и запоминается."] }
  };
  var okImg = {};
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function mascot(pose, text) {
    var p = POSE[pose], w = E("div", "lbm " + (pose === "error" ? "err" : pose === "win" ? "win" : "st"));
    w.setAttribute("data-pose", pose);
    var pic = E("div", "pic"); pic.setAttribute("aria-hidden", "true");
    if (okImg[pose] !== false) {
      var img = new Image(); img.alt = ""; img.decoding = "async"; img.width = 140; img.height = 140;
      img.src = "assets/mascot/mascot_" + pose + ".webp?v=" + MV;
      img.onload = function () { okImg[pose] = true; };
      img.onerror = function () { okImg[pose] = false; pic.innerHTML = '<span class="fb">' + p.fb + "</span>"; };
      pic.appendChild(img);
    } else pic.innerHTML = '<span class="fb">' + p.fb + "</span>";
    var say = E("div", "say"); say.setAttribute("role", "status"); say.textContent = text || pick(p.lines);
    w.appendChild(pic); w.appendChild(say);
    return w;
  }
  ["start", "error", "win"].forEach(function (k) { var i = new Image(); i.onload = function () { okImg[k] = true; }; i.onerror = function () { okImg[k] = false; }; i.src = "assets/mascot/mascot_" + k + ".webp?v=" + MV; });

  function plural(n, a, b, c) { n = Math.abs(n) % 100; var m = n % 10; if (n > 10 && n < 20) return c; if (m > 1 && m < 5) return b; if (m === 1) return a; return c; }

  // 1a. Начало урока и начало работы над ошибками
  function onPlay() {
    var body = $("v3body"), r = (V3().V || {}).run; if (!body || !r) return;
    if (body.querySelector(".lbm")) return;
    var pose = null;
    if (r.review && r.pos === 0) pose = "error";
    else if (!r.review && r.pos === 0 && !body.querySelector(".v3fb")) pose = "start";
    if (!pose) return;
    var n = (r.cards || []).length;
    body.insertBefore(mascot(pose, pose === "error" ? "Почти! Исправим " + n + " " + plural(n, "карточку", "карточки", "карточек") + " — и будет идеально." : null), body.firstChild);
    if (pose === "error") trk("mascot_shown", { pose: "error" });
  }

  // 1b. Шпаргалка перед уроком
  function onCheat() {
    var c = $("v3cheat"); if (!c || c.querySelector(".lbm")) return;
    c.insertBefore(mascot("start", "Сначала посмотри фразы. Учить не надо — просто прочитай."), c.firstChild);
  }

  // 1c. Финальный экран «Идеально!»
  function onResult() {
    var scr = $("scr_result"), t = $("resTitle"), em = $("resEmoji"); if (!scr || !t) return;
    var old = scr.querySelector(".lbm"); if (old) old.parentNode.removeChild(old);
    if (em) em.style.display = "";
    if (!/Идеально/.test(t.textContent || "")) return;
    var m = mascot("win");
    if (em) { em.style.display = "none"; em.parentNode.insertBefore(m, em); } else t.parentNode.insertBefore(m, t);
    hap("success"); trk("mascot_shown", { pose: "win" });
  }

  function watch(id, fn) {
    var tries = 0;
    (function hook() {
      var el = $(id);
      if (!el) { if (tries++ < 80) setTimeout(hook, 250); return; }
      new MutationObserver(function () { try { fn(); } catch (e) { console.error(e); } }).observe(el, { childList: true });
    })();
  }
  watch("v3body", onPlay);
  watch("v3cheat", onCheat);
  var _show = window.show;
  if (_show) window.show = function (name) {
    var r = _show.apply(this, arguments);
    try { if (name === "result") setTimeout(onResult, 0); if (name === "cheat") setTimeout(onCheat, 0); if (name === "play") setTimeout(onPlay, 0); } catch (e) {}
    return r;
  };

  // ---------- 2. Онбординг в 1 шаг ----------
  // ES A0  → блок «Выживание», первая тема со шпаргалкой.  ES A1+ → «Быт и документы», темы от A1.
  // EN (контент B1+): «с нуля» → «Барьеры», «база» → собеседования.
  var MAP = {
    es: { a0: { lvl: 1, ord: ["es.survive", "es.life"] }, a1: { lvl: 2, ord: ["es.life", "es.social", "es.survive"] } },
    en: { a0: { lvl: 0, ord: ["en.barriers", "en.social"] }, a1: { lvl: 4, ord: ["en.interview", "en.barriers"] } }
  };
  function saveP(P) {
    try { if (V5().saveP) return V5().saveP(); } catch (e) {}
    try { localStorage.setItem("lingo_p", JSON.stringify(P)); } catch (e) {}
  }
  function openOnb() {
    if ($("lbonb")) return;
    var lang = "es";
    var o = E("div", "lbonb"); o.id = "lbonb"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-labelledby", "lbonbH");
    o.appendChild(mascot("start", "Привет! Я Lingo Brain. Один вопрос — и начинаем."));
    var h = E("h1"); h.id = "lbonbH"; h.textContent = "С чего начнём?"; o.appendChild(h);
    var lg = E("div", "lang"); lg.setAttribute("role", "group"); lg.setAttribute("aria-label", "Язык");
    [["es", "\uD83C\uDDEA\uD83C\uDDF8 Испанский"], ["en", "\uD83C\uDDEC\uD83C\uDDE7 Английский"]].forEach(function (x) {
      var b = E("button"); b.type = "button"; b.textContent = x[1]; b.setAttribute("aria-pressed", x[0] === lang ? "true" : "false");
      b.onclick = function () { lang = x[0]; hap("light"); [].forEach.call(lg.children, function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); }); subs(); };
      lg.appendChild(b);
    });
    o.appendChild(lg);
    function big(e, t, id) { var b = E("button", "big", '<span class="e" aria-hidden="true">' + e + '</span><span><b></b><small></small></span>'); b.type = "button"; b.querySelector("b").textContent = t; b.setAttribute("data-lv", id); b.onclick = function () { done(id); }; o.appendChild(b); return b; }
    var bA0 = big("\uD83C\uDF31", "Я с нуля (A0)", "a0"), bA1 = big("\uD83D\uDE80", "Уже знаю базу (A1+)", "a1");
    function subs() {
      bA0.querySelector("small").textContent = lang === "es" ? "Hola, числа, супермаркет — по шагам" : "Самые простые фразы, без стресса";
      bA1.querySelector("small").textContent = lang === "es" ? "Документы, аренда, общение — от A1" : "Собеседования и работа — от B1";
    }
    subs();
    var p = E("p"); p.textContent = "Все темы останутся открыты. Уровень можно поменять в «Прогрессе»."; o.appendChild(p);
    document.body.appendChild(o);
    setTimeout(function () { try { bA0.focus(); } catch (e) {} }, 50);

    function done(id) {
      var P = V5().P || {}, m = MAP[lang][id];
      P.lang = lang; P.lvl = P.lvl || {}; P.lvl[lang] = m.lvl; P.ord = P.ord || {}; P.ord[lang] = m.ord; P.goal = id === "a0" ? "start" : "base"; P.onb = 1; P.onb1 = 1;
      saveP(P); hap("success");
      trk("onboarding_done", { track: lang, level: id, variant: "1step" });
      if (o.parentNode) o.parentNode.removeChild(o);
      try { if (V5().setTr) V5().setTr(lang); else if (V3().setTrack) V3().setTrack(lang); } catch (e) {}
      try { window.renderHome(); } catch (e) {}
      // старт первого урока: не ждём загрузку всех 80 тем, достаточно выбранной
      var go = V5().go, wr = V5().whenReady, started = false;
      function once() { if (started) return; started = true; try { go(); } catch (e) { console.error(e); } }
      if (!go) return;
      if (wr) wr(once);
      var tries = 0;
      (function fast() {
        if (started) return;
        try {
          var nt = V5().nextTopic && V5().nextTopic(lang), tp = V3().V && V3().V.topics;
          if (nt && tp && tp[nt.tp.id]) return once();
        } catch (e) {}
        if (tries++ < 40) setTimeout(fast, 250);
      })();
    }
  }
  // v50 мог уже открыть старый онбординг из 3 шагов — заменяем его
  function swap() {
    var old = $("v5onb"); if (!old) return false;
    old.parentNode.removeChild(old); openOnb(); return true;
  }
  if (!swap()) {
    var mo = new MutationObserver(function () { if (swap()) mo.disconnect(); });
    mo.observe(document.body, { childList: true });
    setTimeout(function () { mo.disconnect(); }, 10000);
  }
  window.__v52 = { mascot: mascot, openOnb: openOnb };
})();
