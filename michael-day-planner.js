/* Inspector Hub — Michael-only inspection day planner.
   Coverage: editable East Scotland master and shared check history.
   Timetables: published route-specific links and known route-wide first departure.
   Stop-level scheduled departure times are entered by the inspector after checking
   the timetable; none are fabricated by this tool. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const text=v=>String(v??'').trim();
const esc=v=>text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORE='inspectorHubMichaelDayPlansV1';
const DAY_MS=86400000;
const COMMON_STOPS=[
 'Halbeath Park & Ride','Kirkcaldy Bus Station','Glenrothes Bus Station',
 'Dunfermline Bus Station','Leven Bus Station','St Andrews Bus Station',
 'Victoria Hospital, Kirkcaldy','Ferrytoll Park & Ride',
 'Cowdenbeath High Street','Lochgelly North Street','Cupar Crossgate',
 'Rosyth','Dalgety Bay','Inverkeithing','Kinross Park & Ride',
 'Edinburgh Bus Station','Edinburgh Airport','Ballingry Turning Circle'
];
let plans={},selectedDate='',selectedId='',editingId='',viewFilter='due',query='',pending=false,booted=false;
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function dateFrom(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(text(s)))return null;const p=s.split('-').map(Number);const d=new Date(p[0],p[1]-1,p[2]);return d.getFullYear()===p[0]&&d.getMonth()===p[1]-1&&d.getDate()===p[2]?d:null;}
function displayDate(s){const d=dateFrom(s);return d?d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'}):s;}
function minute(s){const m=/^(\d{2}):(\d{2})$/.exec(text(s));return m?+m[1]*60+ +m[2]:NaN;}
function hhmm(n){const t=Math.max(0,Math.min(1439,Math.round(n)));return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
function michael(){let name='';try{name=typeof getInspector==='function'?getInspector():localStorage.getItem('activeInspector')||'';}catch(e){}return /^(?:m\.?\s*skinner|michael\s+skinner)$/i.test(text(name))&&Number(localStorage.getItem('michaelLoginExpiresAt')||0)>Date.now();}
function safeLink(s){const url=text(window.InspectorCoverageTimetableUrl?.(s)||'');return /^https:\/\/(?:www\.)?bustimes\.org\/services\/[a-z0-9/_-]+(?:\?[a-z0-9=&_%.-]*)?$/i.test(url)?url:'';}
function firstBus(s){
 const result=window.InspectorCoverageFirstDeparture?.(s);
 return result&&result.valid?text(result.text):'First departure not verified';
}
function status(s,ref){
 const last=window.InspectorCoverageModel.date(s.item?.date||s.original?.date||'');
 const dt=dateFrom(last),days=dt?Math.floor((Date.UTC(ref.getFullYear(),ref.getMonth(),ref.getDate())-Date.UTC(dt.getFullYear(),dt.getMonth(),dt.getDate()))/DAY_MS):Infinity;
 const never=!last&&!s.original;
 if(never)return {rank:0,flag:'NEVER CHECKED',cls:'never',days:Infinity,last:''};
 if(s.override?.status==='NOT_CHECKED'||!s.checked||days>14)return {rank:1,flag:'OVERDUE',cls:'overdue',days,last};
 return {rank:2,flag:'RECENT',cls:'recent',days,last};
}
function services(){
 const model=window.InspectorCoverageModel;if(!model)return[];
 const now=new Date();
 return model.status(model.defs()).filter(model.fifeService).map(s=>({...s,urgency:status(s,now)}))
  .sort((a,b)=>a.urgency.rank-b.urgency.rank||
   (b.urgency.days-a.urgency.days)||text(a.code).localeCompare(text(b.code),undefined,{numeric:true})||
   text(a.route).localeCompare(text(b.route)));
}
function readStorage(){
 try{
  const d=JSON.parse(localStorage.getItem(STORE)||'{}');
  plans=d&&typeof d==='object'&&!Array.isArray(d)?d:{};
 }catch(e){plans={};}
}
function saveStorage(){
 try{localStorage.setItem(STORE,JSON.stringify(plans));return true;}
 catch(e){alert('Unable to save the plan on this device. Export a copy before leaving this page.');return false;}
}
function day(){
 if(!plans[selectedDate]||typeof plans[selectedDate]!=='object')plans[selectedDate]={start:'08:00',finish:'16:00',base:'Halbeath Park & Ride',buffer:15,items:[]};
 const d=plans[selectedDate];
 if(!Array.isArray(d.items))d.items=[];
 return d;
}
function sheetNote(){
 const s=$('dpStorageNote');if(s)s.textContent='Plans are kept on this device only. Use EXPORT BACKUP to move them to another device. A planned time is not a confirmed bus departure.';
}
function styles(){
 if($('inspectorDayPlannerStyles'))return;
 const st=document.createElement('style');st.id='inspectorDayPlannerStyles';
 st.textContent=[
  '#michaelDayPlanner{color:#e8f3fb}',
  '#michaelDayPlanner .dpPanel{background:#102c40;border:1px solid #3f647e;border-radius:12px;margin:11px 0;padding:13px}',
  '#michaelDayPlanner .dpHero{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:center}',
  '#michaelDayPlanner .dpHero h2{margin:0;font-size:21px;color:#f1b95f}',
  '#michaelDayPlanner .dpIntro{color:#c0d3df;font-size:12px;line-height:1.5;margin:7px 0}',
  '#michaelDayPlanner .dpGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
  '#michaelDayPlanner .dpField{display:flex;flex-direction:column;min-width:0;gap:4px;font-size:11px;font-weight:800;color:#c8dae6}',
  '#michaelDayPlanner .dpField input,#michaelDayPlanner .dpField select,#michaelDayPlanner .dpField textarea{width:100%;min-width:0;box-sizing:border-box;border:1px solid #547994;border-radius:8px;background:#0d2232;color:#fff;font-size:15px;font-family:inherit;min-height:41px;padding:8px}',
  '#michaelDayPlanner .dpField textarea{min-height:67px;resize:vertical}',
  '#michaelDayPlanner .dpFull{grid-column:1/-1}',
  '#michaelDayPlanner .dpButton{background:#23506d;border:1px solid #6486a1;border-radius:8px;color:white;cursor:pointer;padding:9px 11px;min-height:40px;font-size:11px;font-weight:900;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:4px}',
  '#michaelDayPlanner .dpButton.primary{background:#e9b253;color:#102538;border-color:#e9b253}',
  '#michaelDayPlanner .dpButton.danger{background:#5d2732;border-color:#995466}',
  '#michaelDayPlanner .dpButton:disabled{opacity:.5;cursor:not-allowed}',
  '#michaelDayPlanner .dpActions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}',
  '#michaelDayPlanner .dpStats{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}',
  '#michaelDayPlanner .dpChip{display:inline-flex;gap:4px;align-items:center;background:#183e54;border:1px solid #4d718a;border-radius:7px;font-size:11px;font-weight:800;padding:7px 9px}',
  '#michaelDayPlanner .dpChip.never{border-left:5px solid #e35d65}#michaelDayPlanner .dpChip.overdue{border-left:5px solid #efbc4f}#michaelDayPlanner .dpChip.recent{border-left:5px solid #4dbd86}',
  '#michaelDayPlanner .dpPriority{max-height:430px;overflow:auto;overscroll-behavior:contain;border-radius:9px;border:1px solid #335a73}',
  '#michaelDayPlanner .dpService{padding:11px;border-bottom:1px solid #335369;display:flex;align-items:start;justify-content:space-between;gap:11px}',
  '#michaelDayPlanner .dpService:last-child{border-bottom:0}',
  '#michaelDayPlanner .dpServiceInfo{min-width:0;flex:1}',
  '#michaelDayPlanner .dpServiceInfo strong{font-size:16px}',
  '#michaelDayPlanner .dpRoute{font-size:11px;color:#d0e0e8;line-height:1.4;margin-top:3px;overflow-wrap:anywhere}',
  '#michaelDayPlanner .dpSmall{color:#b9cedd;font-size:11px;line-height:1.45;margin:5px 0}',
  '#michaelDayPlanner .dpPill{display:inline-block;font-size:9px;font-weight:950;letter-spacing:.03em;padding:3px 5px;border-radius:5px;border:1px solid currentColor;margin-left:6px}',
  '#michaelDayPlanner .dpPill.never{color:#ff929a}#michaelDayPlanner .dpPill.overdue{color:#f6ca71}#michaelDayPlanner .dpPill.recent{color:#89e2b2}',
  '#michaelDayPlanner .dpRowActions{display:flex;flex-direction:column;gap:7px;min-width:98px}',
  '#michaelDayPlanner .dpRowActions .dpButton{font-size:10px;min-height:35px;padding:5px 7px}',
  '#michaelDayPlanner .dpSelected{font-size:12px;font-weight:850;background:#1b435b;border:1px solid #658aa2;border-radius:8px;padding:10px;margin:9px 0;overflow-wrap:anywhere}',
  '#michaelDayPlanner .dpPlanItem{border-left:6px solid #e4b65d;border-radius:10px;background:#16364b;padding:11px;margin:9px 0;display:flex;justify-content:space-between;gap:8px}',
  '#michaelDayPlanner .dpPlanItem.done{border-left-color:#53b988;opacity:.87}',
  '#michaelDayPlanner .dpPlanMain{min-width:0;flex:1;line-height:1.45}',
  '#michaelDayPlanner .dpPlanMain strong{font-size:15px;line-height:1.3}',
  '#michaelDayPlanner .dpPlanTime{color:#f4bf70;font-variant-numeric:tabular-nums;font-size:16px;font-weight:950;margin:0 0 5px}',
  '#michaelDayPlanner .dpPlanNotes{font-size:11px;color:#d0e0e9;white-space:pre-wrap;overflow-wrap:anywhere;margin-top:6px}',
  '#michaelDayPlanner .dpPlanActions{display:flex;flex-direction:column;gap:6px;flex:none}',
  '#michaelDayPlanner .dpPlanActions .dpButton{padding:5px 7px;font-size:10px;min-height:32px}',
  '#michaelDayPlanner .dpWarning{color:#ffcca0;background:#563c2a;border:1px solid #bd8b52;padding:9px;border-radius:8px;font-size:11px;margin:8px 0;line-height:1.5}',
  '#michaelDayPlanner .dpEmpty{font-size:12px;color:#b9d0e2;padding:18px;text-align:center}',
  '#michaelDayPlanner .dpTwoCol{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}',
  '#michaelDayPlanner .dpH3{margin:0 0 9px;font-size:15px;color:#f4c375}',
  '#michaelDayPlanner .dpNotes{font-size:10px;color:#b9cddc;line-height:1.5;margin:8px 0 0}',
  '#michaelDayPlanner .dpHidden{display:none!important}',
  '@media(max-width:840px){#michaelDayPlanner .dpTwoCol{grid-template-columns:1fr}}',
  '@media(max-width:530px){#michaelDayPlanner .dpGrid{grid-template-columns:1fr}#michaelDayPlanner .dpFull{grid-column:auto}#michaelDayPlanner .dpService{gap:7px}#michaelDayPlanner .dpRowActions{min-width:78px}#michaelDayPlanner .dpHero h2{font-size:19px}#michaelDayPlanner .dpButton{padding:8px;font-size:10px}}',
  '@media print{body *{visibility:hidden!important}#michaelDayPlanner,#michaelDayPlanner *{visibility:visible!important}#michaelDayPlanner{position:absolute;left:0;top:0;width:100%;color:#000!important;background:white!important}#michaelDayPlanner .dpPanel{background:white!important;color:#000!important;border-color:#aaa!important;break-inside:avoid}#michaelDayPlanner #dpControls,#michaelDayPlanner #dpPriorityPanel,#michaelDayPlanner #dpEditorPanel,#michaelDayPlanner .dpActions,#michaelDayPlanner .backBtn,#michaelDayPlanner #dpStorageNote{display:none!important}#michaelDayPlanner .dpPlanItem{background:white!important;color:#000!important;border:1px solid #999;break-inside:avoid}#michaelDayPlanner .dpPlanMain,#michaelDayPlanner .dpPlanMain *{color:#000!important}#michaelDayPlanner .dpPlanTime{color:#000!important}}'
 ].join('');
 document.head.appendChild(st);
}
function build(){
 if(!michael())return false;
 const home=$('home'),nav=home?.querySelector('.nav'),host=document.querySelector('.machine');
 if(!home||!nav||!host||!window.InspectorCoverageModel)return false;
 styles();
 if(!$('dpNavButton')){
  const button=document.createElement('button');button.id='dpNavButton';button.type='button';button.dataset.open='michaelDayPlanner';
  button.innerHTML='<span class="navIcon">🗓️</span>My Day Planner';
  nav.insertBefore(button,nav.firstChild?.nextSibling||null);
 }
 if(!$('michaelDayPlanner')){
  const sec=document.createElement('section');sec.id='michaelDayPlanner';sec.className='section';
  sec.innerHTML=[
   '<button class="backBtn" data-open="home">← Back</button>',
   '<div class="dpPanel" id="dpControls"><div class="dpHero"><h2>🗓️ MICHAEL’S DAY PLANNER</h2><span class="dpChip">FIFE &amp; SURROUNDING</span></div>',
   '<p class="dpIntro">Plan inspections from your live coverage priorities. Never-checked and overdue services come first. Use the published timetable to choose the exact stop and scheduled time.</p>',
   '<div class="dpGrid"><label class="dpField">Plan date<input id="dpDate" type="date"></label><label class="dpField">Starting location<input id="dpBase" type="text" list="dpStopSuggestions" placeholder="Where will you start?"></label>',
   '<label class="dpField">Start time<input id="dpStart" type="time" value="08:00"></label><label class="dpField">Finish time<input id="dpFinish" type="time" value="16:00"></label>',
   '<label class="dpField">Minimum gap between locations (minutes)<input id="dpBuffer" type="number" min="0" max="120" step="5" value="15"></label>',
   '<label class="dpField">Target number of checks<input id="dpTarget" type="number" min="1" max="40" value="12"></label></div>',
   '<div id="dpStats" class="dpStats"></div></div>',
   '<div class="dpTwoCol"><div class="dpPanel" id="dpPriorityPanel"><h3 class="dpH3">Services needing attention</h3>',
   '<div class="dpGrid"><label class="dpField">Find service or location<input id="dpSearch" placeholder="e.g. 7, Kirkcaldy, Leven"></label>',
   '<label class="dpField">Show<select id="dpFilter"><option value="due">Never checked &amp; overdue</option><option value="never">Never checked only</option><option value="all">All services</option></select></label></div>',
   '<p class="dpNotes">Priorities update from shared inspections, timing checks and manual coverage amendments. Timetables open the correct published route.</p>',
   '<div class="dpPriority" id="dpPriorityList"></div></div>',
   '<div class="dpPanel" id="dpEditorPanel"><h3 class="dpH3" id="dpEditorHeading">Add a check to your plan</h3>',
   '<div class="dpSelected" id="dpChosenService">Select a service from the priority list.</div>',
   '<div class="dpGrid"><label class="dpField dpFull">Where will you check it? (stop/location)<input id="dpStop" list="dpStopSuggestions" placeholder="Enter the actual stop, bus station or street"></label>',
   '<label class="dpField">Planned check time<input id="dpAt" type="time"></label><label class="dpField">Published scheduled time (optional)<input id="dpScheduled" type="time"></label>',
   '<label class="dpField">Duration (minutes)<input id="dpDuration" type="number" min="5" max="180" step="5" value="15"></label>',
   '<label class="dpField">Type<select id="dpType"><option>Inspection</option><option>Timing check</option><option>Revenue check</option><option>Observation</option></select></label>',
   '<label class="dpField dpFull">Notes / what to look for<textarea id="dpNotes" rows="2" placeholder="e.g. concession checks, NSA, driver DQC"></textarea></label></div>',
   '<div id="dpFirstBus" class="dpSmall"></div><div class="dpActions"><a id="dpTimetable" class="dpButton" target="_blank" rel="noopener noreferrer" href="#" hidden>VIEW PUBLISHED TIMETABLE ↗</a>',
   '<button id="dpAdd" class="dpButton primary" type="button">ADD TO DAY PLAN</button><button id="dpCancel" class="dpButton" type="button">CLEAR SELECTION</button></div>',
   '<p class="dpNotes">The planner does not invent stop times. Read the actual departure on the linked timetable, then enter it above. A chosen check time is a plan, not a verified timetable entry.</p>',
   '</div></div>',
   '<div class="dpPanel" id="dpItineraryPanel"><div class="dpHero"><h3 class="dpH3">Your inspection day</h3><span class="dpChip" id="dpPlanCount">0 checks</span></div>',
   '<div id="dpWarnings"></div><div id="dpItinerary"></div>',
   '<div class="dpActions"><button class="dpButton primary" id="dpPrint" type="button">PRINT DAY PLAN</button>',
   '<button class="dpButton" id="dpExportCsv" type="button">EXPORT CSV</button>',
   '<button class="dpButton" id="dpExportBackup" type="button">EXPORT BACKUP</button>',
   '<label class="dpButton" for="dpImportBackup">IMPORT BACKUP<input id="dpImportBackup" type="file" accept="application/json,.json" style="display:none"></label></div>',
   '<p class="dpNotes" id="dpStorageNote"></p></div>',
   '<datalist id="dpStopSuggestions"></datalist>'
  ].join('');
  host.appendChild(sec);
 }
 const first=!selectedDate;
 if(first){readStorage();selectedDate=iso(new Date());}
 $('dpDate').value=selectedDate;
 restoreDayMeta();
 render();
 return true;
}
function visibility(){
 if(!michael()){
  if($('michaelDayPlanner')?.classList.contains('active')&&typeof openSection==='function')openSection('home');
  $('dpNavButton')?.remove();
  $('michaelDayPlanner')?.remove();
  selectedId='';editingId='';selectedDate='';
  return false;
 }
 return build();
}
function restoreDayMeta(){
 const d=day();
 if($('dpStart'))$('dpStart').value=d.start||'08:00';
 if($('dpFinish'))$('dpFinish').value=d.finish||'16:00';
 if($('dpBase'))$('dpBase').value=d.base||'';
 if($('dpBuffer'))$('dpBuffer').value=String(Number.isFinite(Number(d.buffer))?d.buffer:15);
 if($('dpTarget'))$('dpTarget').value=String(Number(d.target)||12);
}
function storeDayMeta(){
 if(!selectedDate||!michael())return;
 const d=day();
 d.start=$('dpStart').value||'08:00';d.finish=$('dpFinish').value||'16:00';
 d.base=text($('dpBase').value);d.buffer=Math.max(0,Math.min(120,Number($('dpBuffer').value)||0));
 d.target=Math.max(1,Math.min(40,Number($('dpTarget').value)||12));
 saveStorage();
 renderItinerary();
}
function guessedStops(s){
 const endpoints=text(s?.route).split(/\s+-\s+|\s+to\s+/i).map(text).filter(Boolean);
 const cleanEndpoint=v=>v.replace(/\b(\\b(?:Bus Station|Turning Circle|Park & Ride|P&R)).*$/i,'$1').trim();
 return [...new Set([...endpoints.map(cleanEndpoint),...COMMON_STOPS].filter(Boolean))].slice(0,45);
}
function selectService(id){
 if(!michael())return;
 const s=services().find(x=>x.id===id);if(!s)return;
 selectedId=id;editingId='';
 $('dpEditorHeading').textContent='Add a check to your plan';
 $('dpAdd').textContent='ADD TO DAY PLAN';
 $('dpChosenService').textContent='SERVICE '+s.code+' · '+s.route;
 $('dpStop').value='';
 $('dpScheduled').value='';
 $('dpDuration').value='15';$('dpType').value='Inspection';$('dpNotes').value='';
 const d=day(),last=d.items.slice().sort((a,b)=>minute(a.at)-minute(b.at)).at(-1);
 const suggested=last&&Number.isFinite(minute(last.at))?minute(last.at)+Number(last.duration||15)+Number(d.buffer||0):minute(d.start||'08:00');
 $('dpAt').value=hhmm(suggested);
 const stops=guessedStops(s);
 $('dpStopSuggestions').innerHTML=stops.map(x=>'<option value="'+esc(x)+'"></option>').join('');
 const url=safeLink(s),link=$('dpTimetable');link.hidden=!url;if(url)link.href=url;else link.removeAttribute('href');
 $('dpFirstBus').textContent=firstBus(s)+' · route-wide indicative information only. Check the exact stop and day in the published timetable.';
 $('dpStop').focus();
}
function clearEditor(){
 selectedId='';editingId='';
 if($('dpChosenService'))$('dpChosenService').textContent='Select a service from the priority list.';
 for(const id of ['dpStop','dpAt','dpScheduled','dpNotes'])if($(id))$(id).value='';
 if($('dpDuration'))$('dpDuration').value='15';
 if($('dpType'))$('dpType').value='Inspection';
 if($('dpEditorHeading'))$('dpEditorHeading').textContent='Add a check to your plan';
 if($('dpAdd'))$('dpAdd').textContent='ADD TO DAY PLAN';
 if($('dpFirstBus'))$('dpFirstBus').textContent='';
 if($('dpTimetable'))$('dpTimetable').hidden=true;
}
function addCheck(){
 if(!michael()||!selectedId){alert('Select a service first.');return;}
 const s=services().find(x=>x.id===selectedId);
 const at=$('dpAt').value,stop=text($('dpStop').value),duration=Number($('dpDuration').value);
 if(!s||!stop||!Number.isFinite(minute(at))){alert('Enter a checking location and a planned time.');return;}
 if(!Number.isFinite(duration)||duration<5||duration>180){alert('Choose a duration between 5 and 180 minutes.');return;}
 const d=day();
 const record={id:editingId||String(Date.now())+'-'+Math.random().toString(36).slice(2,8),serviceId:s.id,code:s.code,route:s.route,
  at,scheduled:$('dpScheduled').value||'',location:stop,duration,type:$('dpType').value,notes:text($('dpNotes').value),done:false};
 const old=d.items.find(x=>x.id===editingId);
 if(old)record.done=!!old.done;
 if(editingId){const index=d.items.findIndex(x=>x.id===editingId);if(index>=0)d.items[index]=record;else d.items.push(record);}
 else d.items.push(record);
 if(!saveStorage())return;
 clearEditor();render();
}
function editCheck(id){
 const p=day().items.find(x=>x.id===id);if(!p)return;
 selectService(p.serviceId);
 editingId=id;selectedId=p.serviceId;
 $('dpChosenService').textContent='EDIT SERVICE '+p.code+' · '+p.route;
 $('dpEditorHeading').textContent='Edit planned check';
 $('dpAdd').textContent='SAVE CHANGES';
 $('dpAt').value=p.at;$('dpStop').value=p.location;$('dpScheduled').value=p.scheduled||'';
 $('dpDuration').value=String(p.duration);$('dpType').value=p.type||'Inspection';$('dpNotes').value=p.notes||'';
 $('dpEditorPanel').scrollIntoView({behavior:'smooth',block:'start'});
}
function removeCheck(id){
 const d=day();const p=d.items.find(x=>x.id===id);if(!p)return;
 if(!confirm('Remove service '+p.code+' from this day plan?'))return;
 d.items=d.items.filter(x=>x.id!==id);saveStorage();render();
}
function toggleDone(id){
 const p=day().items.find(x=>x.id===id);if(!p)return;
 p.done=!p.done;saveStorage();renderItinerary();
}
function renderPriority(){
 const box=$('dpPriorityList');if(!box)return;
 const all=services(),filtered=all.filter(s=>(viewFilter==='all'||(viewFilter==='never'?s.urgency.rank===0:s.urgency.rank<2))&&
  (!query||(s.code+' '+s.route).toLowerCase().includes(query)));
 const scheduled=new Map();
 day().items.forEach(p=>scheduled.set(p.serviceId,(scheduled.get(p.serviceId)||0)+1));
 const stats=$('dpStats');if(stats)stats.innerHTML=[
  '<span class="dpChip never">'+all.filter(s=>s.urgency.rank===0).length+' never checked</span>',
  '<span class="dpChip overdue">'+all.filter(s=>s.urgency.rank===1).length+' overdue</span>',
  '<span class="dpChip recent">'+all.filter(s=>s.urgency.rank===2).length+' recent</span>',
  '<span class="dpChip">'+all.length+' Fife services</span>'
 ].join('');
 box.innerHTML=filtered.length?filtered.map(s=>{
  const u=s.urgency,url=safeLink(s),count=scheduled.get(s.id)||0;
  const meta=u.rank===0?'No recorded inspection / timing check':u.last?'Last checked '+u.last+(Number.isFinite(u.days)?' · '+u.days+' days ago':''):'No valid last-check date';
  return '<article class="dpService"><div class="dpServiceInfo"><strong>'+esc(s.code)+'</strong><span class="dpPill '+u.cls+'">'+u.flag+'</span>'+
   '<div class="dpRoute">'+esc(s.route)+'</div><div class="dpSmall">'+esc(meta)+'</div>'+
   '<div class="dpSmall">'+esc(firstBus(s))+' (route-wide)</div>'+
   (count?'<span class="dpChip">Already planned '+count+' time'+(count===1?'':'s')+'</span>':'')+
   '</div><div class="dpRowActions"><button class="dpButton primary" type="button" data-dp-select="'+esc(s.id)+'">PLAN THIS</button>'+
   (url?'<a class="dpButton" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">TIMETABLE ↗</a>':'')+'</div></article>';
 }).join(''):'<p class="dpEmpty">No services match this filter.</p>';
}
function warnings(){
 const d=day(),ordered=d.items.slice().sort((a,b)=>minute(a.at)-minute(b.at));
 const problems=[],start=minute(d.start),finish=minute(d.finish),buffer=Number(d.buffer)||0;
 if(Number.isFinite(start)&&Number.isFinite(finish)&&finish<=start)problems.push('The finish time must be after your start time.');
 ordered.forEach((p,i)=>{
  const tm=minute(p.at),ends=tm+Number(p.duration||15);
  if(Number.isFinite(start)&&tm<start)problems.push('Service '+p.code+' at '+p.at+' is before your day starts.');
  if(Number.isFinite(finish)&&ends>finish)problems.push('Service '+p.code+' finishes after your selected end time.');
  if(i){
   const prev=ordered[i-1],prevEnd=minute(prev.at)+Number(prev.duration||15),gap=tm-prevEnd;
   if(gap<0)problems.push('Time clash: '+prev.code+' and '+p.code+' overlap.');
   else if(gap<buffer&&text(prev.location).toLowerCase()!==text(p.location).toLowerCase())
    problems.push('Allow more travel time between '+prev.code+' and '+p.code+' ('+gap+' min gap).');
  }
 });
 return [...new Set(problems)];
}
function directions(from,to){
 if(!text(from)||!text(to))return'';
 return 'https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(from+' Scotland')+'&destination='+encodeURIComponent(to+' Scotland')+'&travelmode=driving';
}
function renderItinerary(){
 const box=$('dpItinerary');if(!box)return;
 const d=day(),ordered=d.items.slice().sort((a,b)=>minute(a.at)-minute(b.at)),done=ordered.filter(p=>p.done).length;
 $('dpPlanCount').textContent=ordered.length+' planned · '+done+' completed';
 const issues=warnings();
 $('dpWarnings').innerHTML=issues.length?issues.map(x=>'<div class="dpWarning">⚠ '+esc(x)+'</div>').join(''):'';
 const origin=d.base||'';
 box.innerHTML=ordered.length?ordered.map((p,i)=>{
  const svc=services().find(s=>s.id===p.serviceId);
  const link=safeLink(svc||p),travel=directions(i?ordered[i-1].location:origin,p.location);
  return '<article class="dpPlanItem'+(p.done?' done':'')+'"><div class="dpPlanMain">'+
   '<div class="dpPlanTime">'+esc(p.at)+'–'+esc(hhmm(minute(p.at)+Number(p.duration||15)))+' · '+esc(p.type||'Inspection')+'</div>'+
   '<strong>'+esc(p.code)+' — '+esc(p.location)+'</strong>'+
   '<div class="dpRoute">'+esc(p.route)+'</div>'+
   '<div class="dpSmall">Scheduled at stop: '+(p.scheduled?esc(p.scheduled):'Not entered — check timetable')+' · '+(p.done?'COMPLETED':'PLANNED')+'</div>'+
   (p.notes?'<div class="dpPlanNotes">'+esc(p.notes)+'</div>':'')+
   '<div class="dpActions">'+(link?'<a class="dpButton" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">TIMETABLE ↗</a>':'')+
   (travel?'<a class="dpButton" href="'+esc(travel)+'" target="_blank" rel="noopener noreferrer">DRIVING DIRECTIONS ↗</a>':'')+'</div>'+
   '</div><div class="dpPlanActions"><button class="dpButton" data-dp-done="'+esc(p.id)+'" type="button">'+(p.done?'UNDO':'DONE')+'</button>'+
   '<button class="dpButton" data-dp-edit="'+esc(p.id)+'" type="button">EDIT</button><button class="dpButton danger" data-dp-remove="'+esc(p.id)+'" type="button">REMOVE</button></div></article>';
 }).join(''):'<p class="dpEmpty">No checks planned yet. Choose a priority service, consult its timetable and add a location and time.</p>';
 sheetNote();
}
function render(){if(!michael()||!$('michaelDayPlanner'))return;renderPriority();renderItinerary();}
function file(name,content,mime){
 const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function csvCell(s){return '"'+text(s).replace(/"/g,'""')+'"';}
function exportCsv(){
 const d=day(),head=['Date','Planned from','Planned to','Service','Route','Location','Scheduled stop time','Activity','Completed','Notes','Timetable'];
 const rows=d.items.slice().sort((a,b)=>minute(a.at)-minute(b.at)).map(p=>{
  const s=services().find(x=>x.id===p.serviceId);
  return [selectedDate,p.at,hhmm(minute(p.at)+Number(p.duration||15)),p.code,p.route,p.location,p.scheduled||'',p.type,p.done?'Yes':'No',p.notes,safeLink(s||p)].map(csvCell).join(',');
 });
 file('Michael-Inspection-Plan-'+selectedDate+'.csv','\ufeff'+head.map(csvCell).join(',')+'\r\n'+rows.join('\r\n'),'text/csv;charset=utf-8');
}
function exportBackup(){
 file('Michael-Day-Planner-Backup-'+iso(new Date())+'.json',JSON.stringify({kind:'inspectorHubMichaelDayPlansV1',plans},null,2),'application/json;charset=utf-8');
}
async function importBackup(e){
 const input=e.target,f=input.files?.[0];if(!f)return;
 try{
  if(f.size>1000000)throw new Error('Backup file is too large');
  const data=JSON.parse(await f.text());
  if(data?.kind!=='inspectorHubMichaelDayPlansV1'||!data.plans||typeof data.plans!=='object'||Array.isArray(data.plans))throw new Error('Unrecognised day planner backup');
  const cleaned={};
  for(const [dayId,d] of Object.entries(data.plans)){
   if(!dateFrom(dayId)||!d||!Array.isArray(d.items))continue;
   cleaned[dayId]={start:/^\d{2}:\d{2}$/.test(d.start)?d.start:'08:00',
    finish:/^\d{2}:\d{2}$/.test(d.finish)?d.finish:'16:00',
    base:text(d.base).slice(0,180),buffer:Math.max(0,Math.min(120,Number(d.buffer)||0)),
    target:Math.max(1,Math.min(40,Number(d.target)||12)),
    items:d.items.slice(0,100).filter(p=>p&&p.id&&p.serviceId&&p.location&&Number.isFinite(minute(p.at))).map(p=>({
     id:text(p.id).slice(0,100),serviceId:text(p.serviceId).slice(0,100),code:text(p.code).slice(0,20),
     route:text(p.route).slice(0,250),at:p.at,scheduled:/^\d{2}:\d{2}$/.test(p.scheduled||'')?p.scheduled:'',
     location:text(p.location).slice(0,220),duration:Math.max(5,Math.min(180,Number(p.duration)||15)),
     type:['Inspection','Timing check','Revenue check','Observation'].includes(p.type)?p.type:'Inspection',
     notes:text(p.notes).slice(0,2000),done:!!p.done
    }))};
  }
  if(!Object.keys(cleaned).length)throw new Error('No valid dated plans found');
  if(!confirm('Import '+Object.keys(cleaned).length+' day plans? This will replace plans on this device.'))return;
  plans=cleaned;saveStorage();restoreDayMeta();clearEditor();render();alert('Day plans imported.');
 }catch(err){alert('Unable to import backup: '+err.message);}
 finally{input.value='';}
}
function activate(){
 if(!michael())return;
 if(!$('michaelDayPlanner')&&!build())return;
 selectedDate=$('dpDate').value||selectedDate||iso(new Date());
 render();
}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;if(michael())render();});}
function init(){
 if(booted)return;booted=true;
 readStorage();
 selectedDate=iso(new Date());
 visibility();
 document.addEventListener('inspector-hub-login-change',()=>{visibility();});
 window.addEventListener('storage',e=>{
  if(e.key==='activeInspector'||e.key==='michaelLoginExpiresAt')visibility();
  if(e.key===STORE){readStorage();schedule();}
 });
 document.addEventListener('inspector-service-master-updated',schedule);
 document.addEventListener('click',e=>{
  const target=e.target;
  if(target.closest?.('[data-open="michaelDayPlanner"]')){if(!michael()){e.preventDefault();e.stopImmediatePropagation();visibility();return;}setTimeout(activate,50);}
  if(!michael())return;
  const find=key=>target.closest?.('['+key+']');
  if(find('data-dp-select')){selectService(find('data-dp-select').dataset.dpSelect);return;}
  if(find('data-dp-edit')){editCheck(find('data-dp-edit').dataset.dpEdit);return;}
  if(find('data-dp-remove')){removeCheck(find('data-dp-remove').dataset.dpRemove);return;}
  if(find('data-dp-done')){toggleDone(find('data-dp-done').dataset.dpDone);return;}
  if(target.closest?.('#dpAdd')){addCheck();return;}
  if(target.closest?.('#dpCancel')){clearEditor();return;}
  if(target.closest?.('#dpPrint')){window.print();return;}
  if(target.closest?.('#dpExportCsv')){exportCsv();return;}
  if(target.closest?.('#dpExportBackup')){exportBackup();return;}
 });
 document.addEventListener('input',e=>{
  if(!michael())return;
  if(e.target.id==='dpSearch'){query=text(e.target.value).toLowerCase();renderPriority();}
 });
 document.addEventListener('change',e=>{
  if(!michael())return;
  const id=e.target.id;
  if(id==='dpDate'){
   if(!dateFrom(e.target.value))return;
   selectedDate=e.target.value;clearEditor();restoreDayMeta();render();return;
  }
  if(id==='dpFilter'){viewFilter=e.target.value;renderPriority();return;}
  if(['dpStart','dpFinish','dpBase','dpBuffer','dpTarget'].includes(id)){storeDayMeta();return;}
  if(id==='dpScheduled'&&e.target.value&&!$('dpAt').value){
   const when=minute(e.target.value);if(Number.isFinite(when))$('dpAt').value=hhmm(when-5);
  }
  if(id==='dpImportBackup'){importBackup(e);}
 });
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){visibility();schedule();}});
 const prior=window.renderAll;
 if(typeof prior==='function'&&!prior.inspectorDayPlannerWrapped){
  const wrap=function(...args){const result=prior.apply(this,args);schedule();return result;};
  wrap.inspectorDayPlannerWrapped=true;window.renderAll=wrap;
 }
 setInterval(()=>{visibility();if(michael()&&$('michaelDayPlanner')?.classList.contains('active'))schedule();},60000);
}
let tries=0;
const timer=setInterval(()=>{if(window.InspectorCoverageModel&&document.querySelector('.machine')&&$('home')&&typeof getInspector==='function'){clearInterval(timer);init();}
 else if(++tries>90)clearInterval(timer);
},200);
})();
