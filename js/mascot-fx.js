/* Lingo Brain mascot motion (v6.1). Loaded after js/mascot.js.
   Every pose plays a short intro with one "living" detail and then stays still (no endless motion: it pulls
   attention away from the cards): start - wink sparkle, error - sweat drop slides down, win - shine runs over
   the trophy and the XP badge pops, tired - steam rises from the mug.
   Overlay anchors are % of the square pose image (assets/mascot/hd/*.webp, cut from the 2048px sources). */
(function () {
  "use strict";
  var CSS = [
    ".lbm .pic{position:relative}",
    ".lbm.win .pic{flex-basis:156px!important;width:156px!important;height:156px!important;max-height:none!important}",
    ".lbm.win:before,.lbm.win:after{top:78px!important}",
    ".lbm.lbfx .pic{animation:lbmPop .5s cubic-bezier(.34,1.56,.64,1) both!important}",
    ".lbm .bd{position:relative;z-index:1;width:100%;height:100%;transform-origin:50% 95%}",
    ".lbm.lbfx .pic img{animation:none!important;filter:drop-shadow(0 0 3px rgba(247,160,70,.7)) drop-shadow(0 0 10px rgba(247,160,70,.35))}",
    ".lbm.lbfx.err .pic img{filter:drop-shadow(0 0 3px rgba(247,118,142,.7)) drop-shadow(0 0 10px rgba(247,118,142,.3))}",
    ".lbm.lbfx.tired .pic img{filter:drop-shadow(0 0 3px rgba(157,124,216,.75)) drop-shadow(0 0 10px rgba(157,124,216,.35))}",
    ".lbm.lbfx.win .pic img{filter:drop-shadow(0 0 4px rgba(255,190,80,.85)) drop-shadow(0 0 14px rgba(255,170,60,.45))}",

    // aura: two soft pulses, then rests
    ".lbm.lbfx .pic:before{content:'';position:absolute;inset:-30%;border-radius:50%;z-index:0;pointer-events:none;opacity:.6;background:radial-gradient(circle,rgba(247,160,70,.45) 0%,rgba(247,160,70,.12) 42%,rgba(247,160,70,0) 70%);animation:lbAura 2.4s ease-in-out .3s 2}",
    ".lbm.lbfx.win .pic:before{background:radial-gradient(circle,rgba(255,196,90,.6) 0%,rgba(247,160,70,.2) 45%,rgba(247,160,70,0) 72%)}",
    ".lbm.lbfx.err .pic:before{background:radial-gradient(circle,rgba(247,118,142,.4) 0%,rgba(247,118,142,.12) 42%,rgba(247,118,142,0) 70%)}",
    ".lbm.lbfx.tired .pic:before{background:radial-gradient(circle,rgba(157,124,216,.5) 0%,rgba(157,124,216,.15) 42%,rgba(157,124,216,0) 70%)}",
    "@keyframes lbAura{0%,100%{opacity:.6;transform:scale(.94)}50%{opacity:1;transform:scale(1.06)}}",

    // body: one greeting gesture + a couple of gentle floats
    ".lbm.lbfx.st .bd{animation:lbHello .9s ease-in-out .55s 1,lbFloat 3s ease-in-out 1.5s 2}",
    ".lbm.lbfx.err .bd{animation:lbShy 1s ease-in-out .55s 1,lbFloat 3.4s ease-in-out 1.6s 1}",
    ".lbm.lbfx.win .bd{animation:lbHop 1s ease-in-out .5s 2,lbFloat 2.4s ease-in-out 2.5s 2}",
    ".lbm.lbfx.tired .bd{animation:lbBreath 4s ease-in-out .6s 2}",
    "@keyframes lbHello{0%,100%{transform:none}30%{transform:rotate(-5deg)}60%{transform:rotate(4deg)}85%{transform:rotate(-1deg)}}",
    "@keyframes lbShy{0%,100%{transform:none}25%{transform:translateX(-3%) rotate(-3deg)}55%{transform:translateX(2%) rotate(2deg)}80%{transform:rotate(-1deg)}}",
    "@keyframes lbHop{0%,100%{transform:none}25%{transform:translateY(2%) scale(1.05,.95)}55%{transform:translateY(-9%) scale(.96,1.04)}80%{transform:translateY(0) scale(1.03,.97)}}",
    "@keyframes lbFloat{0%,100%{transform:none}50%{transform:translateY(-3%) rotate(-1deg)}}",
    "@keyframes lbBreath{0%,100%{transform:none}50%{transform:translateY(1.5%) scale(1.02,.985) rotate(-1.5deg)}}",

    ".lbm .lbx{position:absolute;z-index:2;display:block;font-style:normal;line-height:1;pointer-events:none;opacity:0}",
    // start: sparkle at the winking eye
    ".lbm .wk{left:60%;top:24%;color:#FFD27A;text-shadow:0 0 6px rgba(255,190,80,.9);animation:lbWink 1.1s ease-out 1s 2}",
    "@keyframes lbWink{0%{opacity:0;transform:scale(.2) rotate(0)}35%{opacity:1;transform:scale(1.15) rotate(70deg)}100%{opacity:0;transform:scale(.4) rotate(140deg)}}",
    // error: a sweat drop slides down from the painted one
    ".lbm .drop{left:60.2%;top:21.5%;width:4.4%;height:4.4%;border-radius:0 50% 50% 50%;background:linear-gradient(135deg,#E3F6FF,#5CC8F5);box-shadow:0 0 3px rgba(92,200,245,.8);transform:rotate(45deg);animation:lbDrip 1.8s ease-in .8s 2}",
    "@keyframes lbDrip{0%{opacity:0;transform:translateY(0) rotate(45deg)}15%{opacity:1}75%{opacity:1;transform:translateY(240%) rotate(45deg)}100%{opacity:0;transform:translateY(300%) rotate(45deg)}}",
    // tired: steam from the mug
    ".lbm .stm{top:44%;width:9%;height:18%;border-radius:50%;background:radial-gradient(ellipse at 50% 60%,rgba(255,255,255,.95),rgba(255,255,255,.35) 45%,rgba(255,255,255,0) 72%);animation:lbSteam 2.6s ease-out 3}",
    "@keyframes lbSteam{0%{opacity:0;transform:translate(0,0) scale(.5,.7)}25%{opacity:.95}55%{transform:translate(25%,-70%) scale(.9,1.2)}100%{opacity:0;transform:translate(-35%,-150%) scale(1.2,1.5)}}",
    // win: the trophy flashes with a running glint, the XP badge pops. Both are clipped copies of the pose
    // drawn exactly over the original; no filter with spread on them, it would show the clip rectangle.
    ".lbm .tro,.lbm .xp{inset:0;opacity:1;background-size:100% 100%}",
    ".lbm .tro{clip-path:inset(28% 67% 52% 2%);transform-origin:18% 40%;animation:lbTro 1.2s ease-in-out .9s 3}",
    "@keyframes lbTro{0%,100%{transform:none;filter:none}45%{transform:scale(1.04);filter:brightness(1.4) saturate(1.2)}}",
    ".lbm .gl{left:6%;top:30%;color:#FFF6D8;text-shadow:0 0 6px #FFD27A,0 0 12px rgba(255,190,80,.9);animation:lbGlint 1.2s ease-in-out .9s 3}",
    "@keyframes lbGlint{0%{opacity:0;transform:translate(0,0) scale(.3)}40%{opacity:1;transform:translate(120%,40%) scale(1)}100%{opacity:0;transform:translate(240%,90%) scale(.4) rotate(90deg)}}",
    ".lbm .xp{clip-path:inset(40% 3% 45.5% 79%);transform-origin:88% 47%;animation:lbXp .7s ease-in-out 1.3s 3}",
    "@keyframes lbXp{0%,100%{transform:none;filter:none}40%{transform:scale(1.12) rotate(-3deg);filter:brightness(1.35)}70%{transform:scale(.98)}}",
    ".lbm .spk{color:#F7A046;text-shadow:0 0 6px rgba(247,160,70,.8);animation:lbTw 1.8s ease-in-out 3}",
    ".lbm .spk.p{color:#9D7CD8;text-shadow:0 0 6px rgba(157,124,216,.8)}",
    "@keyframes lbTw{0%,100%{opacity:0;transform:scale(.3) rotate(0)}50%{opacity:1;transform:scale(1) rotate(90deg)}}",

    "@media (prefers-reduced-motion:reduce){.lbm.lbfx .bd,.lbm.lbfx .pic:before{animation:none!important}.lbm .lbx{display:none!important}}"
  ].join("\n");
  var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);

  // win sparkles: [left %, top %, delay s, font px, purple]
  var SP = [[-8, 16, 0, 16, 0], [90, 6, 0.45, 12, 1], [-12, 60, 0.9, 11, 1], [94, 56, 1.25, 15, 0], [44, -10, 0.65, 10, 0]];
  function el(cls, txt, css) { var i = document.createElement("i"); i.className = "lbx " + cls; i.textContent = txt || ""; i.setAttribute("aria-hidden", "true"); if (css) i.style.cssText = css; return i; }

  function fx(w) {
    if (w.__fx) return;
    var pose = w.getAttribute("data-pose"), pic = w.querySelector(".pic"), img = pic && pic.querySelector("img");
    if (!pose || !pic) return;
    w.__fx = 1; w.classList.add("lbfx");
    if (!img) return;
    // Overlays share a wrapper with the image so they move together with the body.
    var bd = document.createElement("div"); bd.className = "bd";
    pic.insertBefore(bd, img); bd.appendChild(img);
    var size = pic.getBoundingClientRect().width || 72;
    if (pose === "start") bd.appendChild(el("wk", "\u2726", "font-size:" + Math.max(10, Math.round(size * 0.2)) + "px"));
    if (pose === "error") bd.appendChild(el("drop"));
    if (pose === "tired") [[0.6, 31], [1.4, 37], [2.2, 43]].forEach(function (s) { bd.appendChild(el("stm", "", "left:" + s[1] + "%;animation-delay:" + s[0] + "s")); });
    if (pose === "win") {
      SP.forEach(function (s) { pic.appendChild(el("spk" + (s[4] ? " p" : ""), "\u2726", "left:" + s[0] + "%;top:" + s[1] + "%;font-size:" + s[3] + "px;animation-delay:" + s[2] + "s")); });
      var tro = el("tro"), xp = el("xp");
      bd.appendChild(tro); bd.appendChild(xp);
      bd.appendChild(el("gl", "\u2726", "font-size:" + Math.max(10, Math.round(size * 0.1)) + "px"));
      var bind = function () { var u = 'url("' + (img.currentSrc || img.src) + '")'; tro.style.backgroundImage = u; xp.style.backgroundImage = u; };
      bind(); img.addEventListener("load", bind);
    }
  }
  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.classList && root.classList.contains("lbm")) fx(root);
    [].forEach.call(root.querySelectorAll(".lbm[data-pose]"), fx);
  }
  new MutationObserver(function (ms) { ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) scan(n); }); }); }).observe(document.body, { childList: true, subtree: true });
  scan(document.body);
  window.__v53 = { fx: fx, scan: scan };
})();
