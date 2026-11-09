/* Lingo Brain v5.1: 4 fixed tabs, touch targets >= 44px, a11y, offline banner,
   hero variant A, compact header, review mistakes right after a round. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var V5 = function () { return window.__v5 || {}; };
  var V3 = function () { return window.__v3 || {}; };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function plural(n, a, b, c) { n = Math.abs(n) % 100; var m = n % 10; if (n > 10 && n < 20) return c; if (m > 1 && m < 5) return b; if (m === 1) return a; return c; }
  function hap(t) { try { Telegram.WebApp.HapticFeedback.impactOccurred(t || "light"); } catch (e) {} }
  function st() { try { return window.S || {}; } catch (e) { return {}; } }

  // ---------- 1. CSS: touch targets, focus, contrast, reduced motion, cards ----------
  var css = [
    ":root{--dim:#9199C4}",
    "button,[role=button]{touch-action:manipulation;-webkit-tap-highlight-color:transparent}",
    "button,[role=button],.v5chip,.v5opt,.v5lnk{min-height:44px}",
    ".v51ic{min-width:44px}",
    "button:active,[role=button]:active{transform:scale(.97);transition:transform 80ms ease-out}",
    ":focus-visible{outline:3px solid #7AA2F7;outline-offset:2px;border-radius:12px}",
    ".nav button{min-height:52px;font-size:13px;color:var(--muted)}",
    ".nav button.on{color:var(--text)}",
    ".screen{overflow-wrap:break-word}",
    ".screen h2,.screen h3,.screen p,.screen b,.screen span,.screen button{overflow-wrap:break-word;word-break:normal;hyphens:manual}",
    ".top .chips .v51off{display:none!important}",
    "#v51st{margin-top:4px;font-size:13px;color:var(--muted);font-weight:700}",
    ".v5hero.v51a{position:relative;display:block;text-align:left;background:#24283B;background:color-mix(in srgb,var(--acc) 9%,#24283B);color:var(--text);border:1px solid #3B4261;border-color:color-mix(in srgb,var(--acc) 30%,#3B4261);border-radius:24px;padding:20px 18px 16px;box-shadow:0 14px 30px -14px rgba(0,0,0,.6);transition:transform .18s cubic-bezier(.16,1,.3,1)}",
    ".v5hero.v51a:active{transform:scale(.985)}",
    ".v51h{display:flex;flex-direction:column;gap:12px;width:100%}",
    ".v51t{display:block;font-size:22px;line-height:1.2;font-weight:800;letter-spacing:-.01em;text-wrap:balance}",
    ".v51m{display:flex;align-items:baseline;justify-content:space-between;gap:12px;font-size:13px;font-weight:700;color:#A9B1D6}",
    ".v51m b{color:var(--text);font-weight:800;font-variant-numeric:tabular-nums;white-space:nowrap}",
    ".v51seg{display:flex;gap:4px;width:100%}",
    ".v51seg i{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.1)}",
    ".v51seg i.d{background:var(--acc)}",
    ".v51seg i.c{background:transparent;box-shadow:inset 0 0 0 1.5px var(--acc)}",
    ".v51bar{display:block;width:100%;height:6px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden}",
    ".v51bar i{display:block;height:100%;background:var(--acc);border-radius:3px}",
    ".v51f{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:4px}",
    ".v51go{display:block;font-size:17px;font-weight:800;color:var(--text)}",
    ".v51go small{display:block;font-size:13px;font-weight:700;color:#A9B1D6;margin-top:2px}",
    ".v51p{flex:none;width:56px;height:56px;border-radius:50%;background:var(--acc);color:#12131C;display:grid;place-items:center;box-shadow:0 0 0 6px rgba(255,255,255,.04),0 8px 20px -8px var(--acc)}",
    ".v51p svg{display:block;width:26px;height:26px}",
    "#v51net{position:fixed;left:12px;right:12px;top:calc(8px + env(safe-area-inset-top));z-index:60;padding:12px 14px;border-radius:14px;background:#3B2F1E;color:#FFE2B8;font-size:14px;font-weight:700;line-height:1.35;box-shadow:0 8px 24px rgba(0,0,0,.35);display:none}",
    "#v51net.on{display:block}",
    "#v51rv{width:100%}",
    "@media (prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}"
  ].join("\n");
  var stEl = document.createElement("style"); stEl.id = "v51css"; stEl.textContent = css; document.head.appendChild(stEl);

  // ---------- 2. Navigation: always 4 tabs ----------
  var TABS = [["home", "\uD83C\uDFE0", "\u0413\u043b\u0430\u0432\u043d\u0430\u044f"], ["catalog", "\uD83D\uDDC2", "\u0422\u0435\u043c\u044b"], ["profile", "\uD83D\uDCCA", "\u041f\u0440\u043e\u0433\u0440\u0435\u0441\u0441"], ["friends", "\uD83D\uDC65", "\u0414\u0440\u0443\u0437\u044c\u044f"]];
  var PARENT = { words: "profile", topic: "catalog", track: "catalog" };
  function nav(g) {
    var n = document.querySelector(".nav"); if (!n) return;
    n.setAttribute("aria-label", "\u041e\u0441\u043d\u043e\u0432\u043d\u043e\u0435 \u043c\u0435\u043d\u044e");
    TABS.forEach(function (t) {
      var b = n.querySelector('button[data-go="' + t[0] + '"]');
      if (!b) { b = document.createElement("button"); b.setAttribute("data-go", t[0]); b.onclick = function () { window.show(t[0]); }; }
      if (b.getAttribute("data-v51") !== "1") { b.innerHTML = '<span class="i" aria-hidden="true">' + t[1] + "</span>" + t[2]; b.setAttribute("data-v51", "1"); b.type = "button"; }
      b.style.display = "";
      n.appendChild(b); // fixed order
    });
    Array.prototype.forEach.call(n.querySelectorAll("button"), function (b) {
      var go = b.getAttribute("data-go");
      if (!TABS.some(function (t) { return t[0] === go; })) { b.style.display = "none"; return; }
      var on = go === (PARENT[g] || g);
      b.classList.toggle("on", on);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
  }

  // ---------- 3. Header: only the streak next to the name ----------
  function header() {
    var ch = document.querySelector(".top .chips"); if (!ch) return;
    Array.prototype.forEach.call(ch.children, function (c) {
      var keep = !!c.querySelector("#streak");
      c.classList.toggle("v51off", !keep);
      if (keep) { var n = st().streak || 0; c.setAttribute("aria-label", "\u0421\u0435\u0440\u0438\u044f: " + n + " " + plural(n, "\u0434\u0435\u043d\u044c", "\u0434\u043d\u044f", "\u0434\u043d\u0435\u0439")); }
    });
    var sub = $("goalSub"); if (!sub) return;
    var line = $("v51st");
    if (!line) { line = document.createElement("div"); line.id = "v51st"; sub.parentNode.insertBefore(line, sub.nextSibling); }
    var s = st(), f = s.freezes || 0, xp = s.xp || 0;
    line.textContent = "\u2744\uFE0F " + f + " " + plural(f, "\u0437\u0430\u043c\u043e\u0440\u043e\u0437\u043a\u0430", "\u0437\u0430\u043c\u043e\u0440\u043e\u0437\u043a\u0438", "\u0437\u0430\u043c\u043e\u0440\u043e\u0437\u043e\u043a") + " \u00B7 \u26A1 " + xp + " XP";
  }

  // ---------- 4. Hero variant A: card + clear button ----------
  function passedId(id) {
    try { if (V3().isPassed) return !!V3().isPassed(id); } catch (e) {}
    var p = st().passed; return !!(p && p.indexOf && p.indexOf(id) >= 0);
  }
  function hero() {
    var h = $("v5hero"); if (!h || /\bwait\b/.test(h.className)) { if (h) h.classList.remove("v51a"); return; }
    var l = (window.LAST && LAST.lang) || "es", nt = null;
    try { var P = V5().P; if (P && P.lang) l = P.lang; } catch (e) {}
    try { nt = V5().nextTopic ? V5().nextTopic(l) : null; } catch (e) { nt = null; }
    if (!nt || !nt.tp || !nt.block) { h.classList.remove("v51a"); return; }
    var k = h.querySelector(".k"), start = k && /\u041d\u0410\u0427\u0410\u0422\u042c/.test(k.textContent);
    var tps = nt.block.topics || [], i = tps.indexOf(nt.tp) + 1, n = tps.length || 1;
    if (i < 1) { for (var j = 0; j < tps.length; j++) if (tps[j].id === nt.tp.id) i = j + 1; }
    var done = tps.filter(function (x) { return passedId(x.id); }).length, pct = Math.round(done / n * 100);
    var label = start ? "\u041d\u0430\u0447\u0430\u0442\u044c" : "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c";
    h.classList.add("v51a");
    h.setAttribute("aria-label", label + ": " + nt.tp.title + ", \u0442\u0435\u043c\u0430 " + Math.max(i, 1) + " \u0438\u0437 " + n + ", \u043e\u043a\u043e\u043b\u043e 2 \u043c\u0438\u043d\u0443\u0442");
    var seg = "";
    if (n <= 12) { seg = '<span class="v51seg">'; for (var q = 0; q < n; q++) { var tq = tps[q] || {}; seg += '<i class="' + (passedId(tq.id) ? "d" : (q === i - 1 ? "c" : "")) + '"></i>'; } seg += "</span>"; }
    else seg = '<span class="v51bar"><i style="width:' + pct + '%"></i></span>';
    h.innerHTML =
      '<span class="v51h" aria-hidden="true">' +
      '<span class="v51t">' + esc(nt.tp.title) + "</span>" +
      '<span class="v51m"><span>' + esc(nt.block.title || "") + "</span><b>" + Math.max(i, 1) + " \u0438\u0437 " + n + "</b></span>" + seg +
      '<span class="v51f"><span class="v51go">' + label + "<small>\u2248 2 \u043c\u0438\u043d\u0443\u0442\u044b</small></span>" +
      '<span class="v51p"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7.3v9.4a1.1 1.1 0 0 0 1.66.94l7.5-4.7a1.1 1.1 0 0 0 0-1.88l-7.5-4.7A1.1 1.1 0 0 0 9 7.3z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg></span></span></span>';
  }

  // ---------- 5. Offline banner ----------
  function net(changed) {
    var b = $("v51net");
    if (!b) { b = document.createElement("div"); b.id = "v51net"; b.setAttribute("role", "status"); b.setAttribute("aria-live", "polite"); document.body.appendChild(b); }
    var off = navigator.onLine === false;
    b.className = off ? "on" : "";
    b.textContent = off ? "\uD83D\uDCE1 \u041d\u0435\u0442 \u0441\u0435\u0442\u0438. \u041e\u0442\u043a\u0440\u044b\u0442\u044b\u0435 \u0442\u0435\u043c\u044b \u0440\u0430\u0431\u043e\u0442\u0430\u044e\u0442, \u043f\u0440\u043e\u0433\u0440\u0435\u0441\u0441 \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u0441\u044f \u043d\u0430 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0435." : "";
    if (changed && !off && window.toast) toast("\u2705 \u0421\u0435\u0442\u044c \u0432\u0435\u0440\u043d\u0443\u043b\u0430\u0441\u044c");
  }
  window.addEventListener("offline", function () { net(true); hap("light"); });
  window.addEventListener("online", function () { net(true); });

  // ---------- 6. Review mistakes right after a round ----------
  function resultReview() {
    var box = document.querySelector("#scr_result .result"); if (!box) return;
    var old = $("v51rv"); if (old) old.remove();
    var due = 0;
    try { due = V5().dueCards ? V5().dueCards((window.LAST && LAST.lang) || undefined).length : 0; } catch (e) { due = 0; }
    if (!due) return;
    var b = document.createElement("button"); b.id = "v51rv"; b.type = "button"; b.className = "btn ok";
    b.textContent = "\uD83D\uDD01 \u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c \u043e\u0448\u0438\u0431\u043a\u0438 \u0441\u0435\u0439\u0447\u0430\u0441 \u00B7 " + due;
    b.setAttribute("aria-label", "\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c \u043e\u0448\u0438\u0431\u043a\u0438 \u0441\u0435\u0439\u0447\u0430\u0441: " + due + " " + plural(due, "\u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430", "\u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438", "\u043a\u0430\u0440\u0442\u043e\u0447\u0435\u043a"));
    b.onclick = function () { hap("light"); try { V5().runReview(); } catch (e) { window.show("home"); } };
    var first = $("shareBtn") || box.querySelector("button");
    box.insertBefore(b, first);
  }

  // ---------- 7. A11y pass: icon-only buttons, div-buttons ----------
  var ICON = { "\uD83D\uDD0A": "\u041e\u0437\u0432\u0443\u0447\u0438\u0442\u044c", "\u2715": "\u0417\u0430\u043a\u0440\u044b\u0442\u044c", "\u00D7": "\u0417\u0430\u043a\u0440\u044b\u0442\u044c", "\u2039": "\u041d\u0430\u0437\u0430\u0434", "\u2190": "\u041d\u0430\u0437\u0430\u0434", "\uD83C\uDF99": "\u0417\u0430\u043f\u0438\u0441\u0430\u0442\u044c \u0433\u043e\u043b\u043e\u0441", "\uD83C\uDFA4": "\u0417\u0430\u043f\u0438\u0441\u0430\u0442\u044c \u0433\u043e\u043b\u043e\u0441", "\u23F8": "\u041f\u0430\u0443\u0437\u0430", "\u2699\uFE0F": "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438" };
  function a11y(root) {
    root = root || document;
    Array.prototype.forEach.call(root.querySelectorAll("button"), function (b) {
      var txt = (b.textContent || "").trim();
      // Twemoji may already have swapped the emoji for <img alt="🔊">, leaving no text.
      if (!txt) { var em = b.querySelector("img.emj[alt]"); if (em) txt = em.getAttribute("alt"); }
      if (!/[A-Za-z\u0400-\u04FF0-9]/.test(txt)) {
        b.classList.add("v51ic");
        if (!b.getAttribute("aria-label")) { var lab = ICON[txt] || b.title; if (lab) b.setAttribute("aria-label", lab); }
      }
    });
    Array.prototype.forEach.call(root.querySelectorAll("div[onclick],span[onclick],li[onclick]"), function (d) {
      if (d.getAttribute("role")) return;
      d.setAttribute("role", "button"); d.tabIndex = 0;
      d.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); d.click(); } });
    });
  }
  var pend = false;
  function soon() { if (pend) return; pend = true; (window.requestAnimationFrame || setTimeout)(function () { pend = false; try { a11y(); } catch (e) {} }); }
  try { new MutationObserver(soon).observe(document.body, { childList: true, subtree: true }); } catch (e) {}

  // ---------- 8. Hooks ----------
  function after(g) {
    try { nav(g); } catch (e) {}
    try { header(); } catch (e) {}
    if (g === "home") { try { hero(); } catch (e) {} }
    if (g === "result") { try { resultReview(); } catch (e) {} }
  }
  LB.on("show", after);
  LB.on("home", function () { try { header(); hero(); } catch (e) { LB.report(e, "shell:home"); } });
  // v50 rebuilds the hero asynchronously after content loads
  try { var hh = $("v5hero"); if (hh) new MutationObserver(function () { if (!hh.querySelector(".v51h") && !/\bwait\b/.test(hh.className)) hero(); }).observe(hh, { childList: true }); } catch (e) {}

  after(window.current || "home"); net(false); a11y();
  window.__v51 = { nav: nav, header: header, hero: hero, net: net, resultReview: resultReview, a11y: a11y };
})();
