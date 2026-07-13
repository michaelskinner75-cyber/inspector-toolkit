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
 let rows=inspectionRows().filter(r=>dateMatches(validDate(r[0]),filter));
 if(q)rows=rows.filter(r=>r.map(v=>String(v||'')).join(' ').toLowerCase().includes(q));
 rows.sort((a,b)=>{
  const ad=validDate(a[0]),bd=validDate(b[0]);
  const at=ad?ad.getTime():0,bt=bd?bd.getTime():0;
  if(bt!==at)return bt-at;
  return String(b[1]||'').localeCompare(String(a[1]||''));
 });
 list.innerHTML=rows.map((r,i)=>{
  const date=typeof formatDateValue==='function'?formatDateValue(r[0]):r[0]||'-';
  const savedTime=typeof formatTimeValue==='function'?formatTimeValue(r[1]):r[1]||'-';
  const timeOn=typeof formatTimeValue==='function'?formatTimeValue(r[7]):r[7]||'-';
  const ref=r[15]||'';
  const status=typeof statusMark==='function'?statusMark(r):(r[13]||'OK');
  const cls=typeof statusClass==='function'?statusClass(r):'';
  const details=[ref?'<b>Offence Reference: '+safe(ref)+'</b>':'',safe(date+' '+savedTime),'Inspector: '+safe(r[2]||'-'),'Depot: '+safe(r[3]||'-'),'Driver: '+safe(r[4]||'-'),'Service: '+safe(r[5]||'-'),'Fleet: '+safe(r[6]||'-'),'Time boarded: '+safe(timeOn),'Journey: '+safe((r[8]||'-')+' to '+(r[9]||'-')),'NSA: '+safe(r[10]||'-')+(r[10]==='No'?' - '+safe(r[11]||'-')+' - '+safe(r[12]||'-'):''),'Driver Report: '+safe(r[13]||'-'),safe(r[14]||'-')].filter(Boolean);
  return '<div class="compactCheck '+safe(cls)+'"><div class="compactTop" data-toggle="pcf'+i+'"><div class="compactMain">'+safe(date)+' '+safe(timeOn)+' | '+safe(r[5]||'-')+' | '+safe(r[6]||'-')+' | '+safe(r[4]||'-')+' | '+safe(status)+(ref?' | '+safe(ref):'')+'</div><div class="compactSub">'+safe(r[3]||'-')+' • '+safe(r[8]||'-')+' → '+safe(r[9]||'-')+' • '+safe(r[2]||'-')+'</div></div><div class="compactDetails" id="pcf'+i+'">'+details.join('<br>')+'</div></div>';
 }).join('')||'No checks for this view.';
 markButtons();
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