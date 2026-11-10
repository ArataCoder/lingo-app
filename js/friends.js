/* Lingo Brain v3.6–v6.5: друзья + рейтинг, достижения, рамки и титулы, карточка игрока, поддержка в 3 уровня */
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
  function avaUrl(p) { return base() + "/ava/" + p.id + ".jpg"; }
  var AVA = null;
  function loadAva() {
    if (!me) return;
    var im = new Image(); im.crossOrigin = "anonymous";
    im.onload = function () { AVA = im; };
    im.onerror = function () {
      if (me.photo_url && im.src !== me.photo_url) im.src = me.photo_url;
    };
    im.src = base() + "/ava/" + me.id + ".jpg";
  }
  setTimeout(loadAva, 900);
  function trk(n, p) { try { if (window.lbTrack) window.lbTrack(n, p || {}); } catch (e) {} }
  function note(t) { try { if (window.toast) return window.toast(t); } catch (e) {} try { if (tg && tg.showAlert) tg.showAlert(t); } catch (e) {} }
  function post(path, body) {
    var ac = window.AbortController ? new AbortController() : null; if (ac) setTimeout(function () { ac.abort(); }, 12000);
    return fetch(base() + path, { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify(body), signal: ac ? ac.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return { ok: false, status: r.status }; }); });
  }
  function passedCount() {
    var n = 0;
    try {
      var V = window.__v3 && window.__v3.V;
      if (V && V.topics && window.__v3.isPassed) {
        Object.keys(V.topics).forEach(function (id) { if (window.__v3.isPassed(id)) n++; });
        return n;
      }
    } catch (e) {}
    try { var b = (window.S && window.S.best) || {}; Object.keys(b).forEach(function (k) { if (b[k] >= 3) n++; }); } catch (e) {}
    return n;
  }
  function myStats() {
    var S = window.S || {}, learned = 0, streak = 0;
    try { learned = window.__v3.wCounts().learned || 0; } catch (e) {}
    try { streak = window.currentStreak ? currentStreak() : (S.streak || 0); } catch (e) {}
    var bestStreak = Math.max(S.bestStreak || 0, streak);
    var eq = equippedCos();
    return {
      xp: S.xp || 0,
      streak: streak,
      bestStreak: bestStreak,
      learned: learned,
      rounds: S.rounds || 0,
      topics: passedCount(),
      frame: eq.frame,
      title: eq.title
    };
  }

  // ---------- Рамки, Титулы, Достижения ----------
  var FRAMES = [
    { id: "default", name: "Стандарт",    icon: "⚪", desc: "Базовая рамка",         col: "#7AA2F7", c2: "#3B4261", check: function () { return true; } },
    { id: "fire",    name: "Огненная",    icon: "🔥", desc: "Серия 3+ дня",          col: "#F7A046", c2: "#F7768E", check: function (st) { return st.bestStreak >= 3; } },
    { id: "emerald", name: "Изумрудная",  icon: "🎓", desc: "10+ выученных слов",    col: "#10B981", c2: "#2DD4BF", check: function (st) { return st.learned >= 10; } },
    { id: "neon",    name: "Неоновая",    icon: "⚡", desc: "10+ раундов или 300 XP", col: "#9D7CD8", c2: "#38BDF8", check: function (st) { return st.rounds >= 10 || st.xp >= 300; } },
    { id: "gold",    name: "Золотая VIP", icon: "👑", desc: "За поддержку проекта ⭐", col: "#FFD166", c2: "#F7A046", vip: true, check: function () { return LB.isPremium(); } }
  ];
  var TITLES = [
    { id: "newbie", label: "🌱 Новичок",      desc: "Доступен со старта",        check: function () { return true; } },
    { id: "streak", label: "🔥 Машина серии", desc: "Серия 3+ дня подряд",       check: function (st) { return st.bestStreak >= 3; } },
    { id: "words",  label: "🎓 Полиглот",     desc: "Выучить 10+ слов",          check: function (st) { return st.learned >= 10; } },
    { id: "cyber",  label: "⚡ Кибермозг",    desc: "10+ раундов или 300 XP",    check: function (st) { return st.rounds >= 10 || st.xp >= 300; } },
    { id: "legend", label: "🏆 Легенда Lingo", desc: "1000+ XP или 7 дней серии", check: function (st) { return st.xp >= 1000 || st.bestStreak >= 7; } },
    { id: "vip",    label: "⭐ Меценат",      desc: "За поддержку проекта ⭐",    vip: true, check: function () { return LB.isPremium(); } }
  ];
  var ACHS = [
    { id: "r1",   icon: "🚀", title: "Первый шаг",          desc: "Пройти первый раунд до конца",          max: 1,    val: function (s) { return s.rounds; } },
    { id: "r10",  icon: "⚡", title: "Разгон мозга",        desc: "Пройти 10 раундов",                     max: 10,   val: function (s) { return s.rounds; }, reward: "Рамка «Неоновая» + титул «Кибермозг»" },
    { id: "s3",   icon: "🔥", title: "Огонь в глазах",      desc: "Держать серию 3 дня подряд",            max: 3,    val: function (s) { return s.bestStreak; }, reward: "Рамка «Огненная» + титул «Машина серии»" },
    { id: "s7",   icon: "🗓", title: "Неделя без пропусков", desc: "Держать серию 7 дней подряд",           max: 7,    val: function (s) { return s.bestStreak; }, reward: "Титул «Легенда Lingo»" },
    { id: "w10",  icon: "📗", title: "Первая десятка",      desc: "Выучить 10 слов в карточках",           max: 10,   val: function (s) { return s.learned; }, reward: "Рамка «Изумрудная» + титул «Полиглот»" },
    { id: "w50",  icon: "🎓", title: "Словарь в голове",    desc: "Выучить 50 слов",                       max: 50,   val: function (s) { return s.learned; } },
    { id: "x300", icon: "💎", title: "300 XP",              desc: "Набрать 300 очков опыта",               max: 300,  val: function (s) { return s.xp; } },
    { id: "x1k",  icon: "🏆", title: "Тысячник",            desc: "Набрать 1000 очков опыта",              max: 1000, val: function (s) { return s.xp; }, reward: "Титул «Легенда Lingo»" },
    { id: "t5",   icon: "🗺", title: "Первооткрыватель",    desc: "Пройти 5 тем на 60% и выше",            max: 5,    val: function (s) { return s.topics; } },
    { id: "sup",  icon: "💛", title: "Меценат Lingo Brain", desc: "Поддержать проект звёздами Telegram",   max: 1,    val: function () { return LB.isPremium() ? 1 : 0; }, reward: "Золотая VIP-рамка + титул «Меценат» + 4 темы карточки" }
  ];

  // ---------- стили ----------
  var css = document.createElement("style");
  css.textContent = [
    ".fr{padding:18px 16px 120px}.fr h2{margin:4px 0 2px;font-size:26px}.frsub{color:var(--dim);margin:0 0 14px;font-size:14px}",
    ".seg{display:flex;gap:6px;padding:4px;border-radius:16px;background:rgba(255,255,255,.05);margin-bottom:14px}",
    ".seg button{flex:1;border:none;background:none;color:var(--dim);font:800 14px inherit;font-family:inherit;padding:10px;border-radius:12px;cursor:pointer}",
    ".seg button.on{background:rgba(255,255,255,.1);color:var(--text)}",
    ".frow{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;margin-bottom:8px;position:relative}",
    ".frow.me{outline:2px solid rgba(247,160,70,.6)}.frk{width:30px;text-align:center;font-weight:900;font-size:18px;color:var(--dim)}",
    ".frow.plus{background:linear-gradient(135deg,rgba(247,160,70,.12),rgba(157,124,216,.1));border:1px solid rgba(247,160,70,.38)}",
    ".fav{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#12131C;flex:none;position:relative;overflow:hidden}",
    ".fav img:not(.emj){position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover}",
    /* Frame styles on avatars (.avatar, .fav, .ach-av) */
    ".fr-default{box-shadow:0 0 0 2px rgba(122,162,247,.45)}",
    ".fr-fire{box-shadow:0 0 0 2.5px #F7A046,0 0 12px rgba(247,160,70,.55)}",
    ".fr-emerald{box-shadow:0 0 0 2.5px #10B981,0 0 12px rgba(16,185,129,.55)}",
    ".fr-neon{box-shadow:0 0 0 2.5px #9D7CD8,0 0 14px rgba(157,124,216,.65)}",
    ".fr-gold{box-shadow:0 0 0 2.5px #FFD166,0 0 16px rgba(255,209,102,.7)}",
    ".utitle{display:inline-flex;align-items:center;gap:4px;margin-top:2px;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:var(--text);font-size:11px;font-weight:800;cursor:pointer;max-width:fit-content}",
    ".utitle.vip{background:rgba(255,209,102,.15);border-color:rgba(255,209,102,.45);color:#FFD166}",
    ".ftitle{display:inline-block;margin-left:6px;padding:1px 7px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:#D6D9F0;font-size:11px;font-weight:800;vertical-align:1px}",
    ".ftitle.vip{background:rgba(255,209,102,.16);border-color:rgba(255,209,102,.45);color:#FFD166}",
    ".fnm{flex:1;min-width:0}.fnm b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text)}.fnm span{color:var(--dim);font-size:13px}",
    ".fxp{text-align:right;font-weight:900;font-size:18px}.fxp span{display:block;color:var(--dim);font-size:11px;font-weight:700}",
    "#frList{margin-bottom:18px}.fr>.btn{display:block;position:relative;margin:0}.frretry{margin-top:14px;min-height:44px;padding:10px 20px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--text);font-family:inherit;font-size:15px;font-weight:800;cursor:pointer}.frspin{display:inline-block;width:14px;height:14px;margin-right:8px;vertical-align:-2px;border:2px solid rgba(255,255,255,.18);border-top-color:var(--acc);border-radius:50%;animation:frsp .8s linear infinite}@keyframes frsp{to{transform:rotate(360deg)}}",
    ".frec{display:block;margin-top:10px;font-size:12px;color:var(--dim);font-variant-numeric:tabular-nums}",
    ".frempty{text-align:center;color:var(--dim);padding:22px 8px;line-height:1.5}.frhint{color:var(--dim);font-size:13px;text-align:center;line-height:1.45;margin-top:10px}",
    ".nav button{font-size:11px;padding:8px 2px}",
    /* Fixed #cardOv modal: #cardImg selector prevents Twemoji .emj from stretching! */
    "#cardOv{position:fixed;inset:0;z-index:80;background:rgba(10,11,18,.94);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:none;flex-direction:column;align-items:center;justify-content:center;padding:14px 16px calc(16px + env(safe-area-inset-bottom));gap:10px;overflow-y:auto}",
    "#cardOv.on{display:flex}",
    "#cardImg{width:min(100%,330px);max-height:50vh;object-fit:contain;border-radius:20px;box-shadow:0 16px 44px rgba(0,0,0,.55);display:block}",
    ".cthemes{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;width:min(100%,350px)}",
    ".cthm{min-height:44px;padding:6px 4px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(36,40,59,.9);color:var(--text);font:800 11px inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:3px;white-space:nowrap}",
    ".cthm.on{border-color:#FFD166;background:rgba(255,209,102,.18);color:#FFD166}",
    ".cthm.lk{opacity:.7}",
    ".cacts{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:min(100%,350px)}",
    ".cacts .btn{margin:0;padding:12px 10px;font-size:14px;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:6px}",
    ".cacts .btn.full{grid-column:1/-1}",
    /* Redesigned Support Card on Profile (#lbSupBox) */
    ".lbsup{position:relative;overflow:hidden;border:1px solid rgba(255,209,102,.35);background:linear-gradient(145deg,rgba(247,160,70,.1),rgba(157,124,216,.08) 60%,rgba(36,40,59,.92))}",
    ".lbsup.on{border-color:rgba(16,185,129,.45);background:linear-gradient(145deg,rgba(16,185,129,.12),rgba(247,160,70,.08) 65%,rgba(36,40,59,.92))}",
    ".lbsup-h{display:flex;gap:12px;align-items:flex-start}.lbsup-e{font-size:26px;line-height:1;flex:none}",
    ".lbsup-h .lbsup-t{color:#EEEEFF;font-size:16px;font-weight:800;line-height:1.25;display:block}",
    ".lbsup-h p{color:var(--muted);font-size:13px;line-height:1.4;margin:4px 0 0}",
    ".lbsup-perks{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 12px}",
    ".lbsup-tag{padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);font-size:12px;font-weight:700;color:#EEEEFF}",
    ".lbsup-tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px}",
    ".lbsup-tier{min-height:54px;padding:8px 6px;border-radius:14px;border:1px solid rgba(255,209,102,.35);background:rgba(255,209,102,.1);color:#EEEEFF;font-family:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:transform .1s}",
    ".lbsup-tier.hit{background:linear-gradient(135deg,#F7A046,#FFD166);color:#12131C;border-color:transparent;box-shadow:0 6px 16px -4px rgba(247,160,70,.45)}",
    ".lbsup-tier strong{font-size:14px;font-weight:900;display:block;color:inherit}",
    ".lbsup-tier small{font-size:11px;font-weight:700;opacity:.85;display:block;color:inherit}",
    ".lbsup-act{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:6px;font-size:13px;color:#10B981;font-weight:800}",
    ".lbsup-preview{min-height:44px;padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#EEEEFF;font:800 13px inherit;cursor:pointer}",
    /* Achievements & Style Screen (#scr_ach) */
    ".ach-hero{display:flex;align-items:center;gap:14px;padding:16px}",
    ".ach-av{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--acc),#9D7CD8);display:grid;place-items:center;font-weight:900;font-size:24px;color:#12131C;flex:none;position:relative;overflow:hidden}",
    ".ach-av img:not(.emj){position:absolute;inset:0;width:100%;height:100%;object-fit:cover}",
    ".ach-info{flex:1;min-width:0}.ach-info h3{font-size:19px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#EEEEFF}",
    ".ach-info p{font-size:12px;color:var(--muted);margin:4px 0 0;font-weight:700}",
    ".ach-sec{font-size:15px;font-weight:800;margin:16px 2px 8px;display:flex;align-items:center;justify-content:space-between;color:#EEEEFF}",
    ".ach-sec span{font-size:12px;color:var(--muted);font-weight:700}",
    ".ach-frames{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin-bottom:6px}",
    ".ach-fr{padding:10px 8px;border-radius:16px;background:var(--card);border:1.5px solid var(--line);text-align:center;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;color:#EEEEFF;font-family:inherit}",
    ".ach-fr.on{border-color:var(--acc);background:rgba(247,160,70,.12)}",
    ".ach-fr.lk{opacity:.58}",
    ".ach-fr-ring{width:36px;height:36px;border-radius:50%;background:#1A1B26;display:grid;place-items:center;font-size:17px}",
    ".ach-fr strong{font-size:12px;font-weight:800;color:#EEEEFF;display:block}",
    ".ach-fr small{font-size:10px;color:var(--muted);font-weight:700;line-height:1.2;display:block}",
    ".ach-titles{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:6px}",
    ".ach-tl{padding:8px 12px;border-radius:13px;background:var(--card);border:1.5px solid var(--line);color:#EEEEFF;font:800 13px inherit;cursor:pointer;display:inline-flex;align-items:center;gap:5px}",
    ".ach-tl.on{border-color:var(--acc);background:rgba(247,160,70,.14);color:#FFD166}",
    ".ach-tl.lk{opacity:.55}",
    ".ach-list{display:flex;flex-direction:column;gap:8px;padding-bottom:24px}",
    ".ach-item{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;background:var(--card);border:1px solid var(--line)}",
    ".ach-item.done{border-color:rgba(16,185,129,.45);background:rgba(16,185,129,.1)}",
    ".ach-ic{width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,.06);display:grid;place-items:center;font-size:22px;flex:none}",
    ".ach-item:not(.done) .ach-ic{filter:grayscale(.85);opacity:.65}",
    ".ach-bd{flex:1;min-width:0}",
    ".ach-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px}",
    ".ach-top strong{font-size:14px;font-weight:800;color:#EEEEFF}",
    ".ach-top span{font-size:12px;font-weight:800;color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums}",
    ".ach-item.done .ach-top span{color:#10B981}",
    ".ach-bd p{font-size:12px;color:var(--muted);margin:2px 0 6px;line-height:1.3}",
    ".ach-rw{display:inline-block;font-size:11px;font-weight:700;color:#FFD166;background:rgba(255,209,102,.12);padding:2px 7px;border-radius:6px;margin-bottom:6px}",
    ".ach-bar{height:6px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}",
    ".ach-bar i{display:block;height:100%;border-radius:99px;background:var(--acc);transition:width .3s}",
    ".ach-item.done .ach-bar i{background:#10B981}"
  ].join("");
  document.head.appendChild(css);

  // ---------- Косметика, Рамки, Титулы и Premium ----------
  var PKEY = "lingo_premium", CKEY = "lingo_cosmetic", PREM = { enabled: false, active: false, until: 0, stars: 150 };
  var COS = { theme: "classic", frame: "", title: "", badge: true, demo: false };
  try { PREM = JSON.parse(localStorage.getItem(PKEY) || "null") || PREM; } catch (e) {}
  try { COS = Object.assign(COS, JSON.parse(localStorage.getItem(CKEY) || "null") || {}); } catch (e) {}
  function saveCos() { try { localStorage.setItem(CKEY, JSON.stringify(COS)); } catch (e) {} }

  LB.premium = function () {
    var real = !!(PREM.active && PREM.until * 1000 > Date.now());
    return { enabled: PREM.enabled, active: real || !!COS.demo, real: real, demo: !!COS.demo, until: PREM.until, stars: PREM.stars || 150 };
  };
  LB.isPremium = function () { return LB.premium().active; };

  function rawStats() {
    var S = window.S || {}, learned = 0, streak = 0;
    try { learned = window.__v3.wCounts().learned || 0; } catch (e) {}
    try { streak = window.currentStreak ? currentStreak() : (S.streak || 0); } catch (e) {}
    return { xp: S.xp || 0, streak: streak, bestStreak: Math.max(S.bestStreak || 0, streak), learned: learned, rounds: S.rounds || 0, topics: passedCount() };
  }
  function equippedCos() {
    var st = rawStats();
    var fr = FRAMES.filter(function (f) { return f.id === COS.frame && f.check(st); })[0];
    if (!fr) {
      if (LB.isPremium()) fr = FRAMES[4]; // gold
      else if (st.bestStreak >= 3) fr = FRAMES[1];
      else if (st.learned >= 10) fr = FRAMES[2];
      else if (st.rounds >= 10 || st.xp >= 300) fr = FRAMES[3];
      else fr = FRAMES[0];
    }
    var tl = TITLES.filter(function (t) { return t.id === COS.title && t.check(st); })[0];
    if (!tl) {
      if (LB.isPremium()) tl = TITLES[5]; // vip
      else if (st.xp >= 1000 || st.bestStreak >= 7) tl = TITLES[4];
      else if (st.learned >= 10) tl = TITLES[2];
      else if (st.bestStreak >= 3) tl = TITLES[1];
      else if (st.rounds >= 10 || st.xp >= 300) tl = TITLES[3];
      else tl = TITLES[0];
    }
    return { frame: fr.id, frameObj: fr, title: tl.label, titleId: tl.id, titleObj: tl };
  }
  function achCount() {
    var st = rawStats(), done = 0;
    ACHS.forEach(function (a) { if (a.val(st) >= a.max) done++; });
    return { done: done, total: ACHS.length };
  }
  LB.cosmetics = function () {
    var eq = equippedCos();
    return { theme: LB.isPremium() ? (COS.theme || "gold") : "classic", frame: eq.frame, title: eq.title, badge: LB.isPremium() && COS.badge !== false };
  };

  function setPremium(p) {
    var was = LB.isPremium();
    PREM = { enabled: !!p.enabled, active: !!p.active, until: Number(p.until) || 0, stars: Number(p.stars) || 150 };
    try { localStorage.setItem(PKEY, JSON.stringify(PREM)); } catch (e) {}
    var now = LB.isPremium();
    if (now && COS.theme === "classic") { COS.theme = "gold"; saveCos(); }
    applyCosmetics();
    if (now !== was) LB.emit("premium", now);
  }

  window.lbToggleDemo = function () {
    COS.demo = !COS.demo;
    if (COS.demo) {
      if (COS.theme === "classic") COS.theme = "gold";
      if (!COS.frame || COS.frame === "default") COS.frame = "gold";
      if (!COS.title || COS.title === "newbie") COS.title = "vip";
    }
    saveCos(); hap("medium");
    applyCosmetics();
    if (window.current === "friends") render();
    if (window.current === "ach") renderAchScreen();
    LB.emit("premium", LB.isPremium());
    note(COS.demo ? "🎁 Тест косметики включён! Золотая рамка, титул «Меценат» и 4 стиля карточки открыты" : "🔕 Тест косметики выключен");
  };

  LB.buyPremium = function (tier) {
    var stars = [50, 150, 500].indexOf(Number(tier)) >= 0 ? Number(tier) : 150;
    if (!tg || !tg.openInvoice || !ver("6.1")) { window.lbToggleDemo(); return Promise.resolve(LB.isPremium()); }
    trk("premium_checkout", { tier: stars });
    return post("/api/invoice", { initData: tg.initData, tier: stars }).then(function (j) {
      if (!j || !j.ok || !j.url) {
        window.lbToggleDemo();
        return LB.isPremium();
      }
      return new Promise(function (res) {
        tg.openInvoice(j.url, function (status) {
          trk("premium_" + status, { tier: stars });
          if (status === "paid") {
            hap("medium");
            COS.frame = "gold"; COS.title = "vip"; COS.theme = "gold"; saveCos();
            note("💛 Спасибо за поддержку Lingo Brain! Косметика открыта навсегда!");
            setTimeout(function () { sync(true); }, 900);
          }
          res(status === "paid");
        });
      });
    }).catch(function () { note("Нет связи, попробуй ещё раз"); return false; });
  };

  // ---------- синхронизация / рейтинг ----------
  function sync(force) {
    if (!tg || BUSY) return Promise.resolve(FR);
    if (!force && Date.now() - LAST_SYNC < 15000) return Promise.resolve(FR);
    BUSY = true; LAST_SYNC = Date.now();
    var sp = (tg.initDataUnsafe && tg.initDataUnsafe.start_param) || "";
    var tz = -new Date().getTimezoneOffset();
    return post("/api/sync", { initData: tg.initData, stats: myStats(), ref: sp, tz: tz }).then(function (j) {
      BUSY = false; FR_ERR = !(j && j.ok); FR_EC = FR_ERR ? String((j && (j.error || (j.status ? "http " + j.status : ""))) || "empty") : ""; if (FR_ERR && window.current === "friends") render();
      if (j && j.ok) { FR = { list: j.friends || [], ts: Date.now() }; try { localStorage.setItem(FKEY, JSON.stringify(FR)); } catch (e) {} if (window.current === "friends") render(); }
      if (j && j.ok && j.premium) setPremium(j.premium);
      return FR;
    }).catch(function (e) { BUSY = false; FR_ERR = true; FR_EC = String((e && e.name) || "network"); if (window.current === "friends") render(); return FR; });
  }
  window.lbSync = sync;
  window.lbFrRetry = function () { FR_ERR = false; render(); sync(true); };

  // ---------- Отображение рамки и титула на самом пользователе (Header + Прогресс + Достижения) ----------
  function setFrameClass(el, frameId) {
    if (!el) return;
    ["default", "fire", "emerald", "neon", "gold"].forEach(function (k) { el.classList.remove("fr-" + k); });
    el.classList.add("fr-" + (frameId || "default"));
  }
  function applyCosmetics() {
    var eq = equippedCos();
    var av = $("avatar"), un = $("uname");
    if (av) {
      setFrameClass(av, eq.frame);
      av.style.cursor = "pointer";
      av.onclick = function () { hap("light"); window.show("ach"); };
    }
    if (un && un.parentNode) {
      var oldSt = un.querySelector(".fstar"); if (oldSt) oldSt.remove();
      var pill = $("uTitlePill");
      if (!pill) {
        pill = document.createElement("div");
        pill.id = "uTitlePill";
        pill.onclick = function () { hap("light"); window.show("ach"); };
        un.parentNode.appendChild(pill);
      }
      pill.className = "utitle" + (eq.titleObj && eq.titleObj.vip ? " vip" : "");
      pill.textContent = eq.title + " ›";
    }
    renderProfileAchLink();
    renderSupportBox();
  }

  // ---------- Экран «🏅 Достижения и стиль» (scr_ach) ----------
  function ensureAchScreen() {
    var s = $("scr_ach"); if (s) return s;
    s = document.createElement("section");
    s.id = "scr_ach";
    s.className = "screen";
    s.innerHTML =
      '<div class="header"><button type="button" class="iconbtn" onclick="show(\'profile\')" aria-label="Назад">←</button><h1>🏅 Достижения и стиль</h1></div>' +
      '<div id="achBody"></div>';
    var sh = $("sheet");
    if (sh && sh.parentNode) sh.parentNode.insertBefore(s, sh);
    else document.body.appendChild(s);
    return s;
  }

  function renderProfileAchLink() {
    var prof = $("scr_profile"); if (!prof) return;
    ensureAchScreen();
    var btn = $("lbAchBtn");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = "lbAchBtn";
      btn.className = "pcard glass v5lnk";
      btn.innerHTML = '<span class="e">🏅</span><span class="x">Достижения и стиль<small id="lbAchSub"></small></span><span class="go">›</span>';
      btn.onclick = function () { hap("light"); window.show("ach"); };
      var wordsBtn = $("v5pWords") || prof.querySelector(".v5lnk");
      var tiles = prof.querySelector(".tiles");
      if (wordsBtn && wordsBtn.parentNode === prof) prof.insertBefore(btn, wordsBtn);
      else if (tiles && tiles.nextSibling) prof.insertBefore(btn, tiles.nextSibling);
      else prof.appendChild(btn);
    }
    var ac = achCount(), eq = equippedCos(), sub = $("lbAchSub");
    if (sub) sub.textContent = "Открыто " + ac.done + " из " + ac.total + " · " + eq.frameObj.icon + " " + eq.frameObj.name + " · " + eq.title;
  }

  function renderAchScreen() {
    ensureAchScreen();
    var body = $("achBody"); if (!body) return;
    var st = rawStats(), eq = equippedCos(), ac = achCount(), S = window.S || {};
    var lvl = Math.floor((S.xp || 0) / 200) + 1;
    var name = (me && me.first_name) || window.nm || "Игрок";
    var ch = Array.from(String(name).trim())[0] || "🙂";
    var avaSrc = me ? ((me.photo_url) || (base() + "/ava/" + me.id + ".jpg")) : "";

    var h =
      '<div class="pcard glass ach-hero">' +
        '<div class="ach-av fr-' + esc(eq.frame) + '">' + esc(ch.toUpperCase()) +
          (avaSrc ? '<img alt="" src="' + esc(avaSrc) + '" onerror="this.remove()">' : '') +
        '</div>' +
        '<div class="ach-info">' +
          '<h3>' + esc(name) + '</h3>' +
          '<div class="utitle' + (eq.titleObj && eq.titleObj.vip ? " vip" : "") + '" style="cursor:default;margin-top:4px">' + esc(eq.title) + '</div>' +
          '<p>Уровень ' + lvl + ' · ⚡ ' + (S.xp || 0) + ' XP · Рамка: ' + esc(eq.frameObj.name) + '</p>' +
        '</div>' +
        '<button type="button" class="lbsup-preview" onclick="lbCard()">🖼 Карточка</button>' +
      '</div>';

    h += '<div class="ach-sec">🖼 Рамка аватара<span>Видна в шапке, карточке и у друзей</span></div><div class="ach-frames">';
    FRAMES.forEach(function (f) {
      var ok = f.check(st), on = eq.frame === f.id;
      h += '<button type="button" class="ach-fr' + (on ? " on" : "") + (ok ? "" : " lk") + '" data-fr="' + f.id + '">' +
        '<div class="ach-fr-ring fr-' + f.id + '">' + f.icon + '</div>' +
        '<strong>' + esc(f.name) + (on ? " ✓" : (ok ? "" : " 🔒")) + '</strong>' +
        '<small>' + esc(f.desc) + '</small>' +
      '</button>';
    });
    h += '</div>';

    h += '<div class="ach-sec">🏷 Титул игрока<span>Под твоим именем и в рейтинге</span></div><div class="ach-titles">';
    TITLES.forEach(function (t) {
      var ok = t.check(st), on = eq.titleId === t.id;
      h += '<button type="button" class="ach-tl' + (on ? " on" : "") + (ok ? "" : " lk") + '" data-tl="' + t.id + '">' +
        esc(t.label) + (on ? " ✓" : (ok ? "" : " 🔒")) +
      '</button>';
    });
    h += '</div>';

    h += '<div class="ach-sec">🏅 Достижения<span>Открыто ' + ac.done + ' из ' + ac.total + '</span></div><div class="ach-list">';
    ACHS.forEach(function (a) {
      var cur = Math.min(a.max, Math.max(0, a.val(st))), done = cur >= a.max, pct = Math.round((cur / a.max) * 100);
      h += '<div class="ach-item' + (done ? " done" : "") + '">' +
        '<div class="ach-ic">' + a.icon + '</div>' +
        '<div class="ach-bd">' +
          '<div class="ach-top"><strong>' + esc(a.title) + '</strong><span>' + (done ? "✅ Открыто" : (cur + " / " + a.max)) + '</span></div>' +
          '<p>' + esc(a.desc) + '</p>' +
          (a.reward ? '<span class="ach-rw">🎁 ' + esc(a.reward) + '</span>' : '') +
          '<div class="ach-bar"><i style="width:' + pct + '%"></i></div>' +
        '</div>' +
      '</div>';
    });
    h += '</div>';
    body.innerHTML = h;

    Array.prototype.forEach.call(body.querySelectorAll(".ach-fr"), function (b) {
      b.onclick = function () {
        var id = b.getAttribute("data-fr"), f = FRAMES.filter(function (x) { return x.id === id; })[0];
        if (!f) return;
        if (!f.check(st)) {
          hap("light");
          if (f.vip) note("👑 Золотая VIP-рамка открывается за поддержку проекта (или нажми «Тест косметики» во вкладке Прогресс)");
          else note("🔒 Чтобы открыть рамку «" + f.name + "»: " + f.desc);
          return;
        }
        COS.frame = f.id; saveCos(); hap("medium");
        applyCosmetics(); renderAchScreen(); sync( true );
        note("🖼 Выбрана рамка: " + f.name);
      };
    });
    Array.prototype.forEach.call(body.querySelectorAll(".ach-tl"), function (b) {
      b.onclick = function () {
        var id = b.getAttribute("data-tl"), t = TITLES.filter(function (x) { return x.id === id; })[0];
        if (!t) return;
        if (!t.check(st)) {
          hap("light");
          if (t.vip) note("⭐ Титул «Меценат» открывается за поддержку проекта (или через «Тест косметики» в Прогрессе)");
          else note("🔒 Чтобы открыть титул «" + t.label + "»: " + t.desc);
          return;
        }
        COS.title = t.id; saveCos(); hap("medium");
        applyCosmetics(); renderAchScreen(); sync(true);
        note("🏷 Выбран титул: " + t.label);
      };
    });
  }

  LB.handle("back", function () {
    if (window.current === "ach") { window.show("profile"); return true; }
    return false;
  });

  // ---------- Рейтинг друзей ----------
  function friendFrame(p) {
    if (p.me) return equippedCos().frame;
    if (p.frame && ["default", "fire", "emerald", "neon", "gold"].indexOf(p.frame) >= 0) return p.frame;
    if (p.plus) return "gold";
    if ((p.streak || 0) >= 3) return "fire";
    if ((p.learned || 0) >= 10) return "emerald";
    if ((p.rounds || 0) >= 10 || (p.xp || 0) >= 300) return "neon";
    return "default";
  }
  function friendTitle(p) {
    if (p.me) return equippedCos().title;
    if (p.title) return p.title;
    if (p.plus) return "⭐ Меценат";
    if ((p.xp || 0) >= 1000) return "🏆 Легенда Lingo";
    if ((p.learned || 0) >= 10) return "🎓 Полиглот";
    if ((p.streak || 0) >= 3) return "🔥 Машина серии";
    return "";
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
      var frId = friendFrame(p), tlTxt = friendTitle(p);
      var tlBadge = tlTxt ? '<span class="ftitle' + (isPlus || tlTxt.indexOf("Меценат") >= 0 ? " vip" : "") + '">' + esc(tlTxt) + '</span>' : "";
      h += '<div class="frow glass' + (p.me ? " me" : "") + (isPlus ? " plus" : "") + '"><div class="frk">' + (i < 3 && p[key] > 0 ? medals[i] : (i + 1)) + '</div>' +
        '<div class="fav fr-' + esc(frId) + '" style="background:' + pal[Math.abs(p.id) % pal.length] + '">' + esc(letter) + '<img alt="" src="' + esc(avaUrl(p)) + '" onerror="this.remove()"></div>' +
        '<div class="fnm"><b>' + esc(nm) + tlBadge + '</b><span>🔥 ' + (p.streak || 0) + ' · 🎓 ' + (p.learned || 0) + ' слов · LVL ' + (Math.floor((p.xp || 0) / 200) + 1) + '</span></div>' +
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

  LB.handle("share", function () {
    if (!me || !tg) return false;
    var xp = window.LB_LAST_XP || 0;
    var text = "Мой раунд в Lingo Brain: " + xp + " XP! Попробуй обогнать меня 🧠";
    hap("medium"); trk("share_clicked", { xp: xp, track: (window.LAST && LAST.lang) || null, ref: true });
    try { tg.openTelegramLink("https://t.me/share/url?url=" + encodeURIComponent(refLink()) + "&text=" + encodeURIComponent(text)); return true; } catch (e) { return false; }
  });

  // ---------- Блок «Поддержать Lingo Brain» (3 разовых тарифа) ----------
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
    var pr = LB.premium(), active = pr.active;
    box.classList.toggle("on", active);
    if (active) {
      box.innerHTML =
        '<div class="lbsup-h"><span class="lbsup-e">👑</span><div><span class="lbsup-t">' + (pr.demo ? "Тест-режим косметики активен 🎁" : "Спасибо за поддержку Lingo Brain!") + '</span>' +
        '<p>Все 80 тем бесплатны для всех — в том числе благодаря тебе 💛 VIP-рамка, титул «Меценат» и 4 стиля карточки открыты.</p></div></div>' +
        '<div class="lbsup-act"><span>✅ VIP-косметика доступна</span>' +
        '<div style="display:flex;gap:6px"><button type="button" class="lbsup-preview" onclick="show(\'ach\')">🏅 Стиль</button>' +
        '<button type="button" class="lbsup-preview" onclick="lbCard()">🖼 Карточка</button>' +
        (pr.demo ? '<button type="button" class="lbsup-preview" onclick="lbToggleDemo()">Выкл тест</button>' : '') + '</div></div>';
    } else {
      box.innerHTML =
        '<div class="lbsup-h"><span class="lbsup-e">💛</span><div><span class="lbsup-t">Поддержать Lingo Brain</span>' +
        '<p>Все 80 тем всегда 100% бесплатны. Разовый донат открывает Золотую VIP-рамку, титул «⭐ Меценат» и все стили карточки навсегда:</p></div></div>' +
        '<div class="lbsup-tiers">' +
          '<button type="button" class="lbsup-tier" data-tier="50"><strong>☕ 50 ⭐</strong><small>Спасибо</small></button>' +
          '<button type="button" class="lbsup-tier hit" id="lbSupBtn" data-tier="150"><strong>⭐ 150 ⭐</strong><small>Хит выбора</small></button>' +
          '<button type="button" class="lbsup-tier" data-tier="500"><strong>🚀 500 ⭐</strong><small>Меценат</small></button>' +
        '</div>' +
        '<button type="button" class="lbsup-preview" style="width:100%" onclick="lbToggleDemo()">🎁 Примерить VIP-косметику бесплатно (тест)</button>';
      Array.prototype.forEach.call(box.querySelectorAll(".lbsup-tier"), function (b) {
        b.onclick = function () { hap("light"); LB.buyPremium(Number(b.getAttribute("data-tier")) || 150); };
      });
    }
  }

  LB.on("home", applyCosmetics);
  LB.on("premium", function () { applyCosmetics(); if (window.current === "friends") render(); if (window.current === "ach") renderAchScreen(); });
  LB.on("show", function (name) {
    if (name === "friends") { render(); sync(true); }
    if (name === "profile") { renderProfileAchLink(); renderSupportBox(); }
    if (name === "ach") renderAchScreen();
    if (name === "result") setTimeout(function () { sync(true); }, 300);
    if (name === "words") setTimeout(neuralBox, 0);
  });

  // ---------- тумблер нейроголоса (mp3) ----------
  function neuralBox() {
    var old = $("neuralBox"); if (old) old.remove(); return;
  }
  window.lbNeuralBox = neuralBox;

  // ---------- Карточка игрока (Canvas) + кастомные темы ----------
  var CARD_THEMES = {
    classic: { id: "classic", label: "🌙 Классика", free: true,  bg0: "#1A1B26", bg1: "#12131C", card: "rgba(36,40,59,0.75)", badge: "" },
    gold:    { id: "gold",    label: "⭐ Золото",   free: false, bg0: "#241C14", bg1: "#121018", card: "rgba(44,35,26,0.80)", c1: "#FFD166", c2: "#F7A046", badge: "👑 VIP SUPPORTER" },
    aurora:  { id: "aurora",  label: "🌌 Аврора",   free: false, bg0: "#112233", bg1: "#0E1324", card: "rgba(22,38,58,0.78)", c1: "#2DD4BF", c2: "#A78BFA", badge: "✨ AURORA" },
    cyber:   { id: "cyber",   label: "⚡ Неон",     free: false, bg0: "#1F1135", bg1: "#110B22", card: "rgba(38,20,66,0.78)", c1: "#F472B6", c2: "#38BDF8", badge: "⚡ CYBER" }
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
    var eq = equippedCos(), ac = achCount();
    var A = th.c1 || eq.frameObj.col || COL[L], B = th.c2 || eq.frameObj.c2 || OK;
    var st = myStats(), lvl = Math.floor((S.xp || 0) / 200) + 1, name = (me && me.first_name) || window.nm || "Игрок";
    var fromRound = window.current === "result" && (window.LB_LAST_XP > 0 || txt("resXp"));
    var roundXp = txt("resXp").replace(/[^0-9]/g, "") || String(window.LB_LAST_XP || 0);

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

    // Avatar + equipped frame ring
    var ag = c.createLinearGradient(112, 242, 288, 418); ag.addColorStop(0, eq.frameObj.col || A); ag.addColorStop(1, eq.frameObj.c2 || B);
    c.beginPath(); c.arc(200, 330, 86, 0, Math.PI * 2); c.fillStyle = ag; c.fill();
    c.beginPath(); c.arc(200, 330, 76, 0, Math.PI * 2); c.fillStyle = "#1A1B26"; c.fill();
    c.textAlign = "center"; c.fillStyle = "#EEEEFF"; c.font = "900 74px " + FONT; c.fillText(String(name).charAt(0).toUpperCase(), 200, 334);
    if (AVA) { try { c.save(); c.beginPath(); c.arc(200, 330, 76, 0, Math.PI * 2); c.clip(); c.drawImage(AVA, 124, 254, 152, 152); c.restore(); } catch (e) {} }
    rr(c, 145, 394, 110, 46, 23); c.fillStyle = "#12131C"; c.fill(); c.strokeStyle = eq.frameObj.col || A; c.lineWidth = 3; c.stroke(); c.fillStyle = "#EEEEFF"; c.font = "900 24px " + FONT; c.fillText("LVL " + lvl, 200, 418);

    c.textAlign = "left"; c.fillStyle = "#EEEEFF"; fit(c, name, 640, 62, "900"); c.fillText(name, 320, 300);
    c.fillStyle = eq.frameObj.col || A; c.font = "800 32px " + FONT; c.fillText(eq.title + " · " + eq.frameObj.icon + " " + eq.frameObj.name, 320, 362);

    c.textAlign = "center";
    var big = fromRound ? ("+" + roundXp + " XP") : ("⚡ " + (S.xp || 0) + " XP");
    fit(c, big, 860, 175, "900");
    var bg = c.createLinearGradient(160, 0, 920, 0); bg.addColorStop(0, A); bg.addColorStop(1, B); c.fillStyle = bg; c.fillText(big, 540, 595);

    var title = fromRound ? (txt("resTitle") || "Раунд пройден!") : ("🏅 Достижений открыто: " + ac.done + " из " + ac.total);
    c.fillStyle = "#EEEEFF"; fit(c, title, 860, 46, "900"); c.fillText(title, 540, 725);
    var sc = fromRound ? txt("resScore") : "";
    c.fillStyle = "#8A91B4"; c.font = "700 33px " + FONT;
    c.fillText(sc ? ("Сделано: " + sc) : ("Выучено тем: " + st.topics + " · Раундов: " + st.rounds), 540, 785);

    var tiles = [["🔥", st.streak, "дн. серия"], ["🎓", st.learned, "слов выучено"], ["⚡", S.xp || 0, "XP всего"]];
    tiles.forEach(function (t, i) {
      var x = 120 + i * 290; rr(c, x, 870, 260, 230, 32); c.fillStyle = "rgba(255,255,255,0.05)"; c.fill(); c.strokeStyle = th.id === "classic" ? "rgba(255,255,255,0.09)" : A; c.globalAlpha = th.id === "classic" ? 1 : 0.35; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1;
      c.font = "56px " + FONT; c.fillStyle = "#EEEEFF"; c.fillText(t[0], x + 130, 935);
      fit(c, String(t[1]), 230, 64, "900"); c.fillText(String(t[1]), x + 130, 1012);
      c.fillStyle = "#8A91B4"; c.font = "700 26px " + FONT; c.fillText(t[2], x + 130, 1066);
    });
    var tt = fromRound ? topicTitle() : ""; if (tt) { c.fillStyle = "#8A91B4"; fit(c, "Тема: " + tt, 860, 32, "700"); c.fillText("Тема: " + tt, 540, 1160); }
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
          LB.buyPremium(150).then(function (paid) { if (paid) selectCardTheme(k); });
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
    o.innerHTML =
      '<img id="cardImg" alt="Карточка игрока">' +
      '<div class="cthemes" id="cardThemes" role="group" aria-label="Стиль карточки"></div>' +
      '<div class="cacts">' +
        '<button type="button" class="btn ok full" id="cardSend">📨 Прислать в чат Telegram</button>' +
        '<button type="button" class="btn" id="cardStory">📲 В сторис</button>' +
        '<button type="button" class="btn ghost" id="cardSave">💾 Скачать</button>' +
        '<button type="button" class="btn ghost full" id="cardClose">Закрыть</button>' +
      '</div>';
    document.body.appendChild(o);
    o.addEventListener("click", function (e) { if (e.target === o) o.classList.remove("on"); });
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

  setTimeout(function () { ensureAchScreen(); applyCosmetics(); }, 0);
  setTimeout(function () { sync(true); }, 2200);
})();
