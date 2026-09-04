(function(){
'use strict';
const ADMIN='M Skinner';
const $=id=>document.getElementById(id);
function currentInspector(){return typeof getInspector==='function'?getInspector():(localStorage.getItem('activeInspector')||'');}
function isAdmin(){return currentInspector()===ADMIN;}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function normal(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/gi,' ').replace(/\s+/g,' ').trim();}
function sheetRows(sheet){
 const data=(window.cloud&&cloud[sheet])||[];
 if(!data.length)return[];
 const first=(data[0]||[]).map(v=>String(v||'').toLowerCase());
 const header=first.some(v=>['date','time','inspector','driver','fleet','service','depot','location'].includes(v));
 const start=header?1:0;
 return data.slice(start).map((row,i)=>({row,sheetRow:start+i+1}));
}
function safeDate(v){
 if(v===undefined||v===null||v==='')return null;
 const s=String(v).trim();
 let d=null;
 const uk=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
 if(uk){let y=Number(uk[3]);if(y<100)y+=2000;d=new Date(y,Number(uk[2])-1,Number(uk[1]));}
 else{const x=new Date(s);if(!isNaN(x))d=x;}
 return d&& !isNaN(d)?d:null;
}
function dateKey(v){const d=safeDate(v);return d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:normal(v);}
function minutesOf(v){
 const s=String(v||'');const m=s.match(/(\d{1,2}):(\d{2})/);if(m)return Number(m[1])*60+Number(m[2]);
 const d=new Date(s);return isNaN(d)?null:d.getHours()*60+d.getMinutes();
}
function stamp(x){const d=safeDate(x.date);if(!d)return 0;const mins=minutesOf(x.time);d.setHours(0,mins===null?0:mins,0,0);return d.getTime();}
function completeness(x){return [x.action,x.notes,x.reference,x.details,x.nature,x.passengers,x.location,x.destination,x.fault].map(v=>String(v||'').length).reduce((a,b)=>a+b,0);}
function collapse(records,keyFn){
 const map=new Map();
 records.forEach(item=>{const key=keyFn(item);const old=map.get(key);if(!old||completeness(item)>completeness(old))map.set(key,item);});
 return [...map.values()];
}
function checkIdentity(x){return ['check',dateKey(x.date),normal(x.time),x.inspector,x.driver,x.fleet,x.service,x.location].map(normal).join('|');}
function reportIdentity(x){return x.reference?`ref|${normal(x.reference)}`:['driver',dateKey(x.date),normal(x.time),x.inspector,x.driver,x.fleet,x.service,x.action,x.details].map(normal).join('|');}
function genericIdentity(x){return [x.kind,dateKey(x.date),normal(x.time),x.inspector,x.driver,x.fleet,x.service,x.location,x.action,x.fault].map(normal).join('|');}
function driverReports(){
 return collapse(sheetRows('Driver Reports').map(({row:r,sheetRow})=>({
  kind:'driverReport',sourceSheet:'Driver Reports',sourceRow:sheetRow,date:r[0],time:r[1],inspector:r[2],driver:r[3],depot:r[4],action:r[5]||'Driver Report',details:r[6]||'',notes:r[6]||'',service:r[7],fleet:r[8],reference:r[9]||'',checkedAt:r[10]||'',nature:r[12]||'',passengers:r[13]||'',location:r[14]||r[4]||'',destination:'',raw:r
 })),reportIdentity);
}
function reportMatchScore(check,report){
 if(dateKey(check.date)!==dateKey(report.date))return -1;
 if(normal(check.driver)!==normal(report.driver)||!normal(check.driver))return -1;
 if(check.fleet&&report.fleet&&normal(check.fleet)!==normal(report.fleet))return -1;
 if(check.service&&report.service&&normal(check.service)!==normal(report.service))return -1;
 let score=10;
 if(check.fleet&&report.fleet)score+=5;
 if(check.service&&report.service)score+=4;
 if(check.inspector&&report.inspector&&normal(check.inspector)===normal(report.inspector))score+=2;
 const a=minutesOf(check.time),b=minutesOf(report.time);if(a!==null&&b!==null){const diff=Math.abs(a-b);score+=Math.max(0,3-Math.min(3,Math.floor(diff/10)));}
 return score;
}
function enrichWithReport(check,report){
 check.hasDriverReport=true;
 check.reportSourceRow=report.sourceRow;
 check.reference=report.reference||check.reference||'';
 check.details=report.details||check.details||'';
 check.nature=report.nature||check.nature||'';
 check.passengers=report.passengers||check.passengers||'';
 check.checkedAt=report.checkedAt||check.checkedAt||'';
 check.reportLocation=report.location||'';
 if((!check.action||/no driver report/i.test(check.action))&&report.action)check.action=report.action;
 if(!check.notes&&report.details)check.notes=report.details;
}
function recs(){
 const out=[];
 let checks=sheetRows('Inspections').map(({row:r,sheetRow})=>({kind:'check',sourceSheet:'Inspections',sourceRow:sheetRow,date:r[0],time:r[1],driver:r[4],fleet:r[6],service:r[5],depot:r[3],inspector:r[2],location:r[8],destination:r[9],action:r[13]||'No Driver Report',notes:r[14]||'',nsa:r[10],fault:r[11],reference:'',details:'',nature:'',passengers:'',checkedAt:'',raw:r}));
 checks=collapse(checks,checkIdentity);
 const reports=driverReports(),used=new Set();
 checks.forEach(check=>{
  let best=-1,bestScore=-1;
  reports.forEach((report,i)=>{if(used.has(i))return;const score=reportMatchScore(check,report);if(score>bestScore){bestScore=score;best=i;}});
  if(best>=0&&bestScore>=10){enrichWithReport(check,reports[best]);used.add(best);}
  out.push(check);
 });
 reports.forEach((report,i)=>{if(!used.has(i))out.push(report);});
 sheetRows('Early Running').forEach(({row:r,sheetRow})=>{
  if(r.length>=10)out.push({kind:'timing',sourceSheet:'Early Running',sourceRow:sheetRow,date:r[0],time:r[1],driver:r[7],fleet:r[6],service:r[4],depot:'',inspector:r[2],location:r[3],destination:r[5],action:r[11]||'',notes:'',minutes:Number(r[10]),raw:r});
 });
 const checkKeys=new Set(checks.map(x=>[dateKey(x.date),x.inspector,x.driver,x.fleet,x.service].map(normal).join('|')));
 sheetRows('NSA Faults').forEach(({row:r,sheetRow})=>{
  if(!(r[7]==='No'||(r[8]&&r[8]!=='Fully Working'&&r[8]!=='N/A')))return;
  const item={kind:'nsa',sourceSheet:'NSA Faults',sourceRow:sheetRow,date:r[0],time:r[1],driver:r[6],fleet:r[4],service:r[5],depot:r[3],inspector:r[2],location:r[10]||'',destination:r[11]||'',action:r[8]||'NSA Fault',notes:r[9]||'',nsa:r[7],fault:r[8],raw:r};
  const key=[dateKey(item.date),item.inspector,item.driver,item.fleet,item.service].map(normal).join('|');
  if(!checkKeys.has(key))out.push(item);
 });
 return collapse(out,genericIdentity);
}
function dateOK(v){
 const f=$('reportFrom').value,t=$('reportTo').value;if(!f&&!t)return true;
 const d=safeDate(v);if(!d)return false;
 if(f&&d<new Date(f+'T00:00:00'))return false;
 if(t&&d>new Date(t+'T23:59:59'))return false;
 return true;
}
function hasDriverReport(x){return x.kind==='driverReport'||x.hasDriverReport||Boolean(x.reference||x.details)||(x.kind==='check'&&x.action&&!/no driver report/i.test(x.action));}
function offenceText(x){return [x.action,x.nature,x.details,x.notes].join(' ');}
function matchType(x,type){
 if(type==='all')return true;
 if(type==='checks')return x.kind==='check';
 if(type==='driverReports')return hasDriverReport(x);
 if(type==='timing')return x.kind==='timing';
 if(type==='early')return x.kind==='timing'&&Number(x.minutes)<0;
 if(type==='nsa')return x.kind==='nsa'||x.nsa==='No';
 if(type==='reported')return hasDriverReport(x);
 if(type==='advised')return /advised/i.test(offenceText(x));
 if(type==='offence')return /offence/i.test(offenceText(x))||Boolean(x.reference);
 return true;
}
function searchText(x){return normal([x.date,x.time,x.inspector,x.driver,x.fleet,x.service,x.depot,x.location,x.destination,x.action,x.notes,x.nsa,x.fault,x.reference,x.details,x.nature,x.passengers,x.checkedAt,x.sourceSheet].join(' '));}
function queryOK(x,q){const tokens=normal(q).split(' ').filter(Boolean);if(!tokens.length)return true;const hay=searchText(x);return tokens.every(token=>hay.includes(token));}
function line(label,value){return value!==undefined&&value!==null&&String(value).trim()!==''?`<br><b>${esc(label)}:</b> ${esc(value)}`:'';}
function resultClass(x){if(/offence/i.test(offenceText(x))||x.reference)return'offence';if(/advised/i.test(offenceText(x)))return'advised';if(x.kind==='nsa'||x.nsa==='No')return'nsa';return'';}
function titleFor(x){if(x.kind==='timing')return'Timing Check';if(x.kind==='nsa')return'NSA Fault';if(x.kind==='driverReport')return'Driver Report';return'Inspector Check';}
function detailFor(x){
 if(x.kind==='timing')return `Scheduled ${esc(formatTimeValue(x.raw[8]))} • Actual ${esc(formatTimeValue(x.raw[9]))}${x.action?' • '+esc(x.action):''}`;
 if(x.kind==='nsa')return `NSA Working: ${esc(x.nsa||'-')}<br>NSA Status/Fault: ${esc(x.fault||x.action||'-')}${x.notes?'<br>NSA Notes: '+esc(x.notes):''}`;
 let detail=`Driver outcome: ${esc(x.action||'No Driver Report')}<br>NSA Working: ${esc(x.nsa||'-')}<br>NSA Status/Fault: ${esc(x.fault||'-')}`;
 if(x.notes)detail+='<br>Inspection notes: '+esc(x.notes);
 if(x.reference)detail+=line('Report reference',x.reference);
 if(x.nature)detail+=line('Nature of offence',x.nature);
 if(x.details&&normal(x.details)!==normal(x.notes))detail+=line('Report details',x.details);
 if(x.checkedAt)detail+=line('Checked at',x.checkedAt);
 if(x.passengers)detail+=line('Passengers',x.passengers);
 if(x.reportLocation&&normal(x.reportLocation)!==normal(x.location))detail+=line('Report location',x.reportLocation);
 return detail;
}
function render(){
 const box=$('reportResults');if(!box)return;
 const q=$('reportSearchText').value||'',type=$('reportType').value;
 let data=recs().filter(x=>dateOK(x.date)&&matchType(x,type)&&queryOK(x,q));
 const direction=$('reportSort').value==='oldest'?1:-1;data.sort((a,b)=>(stamp(a)-stamp(b))*direction);
 const reported=data.filter(hasDriverReport).length,advised=data.filter(x=>/advised/i.test(offenceText(x))).length,offences=data.filter(x=>/offence/i.test(offenceText(x))||x.reference).length,timing=data.filter(x=>x.kind==='timing').length;
 $('reportSummary').innerHTML=`<div class="coverageStat"><b>${data.length}</b>Results</div><div class="coverageStat"><b>${reported}</b>Driver Reports</div><div class="coverageStat"><b>${advised}</b>Advised</div><div class="coverageStat"><b>${offences}</b>Offences</div><div class="coverageStat"><b>${timing}</b>Timing</div>`;
 box.innerHTML=data.map((x,i)=>{
  const title=titleFor(x),cls=resultClass(x),del=isAdmin()?`<br><button class="btn danger reportDeleteBtn" data-delete-sheet="${esc(x.sourceSheet)}" data-delete-row="${esc(x.sourceRow)}" data-delete-title="${esc(title)}">DELETE THIS CARD</button>`:'';
  const where=x.depot||x.location||'-';
  return `<div class="compactCheck ${cls}"><div class="compactTop" data-toggle="report${i}"><div class="compactMain">${esc(formatDateValue(x.date))} ${esc(formatTimeValue(x.time))} | ${esc(title)} | ${esc(x.driver||'-')} | Fleet ${esc(x.fleet||'-')}</div><div class="compactSub">${esc(x.service||'-')} • ${esc(where)} • ${esc(x.inspector||'-')}${x.reference?' • Ref '+esc(x.reference):''}</div></div><div class="compactDetails" id="report${i}"><b>${esc(title)}</b><br>Date: ${esc(formatDateValue(x.date))} ${esc(formatTimeValue(x.time))}<br>Driver: ${esc(x.driver||'-')}<br>Fleet: ${esc(x.fleet||'-')}<br>Service: ${esc(x.service||'-')}<br>Depot/Location: ${esc(where)}<br>Destination: ${esc(x.destination||'-')}<br>Inspector: ${esc(x.inspector||'-')}<br>${detailFor(x)}${del}</div></div>`;
 }).join('')||(q?'No reports match that search.':'No matching reports.');
}
async function deleteRecord(sheet,row,title){
 if(!isAdmin())return;
 if(!confirm(`Delete this ${title} from ${sheet} and Google Sheets?`))return;
 setStatus('Deleting from cloud...');
 try{
  await fetch(WEB_APP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'deleteRow',sheet,rowNumber:Number(row),adminPin:'8291'})});
  setStatus('Delete sent to cloud.');setTimeout(loadCloud,1200);
 }catch(e){setStatus('Delete failed.');alert('The record could not be deleted.');}
}
function setRange(r){
 const now=new Date(),from=$('reportFrom'),to=$('reportTo');
 if(r==='all'){from.value='';to.value='';}
 else{let s=new Date(now);if(r==='week')s=startOfWeek(now);if(r==='month')s=new Date(now.getFullYear(),now.getMonth(),1);const local=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;from.value=local(r==='today'?now:s);to.value=local(now);}
 render();
}
function bind(){
 ['reportSearchText','reportFrom','reportTo','reportType','reportSort'].forEach(id=>$(id).addEventListener(id==='reportSearchText'?'input':'change',render));
 document.addEventListener('click',e=>{if(e.target.dataset.reportRange)setRange(e.target.dataset.reportRange);const del=e.target.closest('.reportDeleteBtn');if(del){e.preventDefault();e.stopPropagation();deleteRecord(del.dataset.deleteSheet,del.dataset.deleteRow,del.dataset.deleteTitle);}});
 $('clearReportFilters').onclick=()=>{$('reportSearchText').value='';$('reportFrom').value='';$('reportTo').value='';$('reportType').value='all';$('reportSort').value='newest';render();};
}
function setup(){
 const nav=document.querySelector('.nav');if(!nav)return;
 const driverBtn=document.querySelector('[data-open="driverReports"]'),dbBtn=document.querySelector('[data-open="database"]');
 if(driverBtn){driverBtn.dataset.open='reportSearch';driverBtn.innerHTML='<span class="navIcon">🔎</span>Report Search';}
 if(dbBtn)dbBtn.remove();
 if($('reportSearch'))return;
 const anchor=$('database')||$('busTimes');if(!anchor)return;
 anchor.insertAdjacentHTML('beforebegin',`<section id="reportSearch" class="section"><button class="backBtn" data-open="home">← Back</button><h2>Report Search</h2><div class="panel"><input class="searchBar" id="reportSearchText" placeholder="Search driver, fleet, service, report ref, location or offence details"><div class="grid2"><label class="fieldLabel">From date<input class="field" type="date" id="reportFrom"></label><label class="fieldLabel">To date<input class="field" type="date" id="reportTo"></label></div><div class="grid2"><select class="field" id="reportType"><option value="all">All records</option><option value="driverReports">Driver reports</option><option value="reported">Reported drivers</option><option value="advised">Advised</option><option value="offence">Offence reports</option><option value="timing">Timing checks</option><option value="early">Early running only</option><option value="nsa">NSA faults</option><option value="checks">Inspector checks</option></select><select class="field" id="reportSort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div><div class="filterBar"><button data-report-range="today">Today</button><button data-report-range="week">This Week</button><button data-report-range="month">This Month</button><button data-report-range="all">All</button></div><button class="btn" id="clearReportFilters">CLEAR FILTERS</button></div><div class="coverageSummary" id="reportSummary"></div><div class="log" id="reportResults"></div></section>`);
 bind();render();
}
window.renderReportSearch=render;
if(!window.__reportSearchWrapped){window.__reportSearchWrapped=true;const oldRenderAll=window.renderAll;window.renderAll=function(){if(typeof oldRenderAll==='function')oldRenderAll.apply(this,arguments);render();};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,700));else setTimeout(setup,700);
})();