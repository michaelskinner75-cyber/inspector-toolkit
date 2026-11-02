(function(){
'use strict';
let activeFilter=localStorage.getItem('checkFilter')||'today';

function inspectionRows(){
 const source=(typeof cloud!=='undefined'&&cloud['Inspections'])||[];
 if(!source.length)return[];
 const first=(source[0]||[]).map(v=>String(v||'').trim().toLowerCase());
 const hasHeader=first.some(v=>['date','time','inspector','depot','driver','service','fleet'].includes(v));
 return source.slice(hasHeader?1:0).filter(r=>Array.isArray(r)&&r.some(v=>String(v||'').trim()));
}
// Shared Other Work records use [date, recordedAt, inspector, from, until, description].
// The first row may be a header; this is a read-only addition to Previous Checks.
function otherWorkRows(){
 const source=(typeof cloud!=='undefined'&&cloud&&cloud['Other Work'])||[];
 if(!Array.isArray(source))return[];
 return source.filter(r=>Array.isArray(r)&&r.length>=6&&String(r[0]||'').trim().toLowerCase()!=='date'&&r.some(v=>String(v??'').trim()));
}
function checkTime(value){
 const m=String(value??'').trim().match(/^(\d{1,2}):(\d{2})/);
 return m&&Number(m[1])<24&&Number(m[2])<60?Number(m[1])*60+Number(m[2]):-1;
}
function validDate(v){
 if(v instanceof Date&&!isNaN(v)){const d=new Date(v);d.setHours(0,0,0,0);return d;}
 const s=String(v||'').trim();
 let m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})$/);
 if(m){
  const day=Number(m[1]),month=Number(m[2])-1,year=Number(m[3].length===2?'20'+m[3]:m[3]);
  const d=new Date(year,month,day);d.setHours(0,0,0,0);
  if(d.getFullYear()===year&&d.getMonth()===month&&d.getDate()===day)return d;
 }
 m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
 if(m){
  const year=Number(m[1]),month=Number(m[2])-1,day=Number(m[3]);
  const d=new Date(year,month,day);d.setHours(0,0,0,0);
  if(d.getFullYear()===year&&d.getMonth()===month&&d.getDate()===day)return d;
 }
 const d=new Date(s);
 if(!isNaN(d)){d.setHours(0,0,0,0);return d;}
 return null;
}
function mondayStart(date){
 const d=new Date(date);d.setHours(0,0,0,0);
 const day=d.getDay();d.setDate(d.getDate()-(day===0?6:day-1));
 return d;
}
function dateMatches(d,filter){
 if(!d)return filter==='all';
 const now=new Date();now.setHours(0,0,0,0);
 if(filter==='today')return d.getTime()===now.getTime();
 if(filter==='week'){
  const start=mondayStart(now),end=new Date(start);end.setDate(end.getDate()+7);
  return d>=start&&d<end;
 }
 if(filter==='month')return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();
 return true;
}
function selectedFilter(){
 const q=(document.getElementById('checkSearch')?.value||'').trim();
 return q?'all':activeFilter;
}
function markButtons(){
 document.querySelectorAll('[data-check-filter]').forEach(b=>b.classList.toggle('active',b.dataset.checkFilter===activeFilter));
}
function safe(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function renderFixedChecks(){
 const list=document.getElementById('checkList');
 if(!list)return;
 const q=(document.getElementById('checkSearch')?.value||'').trim().toLowerCase();
 const filter=selectedFilter();
 // Combine the two shared sheets for display only; do not alter source records.
 let entries=[
  ...inspectionRows().map(row=>({kind:'inspection',row})),
  ...otherWorkRows().map(row=>({kind:'other',row}))
 ].filter(entry=>dateMatches(validDate(entry.row[0]),filter));
 if(q)entries=entries.filter(entry=>{
  const searchable=entry.kind==='other'?'Other Work '+entry.row.map(v=>String(v??'')).join(' '):entry.row.map(v=>String(v??'')).join(' ');
  return searchable.toLowerCase().includes(q);
 });
 entries.sort((a,b)=>{
  const ad=validDate(a.row[0]),bd=validDate(b.row[0]);
  const day=(bd?bd.getTime():0)-(ad?ad.getTime():0);
  if(day)return day;
  const at=checkTime(a.kind==='other'?a.row[3]:(a.row[7]||a.row[1]));
  const bt=checkTime(b.kind==='other'?b.row[3]:(b.row[7]||b.row[1]));
  return bt-at;
 });
 list.innerHTML=entries.map((entry,i)=>{
  const r=entry.row;
  const date=typeof formatDateValue==='function'?formatDateValue(r[0]):r[0]||'-';
  if(entry.kind==='other'){
   const from=typeof formatTimeValue==='function'?formatTimeValue(r[3]):r[3]||'-';
   const until=typeof formatTimeValue==='function'?formatTimeValue(r[4]):r[4]||'-';
   const note=String(r[5]??'').trim(),snippet=note.length>95?note.slice(0,92)+'…':note;
   const details='<b>Other Work</b><br>Inspector: '+safe(r[2]||'-')+'<br>Date: '+safe(date)+'<br>Time From: '+safe(from)+'<br>Time Until: '+safe(until)+'<br>Description:<div class="pcfOtherDescription">'+safe(note||'-')+'</div>';
   return '<div class="compactCheck pcfOtherWork"><div class="compactTop" data-toggle="pcf'+i+'"><div class="compactMain">'+safe(date)+' '+safe(from)+'–'+safe(until)+' | OTHER WORK</div><div class="compactSub">'+safe(r[2]||'Inspector not recorded')+' • '+safe(snippet||'No description')+'</div></div><div class="compactDetails" id="pcf'+i+'">'+details+'</div></div>';
  }
  const timeOn=typeof formatTimeValue==='function'?formatTimeValue(r[7]):r[7]||'-';
  const ref=r[15]||'';
  const status=typeof statusMark==='function'?statusMark(r):(r[13]||'OK');
  const cls=typeof statusClass==='function'?statusClass(r):'';
  const details=[ref?'<b>Offence Reference: '+safe(ref)+'</b>':'','Inspector: '+safe(r[2]||'-'),'Depot: '+safe(r[3]||'-'),'Driver: '+safe(r[4]||'-'),'Service: '+safe(r[5]||'-'),'Fleet: '+safe(r[6]||'-'),'Time boarded: '+safe(timeOn),'Journey: '+safe((r[8]||'-')+' to '+(r[9]||'-')),'NSA: '+safe(r[10]||'-')+(r[10]==='No'?' - '+safe(r[11]||'-')+' - '+safe(r[12]||'-'):''),'Driver Report: '+safe(r[13]||'-'),safe(r[14]||'-')].filter(Boolean);
  return '<div class="compactCheck '+safe(cls)+'"><div class="compactTop" data-toggle="pcf'+i+'"><div class="compactMain">'+safe(date)+' '+safe(timeOn)+' | '+safe(r[5]||'-')+' | '+safe(r[6]||'-')+' | '+safe(r[4]||'-')+' | '+safe(status)+(ref?' | '+safe(ref):'')+'</div><div class="compactSub">'+safe(r[3]||'-')+' • '+safe(r[8]||'-')+' → '+safe(r[9]||'-')+' • '+safe(r[2]||'-')+'</div></div><div class="compactDetails" id="pcf'+i+'">'+details.join('<br>')+'</div></div>';
 }).join('')||'No checks or other work for this view.';
 markButtons();
}


// Match the existing expandable Previous Checks cards, with a distinct Other Work accent.
if(!document.getElementById('pcfOtherWorkStyle')){
 const css=document.createElement('style');css.id='pcfOtherWorkStyle';
 css.textContent='.compactCheck.pcfOtherWork{border-left-color:#aa91e5}.pcfOtherDescription{white-space:pre-wrap;overflow-wrap:anywhere;margin-top:4px}';
 document.head.appendChild(css);
}

window.renderChecks=renderFixedChecks;
document.addEventListener('click',function(e){
 const b=e.target.closest('[data-check-filter]');
 if(!b)return;
 e.preventDefault();e.stopImmediatePropagation();
 activeFilter=b.dataset.checkFilter||'today';
 try{checkFilter=activeFilter;}catch(err){}
 localStorage.setItem('checkFilter',activeFilter);
 renderFixedChecks();
},true);
document.addEventListener('input',function(e){if(e.target&&e.target.id==='checkSearch')renderFixedChecks();},true);
const oldAll=window.renderAll;
window.renderAll=function(){if(typeof oldAll==='function')oldAll();renderFixedChecks();};
window.addEventListener('load',function(){setTimeout(renderFixedChecks,1000);});
})();