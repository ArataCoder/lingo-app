/* Lingo Brain v5.8: mascot greeting on the home screen at every app launch. Loaded AFTER v53.js. */
(function () {
  "use strict";
  var st = document.createElement("style");
  st.textContent = ".lbm.home{margin:2px 0 14px}.lbm.home .pic{flex:0 0 64px;width:64px;height:64px}.lbm.home .say{font-size:15px}";
  document.head.appendChild(st);
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function name() {
    var u = document.getElementById("uname"), t = u ? (u.textContent || "").trim() : "";
    if (!t || t === "друг") { try { t = Telegram.WebApp.initDataUnsafe.user.first_name || ""; } catch (e) { t = ""; } }
    return t && t !== "друг" ? t : "";
  }
  function streak() { try { return window.currentStreak ? currentStreak() : ((window.S || {}).streak || 0); } catch (e) { return 0; } }
  function text(gap) {
    var n = name(), c = n ? ", " + n : "", s = streak(), h = new Date().getHours();
    if (gap >= 2) return pick(["С возвращением" + c + "! Соскучилась 😺 Начнём с лёгкой разминки?", "О, ты вернулся" + c + "! Без стресса: одна карточка, и уже молодец."]);
    if (s >= 2 && Math.random() < 0.5) return pick(["Серия " + s + " 🔥 Пара карточек, и она цела.", "Уже " + s + " дн. подряд 🔥 Держим темп, я рядом."]);
    if (h >= 5 && h < 12) return pick(["Доброе утро" + c + "! ☀️ Пара минут, и мозг проснётся.", "Утро" + c + "! Одна тема за кофе?"]);
    if (h >= 12 && h < 18) return pick(["Привет" + c + "! Готов к паре карточек?", "Хей" + c + "! Пять минут на язык, и свободен."]);
    if (h >= 18 && h < 23) return pick(["Добрый вечер" + c + "! Одна тема перед отдыхом?", "Вечер" + c + "! Лёгкая разминка, без подвигов."]);
    return pick(["Ночной заход" + c + "? 🌙 Давай что-нибудь лёгкое.", "Не спится" + c + "? Пара карточек, и спать 😴"]);
  }
  var tries = 0;
  function go() {
    var scr = document.getElementById("scr_home"), top = scr && scr.querySelector(".top"), M = window.__v52 && window.__v52.mascot;
    if (!scr || !top || !M) { if (tries++ < 40) setTimeout(go, 250); return; }
    if (scr.querySelector(".lbm.home")) return;
    var now = Date.now(), last = 0;
    try { last = +localStorage.getItem("lb_seen") || 0; localStorage.setItem("lb_seen", String(now)); } catch (e) {}
    var gap = last ? Math.floor((now - last) / 86400000) : 0;
    var m = M("start", text(gap));
    m.classList.add("home");
    top.parentNode.insertBefore(m, top.nextSibling);
    try { if (window.lbTrack) window.lbTrack("mascot_shown", { pose: "home", gap: gap }); } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(go, 400); });
  else setTimeout(go, 400);
  window.__v54 = { go: go };
})();
