/* Driver activity data and full-details modal for the combined Check Sheet ticker. */
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


function setPaused(next){paused=!!next;window.InspectorUnifiedTicker?.setPaused(paused);}
function styles(){
 if($('homeDriverActionStyle'))return;
 const style=document.createElement('style');style.id='homeDriverActionStyle';
 style.textContent=[
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
  '@media(max-width:540px){.homeDriverActionDialog{padding:14px!important}.homeDriverActionDetails{grid-template-columns:1fr 1fr!important}}'
 ].join('');
 document.head.appendChild(style);
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

window.InspectorHubDriverActions={
 getItems(){
  const entries=records();
  entries.forEach((entry,i)=>{entry.isRecent=i<5;});
  orderedItems=entries;
  return entries.map((entry,index)=>({...entry,index}));
 },
 open(index,trigger){openDetails(Number(index),trigger);},
 close:closeDetails
};
styles();
// Both bars have moved from Home; leave the clock placeholder hidden for legacy code.
const homeStyle=document.createElement('style');homeStyle.id='inspectorHomeScrollbarsRemoved';
homeStyle.textContent='#home .ledShell,#home .homeDriverActionShell,#home #homeSuggestedChecksBar{display:none!important}';
document.head.appendChild(homeStyle);
document.addEventListener('click',e=>{
 if(e.target.closest('#homeDriverActionClose')||e.target.id==='homeDriverActionOverlay')closeDetails();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDetails();});
})();
