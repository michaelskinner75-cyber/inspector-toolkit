/* Inspector Hub — Home Screen driver advice / reports, rolling six months. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const str=v=>String(v??'').trim();
const esc=v=>str(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>str(v).toLowerCase().replace(/\s+/g,' ');
let previousSignature='',lastRender=0,scheduled=false;
function data(sheet){
 try{
  const rows=(typeof cloud!=='undefined'&&Array.isArray(cloud[sheet]))?cloud[sheet]:[];
  return rows.filter(r=>Array.isArray(r)&&r.length>=7&&!/^(date|recorded at)$/i.test(str(r[0])));
 }catch(err){return[];}
}
function localDate(v){
 if(v instanceof Date)return Number.isNaN(v.getTime())?null:new Date(v.getFullYear(),v.getMonth(),v.getDate());
 if(typeof v==='number'&&v>20000&&v<90000){
  const utc=new Date(Date.UTC(1899,11,30)+v*86400000);
  return new Date(utc.getUTCFullYear(),utc.getUTCMonth(),utc.getUTCDate());
 }
 const s=str(v);
 let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\b|$)/);
 if(m){const d=new Date(+m[1],+m[2]-1,+m[3]);return d.getFullYear()===+m[1]&&d.getMonth()===+m[2]-1&&d.getDate()===+m[3]?d:null;}
 m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2}|\d{4})(?:\b|$)/);
 if(m){const year=m[3].length===2?2000+(+m[3]):(+m[3]);const d=new Date(year,+m[2]-1,+m[1]);return d.getFullYear()===year&&d.getMonth()===+m[2]-1&&d.getDate()===+m[1]?d:null;}
 return null;
}
function isoDay(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function timeOf(value){const m=str(value).match(/\b(\d{1,2}):(\d{2})\b/);return m&&+m[1]<24&&+m[2]<60?String(+m[1]).padStart(2,'0')+':'+m[2]:'';}
function actionOf(value){
 const a=norm(value);
 if(!a||/^(?:no\s+driver\s+report|no\s+report|none|n\/a|no\s+issue)$/.test(a))return'';
 if(/advis/.test(a))return'ADVISED';
 if(/offence|offense|report/.test(a))return'REPORTED';
 return'';
}
function records(){
 const today=new Date();today.setHours(0,0,0,0);
 const from=new Date(today.getFullYear(),today.getMonth()-6,today.getDate());
 const within=d=>!!d&&d>=from&&d<=today;
 const list=[],reports=[];
 const collect=(r,kind)=>{
  const date=localDate(r[0]);if(!within(date))return null;
  const action=actionOf(r[kind==='report'?5:13]);if(!action)return null;
  const name=str(r[kind==='report'?3:4]);if(!name)return null;
  const time=timeOf(r[1]);
  const item={action,driver:name,date:isoDay(date),time,
   inspector:str(r[2]),service:str(r[kind==='report'?7:5]),
   fleet:str(r[kind==='report'?8:6]),
   note:str(r[kind==='report'?6:14]),
   source:kind};
  return item;
 };
 for(const r of data('Driver Reports')){const item=collect(r,'report');if(item){reports.push(item);list.push(item);}}
 const same=(a,b)=>a.date===b.date&&a.action===b.action&&norm(a.driver)===norm(b.driver)
   &&norm(a.service)===norm(b.service)&&norm(a.fleet)===norm(b.fleet)
   &&(!a.time||!b.time||Math.abs((+a.time.slice(0,2)*60 + +a.time.slice(3))-(+b.time.slice(0,2)*60 + +b.time.slice(3)))<=60);
 for(const r of data('Inspections')){
  const item=collect(r,'inspection');
  if(item&&!reports.some(rep=>same(rep,item)))list.push(item);
 }
 const seen=new Set();
 return list.filter(item=>{
  const key=[item.date,item.time,norm(item.driver),item.action,norm(item.service),norm(item.fleet)].join('|');
  if(seen.has(key))return false;
  seen.add(key);return true;
 }).sort((a,b)=>(b.date+'T'+b.time).localeCompare(a.date+'T'+a.time)||
  a.driver.localeCompare(b.driver));
}
function styles(){
 if($('homeDriverActionStyle'))return;
 const style=document.createElement('style');style.id='homeDriverActionStyle';
 style.textContent=[
  '#home .ledShell.homeDriverActionShell{height:56px!important;min-height:56px!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:9px!important;padding:0 9px!important;box-sizing:border-box!important;overflow:hidden!important}',
  '#home .homeDriverClockCompat,#home .ledShell #staticBusClock,#home .ledShell #homeClock{display:none!important}',
  '#home .homeDriverActionLabel{display:flex;flex-direction:column;gap:2px;flex:0 0 auto;width:105px;font-size:11px;line-height:1.2;font-weight:900;letter-spacing:.02em;color:#f5be64}',
  '#home .homeDriverActionLabel small{font-size:9px;letter-spacing:.03em;color:#c7d9e7}',
  '#home .homeDriverActionViewport{min-width:0;flex:1;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;scrollbar-color:#42647c transparent;touch-action:pan-x;overscroll-behavior-inline:contain}',
  '#home .homeDriverActionTrack{display:flex;width:max-content;animation:homeDriverActionScroll var(--homeDriverActionSpeed,480s) linear infinite}',
  '#home .homeDriverActionSet{display:flex;gap:9px;padding-right:9px;flex:0 0 auto}',
  '#home .homeDriverActionCard{display:flex;align-items:center;gap:8px;white-space:nowrap;box-sizing:border-box;min-height:39px;padding:5px 11px;background:#132e43;border-radius:8px;border:1px solid #375b72;color:#eff7fb;font-size:12px}',
  '#home .homeDriverActionCard.advised{border-left:4px solid #eea83e}',
  '#home .homeDriverActionCard.reported{border-left:4px solid #d4545e}',
  '#home .homeDriverActionTag{font-size:10px;font-weight:900;letter-spacing:.015em;color:#ffda93}',
  '#home .homeDriverActionCard.reported .homeDriverActionTag{color:#ff9ca5}',
  '#home .homeDriverActionName{font-weight:900;font-size:13px}',
  '#home .homeDriverActionMeta{color:#c4d4df;font-size:11px}',
  '#home .homeDriverActionEmpty{padding:9px;color:#c7d9e7;font-size:12px}',
  '#home .homeDriverActionViewport:hover .homeDriverActionTrack,#home .homeDriverActionViewport:focus-within .homeDriverActionTrack,#home .homeDriverActionViewport:active .homeDriverActionTrack{animation-play-state:paused}',
  '@keyframes homeDriverActionScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}',
  '@media(max-width:540px){#home .ledShell.homeDriverActionShell{height:54px!important;min-height:54px!important;padding:0 6px!important;gap:6px!important}#home .homeDriverActionLabel{width:74px;font-size:9px}#home .homeDriverActionLabel small{font-size:8px}#home .homeDriverActionCard{gap:6px;padding:5px 8px;font-size:11px}#home .homeDriverActionName{font-size:12px}#home .homeDriverActionMeta{font-size:10px}}',
  '@media(prefers-reduced-motion:reduce){#home .homeDriverActionTrack{animation:none}}'
 ].join('');
 document.head.appendChild(style);
}
function ensure(){
 const shell=document.querySelector('#home .ledShell');
 if(!shell)return false;
 styles();
 shell.classList.add('homeDriverActionShell');
 if(!$('homeDriverActionViewport')){
  // The legacy clock ID stays hidden: older display scripts still update it.
  shell.innerHTML='<div id="homeClock" class="homeDriverClockCompat" aria-hidden="true"></div><div class="homeDriverActionLabel">DRIVER ACTIONS<small>LAST 6 MONTHS</small></div><div class="homeDriverActionViewport" id="homeDriverActionViewport" role="region" tabindex="0" aria-label="Drivers advised or reported during the last six months">Loading driver reports…</div>';
 }
 return true;
}
function card(item){
 const description=[item.action==='ADVISED'?'Driver advised':'Driver reported',item.driver,item.date,item.service&&'Service '+item.service,item.inspector&&'Inspector '+item.inspector,item.note].filter(Boolean).join(' • ').slice(0,900);
 const date=item.date.slice(8,10)+'/'+item.date.slice(5,7)+'/'+item.date.slice(0,4);
 return '<div class="homeDriverActionCard '+(item.action==='ADVISED'?'advised':'reported')+'" title="'+esc(description)+'"><span class="homeDriverActionTag">'+item.action+'</span><strong class="homeDriverActionName">'+esc(item.driver)+'</strong><span class="homeDriverActionMeta">'+esc(date)+(item.time?' '+esc(item.time):'')+'</span>'+(item.service?'<span class="homeDriverActionMeta">SERVICE '+esc(item.service)+'</span>':'')+(item.inspector?'<span class="homeDriverActionMeta">• '+esc(item.inspector)+'</span>':'')+'</div>';
}
function render(){
 if(!ensure())return;
 const viewport=$('homeDriverActionViewport');
 const items=records();
 const signature=items.map(x=>[x.action,x.driver,x.date,x.time,x.service,x.fleet,x.inspector].join('|')).join('::');
 if(signature===previousSignature)return;
 previousSignature=signature;lastRender=Date.now();
 if(!items.length){
  const hasRows=data('Driver Reports').length>0||data('Inspections').length>0;
  viewport.innerHTML='<div class="homeDriverActionEmpty">'+(hasRows?'No driver advice or reports recorded in the last six months.':'Loading shared driver reports…')+'</div>';
  return;
 }
 const group=items.map(card).join('');
 viewport.style.setProperty('--homeDriverActionSpeed',Math.max(70,items.length*5)+'s');
 viewport.innerHTML='<div class="homeDriverActionTrack"><div class="homeDriverActionSet">'+group+'</div><div class="homeDriverActionSet" aria-hidden="true">'+group+'</div></div>';
}
function schedule(){
 if(scheduled)return;
 scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;render();});
}
function init(){
 if(!ensure())return false;
 schedule();
 const prior=window.renderAll;
 if(typeof prior==='function'&&!prior.homeDriverActionsWrapped){
  const wrapper=function(...args){const res=prior.apply(this,args);schedule();return res;};
  wrapper.homeDriverActionsWrapped=true;
  window.renderAll=wrapper;
 }
 document.addEventListener('click',e=>{if(e.target.closest('[data-open="home"],.refreshCloud'))setTimeout(schedule,100);});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
 setInterval(()=>{if(document.querySelector('#home.section.active')&&!document.hidden)schedule();},60000);
 return true;
}
let attempts=0;
const timer=setInterval(()=>{if(init()||++attempts>60)clearInterval(timer);},200);
})();
