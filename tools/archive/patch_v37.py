# Lingo Brain v3.7: Mistake Review, hide voice settings, avatars, no-voice fallback
import io, os
ROOT = os.path.dirname(os.path.abspath(__file__))

def rd(p): return io.open(os.path.join(ROOT, p), encoding='utf-8').read()
def wr(p, s): io.open(os.path.join(ROOT, p), 'w', encoding='utf-8').write(s)
def rep(s, a, b, name, cnt=1):
    n = s.count(a)
    assert n == cnt, 'patch point %s found %d times' % (name, n)
    return s.replace(a, b)

# ---------------- v3.js ----------------
s = rd('v3.js')
if 'function endMain()' not in s:
    s = rep(s, 'r.pos = 0; r.score = 0; r.xp = 0; r.combo = 0; V.run = r;',
        'r.pos = 0; r.score = 0; r.xp = 0; r.combo = 0; r.mistakes = []; r.review = false; r.hadReview = false; r.fixed = 0; r.mainN = r.cards.length; V.run = r;', 'startRun')
    s = rep(s, 'finishRun(); } }, 1000);', 'endMain(); } }, 1000);', 'timer')
    s = rep(s, 'function nextStep() { var r = V.run; haptic("light"); r.pos++; if (r.pos >= r.cards.length) finishRun(); else renderStep(); }',
'''function endMain() {
    var r = V.run; if (!r) return;
    stopTimer();
    if (r.mistakes && r.mistakes.length) {
      r.review = true; r.hadReview = true; r.cards = r.mistakes; r.mistakes = []; r.pos = 0;
      var tm = $("v3timer"); if (tm) { tm.textContent = "⚡"; tm.style.color = "var(--es)"; }
      haptic("medium"); toast("⚡️ Работа над ошибками — закрепи результат");
      try { trk("mistake_review", { n: r.cards.length }); } catch (e) {}
      renderStep();
    } else finishRun();
  }
  function nextStep() { var r = V.run; haptic("light"); r.pos++; if (r.pos >= r.cards.length) endMain(); else renderStep(); }''', 'nextStep')
    s = rep(s, '    var r = V.run;\n    if (ok) { r.score++;'.replace('\\n', chr(10)),
'''    var r = V.run, cur = r.cards && r.cards[r.pos];
    if (!ok && r.mistakes && cur && r.mistakes.indexOf(cur) < 0) r.mistakes.push(cur);
    if (ok && r.review) { r.fixed++; r.combo++; r.xp += Math.round(cfgXp("correct", 10) / 2); haptic("success"); return; }
    if (ok) { r.score++;''', 'grade')
    s = rep(s, 'nx.textContent = r.pos + 1 >= r.cards.length ? "🏁 Итог" : "Дальше →";',
        'nx.textContent = r.pos + 1 >= r.cards.length ? (r.mistakes && r.mistakes.length ? "⚡️ Работа над ошибками" : "🏁 Итог") : "Дальше →";', 'feedbackBtn')
    s = rep(s, 'card.appendChild(E("div", "qlabel", label + " · " + esc(r.title)));',
        'card.appendChild(E("div", "qlabel", r.review ? "⚡️ Работа над ошибками (закрепи результат) · " + label : label + " · " + esc(r.title))); if (r.review) card.style.boxShadow = "0 0 0 2px var(--es) inset";', 'label')
    s = rep(s, 'var n = Math.max(1, r.cards.length);', 'var n = Math.max(1, r.mainN || r.cards.length);', 'finishN')
    s = rep(s, 'complete(r.score, n, Math.round(r.xp * (r.mult || 1)));',
        'complete(r.score, n, Math.round(r.xp * (r.mult || 1)));\n    if (r.hadReview) { try { $("resTitle").textContent = "Идеально! 💪"; $("resEmoji").textContent = "⚡️"; $("resSub").textContent = "Сразу верно " + r.score + " из " + n + " · ошибки исправлены: " + r.fixed + ". Так и запоминается!"; } catch (e) {} }'.replace('\\n', chr(10)), 'finishTitle')
    # voice settings: only tempo is visible
    s = rep(s, 'function renderVoiceBox() {\n    var vb = document.getElementById("voiceBox"); if (!vb) return;'.replace('\\n', chr(10)),
'''function renderVoiceBox() {
    var vb = document.getElementById("voiceBox"); if (!vb) return;
    var r0 = VS.rate || 1;
    vb.innerHTML = '<div class="vrow" style="margin:0"><span>🐢 Темп речи</span><div class="vrate">' + [[0.8, "медленно"], [1, "норм"], [1.15, "быстро"]].map(function (x) { return '<button data-vr="' + x[0] + '" class="' + (Math.abs(r0 - x[0]) < 0.01 ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + "</div></div>";
    Array.prototype.forEach.call(vb.querySelectorAll("[data-vr]"), function (b) { b.onclick = function () { VS.rate = parseFloat(b.getAttribute("data-vr")); vsSave(); renderVoiceBox(); say(SAMPLE.es, "es-ES", 1); }; });
    return;''', 'voiceBox')
    # no voice for this language (e.g. Telegram Desktop on Windows has only English): show text, never read Spanish with an English robot
    s = rep(s, '    ttsSay(text, lang, rate);\n  }\n  // старые экраны'.replace('\\n', chr(10)),
        '    try { if (SAY_OK && speechSynthesis.getVoices().length && !voicesFor(lang).length) { if (window.toast) toast("🔇 " + text); return; } } catch (e) {}\n    ttsSay(text, lang, rate);\n  }\n  // старые экраны'.replace('\\n', chr(10)), 'sayFallback')
    s = rep(s, 'window.__v3.wMerge = wMerge;', 'window.__v3.wMerge = wMerge; window.__v3.startRun = startRun;', 'expose')
    lines = s.split(chr(10))
    for i in range(12):
        if 'VER' in lines[i] and '"11"' in lines[i]:
            lines[i] = lines[i].replace('"11"', '"12"'); break
    else:
        raise SystemExit('VER line not found')
    s = chr(10).join(lines)
    wr('v3.js', s)

# ---------------- v36.js ----------------
t = rd('v36.js')
if 'function avaUrl' not in t:
    t = rep(t, '  function neuralBox() {\n'.replace('\\n', chr(10)), '  function neuralBox() {\n    var old = $("neuralBox"); if (old) old.remove(); return;\n'.replace('\\n', chr(10)), 'neuralBox')
    t = rep(t, '  function trk(n, p) {',
'''  function avaUrl(p) { if (p.me && me && me.photo_url) return me.photo_url; return base() + "/ava/" + p.id + ".jpg"; }
  var AVA = null;
  function loadAva() { if (!me) return; var im = new Image(); im.crossOrigin = "anonymous"; im.onload = function () { AVA = im; }; im.src = base() + "/ava/" + me.id + ".jpg"; }
  setTimeout(loadAva, 1500);
  function trk(n, p) {''', 'avaUrl')
    t = rep(t, "'<div class=\"fav\" style=\"background:' + pal[Math.abs(p.id) % pal.length] + '\">' + esc(letter) + '</div>' +".replace(chr(92), ''),
        "'<div class=\"fav\" style=\"background:' + pal[Math.abs(p.id) % pal.length] + '\">' + esc(letter) + '<img alt=\"\" src=\"' + esc(avaUrl(p)) + '\" onerror=\"this.remove()\"></div>' +".replace(chr(92), ''), 'favImg')
    t = rep(t, 'font-size:18px;color:#12131C;flex:none}",',
        'font-size:18px;color:#12131C;flex:none;position:relative;overflow:hidden}", ".fav img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover}",', 'favCss')
    t = rep(t, 'c.fillText(String(name).charAt(0).toUpperCase(), 200, 334);',
        'c.fillText(String(name).charAt(0).toUpperCase(), 200, 334);\n    if (AVA) { try { c.save(); c.beginPath(); c.arc(200, 330, 80, 0, Math.PI * 2); c.clip(); c.drawImage(AVA, 120, 250, 160, 160); c.restore(); } catch (e) {} }'.replace('\\n', chr(10)), 'cardAva')
    t = t.replace('Lingo Brain v3.6:', 'Lingo Brain v3.6/3.7:', 1)
    wr('v36.js', t)

# ---------------- index.html ----------------
h = rd('index.html')
h = h.replace('v3.js?v=11', 'v3.js?v=12').replace('v36.js?v=11', 'v36.js?v=12')
wr('index.html', h)

# ---------------- worker ----------------
w = rd('bot/worker.js')
if 'async function onAva' not in w:
    w = rep(w, 'function cors(status) {',
'''// GET /ava/<id>.jpg — фото профиля игрока из Telegram (через бота, токен наружу не уходит)
async function onAva(id, env) {
  const h = { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=43200" };
  if (!/^[0-9]{1,15}$/.test(id)) return new Response("bad id", { status: 400, headers: h });
  const row = await env.DB.prepare("SELECT id FROM players WHERE id = ?").bind(Number(id)).first();
  if (!row) return new Response("not found", { status: 404, headers: h });
  const ph = await tg(env, "getUserProfilePhotos", { user_id: Number(id), limit: 1 });
  const sizes = ph && ph.ok && ph.result && ph.result.photos && ph.result.photos[0];
  if (!sizes || !sizes.length) return new Response("no photo", { status: 404, headers: { ...h, "Cache-Control": "public, max-age=3600" } });
  const ps = sizes.filter(s => s.width >= 160)[0] || sizes[sizes.length - 1];
  const f = await tg(env, "getFile", { file_id: ps.file_id });
  if (!f || !f.ok || !f.result || !f.result.file_path) return new Response("no file", { status: 404, headers: h });
  const img = await fetch("https://api.telegram.org/file/bot" + token(env) + "/" + f.result.file_path);
  if (!img.ok) return new Response("fetch fail", { status: 502, headers: h });
  return new Response(await img.arrayBuffer(), { status: 200, headers: { ...h, "content-type": "image/jpeg" } });
}

function cors(status) {''', 'onAva')
    w = rep(w, '    if (url.pathname.startsWith("/card/") && request.method === "GET") {',
'''    if (url.pathname.startsWith("/ava/") && request.method === "GET") {
      try { return await onAva(url.pathname.slice(5).replace(".jpg", ""), env); } catch (e) { return new Response("err", { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }); }
    }
    if (url.pathname.startsWith("/card/") && request.method === "GET") {''', 'avaRoute')
    w = w.replace('lingo-app/?v=11', 'lingo-app/?v=12')
    wr('bot/worker.js', w)

# generate_audio.py: bump revision (push triggers the audio workflow)
g = rd('generate_audio.py')
if '# rev 3.7' not in g:
    wr('generate_audio.py', g.rstrip() + chr(10) + chr(10) + '# rev 3.7: full neural audio for all ready topics' + chr(10))
print('patched v3.7')
