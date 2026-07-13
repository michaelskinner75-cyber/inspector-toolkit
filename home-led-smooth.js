(function(){
'use strict';
const el=id=>document.getElementById(id);
let clockTimer=null;
function style(){
 if(el('homeLedSmoothCss'))return;
 const s=document.createElement('style');
 s.id='homeLedSmoothCss';
 s.textContent=`
 #recentActivityBox,#compactHomeClock,#home .loggedInBox{display:none!important}
 #home .ledShell{display:flex!important;align-items:center;justify-content:center;height:72px!important;margin-top:8px!important;overflow:hidden!important;background:#050505!important;border:3px solid #2a2a2a!important;border-radius:10px!important;box-shadow:inset 0 0 18px rgba(255,132,0,.18),0 3px 10px rgba(0,0,0,.35)!important;padding:0 12px!important}
 #home .ledBar,#home #homeClock{position:static!important;left:auto!important;right:auto!important;top:auto!important;transform:none!important;animation:none!important;transition:none!important;white-space:normal!important;width:100%!important;text-align:center!important;color:#ff8a00!important;font-family:monospace!important;font-weight:900!important;font-size:24px!important;line-height:1.15!important;letter-spacing:2px!important;text-transform:uppercase!important;text-shadow:0 0 3px #ff8a00,0 0 8px rgba(255,138,0,.65)!important;opacity:1!important;visibility:visible!important}
 #home .status{font-size:12px;padding:6px 8px;margin-top:6px}
 body.display-phone #home .ledShell{height:62px!important;padding:0 8px!important}
 body.display-phone #home .ledBar,body.display-phone #home #homeClock{font-size:18px!important;letter-spacing:1px!important}
 body.display-plus #home .ledShell{height:68px!important;padding:0 10px!important}
 body.display-plus #home .ledBar,body.display-plus #home #homeClock{font-size:21px!important;letter-spacing:2px!important}
 body.display-ipad #home .ledShell{height:82px!important;padding:0 14px!important}
 body.display-ipad #home .ledBar,body.display-ipad #home #homeClock{font-size:30px!important;letter-spacing:3px!important}
 body.display-laptop #home .ledShell{height:90px!important;padding:0 18px!important}
 body.display-laptop #home .ledBar,body.display-laptop #home #homeClock{font-size:36px!important;letter-spacing:4px!important}
 `;
 document.head.appendChild(s);
}
function replaceClockNode(){
 const old=el('homeClock');
 if(!old)return null;
 const fresh=old.cloneNode(false);
 fresh.id='homeClock';
 fresh.className=old.className;
 fresh.removeAttribute('style');
 fresh.removeAttribute('aria-live');
 old.replaceWith(fresh);
 return fresh;
}
function updateClock(){
 const bar=el('homeClock');
 if(!bar)return;
 const now=new Date();
 const time=now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});
 const date=now.toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).replace(/,/g,'');
 const text=time+'  •  '+date;
 if(bar.textContent!==text)bar.textContent=text;
 bar.setAttribute('aria-label','Current time '+time+', '+date);
}
function disableOldFeed(){
 const loader=el('homeLedFeedV2Loader');
 if(loader)loader.remove();
 document.querySelectorAll('script[src*="home-led-feed"]').forEach(s=>s.remove());
}
function init(){
 style();
 disableOldFeed();
 replaceClockNode();
 updateClock();
 if(clockTimer)clearInterval(clockTimer);
 clockTimer=setInterval(updateClock,1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();