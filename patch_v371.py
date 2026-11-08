import re
P = '/data/lr34/'
def sub(path, old, new, cnt=1):
    s = open(P + path, encoding='utf-8').read()
    n = s.count(old)
    assert n == cnt, (path, old[:60], n)
    s = s.replace(old, new)
    open(P + path, 'w', encoding='utf-8').write(s)

# 1) mp3 always wins: the old v3.6 toggle could leave VS.neural=false in localStorage, and the toggle is now hidden
sub('v3.js', 'if (VS.neural !== false) { var u = url || audioFor(text, lang); if (u) { playUrl(u, text, lang, rate); return; } }',
    'var u = url || audioFor(text, lang); if (u) { playUrl(u, text, lang, rate); return; }')
sub('v3.js', 'try { VS = JSON.parse(localStorage.getItem(VSKEY) || "{}") || {}; } catch (e) { VS = {}; }',
    'try { VS = JSON.parse(localStorage.getItem(VSKEY) || "{}") || {}; } catch (e) { VS = {}; }\n  if (VS.neural === false) { delete VS.neural; try { localStorage.setItem(VSKEY, JSON.stringify(VS)); } catch (e) {} } // v3.7.1')
# 2) manifest: no stale cache, and a retry if Pages hasn't updated yet
sub('v3.js', '''  function loadAudioMap() {
    try {
      fetch("assets/audio/manifest.json?v=" + VER).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (!j || !j.items) return; var n = 0;''',
'''  function loadAudioMap(tries) {
    tries = tries || 0;
    try {
      fetch("assets/audio/manifest.json?v=" + VER + "." + Math.floor(Date.now() / 600000), { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (!j || !j.items) { if (tries < 2) setTimeout(function () { loadAudioMap(tries + 1); }, 4000); return; } var n = 0;''')
sub('v3.js', '      }).catch(function () {});\n    } catch (e) {}\n  }\n  function playUrl',
    '      }).catch(function () { if (tries < 2) setTimeout(function () { loadAudioMap(tries + 1); }, 4000); });\n    } catch (e) {}\n  }\n  function playUrl')
# 3) version bump
sub('v3.js', 'var VER = "12";', 'var VER = "13";')
s = open(P + 'index.html', encoding='utf-8').read(); assert s.count('?v=12') >= 2; open(P + 'index.html', 'w', encoding='utf-8').write(s.replace('?v=12', '?v=13'))
sub('bot/worker.js', 'lingo-app/?v=12', 'lingo-app/?v=13')
print('patched v3.7.1')
