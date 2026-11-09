/* Lingo Brain base (v1-v2): built-in content, state, screens, quiz/speak rounds.
   Classic script: top-level names are globals used by the other modules. */
// ================= КОНТЕНТ =================
// Квизы: q — вопрос (<b>ключевые слова</b>), o — варианты, a — правильный (с нуля), tip — подсказка, say — что озвучить
// Говорилка (speak:true): t — фраза, ru — перевод, say — что озвучить (если не указано, берётся t без тегов)
var DATA = {
  es: { name: "Испанский", flag: "🇪🇸", tts: "es-ES", topics: {
    speak: { title: "Повторяй вслух", em: "🎙", speak: true, cards: [
      { t: "Un <b>café con leche</b>, por favor.", ru: "Кофе с молоком, пожалуйста." },
      { t: "Más <b>despacio</b>, por favor.", ru: "Помедленнее, пожалуйста." },
      { t: "Quiero <b>pedir cita</b>.", ru: "Хочу записаться на приём." },
      { t: "<b>Soy de</b> Ucrania.", ru: "Я из Украины." },
      { t: "¿<b>Cuánto</b> cuesta?", ru: "Сколько стоит?" },
      { t: "Hablo <b>poco</b> español.", ru: "Я немного говорю по-испански." }
    ]},
    basics: { title: "Основы", em: "👋", cards: [
      { q: "Как поздороваться <b>днём</b> (после обеда)?", o: ["Buenas tardes", "Buenas noches", "Buenos días"], a: 0, tip: "🌅 <b>días</b> — утро · <b>tardes</b> — день/вечер · <b>noches</b> — ночь." },
      { q: "«<b>No entiendo</b>» значит…", o: ["Я не понимаю", "Я не знаю", "Я не хочу"], a: 0, tip: "🤷 «Я не знаю» — <b>No sé</b>.", say: "No entiendo" },
      { q: "Как попросить говорить <b>медленнее</b>?", o: ["Más despacio, por favor", "Más rápido, por favor", "Más alto, por favor"], a: 0, tip: "🐢 <b>despacio</b> — медленно. Главная фраза первых месяцев." },
      { q: "Как сказать «Я <b>из Украины</b>»?", o: ["Soy de Ucrania", "Estoy en Ucrania", "Voy a Ucrania"], a: 0, tip: "🇺🇦 <b>Soy de</b> — я из · <b>Estoy en</b> — я нахожусь в." },
      { q: "Как сказать «<b>Меня зовут</b> Лео»?", o: ["Me llamo Leo", "Yo llamo Leo", "Mi nombre Leo"], a: 0, tip: "🙋 <b>Me llamo</b> — дословно «я себя зову»." }
    ]},
    cafe: { title: "Кафе", em: "☕", cards: [
      { q: "Ты хочешь <b>кофе с молоком</b>. Как заказать?", o: ["Un café con leche, por favor", "Una leche sin café", "Café, gracias, adiós"], a: 0, tip: "☕ <b>con leche</b> — с молоком." },
      { q: "Как попросить <b>счёт</b>?", o: ["La cuenta, por favor", "El menú, por favor", "La mesa, por favor"], a: 0, tip: "🧾 <b>la cuenta</b> — счёт." },
      { q: "«¿Para tomar aquí o <b>para llevar</b>?» Ты хочешь <b>с собой</b>.", o: ["Para llevar", "Para aquí", "Para mañana"], a: 0, tip: "🥡 <b>para llevar</b> — с собой." },
      { q: "Что значит «<b>¿Algo más?</b>»", o: ["Что-нибудь ещё?", "Сколько стоит?", "Где туалет?"], a: 0, tip: "Ответ: <b>No, nada más, gracias</b>.", say: "¿Algo más? No, nada más, gracias." },
      { q: "Как спросить «<b>Сколько стоит?</b>»", o: ["¿Cuánto cuesta?", "¿Dónde está?", "¿Qué hora es?"], a: 0, tip: "💶 Работает везде: кафе, магазин, рынок." }
    ]},
    super: { title: "Mercadona", em: "🛒", cards: [
      { q: "Кассир: «¿Quiere <b>bolsa</b>?» Что спрашивают?", o: ["Нужен пакет?", "Есть карта магазина?", "Наличными?"], a: 0, tip: "🛍 <b>bolsa</b> — пакет. Ответ: <b>No, gracias</b>.", say: "¿Quiere bolsa? No, gracias." },
      { q: "Как сказать «<b>Картой</b>»?", o: ["Con tarjeta", "En efectivo", "Con bolsa"], a: 0, tip: "💳 <b>tarjeta</b> — карта · <b>efectivo</b> — наличные." },
      { q: "Как спросить «<b>Где</b> яйца?»", o: ["¿Dónde están los huevos?", "¿Cuánto cuestan los huevos?", "¿Hay pan?"], a: 0, tip: "🥚 <b>huevos</b> — яйца." },
      { q: "Что такое «<b>pollo</b>»?", o: ["Курица", "Рыба", "Хлеб"], a: 0, tip: "🍗 <b>pollo</b> — курица · <b>pescado</b> — рыба · <b>pan</b> — хлеб.", say: "pollo, pescado, pan" },
      { q: "Ценник «<b>Oferta</b>» значит…", o: ["Акция / скидка", "Закрыто", "Касса"], a: 0, tip: "🏷 <b>oferta</b> — акция.", say: "oferta" }
    ]},
    doctor: { title: "Врач", em: "🏥", cards: [
      { q: "Как сказать «Мне <b>нужен врач</b>»?", o: ["Necesito un médico", "Tengo un médico", "Busco una farmacia"], a: 0, tip: "🩺 <b>necesito</b> — мне нужно." },
      { q: "«Me duele la <b>espalda</b>» значит…", o: ["У меня болит спина", "У меня болит голова", "У меня нет сил"], a: 0, tip: "<b>Me duele</b> + часть тела · <b>cabeza</b> — голова.", say: "Me duele la espalda" },
      { q: "«Quiero pedir <b>cita</b>» значит…", o: ["Хочу записаться на приём", "Хочу купить лекарство", "Хочу домой"], a: 0, tip: "📅 <b>cita</b> — запись. Главная фраза в centro de salud.", say: "Quiero pedir cita" },
      { q: "Что такое «<b>tarjeta sanitaria</b>»?", o: ["Медкарта (SIP)", "Банковская карта", "Проездной"], a: 0, tip: "🪪 В Валенсийском регионе её зовут <b>SIP</b>.", say: "tarjeta sanitaria" },
      { q: "Как сказать «Я <b>плохо</b> говорю по-испански»?", o: ["Hablo poco español", "No hablo nunca", "Hablo español bien"], a: 0, tip: "Скажи сразу — с тобой будут говорить проще 💛" }
    ]}
  }},
  en: { name: "Английский", flag: "🇬🇧", tts: "en-US", topics: {
    speak: { title: "Зажми и говори", em: "🎙", speak: true, cards: [
      { t: "I'm a <b>support specialist</b> with two years in <b>FinTech</b>.", ru: "Я специалист поддержки с 2 годами в финтехе." },
      { t: "I <b>led</b> a team of five agents.", ru: "Я руководил командой из пяти агентов." },
      { t: "Could you <b>repeat</b> that, please?", ru: "Не могли бы вы повторить?" },
      { t: "I've <b>been working</b> on my Spanish every day.", ru: "Я каждый день занимаюсь испанским." },
      { t: "What does <b>success</b> look like in this role?", ru: "Как выглядит успех в этой роли?" },
      { t: "I <b>automated</b> routine tasks with <b>Telegram bots</b>.", ru: "Я автоматизировал рутину Telegram-ботами." }
    ]},
    tenses: { title: "Времена", em: "⏳", cards: [
      { q: "I ___ in support <b>for two years</b> (и работаю до сих пор).", o: ["have been working", "work", "worked"], a: 0, tip: "Началось в прошлом и длится → <b>Present Perfect Continuous</b>.", say: "I have been working in support for two years." },
      { q: "<b>Yesterday</b> I ___ a great interview.", o: ["had", "have had", "have"], a: 0, tip: "Есть <b>yesterday</b> → <b>Past Simple</b>.", say: "Yesterday I had a great interview." },
      { q: "<b>By next month</b> I ___ my CV.", o: ["will have finished", "finished", "am finishing"], a: 0, tip: "<b>By</b> + будущее → <b>Future Perfect</b>.", say: "By next month I will have finished my CV." },
      { q: "I ___ to Spain <b>in 2026</b>.", o: ["moved", "have moved", "move"], a: 0, tip: "Конкретный год → <b>Past Simple</b>.", say: "I moved to Spain in 2026." },
      { q: "<b>In my last job</b> I ___ KYC checks every day.", o: ["used to do", "use to do", "am doing"], a: 0, tip: "Привычка в прошлом → <b>used to</b> + глагол.", say: "In my last job I used to do KYC checks every day." }
    ]},
    interview: { title: "Собеседование", em: "💼", cards: [
      { q: "«<b>Tell me about yourself</b>». Лучшее начало:", o: ["I'm a support specialist with 2 years in FinTech", "I was born in 2000", "I'm normal person"], a: 0, tip: "Начинай с <b>роли и опыта</b>. 30–60 секунд." },
      { q: "«Я <b>руководил</b> командой поддержки»:", o: ["I led a support team", "I leaded a support team", "I was lead of team"], a: 0, tip: "<b>lead → led → led</b> — неправильный глагол." },
      { q: "«What's your biggest <b>weakness</b>?» Хороший ответ:", o: ["I took on too much, now I prioritize", "I have no weaknesses", "I'm lazy"], a: 0, tip: "Слабость + <b>что ты с ней уже делаешь</b>." },
      { q: "Как вежливо попросить <b>повторить</b> вопрос?", o: ["Sorry, could you repeat that?", "What? Again.", "Repeat me, please"], a: 0, tip: "Переспросить — <b>нормально</b>. Носители тоже так делают." },
      { q: "«Do you have any <b>questions for us</b>?» Лучше:", o: ["What does success look like here?", "No.", "How much vacation?"], a: 0, tip: "Вопрос про <b>результат</b> = думаешь как сотрудник." }
    ]},
    slang: { title: "Сленг", em: "😎", cards: [
      { q: "«I'm <b>swamped</b>» значит…", o: ["Я завален делами", "Я промок", "Я свободен"], a: 0, tip: "Можно на работе: <b>Sorry, I'm swamped today.</b>", say: "Sorry, I'm swamped today." },
      { q: "«Let's <b>touch base</b> tomorrow»", o: ["Давай сверимся завтра", "Встретимся на базе", "Давай отдохнём"], a: 0, tip: "💼 Офисное: коротко созвониться.", say: "Let's touch base tomorrow." },
      { q: "«<b>No cap</b>» значит…", o: ["Честно, без шуток", "Без шапки", "Без лимита"], a: 0, tip: "Очень неформально. На собесе — <b>не надо</b> 😅", say: "No cap" },
      { q: "«<b>ASAP</b>» —", o: ["Как можно скорее", "Как обычно", "После обеда"], a: 0, tip: "<b>as soon as possible</b>.", say: "As soon as possible" },
      { q: "«It's a <b>no-brainer</b>»", o: ["Очевидное решение", "Глупая идея", "Без мозгов"], a: 0, tip: "Выбор настолько ясен, что <b>думать не надо</b>.", say: "It's a no-brainer." }
    ]}
  }}
};

// ================= НАСТРОЙКИ =================
var ROUND = 5, SPEAK_ROUND = 3, GOAL = 1, KEY = "lingo_v2";
var PRAISE = ["🔥 Да!", "✅ Точно!", "💪 Красава!", "🎯 В цель!", "⚡ Быстро и верно!", "🧠 Мозг работает!"];

// ================= TELEGRAM =================
var tg = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData !== undefined) ? window.Telegram.WebApp : null;
function ver(v) { return !!(tg && tg.isVersionAtLeast && tg.isVersionAtLeast(v)); }
var cloudOk = ver("6.9") && !!tg.CloudStorage;
function $(id) { return document.getElementById(id); }
function haptic(k) { try { if (!ver("6.1") || !tg.HapticFeedback) return; var H = tg.HapticFeedback; if (k === "success" || k === "error" || k === "warning") H.notificationOccurred(k); else if (k === "select") H.selectionChanged(); else H.impactOccurred(["light", "medium", "heavy", "rigid", "soft"].indexOf(k) >= 0 ? k : "light"); } catch (e) {} }
function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function strip(s) { return s.replace(/<[^>]+>/g, ""); }
function dots(done, total, cur) { var h = ""; for (var i = 0; i < total; i++) h += '<span class="dot' + (i < done ? " on" : (cur && i === done ? " cur" : "")) + '"></span>'; return h; }
function setTrack(l) { document.body.setAttribute("data-track", l); }

// ================= ПРОГРЕСС =================
function blank() { return { xp: 0, streak: 0, bestStreak: 0, lastDay: null, days: [], best: {}, rounds: 0, todayDate: null, todayRounds: 0, freezes: 0, surpriseDay: null, passed: [], unlocked: [] }; }
function merge(src) { var b = blank(); if (src) { for (var k in b) { if (src[k] !== undefined) b[k] = src[k]; } } return b; }
function load() { var s = null; try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {} return merge(s); }
var S = load();
function save() { var j; try { j = JSON.stringify(S); } catch (e) { return; } try { localStorage.setItem(KEY, j); } catch (e) {} if (cloudOk && j.length < 4000) { try { tg.CloudStorage.setItem(KEY, j, function (err) { if (err) cloudOk = false; }); } catch (e) { cloudOk = false; } } }
function cloudLoad() { try { cloudLoad0(); } catch (e) {} }
function cloudLoad0() {
  if (!cloudOk) return;
  tg.CloudStorage.getItem(KEY, function (err, val) {
    if (err || !val) return;
    try { var c = JSON.parse(val); if ((c.xp || 0) > S.xp) { S = merge(c); try { localStorage.setItem(KEY, val); } catch (e) {} if (current === "home") renderHome(); } } catch (e) {}
  });
}
function dayStr(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
function yesterday() { var d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); }
function currentStreak() { return (S.lastDay === dayStr() || S.lastDay === yesterday()) ? S.streak : 0; }
function todayRounds() { return S.todayDate === dayStr() ? S.todayRounds : 0; }

// ================= ЭКРАНЫ =================
var current = "home", LAST = { lang: "es", topic: "cafe" };
function show(name) {
  current = name;
  var sc = document.querySelectorAll(".screen");
  for (var i = 0; i < sc.length; i++) sc[i].classList.toggle("active", sc[i].id === "scr_" + name);
  document.body.classList.toggle("focus", name === "quiz" || name === "speak" || name === "result");
  var nb = document.querySelectorAll(".nav button");
  for (var j = 0; j < nb.length; j++) nb[j].classList.toggle("on", nb[j].getAttribute("data-go") === name);
  window.scrollTo(0, 0);
  if (ver("6.1")) { if (name === "home") tg.BackButton.hide(); else tg.BackButton.show(); }
  if (name !== "quiz") hideSheet();
  if (name === "home") renderHome();
  if (name === "profile") renderProfile();
  if (name === "words" && window.lbRenderWords) window.lbRenderWords();
  LB.emit("show", name);
}
function backBase() { if (current === "quiz" || current === "speak") quit(); else if (current === "result") openTrack(LAST.lang); else show("home"); }
function goBack() { LB.run("back", backBase); }

function topicDone(l, k) { return (S.best[l + ":" + k] || 0) >= 4; }
function renderHome() {
  $("xp").textContent = S.xp;
  $("streak").textContent = currentStreak();
  var done = Math.min(todayRounds(), GOAL);
  $("ringFg").style.strokeDashoffset = 163.36 * (1 - done / GOAL);
  $("ringTxt").textContent = done + "/" + GOAL;
  if (done >= GOAL) { $("goalTitle").textContent = "Цель дня есть 🎉"; $("goalSub").textContent = "Всё сверху — бонус. Можно отдыхать 💛"; }
  else { $("goalTitle").textContent = "Цель дня: 1 раунд"; $("goalSub").textContent = currentStreak() > 0 ? "Серия " + currentStreak() + " дн. Держим огонь 🔥" : "2 минуты — уже победа"; }
  ["es", "en"].forEach(function (l) { var ks = Object.keys(DATA[l].topics), d = ks.filter(function (k) { return topicDone(l, k); }).length; $("dots_" + l).innerHTML = dots(d, ks.length); });
  LB.emit("home");
}

function openTrack(l) {
  setTrack(l);
  var t = DATA[l].topics, g = $("topicGrid");
  $("trackTitle").textContent = DATA[l].flag + " " + DATA[l].name;
  g.innerHTML = "";
  Object.keys(t).forEach(function (k) {
    var el = document.createElement("div"), best = S.best[l + ":" + k] || 0, d = best >= 5 ? 3 : best >= 4 ? 2 : best >= 2 ? 1 : 0;
    if (t[k].speak) {
      el.className = "topic glass hero";
      el.innerHTML = '<div class="em">' + t[k].em + "</div><div><h4>" + t[k].title + "</h4><small>" + SPEAK_ROUND + ' фразы · голосом · 2 мин</small><div class="dots" style="margin-top:8px">' + dots(d, 3) + "</div></div>";
    } else {
      el.className = "topic glass";
      el.innerHTML = '<div class="em">' + t[k].em + "</div><h4>" + t[k].title + "</h4><small>" + ROUND + ' карточек · 2 мин</small><div class="dots">' + dots(d, 3) + "</div>";
    }
    el.onclick = function () { start(l, k); };
    g.appendChild(el);
  });
  var r = document.createElement("div");
  r.className = "topic glass random";
  r.innerHTML = '<div class="em">🎲</div><h4>Случайная</h4><small>Сюрприз для мозга</small>';
  r.onclick = function () { start(l, pick(Object.keys(t))); };
  g.appendChild(r);
  show("topics");
  haptic("light");
  LB.emit("track", l);
}
function start(l, k) { LAST = { lang: l, topic: k }; setTrack(l); if (DATA[l].topics[k].speak) startSpeak(l, k); else startRound(l, k); }
function again() { start(LAST.lang, LAST.topic); }
function lbLang() { try { var p = JSON.parse(localStorage.getItem("lingo_p") || "{}"); if (p.lang === "es" || p.lang === "en") return p.lang; } catch (e) {} return null; }
function quickRound() { var l = lbLang() || pick(["es", "en"]); start(l, pick(Object.keys(DATA[l].topics))); }
function swapTopic() { var ks = Object.keys(DATA[LAST.lang].topics).filter(function (k) { return k !== LAST.topic; }); toast("🔀 Новая тема"); start(LAST.lang, pick(ks)); }
function quit() { stopRec(true); toast("Пауза — это ок 💛"); openTrack(LAST.lang); }

// ================= КВИЗ =================
var Q = null;
function startRound(l, k) {
  Q = { lang: l, topic: k, queue: shuffle(DATA[l].topics[k].cards.slice()).slice(0, ROUND), pos: 0, score: 0, xp: 0, combo: 0, locked: false };
  $("qTopic").textContent = DATA[l].topics[k].em + " " + DATA[l].topics[k].title;
  show("quiz"); renderCard(); haptic("medium");
}
function renderCard() {
  var c = Q.queue[Q.pos];
  Q.locked = false; hideSheet();
  $("qDots").innerHTML = dots(Q.pos, Q.queue.length, true);
  $("qText").innerHTML = c.q;
  var box = $("opts"); box.innerHTML = "";
  shuffle(c.o.map(function (_, i) { return i; })).forEach(function (i, n) {
    var b = document.createElement("button");
    b.className = "opt"; b.setAttribute("data-i", i);
    b.innerHTML = '<span class="k">' + "ABC".charAt(n) + "</span><span></span>";
    b.lastChild.textContent = c.o[i];
    b.onclick = function () { answer(i, b); };
    box.appendChild(b);
  });
}
function answer(i, btn) {
  if (Q.locked) return;
  Q.locked = true;
  var c = Q.queue[Q.pos], ok = i === c.a, bs = $("opts").children;
  for (var n = 0; n < bs.length; n++) { var bi = +bs[n].getAttribute("data-i"); if (bi === c.a) bs[n].classList.add("ok"); else if (bs[n] === btn) bs[n].classList.add("bad"); else bs[n].classList.add("dim"); }
  if (ok) { Q.score++; Q.combo++; Q.xp += 10; haptic("success"); if (Q.combo >= 3) toast("🔥 Комбо x" + Q.combo + "!"); }
  else { Q.combo = 0; Q.xp += 3; haptic("warning"); }
  var sh = $("sheet");
  sh.className = "sheet " + (ok ? "ok" : "bad");
  if (ok) $("shTitle").textContent = pick(PRAISE);
  else { $("shTitle").innerHTML = "Почти! Правильно: <b></b>"; $("shTitle").querySelector("b").textContent = c.o[c.a]; }
  $("shTip").innerHTML = c.tip;
  $("shNext").className = "btn " + (ok ? "ok" : "err");
  $("shNext").textContent = Q.pos + 1 >= Q.queue.length ? "🏁 Итог" : "Дальше →";
  $("qDots").innerHTML = dots(Q.pos + (ok ? 1 : 0), Q.queue.length, !ok);
  setTimeout(function () { sh.classList.add("show"); }, 30);
}
function hideSheet() { $("sheet").classList.remove("show"); }
function next() { haptic("light"); Q.pos++; if (Q.pos < Q.queue.length) renderCard(); else complete(Q.score, Q.queue.length, Q.xp); }

// ================= ГОВОРИЛКА (запись голоса, бесплатно) =================
var SP = null, stream = null, rec = null, chunks = [], recWanted = false, recT0 = 0, lastAudio = null;
function micOk() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder); }
function startSpeak(l, k) {
  SP = { lang: l, topic: k, list: shuffle(DATA[l].topics[k].cards.slice()).slice(0, SPEAK_ROUND), pos: 0, xp: 0 };
  show("speak"); renderPhrase(); haptic("medium");
}
function renderPhrase() {
  var p = SP.list[SP.pos];
  $("spDots").innerHTML = dots(SP.pos, SP.list.length, true);
  $("spText").innerHTML = p.t; $("spTr").textContent = p.ru;
  $("spAfter").style.display = "none"; $("talkWrap").style.display = "";
  $("talkHint").textContent = micOk() ? "Зажми и говори" : "Скажи фразу вслух и нажми 🎙";
}
function speakPhrase() { var p = SP.list[SP.pos]; speak(p.say || strip(p.t), DATA[SP.lang].tts); }
function recStart() {
  if (!micOk()) { afterSpeak(null); return; }
  recWanted = true;
  $("talkBtn").classList.add("rec"); $("talkHint").textContent = "Говори… отпусти, когда закончишь"; haptic("medium");
  var go = function (s) {
    stream = s;
    if (!recWanted) { $("talkBtn").classList.remove("rec"); $("talkHint").textContent = "Доступ есть ✅ Теперь зажми и говори"; return; }
    chunks = []; rec = new MediaRecorder(stream); recT0 = Date.now();
    rec.ondataavailable = function (ev) { if (ev.data && ev.data.size) chunks.push(ev.data); };
    rec.onstop = function () {
      if (rec.cancelled) return;
      if (Date.now() - recT0 < 500) { $("talkHint").textContent = "Держи кнопку, пока говоришь 🙂"; return; }
      afterSpeak(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
    };
    rec.start();
  };
  if (stream) go(stream);
  else navigator.mediaDevices.getUserMedia({ audio: true }).then(go).catch(function () { $("talkBtn").classList.remove("rec"); recWanted = false; toast("Нет доступа к микрофону 🎙"); afterSpeak(null); });
}
function stopRec(cancel) { if (!recWanted && !(rec && rec.state === "recording")) return; recWanted = false; $("talkBtn").classList.remove("rec"); if (rec && rec.state === "recording") { rec.cancelled = !!cancel; rec.stop(); haptic("light"); } }
function afterSpeak(blob) {
  $("spAfter").style.display = "";
  if (blob) {
    lastAudio = new Audio(URL.createObjectURL(blob)); lastAudio.play();
    $("talkHint").textContent = "Слушай себя 👂 Похоже на оригинал?";
    $("spGoodBtn").textContent = "😊 Похоже!";
  } else {
    $("talkHint").textContent = "Сказал вслух? Это уже засчитывается 💪";
    $("spGoodBtn").textContent = "✅ Сказал";
  }
}
function retry() { $("spAfter").style.display = "none"; $("talkHint").textContent = "Зажми и говори"; haptic("light"); }
function spGood() {
  SP.xp += 10; haptic("success"); toast(pick(PRAISE));
  SP.pos++;
  if (SP.pos < SP.list.length) renderPhrase(); else complete(SP.list.length, SP.list.length, SP.xp);
}
(function () {
  var tb = $("talkBtn");
  tb.addEventListener("pointerdown", function (e) { e.preventDefault(); recStart(); });
  ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { tb.addEventListener(ev, function () { stopRec(false); }); });
  tb.addEventListener("contextmenu", function (e) { e.preventDefault(); });
})();

// ================= ИТОГ РАУНДА =================
function complete(score, n, xp) {
  xp += 20; window.LB_LAST_XP = xp;
  try { if (window.lbTrack) window.lbTrack("round_completed", { xp: xp, score: score, cards: n, passed: score / Math.max(1, n) >= 0.6, track: LAST.lang, topic_id: LAST.topic }); } catch (e) {}
  var key = LAST.lang + ":" + LAST.topic, t = dayStr();
  S.best[key] = Math.max(S.best[key] || 0, Math.round(score / n * 5));
  S.xp += xp; S.rounds++;
  if (S.lastDay !== t) { S.streak = S.lastDay === yesterday() ? S.streak + 1 : 1; S.lastDay = t; if (S.days.indexOf(t) < 0) S.days.push(t); if (S.days.length > 60) S.days = S.days.slice(-60); }
  if (S.todayDate !== t) { S.todayDate = t; S.todayRounds = 0; }
  S.todayRounds++;
  S.bestStreak = Math.max(S.bestStreak, S.streak);
  save();
  $("resEmoji").textContent = score === n ? "🏆" : score >= n - 1 ? "🔥" : score >= n - 2 ? "💪" : "🌱";
  $("resTitle").textContent = score === n ? "Идеально!" : score >= n - 2 ? "Мозг прокачан" : "Ошибки — это учёба";
  $("resSub").textContent = S.todayRounds === GOAL ? "Цель дня есть. Дальше — бонус 💛" : "Даже 2 минуты — уже победа.";
  $("resScore").textContent = score + "/" + n;
  $("resXp").textContent = "+" + xp;
  $("resStreak").textContent = S.streak + " 🔥";
  show("result"); haptic("success");
  if (score >= n - 1) confetti();
}

// ================= ПРОГРЕСС-ЭКРАН =================
function renderProfile() {
  $("pXp").textContent = S.xp; $("pRounds").textContent = S.rounds;
  $("pStreak").textContent = currentStreak() + " дн."; $("pBest").textContent = S.bestStreak + " дн.";
  try { if (window.lbWords) window.lbWords(); } catch (e) {}
  var lvl = Math.floor(S.xp / 200) + 1, inL = S.xp % 200;
  $("pLvl").textContent = "Уровень " + lvl; $("pLvlTxt").textContent = "до следующего: " + (200 - inL) + " XP";
  $("pLvlDots").innerHTML = dots(Math.floor(inL / 40), 5);
  var w = $("week"), names = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]; w.innerHTML = "";
  for (var i = 6; i >= 0; i--) { var d = new Date(); d.setDate(d.getDate() - i); var el = document.createElement("div"); el.className = "day" + (S.days.indexOf(dayStr(d)) >= 0 ? " on" : ""); el.textContent = names[d.getDay()]; w.appendChild(el); }
}

// ================= ЗВУК, ТОСТЫ, КОНФЕТТИ =================
function speakAnswer() { var c = Q.queue[Q.pos]; speak(c.say || c.o[c.a], DATA[Q.lang].tts); }
function speak(text, lang) {
  if (!("speechSynthesis" in window)) { toast("Озвучка недоступна тут 😕"); return; }
  var u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = 0.85;
  var v = speechSynthesis.getVoices().filter(function (x) { return x.lang && x.lang.indexOf(lang.slice(0, 2)) === 0; });
  if (v.length) u.voice = v[0];
  speechSynthesis.cancel(); speechSynthesis.speak(u); haptic("light");
}
var toastT;
function toast(m) { var t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 1600); }
function confetti() {
  var cv = $("confetti"), ctx = cv.getContext("2d"); cv.width = innerWidth; cv.height = innerHeight;
  var cols = ["#F7A046", "#9D7CD8", "#10B981", "#EEEEFF", "#7AA2F7"], ps = [];
  for (var i = 0; i < 120; i++) ps.push({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.5, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, vy: 2 + Math.random() * 3.5, vx: -1.5 + Math.random() * 3, r: Math.random() * 6, vr: -0.15 + Math.random() * 0.3, c: cols[i % cols.length] });
  var t0 = performance.now();
  (function f(t) { ctx.clearRect(0, 0, cv.width, cv.height); ps.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); }); if (t - t0 < 2200) requestAnimationFrame(f); else ctx.clearRect(0, 0, cv.width, cv.height); })(t0);
}

// ================= СТАРТ =================
var user = null;
if (tg) {
  tg.ready(); tg.expand();
  if (ver("6.1")) { try { tg.setHeaderColor(ver("6.9") ? "#1A1B26" : "bg_color"); } catch (e) {} try { tg.setBackgroundColor("#1A1B26"); } catch (e) {} tg.BackButton.onClick(goBack); }
  if (ver("7.7") && tg.disableVerticalSwipes) tg.disableVerticalSwipes(); // свайп вниз не закрывает приложение при скролле
  if (ver("7.10") && tg.setBottomBarColor) tg.setBottomBarColor("#12131C");
  user = tg.initDataUnsafe && tg.initDataUnsafe.user;
}
var nm = (user && user.first_name) || "друг";
$("uname").textContent = nm;
function setInitial() { var ch = Array.from(nm.trim())[0] || "🙂"; $("avIn").textContent = ch.toUpperCase(); }
setInitial();
if (user && user.photo_url) {
  var im = new Image(); im.alt = ""; im.referrerPolicy = "no-referrer";
  im.onload = function () { $("avIn").textContent = ""; $("avIn").appendChild(im); };
  im.onerror = setInitial;
  im.src = user.photo_url;
}
var POKES = ["Ты зашёл — это уже победа 💛", "Привет-привет 👋", "Мозг, мы справимся 🧠", "2 минуты — и день засчитан ⚡", "Горжусь тобой 🔥"];
function poke() { haptic("soft"); toast(pick(POKES)); }
var hr = new Date().getHours();
$("hello").textContent = hr < 12 ? "Доброе утро ☀️" : hr < 18 ? "Привет 👋" : "Добрый вечер 🌙";
renderHome(); cloudLoad();

// Демо для скриншотов (в Telegram не срабатывает)
var hs = location.hash;
if (hs === "#topics") openTrack("en");
if (hs === "#quiz") start("en", "tenses");
if (hs === "#answer") { start("es", "cafe"); var bb = $("opts").children; for (var z = 0; z < bb.length; z++) { if (+bb[z].getAttribute("data-i") !== 0) { answer(+bb[z].getAttribute("data-i"), bb[z]); break; } } }
if (hs === "#speak") { start("en", "speak"); $("talkBtn").classList.add("rec"); $("talkHint").textContent = "Говори… отпусти, когда закончишь"; }
if (hs === "#result") { LAST = { lang: "es", topic: "cafe" }; complete(5, 5, 50); }
if (hs === "#profile") { S.xp = 340; S.rounds = 7; S.streak = 3; S.bestStreak = 3; S.lastDay = dayStr(); S.days = [dayStr(), yesterday()]; show("profile"); }
