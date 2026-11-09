/* Lingo Brain core: extension points and error reporting. Loaded first.
   Modules extend base screens through hooks instead of wrapping window.show / goBack / renderHome:
     LB.on("show", fn(name))   after a screen is shown (modules run in load order)
     LB.on("home", fn())       after the home screen is rendered
     LB.on("track", fn(lang))  after a track's topic list is opened
     LB.handle("back", fn)     back navigation; newest handler first, return true when handled
     LB.handle("share", fn)    "share result" button; same rules as back
   LB.report(err, where) logs an error and sends a throttled js_error event. */
(function () {
  var hooks = {}, handlers = {}, seen = {}, sent = 0;

  function report(err, where) {
    try {
      var msg = String((err && err.message) || err || "unknown").slice(0, 200);
      where = String(where || "global").slice(0, 60);
      if (window.console && console.error) console.error("[LB] " + where + ":", err);
      // Cross-origin scripts (Telegram SDK, fonts) only expose this opaque message.
      if (msg === "Script error." || seen[where + "|" + msg] || sent >= 10) return;
      seen[where + "|" + msg] = 1; sent++;
      if (window.lbTrack) window.lbTrack("js_error", { where: where, message: msg });
    } catch (e) {}
  }

  function on(evt, fn) { (hooks[evt] = hooks[evt] || []).push(fn); }
  function emit(evt, arg) {
    var list = (hooks[evt] || []).slice();
    for (var i = 0; i < list.length; i++) { try { list[i](arg); } catch (e) { report(e, "hook:" + evt); } }
  }

  function handle(action, fn) { (handlers[action] = handlers[action] || []).unshift(fn); }
  function run(action, fallback) {
    var list = (handlers[action] || []).slice();
    for (var i = 0; i < list.length; i++) {
      try { if (list[i]()) return; } catch (e) { report(e, "handle:" + action); }
    }
    if (fallback) fallback();
  }

  window.addEventListener("error", function (e) { report(e.error || e.message, "window"); });
  window.addEventListener("unhandledrejection", function (e) { report(e.reason, "promise"); });

  window.LB = { on: on, emit: emit, handle: handle, run: run, report: report };
})();
