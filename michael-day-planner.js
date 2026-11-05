/* Inspector Hub: Michael and Drew service planners, shared via Google Sheets append-only event log. */
(function(){
'use strict';
const $=id=>document.getElementById(id),str=v=>String(v??'').trim();
const esc=v=>str(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const SHEET='Inspector Day Planner',CACHE='inspectorDayPlannerCloudCacheV1',PENDING='inspectorDayPlannerPendingV1';
let person='',date='',data={},pending=[],status='Loading shared plans...',query='',servicesVisible=true,started=false,busy=false,requesting=false;
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function inspector(){
 let name='';try{name=typeof getInspector==='function'?getInspector():localStorage.getItem('activeInspector')||'';}catch(e){}
 name=str(name);if(/^(?:m\.?\s*skinner|michael\s+skinner)$/i.test(name)&&Number(localStorage.getItem('michaelLoginExpiresAt')||0)>Date.now())return'Michael';
 return /^(?:drew(?:\s+fairbairn)?|a\.?\s*fairbairn|ali\s+fairbairn)$/i.test(name)?'Drew':'';
}
function local(){
 try{data=JSON.parse(localStorage.getItem(CACHE)||'{}')||{};}catch(e){data={};}
 try{pending=JSON.parse(localStorage.getItem(PENDING)||'[]')||[];}catch(e){pending=[];}
}
function keep(){
 try{localStorage.setItem(CACHE,JSON.stringify(data));localStorage.setItem(PENDING,JSON.stringify(pending));}catch(e){status='Local storage unavailable — check cloud connection';}
}
function key(p,d,s){return p+'|'+d+'|'+s;}
function services(){
 const m=window.InspectorCoverageModel;if(!m)return[];
 const now=new Date(),MS=86400000;
 return m.status(m.defs()).filter(m.fifeService).map(s=>{
  const last=m.date(s.item?.date||s.original?.date||'');
  const dt=last?new Date(last+'T12:00:00'):null;
  const days=dt&&!isNaN(dt)?Math.floor((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.UTC(dt.getFullYear(),dt.getMonth(),dt.getDate()))/MS):Infinity;
  const rank=!last?0:(s.override?.status==='NOT_CHECKED'||!s.checked||days>14?1:2);
  return {...s,rank,days,last,flag:['NEVER CHECKED','OVERDUE','RECENT'][rank]};
 }).sort((a,b)=>a.rank-b.rank||b.days-a.days||str(a.code).localeCompare(str(b.code),undefined,{numeric:true}));
}
function timesLink(s){
 const route=str(window.InspectorCoverageTimetableUrl?.(s)||'');
 return /^https:\/\/(?:www\.)?bustimes\.org\/services\/[a-z0-9/_-]+(?:\?[a-z0-9=&_%.-]*)?$/i.test(route)?route:'';
}
function parse(rows){
 const result={};
 (rows||[]).forEach(r=>{
  if(!Array.isArray(r)||r.length<7||!['Michael','Drew'].includes(str(r[1])))return;
  const p=str(r[1]),d=str(r[2]),id=str(r[3]);if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!id)return;
  const k=key(p,d,id),at=str(r[0]),event=str(r[5]);
  if(result[k]&&result[k].stamp>at)return;
  result[k]={stamp:at,person:p,date:d,serviceId:id,code:str(r[4]),route:str(r[6]),notes:str(r[7]),done:str(r[8])==='YES',deleted:event==='REMOVE',tx:str(r[9])};
 });
 return result;
}
function endpoint(){
 if(typeof WEB_APP_URL!=='string'||!WEB_APP_URL)throw Error('Google Sheets connection unavailable');
 return WEB_APP_URL;
}
async function getCloud(){
 const url=endpoint()+(endpoint().includes('?')?'&':'?')+'sheet='+encodeURIComponent(SHEET)+'&_='+Date.now();
 const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Sheet returned '+r.status);
 const j=await r.json();if(!Array.isArray(j?.data))throw Error('Sheet read failed');
 return j.data;
}
function found(rows,tx){return rows.some(r=>Array.isArray(r)&&str(r[9])===tx);}
async function send(row){
 await fetch(endpoint(),{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sheet:SHEET,row})});
}
async function refresh(){
 if(busy)return;busy=true;status='Refreshing Google Sheets…';render();
 try{
  const rows=await getCloud(),remote=parse(rows);
  data={...remote};pending.forEach(p=>{
   if(!found(rows,p.tx)){const k=key(p.person,p.date,p.serviceId);if(!data[k]||data[k].stamp<=p.stamp)data[k]=p.item;}
  });
  pending=pending.filter(p=>!found(rows,p.tx));keep();
  status=pending.length?'Some changes not yet confirmed by Google Sheets':'Google Sheets synced ✓';
 }catch(e){status='Google Sheets unavailable — showing cached entries';}
 finally{busy=false;render();}
 if(pending.length)sync();
}
let syncing=false;
async function sync(){
 if(syncing||!pending.length)return;syncing=true;
 try{
  for(const p of pending.slice()){
   let rows;try{rows=await getCloud();}catch(e){break;}
   if(found(rows,p.tx)){pending=pending.filter(x=>x.tx!==p.tx);keep();continue;}
   // Avoid repeating an uncertain POST, which could overwrite a newer edit.
   if(p.sent)continue;
   p.sent=true;keep();
   try{await send(p.row);}catch(e){}
   try{rows=await getCloud();if(found(rows,p.tx)){pending=pending.filter(x=>x.tx!==p.tx);keep();}}catch(e){}
  }
 }finally{syncing=false;status=pending.length?'Changes awaiting Google Sheets confirmation. Use REFRESH to check.':'Google Sheets synced ✓';render();}
}
function change(s,event,notes,done){
 if(!person||!date)return;
 const id=typeof s==='string'?s:s.id,sv=typeof s==='string'?services().find(x=>x.id===s):s;
 const old=data[key(person,date,id)];
 const stamp=new Date().toISOString(),tx=stamp+'-'+Math.random().toString(36).slice(2,10);
 const item={stamp,person,date,serviceId:id,code:str(sv?.code||old?.code),route:str(sv?.route||old?.route),notes:str(notes??old?.notes),done:done??old?.done??false,deleted:event==='REMOVE',tx};
 const row=[stamp,person,date,id,item.code,event,item.route,item.notes,item.done?'YES':'NO',tx];
 data[key(person,date,id)]=item;
 pending.push({...item,item,row,sent:false});keep();render();sync();
}
function activeItems(){return Object.values(data).filter(p=>p.person===person&&p.date===date&&!p.deleted).sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true}));}
function style(){
 if($('dpOneTapStyle'))return;
 const s=document.createElement('style');s.id='dpOneTapStyle';s.textContent='#michaelDayPlanner{color:#e8f3fb}#michaelDayPlanner .dpBox{background:#102c40;border:1px solid #426982;border-radius:12px;padding:14px;margin:12px 0}#michaelDayPlanner h2,#michaelDayPlanner h3{color:#f1b95f;margin:0 0 12px}#michaelDayPlanner .dpFields{display:flex;flex-wrap:wrap;gap:10px}#michaelDayPlanner label{flex:1;min-width:145px;font-size:12px;font-weight:bold;display:flex;flex-direction:column;gap:5px}#michaelDayPlanner input,#michaelDayPlanner select,#michaelDayPlanner textarea{box-sizing:border-box;width:100%;border:1px solid #5a829e;border-radius:7px;background:#0d2232;color:white;padding:10px;font:inherit;min-height:40px}#michaelDayPlanner textarea{min-height:75px}#michaelDayPlanner .dpColumns{display:grid;grid-template-columns:1fr 1fr;gap:12px}#michaelDayPlanner .dpColumns.dpPlannerOnly{grid-template-columns:minmax(0,1fr)}#michaelDayPlanner .dpSearchBox[hidden]{display:none!important}#michaelDayPlanner .dpList{max-height:490px;overflow:auto}#michaelDayPlanner .dpItem{padding:12px 0;border-bottom:1px solid #36566b;display:flex;justify-content:space-between;align-items:flex-start;gap:10px}#michaelDayPlanner .dpItem:last-child{border:0}#michaelDayPlanner .dpText{flex:1;min-width:0}#michaelDayPlanner .dpMuted{font-size:12px;color:#b6cad8;margin:5px 0}#michaelDayPlanner .dpBtns{display:flex;flex-wrap:wrap;gap:6px}#michaelDayPlanner .dpBtn{background:#24536e;color:white;border:1px solid #6488a0;border-radius:7px;padding:9px;font-weight:bold;font-size:11px;cursor:pointer;display:inline-block;text-decoration:none;min-height:34px}#michaelDayPlanner .dpBtn.primary{background:#eab758;color:#102538}#michaelDayPlanner .dpBtn:disabled{opacity:.55}#michaelDayPlanner .dpNotes{margin:9px 0 0}#michaelDayPlanner .dpStatus{font-size:12px;color:#c3d4df}#michaelDayPlanner .dpTag{font-size:10px;color:#ffd38c;margin-left:5px}@media(max-width:800px){#michaelDayPlanner .dpColumns{grid-template-columns:1fr}}@media print{#michaelDayPlanner .dpSearchBox,#michaelDayPlanner .dpBtn,#michaelDayPlanner .backBtn{display:none!important}}';
 document.head.appendChild(s);
}
function build(){
 if(!person||!window.InspectorCoverageModel)return;
 const home=$('home'),nav=home?.querySelector('.nav'),host=document.querySelector('.machine');if(!nav||!host)return;
 style();
 if(!$('dpNavButton')){const b=document.createElement('button');b.id='dpNavButton';b.type='button';b.dataset.open='michaelDayPlanner';b.innerHTML='<span class="navIcon">🗓️</span>My Day Planner';nav.insertBefore(b,nav.firstChild?.nextSibling||null);}
 if(!$('michaelDayPlanner')){
  const sec=document.createElement('section');sec.id='michaelDayPlanner';sec.className='section';
  sec.innerHTML='<button class="backBtn" data-open="home">← Back</button><div class="dpBox"><h2 id="dpTitle">DAY PLANNER</h2><p class="dpMuted">Tap a service to add it. No location or times needed. Your notes and planned services save to Google Sheets.</p><div class="dpFields"><label>Plan date<input id="dpDate" type="date"></label></div><p id="dpStatus" class="dpStatus"></p><div class="dpBtns"><button id="dpRefresh" class="dpBtn">REFRESH FROM GOOGLE SHEETS</button><button id="dpToggleServices" class="dpBtn" type="button" aria-controls="dpServicesPanel" aria-expanded="true">HIDE SERVICES NEEDING ATTENTION</button></div></div><div class="dpColumns" id="dpColumns"><div class="dpBox dpSearchBox" id="dpServicesPanel"><h3>Services needing attention</h3><div class="dpFields"><label>Search<input id="dpSearch" placeholder="Service or place"></label></div><div id="dpServices" class="dpList"></div></div><div class="dpBox"><h3>Services in your plan (<span id="dpCount">0</span>)</h3><div id="dpPlanned"></div></div></div>';
  host.appendChild(sec);
 }
 $('dpDate').value=date;$('dpTitle').textContent=person.toUpperCase()+'’S DAY PLANNER';$('dpSearch').value=query;
}
function render(){
 if(!person||!$('michaelDayPlanner'))return;
 $('dpStatus').textContent=status;
 const all=services(),filtered=all.filter(s=>!query||(s.code+' '+s.route).toLowerCase().includes(query));
 $('dpServicesPanel').hidden=!servicesVisible;
 $('dpColumns').classList.toggle('dpPlannerOnly',!servicesVisible);
 $('dpToggleServices').textContent=servicesVisible?'HIDE SERVICES NEEDING ATTENTION':'SHOW SERVICES NEEDING ATTENTION';
 $('dpToggleServices').setAttribute('aria-expanded',String(servicesVisible));
 const active=new Set(activeItems().map(p=>p.serviceId));
 $('dpServices').innerHTML=filtered.map(s=>'<div class="dpItem"><div class="dpText"><strong>'+esc(s.code)+'</strong> <span class="dpTag">'+esc(s.flag)+'</span><div class="dpMuted">'+esc(s.route)+'</div><div class="dpMuted">'+(s.last?'Last checked '+esc(s.last)+' · '+(Number.isFinite(s.days)?s.days+' day'+(s.days===1?'':'s')+' since last check':'Date unavailable'):'Never checked · no recorded date')+'</div></div><div class="dpBtns"><button type="button" class="dpBtn primary" data-dp-add="'+esc(s.id)+'"'+(active.has(s.id)?' disabled':'')+'>'+(active.has(s.id)?'ADDED':'ADD TO PLANNER')+'</button>'+(timesLink(s)?'<a class="dpBtn" target="_blank" rel="noopener noreferrer" href="'+esc(timesLink(s))+'">TIMETABLE ↗</a>':'<span class="dpMuted">Timetable unavailable</span>')+'</div></div>').join('')||'<p class="dpMuted">No matching services.</p>';
 const items=activeItems();$('dpCount').textContent=items.length;
 $('dpPlanned').innerHTML=items.map(p=>{
  const s=all.find(x=>x.id===p.serviceId),url=timesLink(s||p),id=esc(p.serviceId);
  return '<div class="dpItem"><div class="dpText"><strong>'+esc(p.code)+'</strong> <span class="dpTag">'+(p.done?'COMPLETED':'PLANNED')+'</span><div class="dpMuted">'+esc(p.route)+'</div><label class="dpNotes">Notes<textarea data-dp-note="'+id+'" placeholder="Enter notes for this service">'+esc(p.notes)+'</textarea></label><div class="dpBtns"><button type="button" class="dpBtn primary" data-dp-save="'+id+'">SAVE NOTES</button>'+(url?'<a class="dpBtn" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">TIMETABLE ↗</a>':'<span class="dpMuted">Times link unavailable</span>')+'<button type="button" class="dpBtn" data-dp-done="'+id+'">'+(p.done?'UNDO':'DONE')+'</button><button type="button" class="dpBtn" data-dp-remove="'+id+'">REMOVE</button></div></div></div>';
 }).join('')||'<p class="dpMuted">Select a service on the left to add it here.</p>';
}
function visibility(){
 const who=inspector();
 if(!who){if($('michaelDayPlanner')?.classList.contains('active')&&typeof openSection==='function')openSection('home');$('michaelDayPlanner')?.remove();$('dpNavButton')?.remove();person='';return;}
 if(who!==person){person=who;date=iso(new Date());query='';try{servicesVisible=localStorage.getItem('inspectorDayPlannerServicesVisible:'+who)!=='false';}catch(e){servicesVisible=true;}status='Loading Google Sheets…';}
 build();render();if(!requesting){requesting=true;refresh().finally(()=>requesting=false);}
}
function init(){
 if(started)return;started=true;local();visibility();
 document.addEventListener('inspector-hub-login-change',visibility);
 window.addEventListener('storage',e=>{if(e.key==='activeInspector'||e.key==='michaelLoginExpiresAt')visibility();if(e.key===CACHE||e.key===PENDING){local();render();}});
 document.addEventListener('click',e=>{
  const t=e.target;if(t.closest?.('[data-open="michaelDayPlanner"]')){setTimeout(visibility,30);return;}if(!person)return;
  const b=t.closest?.('[data-dp-add],[data-dp-save],[data-dp-done],[data-dp-remove]');
  if(b){
   const sv=b.dataset.dpAdd||b.dataset.dpSave||b.dataset.dpDone||b.dataset.dpRemove;
   if(b.hasAttribute('data-dp-add')){const s=services().find(x=>x.id===sv);if(s)change(s,'ADD','',false);}
   if(b.hasAttribute('data-dp-save')){const p=data[key(person,date,sv)],note=[...document.querySelectorAll('[data-dp-note]')].find(x=>x.dataset.dpNote===sv);if(p&&note)change(sv,'NOTES',note.value,p.done);}
   if(b.hasAttribute('data-dp-done')){const p=data[key(person,date,sv)];if(p)change(sv,'DONE',p.notes,!p.done);}
   if(b.hasAttribute('data-dp-remove')){const p=data[key(person,date,sv)];if(p&&confirm('Remove service '+p.code+' from your plan?'))change(sv,'REMOVE',p.notes,p.done);}
   return;
  }
  if(t.closest?.('#dpRefresh'))refresh();
  if(t.closest?.('#dpToggleServices')){servicesVisible=!servicesVisible;try{localStorage.setItem('inspectorDayPlannerServicesVisible:'+person,String(servicesVisible));}catch(e){}render();}
 });
 document.addEventListener('input',e=>{if(e.target.id==='dpSearch'){query=str(e.target.value).toLowerCase();render();}});
 document.addEventListener('change',e=>{
  if(e.target.id==='dpDate'&&/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)){date=e.target.value;render();}
  
 });
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){visibility();}});
 document.addEventListener('inspector-service-master-updated',render);
 const previous=window.renderAll;if(typeof previous==='function'&&!previous.inspectorDayPlannerWrapped){
  const wrapped=function(...args){const x=previous.apply(this,args);render();return x;};wrapped.inspectorDayPlannerWrapped=true;window.renderAll=wrapped;
 }
 setInterval(()=>{if(person&&$('michaelDayPlanner')?.classList.contains('active'))refresh();},120000);
}
let tries=0;const timer=setInterval(()=>{if(window.InspectorCoverageModel&&document.querySelector('.machine')&&$('home')&&typeof getInspector==='function'){clearInterval(timer);init();}else if(++tries>90)clearInterval(timer);},200);
})();