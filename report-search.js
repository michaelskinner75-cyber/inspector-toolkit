(function(){
'use strict';
const ADMIN='M Skinner';
function currentInspector(){return typeof getInspector==='function'?getInspector():(localStorage.getItem('activeInspector')||'');}
function isAdmin(){return currentInspector()===ADMIN;}
function sheetRows(sheet){
 const data=(window.cloud&&cloud[sheet])||[];
 if(!data.length)return[];
 const first=(data[0]||[]).map(v=>String(v||'').toLowerCase());
 const header=first.some(v=>['date','time','inspector','driver','fleet','service','depot','location'].includes(v));
 const start=header?1:0;
 return data.slice(start).map((row,i)=>({row,sheetRow:start+i+1}));
}
function setup(){
 const nav=document.querySelector('.nav');if(!nav)return;
 const driverBtn=document.querySelector('[data-open="driverReports"]');
 const dbBtn=document.querySelector('[data-open="database"]');
 if(driverBtn){driverBtn.dataset.open='reportSearch';driverBtn.innerHTML='<span class="navIcon">🔎</span>Report Search';}
 if(dbBtn)dbBtn.remove();
 if(document.getElementById('reportSearch'))return;
 const anchor=document.getElementById('database')||document.getElementById('busTimes');
 anchor.insertAdjacentHTML('beforebegin',`<section id="reportSearch" class="section"><button class="backBtn" data-open="home">← Back</button><h2>Report Search</h2><div class="panel"><input class="searchBar" id="reportSearchText" placeholder="Search driver, fleet, service, depot, location or notes"><div class="grid2"><label class="fieldLabel">From date<input class="field" type="date" id="reportFrom"></label><label class="fieldLabel">To date<input class="field" type="date" id="reportTo"></label></div><div class="grid2"><select class="field" id="reportType"><option value="all">All records</option><option value="reported">Reported drivers</option><option value="advised">Advised</option><option value="offence">Offence reports</option><option value="timing">Timing checks</option><option value="early">Early running only</option><option value="nsa">NSA faults</option><option value="checks">Inspector checks</option></select><select class="field" id="reportSort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div><div class="filterBar"><button data-report-range="today">Today</button><button data-report-range="week">This Week</button><button data-report-range="month">This Month</button><button data-report-range="all">All</button></div><button class="btn" id="clearReportFilters">CLEAR FILTERS</button></div><div class="coverageSummary" id="reportSummary"></div><div class="log" id="reportResults"></div></section>`);
 bind();render();
}
function normal(v){return String(v||'').trim().toLowerCase().replace(/\s+/g,' ');}
function recordKey(x){
 return [x.date,x.inspector,x.driver,x.fleet,x.service].map(normal).join('|');
}
function uniqueKey(x){
 return [x.kind,x.date,x.time,x.inspector,x.driver,x.fleet,x.service,x.depot,x.location,x.destination,x.action,x.notes,x.nsa,x.fault].map(normal).join('|');
}
function dedupe(records){
 const seen=new Set();
 return records.filter(item=>{
  const key=uniqueKey(item);
  if(seen.has(key))return false;
  seen.add(key);
  return true;
 });
}
function recs(){
 const out=[];
 const checks=[];
 sheetRows('Inspections').forEach(({row:r,sheetRow})=>{
  const item={kind:'check',sourceSheet:'Inspections',sourceRow:sheetRow,date:r[0],time:r[1],driver:r[4],fleet:r[6],service:r[5],depot:r[3],inspector:r[2],location:r[8],destination:r[9],action:r[13]||'No Driver Report',notes:r[14]||'',nsa:r[10],fault:r[11],raw:r};
  checks.push(item);out.push(item);
 });
 const checkKeys=new Set(checks.map(recordKey));
 sheetRows('Early Running').forEach(({row:r,sheetRow})=>{if(r.length>=10)out.push({kind:'timing',sourceSheet:'Early Running',sourceRow:sheetRow,date:r[0],time:r[1],driver:r[7],fleet:r[6],service:r[4],depot:'',inspector:r[2],location:r[3],destination:r[5],action:r[11]||'',notes:'',minutes:Number(r[10]),raw:r});});
 sheetRows('NSA Faults').forEach(({row:r,sheetRow})=>{
  if(!(r[7]==='No'||(r[8]&&r[8]!=='Fully Working'&&r[8]!=='N/A')))return;
  const item={kind:'nsa',sourceSheet:'NSA Faults',sourceRow:sheetRow,date:r[0],time:r[1],driver:r[6],fleet:r[4],service:r[5],depot:r[3],inspector:r[2],location:'',destination:'',action:r[8]||'NSA Fault',notes:r[9]||'',nsa:r[7],fault:r[8],raw:r};
  if(!checkKeys.has(recordKey(item)))out.push(item);
 });
 return dedupe(out);
}
function dateOK(v){const d=parseRowDate(v);const f=document.getElementById('reportFrom').value,t=document.getElementById('reportTo').value;if(f&&d<new Date(f+'T00:00:00'))return false;if(t&&d>new Date(t+'T23:59:59'))return false;return true;}
function matchType(x,type){if(type==='all')return true;if(type==='checks')return x.kind==='check';if(type==='timing')return x.kind==='timing';if(type==='early')return x.kind==='timing'&&Number(x.minutes)<0;if(type==='nsa')return x.kind==='nsa'||x.nsa==='No';if(type==='reported')return x.kind==='check'&&x.action&&x.action!=='No Driver Report';if(type==='advised')return /advised/i.test(x.action||'');if(type==='offence')return /offence/i.test(x.action||'');return true;}
function render(){
 const box=document.getElementById('reportResults');if(!box)return;
 const q=(document.getElementById('reportSearchText').value||'').toLowerCase();const type=document.getElementById('reportType').value;let data=recs().filter(x=>dateOK(x.date)&&matchType(x,type)&&(!q||Object.values(x).join(' ').toLowerCase().includes(q)));
 data.sort((a,b)=>(parseRowDate(a.date)-parseRowDate(b.date))*(document.getElementById('reportSort').value==='oldest'?1:-1));
 const reported=data.filter(x=>x.kind==='check'&&x.action&&x.action!=='No Driver Report').length, advised=data.filter(x=>/advised/i.test(x.action||'')).length, offences=data.filter(x=>/offence/i.test(x.action||'')).length, timing=data.filter(x=>x.kind==='timing').length;
 document.getElementById('reportSummary').innerHTML=`<div class="coverageStat"><b>${data.length}</b>Results</div><div class="coverageStat"><b>${reported}</b>Reported</div><div class="coverageStat"><b>${advised}</b>Advised</div><div class="coverageStat"><b>${offences}</b>Offences</div><div class="coverageStat"><b>${timing}</b>Timing</div>`;
 box.innerHTML=data.map((x,i)=>{let cls='';let title='Inspector Check';let detail='';if(x.kind==='timing'){title='Timing Check';cls=Number(x.minutes)<-3?'offence':Number(x.minutes)<0?'advised':'';detail=`Scheduled ${formatTimeValue(x.raw[8])} • Actual ${formatTimeValue(x.raw[9])} • ${x.action}`;}else if(x.kind==='nsa'){title='NSA Fault';cls='nsa';detail=`NSA Working: ${x.nsa||'-'}<br>NSA Status/Fault: ${x.fault||x.action||'-'}${x.notes?'<br>NSA Notes: '+x.notes:''}`;}else{if(/offence/i.test(x.action))cls='offence';else if(/advised/i.test(x.action))cls='advised';else if(x.nsa==='No')cls='nsa';detail=`Driver outcome: ${x.action||'No Driver Report'}<br>NSA Working: ${x.nsa||'-'}<br>NSA Status/Fault: ${x.fault||'-'}${x.notes?'<br>Notes: '+x.notes:''}`;}const del=isAdmin()?`<br><button class="btn danger reportDeleteBtn" data-delete-sheet="${x.sourceSheet}" data-delete-row="${x.sourceRow}" data-delete-title="${title}">DELETE THIS CARD</button>`:'';return `<div class="compactCheck ${cls}"><div class="compactTop" data-toggle="report${i}"><div class="compactMain">${formatDateValue(x.date)} ${formatTimeValue(x.time)} | ${title} | ${x.driver||'-'} | Fleet ${x.fleet||'-'}</div><div class="compactSub">${x.service||'-'} • ${x.depot||x.location||'-'} • ${x.inspector||'-'}</div></div><div class="compactDetails" id="report${i}"><b>${title}</b><br>Date: ${formatDateValue(x.date)} ${formatTimeValue(x.time)}<br>Driver: ${x.driver||'-'}<br>Fleet: ${x.fleet||'-'}<br>Service: ${x.service||'-'}<br>Depot/Location: ${x.depot||x.location||'-'}<br>Destination: ${x.destination||'-'}<br>Inspector: ${x.inspector||'-'}<br>${detail}${del}</div></div>`;}).join('')||'No matching reports.';
}
async function deleteRecord(sheet,row,title){
 if(!isAdmin())return;
 if(!confirm(`Delete this ${title} from ${sheet} and Google Sheets?`))return;
 setStatus('Deleting from cloud...');
 try{
  await fetch(WEB_APP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'deleteRow',sheet,rowNumber:Number(row),adminPin:'8291'})});
  setStatus('Delete sent to cloud.');
  setTimeout(loadCloud,1200);
 }catch(e){setStatus('Delete failed.');alert('The record could not be deleted.');}
}
function setRange(r){const now=new Date(),from=document.getElementById('reportFrom'),to=document.getElementById('reportTo');if(r==='all'){from.value='';to.value='';}else{let s=new Date(now);if(r==='week')s=startOfWeek(now);if(r==='month')s=new Date(now.getFullYear(),now.getMonth(),1);from.value=(r==='today'?now:s).toISOString().slice(0,10);to.value=now.toISOString().slice(0,10);}render();}
function bind(){['reportSearchText','reportFrom','reportTo','reportType','reportSort'].forEach(id=>document.getElementById(id).addEventListener(id==='reportSearchText'?'input':'change',render));document.addEventListener('click',e=>{if(e.target.dataset.reportRange)setRange(e.target.dataset.reportRange);const del=e.target.closest('.reportDeleteBtn');if(del){e.preventDefault();e.stopPropagation();deleteRecord(del.dataset.deleteSheet,del.dataset.deleteRow,del.dataset.deleteTitle);}});document.getElementById('clearReportFilters').onclick=()=>{document.getElementById('reportSearchText').value='';document.getElementById('reportFrom').value='';document.getElementById('reportTo').value='';document.getElementById('reportType').value='all';document.getElementById('reportSort').value='newest';render();};}
window.renderReportSearch=render;
const oldRenderAll=window.renderAll;window.renderAll=function(){oldRenderAll();render();};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,700));else setTimeout(setup,700);
})();