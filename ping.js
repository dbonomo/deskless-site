/* desklessconsulting.com — conversion tracking. No cookies, no third-party script, nothing about the
   visitor leaves their browser except what's below. Pageview VOLUME is handled by the privacy-first
   analytics tag in <head>; this file exists for the thing a dashboard can't do — telling Dan the
   moment somebody actually reaches out, and where they came from.

   Deliberately quiet: no ping on an ordinary pageview. Only (1) a contact click, and (2) one
   "serious read" signal per session. The phone should mean something when it buzzes.

   Dan's own devices: load any page once with ?me to mute this browser (?me=0 to unmute). */
(function(){
  var ENDPOINT="https://ntfy.sh/deskless-cards-ba9619dd7b165e61c2";
  var L=location,qs=new URLSearchParams(L.search),ls;
  try{ls=window.localStorage;ls.getItem("x")}catch(e){ls=null}
  if(qs.has("me")&&ls){qs.get("me")==="0"?ls.removeItem("dl_me"):ls.setItem("dl_me","1")}
  if(!/(^|\.)desklessconsulting\.com$/.test(L.hostname))return;   // never on localhost or previews
  if(ls&&ls.getItem("dl_me"))return;
  if(navigator.webdriver)return;

  /* ---- first-touch attribution -------------------------------------------------
     Store where someone FIRST arrived from and keep it. If they come back a week
     later via Google and then text, the credit still belongs to the video that
     brought them. Last-touch would quietly hand every conversion to "direct". */
  var src=qs.get("utm_source"),med=qs.get("utm_medium"),camp=qs.get("utm_campaign");
  var first=null;
  if(ls){
    try{first=JSON.parse(ls.getItem("dl_first")||"null")}catch(e){}
    if(!first){
      first={s:src||null,m:med||null,c:camp||null,
             r:document.referrer?document.referrer.replace(/^https?:\/\//,"").slice(0,70):null,
             d:new Date().toISOString().slice(0,10)};
      ls.setItem("dl_first",JSON.stringify(first));
    }
  }
  function origin(){
    if(src)return src+(med?" / "+med:"")+(camp?" ("+camp+")":"");          // this visit, tagged
    if(first&&first.s)return first.s+(first.m?" / "+first.m:"")+(first.c?" ("+first.c+")":"")+" [first touch "+first.d+"]";
    if(document.referrer)return document.referrer.replace(/^https?:\/\//,"").slice(0,70);
    if(first&&first.r)return first.r+" [first touch "+first.d+"]";
    return "direct / unknown";
  }

  var ua=navigator.userAgent;
  var dev=/iPhone|iPad/.test(ua)?"iPhone/iPad":/Android/.test(ua)?"Android":/Mac/.test(ua)?"Mac":/Windows/.test(ua)?"Windows":/Linux/.test(ua)?"Linux":"other";
  function send(title,body,tags,prio){
    var u=ENDPOINT+"?title="+encodeURIComponent(title)+"&tags="+encodeURIComponent(tags||"")+(prio?"&priority="+prio:"");
    try{if(navigator.sendBeacon&&navigator.sendBeacon(u,body))return}catch(e){}
    try{fetch(u,{method:"POST",body:body,keepalive:true,mode:"cors"})}catch(e){}
  }


  /* ---- aggregate sink ----------------------------------------------------------
     ntfy is real-time but keeps no history, so every event is ALSO emitted to the
     pageview tool as a custom event. Feature-detected, so this is a no-op until a
     tag is installed and it never breaks if one is removed. */
  function record(name,props){
    try{ if(window.plausible) window.plausible(name,{props:props}) }catch(e){}
    try{ if(window.umami) window.umami.track(name,props) }catch(e){}
    try{ if(window.gtag) window.gtag("event",name.toLowerCase().replace(/\\s+/g,"_"),props) }catch(e){}
  }

  var t0=Date.now(),vis=0,lastVis=document.visibilityState==="visible"?t0:0,maxScroll=0,warmed=false;
  function seen(){return vis+(lastVis?Date.now()-lastVis:0)}

  /* ---- 1. the money event: somebody reached out ---- */
  document.addEventListener("click",function(ev){
    var el=ev.target.closest&&ev.target.closest("a");if(!el)return;
    var h=el.getAttribute("href")||"";
    var what=/^sms:/.test(h)?"TEXT":/^tel:/.test(h)?"CALL":/^mailto:/.test(h)?"EMAIL":el.hasAttribute("download")?"saved CONTACT CARD":"";
    if(!what)return;
    var subj=(h.match(/subject=([^&]*)/)||[])[1];
    try{subj=subj?decodeURIComponent(subj):""}catch(e){subj=""}
    send("Someone is contacting you — "+what+(subj?": "+subj:""),
         "From "+origin()+". On "+dev+", "+Math.round(seen()/1000)+"s into the visit, "+maxScroll+"% down the page. "+new Date().toLocaleString(),
         "fire,telephone_receiver",5);
    record("Contact",{method:what,offer:subj||"(none)",source:origin(),device:dev});
  },true);

  /* ---- 2. one warm signal per session: read the offers properly ---- */
  addEventListener("scroll",function(){
    var d=document.documentElement;
    var p=Math.round(100*(scrollY+innerHeight)/Math.max(1,d.scrollHeight));
    if(p>maxScroll)maxScroll=Math.min(100,p);
    if(!warmed&&maxScroll>=55&&seen()>=45000){
      warmed=true;
      send("Someone is reading properly","From "+origin()+". "+maxScroll+"% down, "+Math.round(seen()/1000)+"s so far, on "+dev+". No contact click yet.","eyes",2);
      record("Serious read",{source:origin(),device:dev});
    }
  },{passive:true});

  document.addEventListener("visibilitychange",function(){
    if(document.visibilityState==="visible"){lastVis=Date.now()}
    else if(lastVis){vis+=Date.now()-lastVis;lastVis=0}
  });
})();
