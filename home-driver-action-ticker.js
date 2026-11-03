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
  '#home .homeDriverActionShell{order:1!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:center!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;height:auto!important;min-height:132px!important;margin:0!important;padding:10px 12px!important;gap:9px!important;position:relative!important;overflow:hidden!important;background:#0e293e!important;border:1px solid #426783!important;border-radius:11px!important;box-shadow:none!important}',
  '#home .homeDriverClockCompat{display:none!important}',
  '#home .homeDriverActionHeader{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important;min-width:0!important;flex:none!important;line-height:1.25!important}',
  '#home .homeDriverActionTitle{font-family:Arial,sans-serif!important;color:#f5be64!important;font-size:12px!important;letter-spacing:.02em!important;font-weight:900!important;white-space:nowrap!important}',
  '#home .homeDriverActionCount{font-family:Arial,sans-serif!important;font-size:10px!important;font-weight:700!important;color:#d1dce6!important;white-space:nowrap!important;text-align:right!important}',
  '#home .homeDriverActionViewport{display:block!important;position:relative!important;width:100%!important;min-width:0!important;height:46px!important;min-height:46px!important;max-height:46px!important;flex:none!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:thin;scrollbar-color:#567890 transparent;touch-action:pan-x;overscroll-behavior-inline:contain}',
  '#home .homeDriverActionTrack{position:relative!important;display:flex!important;align-items:center!important;width:max-content!important;height:46px!important;min-height:46px!important;animation:homeDriverActionScroll var(--homeDriverActionSpeed,480s) linear infinite!important}',
  '#home .homeDriverActionSet{display:flex!important;align-items:center!important;gap:9px!important;padding-right:9px!important;flex:0 0 auto!important;height:46px!important}',
  '#home .homeDriverActionCard{cursor:pointer!important;appearance:none!important;position:relative!important;display:inline-flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:8px!important;white-space:nowrap!important;box-sizing:border-box!important;height:42px!important;min-height:42px!important;max-height:42px!important;padding:5px 11px!important;margin:0!important;background:#163b52!important;border-radius:8px!important;border:1px solid #4b6d83!important;color:#eff7fb!important;font-family:Arial,sans-serif!important;font-size:12px!important;line-height:1.25!important;transform:none!important}',
  '#home .homeDriverActionCard.advised{border-left:4px solid #eea83e!important}',
  '#home .homeDriverActionCard.reported{border-left:4px solid #d4545e!important}',
  '#home .homeDriverActionTag{font-size:10px!important;font-weight:900!important;letter-spacing:.015em!important;color:#ffda93!important}',
  '#home .homeDriverActionCard.reported .homeDriverActionTag{color:#ff9ca5!important}',
  '#home .homeDriverActionName{font-weight:900!important;font-size:13px!important;color:#fff!important}',
  '#home .homeDriverActionMeta{color:#cbd9e5!important;font-size:11px!important}',
  '#home .homeDriverActionEmpty{display:flex!important;align-items:center!important;height:46px!important;padding:0 9px!important;color:#c7d9e7!important;font-size:12px!important}',
  '#home .homeDriverActionViewport:hover .homeDriverActionTrack,#home .homeDriverActionViewport:focus-within .homeDriverActionTrack,#home .homeDriverActionViewport:active .homeDriverActionTrack,#home .homeDriverActionShell.isPaused .homeDriverActionTrack{animation-play-state:paused!important}',
  '#home .homeDriverActionCard:focus-visible,#home .homeDriverActionControl:focus-visible{outline:2px solid #f5be64!important;outline-offset:2px!important}',
  '#home .homeDriverActionToolbar{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:8px!important;min-height:28px!important;width:100%!important}',
  '#home .homeDriverActionHint{font-size:10px!important;color:#b8cbd9!important;white-space:nowrap!important}',
  '#home .homeDriverActionButtons{display:flex!important;gap:6px!important;align-items:center!important;flex:0 0 auto!important}',
  '#home .homeDriverActionControl{font-family:Arial,sans-serif!important;display:inline-flex!important;justify-content:center!important;align-items:center!important;gap:4px!important;min-height:30px!important;border-radius:7px!important;padding:5px 10px!important;background:#24506c!important;color:#fff!important;border:1px solid #62859f!important;font-size:11px!important;font-weight:800!important;cursor:pointer!important}',
  '#home .homeDriverActionControl[aria-pressed="true"]{background:#f0b752!important;color:#112639!important;border-color:#f0b752!important}',
  '.homeDriverActionOverlay[hidden]{display:none!important}',
  '.homeDriverActionOverlay{position:fixed!important;inset:0!important;z-index:30000!important;display:flex!important;justify-content:center!important;align-items:center!important;background:rgba(0,10,20,.84)!important;padding:14px!important;box-sizing:border-box!important}',
  '.homeDriverActionDialog{position:relative!important;width:min(570px,100%)!important;max-height:min(88dvh,850px)!important;overflow-y:auto!important;overscroll-behavior:contain!important;background:#102a3e!important;color:#fff!important;border:1px solid #527993!important;border-radius:15px!important;padding:18px!important;box-shadow:0 20px 65px rgba(0,0,0,.5)!important;box-sizing:border-box!important}',
  '.homeDriverActionDialogTop{display:flex!important;justify-content:space-between!important;align-items:start!important;gap:12px!important}',
  '.homeDriverActionDialog h3{font-size:20px!important;line-height:1.2!important;margin:0 0 8px!important;color:#fff!important}',
  '.homeDriverActionDialog .homeDriverActionKind{font-size:12px!important;font-weight:900!important;color:#ffc974!important;margin-bottom:8px!important}',
  '.homeDriverActionDialog .homeDriverActionKind.reported{color:#ff989d!important}',
  '.homeDriverActionDialogClose{background:#224c69!important;color:#fff!important;border:1px solid #5d879f!important;border-radius:8px!important;min-width:40px!important;min-height:40px!important;font-weight:900!important;cursor:pointer!important;font-size:20px!important}',
  '.homeDriverActionDetails{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;margin:10px 0 15px!important}',
  '.homeDriverActionDetail{padding:9px!important;background:#193b52!important;border-radius:8px!important;min-width:0!important;overflow-wrap:anywhere!important;font-size:13px!important}',
  '.homeDriverActionDetail b{display:block!important;color:#abc4d7!important;font-size:10px!important;text-transform:uppercase!important;letter-spacing:.04em!important;margin-bottom:4px!important}',
  '.homeDriverActionNotes{margin-top:12px!important;padding:12px!important;background:#091e2f!important;border:1px solid #345872!important;border-radius:10px!important}',
  '.homeDriverActionNotes b{display:block!important;color:#f4bb60!important;font-size:12px!important;margin-bottom:8px!important}',
  '.homeDriverActionNotes p{white-space:pre-wrap!important;overflow-wrap:anywhere!important;font-size:13px!important;line-height:1.5!important;margin:0!important}',
  '.homeDriverActionDialogFoot{color:#bbcfde!important;font-size:11px!important;margin:14px 0 0!important}',
  '@keyframes homeDriverActionScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}',
  '@media(max-width:540px){#home .homeDriverActionShell{min-height:124px!important;padding:9px 8px!important;gap:7px!important}#home .homeDriverActionTitle{font-size:11px!important}#home .homeDriverActionCount{font-size:9px!important}#home .homeDriverActionCard{gap:6px!important;padding:5px 8px!important}#home .homeDriverActionName{font-size:12px!important}#home .homeDriverActionMeta{font-size:10px!important}}',
  '@media(max-width:540px){#home .homeDriverActionHint{font-size:9px!important}#home .homeDriverActionControl{padding:5px 7px!important;font-size:10px!important}.homeDriverActionDetails{grid-template-columns:1fr 1fr!important}.homeDriverActionDialog{padding:14px!important}}',
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
  shell.innerHTML='<div id="homeClock" class="homeDriverClockCompat" aria-hidden="true"></div><div class="homeDriverActionHeader"><strong class="homeDriverActionTitle">DRIVERS ADVISED / REPORTED</strong><span class="homeDriverActionCount" id="homeDriverActionCount">LAST 6 MONTHS</span></div><div class="homeDriverActionToolbar"><span class="homeDriverActionHint">SWIPE • TAP FOR DETAILS</span><div class="homeDriverActionButtons"><button type="button" class="homeDriverActionControl" id="homeDriverActionPause" aria-pressed="false">⏸ PAUSE</button><button type="button" class="homeDriverActionControl" id="homeDriverActionShuffle">⤨ SHUFFLE</button></div></div><div class="homeDriverActionViewport" id="homeDriverActionViewport" role="region" tabindex="0" aria-label="Drivers advised or reported during the last six months">Loading driver reports…</div>';
 }
 return true;
}

function shuffled(items){
 const list=items.slice();
 for(let i=list.length-1;i>0;i--){
  const j=Math.floor(Math.random()*(i+1));
  [list[i],list[j]]=[list[j],list[i]];
 }
 // Prevent an unchanged shuffle even on very short lists.
 if(list.length>1&&list.every((item,i)=>item===items[i]))list.push(list.shift());
 return list;
}
function setPaused(next){
 paused=!!next;
 const shell=document.querySelector('#home .homeDriverActionShell');
 shell?.classList.toggle('isPaused',paused);
 const button=$('homeDriverActionPause');
 if(button){
  button.textContent=paused?'▶ RESUME':'⏸ PAUSE';
  button.setAttribute('aria-pressed',String(paused));
  button.setAttribute('aria-label',paused?'Resume scrolling driver actions':'Pause scrolling driver actions');
 }
}
function ensureDialog(){
 let layer=$('homeDriverActionOverlay');
 if(layer)return layer;
 layer=document.createElement('div');
 layer.id='homeDriverActionOverlay';
 layer.className='homeDriverActionOverlay';
 layer.hidden=true;
 document.body.appendChild(layer);
 return layer;
}
function details(item){
 const fields=[
  ['Action',item.action==='ADVISED'?'Driver advised':'Offence report submitted'],
  ['Date',item.date.slice(8,10)+'/'+item.date.slice(5,7)+'/'+item.date.slice(0,4)],
  ['Time',item.time],
  ['Inspector',item.inspector],
  ['Depot',item.depot],
  ['Service',item.service],
  ['Fleet number',item.fleet],
  ['Location checked',item.location],
  ['Destination',item.destination],
  ['Report reference',item.reference]
 ].filter(pair=>str(pair[1]));
 const row=([label,value])=>'<div class="homeDriverActionDetail"><b>'+esc(label)+'</b>'+esc(value)+'</div>';
 const notes=item.note?'<div class="homeDriverActionNotes"><b>REASON / REPORT DETAILS</b><p>'+esc(item.note)+'</p></div>':'';
 const inspection=item.inspectionNote?'<div class="homeDriverActionNotes"><b>INSPECTION NOTES</b><p>'+esc(item.inspectionNote)+'</p></div>':'';
 return '<div class="homeDriverActionDialog" role="dialog" aria-modal="true" aria-labelledby="homeDriverActionDialogName"><div class="homeDriverActionDialogTop"><div><div class="homeDriverActionKind '+(item.action==='REPORTED'?'reported':'')+'">'+esc(item.action==='ADVISED'?'DRIVER ADVISED':'DRIVER REPORTED')+'</div><h3 id="homeDriverActionDialogName">'+esc(item.driver)+'</h3></div><button type="button" id="homeDriverActionClose" class="homeDriverActionDialogClose" aria-label="Close driver details">×</button></div><div class="homeDriverActionDetails">'+fields.map(row).join('')+'</div>'+notes+inspection+'<p class="homeDriverActionDialogFoot">Source: '+(item.source==='report'?'Driver Reports':'Inspection Checks')+' • Recorded information only</p></div>';
}
function openDetails(index,trigger){
 const item=orderedItems[index];
 if(!item)return;
 const layer=ensureDialog();
 dialogPreviousPaused=paused;
 returnFocus=trigger||null;
 setPaused(true);
 activeIndex=index;
 layer.innerHTML=details(item);
 layer.hidden=false;
 $('homeDriverActionClose')?.focus();
}
function closeDetails(){
 const layer=$('homeDriverActionOverlay');
 if(!layer||layer.hidden)return;
 layer.hidden=true;
 layer.innerHTML='';
 activeIndex=-1;
 setPaused(dialogPreviousPaused);
 if(returnFocus&&returnFocus.isConnected&&typeof returnFocus.focus==='function')returnFocus.focus();
 returnFocus=null;
}
function card(item,index,duplicate){
 // The scrolling bar shows only the driver and their action.
 // Other report details remain available when the entry is tapped.
 const label=item.action==='ADVISED'?'ADVISED':'REPORTED';
 const description=item.driver+' • '+label;
 return '<button type="button" class="homeDriverActionCard '+(item.action==='ADVISED'?'advised':'reported')+'" data-driver-action-index="'+index+'" '+(duplicate?'tabindex="-1" ':'')+'title="'+esc(description)+'" aria-label="'+esc('View details: '+item.driver+', '+label.toLowerCase())+'"><strong class="homeDriverActionName">'+esc(item.driver)+'</strong><span class="homeDriverActionTag">'+label+'</span></button>';
}
function paint(){
 const viewport=$('homeDriverActionViewport');
 if(!viewport)return;
 if(!orderedItems.length){
  const hasRows=data('Driver Reports').length>0||data('Inspections').length>0;
  viewport.innerHTML='<div class="homeDriverActionEmpty">'+(hasRows?'No driver advice or reports recorded in the last six months.':'Loading shared driver reports…')+'</div>';
  return;
 }
 const group=orderedItems.map((item,i)=>card(item,i,false)).join('');
 const cloned=orderedItems.map((item,i)=>card(item,i,true)).join('');
 viewport.style.setProperty('--homeDriverActionSpeed',Math.max(70,orderedItems.length*5)+'s');
 viewport.innerHTML='<div class="homeDriverActionTrack"><div class="homeDriverActionSet">'+group+'</div><div class="homeDriverActionSet" aria-hidden="true">'+cloned+'</div></div>';
 viewport.scrollLeft=0;
 setPaused(paused);
}
function shuffleNow(){
 if(orderedItems.length<2)return;
 orderedItems=shuffled(orderedItems);
 paint();
}
function render(){
 if(!ensure())return;
 const items=records();
 const count=$('homeDriverActionCount');if(count)count.textContent=items.length?items.length+' ENTRIES • 6 MONTHS':'LAST 6 MONTHS';
 const signature=items.map(x=>[x.action,x.driver,x.date,x.time,x.service,x.fleet,x.inspector,x.note,x.inspectionNote,x.reference,x.location].join('|')).join('::');
 if(signature===previousSignature)return;
 previousSignature=signature;lastRender=Date.now();
 orderedItems=shuffled(items);
 paint();
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
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-open="home"],.refreshCloud'))setTimeout(schedule,100);
  if(e.target.closest('#homeDriverActionPause')){setPaused(!paused);return;}
  if(e.target.closest('#homeDriverActionShuffle')){shuffleNow();return;}
  const selected=e.target.closest('[data-driver-action-index]');
  if(selected?.closest('#homeDriverActionViewport')){
   openDetails(Number(selected.dataset.driverActionIndex),selected);return;
  }
  if(e.target.closest('#homeDriverActionClose')||e.target.id==='homeDriverActionOverlay')closeDetails();
 });
 document.addEventListener('pointerdown',e=>{
  if(e.target.closest('#homeDriverActionViewport'))setPaused(true);
 },{passive:true});
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('homeDriverActionOverlay')?.hidden)closeDetails();
 });
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
 setInterval(()=>{if(document.querySelector('#home.section.active')&&!document.hidden)schedule();},60000);
 return true;
}
let attempts=0;
const timer=setInterval(()=>{if(init()||++attempts>60)clearInterval(timer);},200);
})();
