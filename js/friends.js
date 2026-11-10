/* Lingo Brain v3.6/3.7: друзья + рейтинг, реф-ссылки, карточка игрока, тумблер нейроголоса */
(function () {
  "use strict";
  var BOT = "LingoBrainBOT", API = "https://lingo-brain-bot.lingobrain.workers.dev";
  var tg = window.Telegram && Telegram.WebApp && Telegram.WebApp.initData ? Telegram.WebApp : null;
  var me = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null;
  var COL = { es: "#F7A046", en: "#9D7CD8" }, OK = "#10B981";
  var FKEY = "lingo_friends", MODE = "week", LAST_SYNC = 0, BUSY = false, FR_ERR = false, FR_EC = "";
  var FR = null; try { FR = JSON.parse(localStorage.getItem(FKEY) || "null"); } catch (e) { FR = null; }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function hap(t) { try { if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(t || "light"); } catch (e) {} }
  function ver(v) { try { return !!(tg && tg.isVersionAtLeast && tg.isVersionAtLeast(v)); } catch (e) { return false; } }
  function base() { try { var u = window.__v3.V.cfg.analytics.statsUrl; if (u) return u.replace("/api/event", ""); } catch (e) {} return API; }
  function refLink() { return "https://t.me/" + BOT + (me ? "?start=ref_" + me.id : ""); }
  function avaUrl(p) { if (p.me && me && me.photo_url) return me.photo_url; return base() + "/ava/" + p.id + ".jpg"; }
  var AVA = null;
  function loadAva() { if (!me) return; var im = new Image(); im.crossOrigin = "anonymous"; im.onload = function () { AVA = im; }; im.src = base() + "/ava/" + me.id + ".jpg"; }
  setTimeout(loadAva, 1500);
  function trk(n, p) { try { if (window.lbTrack) window.lbTrack(n, p || {}); } catch (e) {} }
  function note(t) { try { if (window.toast) return window.toast(t); } catch (e) {} try { if (tg && tg.showAlert) tg.showAlert(t); } catch (e) {} }
  function post(path, body) {
    var ac = window.AbortController ? new AbortController() : null; if (ac) setTimeout(function () { ac.abort(); }, 12000);
    return fetch(base() + path, { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify(body), signal: ac ? ac.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return { ok: false, status: r.status }; }); });
  }
  function myStats() {
    var S = window.S || {}, learned = 0, streak = 0;
    try { learned = window.__v3.wCounts().learned || 0; } catch (e) {}
    try { streak = window.currentStreak ? currentStreak() : (S.streak || 0); } catch (e) {}
    return { xp: S.xp || 0, streak: streak, learned: learned, rounds: S.rounds || 0 };
  }

  // ---------- стили ----------
  var css = document.createElement("style");
  css.textContent = [
    ".fr{padding:18px 16px 120px}.fr h2{margin:4px 0 2px;font-size:26px}.frsub{color:var(--dim);margin:0 0 14px;font-size:14px}",
    ".seg{display:flex;gap:6px;padding:4px;border-radius:16px;background:rgba(255,255,255,.05);margin-bottom:14px}",
    ".seg button{flex:1;border:none;background:none;color:var(--dim);font:800 14px inherit;font-family:inherit;padding:10px;border-radius:12px;cursor:pointer}",
    ".seg button.on{background:rgba(255,255,255,.1);color:var(--text)}",
    ".frow{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;margin-bottom:8px;position:relative}",
    ".frow.me{outline:2px solid rgba(247,160,70,.6)}.frk{width:30px;text-align:center;font-weight:900;font-size:18px;color:var(--dim)}",
    ".frow.plus{background:linear-gradient(135deg,rgba(247,160,70,.13),rgba(157,124,216,.12));border:1px solid rgba(247,160,70,.42);box-shadow:0 6px 20px -8px rgba(247,160,70,.28)}",
    ".fav{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#12131C;flex:none;position:relative;overflow:hidden}", ".fav img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover}",
    ".frow.plus .fav{box-shadow:0 0 0 2.5px #F7A046,0 0 12px rgba(247,160,70,.55)}",
    ".fstar{display:inline-flex;align-items:center;gap:3px;margin-left:6px;padding:1px 7px;border-radius:999px;background:linear-gradient(135deg,#F7A046,#FFD166);color:#12131C;font-size:11px;font-weight:900;vertical-align:1px;box-shadow:0 2px 8px rgba(247,160,70,.35)}",
    ".fnm{flex:1;min-width:0}.fnm b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fnm span{color:var(--dim);font-size:13px}",
    ".fxp{text-align:right;font-weight:900;font-size:18px}.fxp span{display:block;color:var(--dim);font-size:11px;font-weight:700}",
    "#frList{margin-bottom:18px}.fr>.btn{display:block;position:relative;margin:0}.frretry{margin-top:14px;min-height:44px;padding:10px 20px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--text);font-family:inherit;font-size:15px;font-weight:800;cursor:pointer}.frspin{display:inline-block;width:14px;height:14px;margin-right:8px;vertical-align:-2px;border:2px solid rgba(255,255,255,.18);border-top-color:var(--acc);border-radius:50%;animation:frsp .8s linear infinite}@keyframes frsp{to{transform:rotate(360deg)}}",
    ".frec{display:block;margin-top:10px;font-size:12px;color:var(--dim);font-variant-numeric:tabular-nums}",
    ".frempty{text-align:center;color:var(--dim);padding:22px 8px;line-height:1.5}.frhint{color:var(--dim);font-size:13px;text-align:center;line-height:1.45;margin-top:10px}",
    ".nav button{font-size:11px;padding:8px 2px}",
    "#cardOv{position:fixed;inset:0;z-index:50;background:rgba(10,11,18,.92);display:none;flex-direction:column;align-items:center;justify-content:center;padding:16px;gap:10px;overflow:auto}",
    "#cardOv.on{display:flex}#cardOv img{width:min(100%,380px);border-radius:22px;box-shadow:0 20px 60px rgba(0,0,0,.5)}",
    "#cardOv .btn{width:min(100%,380px);margin:0}",
    ".cthemes{display:flex;gap:6px;width:min(100%,380px);justify-content:center;flex-wrap:wrap}",
    ".cthm{flex:1;min-width:76px;min-height:44px;padding:8px 10px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(36,40,59,.85);color:var(--text);font:800 12px inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px}",
    ".cthm.on{border-color:#F7A046;background:rgba(247,160,70,.18);color:#FFD166}",
    ".cthm.lk{opacity:.78}",
    ".lbsup{position:relative;overflow:hidden;border:1px solid rgba(247,160,70,.38);background:linear-gradient(145deg,rgba(247,160,70,.12),rgba(157,124,216,.1) 60%,rgba(36,40,59,.9))}",
    ".lbsup.on{border-color:rgba(16,185,129,.45);background:linear-gradient(145deg,rgba(16,185,129,.12),rgba(247,160,70,.1) 65%,rgba(36,40,59,.9))}",
    ".lbsup-h{display:flex;gap:12px;align-items:flex-start}.lbsup-e{font-size:26px;line-height:1}.lbsup-h b{color:var(--text);font-size:16px;display:block}.lbsup-h p{color:var(--muted);font-size:13px;line-height:1.4;margin:3px 0 0}",
    ".lbsup-perks{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 12px}",
    ".lbsup-tag{padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:12px;font-weight:700;color:var(--text)}",
    ".lbsup-btn{width:100%;min-height:46px;padding:11px 16px;border-radius:14px;border:none;background:linear-gradient(135deg,#F7A046,#FFD166);color:#12131C;font:900 15px inherit;cursor:pointer;box-shadow:0 8px 20px -6px rgba(247,160,70,.45)}",
    ".lbsup-act{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:6px;font-size:13px;color:#10B981;font-weight:800}",
    ".lbsup-preview{padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:var(--text);font:800 13px inherit;cursor:pointer}",
    ".avatar.plus{box-shadow:0 0 0 2.5px #F7A046,0 0 14px rgba(247,160,70,.55)}"
  ].join("");
  document.head.appendChild(css);

  // ---------- синхронизация / рейтинг ----------
  function sync(force) {
    if (!tg || BUSY) return Promise.resolve(FR);
    if (!force && Date.now() - LAST_SYNC < 15000) return Promise.resolve(FR);
    BUSY = true; LAST_SYNC = Date.now();
    var sp = (tg.initDataUnsafe && tg.initDataUnsafe.start_param) || "";
    var tz = -new Date().getTimezoneOffset(); // minutes east of UTC, used for reminder time
    return post("/api/sync", { initData: tg.initData, stats: myStats(), ref: sp, tz: tz }).then(function (j) {
      BUSY = false; FR_ERR = !(j && j.ok); FR_EC = FR_ERR ? String((j && (j.error || (j.status ? "http " + j.status : ""))) || "empty") : ""; if (FR_ERR && window.current === "friends") render();
      if (j && j.ok) { FR = { list: j.friends || [], ts: Date.now() }; try { localStorage.setItem(FKEY, JSON.stringify(FR)); } catch (e) {} if (window.current === "friends") render(); }
      if (j && j.ok && j.premium) setPremium(j.premium);
      return FR;
    }).catch(function (e) { BUSY = false; FR_ERR = true; FR_EC = String((e && e.name) || "network"); if (window.current === "friends") render(); return FR; });
  }
  window.lbSync = sync;

  // ---------- v6.2/6.4: Premium & Косметика (поддержка за звёзды) ----------
  // Server is the source of truth; the cached copy only avoids a flash before the first sync.
  var PKEY = "lingo_premium", CKEY = "lingo_cosmetic", PREM = { enabled: false, active: false, until: 0, stars: 150 };
  var COS = { theme: "classic", badge: true };
  try { PREM = JSON.parse(localStorage.getItem(PKEY) || "null") || PREM; } catch (e) {}
  try { COS = Object.assign(COS, JSON.parse(localStorage.getItem(CKEY) || "null") || {}); } catch (e) {}
  function saveCos() { try { localStorage.setItem(CKEY, JSON.stringify(COS)); } catch (e) {} }
  function setPremium(p) {
    var was = !!(PREM.active && PREM.until * 1000 > Date.now());
    PREM = { enabled: !!p.enabled, active: !!p.active, until: Number(p.until) || 0, stars: Number(p.stars) || 150 };
    try { localStorage.setItem(PKEY, JSON.stringify(PREM)); } catch (e) {}
    var now = !!(PREM.active && PREM.until * 1000 > Date.now());
    if (now && COS.theme === "classic") { COS.theme = "gold"; saveCos(); }
    applyCosmetics();
    if (now !== was) LB.emit("premium", now);
  }
  LB.premium = function () { return { enabled: PREM.enabled, active: !!(PREM.active && PREM.until * 1000 > Date.now()), until: PREM.until, stars: PREM.stars || 150 }; };
  LB.isPremium = function () { return LB.premium().active; };
  LB.cosmetics = function () { return { theme: LB.isPremium() ? (COS.theme || "gold") : "classic", badge: LB.isPremium() && COS.badge !== false }; };
  LB.buyPremium = function () {
    if (!tg || !tg.openInvoice || !ver("6.1")) { note("Оплата звёздами доступна внутри Telegram ⭐"); return Promise.resolve(false); }
    trk("premium_checkout", {});
    return post("/api/invoice", { initData: tg.initData }).then(function (j) {
      if (!j || !j.ok || !j.url) { note("Поддержка звёздами скоро заработает ⭐ Спасибо за желание помочь!"); return false; }
      return new Promise(function (res) {
        tg.openInvoice(j.url, function (status) {
          trk("premium_" + status, {});
          if (status === "paid") {
            hap("medium");
            note("Спасибо за поддержку Lingo Brain! ⭐ Косметика открыта!");
            setTimeout(function () { sync(true); }, 1200);
          }
          res(status === "paid");
        });
      });
    }).catch(function () { note("Нет связи, попробуй ещё раз"); return false; });
  };
  window.lbFrRetry = function () { FR_ERR = false; render(); sync(true); };

  function applyCosmetics() {
    var av = $("avatar"), un = $("uname"), on = LB.isPremium() && COS.badge !== false;
    if (av) av.classList.toggle("plus", on);
    if (un) {
      var st = un.querySelector(".fstar");
      if (on && !st) { st = document.createElement("span"); st.className = "fstar"; st.textContent = "⭐"; un.appendChild(st); }
      else if (!on && st) st.remove();
    }
    renderSupportBox();
  }

  function render() {
    var box = $("frList"); if (!box) return;
    if (!tg) { box.innerHTML = '<div class="frempty glass">👥 Рейтинг друзей работает внутри Telegram.<br>Открой приложение через @' + BOT + '</div>'; return; }
    var list = (FR && FR.list ? FR.list : []).slice();
    if (!list.length) { box.innerHTML = FR_ERR ? '<div class="frempty glass" role="status"><b>Рейтинг не загрузился</b><br>' + (FR_EC === "auth" ? "Telegram не подтвердил вход. Закрой приложение и открой заново через @" + BOT + "." : "Проверь интернет и попробуй ещё раз.") + '<br><button type="button" class="frretry" onclick="lbFrRetry()">Повторить</button><small class="frec">код: ' + esc(FR_EC) + '</small></div>' : '<div class="frempty glass" role="status"><span class="frspin" aria-hidden="true"></span>Загружаю рейтинг…</div>'; if (!FR_ERR && !BUSY) sync(true); return; }
    var key = MODE === "week" ? "week" : "xp";
    list.sort(function (a, b) { return (b[key] - a[key]) || (b.xp - a.xp); });
    var medals = ["🥇", "🥈", "🥉"], pal = ["#F7A046", "#9D7CD8", "#10B981", "#7AA2F7", "#F7768E", "#E0AF68"];
    var h = "";
    list.forEach(function (p, i) {
      var nm = p.me ? "Ты" : (p.name || "Игрок"), letter = String(p.name || "?").charAt(0).toUpperCase();
      var isPlus = !!(p.plus || (p.me && LB.isPremium()));
      var badge = isPlus && (!p.me || COS.badge !== false) ? '<span class="fstar" title="Поддержал Lingo Brain">⭐ Плюс</span>' : "";
      h += '<div class="frow glass' + (p.me ? " me" : "") + (isPlus ? " plus" : "") + '"><div class="frk">' + (i < 3 && p[key] > 0 ? medals[i] : (i + 1)) + '</div>' +
        '<div class="fav" style="background:' + pal[Math.abs(p.id) % pal.length] + '">' + esc(letter) + '<img alt="" src="' + esc(avaUrl(p)) + '" onerror="this.remove()"></div>' +
        '<div class="fnm"><b>' + esc(nm) + badge + '</b><span>🔥 ' + (p.streak || 0) + ' · 🎓 ' + (p.learned || 0) + ' слов · LVL ' + (Math.floor((p.xp || 0) / 200) + 1) + '</span></div>' +
        '<div class="fxp">' + (p[key] || 0) + '<span>' + (MODE === "week" ? "XP за неделю" : "XP всего") + '</span></div></div>';
    });
    if (list.length === 1) h += '<div class="frempty">Пока тут только ты 🙂<br>Пригласи друга — соревноваться вдвоём веселее.</div>';
    box.innerHTML = h;
  }
  window.lbFriendsMode = function (m) {
    MODE = m; hap("light");
    var b = document.querySelectorAll("#frSeg button");
    for (var i = 0; i < b.length; i++) b[i].classList.toggle("on", b[i].getAttribute("data-m") === m);
    render();
  };
  window.lbInvite = function () {
    hap("medium"); trk("invite_clicked", {});
    var text = "Учу испанский и английский в Lingo Brain 🧠 Давай соревноваться — кто больше XP за неделю?";
    var url = "https://t.me/share/url?url=" + encodeURIComponent(refLink()) + "&text=" + encodeURIComponent(text);
    try { if (tg && tg.openTelegramLink) { tg.openTelegramLink(url); return; } } catch (e) {}
    try { window.open(url, "_blank"); } catch (e) {}
  };

  // «Поделиться» теперь с личной реф-ссылкой (друг сразу попадёт в твой рейтинг)
  LB.handle("share", function () {
    if (!me || !tg) return false;
    var xp = window.LB_LAST_XP || 0;
    var text = "Мой раунд в Lingo Brain: " + xp + " XP! Попробуй обогнать меня 🧠";
    hap("medium"); trk("share_clicked", { xp: xp, track: (window.LAST && LAST.lang) || null, ref: true });
    try { tg.openTelegramLink("https://t.me/share/url?url=" + encodeURIComponent(refLink()) + "&text=" + encodeURIComponent(text)); return true; } catch (e) { return false; }
  });

  // ---------- блок «Поддержать Lingo Brain» на экране Прогресса ----------
  function buildSupportBox() {
    var prof = $("scr_profile"); if (!prof || $("lbSupBox")) return;
    var box = document.createElement("div");
    box.id = "lbSupBox";
    box.className = "pcard glass lbsup";
    prof.appendChild(box);
  }
  function renderSupportBox() {
    buildSupportBox();
    var box = $("lbSupBox"); if (!box) return;
    var pr = LB.premium(), active = pr.active, stars = pr.stars || 150;
    box.classList.toggle("on", active);
    if (active) {
      var untilStr = pr.until ? new Date(pr.until * 1000).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : "";
      box.innerHTML =
        '<div class="lbsup-h"><span class="lbsup-e">⭐</span><div><b>Спасибо за поддержку Lingo Brain!</b>' +
        '<p>Все 80 тем бесплатны для всех — в том числе благодаря тебе 💛' + (untilStr ? " Активно до " + esc(untilStr) + "." : "") + '</p></div></div>' +
        '<div class="lbsup-perks">' +
        '<span class="lbsup-tag">✨ Золотая рамка и ⭐ в рейтинге</span>' +
        '<span class="lbsup-tag">🎨 4 стиля Карточки игрока</span>' +
        '</div>' +
        '<div class="lbsup-act"><span>✅ Косметика включена</span>' +
        '<button type="button" class="lbsup-preview" onclick="lbCard()">🎨 Открыть карточку</button></div>';
    } else {
      box.innerHTML =
        '<div class="lbsup-h"><span class="lbsup-e">⭐</span><div><b>Поддержать Lingo Brain</b>' +
        '<p>Базовое обучение и все 80 тем всегда 100% бесплатны. Если приложение помогает — поддержи проект звёздами и получи приятную косметику:</p></div></div>' +
        '<div class="lbsup-perks">' +
        '<span class="lbsup-tag">⭐ Значок и рамка в рейтинге</span>' +
        '<span class="lbsup-tag">🎨 Стили «Золото», «Аврора», «Неон»</span>' +
        '<span class="lbsup-tag">💛 Плюс в карму</span>' +
        '</div>' +
        '<button type="button" class="lbsup-btn" id="lbSupBtn">⭐ Поддержать за ' + stars + ' Stars</button>';
      var btn = $("lbSupBtn");
      if (btn) btn.onclick = function () { hap("light"); LB.buyPremium(); };
    }
  }

  LB.on("home", applyCosmetics);
  LB.on("premium", function () { applyCosmetics(); if (window.current === "friends") render(); });
  LB.on("show", function (name) {
    if (name === "friends") { render(); sync(true); }
    if (name === "profile") renderSupportBox();
    if (name === "result") setTimeout(function () { sync(true); }, 300);
    if (name === "words") setTimeout(neuralBox, 0);
  });

  // ---------- тумблер нейроголоса (mp3) ----------
  function neuralBox() {
    var old = $("neuralBox"); if (old) old.remove(); return;
    var vb = $("voiceBox"); if (!vb || !window.__v3 || !window.__v3.audioInfo) return;
    var nb = $("neuralBox");
    if (!nb) { nb = document.createElement("div"); nb.id = "neuralBox"; nb.className = "glass"; nb.style.cssText = "padding:12px 14px;border-radius:18px;margin:10px 0"; vb.parentNode.insertBefore(nb, vb); }
    var VS = window.__v3.VS(), info = window.__v3.audioInfo(), on = VS.neural !== false;
    nb.innerHTML = '<label style="display:flex;align-items:center;gap:10px;font-weight:800;cursor:pointer"><input type="checkbox" id="neuralChk"' + (on ? " checked" : "") + ' style="width:22px;height:22px"> 🧠 Нейроголос (mp3)</label>' +
      '<div style="color:var(--dim);font-size:13px;margin-top:6px">' + (info.count ? ("Готово " + info.count + " записей живым голосом. Чего нет в записях — скажет лучший голос телефона.") : "Записи ещё не сгенерированы — пока говорит лучший голос телефона.") + '</div>';
    $("neuralChk").onchange = function () { window.__v3.setNeural(this.checked); hap("light"); try { window.__v3.say(this.checked ? "¡Hola! ¿Qué tal?" : "Hola", "es-ES"); } catch (e) {} };
  }
  window.lbNeuralBox = neuralBox;

  // ---------- карточка игрока + кастомные темы ----------
  var CARD_THEMES = {
    classic: { id: "classic", label: "🌙 Классика", free: true, bg0: "#1A1B26", bg1: "#12131C", card: "rgba(36,40,59,0.72)", badge: "" },
    gold:    { id: "gold",    label: "⭐ Золото",   free: false, bg0: "#241C14", bg1: "#121018", card: "rgba(44,35,26,0.78)", c1: "#FFD166", c2: "#F7A046", badge: "⭐ SUPPORTER" },
    aurora:  { id: "aurora",  label: "🌌 Аврора",   free: false, bg0: "#112233", bg1: "#0E1324", card: "rgba(22,38,58,0.75)", c1: "#2DD4BF", c2: "#A78BFA", badge: "✨ AURORA PLUS" },
    cyber:   { id: "cyber",   label: "⚡ Неон",     free: false, bg0: "#1F1135", bg1: "#110B22", card: "rgba(38,20,66,0.76)", c1: "#F472B6", c2: "#38BDF8", badge: "⚡ HYPERFOCUS" }
  };
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function fit(c, text, max, size, weight) { var s = size; do { c.font = weight + " " + s + "px " + FONT; s -= 2; } while (c.measureText(text).width > max && s > 18); return s + 2; }
  var FONT = "-apple-system, 'Segoe UI', Roboto, 'Noto Sans', Arial, sans-serif";
  function txt(id) { var e = $(id); return e ? (e.textContent || "").trim() : ""; }
  function topicTitle() {
    try { var L = window.LAST || {}, T = window.__v3.V.topics; var t = T[L.topic] || T[L.lang + "." + L.topic]; if (t && t.title) return t.title; } catch (e) {}
    return "";
  }
  function drawStar(c, cx, cy, r, col) {
    c.save(); c.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = (i * Math.PI) / 5 - Math.PI / 2, rad = i % 2 === 0 ? r : r * 0.44;
      c[i === 0 ? "moveTo" : "lineTo"](cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    c.closePath(); c.fillStyle = col; c.fill(); c.restore();
  }
  function drawCard(themeKey) {
    var W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var c = cv.getContext("2d"), S = window.S || {}, L = (window.LAST && LAST.lang) === "en" ? "en" : "es";
    var tk = themeKey || (LB.isPremium() ? (COS.theme || "gold") : "classic");
    var th = CARD_THEMES[tk] || CARD_THEMES.classic;
    var A = th.c1 || COL[L], B = th.c2 || OK;
    var st = myStats(), lvl = Math.floor((S.xp || 0) / 200) + 1, name = (me && me.first_name) || window.nm || "Игрок";
    var xp = (txt("resXp").replace(/[^0-9]/g, "") || String(window.LB_LAST_XP || S.xp || 0));
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.bg0); g.addColorStop(1, th.bg1); c.fillStyle = g; c.fillRect(0, 0, W, H);
    function glow(x, y, r, col, a) { var rg = c.createRadialGradient(x, y, 0, x, y, r); c.globalAlpha = a; rg.addColorStop(0, col); rg.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = rg; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    glow(900, 170, 620, A, 0.38); glow(140, 1240, 520, B, 0.24);
    if (th.id !== "classic") {
      glow(540, 580, 480, A, 0.14);
      [[150, 190, 10], [930, 420, 12], [170, 780, 9], [910, 820, 11], [860, 1180, 9]].forEach(function (s) { drawStar(c, s[0], s[1], s[2], A); });
    }
    rr(c, 60, 60, 960, 1230, 56); c.fillStyle = th.card; c.fill();
    var sg = c.createLinearGradient(60, 60, 1020, 1290); sg.addColorStop(0, A); sg.addColorStop(1, B); c.lineWidth = th.id === "classic" ? 4 : 6; c.strokeStyle = sg; c.stroke();
    c.textBaseline = "middle"; c.textAlign = "left"; c.fillStyle = "#EEEEFF"; c.font = "900 42px " + FONT; c.fillText("LINGO BRAIN 🧠", 120, 160);
    var pill = th.badge ? (th.badge + " · " + (L === "en" ? "EN" : "ES")) : (L === "en" ? "EN · Английский" : "ES · Испанский");
    c.font = "800 28px " + FONT; var pw = c.measureText(pill).width + 48;
    rr(c, 960 - pw, 128, pw, 64, 32); c.globalAlpha = 0.2; c.fillStyle = A; c.fill(); c.globalAlpha = 1; c.lineWidth = 2.5; c.strokeStyle = A; c.stroke(); c.fillStyle = A; c.fillText(pill, 984 - pw, 161);
    var ag = c.createLinearGradient(120, 250, 280, 410); ag.addColorStop(0, A); ag.addColorStop(1, B);
    c.beginPath(); c.arc(200, 330, 84, 0, Math.PI * 2); c.fillStyle = ag; c.fill();
    c.textAlign = "center"; c.fillStyle = "#12131C"; c.font = "900 80px " + FONT; c.fillText(String(name).charAt(0).toUpperCase(), 200, 334);
    if (AVA) { try { c.save(); c.beginPath(); c.arc(200, 330, 78, 0, Math.PI * 2); c.clip(); c.drawImage(AVA, 122, 252, 156, 156); c.restore(); } catch (e) {} }
    rr(c, 145, 392, 110, 46, 23); c.fillStyle = "#12131C"; c.fill(); c.strokeStyle = A; c.lineWidth = 3; c.stroke(); c.fillStyle = "#EEEEFF"; c.font = "900 24px " + FONT; c.fillText("LVL " + lvl, 200, 416);
    var dispName = (LB.isPremium() || th.id !== "classic") ? (name + " ⭐") : name;
    c.textAlign = "left"; c.fillStyle = "#EEEEFF"; fit(c, dispName, 640, 62, "900"); c.fillText(dispName, 320, 305);
    c.fillStyle = "#8A91B4"; c.font = "700 32px " + FONT; c.fillText(L === "en" ? "прокачивает английский" : "прокачивает испанский", 320, 365);
    c.textAlign = "center"; var big = "+" + xp + " XP"; fit(c, big, 860, 190, "900");
    var bg = c.createLinearGradient(160, 0, 920, 0); bg.addColorStop(0, A); bg.addColorStop(1, B); c.fillStyle = bg; c.fillText(big, 540, 600);
    var title = txt("resTitle") || "Раунд пройден!"; c.fillStyle = "#EEEEFF"; fit(c, title, 860, 48, "900"); c.fillText(title, 540, 730);
    var sc = txt("resScore"); c.fillStyle = "#8A91B4"; c.font = "700 34px " + FONT; c.fillText(sc ? ("Сделано: " + sc) : "ещё один шаг к свободной речи", 540, 790);
    var tiles = [["🔥", st.streak, "дн. серия"], ["🎓", st.learned, "слов выучено"], ["⚡", S.xp || 0, "XP всего"]];
    tiles.forEach(function (t, i) {
      var x = 120 + i * 290; rr(c, x, 870, 260, 230, 32); c.fillStyle = "rgba(255,255,255,0.05)"; c.fill(); c.strokeStyle = th.id === "classic" ? "rgba(255,255,255,0.09)" : A; c.globalAlpha = th.id === "classic" ? 1 : 0.35; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1;
      c.font = "56px " + FONT; c.fillStyle = "#EEEEFF"; c.fillText(t[0], x + 130, 935);
      fit(c, String(t[1]), 230, 64, "900"); c.fillText(String(t[1]), x + 130, 1012);
      c.fillStyle = "#8A91B4"; c.font = "700 26px " + FONT; c.fillText(t[2], x + 130, 1066);
    });
    var tt = topicTitle(); if (tt) { c.fillStyle = "#8A91B4"; fit(c, "Тема: " + tt, 860, 32, "700"); c.fillText("Тема: " + tt, 540, 1160); }
    c.fillStyle = A; c.font = "900 36px " + FONT; c.fillText("Обгони меня → t.me/" + BOT, 540, 1222);
    var d = new Date(); c.fillStyle = "#565F89"; c.font = "700 24px " + FONT; c.fillText(d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }), 540, 1262);
    return cv.toDataURL("image/jpeg", 0.88);
  }
  window.lbDrawCard = drawCard;

  var CARD = null, CARD_URL = null;
  function renderThemeBar() {
    var bar = $("cardThemes"); if (!bar) return;
    var cur = LB.isPremium() ? (COS.theme || "gold") : "classic";
    var h = "";
    Object.keys(CARD_THEMES).forEach(function (k) {
      var t = CARD_THEMES[k], locked = !t.free && !LB.isPremium();
      h += '<button type="button" class="cthm' + (cur === k ? " on" : "") + (locked ? " lk" : "") + '" data-th="' + k + '">' + t.label + (locked ? " 🔒" : "") + '</button>';
    });
    bar.innerHTML = h;
    Array.prototype.forEach.call(bar.querySelectorAll("button"), function (b) {
      b.onclick = function () {
        var k = b.getAttribute("data-th"), t = CARD_THEMES[k];
        if (!t.free && !LB.isPremium()) {
          hap("light");
          LB.buyPremium().then(function (paid) { if (paid) selectCardTheme(k); });
          return;
        }
        selectCardTheme(k);
      };
    });
  }
  function selectCardTheme(k) {
    COS.theme = k; saveCos(); hap("light");
    try { CARD = drawCard(k); CARD_URL = null; if ($("cardImg")) $("cardImg").src = CARD; } catch (e) {}
    renderThemeBar();
  }
  function ov() {
    var o = $("cardOv"); if (o) return o;
    o = document.createElement("div"); o.id = "cardOv";
    o.innerHTML = '<img id="cardImg" alt="Карточка игрока">' +
      '<div class="cthemes" id="cardThemes" role="group" aria-label="Стиль карточки"></div>' +
      '<button class="btn ok" id="cardSend">📨 Прислать в чат (перешлёшь друзьям)</button>' +
      '<button class="btn" id="cardStory">📲 В сторис</button>' +
      '<button class="btn ghost" id="cardSave">💾 Сохранить</button>' +
      '<button class="btn ghost" id="cardClose">Закрыть</button>';
    document.body.appendChild(o);
    $("cardClose").onclick = function () { o.classList.remove("on"); };
    $("cardSend").onclick = function () { upload(true); };
    $("cardStory").onclick = story;
    $("cardSave").onclick = save;
    return o;
  }
  function upload(send) {
    if (!tg) { note("Открой в Telegram, чтобы отправить карточку"); return Promise.resolve(null); }
    if (CARD_URL && !send) return Promise.resolve(CARD_URL);
    var b = $(send ? "cardSend" : "cardStory"), old = b ? b.textContent : ""; if (b) { if (b.disabled) return Promise.resolve(null); b.disabled = true; b.textContent = "⏳ Секунду…"; }
    return post("/api/card", { initData: tg.initData, image: CARD, send: !!send }).then(function (j) {
      if (b) { b.textContent = old; b.disabled = false; }
      if (!j || !j.ok) { note("Не получилось — попробуй ещё раз"); return null; }
      CARD_URL = j.url; trk("card_" + (send ? "sent" : "uploaded"), {});
      if (send) { if (j.sent) { hap("medium"); note("✅ Карточка в чате с ботом — перешли друзьям!"); } else note("Бот не смог прислать — нажми «Старт» в чате с @" + BOT); }
      return j.url;
    }).catch(function () { if (b) { b.textContent = old; b.disabled = false; } note("Нет связи — попробуй позже"); return null; });
  }
  function story() {
    if (!ver("7.8") || !tg.shareToStory) { note("Сторис доступны в свежем Telegram на телефоне. Сохрани картинку или пришли в чат 😉"); return; }
    upload(false).then(function (u) { if (!u) return; try { tg.shareToStory(u, { text: "Обгони меня в Lingo Brain 🧠 " + refLink() }); } catch (e) { note("Не вышло открыть сторис"); } });
  }
  function save() {
    if (ver("8.0") && tg.downloadFile) { upload(false).then(function (u) { if (u) try { tg.downloadFile({ url: u, file_name: "lingo-brain.jpg" }); } catch (e) { note("Не вышло — зажми картинку и сохрани"); } }); return; }
    try { var a = document.createElement("a"); a.href = CARD; a.download = "lingo-brain.jpg"; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {}
    if (tg) note("Если не скачалось — зажми картинку и сохрани, или пришли в чат");
  }
  window.lbCard = function () {
    hap("medium"); trk("card_opened", {});
    try { CARD = drawCard(); CARD_URL = null; } catch (e) { note("Не вышло нарисовать карточку"); return; }
    var o = ov(); renderThemeBar(); $("cardImg").src = CARD; o.classList.add("on");
  };

  // старт: тихо синхронизируемся (и применяем ref из startapp, если есть)
  setTimeout(function () { applyCosmetics(); }, 0);
  setTimeout(function () { sync(true); }, 2500);
})();
