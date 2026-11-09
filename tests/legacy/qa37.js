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
  const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
  const { ctx, page } = await newPage(browser, true);
  await loaded(page);
  const cards = [
    { type: 'choice', track: 'es', lang: 'es-ES', q: 'Q1', options: ['right1', 'wrong1'], answer: 0 },
    { type: 'choice', track: 'es', lang: 'es-ES', q: 'Q2', options: ['right2', 'wrong2'], answer: 0 }];
  await page.evaluate(c => window.__v3.startRun({ cards: c, topicId: null, mult: 1, seconds: 120, title: 'QA' }), cards);
  async function pick(i) { await page.click('#v3body .opt[data-i="' + i + '"]'); await page.waitForTimeout(80); }
  async function nextBtn() { return page.evaluate(() => { const b = document.querySelectorAll('.v3fb button'); return b[b.length - 1].textContent; }); }
  async function clickNext() { await page.evaluate(() => { const b = document.querySelectorAll('.v3fb button'); b[b.length - 1].click(); }); await page.waitForTimeout(120); }
  const qtext = () => page.evaluate(() => (document.querySelector('#v3body .qtext') || {}).textContent);
  const qlabel = () => page.evaluate(() => (document.querySelector('#v3body .qlabel') || {}).textContent);
  await pick(1); await clickNext();           // Q1 wrong
  await pick(0);                               // Q2 right
  ok((await nextBtn()).includes('Работа над ошибками'), 'last main card button leads to review');
  await clickNext();
  ok((await qlabel()).includes('Работа над ошибками (закрепи результат)') && (await qtext()) === 'Q1', 'review shows the mistaken card');
  ok(await page.evaluate(() => window.current) === 'play', 'round NOT finished while mistakes remain');
  await pick(1); await clickNext();           // wrong again -> repeats
  ok((await qtext()) === 'Q1', 'wrong in review -> card repeats');
  await pick(0); await clickNext();           // fixed
  await page.waitForTimeout(400);
  const res = await page.evaluate(() => ({ cur: window.current, t: document.getElementById('resTitle').textContent, s: document.getElementById('resSub').textContent, sc: document.getElementById('resScore').textContent }));
  ok(res.cur === 'result' && res.t.includes('Идеально') && res.s.includes('исправлены'), 'Perfect only after all fixed ' + JSON.stringify(res));
  // no-mistake round -> straight to result
  await page.evaluate(c => window.__v3.startRun({ cards: c, topicId: null, mult: 1, seconds: 120, title: 'QA' }), cards);
  await pick(0); await clickNext(); await pick(0);
  ok((await nextBtn()).includes('Итог'), 'clean round -> plain finish');
  await clickNext(); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.current === 'result' && document.getElementById('resTitle').textContent.startsWith('Идеально')), 'clean round Perfect');
  await page.evaluate(() => show('words')); await page.waitForTimeout(300);
  const vb = await page.evaluate(() => ({ sel: document.querySelectorAll('#voiceBox select').length, nb: !!document.getElementById('neuralBox'), rate: document.querySelectorAll('#voiceBox [data-vr]').length }));
  ok(vb.sel === 0 && !vb.nb && vb.rate === 3, 'voice settings hidden, only tempo ' + JSON.stringify(vb));
  await page.screenshot({ path: '/data/qa37_words.jpg', type: 'jpeg', quality: 75 });
  ok(page.errors.length === 0, 'no JS errors ' + JSON.stringify(page.errors).slice(0, 300));
  await browser.close();
  console.log(fails.length ? 'QA37 FAILED: ' + fails.join(' | ') : 'QA37 ALL PASSED');
})();
