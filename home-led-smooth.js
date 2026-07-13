(function(){
'use strict';
const el=id=>document.getElementById(id);
let clockTimer=null;
function style(){
 if(el('homeLedSmoothCss'))return;
 const s=document.createElement('style');
 s.id='homeLedSmoothCss';
 s.textContent=`
 #recentActivityBox,#compactHomeClock,#home #homeClock{display:none!important}
 #home .panel{display:flex!important;flex-direction:column!important;gap:9px!important}
 #home .ledShell{order:1;display:flex!important;align-items:center;justify-content:center;height:72px!important;margin:0!important;overflow:hidden!important;background:#050505!important;border:3px solid #2a2a2a!important;border-radius:10px!important;box-shadow:inset 0 0 18px rgba(255,132,0,.18),0 3px 10px rgba(0,0,0,.35)!important;padding:0 12px!important}
 #home #staticBusClock{position:static!important;transform:none!important;animation:none!important;transition:none!important;white-space:normal!important;width:100%!important;text-align:center!important;color:#ff8a00!important;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;font-weight:900!important;font-size:24px!important;line-height:1.15!important;letter-spacing:2px!important;text-transform:uppercase!important;text-shadow:0 0 3px #ff8a00,0 0 8px rgba(255,138,0,.65)!important;opacity:1!important;visibility:visible!important}
 #home .loggedInBox{order:2!important;display:grid!important;grid-template-columns:1fr auto!important;align-items:center!important;gap:10px!important;padding:9px 11px!important;margin:0!important;min-height:0!important;background:#10283b!important;border:1px solid #365a78!important;border-radius:10px!important;color:#d9e7f2!important;font-size:12px!important}
 #home .loggedInBox strong{display:block!important;color:#fff!important;font-size:15px!important;margin-top:2px!important}
 #home #changeInspectorBtn{width:auto!important;min-height:34px!important;margin:0!important;padding:7px 11px!important;border-radius:8px!important;font-size:11px!important;white-space:nowrap!important}
 #home .status{order:3!important;font-size:12px;padding:6px 8px;margin:0!important}
 body.display-phone #home .ledShell{height:62px!important;padding:0 8px!important}
 body.display-phone #home #staticBusClock{font-size:18px!important;letter-spacing:1px!important}
 body.display-phone #home .loggedInBox{padding:8px!important;gap:7px!important}
 body.display-phone #home .loggedInBox strong{font-size:13px!important}
 body.display-phone #home #changeInspectorBtn{font-size:10px!important;padding:6px 8px!important}
 body.display-plus #home .ledShell{height:68px!important;padding:0 10px!important}
 body.display-plus #home #staticBusClock{font-size:21px!important;letter-spacing:2px!important}
 body.display-ipad #home .ledShell{height:82px!important;padding:0 14px!important}
 body.display-ipad #home #staticBusClock{font-size:30px!important;letter-spacing:3px!important}
 body.display-ipad #home .loggedInBox{padding:11px 14px!important;font-size:14px!important}
 body.display-ipad #home .loggedInBox strong{font-size:18px!important}
 body.display-laptop #home .ledShell{height:90px!important;padding:0 18px!important}
 body.display-laptop #home #staticBusClock{font-size:36px!important;letter-spacing:4px!important}
 body.display-laptop #home .loggedInBox{padding:12px 16px!important;font-size:15px!important}
 body.display-laptop #home .loggedInBox strong{font-size:20px!important}
 `;
 document.head.appendChild(s);
}
function buildClock(){
 const shell=document.querySelector('#home .ledShell');
 if(!shell)return null;
 shell.innerHTML='<div id="staticBusClock" role="timer" aria-live="off"></div><div id="homeClock" class="ledBar" aria-hidden="true"></div>';
 return el('staticBusClock');
}
function updateClock(){
 const bar=el('staticBusClock');
 if(!bar)return;
 const now=new Date();
 const time=now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});
 const date=now.toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).replace(/,/g,'');
 const text=time+'  •  '+date;
 if(bar.textContent!==text)bar.textContent=text;
 bar.setAttribute('aria-label','Current time '+time+', '+date);
}
function restoreLoginPanel(){
 const box=document.querySelector('#home .loggedInBox');
 if(!box)return;
 const name=(typeof getInspector==='function'?getInspector():'')||'Not logged in';
 const label=el('loggedInInspector');
 if(label)label.textContent=name;
 const button=el('changeInspectorBtn');
 if(button){button.textContent='LOG OUT';button.onclick=()=>{if(typeof changeInspector==='function')changeInspector();else{try{localStorage.removeItem('activeInspector');}catch(e){}if(typeof showLogin==='function')showLogin();}};}
}
function disableOldFeed(){
 const loader=el('homeLedFeedV2Loader');if(loader)loader.remove();
 document.querySelectorAll('script[src*="home-led-feed"]').forEach(s=>s.remove());
}
function init(){
 style();disableOldFeed();buildClock();restoreLoginPanel();updateClock();
 if(clockTimer)clearInterval(clockTimer);
 clockTimer=setInterval(updateClock,1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();