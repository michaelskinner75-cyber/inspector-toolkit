/* Inspector Hub — Home Screen driver advice / reports, rolling six months. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const str=v=>String(v??'').trim();
const esc=v=>str(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>str(v).toLowerCase().replace(/\s+/g,' ');
let previousSignature=null,lastRender=0,scheduled=false;
let orderedItems=[],paused=false,dialogPreviousPaused=false,activeIndex=-1,returnFocus=null;
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
 const targetMonthLastDay=new Date(today.getFullYear(),today.getMonth()-5,0).getDate();
 const from=new Date(today.getFullYear(),today.getMonth()-6,Math.min(today.getDate(),targetMonthLastDay));
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
   depot:str(r[kind==='report'?4:3]),
   location:str(r[kind==='report'?10:8]),
   destination:kind==='inspection'?str(r[9]):'',
   reference:str(r[kind==='report'?9:15]),
   inspectionNote:'',
   source:kind};
  return item;
 };
 for(const r of data('Driver Reports')){const item=collect(r,'report');if(item){reports.push(item);list.push(item);}}
 const same=(a,b)=>a.date===b.date&&a.action===b.action&&norm(a.driver)===norm(b.driver)
   &&norm(a.service)===norm(b.service)&&norm(a.fleet)===norm(b.fleet)
   &&(!a.time||!b.time||Math.abs((+a.time.slice(0,2)*60 + +a.time.slice(3))-(+b.time.slice(0,2)*60 + +b.time.slice(3)))<=60);
 for(const r of data('Inspections')){
  const item=collect(r,'inspection');
  if(!item)continue;
  const matched=reports.find(rep=>same(rep,item));
  if(matched){
   if(item.note&&norm(item.note)!==norm(matched.note))matched.inspectionNote=item.note;
   if(!matched.reference)matched.reference=item.reference;
   if(!matched.location)matched.location=item.location;
   if(!matched.destination)matched.destination=item.destination;
  }else list.push(item);
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
 // A dedicated Home Screen strip, not the old LED clock container.
 // The old .ledShell selectors forced the title and cards into a 38-54px box.
 style.textContent=[
  '#home .homeDriverActionShell{order:1!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:center!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;height:auto!important;min-height:100px!important;margin:0!important;padding:10px 12px!important;gap:9px!important;position:relative!important;overflow:hidden!important;background:#0e293e!important;border:1px solid #426783!important;border-radius:11px!important;box-shadow:none!important}',
  '#home .homeDriverClockCompat{display:none!important}',
  '#home .homeDriverActionHeader{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important;min-width:0!important;flex:none!important;line-height:1.25!important}',
  '#home .homeDriverActionTitle{font-family:Arial,sans-serif!important;color:#f5be64!important;font-size:12px!important;letter-spacing:.02em!important;font-weight:900!important;white-space:nowrap!important}',
  '#home .homeDriverActionCount{font-family:Arial,sans-serif!important;font-size:10px!important;font-weight:700!important;color:#d1dce6!important;white-space:nowrap!important;text-align:right!important}',
  '#home .homeDriverActionViewport{display:block!important;position:relative!important;width:100%!important;min-width:0!important;height:46px!important;min-height:46px!important;max-height:46px!important;flex:none!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:thin;scrollbar-color:#567890 transparent;touch-action:pan-x;overscroll-behavior-inline:contain}',
  '#home .homeDriverActionTrack{position:relative!important;display:flex!important;align-items:center!important;width:max-content!important;height:46px!important;min-height:46px!important;animation:homeDriverActionScroll var(--homeDriverActionSpeed,480s) linear infinite!important}',
  '#home .homeDriverActionSet{display:flex!important;align-items:center!important;gap:9px!important;padding-right:9px!important;flex:0 0 auto!important;height:46px!important}',
  '#home .homeDriverActionCard{position:relative!important;display:inline-flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:8px!important;white-space:nowrap!important;box-sizing:border-box!important;height:42px!important;min-height:42px!important;max-height:42px!important;padding:5px 11px!important;margin:0!important;background:#163b52!important;border-radius:8px!important;border:1px solid #4b6d83!important;color:#eff7fb!important;font-family:Arial,sans-serif!important;font-size:12px!important;line-height:1.25!important;transform:none!important}',
  '#home .homeDriverActionCard.advised{border-left:4px solid #eea83e!important}',
  '#home .homeDriverActionCard.reported{border-left:4px solid #d4545e!important}',
  '#home .homeDriverActionTag{font-size:10px!important;font-weight:900!important;letter-spacing:.015em!important;color:#ffda93!important}',
  '#home .homeDriverActionCard.reported .homeDriverActionTag{color:#ff9ca5!important}',
  '#home .homeDriverActionName{font-weight:900!important;font-size:13px!important;color:#fff!important}',
  '#home .homeDriverActionMeta{color:#cbd9e5!important;font-size:11px!important}',
  '#home .homeDriverActionEmpty{display:flex!important;align-items:center!important;height:46px!important;padding:0 9px!important;color:#c7d9e7!important;font-size:12px!important}',
  '#home .homeDriverActionViewport:hover .homeDriverActionTrack,#home .homeDriverActionViewport:focus-within .homeDriverActionTrack,#home .homeDriverActionViewport:active .homeDriverActionTrack{animation-play-state:paused!important}',
  '@keyframes homeDriverActionScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}',
  '@media(max-width:540px){#home .homeDriverActionShell{min-height:94px!important;padding:9px 8px!important;gap:7px!important}#home .homeDriverActionTitle{font-size:11px!important}#home .homeDriverActionCount{font-size:9px!important}#home .homeDriverActionCard{gap:6px!important;padding:5px 8px!important}#home .homeDriverActionName{font-size:12px!important}#home .homeDriverActionMeta{font-size:10px!important}}',
  '@media(prefers-reduced-motion:reduce){#home .homeDriverActionTrack{animation:none!important}}'
 ].join('');
 document.head.appendChild(style);
}
function ensure(){
 const shell=document.querySelector('#home .homeDriverActionShell')||document.querySelector('#home .ledShell');
 if(!shell)return false;
 styles();
 // Remove the legacy LED class entirely: its absolute positioning and
 // device-specific fixed heights caused driver cards to clip on iPhones.
 shell.classList.remove('ledShell');
 shell.classList.add('homeDriverActionShell');
 if(!$('homeDriverActionViewport')){
  // Retain the hidden ID so old app clock intervals cannot throw on updates.
  shell.innerHTML='<div id="homeClock" class="homeDriverClockCompat" aria-hidden="true"></div><div class="homeDriverActionHeader"><strong class="homeDriverActionTitle">DRIVERS ADVISED / REPORTED</strong><span class="homeDriverActionCount" id="homeDriverActionCount">LAST 6 MONTHS</span></div><div class="homeDriverActionViewport" id="homeDriverActionViewport" role="region" tabindex="0" aria-label="Drivers advised or reported during the last six months">Loading driver reports…</div>';
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
 const count=$('homeDriverActionCount');if(count)count.textContent=items.length?items.length+' ENTRIES • 6 MONTHS':'LAST 6 MONTHS';
 const signature=items.map(x=>[x.action,x.driver,x.date,x.time,x.service,x.fleet,x.inspector,x.note].join('|')).join('::');
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
