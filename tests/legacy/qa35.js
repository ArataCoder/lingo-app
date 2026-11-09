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
  // voice ranking
  const best = await page.evaluate(() => ({ es: (window.__v3.pickVoice('es-ES') || {}).name, en: (window.__v3.pickVoice('en-US') || {}).name }));
  ok(best.es === 'Microsoft Elvira Online (Natural) - Spanish (Spain)' && best.en === 'Google US English', 'best voice auto-picked ' + JSON.stringify(best));
  // nav tab exists
  ok(await page.locator('.nav button[data-go=words]').count() === 1, 'nav has Words tab');
  // mark words: 5x card0, 2x card3 in rent
  await page.evaluate(() => { const t = window.__v3.V.topics['es.life.rent']; const mk = i => Object.assign({}, t.cards[i], { topicId: t.id, idx: i, track: 'es' }); for (let k = 0; k < 5; k++) window.__v3.wordMark(mk(0), true); window.__v3.wordMark(mk(2), true); window.__v3.wordMark(mk(2), true); window.__v3.wordMark(mk(5), true); window.__v3.wordMark(mk(7), true); });
  await page.click('.nav button[data-go=words]');
  await page.waitForSelector('#scr_words.active');
  const learning = await page.locator('#wList .wrow').allInnerTexts();
  ok(learning.length === 2 && learning.some(x => x.includes('amueblado')) && learning.some(x => x.includes('Busco un piso amueblado')), 'learning tab lists in-progress words (speak card excluded) ' + JSON.stringify(learning));
  ok(await page.locator('#wcL').innerText() === '2' && await page.locator('#wcD').innerText() === '1', 'tab counters 2/1');
  await page.click('[data-wf=learned]');
  const learned = await page.locator('#wList .wrow.done').allInnerTexts();
  ok(learned.length === 1 && learned[0].includes('La fianza') && learned[0].includes('Залог'), 'learned tab shows highlighted word with translation ' + JSON.stringify(learned));
  const glow = await page.locator('#wList .wrow.done').first().evaluate(e => getComputedStyle(e).borderColor);
  ok(/16, 185, 129/.test(glow), 'learned row is highlighted green ' + glow);
  await page.evaluate(() => window.__spoken.length = 0);
  await page.locator('#wList .wrow.done .v3sb').click();
  const sp = await page.evaluate(() => window.__spoken.filter(s => s.vol !== 0));
  ok(sp.length === 1 && sp[0].text === 'La fianza' && sp[0].lang === 'es-ES', 'word speaker says the Spanish word ' + JSON.stringify(sp));
  // voice box
  const opts = await page.locator('select[data-vl=es] option').allInnerTexts();
  ok(opts.length === 3 && /Elvira/.test(opts[0]), 'voice select lists ES voices best-first ' + JSON.stringify(opts));
  await page.selectOption('select[data-vl=es]', { index: 1 });
  await page.evaluate(() => window.__spoken.length = 0);
  await page.locator('[data-vt=es-ES]').click();
  await page.locator('[data-vr="0.8"]').click();
  const vs = await page.evaluate(() => ({ vs: window.__v3.VS(), sp: window.__spoken, pick: window.__v3.pickVoice('es-ES').name }));
  ok(vs.pick === 'Google español' && Math.abs(vs.vs.rate - 0.8) < 0.01 && vs.sp.length >= 2 && Math.abs(vs.sp[vs.sp.length - 1].rate - 0.8) < 0.01, 'manual voice + slow tempo applied ' + JSON.stringify(vs));
  await page.reload(); await loaded(page);
  ok(await page.evaluate(() => window.__v3.pickVoice('es-ES').name === 'Google español'), 'voice choice survives reload');
  // progress tiles clickable
  await page.evaluate(() => show('profile'));
  await page.locator('.tile.tap').first().click();
  ok(await page.evaluate(() => window.current === 'words'), 'progress tile opens Words screen');
  // result screen button spacing
  await page.evaluate(() => show('result'));
  const gaps = await page.evaluate(() => { const b = Array.from(document.querySelectorAll('#scr_result .btn')).map(x => x.getBoundingClientRect()); return b.slice(1).map((r, i) => Math.round(r.top - b[i].bottom)); });
  ok(gaps.length === 3 && gaps.every(g => g === gaps[0] && g >= 8), 'result buttons evenly spaced ' + JSON.stringify(gaps));
  await page.screenshot({ path: '/data/qa35_result.jpg', type: 'jpeg', quality: 70 });
  await page.evaluate(() => show('words')); await page.click('[data-wf=all]');
  await page.screenshot({ path: '/data/qa35_words.jpg', type: 'jpeg', quality: 70, fullPage: true });
  // personal data gone from content
  const leaks = await page.evaluate(() => JSON.stringify(window.__v3.V.topics).match(/Aleks|Torrevieja|fintech/gi));
  ok(!leaks, 'no personal details in loaded topics ' + JSON.stringify(leaks));
  ok(page.errors.length === 0, 'no JS errors ' + JSON.stringify(page.errors));
  // no speech API
  const b2 = await newPage(browser, false); await loaded(b2.page);
  await b2.page.evaluate(() => { const t = window.__v3.V.topics['es.life.rent']; window.__v3.wordMark(Object.assign({}, t.cards[0], { topicId: t.id, idx: 0 }), true); show('words'); });
  ok(await b2.page.locator('#wList .wrow').count() === 1 && await b2.page.locator('#wList .v3sb:visible').count() === 0, 'without speech: list works, speakers hidden');
  ok(b2.page.errors.length === 0, 'no JS errors without speech ' + JSON.stringify(b2.page.errors));
  await browser.close();
  console.log(fails.length ? 'QA FAILED: ' + fails.length : 'QA ALL PASSED');
  process.exit(fails.length ? 1 : 0);
})();
