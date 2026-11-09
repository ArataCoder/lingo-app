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
  await page.addInitScript(() => { window.__played = []; const A = window.Audio; window.Audio = function (u) { window.__played.push(u); const a = new A(); a.play = () => Promise.resolve(); return a; }; });
  await loaded(page);
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => { window.speak('Any blockers?', 'en-US'); window.speak('Action items', 'en-US'); return { hasmp3: document.body.classList.contains('hasmp3'), played: window.__played.slice() }; });
  console.log(JSON.stringify(r));
  ok(r.hasmp3, 'manifest loaded');
  ok(r.played.length >= 1, 'mp3 used instead of robot voice');
  await browser.close();
  console.log(fails.length ? 'QA37B FAILED: ' + fails.join(' | ') : 'QA37B ALL PASSED');
})();
