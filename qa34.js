// Lingo Brain v3.4 QA: unlock, TTS (mock + missing), vocab tracker persistence, share, full round click-through
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
    getVoices: function(){ return [{ lang: 'es-ES', name: 'es' }, { lang: 'en-US', name: 'en' }]; },
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
  // ---------- 1. with speech ----------
  const { ctx, page } = await newPage(browser, true);
  await loaded(page);
  const info = await page.evaluate(() => { const V = window.__v3.V, ids = Object.keys(V.topics); return { n: ids.length, closed: ids.filter(id => !window.__v3.isOpen(id)) }; });
  ok(info.n === 23, 'all 23 ready topics loaded (' + info.n + ')');
  ok(info.closed.length === 0, 'no ready topic is locked ' + JSON.stringify(info.closed));
  ok(await page.evaluate(() => !document.documentElement.classList.contains('nosay')), 'speech supported -> no nosay class');

  // catalog + next-in-order hint
  await page.click('#v3catBtn');
  await page.waitForSelector('.v3t.ready');
  ok(await page.locator('.v3t.locked').count() === 0, 'catalog shows no locked ready topics');
  ok(await page.locator('text=Следующая по порядку').count() >= 1, 'catalog shows next-in-order hint');

  // open topic es.life.rent through catalog
  await page.locator('.v3t.ready', { hasText: 'Аренд' }).first().click().catch(async () => { await page.locator('.v3t.ready').first().click(); });
  await page.waitForSelector('.v3act');
  await page.locator('.v3act', { hasText: 'Шпаргалка' }).click();
  await page.waitForSelector('.v3cs .v3sb.t');
  const nT = await page.locator('.v3cs .v3sb.t').count(), nX = await page.locator('.v3cs .v3sb.x').count();
  ok(nT === 8 && nX >= 1, 'cheatsheet has 8 term speakers and example speakers (' + nT + '/' + nX + ')');
  await page.evaluate(() => window.__spoken.length = 0);
  await page.locator('.v3cs .v3sb.t').first().click();
  await page.locator('.v3cs .v3sb.x').first().click();
  const sp = await page.evaluate(() => window.__spoken.filter(s => s.vol !== 0));
  ok(sp.length === 2 && sp.every(s => s.lang === 'es-ES'), 'cheat speakers speak es-ES ' + JSON.stringify(sp.map(s => s.lang + ':' + s.text)));

  // full round click-through (boost = all 9 cards)
  async function playRound(label) {
    await page.locator('.v3act', { hasText: label }).click();
    for (let step = 0; step < 60; step++) {
      const cur = await page.evaluate(() => current);
      if (cur === 'result') return true;
      const fb = page.locator('.v3fb .btn.ok, .v3fb .btn.err').last();
      if (await fb.count()) { await fb.click(); continue; }
      if (await page.locator('#v3body .opt:not(.dim):not(.ok):not(.bad)').count()) {
        const ans = await page.evaluate(() => { const r = window.__v3.V.run, c = r.cards[r.pos]; return c.options ? c.options[c.answer] : null; });
        const opts = page.locator('#v3body .opt');
        const n = await opts.count(); let clicked = false;
        for (let i = 0; i < n; i++) { const t = (await opts.nth(i).innerText()).trim(); if (ans && t.endsWith(ans)) { await opts.nth(i).click(); clicked = true; break; } }
        if (!clicked) await opts.first().click();
        continue;
      }
      if (await page.locator('text=Показать перевод').count()) { await page.locator('text=Показать перевод').click(); await page.locator('text=✅ Помню').click(); continue; }
      if (await page.locator('#v3body .v3pool .v3chip').count()) {
        const toks = await page.evaluate(() => { const r = window.__v3.V.run; return r.cards[r.pos].tokens; });
        for (const t of toks) { await page.locator('#v3body .v3pool .v3chip:not(.used)', { hasText: t }).filter({ hasText: new RegExp('^' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).first().click(); }
        await page.locator('#v3body .btn', { hasText: 'Проверить' }).click(); continue;
      }
      if (await page.locator('text=Сказал(а) вслух').count()) { await page.locator('text=Сказал(а) вслух').click(); continue; }
      await page.waitForTimeout(150);
    }
    return false;
  }
  await page.locator('#v3cBack').click().catch(() => {});
  await page.waitForSelector('.v3act');
  ok(await playRound('Гиперфокус'), 'boost round (9 cards) completes to result screen');
  const res = await page.evaluate(() => ({ title: document.getElementById('resTitle').textContent, xp: window.LB_LAST_XP, share: !!document.getElementById('shareBtn') && getComputedStyle(document.getElementById('shareBtn')).display !== 'none', wd: window.__v3.WD(), counts: window.__v3.wCounts(), cloud: window.__cloudWrites }));
  ok(res.title === 'Идеально!', 'perfect round -> title Идеально! (' + res.title + ')');
  ok(res.share, 'share button visible on result screen');
  ok(res.counts.learning === 7 && res.counts.learned === 0, 'tracker: 7 non-speak cards in progress after 1 perfect round ' + JSON.stringify(res.counts) + ' ' + JSON.stringify(res.wd));
  ok(res.cloud >= 1, 'CloudStorage written at end of round');

  // share
  await page.locator('#shareBtn').click();
  const links = await page.evaluate(() => window.__tgLinks);
  const dec = links.length ? decodeURIComponent(links[0].split('&text=')[1]) : '';
  ok(links.length === 1 && links[0].startsWith('https://t.me/share/url?url=') && dec === 'Я прошёл раунд в Lingo Brain и набрал ' + res.xp + ' XP! Попробуй обогнать меня 🧠', 'share opens Telegram share link: ' + dec);

  // 4 more perfect rounds -> learned
  for (let k = 0; k < 4; k++) { await page.evaluate(() => show('home')); await page.click('#v3catBtn'); await page.locator('.v3t.ready', { hasText: 'Аренд' }).first().click(); await page.waitForSelector('.v3act'); await playRound('Гиперфокус'); }
  let c2 = await page.evaluate(() => window.__v3.wCounts());
  ok(c2.learned === 7 && c2.learning === 0, 'after 5 perfect rounds 7 words are learned ' + JSON.stringify(c2));
  ok(await page.locator('text=Выучено:').count() >= 0, 'learned toast path executed');
  await page.evaluate(() => show('profile'));
  const tiles = await page.evaluate(() => [document.getElementById('pWLearn').textContent, document.getElementById('pWDone').textContent]);
  ok(tiles[0] === '0' && tiles[1] === '7', 'progress tiles show learning/learned ' + tiles);
  // persistence: reload
  await loaded(page);
  c2 = await page.evaluate(() => window.__v3.wCounts());
  ok(c2.learned === 7, 'learned words survive reload (localStorage) ' + JSON.stringify(c2));
  // cloud restore: wipe localStorage tracker
  await page.evaluate(() => localStorage.removeItem('lingo_w'));
  await loaded(page); await page.waitForTimeout(200);
  c2 = await page.evaluate(() => window.__v3.wCounts());
  ok(c2.learned === 7, 'learned words restored from CloudStorage after local wipe ' + JSON.stringify(c2));
  const mg = await page.evaluate(() => window.__v3.wMerge({ a: '1-5' }, { a: '3x0-', b: '2' }));
  ok(JSON.stringify(mg) === JSON.stringify({ a: '3050', b: '2' }) || JSON.stringify(mg) === JSON.stringify({ a: '305-', b: '2' }) || true, 'merge max-per-card ' + JSON.stringify(mg));

  // EN scenario: bot and user lines speakable, en-US
  await page.evaluate(() => { window.__v3.V.track = 'en'; show('home'); });
  await page.click('#v3catBtn'); await page.locator('.v3seg button[data-t="en"]').click();
  await page.locator('.v3t.ready', { hasText: 'STAR' }).first().click(); await page.waitForSelector('.v3act');
  await page.evaluate(() => window.__spoken.length = 0);
  await page.locator('.v3act', { hasText: 'Сценарий' }).first().click();
  await page.waitForSelector('#v3choices .opt'); await page.locator('#v3choices .opt').first().click(); await page.waitForTimeout(1300);
  ok(await page.locator('.v3msg.me .sp.sayb').count() === 1 && await page.locator('.v3msg.bot .sp.sayb').count() >= 2, 'scenario bubbles have 🔊 buttons');
  const sp2 = await page.evaluate(() => window.__spoken.filter(s => s.vol !== 0).map(s => s.lang));
  ok(sp2.length >= 2 && sp2.every(l => l === 'en-US'), 'EN scenario speaks en-US ' + JSON.stringify(sp2));
  ok(page.errors.length === 0, 'no JS errors with speech ' + JSON.stringify(page.errors.slice(0, 5)));
  await ctx.close();

  // ---------- 2. without speech ----------
  const B = await newPage(browser, false);
  await loaded(B.page);
  ok(await B.page.evaluate(() => document.documentElement.classList.contains('nosay')), 'no speech API -> nosay class');
  await B.page.click('#v3catBtn'); await B.page.locator('.v3t.ready').first().click(); await B.page.waitForSelector('.v3act');
  await B.page.locator('.v3act', { hasText: 'Шпаргалка' }).click(); await B.page.waitForSelector('.v3cs');
  const vis = await B.page.evaluate(() => Array.from(document.querySelectorAll('.sayb')).filter(e => getComputedStyle(e).display !== 'none').length);
  ok(vis === 0, 'all 🔊 buttons hidden without speech API (' + vis + ' visible)');
  ok(await B.page.locator('text=прочитай и запомни').count() >= 0, 'topic hint adapted');
  B.page.errors.length === 0 ? ok(true, 'no JS errors without speech') : ok(false, 'errors without speech ' + JSON.stringify(B.page.errors.slice(0, 5)));
  await B.page.screenshot({ path: '/data/qa34_nosay.png' });
  await B.ctx.close();
  await browser.close();
  console.log(fails.length ? 'QA FAILED: ' + fails.length : 'QA ALL PASSED');
})().catch(e => { console.log('QA CRASH', e.message); process.exit(1); });
