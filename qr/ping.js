/* Deskless card pages: tiny visit tracker. No cookies, no third-party script, nothing stored about the visitor
   beyond a visit counter in their own browser. Sends a push notification to Dan via ntfy.
   - Only runs on desklessconsulting.com (never on localhost, file://, or previews).
   - Dan's own devices: visit any card page once with ?me to switch tracking off for that browser (?me=0 turns it back on).
   - To send hits somewhere else later (your own collector), change ENDPOINT. Payload stays the same. */
(function(){
  var ENDPOINT="https://ntfy.sh/deskless-cards-ba9619dd7b165e61c2";
  var L=location,host=L.hostname,qs=new URLSearchParams(L.search),ls;
  try{ls=window.localStorage;ls.getItem("x")}catch(e){ls=null}
  if(qs.has("me")&&ls){qs.get("me")==="0"?ls.removeItem("dl_me"):ls.setItem("dl_me","1")}
  if(!/(^|\.)desklessconsulting\.com$/.test(host))return;
  if(ls&&ls.getItem("dl_me"))return;
  if(navigator.webdriver)return;
  var slug=(L.pathname.match(/\/qr\/([^\/]+)/)||[])[1]||"(index)";
  var n=1;if(ls){n=(parseInt(ls.getItem("dl_n_"+slug)||"0",10)||0)+1;ls.setItem("dl_n_"+slug,String(n))}
  var ua=navigator.userAgent,dev=/iPhone|iPad/.test(ua)?"iPhone/iPad":/Android/.test(ua)?"Android":/Mac/.test(ua)?"Mac":/Windows/.test(ua)?"Windows":/Linux/.test(ua)?"Linux":"other";
  var tz="";try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){}
  function send(title,body,tags,prio){
    var u=ENDPOINT+"?title="+encodeURIComponent(title)+"&tags="+encodeURIComponent(tags||"")+(prio?"&priority="+prio:"");
    try{if(navigator.sendBeacon&&navigator.sendBeacon(u,body))return}catch(e){}
    try{fetch(u,{method:"POST",body:body,keepalive:true,mode:"cors"})}catch(e){}
  }
  var t0=Date.now(),vis=0,lastVis=document.visibilityState==="visible"?t0:0,maxScroll=0,looks=[],clicks=[],announced=false;
  function seen(){return vis+(lastVis?Date.now()-lastVis:0)}
  function announce(){
    if(announced)return;announced=true;
    var ref=document.referrer?(" via "+document.referrer.replace(/^https?:\/\//,"").slice(0,60)):" (direct, likely the QR code)";
    send("Card page opened: "+slug,(n===1?"First visit":"Visit #"+n)+" on "+dev+ref+". "+(tz||"")+" "+new Date().toLocaleString(),n===1?"eyes,tada":"eyes",n===1?4:3);
  }
  // wait 4s of real visibility so link previews and bounces don't ping
  var timer=setInterval(function(){if(seen()>=4000){clearInterval(timer);announce()}},500);
  document.addEventListener("visibilitychange",function(){
    if(document.visibilityState==="visible"){lastVis=Date.now()}else{if(lastVis){vis+=Date.now()-lastVis;lastVis=0}summary()}
  });
  addEventListener("scroll",function(){var d=document.documentElement,p=Math.round(100*(scrollY+innerHeight)/Math.max(1,d.scrollHeight));if(p>maxScroll)maxScroll=Math.min(100,p)},{passive:true});
  document.addEventListener("click",function(ev){
    var el=ev.target.closest&&ev.target.closest("a,button");if(!el)return;
    if(el.dataset&&el.dataset.look!==undefined){var nm=el.textContent.trim();if(looks.indexOf(nm)<0)looks.push(nm);return}
    var h=el.getAttribute("href")||"",what=/^tel:/.test(h)?"tapped CALL":/^sms:/.test(h)?"tapped TEXT":/^mailto:/.test(h)?"tapped EMAIL":/cal\.com/.test(h)?"opened BOOKING":el.hasAttribute("download")?"saved CONTACT CARD":"";
    if(!what)return;clicks.push(what);announce();
    send(slug+": "+what,"On "+dev+", "+Math.round(seen()/1000)+"s into the visit.","telephone_receiver,fire",5);
  },true);
  var sent=false;
  function summary(){
    if(sent||!announced)return;var s=Math.round(seen()/1000);if(s<8)return;sent=true;
    send("Card page summary: "+slug,"Read for "+(s>=90?Math.round(s/60)+" min":s+"s")+", scrolled "+maxScroll+"%."+(looks.length?" Tried looks: "+looks.join(", ")+".":"")+(clicks.length?" Actions: "+clicks.join(", ")+".":" No buttons tapped."),"bar_chart",2);
  }
  addEventListener("pagehide",summary);
})();
