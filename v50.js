/* Lingo Brain v5.0: onboarding, \u00ab\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c\u00bb, \u043f\u043e\u0432\u0442\u043e\u0440\u0435\u043d\u0438\u0435 \u043e\u0448\u0438\u0431\u043e\u043a, \u043d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f, \u043c\u0435\u043d\u044c\u0448\u0435 \u0432\u043a\u043b\u0430\u0434\u043e\u043a, \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0438 */
(function () {
  "use strict";
  var PK = "lingo_p", RK = "lingo_rv", FK = "lingo_friends";
  var STEPS = [1, 3, 7], HOURS = [8, 12, 15, 19, 21];
  function $(id) { return document.getElementById(id); }
  function E(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function rd(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function hap(t) { try { var h = window.tg && window.tg.HapticFeedback; if (!h) return; if (t === "success" || t === "error" || t === "warning") h.notificationOccurred(t); else h.impactOccurred(t || "light"); } catch (e) {} }
  function msg(t) { try { window.toast(t); } catch (e) {} }
  function trk(ev, p) { try { if (window.lbTrack) window.lbTrack(ev, p || {}); } catch (e) {} }
  function V3() { return window.__v3 || {}; }
  function V() { return V3().V || {}; }
  function pad(h) { return (h < 10 ? "0" : "") + h; }
  function plural(n, a, b, c) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : (m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c); }
  function rank(lv) { var m = String(lv || "").toUpperCase().match(/[ABC][0-2]/); return m ? (({ A0: 1, A1: 2, A2: 3, B1: 4, B2: 5, C1: 6, C2: 7 })[m[0]] || 0) : 0; }
  function today() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }

  var P = rd(PK, {}); if (!P || typeof P !== "object") P = {};
  if (!P.tips) P.tips = {}; if (!P.seen) P.seen = {}; if (!P.rem) P.rem = { on: false, hour: 19 };
  function saveP() { wr(PK, P); }
  var RV = rd(RK, {}); if (!RV || typeof RV !== "object") RV = {};
  function saveRV() { wr(RK, RV); }

  var GOALS = {
    es: [["survive", "\ud83c\udd98", "\u0412\u044b\u0436\u0438\u0442\u044c \u0432 \u0431\u044b\u0442\u0443", "\u0411\u0430\u0437\u043e\u0432\u044b\u0435 \u0444\u0440\u0430\u0437\u044b, \u043c\u0430\u0433\u0430\u0437\u0438\u043d, \u0432\u0440\u0430\u0447", ["es.survive", "es.life"]],
      ["social", "\ud83d\udcac", "\u041e\u0431\u0449\u0430\u0442\u044c\u0441\u044f \u0441 \u043b\u044e\u0434\u044c\u043c\u0438", "\u0417\u043d\u0430\u043a\u043e\u043c\u0441\u0442\u0432\u0430, small talk, \u0434\u0440\u0443\u0437\u044c\u044f", ["es.social", "es.survive"]],
      ["travel", "\u2708\ufe0f", "\u041f\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u043e\u0432\u0430\u0442\u044c", "\u0422\u0440\u0430\u043d\u0441\u043f\u043e\u0440\u0442, \u043e\u0442\u0435\u043b\u044c, \u043a\u0430\u0444\u0435", ["es.travel", "es.survive"]],
      ["work", "\ud83d\udcbc", "\u0420\u0430\u0431\u043e\u0442\u0430\u0442\u044c \u0432 \u0418\u0441\u043f\u0430\u043d\u0438\u0438", "\u0421\u043e\u0431\u0435\u0441\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u044f, \u043a\u043e\u043b\u043b\u0435\u0433\u0438, \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u044b", ["es.work", "es.life"]]],
    en: [["barriers", "\ud83e\uddf1", "\u041f\u0435\u0440\u0435\u0441\u0442\u0430\u0442\u044c \u0431\u043e\u044f\u0442\u044c\u0441\u044f \u0433\u043e\u0432\u043e\u0440\u0438\u0442\u044c", "\u041f\u0430\u0443\u0437\u044b, \u043f\u0435\u0440\u0435\u0444\u0440\u0430\u0437\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435, \u0443\u0432\u0435\u0440\u0435\u043d\u043d\u043e\u0441\u0442\u044c", ["en.barriers", "en.social"]],
      ["interview", "\ud83c\udfaf", "\u041f\u0440\u043e\u0439\u0442\u0438 \u0441\u043e\u0431\u0435\u0441\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u0435", "\u0420\u0430\u0441\u0441\u043a\u0430\u0437 \u043e \u0441\u0435\u0431\u0435, \u0441\u043b\u043e\u0436\u043d\u044b\u0435 \u0432\u043e\u043f\u0440\u043e\u0441\u044b", ["en.interview", "en.barriers"]],
      ["biz", "\ud83d\udcbc", "\u0410\u043d\u0433\u043b\u0438\u0439\u0441\u043a\u0438\u0439 \u0434\u043b\u044f \u0440\u0430\u0431\u043e\u0442\u044b", "\u0421\u043e\u0437\u0432\u043e\u043d\u044b, \u043f\u0435\u0440\u0435\u043f\u0438\u0441\u043a\u0430, \u043c\u0438\u0442\u0438\u043d\u0433\u0438", ["en.biz", "en.interview"]],
      ["social", "\ud83d\udcac", "\u0421\u0432\u043e\u0431\u043e\u0434\u043d\u043e \u043e\u0431\u0449\u0430\u0442\u044c\u0441\u044f", "Small talk, \u043c\u043d\u0435\u043d\u0438\u044f, \u0441\u043f\u043e\u0440\u044b", ["en.social", "en.debate"]]]
  };
  var LEVELS = {
    es: [["\u0421 \u043d\u0443\u043b\u044f", "\u041f\u043e\u043a\u0430 \u043d\u0435 \u0437\u043d\u0430\u044e \u043d\u0438 \u0441\u043b\u043e\u0432\u0430", 1], ["\u0417\u043d\u0430\u044e \u043f\u0430\u0440\u0443 \u0444\u0440\u0430\u0437", "Hola, gracias, por favor", 1], ["\u041c\u043e\u0433\u0443 \u043d\u0435\u043c\u043d\u043e\u0433\u043e \u043e\u0431\u0449\u0430\u0442\u044c\u0441\u044f", "\u041f\u0440\u043e\u0441\u0442\u044b\u0435 \u0440\u0430\u0437\u0433\u043e\u0432\u043e\u0440\u044b \u0443\u0436\u0435 \u043f\u043e\u043b\u0443\u0447\u0430\u044e\u0442\u0441\u044f", 3]],
    en: [["A2 \u2014 \u0431\u0430\u0437\u043e\u0432\u044b\u0439", "\u041f\u043e\u043d\u0438\u043c\u0430\u044e \u043f\u0440\u043e\u0441\u0442\u044b\u0435 \u0444\u0440\u0430\u0437\u044b", 3], ["B1 \u2014 \u0441\u0440\u0435\u0434\u043d\u0438\u0439", "\u041c\u043e\u0433\u0443 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0440\u0430\u0437\u0433\u043e\u0432\u043e\u0440", 4], ["B2 \u0438 \u0432\u044b\u0448\u0435", "\u0413\u043e\u0432\u043e\u0440\u044e, \u043d\u043e \u0445\u043e\u0447\u0443 \u0441\u0432\u043e\u0431\u043e\u0434\u043d\u0435\u0435", 5]]
  };
  var LNAME = { es: "\u0438\u0441\u043f\u0430\u043d\u0441\u043a\u0438\u0439", en: "\u0430\u043d\u0433\u043b\u0438\u0439\u0441\u043a\u0438\u0439" };

  function lang() { return P.lang === "en" || P.lang === "es" ? P.lang : null; }
  window.lbLang = lang;
  function setTr(l) { try { V().track = l; if (V3().setTrack) V3().setTrack(l); } catch (e) {} }

  // ---------- \u043a\u0430\u0442\u0430\u043b\u043e\u0433: \u044f\u0437\u044b\u043a \u2192 \u0431\u043b\u043e\u043a \u2192 \u0442\u0435\u043c\u0430 ----------
  function track(l) { var v = V(); if (!v.cat || !v.cat.tracks) return null; return v.cat.tracks.filter(function (t) { return t.id === l; })[0] || null; }
  function blocks(l) { var t = track(l); return t ? t.blocks.slice().sort(function (a, b) { return a.order - b.order; }) : []; }
  function ready(tp) { var v = V(); return tp.status === "ready" && !!(v.topics && v.topics[tp.id]); }
  function passed(id) { try { return !!V3().isPassed(id); } catch (e) { return false; } }
  function opened(id) { try { return V3().isOpen ? !!V3().isOpen(id) : true; } catch (e) { return true; } }
  function order(l) {
    var bs = blocks(l), pref = (P.ord && P.ord[l]) || [], out = [];
    pref.forEach(function (id) { bs.forEach(function (b) { if (b.id === id && out.indexOf(b) < 0) out.push(b); }); });
    bs.forEach(function (b) { if (out.indexOf(b) < 0) out.push(b); });
    return out;
  }
  function nextTopic(l) {
    var bs = order(l), min = (P.lvl && P.lvl[l]) || 0;
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i], cand = [];
      b.topics.forEach(function (tp, j) { if (ready(tp) && !passed(tp.id) && opened(tp.id)) cand.push({ tp: tp, block: b, n: j + 1, total: b.topics.length }); });
      if (cand.length) return cand.filter(function (c) { return rank(c.tp.level) >= min; })[0] || cand[0];
    }
    return null;
  }
  function anyProgress(l) {
    var s = window.S || {}, hit = false;
    Object.keys(s.best || {}).forEach(function (k) { if (k.split(":")[0] === l) hit = true; });
    Object.keys(P.seen).forEach(function (k) { if (k.split(".")[0] === l) hit = true; });
    if (!hit) blocks(l).forEach(function (b) { b.topics.forEach(function (tp) { if (passed(tp.id)) hit = true; }); });
    return hit;
  }
  function cardsN(t) { var v = V(), m = v.cfg && v.cfg.energyModes && v.cfg.energyModes.normal; return Math.min((m && m.cards) || 5, t.cards.length); }

  // ---------- \u043e\u0436\u0438\u0434\u0430\u043d\u0438\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438 \u0432\u0441\u0435\u0445 \u0442\u0435\u043c ----------
  var readyQ = [], isReady = false, ticks = 0;
  function allLoaded() {
    var v = V(), ok = true; if (!v.cat || !v.cat.tracks || !v.topics) return false;
    v.cat.tracks.forEach(function (t) { t.blocks.forEach(function (b) { b.topics.forEach(function (tp) { if (tp.status === "ready" && tp.file && !v.topics[tp.id]) ok = false; }); }); });
    return ok;
  }
  function whenReady(fn) { if (isReady) fn(); else readyQ.push(fn); }
  function poll() {
    if (allLoaded() || (V().cat && ticks >= 40) || ticks >= 120) {
      isReady = true; var q = readyQ; readyQ = [];
      q.forEach(function (f) { try { f(); } catch (e) { console.error(e); } });
      if (window.current === "home") home();
      return;
    }
    ticks++; setTimeout(poll, 250);
  }

  // ---------- \u0437\u0430\u043f\u0443\u0441\u043a \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0435\u0439 \u0442\u0435\u043c\u044b ----------
  function go() {
    var l = lang() || "es", nt = nextTopic(l);
    if (!nt) { window.show("catalog"); return; }
    var id = nt.tp.id, t = V().topics[id], first = !P.seen[id];
    P.seen[id] = 1; saveP(); hap("medium"); setTr(t.track);
    window.LAST = { lang: t.track, topic: id };
    trk("topic_selected", { topic_id: id, track: t.track, level: t.level || null, via: "hero" });
    try { if (first && t.cheatsheet && t.cheatsheet.length) V3().openCheat(id); else V3().runTopicCards(id, "normal"); }
    catch (e) { try { V3().openTopic(id); } catch (e2) { window.show("catalog"); } }
  }

  // ---------- \u043f\u043e\u0432\u0442\u043e\u0440\u0435\u043d\u0438\u0435 \u043e\u0448\u0438\u0431\u043e\u043a (\u0438\u043d\u0442\u0435\u0440\u0432\u0430\u043b\u044b 1 \u2192 3 \u2192 7 \u0434\u043d\u0435\u0439) ----------
  window.lbOnGrade = function (card, ok, run) {
    if (!card || !card.topicId || !(card.idx >= 0)) return;
    var k = card.topicId + "#" + card.idx, d = today();
    if (run && !run.__v5bad) run.__v5bad = {};
    if (!ok) { RV[k] = [0, d]; if (run) run.__v5bad[k] = 1; saveRV(); return; }
    if (run && run.__v5bad[k]) return;
    var e = RV[k]; if (!e || e[1] > d) return;
    var box = e[0] + 1;
    if (box > STEPS.length) delete RV[k]; else RV[k] = [box, d + STEPS[box - 1]];
    saveRV();
  };
  function dueCards(l) {
    var v = V(), d = today(), out = []; if (!v.topics) return out;
    Object.keys(RV).forEach(function (k) {
      var e = RV[k], i = k.lastIndexOf("#"); if (!e || e[1] > d || i < 0) return;
      var t = v.topics[k.slice(0, i)], idx = +k.slice(i + 1); if (!t || !t.cards || !t.cards[idx]) return;
      if (l && t.track !== l) return;
      out.push({ t: t, c: t.cards[idx], due: e[1] });
    });
    out.sort(function (a, b) { return a.due - b.due; });
    return out.slice(0, 8);
  }
  function runReview() {
    var list = dueCards(lang());
    if (!list.length) { msg("\u041e\u0448\u0438\u0431\u043e\u043a \u0434\u043b\u044f \u043f\u043e\u0432\u0442\u043e\u0440\u0435\u043d\u0438\u044f \u043d\u0435\u0442 \ud83d\udc9b"); home(); return; }
    var cards = list.map(function (x) { return V3().prep(x.t, x.c); });
    window.LAST = { lang: list[0].t.track, topic: "review" };
    try { V().lastRun = { key: "review", fn: runReview }; } catch (e) {}
    hap("medium");
    V3().startRun({ cards: cards, topicId: null, mult: 1, seconds: 0, title: "\ud83d\udd01 \u041f\u043e\u0432\u0442\u043e\u0440\u0435\u043d\u0438\u0435" });
  }

  // ---------- \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0438 \u043f\u0440\u0438 \u043f\u0435\u0440\u0432\u043e\u043c \u0432\u0445\u043e\u0434\u0435 ----------
  var TIPS = {
    home: "\ud83d\udc46 \u041f\u0440\u043e\u0441\u0442\u043e \u0436\u043c\u0438 \u0431\u043e\u043b\u044c\u0448\u0443\u044e \u043a\u043d\u043e\u043f\u043a\u0443 \u2014 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0435 \u0441\u0430\u043c\u043e \u0432\u044b\u0431\u0435\u0440\u0435\u0442 \u0441\u043b\u0435\u0434\u0443\u044e\u0449\u0443\u044e \u0442\u0435\u043c\u0443. \u0412\u0442\u043e\u0440\u043e\u0439 \u044f\u0437\u044b\u043a \u0432\u043a\u043b\u044e\u0447\u0430\u0435\u0442\u0441\u044f \u043a\u043d\u043e\u043f\u043a\u043e\u0439 \u0432\u043d\u0438\u0437\u0443.",
    catalog: "\ud83d\udcda \u0417\u0434\u0435\u0441\u044c \u0432\u0441\u0435 \u0442\u0435\u043c\u044b \u043f\u043e \u0431\u043b\u043e\u043a\u0430\u043c. \u25b6 \u2014 \u043c\u043e\u0436\u043d\u043e \u043d\u0430\u0447\u0430\u0442\u044c, \u2705 \u2014 \u043f\u0440\u043e\u0439\u0434\u0435\u043d\u043e, \ud83d\udee0 \u2014 \u0441\u043a\u043e\u0440\u043e \u043f\u043e\u044f\u0432\u0438\u0442\u0441\u044f."
  };
  function tip(name) {
    var old = $("v5tip"); if (old && old.getAttribute("data-n") !== name) old.parentNode.removeChild(old);
    if (P.tips[name] || $("v5onb") || $("v5tip")) return;
    var anchor = name === "home" ? $("v5mini") : $("v3cat"); if (!anchor) return;
    var t = E("div", "v5tip"); t.id = "v5tip"; t.setAttribute("data-n", name); t.textContent = TIPS[name];
    t.onclick = function () { P.tips[name] = 1; saveP(); hap("light"); if (t.parentNode) t.parentNode.removeChild(t); };
    if (name === "home") anchor.parentNode.insertBefore(t, anchor.nextSibling); else anchor.parentNode.insertBefore(t, anchor);
  }

  // ---------- \u0433\u043b\u0430\u0432\u043d\u0430\u044f ----------
  function buildHome() {
    var hm = $("scr_home"); if (!hm || $("v5hero")) return;
    var quick = hm.querySelector(".quick"), row = hm.querySelector(".v3row"), anchor = quick || hm.querySelector(".label");
    if (!anchor) return;
    var hero = E("button", "v5hero"); hero.id = "v5hero";
    var rv = E("button", "v5rev glass"); rv.id = "v5rev"; rv.style.display = "none"; rv.onclick = runReview;
    var mini = E("div", "v5mini", '<button id="v5low">\ud83e\udeab \u041d\u0435\u0442 \u0441\u0438\u043b</button><button id="v5sur">\ud83c\udf81 \u0421\u044e\u0440\u043f\u0440\u0438\u0437</button><button id="v5warm">\u26a1 \u0420\u0430\u0437\u043c\u0438\u043d\u043a\u0430</button>'); mini.id = "v5mini";
    anchor.parentNode.insertBefore(hero, anchor);
    anchor.parentNode.insertBefore(rv, anchor);
    anchor.parentNode.insertBefore(mini, anchor);
    if (quick) quick.style.display = "none";
    if (row) row.style.display = "none";
    $("v5low").onclick = function () { try { V3().lowEnergy(); } catch (e) {} };
    $("v5sur").onclick = function () { try { V3().surprise(); } catch (e) {} };
    $("v5warm").onclick = function () { try { window.quickRound(); } catch (e) {} };
    var en = hm.querySelector(".track.en"), sw = E("button", "v5sw"); sw.id = "v5sw"; sw.onclick = switchLang;
    if (en) en.parentNode.insertBefore(sw, en.nextSibling); else hm.appendChild(sw);
  }
  function switchLang() {
    var l = lang() === "es" ? "en" : "es"; P.lang = l; saveP(); setTr(l); hap("medium");
    msg(l === "en" ? "\ud83c\uddec\ud83c\udde7 \u0422\u0435\u043f\u0435\u0440\u044c \u0443\u0447\u0438\u043c \u0430\u043d\u0433\u043b\u0438\u0439\u0441\u043a\u0438\u0439" : "\ud83c\uddea\ud83c\uddf8 \u0422\u0435\u043f\u0435\u0440\u044c \u0443\u0447\u0438\u043c \u0438\u0441\u043f\u0430\u043d\u0441\u043a\u0438\u0439");
    if (P.rem.on) setRem(true, P.rem.hour, true);
    window.renderHome();
  }
  function home() {
    var hero = $("v5hero"); if (!hero) return;
    var l = lang(), v = V();
    ["es", "en"].forEach(function (x) { var c = document.querySelector("#scr_home .track." + x); if (c) c.style.display = !l || l === x ? "" : "none"; });
    var sw = $("v5sw"); sw.style.display = l ? "" : "none"; sw.textContent = l === "es" ? "\ud83c\uddec\ud83c\udde7 \u041f\u0435\u0440\u0435\u043a\u043b\u044e\u0447\u0438\u0442\u044c\u0441\u044f \u043d\u0430 \u0430\u043d\u0433\u043b\u0438\u0439\u0441\u043a\u0438\u0439" : "\ud83c\uddea\ud83c\uddf8 \u041f\u0435\u0440\u0435\u043a\u043b\u044e\u0447\u0438\u0442\u044c\u0441\u044f \u043d\u0430 \u0438\u0441\u043f\u0430\u043d\u0441\u043a\u0438\u0439";
    var rv = $("v5rev");
    if (!isReady || !v.cat) {
      hero.className = "v5hero wait";
      hero.innerHTML = isReady ? '<span class="t">\ud83d\ude15 \u0422\u0435\u043c\u044b \u043d\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043b\u0438\u0441\u044c</span><span class="s">\u041f\u0440\u043e\u0432\u0435\u0440\u044c \u0438\u043d\u0442\u0435\u0440\u043d\u0435\u0442 \u0438 \u043d\u0430\u0436\u043c\u0438, \u0447\u0442\u043e\u0431\u044b \u043e\u0442\u043a\u0440\u044b\u0442\u044c \u043a\u0430\u0442\u0430\u043b\u043e\u0433</span>' : '<span class="t">\ud83e\udde0 \u0417\u0430\u0433\u0440\u0443\u0436\u0430\u044e \u0442\u0435\u043c\u044b\u2026</span><span class="s">\u041f\u0430\u0440\u0430 \u0441\u0435\u043a\u0443\u043d\u0434</span>';
      hero.onclick = isReady ? function () { window.show("catalog"); } : null;
      rv.style.display = "none"; return;
    }
    var nt = nextTopic(l || "es");
    hero.className = "v5hero";
    if (!nt) {
      hero.innerHTML = '<span class="k">\ud83c\udf89 \u0413\u041e\u0422\u041e\u0412\u041e</span><span class="t">\u0412\u0435\u0441\u044c \u043a\u0443\u0440\u0441 \u043f\u0440\u043e\u0439\u0434\u0435\u043d!</span><span class="s">\u041f\u043e\u0432\u0442\u043e\u0440\u044f\u0439 \u043e\u0448\u0438\u0431\u043a\u0438 \u0438 \u0437\u0430\u0433\u043b\u044f\u0434\u044b\u0432\u0430\u0439 \u0432 \u00ab\u0422\u0435\u043c\u044b\u00bb: \u043d\u043e\u0432\u044b\u0435 \u043f\u043e\u044f\u0432\u043b\u044f\u044e\u0442\u0441\u044f \u0440\u0435\u0433\u0443\u043b\u044f\u0440\u043d\u043e</span>';
      hero.onclick = function () { window.show("catalog"); };
    } else {
      var t = v.topics[nt.tp.id], cheat = !P.seen[nt.tp.id] && t.cheatsheet && t.cheatsheet.length, n = cardsN(t);
      hero.innerHTML = '<span class="k">' + (anyProgress(l || "es") ? "\u25b6 \u041f\u0420\u041e\u0414\u041e\u041b\u0416\u0418\u0422\u042c" : "\u25b6 \u041d\u0410\u0427\u0410\u0422\u042c") + '</span><span class="t">' + esc(nt.tp.emoji) + " " + esc(nt.tp.title) + '</span><span class="s">' + esc(nt.block.emoji) + " " + esc(nt.block.title) + " \u00b7 \u0442\u0435\u043c\u0430 " + nt.n + " \u0438\u0437 " + nt.total + " \u00b7 " + (cheat ? "\u0448\u043f\u0430\u0440\u0433\u0430\u043b\u043a\u0430 + " : "") + n + " " + plural(n, "\u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430", "\u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438", "\u043a\u0430\u0440\u0442\u043e\u0447\u0435\u043a") + "</span>";
      hero.onclick = go;
      var b = nt.block, d = b.topics.filter(function (x) { return passed(x.id); }).length, el = $("dots_" + nt.tp.id.split(".")[0]);
      if (el && window.dots) {
        el.innerHTML = window.dots(d, b.topics.length);
        var bl = el.parentNode.querySelector(".v5bl"); if (!bl) { bl = E("small", "v5bl"); el.parentNode.insertBefore(bl, el.nextSibling); }
        bl.textContent = b.emoji + " " + b.title + ": \u043f\u0440\u043e\u0439\u0434\u0435\u043d\u043e " + d + " \u0438\u0437 " + b.topics.length;
      }
    }
    var due = dueCards(l).length;
    rv.style.display = due ? "" : "none";
    rv.innerHTML = '<span class="e">\ud83d\udd01</span><span class="x">\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c \u043e\u0448\u0438\u0431\u043a\u0438<small>' + due + " " + plural(due, "\u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430 \u0436\u0434\u0451\u0442", "\u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438 \u0436\u0434\u0443\u0442", "\u043a\u0430\u0440\u0442\u043e\u0447\u0435\u043a \u0436\u0434\u0443\u0442") + ' \u043f\u043e\u0432\u0442\u043e\u0440\u0435\u043d\u0438\u044f</small></span><span class="n">' + due + "</span>";
    if (P.onb) tip("home");
  }

  // ---------- \u043f\u0440\u043e\u0433\u0440\u0435\u0441\u0441: \u043d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f, \u0441\u043b\u043e\u0432\u0430, \u0434\u0440\u0443\u0437\u044c\u044f ----------
  function friendsN() { var f = rd(FK, null); return f && f.list && f.list.length ? f.list.length : 0; }
  function buildProfile() {
    var prof = $("scr_profile"); if (!prof || $("v5prof")) return;
    var box = E("div", "pcard glass v5prof", '<div class="v5ph"><span class="e">\ud83d\udd14</span><div><b>\u041d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u0435 \u0432 Telegram</b><p>\u0411\u043e\u0442 \u043d\u0430\u043f\u0438\u0448\u0435\u0442, \u0442\u043e\u043b\u044c\u043a\u043e \u0435\u0441\u043b\u0438 \u0432 \u044d\u0442\u043e\u0442 \u0434\u0435\u043d\u044c \u0435\u0449\u0451 \u043d\u0435 \u0431\u044b\u043b\u043e \u0440\u0430\u0443\u043d\u0434\u0430.</p></div></div><div class="v5chips" id="v5remChips"></div><p class="v5st" id="v5remSt"></p>');
    box.id = "v5prof";
    var w = E("button", "pcard glass v5lnk", '<span class="e">\ud83d\udcda</span><span class="x">\u041c\u043e\u0438 \u0441\u043b\u043e\u0432\u0430<small id="v5pWS">\u0412\u0441\u0435 \u0441\u043b\u043e\u0432\u0430 \u0438\u0437 \u043a\u0430\u0440\u0442\u043e\u0447\u0435\u043a</small></span><span class="go">\u203a</span>'); w.id = "v5pWords";
    var f = E("button", "pcard glass v5lnk", '<span class="e">\ud83d\udc65</span><span class="x">\u0414\u0440\u0443\u0437\u044c\u044f<small id="v5pFrS"></small></span><span class="go">\u203a</span>'); f.id = "v5pFr";
    w.onclick = function () { hap("light"); window.show("words"); };
    f.onclick = function () { hap("light"); window.show("friends"); };
    var tiles = prof.querySelector(".tiles"), at = tiles ? tiles.nextSibling : null;
    prof.insertBefore(box, at); prof.insertBefore(w, at); prof.insertBefore(f, at);
  }
  function renderProf() {
    renderRem();
    var n = friendsN(), s = $("v5pFrS"); if (s) s.textContent = n ? n + " " + plural(n, "\u0434\u0440\u0443\u0433", "\u0434\u0440\u0443\u0433\u0430", "\u0434\u0440\u0443\u0437\u0435\u0439") + " \u00b7 \u0440\u0435\u0439\u0442\u0438\u043d\u0433 \u043d\u0435\u0434\u0435\u043b\u0438" : "\u041f\u043e\u0437\u043e\u0432\u0438 \u0434\u0440\u0443\u0437\u0435\u0439 \u0438 \u0441\u043e\u0440\u0435\u0432\u043d\u0443\u0439\u0442\u0435\u0441\u044c \u043f\u043e XP";
    try { var wc = V3().wCounts(); if (wc && wc.learned != null) $("v5pWS").textContent = "\u0412\u044b\u0443\u0447\u0435\u043d\u043e: " + wc.learned + " \u00b7 \u0432\u0441\u0435 \u0441\u043b\u043e\u0432\u0430 \u0438\u0437 \u043a\u0430\u0440\u0442\u043e\u0447\u0435\u043a"; } catch (e) {}
  }
  function renderRem() {
    var ch = $("v5remChips"); if (!ch) return; ch.innerHTML = "";
    HOURS.forEach(function (h) { var b = E("button", "v5chip" + (P.rem.on && P.rem.hour === h ? " on" : ""), pad(h) + ":00"); b.onclick = function () { setRem(true, h); }; ch.appendChild(b); });
    var off = E("button", "v5chip" + (P.rem.on ? "" : " on"), "\u0412\u044b\u043a\u043b"); off.onclick = function () { if (P.rem.on) setRem(false, P.rem.hour); }; ch.appendChild(off);
    $("v5remSt").textContent = P.rem.on ? "\u2705 \u041a\u0430\u0436\u0434\u044b\u0439 \u0434\u0435\u043d\u044c \u0432 " + pad(P.rem.hour) + ":00 \u043f\u043e \u0442\u0432\u043e\u0435\u043c\u0443 \u0432\u0440\u0435\u043c\u0435\u043d\u0438" : "\u0412\u044b\u043a\u043b\u044e\u0447\u0435\u043d\u043e. \u0412\u044b\u0431\u0435\u0440\u0438 \u0432\u0440\u0435\u043c\u044f, \u043d\u0430\u043f\u0440\u0438\u043c\u0435\u0440 19:00";
  }
  function api() { try { var u = V().cfg.analytics.statsUrl; if (u) return u.replace(/\/api\/event$/, ""); } catch (e) {} return "https://lingo-brain-bot.lingobrain.workers.dev"; }
  var remBusy = false;
  function setRem(on, hour, quiet) {
    if (remBusy) return;
    var tg = window.tg, init = tg && tg.initData;
    if (!init) { if (!quiet) msg("\u041d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f \u0440\u0430\u0431\u043e\u0442\u0430\u044e\u0442 \u0442\u043e\u043b\u044c\u043a\u043e \u0432\u043d\u0443\u0442\u0440\u0438 Telegram \ud83d\udcf1"); return; }
    remBusy = true; if ($("v5remSt")) $("v5remSt").textContent = "\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u044e\u2026";
    function done(ok, j) {
      remBusy = false;
      if (ok) { P.rem = { on: !!j.enabled, hour: j.hour }; saveP(); if (!quiet) { hap("success"); msg(j.enabled ? "\ud83d\udd14 \u041d\u0430\u043f\u043e\u043c\u043d\u044e \u0432 " + pad(j.hour) + ":00" : "\ud83d\udd15 \u041d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u0435 \u0432\u044b\u043a\u043b\u044e\u0447\u0435\u043d\u043e"); } }
      else if (!quiet) { hap("error"); msg("\u041d\u0435 \u043f\u043e\u043b\u0443\u0447\u0438\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \ud83d\ude15 \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437"); }
      renderRem();
    }
    function send() {
      fetch(api() + "/api/remind", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ initData: init, on: !!on, hour: hour, tz: -new Date().getTimezoneOffset(), lang: lang() || "es" }) })
        .then(function (r) { return r.json().catch(function () { return null; }); })
        .then(function (j) { done(!!(j && j.ok), j); })
        .catch(function () { done(false); });
    }
    if (on && !quiet && tg.requestWriteAccess && window.ver && window.ver("6.9")) { try { tg.requestWriteAccess(function () { send(); }); return; } catch (e) {} }
    send();
  }

  // ---------- \u0432\u043a\u043b\u0430\u0434\u043a\u0438 ----------
  function navBtn(g) { return document.querySelector('.nav [data-go="' + g + '"]'); }
  function buildNav() {
    var nav = document.querySelector(".nav"); if (!nav) return;
    var w = navBtn("words"); if (w) w.style.display = "none";
    var c = navBtn("catalog"), h = navBtn("home"); if (c && h && h.nextSibling !== c) nav.insertBefore(c, h.nextSibling);
    navFriends();
  }
  function navFriends() { var f = navBtn("friends"); if (f) f.style.display = friendsN() > 0 ? "" : "none"; }
  function navOn(g) { var nb = document.querySelectorAll(".nav button"); for (var i = 0; i < nb.length; i++) nb[i].classList.toggle("on", nb[i].getAttribute("data-go") === g); }
  function buildBack() {
    ["scr_words", "scr_friends"].forEach(function (id) {
      var h = document.querySelector("#" + id + " .header"); if (!h || h.querySelector(".v5bk")) return;
      var b = E("button", "iconbtn v5bk", "\u2190"); b.onclick = function () { window.goBack(); }; h.insertBefore(b, h.firstChild);
    });
  }

  // ---------- \u043e\u043d\u0431\u043e\u0440\u0434\u0438\u043d\u0433 ----------
  function isFresh() { var s = window.S || {}; return !(s.rounds > 0) && !(s.xp > 0); }
  function onbOpen() {
    if ($("v5onb")) return;
    var o = E("div", "v5onb"); o.id = "v5onb"; document.body.appendChild(o);
    var st = { l: null, lv: 0 };
    function opt(e, t, s, fn) { var b = E("button", "v5opt", '<span class="e">' + e + '</span><span class="x"><b></b><small></small></span>'); b.querySelector("b").textContent = t; b.querySelector("small").textContent = s; b.onclick = function () { hap("light"); fn(); }; o.appendChild(b); }
    function head(n, title, sub) {
      o.innerHTML = "";
      var bar = E("div", "v5step", "<i></i><i></i><i></i>"); for (var i = 0; i < n; i++) bar.children[i].className = "on"; o.appendChild(bar);
      if (n > 1) { var bk = E("button", "v5ob", "\u2190 \u041d\u0430\u0437\u0430\u0434"); bk.onclick = function () { if (n === 2) s1(); else s2(); }; o.appendChild(bk); }
      var h = E("h1"); h.textContent = title; o.appendChild(h);
      var p = E("p", "sub"); p.textContent = sub; o.appendChild(p);
      o.scrollTop = 0;
    }
    function s1() {
      head(1, "\u041f\u0440\u0438\u0432\u0435\u0442! \ud83d\udc4b \u041a\u0430\u043a\u043e\u0439 \u044f\u0437\u044b\u043a \u0443\u0447\u0438\u043c?", "\u0428\u0430\u0433 1 \u0438\u0437 3. \u0412\u0442\u043e\u0440\u043e\u0439 \u044f\u0437\u044b\u043a \u043c\u043e\u0436\u043d\u043e \u0432\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u043f\u043e\u0437\u0436\u0435.");
      opt("\ud83c\uddea\ud83c\uddf8", "\u0418\u0441\u043f\u0430\u043d\u0441\u043a\u0438\u0439", "\u0421 \u043d\u0443\u043b\u044f \u00b7 \u0436\u0438\u0437\u043d\u044c \u0432 \u0418\u0441\u043f\u0430\u043d\u0438\u0438", function () { st.l = "es"; setTr("es"); s2(); });
      opt("\ud83c\uddec\ud83c\udde7", "\u0410\u043d\u0433\u043b\u0438\u0439\u0441\u043a\u0438\u0439", "B1+ \u00b7 \u0433\u043e\u0432\u043e\u0440\u0438\u043c \u0441\u0432\u043e\u0431\u043e\u0434\u043d\u043e, \u043f\u0440\u043e\u0445\u043e\u0434\u0438\u043c \u0441\u043e\u0431\u0435\u0441\u044b", function () { st.l = "en"; setTr("en"); s2(); });
    }
    function s2() {
      head(2, "\u041a\u0430\u043a\u043e\u0439 \u0443 \u0442\u0435\u0431\u044f \u0443\u0440\u043e\u0432\u0435\u043d\u044c?", "\u0428\u0430\u0433 2 \u0438\u0437 3. \u041f\u043e\u0434\u0431\u0435\u0440\u0451\u043c, \u0441 \u043a\u0430\u043a\u043e\u0439 \u0442\u0435\u043c\u044b \u043d\u0430\u0447\u0430\u0442\u044c.");
      LEVELS[st.l].forEach(function (x) { opt("\ud83d\udcf6", x[0], x[1], function () { st.lv = x[2]; s3(); }); });
    }
    function s3() {
      head(3, "\u0417\u0430\u0447\u0435\u043c \u0442\u0435\u0431\u0435 " + LNAME[st.l] + "?", "\u0428\u0430\u0433 3 \u0438\u0437 3. \u0421 \u044d\u0442\u043e\u0433\u043e \u043d\u0430\u0447\u043d\u0451\u043c, \u043e\u0441\u0442\u0430\u043b\u044c\u043d\u044b\u0435 \u0431\u043b\u043e\u043a\u0438 \u0442\u043e\u0436\u0435 \u0431\u0443\u0434\u0443\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b.");
      GOALS[st.l].forEach(function (g) { opt(g[1], g[2], g[3], function () { finish(g); }); });
    }
    function finish(g) {
      P.lang = st.l; P.lvl = P.lvl || {}; P.lvl[st.l] = st.lv; P.ord = P.ord || {}; P.ord[st.l] = g[4]; P.goal = g[0]; P.onb = 1; saveP();
      trk("onboarding_done", { track: st.l, goal: g[0], level: st.lv });
      if (o.parentNode) o.parentNode.removeChild(o);
      hap("success"); window.renderHome();
      whenReady(go);
    }
    s1();
  }
  function inferLang() {
    if (lang()) return;
    var s = window.S || {}, c = { es: 0, en: 0 };
    Object.keys(s.best || {}).forEach(function (k) { var p = k.split(":")[0]; if (c[p] != null) c[p]++; });
    ["es", "en"].forEach(function (l) { blocks(l).forEach(function (b) { b.topics.forEach(function (tp) { if (passed(tp.id)) c[l] += 2; }); }); });
    P.lang = c.en > c.es ? "en" : "es"; saveP(); setTr(P.lang);
  }

  // ---------- \u043e\u0431\u0451\u0440\u0442\u043a\u0438 \u043d\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u0438 ----------
  var _show = window.show, _rh = window.renderHome, _gb = window.goBack;
  window.renderHome = function () { var r = _rh.apply(this, arguments); try { home(); } catch (e) { console.error(e); } return r; };
  window.show = function (name) {
    var r = _show.apply(this, arguments);
    try {
      if (name !== "quiz" && name !== "play" && window.hideSheet) window.hideSheet();
      if (name === "words" || name === "friends") navOn("profile");
      if (name === "topic" || name === "cheat") navOn("catalog");
      if (name === "profile") renderProf();
      if (name === "catalog") whenReady(function () { if (window.current === "catalog") tip("catalog"); });
      if (name !== "home" && name !== "catalog") { var t = $("v5tip"); if (t && t.parentNode) t.parentNode.removeChild(t); }
      navFriends();
    } catch (e) { console.error(e); }
    return r;
  };
  window.goBack = function () { if (window.current === "words" || window.current === "friends") { window.show("profile"); return; } return _gb.apply(this, arguments); };

  // ---------- \u0441\u0442\u0438\u043b\u0438 ----------
  function css() {
    var s = E("style"); s.textContent = [
      ".v5hero{width:100%;display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left;padding:18px 18px 16px;margin:0 0 12px;border:none;border-radius:22px;background:var(--acc);color:#12131C;cursor:pointer;font-family:inherit;box-shadow:0 10px 30px rgba(0,0,0,.28)}",
      ".v5hero .k{font-size:13px;font-weight:900;letter-spacing:.08em}.v5hero .t{font-size:20px;font-weight:800;line-height:1.25}.v5hero .s{font-size:14px;font-weight:600;opacity:.85}",
      ".v5hero.wait{background:var(--card);color:var(--text);border:1px solid var(--line)}",
      ".v5rev{display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;margin:0 0 12px;color:var(--text);font-family:inherit;font-size:16px;font-weight:800;text-align:left;cursor:pointer;border-radius:18px}",
      ".v5rev .e,.v5lnk .e{font-size:24px}.v5rev .x,.v5lnk .x{flex:1}.v5rev small,.v5lnk small{display:block;color:var(--muted);font-size:13px;font-weight:600}",
      ".v5rev .n{min-width:30px;padding:4px 8px;border-radius:999px;background:var(--err);color:#12131C;font-weight:900;text-align:center}",
      ".v5mini{display:flex;gap:8px;margin:0 0 18px}.v5mini button{flex:1;padding:10px 4px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--text);font-family:inherit;font-size:13px;font-weight:700;cursor:pointer}",
      ".v5sw{display:block;margin:6px auto 0;padding:9px 16px;border-radius:999px;border:1px solid var(--line);background:none;color:var(--muted);font-family:inherit;font-size:14px;font-weight:700;cursor:pointer}",
      ".v5bl{display:block;color:var(--muted);font-size:13px;margin-top:4px}",
      ".v5tip{position:relative;margin:0 0 14px;padding:12px 38px 12px 14px;border-radius:16px;background:rgba(255,255,255,.08);border:1px solid var(--acc);color:var(--text);font-size:14px;line-height:1.45;cursor:pointer}.v5tip::after{content:'\u2715';position:absolute;right:13px;top:11px;color:var(--muted)}",
      ".v5onb{position:fixed;inset:0;z-index:100;background:var(--bg);overflow:auto;padding:24px 18px calc(28px + env(safe-area-inset-bottom))}",
      ".v5onb h1{font-size:26px;line-height:1.25;margin:12px 0 6px}.v5onb .sub{color:var(--muted);font-size:15px;margin-bottom:20px}",
      ".v5step{display:flex;gap:6px;margin-bottom:6px}.v5step i{flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.12)}.v5step i.on{background:var(--acc)}",
      ".v5ob{background:none;border:none;color:var(--muted);font-family:inherit;font-size:15px;padding:8px 0 0;cursor:pointer}",
      ".v5opt{display:flex;align-items:center;gap:14px;width:100%;padding:16px;margin-bottom:10px;border-radius:18px;border:1px solid var(--line);background:var(--card);color:var(--text);font-family:inherit;text-align:left;cursor:pointer}",
      ".v5opt .e{font-size:28px}.v5opt .x{flex:1}.v5opt b{display:block;font-size:17px;color:var(--text)}.v5opt small{display:block;color:var(--muted);font-size:14px}",
      ".v5ph{display:flex;gap:12px;align-items:flex-start}.v5ph .e{font-size:26px}.v5ph b{color:var(--text);font-size:16px}.v5ph p{color:var(--muted);font-size:13px}",
      ".v5chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.v5chip{padding:8px 12px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.05);color:var(--text);font-family:inherit;font-size:14px;font-weight:700;cursor:pointer}.v5chip.on{background:var(--acc);color:#12131C;border-color:transparent}",
      ".v5st{color:var(--muted);font-size:13px;margin-top:10px}",
      ".nav button{font-size:13px!important}#scr_home .label,.label{font-size:13px!important}",
      ".v5lnk{display:flex;align-items:center;gap:12px;width:100%;color:var(--text);font-family:inherit;font-size:16px;font-weight:800;text-align:left;cursor:pointer}.v5lnk .go{color:var(--muted);font-size:22px}"
    ].join("\n");
    document.head.appendChild(s);
  }

  // ---------- \u0441\u0442\u0430\u0440\u0442 ----------
  function init() {
    css(); buildHome(); buildProfile(); buildNav(); buildBack();
    if (!P.onb) { if (isFresh()) onbOpen(); else { P.onb = 1; saveP(); whenReady(inferLang); } }
    else if (!lang()) whenReady(inferLang);
    whenReady(function () { if (lang()) setTr(lang()); });
    poll();
    if (window.current === "home") window.renderHome();
  }
  window.__v5 = { P: P, RV: RV, nextTopic: nextTopic, dueCards: dueCards, runReview: runReview, onbOpen: onbOpen, home: home, today: today };
  init();
})();
