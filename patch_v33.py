import io, json
NL = chr(10)
R = "/data/lingo_release/"
def rd(p): return io.open(R + p, encoding="utf-8").read()
def wr(p, s): io.open(R + p, "w", encoding="utf-8").write(s)
def rep(s, a, b, n=1):
    c = s.count(a)
    assert c == n, (a[:70], c)
    return s.replace(a, b)

# ---------- index.html ----------
h = rd("index.html")
AN = '''<script>
/* Lingo analytics v3.3: PostHog (optional) + own stats endpoint. Never throws, never blocks UI. */
(function(){
  var cfg=null, q=[], sent=0, tg=(window.Telegram&&window.Telegram.WebApp)||null;
  function sid(){ try{ var k="lingo_aid", v=localStorage.getItem(k); if(!v){ v="a"+Date.now().toString(36)+Math.random().toString(36).slice(2,10); localStorage.setItem(k,v);} return v; }catch(e){ return "anon"; } }
  function post(url, body, type){
    try{
      if(navigator.onLine===false||sent>=300) return; sent++;
      var ctl=("AbortController" in window)?new AbortController():null;
      var tm=ctl?setTimeout(function(){ try{ctl.abort();}catch(e){} },4000):0;
      var p=fetch(url,{method:"POST",headers:{"Content-Type":type},body:JSON.stringify(body),keepalive:true,credentials:"omit",mode:"cors",signal:ctl?ctl.signal:undefined});
      if(p&&p.then) p.then(function(){clearTimeout(tm);},function(){clearTimeout(tm);});
    }catch(e){}
  }
  function send(ev, props){
    try{
      props=props||{}; var id=sid();
      var base={app_version:"3.3", tg_platform:(tg&&tg.platform)||"web", tg_version:(tg&&tg.version)||""};
      for(var k in props) base[k]=props[k];
      if(cfg.posthogKey){
        var pp={distinct_id:id, $process_person_profile:false, $lib:"lingo-mini-app"}; for(var j in base) pp[j]=base[j];
        post(String(cfg.posthogHost||"https://eu.i.posthog.com").replace(/[/]+$/,"")+"/i/v0/e/",{api_key:cfg.posthogKey,event:ev,distinct_id:id,properties:pp,timestamp:new Date().toISOString()},"application/json");
      }
      if(cfg.statsUrl&&tg&&tg.initData){
        post(cfg.statsUrl,{initData:tg.initData,event:ev,track:props.track||null,topic:props.topic_id||null,xp:(typeof props.xp==="number")?Math.round(props.xp):null},"text/plain");
      }
    }catch(e){}
  }
  window.lbTrack=function(ev,props){ try{ if(!cfg){ if(q.length<30) q.push([ev,props]); return; } send(ev,props); }catch(e){} };
  window.lbTrackInit=function(c){ try{ if(cfg) return; cfg=c||{}; var x=q; q=[]; x.forEach(function(a){ send(a[0],a[1]); }); }catch(e){} };
})();
</script>
<script src="v3.js?v=7"></script>'''
h = rep(h, '<script src="v3.js?v=6"></script>', AN)
A = "function complete(score, n, xp) {" + NL + "  xp += 20;"
h = rep(h, A, A + NL + '  try { if (window.lbTrack) window.lbTrack("round_completed", { xp: xp, score: score, cards: n, passed: score / Math.max(1, n) >= 0.6, track: LAST.lang, topic_id: LAST.topic }); } catch (e) {}')
wr("index.html", h)

# ---------- v3.js ----------
v = rd("v3.js")
v = rep(v, 'var VER = "6";', 'var VER = "7";')
HELP = '''  // v3.3: разблокировка внутри блока (первая тема каждого блока открыта)
  function blockOrder(id) {
    var out = []; if (!V.cat) return out;
    V.cat.tracks.forEach(function (t) { t.blocks.forEach(function (b) {
      if (b.topics.some(function (tp) { return tp.id === id; })) b.topics.forEach(function (tp) { if (tp.status === "ready" && V.topics[tp.id]) out.push(tp); });
    }); });
    return out;
  }
  function trk(ev, p) { try { if (window.lbTrack) window.lbTrack(ev, p || {}); } catch (e) {} }
'''
v = rep(v, "  function arr(k) {", HELP + "  function arr(k) {")
v = rep(v, "readyOrder(trackOf(id))", "blockOrder(id)", 3)
v = rep(v, "if (i < 0) return false; if (i === 0) return true;", "if (i < 0) return false; if (i === 0) return true;" + NL + "    if (V.cfg && V.cfg.unlock && (V.cfg.unlock.alwaysOpen || []).indexOf(id) >= 0) return true;")
A = "V.track = t.track; setTrack(t.track); LAST = { lang: t.track, topic: id };"
v = rep(v, A, A + ' trk("topic_selected", { topic_id: id, track: t.track, level: t.level || null });')
A = 'V.lastRun = { key: "low", fn: lowEnergy };'
v = rep(v, A, A + ' trk("energy_mode_used", { track: LAST.lang, cards: cards.length });')
A = "  renderHome();" + NL + "  twStart();"
v = rep(v, A, A + NL + '  trk("app_opened", { start_param: (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.start_param) || null });')
A = "  loadAll().then(function () {" + NL + "    var n = 0;"
v = rep(v, A, "  loadAll().then(function () {" + NL + "    try { if (window.lbTrackInit) window.lbTrackInit((V.cfg && V.cfg.analytics) || {}); } catch (e) {}" + NL + "    var n = 0;")
wr("v3.js", v)

# ---------- config.json ----------
c = json.loads(rd("content/config.json"))
c["analytics"] = {"posthogKey": "", "posthogHost": "https://eu.i.posthog.com", "statsUrl": "https://lingo-brain-bot.lingobrain.workers.dev/api/event"}
c["unlock"] = {"alwaysOpen": ["es.life.nie", "en.interview.salary"]}
wr("content/config.json", json.dumps(c, ensure_ascii=False, indent=2))
print("patched v3.3")
