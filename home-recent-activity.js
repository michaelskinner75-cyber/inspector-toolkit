(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v||'').trim();
function rows(sheet){try{return typeof cloud!=='undefined'&&cloud&&Array.isArray(cloud[sheet])?cloud[sheet].slice():[];}catch(e){return[];}}
function stripHeader(data){if(!data.length)return data;const first=(data[0]||[]).map(v=>String(v||'').toLowerCase());return first.some(v=>['date','time','inspector','driver','fleet','service','depot','location'].includes(v))?data.slice(1):data;}
function stamp(date,time){const d=new Date(String(date||'')+(time?' '+String(time):''));return Number.isNaN(d.getTime())?0:d.getTime();}
function activity(){
 const out=[];
 stripHeader(rows('Inspections')).forEach(r=>{const action=clean(r[13]);let label='Inspector Check';let cls='check';if(/advis/i.test(action)){label='Driver Advised';cls='advised';}else if(/report|offence/i.test(action)&&!/no driver report/i.test(action)){label='Driver Reported';cls='reported';}out.push({date:r[0],time:r[1],label,cls,driver:r[4],detail:[r[5]&&'Service '+r[5],r[6]&&'Fleet '+r[6],r[8]].filter(Boolean).join(' • '),note:r[14]||action,ts:stamp(r[0],r[1])});});
 stripHeader(rows('Early Running')).forEach(r=>{const mins=Number(r[10]);out.push({date:r[0],time:r[1],label:mins<0?'Early Running':'Timing Check',cls:mins<0?'early':'timing',driver:r[7],detail:[r[4]&&'Service '+r[4],r[6]&&'Fleet '+r[6],r[3]].filter(Boolean).join(' • '),note:r[11]||'',ts:stamp(r[0],r[1])});});
 stripHeader(rows('NSA Faults')).forEach(r=>{if(!(r[7]==='No'||(r[8]&&r[8]!=='Fully Working'&&r[8]!=='N/A')))return;out.push({date:r[0],time:r[1],label:'NSA Fault',cls:'nsa',driver:r[6],detail:[r[5]&&'Service '+r[5],r[4]&&'Fleet '+r[4],r[3]].filter(Boolean).join(' • '),note:r[8]||r[9]||'',ts:stamp(r[0],r[1])});});
 return out.sort((a,b)=>b.ts-a.ts).slice(0,20);
}
function addStyles(){if($('homeRecentCss'))return;const s=document.createElement('style');s.id='homeRecentCss';s.textContent=`
#home .compactHomeTop{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;background:#081823;border-left:6px solid #eea83e;border-radius:10px;padding:9px 11px;margin-bottom:8px}
#home .compactUser{font-size:13px;color:#b8c5ce}#home .compactUser strong{display:block;color:#eea83e;font-size:18px;margin-top:2px}
#home #changeInspectorBtn{padding:8px 14px;font-size:12px;min-height:38px;width:auto;margin:0}
#home .compactClock{display:flex;gap:12px;align-items:center;justify-content:center;background:#050b12;border:2px solid #3674ba;border-radius:9px;padding:8px 12px;font-family:'Courier New',monospace;color:#eea83e;font-weight:900;margin:7px 0}
#home .compactClockTime{font-size:21px}#home .compactClockDate{font-size:13px;color:#f4f3ee}
#home .ledShell{display:none!important}#home .status{font-size:12px;padding:6px 8px;margin-top:6px}
#recentActivityBox{background:#081823;border:1px solid #36586f;border-radius:11px;padding:10px;margin:10px 0 12px;overflow:hidden}
#recentActivityTitle{display:flex;justify-content:space-between;align-items:center;font-weight:900;margin-bottom:8px}#recentActivityTitle span{font-size:12px;color:#b8c5ce;font-weight:400}
#recentActivityScroll{display:flex;gap:9px;overflow-x:auto;scroll-snap-type:x proximity;padding-bottom:5px;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
.recentActivityCard{flex:0 0 260px;scroll-snap-align:start;background:#0d2233;border-left:6px solid #459679;border-radius:9px;padding:10px;min-height:104px}
.recentActivityCard.reported{border-left-color:#c83f49}.recentActivityCard.advised{border-left-color:#eea83e}.recentActivityCard.early{border-left-color:#d6a92f}.recentActivityCard.nsa{border-left-color:#3674ba}
.recentActivityCard .raType{font-size:13px;font-weight:900}.recentActivityCard .raDriver{font-size:16px;font-weight:900;margin:5px 0}.recentActivityCard .raMeta{font-size:12px;color:#b8c5ce}.recentActivityCard .raNote{font-size:12px;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body.display-phone #home .compactHomeTop{grid-template-columns:1fr}body.display-phone #home #changeInspectorBtn{width:100%}body.display-phone #home .compactClock{justify-content:space-between}.display-phone .recentActivityCard{flex-basis:220px}
body.display-laptop #recentActivityBox{margin-top:14px}.display-laptop .recentActivityCard{flex-basis:300px}
`;document.head.appendChild(s);}
function build(){const home=$('home');if(!home)return;const panel=home.querySelector(':scope > .panel');const nav=home.querySelector(':scope > .nav');if(!panel||!nav)return;
 const old=panel.querySelector('.loggedInBox');if(old&&!panel.querySelector('.compactHomeTop')){old.classList.add('compactHomeTop');old.innerHTML='<div class="compactUser">Logged in as<strong id="loggedInInspector">'+esc((typeof getInspector==='function'?getInspector():localStorage.getItem('activeInspector'))||'Not logged in')+'</strong></div><button class="btn changeInspectorBtn" id="changeInspectorBtn">LOG OUT</button>';}
 if(!$('compactHomeClock')){const c=document.createElement('div');c.id='compactHomeClock';c.className='compactClock';c.innerHTML='<div class="compactClockDate" id="compactClockDate"></div><div class="compactClockTime" id="compactClockTime"></div>';const status=$('syncStatus');if(status)status.insertAdjacentElement('beforebegin',c);else panel.appendChild(c);}
 if(!$('recentActivityBox')){const box=document.createElement('div');box.id='recentActivityBox';box.innerHTML='<div id="recentActivityTitle">Recent Activity <span>Swipe or scroll sideways</span></div><div id="recentActivityScroll"></div>';nav.insertAdjacentElement('beforebegin',box);}
 bindLogout();renderClock();renderActivity();}
function bindLogout(){const b=$('changeInspectorBtn');if(!b||b.dataset.logoutReady)return;b.dataset.logoutReady='1';b.addEventListener('click',()=>{localStorage.removeItem('activeInspector');const login=$('loginPage');if(login)login.classList.remove('hidden');if(typeof openSection==='function')openSection('home');});}
function renderClock(){const t=$('compactClockTime'),d=$('compactClockDate');if(!t||!d)return;const now=new Date();t.textContent=now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});d.textContent=now.toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});}
function renderActivity(){const box=$('recentActivityScroll');if(!box)return;const data=activity();box.innerHTML=data.length?data.map(x=>`<div class="recentActivityCard ${x.cls}"><div class="raType">${esc(x.label)} • ${esc(x.date||'')}</div><div class="raDriver">${esc(x.driver||'No driver recorded')}</div><div class="raMeta">${esc(x.detail||'')}</div><div class="raNote">${esc(x.note||'')}</div></div>`).join(''):'<div class="recentActivityCard"><div class="raDriver">No recent activity</div></div>';}
function init(){addStyles();build();setInterval(renderClock,1000);[1200,3000,6000].forEach(ms=>setTimeout(renderActivity,ms));const old=window.renderAll;if(typeof old==='function'&&!old._recentWrapped){const wrapped=function(){old();renderActivity();};wrapped._recentWrapped=true;window.renderAll=wrapped;}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();