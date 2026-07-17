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
 #home .panel{display:flex!important;flex-direction:column!important;gap:7px!important}
 #home .ledShell{order:1;display:flex!important;align-items:center;justify-content:center;height:42px!important;margin:0!important;overflow:hidden!important;background:#10283b!important;border:1px solid #365a78!important;border-radius:9px!important;box-shadow:none!important;padding:0 10px!important}
 #home #staticBusClock{position:static!important;transform:none!important;animation:none!important;transition:none!important;white-space:normal!important;width:100%!important;text-align:center!important;color:#fff!important;font-family:Arial,sans-serif!important;font-weight:800!important;font-size:16px!important;line-height:1.1!important;letter-spacing:.4px!important;text-transform:none!important;text-shadow:none!important;opacity:1!important;visibility:visible!important}
 #home .loggedInBox{order:2!important;display:grid!important;grid-template-columns:1fr auto!important;align-items:center!important;gap:8px!important;padding:7px 9px!important;margin:0!important;min-height:0!important;background:#10283b!important;border:1px solid #365a78!important;border-radius:9px!important;color:#d9e7f2!important;font-size:11px!important}
 #home .loggedInBox strong{display:block!important;color:#fff!important;font-size:14px!important;margin-top:1px!important}
 #home #changeInspectorBtn{width:auto!important;min-height:30px!important;margin:0!important;padding:5px 9px!important;border-radius:7px!important;font-size:10px!important;white-space:nowrap!important}
 #home .status{order:3!important;font-size:11px;padding:5px 7px;margin:0!important}
 body.display-phone #home .ledShell{height:38px!important;padding:0 7px!important}
 body.display-phone #home #staticBusClock{font-size:14px!important;letter-spacing:0!important}
 body.display-phone #home .loggedInBox{padding:6px 7px!important;gap:6px!important}
 body.display-phone #home .loggedInBox strong{font-size:12px!important}
 body.display-phone #home #changeInspectorBtn{font-size:9px!important;padding:5px 7px!important}
 body.display-plus #home .ledShell{height:40px!important;padding:0 8px!important}
 body.display-plus #home #staticBusClock{font-size:15px!important}
 body.display-ipad #home .ledShell{height:46px!important;padding:0 12px!important}
 body.display-ipad #home #staticBusClock{font-size:18px!important}
 body.display-ipad #home .loggedInBox{padding:8px 11px!important;font-size:12px!important}
 body.display-ipad #home .loggedInBox strong{font-size:15px!important}
 body.display-laptop #home .ledShell{height:50px!important;padding:0 14px!important}
 body.display-laptop #home #staticBusClock{font-size:20px!important}
 body.display-laptop #home .loggedInBox{padding:9px 12px!important;font-size:13px!important}
 body.display-laptop #home .loggedInBox strong{font-size:16px!important}
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
 const date=now.toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short'}).replace(/,/g,'');
 const text=time+' • '+date;
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