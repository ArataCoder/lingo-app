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
        var hs=cfg.posthogHosts||[cfg.posthogHost||"https://eu.i.posthog.com"], pl={api_key:cfg.posthogKey,event:ev,distinct_id:id,properties:pp,timestamp:new Date().toISOString()};
        for(var h=0;h<hs.length&&h<2;h++) post(String(hs[h]).replace(/[/]+$/,"")+"/i/v0/e/",pl,"application/json");
      }
      if(cfg.statsUrl&&tg&&tg.initData){
        post(cfg.statsUrl,{initData:tg.initData,event:ev,track:props.track||null,topic:props.topic_id||null,xp:(typeof props.xp==="number")?Math.round(props.xp):null},"text/plain");
      }
    }catch(e){}
  }
  window.lbTrack=function(ev,props){ try{ if(!cfg){ if(q.length<30) q.push([ev,props]); return; } send(ev,props); }catch(e){} };
  window.lbTrackInit=function(c){ try{ if(cfg) return; cfg=c||{}; var x=q; q=[]; x.forEach(function(a){ send(a[0],a[1]); }); }catch(e){} };
})();
