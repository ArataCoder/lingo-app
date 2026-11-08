// Lingo Brain v3.5 QA (words screen, voices, layout): unlock, TTS (mock + missing), vocab tracker persistence, share, full round click-through
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8765/index.html';
const TG = `(function(){
  var store = {}; try { store = JSON.parse(localStorage.getItem('__cloud') || '{}'); } catch (e) {}
  function persist(){ localStorage.setItem('__cloud', JSON.stringify(store)); }
  var noop = new Proxy(function(){}, { get: function(){ return noop; }, apply: function(){ return undefined; } });
  window.__tgLinks = []; window.__cloudWrites = 0;
  var base = {
    initData: 'query_id=qa', initDataUnsafe: { user: { id: 1, first_name: 'QA' } }, version: '7.0', platform: 'android', colorScheme: 'dark', themeParams: {},
    isVersionAtLeast: function(v){ var a = String(v).split('.').map(Number), b = [7, 0]; return a[0] < b[0] || (a[0] === b[0] && (a[1] || 0) <= b[1]); },
    ready: function(){}, expand: function(){}, close: function(){},
    BackButton: { show: function(){}, hide: function(){}, onClick: function(){}, offClick: function(){} },
    HapticFeedback: { impactOccurred: function(){}, notificationOccurred: function(){}, selectionChanged: function(){} },
    CloudStorage: {
      setItem: function(k, v, cb){ store[k] = v; persist(); window.__cloudWrites++; if (cb) cb(null, true); },
      getItem: function(k, cb){ setTimeout(function(){ cb(null, store[k] || ''); }, 20); },
      getItems: function(ks, cb){ var o = {}; ks.forEach(function(k){ o[k] = store[k] || ''; }); setTimeout(function(){ cb(null, o); }, 20); },
      removeItem: function(k, cb){ delete store[k]; persist(); if (cb) cb(null, true); }
    },
    openTelegramLink: function(u){ window.__tgLinks.push(u); }, openLink: function(){}
  };
  window.Telegram = { WebApp: new Proxy(base, { get: function(t, k){ return k in t ? t[k] : noop; } }) };
})();`;
const SPEECH_MOCK = `window.__spoken = [];
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speaking: false, pending: false, paused: false,
    getVoices: function(){ return [{ lang: 'es-ES', name: 'Monica', localService: true, voiceURI: 'Monica' }, { lang: 'es-ES', name: 'Google español', localService: false, voiceURI: 'Google español' }, { lang: 'es-ES', name: 'Microsoft Elvira Online (Natural) - Spanish (Spain)', localService: false, voiceURI: 'elvira' }, { lang: 'en-US', name: 'Fred', localService: true, voiceURI: 'Fred' }, { lang: 'en-US', name: 'Google US English', localService: false, voiceURI: 'gus' }, { lang: 'en-US', name: 'Samantha', localService: true, voiceURI: 'Samantha' }]; },
    speak: function(u){ window.__spoken.push({ text: u.text, lang: u.lang, rate: u.rate, vol: u.volume }); }, cancel: function(){}, resume: function(){}, addEventListener: function(){} } });
  window.SpeechSynthesisUtterance = function(t){ this.text = t; this.lang = ''; this.rate = 1; this.volume = 1; };`;
const NO_SPEECH = `Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined }); window.SpeechSynthesisUtterance = undefined;`;

const fails = [], ok = (c, m) => { if (c) console.log('PASS', m); else { console.log('FAIL', m); fails.push(m); } };

async function newPage(browser, speech) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('https://telegram.org/**', r => r.fulfill({ contentType: 'application/javascript', body: TG }));
  await ctx.route(/posthog|i\.posthog|workers\.dev/, r => r.fulfill({ status: 200, body: '{}' }));
  await ctx.addInitScript(speech ? SPEECH_MOCK : NO_SPEECH);
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::/.test(m.text())) page.errors.push('console: ' + m.text()); });
  return { ctx, page };
}
async function loaded(page) {
  await page.goto(BASE);
  await page.waitForFunction(() => window.__v3 && window.__v3.V.cat && Object.keys(window.__v3.V.topics).length >= 23, null, { timeout: 15000 });
}

(async () => {
  const fs = require('fs');
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
  const { ctx, page } = await newPage(browser, true);
  let synced = 0, cards = [];
  await ctx.route('**/api/sync', r => { synced++; r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, me: 1, invite: 'https://t.me/LingoBrainBOT?start=ref_1', friends: [
    { id: 1, name: 'QA', xp: 340, week: 40, streak: 3, learned: 5, me: true },
    { id: 2, name: 'Masha', xp: 900, week: 120, streak: 7, learned: 30 },
    { id: 3, name: 'Dima', xp: 150, week: 0, streak: 0, learned: 2 }] }) }); });
  await ctx.route('**/api/card', r => { cards.push(JSON.parse(r.request().postData()).send); r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, url: 'https://x.dev/card/a.jpg', sent: true }) }); });
  await ctx.route('**/assets/audio/manifest.json*', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ version: 1, items: { 'es|hola qué tal': 'es/test.mp3' } }) }));
  await page.addInitScript(() => { window.__played = []; window.Audio = function (u) { this.src = u; this.playbackRate = 1; this.play = () => { window.__played.push(u); return Promise.resolve(); }; this.pause = () => {}; }; });
  await loaded(page);
  ok(await page.evaluate(() => document.querySelectorAll('.nav button').length === 5 && !!document.querySelector('.nav [data-go=friends]')), 'nav has Friends tab');
  await page.waitForFunction(() => window.__v3.audioInfo().count === 1, null, { timeout: 5000 }).catch(() => {});
  ok(await page.evaluate(() => window.__v3.audioFor('¡Hola! ¿Qué tal?', 'es-ES') === 'assets/audio/es/test.mp3'), 'manifest key matches punctuation/accents');
  const a1 = await page.evaluate(() => { const n = window.__spoken.length; window.__v3.say('¡Hola! ¿Qué tal?', 'es-ES'); return { played: window.__played.slice(), spokeTts: window.__spoken.length > n }; });
  ok(a1.played.length === 1 && a1.played[0].endsWith('es/test.mp3') && !a1.spokeTts, 'mp3 neural voice preferred');
  await page.evaluate(() => window.__v3.say('Gracias', 'es-ES'));
  await page.waitForTimeout(150);
  ok(await page.evaluate(() => window.__played.length === 1 && window.__spoken.length > 0), 'missing mp3 -> best browser voice');
  ok(await page.evaluate(() => { window.__v3.setNeural(false); window.__v3.say('¡Hola! ¿Qué tal?', 'es-ES'); const r = window.__played.length === 1; window.__v3.setNeural(true); return r; }), 'neural toggle off -> TTS only');
  await page.evaluate(() => show('words'));
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => !document.getElementById('neuralChk')), 'neural toggle hidden from users (v3.7)');
  await page.evaluate(() => show('friends'));
  await page.waitForFunction(() => document.querySelectorAll('#frList .frow').length === 3, null, { timeout: 5000 }).catch(() => {});
  const fr = await page.evaluate(() => [...document.querySelectorAll('#frList .frow')].map(x => ({ t: x.textContent, me: x.classList.contains('me') })));
  ok(fr.length === 3 && fr[0].t.includes('Masha') && fr[0].t.includes('120') && fr.some(x => x.me && x.t.includes('Ты')), 'friends leaderboard week sort + me row');
  await page.screenshot({ path: '/data/qa36_friends.jpg', type: 'jpeg', quality: 80 });
  await page.evaluate(() => lbFriendsMode('all'));
  ok(await page.evaluate(() => document.querySelector('#frList .frow').textContent.includes('900')), 'all-time mode');
  await page.evaluate(() => lbInvite());
  ok(await page.evaluate(() => (window.__tgLinks.slice(-1)[0] || '').includes('start%3Dref_1')), 'invite uses personal ref link');
  ok(synced >= 1, 'sync called (' + synced + ')');
  await page.evaluate(() => { document.getElementById('resXp').textContent = '+95'; document.getElementById('resTitle').textContent = 'Отлично!'; document.getElementById('resScore').textContent = '9/10'; window.LAST = { lang: 'es', topic: 'es.survive.hello' }; lbCard(); });
  await page.waitForSelector('#cardOv.on', { timeout: 3000 }).catch(() => {});
  const src = await page.evaluate(() => document.getElementById('cardImg').src);
  ok(src.startsWith('data:image/jpeg') && src.length > 60000, 'player card rendered (' + Math.round(src.length / 1024) + ' KB)');
  fs.writeFileSync('/data/qa36_card.jpg', Buffer.from(src.split(',')[1], 'base64'));
  await page.click('#cardSend');
  await page.waitForTimeout(300);
  ok(cards.length === 1 && cards[0] === true, 'card sent to chat via bot');
  await page.screenshot({ path: '/data/qa36_overlay.jpg', type: 'jpeg', quality: 75 });
  await page.evaluate(() => document.getElementById('cardClose').click());
  await page.evaluate(() => { show('result'); });
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/data/qa36_result.jpg', type: 'jpeg', quality: 80 });
  ok(page.errors.length === 0, 'no JS errors ' + JSON.stringify(page.errors).slice(0, 300));
  await browser.close();
  console.log(fails.length ? 'QA36 FAILED: ' + fails.join(' | ') : 'QA36 ALL PASSED');
})();
