// Lingo Brain e2e: Telegram SDK mocks (CloudStorage async/errors/hang), modals, offline, 4 tabs, 44px targets.
// Run: python3 -m http.server 8080 &  then  node tests/e2e.cjs
// Env: PW=path/to/playwright (default 'playwright'), CHROMIUM=path (optional), BASE=http://localhost:8080
const { chromium } = require(process.env.PW || 'playwright');
const BASE = process.env.BASE || 'http://localhost:8080';
const fails = [];
const ok = (cond, name, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails.push(name); };

function tgMock(mode) {
  return `(function(){
  var store = {}, calls = window.__tgCalls = [];
  function later(fn, ms){ setTimeout(fn, ms == null ? 60 : ms); }
  var cs = {
    setItem: function(k, v, cb){ calls.push('set:' + k); if (${JSON.stringify(mode)} === 'hang') return; later(function(){ if (${JSON.stringify(mode)} === 'error') { cb && cb('STORAGE_ERROR'); return; } store[k] = String(v); cb && cb(null, true); }); },
    getItem: function(k, cb){ calls.push('get:' + k); if (${JSON.stringify(mode)} === 'hang') return; later(function(){ if (${JSON.stringify(mode)} === 'error') { cb && cb('STORAGE_ERROR'); return; } cb && cb(null, store[k] || ''); }); },
    getItems: function(ks, cb){ later(function(){ var o = {}; ks.forEach(function(k){ o[k] = store[k] || ''; }); cb && cb(null, o); }); },
    removeItem: function(k, cb){ delete store[k]; later(function(){ cb && cb(null, true); }); },
    getKeys: function(cb){ later(function(){ cb && cb(null, Object.keys(store)); }); }
  };
  var noop = function(){};
  var btn = { show: noop, hide: noop, onClick: noop, offClick: noop, setText: noop, enable: noop, disable: noop, isVisible: false };
  window.Telegram = { WebApp: {
    initData: '', initDataUnsafe: { user: { id: 1, first_name: 'Test', language_code: 'ru' } },
    version: '7.10', platform: 'android', colorScheme: 'dark', themeParams: {}, viewportHeight: 844, viewportStableHeight: 844, isExpanded: true,
    isVersionAtLeast: function(v){ return parseFloat(v) <= 7.10; },
    ready: noop, expand: noop, close: noop, onEvent: noop, offEvent: noop, sendData: noop,
    setHeaderColor: noop, setBackgroundColor: noop, setBottomBarColor: noop, enableClosingConfirmation: noop, disableClosingConfirmation: noop, disableVerticalSwipes: noop,
    openLink: function(u){ calls.push('openLink:' + u); }, openTelegramLink: function(u){ calls.push('tgLink:' + u); }, shareMessage: noop, switchInlineQuery: noop,
    showPopup: function(p, cb){ calls.push('popup'); later(function(){ cb && cb((p.buttons && p.buttons[0] && p.buttons[0].id) || 'ok'); }); },
    showAlert: function(m, cb){ calls.push('alert'); later(function(){ cb && cb(); }); },
    showConfirm: function(m, cb){ calls.push('confirm'); later(function(){ cb && cb(true); }); },
    HapticFeedback: { impactOccurred: noop, notificationOccurred: noop, selectionChanged: noop },
    BackButton: btn, MainButton: btn, SecondaryButton: btn, SettingsButton: btn,
    CloudStorage: cs
  } };
})();`;
}

async function open(br, { mode = 'ok', tg = true, seed = null } = {}) {
  const ctx = await br.newContext({ viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route('https://telegram.org/js/telegram-web-app.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: tg ? tgMock(mode) : '' }));
  await p.route('**/*.workers.dev/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true,"friends":[],"enabled":0}' }));
  await p.route(/posthog|i\.posthog|fonts\.(googleapis|gstatic)/, r => r.fulfill({ status: 200, body: '' }));
  if (seed) await p.addInitScript(seed);
  await p.goto(BASE + '/index.html');
  await p.waitForTimeout(2500);
  return { ctx, p, errs };
}

const SKIP_ONB = `try { if (!localStorage.getItem('lingo_p')) localStorage.setItem('lingo_p', JSON.stringify({ onb: 0, lang: 'es', level: 0, goal: 'es.survive', seen: {}, rem: { on: false, hour: 19 } })); } catch (e) {}`;

(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });

  // 1. Fresh user + async CloudStorage
  let { ctx, p, errs } = await open(br);
  // v5.2: one-step onboarding (#lbonb) replaces the 3-step #v5onb
  ok(await p.isVisible('#lbonb'), 'one-step onboarding shown for a new user');
  ok(!(await p.isVisible('#v5onb')), 'old 3-step onboarding is replaced');
  const onbSmall = await p.evaluate(() => Array.from(document.querySelectorAll('#lbonb button')).filter(b => { const r = b.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; }).length);
  ok(onbSmall === 0, 'onboarding buttons >= 44px', 'small=' + onbSmall);
  await p.click('#lbonb button[data-lv=a0]');
  await p.waitForTimeout(1500);
  const onbP = await p.evaluate(() => JSON.parse(localStorage.getItem('lingo_p') || '{}'));
  ok(onbP.onb === 1 && onbP.lang === 'es' && onbP.lvl && onbP.lvl.es === 1, 'A0 choice saves ES track + level', JSON.stringify({ onb: onbP.onb, lang: onbP.lang, lvl: onbP.lvl }));
  ok(await p.evaluate(() => window.current === 'cheat' && !!document.querySelector('#v3cheat .lbm[data-pose=start]')), 'A0 starts the first lesson with the mascot', await p.evaluate(() => window.current));
  await p.waitForTimeout(300);
  await p.evaluate(() => show('home')); await p.waitForTimeout(400);
  const tabs = await p.evaluate(() => Array.from(document.querySelectorAll('.nav button')).filter(b => b.offsetParent !== null).map(b => b.getAttribute('data-go')).join(','));
  ok(tabs === 'home,catalog,profile,friends', 'exactly 4 tabs in fixed order', tabs);
  ok(await p.evaluate(() => !!document.querySelector('.nav button.on[aria-current="page"]')), 'active tab has aria-current');
  // Visible text is short ("1 из 8", "≈ 2 минуты"); the full "тема N из M" phrase lives in aria-label.
  const hero = (await p.textContent('#v5hero')).replace(/\s+/g, ' ');
  const heroLabel = (await p.getAttribute('#v5hero', 'aria-label')) || '';
  ok(/2 \u043c\u0438\u043d/.test(hero) && /\d+ \u0438\u0437 \d+/.test(hero) && /\u0442\u0435\u043c\u0430 \d+ \u0438\u0437 \d+/.test(heroLabel), 'hero variant A (topic N of M, ~2 min)', hero.slice(0, 90) + ' | ' + heroLabel);
  const chips = await p.evaluate(() => Array.from(document.querySelectorAll('.top .chips > *')).filter(c => c.offsetParent !== null).length);
  ok(chips === 1, 'header shows only the streak chip', 'visible=' + chips);
  ok(/XP/.test(await p.textContent('#v51st')), 'freezes + XP moved into the goal card');
  for (const g of ['home', 'catalog', 'profile', 'friends']) {
    await p.evaluate(x => show(x), g); await p.waitForTimeout(350);
    const small = await p.evaluate(() => Array.from(document.querySelectorAll('button,[role=button]')).filter(b => { if (b.offsetParent === null) return false; const r = b.getBoundingClientRect(); return r.width > 0 && (r.height < 43.5 || r.width < 43.5); }).map(b => (b.id || b.className || b.tagName) + ':' + (b.textContent || '').trim().slice(0, 14) + ':' + Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height)));
    ok(small.length === 0, 'touch targets >= 44px on ' + g, small.slice(0, 4).join(' | '));
    const noName = await p.evaluate(() => Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null && !(b.getAttribute('aria-label') || (b.textContent || '').trim())).length);
    ok(noName === 0, 'every button has an accessible name on ' + g, 'missing=' + noName);
  }
  const contrast = await p.evaluate(() => {
    const hex = h => { h = h.trim().replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)); };
    const L = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    const cs = getComputedStyle(document.documentElement), bg = L(hex(cs.getPropertyValue('--bg')));
    return ['--dim', '--muted', '--text'].map(v => { const f = L(hex(cs.getPropertyValue(v))); return v + '=' + ((Math.max(f, bg) + 0.05) / (Math.min(f, bg) + 0.05)).toFixed(2); });
  });
  ok(contrast.every(c => parseFloat(c.split('=')[1]) >= 4.5), 'text contrast >= 4.5:1 (WCAG AA)', contrast.join(' '));
  await p.evaluate(() => save()); await p.waitForTimeout(150);
  ok(await p.evaluate(() => window.__tgCalls.some(c => c.startsWith('set:'))), 'progress written to CloudStorage');
  // offline
  await ctx.setOffline(true); await p.evaluate(() => window.dispatchEvent(new Event('offline'))); await p.waitForTimeout(200);
  ok(await p.isVisible('#v51net'), 'offline banner appears');
  await ctx.setOffline(false); await p.evaluate(() => window.dispatchEvent(new Event('online'))); await p.waitForTimeout(200);
  ok(!(await p.isVisible('#v51net')), 'offline banner hides when the network is back');
  // review after a round
  const seeded = await p.evaluate(() => {
    const v = window.__v3 && window.__v3.V, ids = v && v.topics ? Object.keys(v.topics).filter(k => v.topics[k].cards && v.topics[k].cards.length && v.topics[k].track === 'es') : [];
    if (!ids.length) return 0;
    const RV = window.__v5.RV; RV[ids[0] + '#0'] = [0, window.__v5.today()]; localStorage.setItem('lingo_rv', JSON.stringify(RV)); return 1;
  });
  if (seeded) {
    await p.evaluate(() => { window.LAST = { lang: 'es', topic: 'x' }; show('result'); }); await p.waitForTimeout(300);
    ok(await p.isVisible('#v51rv'), 'result screen offers "review mistakes now"');
    await p.click('#v51rv'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => window.current !== 'result'), 'review starts from the result screen', await p.evaluate(() => window.current));
  } else ok(false, 'could not seed a review card');
  ok(errs.length === 0, 'no JS errors (fresh user)', errs.slice(0, 3).join(' | '));
  await ctx.close();

  // 2. CloudStorage errors / never answers / Telegram missing
  for (const cfg of [{ mode: 'error' }, { mode: 'hang' }, { tg: false }]) {
    const name = cfg.tg === false ? 'no Telegram SDK (plain browser)' : 'CloudStorage ' + cfg.mode;
    const r = await open(br, Object.assign({ seed: SKIP_ONB }, cfg));
    await r.p.evaluate(() => show('home')); await r.p.waitForTimeout(300);
    const t = (await r.p.textContent('#v5hero').catch(() => '')) || '';
    ok(t.length > 5 && r.errs.length === 0, name + ': app still works', r.errs.slice(0, 2).join(' | '));
    await r.p.evaluate(() => { try { save(); } catch (e) { window.__saveErr = e.message; } });
    ok(await r.p.evaluate(() => !window.__saveErr && !!localStorage.getItem('lingo_v2')), name + ': progress saved locally');
    await r.ctx.close();
  }

  // 3. Reduced motion is respected
  {
    const ctx2 = await br.newContext({ reducedMotion: 'reduce' }); const p2 = await ctx2.newPage();
    await p2.route('https://telegram.org/js/telegram-web-app.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: tgMock('ok') }));
    await p2.goto(BASE + '/index.html'); await p2.waitForTimeout(1200);
    ok(await p2.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches && !!document.getElementById('v51css')), 'reduced-motion styles active');
    await ctx2.close();
  }

  await br.close();
  console.log(fails.length ? '\nFAILED: ' + fails.length : '\nALL PASSED');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
