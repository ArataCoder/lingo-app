/* Lingo Brain v5.7: frame-by-frame mascot animation. Loaded after js/mascot.js (v52).
   Frames (webp 256x256, aligned per pose) live on GitHub Pages:
   https://aratacoder.github.io/lingo-app/assets/mascot/f/{start1..3,error1..3,win1..3,tired1..4}.webp
   If frames are missing, nothing changes (v52 still shows the static pose + CSS animation).
   Loaded from index.html after js/mascot.js. */
(function () {
  "use strict";
  var BASE = "https://aratacoder.github.io/lingo-app/assets/mascot/f/", FV = "1";
  var FR = {
    start: ["start1", "start2", "start3"],
    error: ["error1", "error2", "error3"],
    win: ["win1", "win2", "win3"],
    tired: ["tired1", "tired2", "tired3", "tired4"]
  };
  // intro: [frameIndex, ms] once; then idle: short variant frame every gap ms; stops after 30s
  var SEQ = {
    start: { intro: [[0, 700], [2, 160], [0, 140], [2, 160], [0, 1200], [1, 150]], base: 0, idle: [1, 150], gap: [3000, 6000] },
    error: { intro: [[0, 650]], base: 1, idle: [2, 170], gap: [2500, 4500] },
    win: { intro: [[0, 500], [1, 260], [2, 260], [1, 260], [2, 260], [1, 260], [2, 260]], base: 1, idle: [2, 260], gap: [1800, 3200] },
    tired: { intro: [[0, 1200], [1, 1600], [0, 700], [2, 450], [3, 450], [2, 450], [3, 450]], base: 0, idle: [1, 1300], gap: [4000, 7000] }
  };
  var RM = false; try { RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  var ready = {}, keep = [];
  function url(n) { return BASE + n + ".webp?v=" + FV; }
  function rnd(g) { return g[0] + Math.random() * (g[1] - g[0]); }
  function preload() {
    Object.keys(FR).forEach(function (p) {
      var left = FR[p].length, bad = false;
      FR[p].forEach(function (n) {
        var i = new Image(); keep.push(i);
        i.onload = function () { if (--left === 0 && !bad) { ready[p] = true; scan(document.body); } };
        i.onerror = function () { bad = true; };
        i.decoding = "async"; i.src = url(n);
      });
    });
  }
  function run(w) {
    if (w.__lbf) return;
    var pose = w.getAttribute("data-pose"), s = SEQ[pose];
    if (!s || !ready[pose]) return;
    var img = w.querySelector(".pic img"); if (!img) return;
    w.__lbf = 1;
    var fr = FR[pose], t0 = Date.now();
    function set(i) { var u = url(fr[i]); if (img.src !== u) img.src = u; }
    function alive() { return img.isConnected && Date.now() - t0 < 30000; }
    set(0);
    if (RM) { set(s.base); return; }
    var k = 0;
    function idle() {
      if (!alive()) { if (img.isConnected) set(s.base); return; }
      setTimeout(function () {
        if (!alive()) return;
        set(s.idle[0]);
        setTimeout(function () { if (img.isConnected) set(s.base); idle(); }, s.idle[1]);
      }, rnd(s.gap));
    }
    function step() {
      if (!alive()) { if (img.isConnected) set(s.base); return; }
      if (k < s.intro.length) { var f = s.intro[k++]; set(f[0]); setTimeout(step, f[1]); return; }
      set(s.base); idle();
    }
    step();
  }
  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.classList && root.classList.contains("lbm")) run(root);
    [].forEach.call(root.querySelectorAll(".lbm[data-pose]"), run);
  }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) scan(n); }); });
  }).observe(document.body, { childList: true, subtree: true });
  if (document.readyState === "complete") setTimeout(preload, 300);
  else window.addEventListener("load", function () { setTimeout(preload, 300); });
  window.__v53 = { ready: ready, scan: scan };
})();
