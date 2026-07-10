const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz3LPrQ7Y1b7Suq7OvYSyoqoW4iYrAzNjBq6Li7t4SbtrfriBjH16e5iGG2ZRTKyjzk0A/exec';
const sheets = ['Inspections','NSA Faults','Driver Reports','Early Running','Ticket Log'];
let cloud = Object.fromEntries(sheets.map(s => [s, []]));
let tickets = JSON.parse(localStorage.getItem('cloudTickets') || '[]');
let lastTicket = tickets.length ? tickets.at(-1).type : 'None';
let checkFilter = localStorage.getItem('checkFilter') || 'today';

const $ = id => document.getElementById(id);
function today(){return new Date().toLocaleDateString();}
function now(){return new Date().toLocaleTimeString();}
function esc(v){return `"${String(v ?? '').replace(/"/g,'""')}"`;}
function setStatus(t){$('syncStatus').textContent = t;}
function download(name,text){const b=new Blob([text],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();}

function openSection(id){document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));$(id).classList.add('active');window.scrollTo(0,0);}
function getInspector(){const v=$('inspectorSelect').value;return v==='Other'?($('otherInspector').value||'Other'):v;}
function saveInspector(){localStorage.setItem('inspectorName',$('inspectorSelect').value);localStorage.setItem('otherInspectorName',$('otherInspector').value);$('otherInspector').style.display=$('inspectorSelect').value==='Other'?'block':'none';}
function initInspector(){$('inspectorSelect').value=localStorage.getItem('inspectorName')||'M Skinner';$('otherInspector').value=localStorage.getItem('otherInspectorName')||'';saveInspector();}

async function cloudAppend(sheet,row){
 setStatus('Saving to cloud...');
 try{await fetch(WEB_APP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sheet,row})});setStatus('Saved to cloud.');}
 catch(e){setStatus('Cloud save failed. Saved on this device.');}
 const key='local_'+sheet;const arr=JSON.parse(localStorage.getItem(key)||'[]');arr.push(row);localStorage.setItem(key,JSON.stringify(arr));
}
async function loadCloud(){
 setStatus('Loading cloud data...');
 for(const sheet of sheets){try{const res=await fetch(WEB_APP_URL+'?sheet='+encodeURIComponent(sheet));const json=await res.json();cloud[sheet]=json.data||[];}catch(e){console.log(e);}}
 setStatus('Cloud data loaded.');renderAll();
}

function saveCheckSheet(){
 const row=[$('csDate').value||today(),now(),getInspector(),$('csDepot').value,$('csDriver').value,$('csService').value,$('csFleet').value,$('csTimeOn').value,$('csBoarding').value,$('csDestination').value,$('csNSA').value,$('csNSAFault').value,$('csNSANotes').value,$('csDriverReport').value,$('csDriverReason').value];
 cloudAppend('Inspections',row);
 if($('csNSA').value==='No') cloudAppend('NSA Faults',[$('csDate').value||today(),now(),getInspector(),$('csDepot').value,$('csFleet').value,$('csService').value,$('csDriver').value,$('csNSAFault').value,$('csNSANotes').value,$('csBoarding').value,$('csDestination').value]);
 if($('csDriverReport').value!=='No Driver Report') cloudAppend('Driver Reports',[$('csDate').value||today(),now(),getInspector(),$('csDriver').value,$('csDepot').value,$('csDriverReport').value,$('csDriverReason').value,$('csService').value,$('csFleet').value]);
 clearCheckForm();setTimeout(loadCloud,1200);
}
function clearCheckForm(){['csDepot','csDriver','csService','csFleet','csTimeOn','csBoarding','csDestination','csNSANotes','csDriverReason'].forEach(id=>$(id).value='');$('csNSA').value='Yes';$('csDriverReport').value='No Driver Report';}

function parseRowDate(v){const d=new Date(v);if(!isNaN(d))return d;const p=String(v||'').split('/');if(p.length===3)return new Date(p[2].length===2?'20'+p[2]:p[2],p[1]-1,p[0]);return new Date();}
function sameDay(a,b){return a.toDateString()===b.toDateString();}
function startOfWeek(d){const x=new Date(d);const day=x.getDay();x.setDate(x.getDate()-day+(day===0?-6:1));x.setHours(0,0,0,0);return x;}
function inThisWeek(d){const s=startOfWeek(new Date()),e=new Date(s);e.setDate(s.getDate()+7);return d>=s&&d<e;}
function inThisMonth(d){const n=new Date();return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth();}
function statusClass(r){if(r[13]==='Offence Report Submitted')return 'offence';if(r[13]==='Advised')return 'advised';if(r[10]==='No')return 'nsa';return '';}
function statusMark(r){if(r[13]==='Offence Report Submitted')return 'OFFENCE';if(r[13]==='Advised')return 'ADVISED';if(r[10]==='No')return 'NSA';return 'OK';}
function renderChecks(){
 let rows=(cloud['Inspections']||[]).slice(1);
 const q=($('checkSearch').value||'').toLowerCase(), n=new Date();
 rows=rows.filter(r=>{const d=parseRowDate(r[0]); if(checkFilter==='today'&&!sameDay(d,n))return false; if(checkFilter==='week'&&!inThisWeek(d))return false; if(checkFilter==='month'&&!inThisMonth(d))return false; if(q&&!r.join(' ').toLowerCase().includes(q))return false; return true;});
 $('checkList').innerHTML=rows.reverse().map((r,i)=>`<div class="compactCheck ${statusClass(r)}"><div class="compactTop" data-toggle="cd${i}"><div class="compactMain">${r[0]||'-'} ${r[7]||''} | ${r[5]||'-'} | ${r[6]||'-'} | ${r[4]||'-'} | ${statusMark(r)}</div><div class="compactSub">${r[3]||'-'} • ${r[8]||'-'} → ${r[9]||'-'} • ${r[2]||'-'}</div></div><div class="compactDetails" id="cd${i}">${r.join('<br>')}</div></div>`).join('')||'No checks for this view.';
}

const defaultTicketDefs=[['paper','Single','Single',''],['paper','Return','Return',''],['paper','Paper Local Day','Paper Local','£4.70'],['paper','Paper Regional Day','Paper Regional','£9.40'],['paper','Paper East Scotland','Paper East','£12.80'],['paper','Paper Flexi','Paper Flexi',''],['mobile','Mobile Single','Mobile Single',''],['mobile','Mobile Return','Mobile Return',''],['mobile','Mobile Local Day','Mobile Local','£4.70 / £57.70'],['mobile','Mobile Regional Day','Mobile Regional','£9.40 / £112.30'],['mobile','Mobile East Scotland','Mobile East','£12.80 / £148'],['mobile','Mobile Flexi','Mobile Flexi',''],['paper','NightRider','NightRider',''],['free','U22','U22',''],['free','Under 11','Under 11',''],['free','Under 5','Under 5',''],['free','Over 60','Over 60',''],['free','Concession','Concession',''],['free','Staff','Staff','']];
let ticketDefs=JSON.parse(localStorage.getItem('ticketButtonSettings')||'null')||defaultTicketDefs;
function saveTicketButtons(){localStorage.setItem('ticketButtonSettings',JSON.stringify(ticketDefs));}
function renderTicketButtons(){$('ticketButtons').innerHTML=ticketDefs.map((d,i)=>`<button class="btn ${d[0]}" data-ticket="${d[1]}">${d[2]}${d[3]?'<br>'+d[3]:''}</button>`).join('')+`<button class="btn danger" id="undoTicketBtn">Undo</button>`;renderTicketSettings();}
function renderTicketSettings(){const box=$('ticketSettingsList'); if(!box)return; box.innerHTML=ticketDefs.map((d,i)=>`<div class="ticketSettingRow"><input value="${d[2]||''}" data-ti="${i}" data-field="2"><input value="${d[3]||''}" data-ti="${i}" data-field="3"><select data-ti="${i}" data-field="0"><option ${d[0]==='paper'?'selected':''}>paper</option><option ${d[0]==='mobile'?'selected':''}>mobile</option><option ${d[0]==='free'?'selected':''}>free</option></select><button class="btn danger" data-remove-ticket="${i}">Remove</button></div>`).join('');}
function addTicket(type){const r={date:today(),time:now(),inspector:getInspector(),type};tickets.push(r);lastTicket=type;localStorage.setItem('cloudTickets',JSON.stringify(tickets));cloudAppend('Ticket Log',[r.date,r.time,r.inspector,r.type]);renderTickets();}
function undoTicket(){tickets.pop();lastTicket=tickets.length?tickets.at(-1).type:'None';localStorage.setItem('cloudTickets',JSON.stringify(tickets));renderTickets();}
function renderTickets(){const counts={};tickets.forEach(x=>counts[x.type]=(counts[x.type]||0)+1);let txt=`LAST: ${lastTicket}\nTOTAL: ${tickets.length}\n------------------------\n`;Object.keys(counts).sort().forEach(k=>txt+=k.padEnd(20,'.')+counts[k]+'\n');$('ticketLcd').textContent=txt;$('ticketLog').innerHTML=tickets.slice().reverse().map(x=>`<div><b>${x.type}</b><br><span class=small>${x.date} ${x.time} | ${x.inspector}</span></div><hr>`).join('')||'No tickets.';}

function saveEarlyRunning(){cloudAppend('Early Running',[today(),now(),getInspector(),$('erDriver').value,$('erDepot').value,$('erService').value,$('erLocation').value,$('erScheduled').value,$('erActual').value,$('erNotes').value]);['erDriver','erDepot','erService','erLocation','erScheduled','erActual','erNotes'].forEach(id=>$(id).value='');setTimeout(loadCloud,1200);}
function renderCloudTable(sheet,el){const rows=cloud[sheet]||[];el.innerHTML=rows.slice(1).reverse().map(r=>`<div class=row><div><b>${r[0]||'-'}</b><br><span class=small>${r[1]||''}</span></div><div>${r[2]||''}</div><div>${r.slice(3,7).join(' | ')}</div></div>`).join('')||'No cloud data loaded.';}
function buildDrivers(){const d={};(cloud['Inspections']||[]).slice(1).forEach(r=>{const name=r[4]||'-';if(!d[name])d[name]={name,inspections:0,nsa:0,reports:0,history:[]};d[name].inspections++;if(r[10]==='No')d[name].nsa++;if(r[13]&&r[13]!=='No Driver Report')d[name].reports++;d[name].history.push(r.join(' | '));});return Object.values(d);}
function buildFleets(){const f={};(cloud['Inspections']||[]).slice(1).forEach(r=>{const fl=r[6]||'-';if(!f[fl])f[fl]={fleet:fl,inspections:0,nsa:0,reports:0,history:[]};f[fl].inspections++;if(r[10]==='No')f[fl].nsa++;if(r[13]&&r[13]!=='No Driver Report')f[fl].reports++;f[fl].history.push(r.join(' | '));});return Object.values(f);}
function renderDatabase(){const dq=($('driverSearch').value||'').toLowerCase(), fq=($('fleetSearch').value||'').toLowerCase();$('driverDbList').innerHTML=buildDrivers().filter(x=>x.name.toLowerCase().includes(dq)).map(d=>`<div class="dbCard driver"><h3>${d.name}</h3><div class=dbStats><div class=dbStat><b>${d.inspections}</b>Inspections</div><div class=dbStat><b>${d.nsa}</b>NSA</div><div class=dbStat><b>${d.reports}</b>Reports</div></div><details><summary>History</summary>${d.history.map(h=>`<div class=small>${h}</div>`).join('')}</details></div>`).join('')||'No drivers.';$('fleetDbList').innerHTML=buildFleets().filter(x=>x.fleet.toLowerCase().includes(fq)).map(f=>`<div class="dbCard fleet"><h3>Fleet ${f.fleet}</h3><div class=dbStats><div class=dbStat><b>${f.inspections}</b>Inspections</div><div class=dbStat><b>${f.nsa}</b>NSA</div><div class=dbStat><b>${f.reports}</b>Reports</div></div><details><summary>History</summary>${f.history.map(h=>`<div class=small>${h}</div>`).join('')}</details></div>`).join('')||'No fleet.';}
const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];let ts=JSON.parse(localStorage.getItem('tsCloud')||'{}');
function diff(s,f){if(!s||!f)return 0;let [sh,sm]=s.split(':').map(Number),[fh,fm]=f.split(':').map(Number),a=sh*60+sm,b=fh*60+fm;if(b<a)b+=1440;return (b-a)/60;}
function buildTimesheet(){$('timesheetRows').innerHTML=days.map(day=>`<div class=row><b>${day}</b><input class=field type=time id="s${day}" value="${ts[day]?.s||''}"><input class=field type=time id="f${day}" value="${ts[day]?.f||''}"><span id="t${day}">0</span></div>`).join('');calcTs();}
function saveTs(){days.forEach(day=>ts[day]={s:$('s'+day).value,f:$('f'+day).value});localStorage.setItem('tsCloud',JSON.stringify(ts));calcTs();}
function calcTs(){let total=0;days.forEach(day=>{const h=diff(ts[day]?.s,ts[day]?.f);total+=h;const el=$('t'+day);if(el)el.textContent=h.toFixed(2)+' hrs';});$('weekTotal').textContent='WEEK TOTAL: '+total.toFixed(2)+' HOURS';}

function renderAll(){$('homeClock').textContent=`DATE ${today()}\nTIME ${now()}\nINSPECTOR: ${getInspector()}`;renderTickets();renderChecks();renderCloudTable('NSA Faults',$('nsaList'));renderCloudTable('Driver Reports',$('driverReportsList'));renderCloudTable('Early Running',$('earlyRunningList'));renderDatabase();$('cloudLog').innerHTML=sheets.map(s=>`<div>${s}: ${(cloud[s]||[]).length} rows</div>`).join('');}

document.addEventListener('click',e=>{const open=e.target.dataset.open;if(open)openSection(open);const filter=e.target.dataset.checkFilter;if(filter){checkFilter=filter;localStorage.setItem('checkFilter',filter);renderChecks();}const toggle=e.target.closest('[data-toggle]');if(toggle)$(toggle.dataset.toggle)?.classList.toggle('show');const ticket=e.target.closest('[data-ticket]');if(ticket)addTicket(ticket.dataset.ticket);if(e.target.id==='undoTicketBtn')undoTicket();if(e.target.classList.contains('refreshCloud'))loadCloud();const rm=e.target.dataset.removeTicket;if(rm!==undefined){ticketDefs.splice(Number(rm),1);saveTicketButtons();renderTicketButtons();}});
document.addEventListener('change',e=>{if(e.target.id==='inspectorSelect'||e.target.id==='otherInspector')saveInspector();if(e.target.id?.startsWith('s')||e.target.id?.startsWith('f'))saveTs();if(e.target.dataset.ti){ticketDefs[e.target.dataset.ti][e.target.dataset.field]=e.target.value;saveTicketButtons();renderTicketButtons();}});
document.addEventListener('input',e=>{if(e.target.id==='checkSearch')renderChecks();if(e.target.id==='driverSearch'||e.target.id==='fleetSearch')renderDatabase();});
window.addEventListener('load',()=>{initInspector();$('csDate').valueAsDate=new Date();buildTimesheet();renderTicketButtons();renderAll();loadCloud();setInterval(()=>{const c=document.getElementById('homeClock');if(c)c.textContent=`DATE ${today()}\nTIME ${now()}\nINSPECTOR: ${getInspector()}`;},1000);
$('saveCheckSheetBtn').onclick=saveCheckSheet;$('clearCheckFormBtn').onclick=clearCheckForm;$('refreshChecksBtn').onclick=loadCloud;$('saveEarlyBtn').onclick=saveEarlyRunning;$('clearTicketsBtn').onclick=()=>{tickets=[];lastTicket='Cleared';localStorage.setItem('cloudTickets','[]');renderTickets();};$('exportTicketsBtn').onclick=()=>download('Ticket-Log-Local.csv','Date,Time,Inspector,Ticket\n'+tickets.map(x=>[esc(x.date),esc(x.time),esc(x.inspector),esc(x.type)].join(',')).join('\n'));$('toggleTicketSettingsBtn').onclick=()=>{const p=$('ticketSettingsPanel');p.style.display=p.style.display==='none'?'block':'none';};$('addTicketButtonBtn').onclick=()=>{const name=$('newTicketName').value.trim();if(!name)return;ticketDefs.push([$('newTicketCategory').value,name,name,$('newTicketPrice').value.trim()]);saveTicketButtons();$('newTicketName').value='';$('newTicketPrice').value='';renderTicketButtons();};$('resetTicketButtonsBtn').onclick=()=>{ticketDefs=JSON.parse(JSON.stringify(defaultTicketDefs));saveTicketButtons();renderTicketButtons();};$('exportTimesheetBtn').onclick=()=>{const rows=['Day,Start,Finish,Hours'];days.forEach(day=>rows.push([esc(day),esc(ts[day]?.s||''),esc(ts[day]?.f||''),esc(diff(ts[day]?.s,ts[day]?.f).toFixed(2))].join(',')));download('Timesheet.csv',rows.join('\n'));};});
