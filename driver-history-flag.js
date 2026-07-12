(function(){
'use strict';
const byId=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v||'').normalize('NFKD').replace(/[’']/g,'').toLowerCase().replace(/\b(employee|emp|driver|number|no)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
let lastSignature='';

function outcomeType(value){
 const s=clean(value);
 if(!s||s.includes('no driver report')||s==='none'||s==='no')return'';
 if(s.includes('report')||s.includes('offence')||s.includes('submitted'))return'reported';
 if(s.includes('advis'))return'advised';
 return'';
}
function outcomeLabel(type){return type==='reported'?'Reported':'Advised';}
function line(label,value){return value!==undefined&&value!==null&&String(value).trim()!==''?`<div><b>${label}:</b> ${esc(value)}</div>`:'';}

function addStyles(){
 if(byId('driverHistoryFlagCss'))return;
 const s=document.createElement('style');
 s.id='driverHistoryFlagCss';
 s.textContent=`
 #driverHistoryFlag{display:none;grid-column:1/-1;width:100%;box-sizing:border-box;border-radius:12px;padding:13px 14px;margin:6px 0 10px;line-height:1.4}
 #driverHistoryFlag.show{display:block!important}
 #driverHistoryFlag.advised{background:#4b3510;border:2px solid #e2a52b;color:#fff4d6}
 #driverHistoryFlag.reported{background:#551c22;border:2px solid #e24e5b;color:#ffe7e9}
 #driverHistoryFlag .historyTitle{font-size:17px;font-weight:900;margin-bottom:5px}
 #driverHistoryFlag .historySummary{font-weight:800;margin-bottom:7px}
 #driverHistoryFlag details{margin-top:7px}
 #driverHistoryFlag summary{cursor:pointer;font-weight:800}
 #driverHistoryFlag .historyItem{padding:12px 0;border-top:1px solid rgba(255,255,255,.22);font-size:13px}
 #driverHistoryFlag .historyItem:first-child{margin-top:7px}
 #driverHistoryFlag .historyItemTitle{font-size:15px;font-weight:900;margin-bottom:7px}
 #driverHistoryFlag .historyReason{margin-top:8px;padding:8px;background:rgba(0,0,0,.16);border-radius:7px;white-space:pre-wrap}
 `;
 document.head.appendChild(s);
}

function ensureFlag(){
 const driver=byId('csDriver');
 if(!driver)return null;
 let flag=byId('driverHistoryFlag');
 if(!flag){flag=document.createElement('div');flag.id='driverHistoryFlag';flag.setAttribute('role','alert');}
 const status=byId('csEmployeeLookupStatus');
 const wrap=byId('driverSuggestionWrap');
 const anchor=status||wrap||driver;
 if(flag.parentElement!==anchor.parentElement||anchor.nextElementSibling!==flag)anchor.insertAdjacentElement('afterend',flag);
 return flag;
}

function pushInspection(rows,r){
 if(!Array.isArray(r))return;
 const type=outcomeType(r[13]);
 if(type)rows.push({source:'Inspector Check Sheet',date:r[0],savedTime:r[1],inspector:r[2],depot:r[3],driver:r[4],service:r[5],fleet:r[6],timeOn:r[7],boarding:r[8],destination:r[9],nsa:r[10],nsaFault:r[11],nsaNotes:r[12],type,reason:r[14]});
}
function pushDriverReport(rows,r){
 if(!Array.isArray(r))return;
 const type=outcomeType(r[5]);
 if(type)rows.push({source:'Driver Report',date:r[0],savedTime:r[1],inspector:r[2],driver:r[3],depot:r[4],type,reason:r[6],service:r[7],fleet:r[8]});
}
function allIssueRows(){
 const rows=[];
 try{
  if(typeof cloud!=='undefined'&&cloud){
   (cloud['Inspections']||[]).forEach(r=>pushInspection(rows,r));
   (cloud['Driver Reports']||[]).forEach(r=>pushDriverReport(rows,r));
  }
 }catch(e){console.log('Driver history cloud read failed',e);}
 try{
  (JSON.parse(localStorage.getItem('local_Inspections')||'[]')||[]).forEach(r=>pushInspection(rows,r));
  (JSON.parse(localStorage.getItem('local_Driver Reports')||'[]')||[]).forEach(r=>pushDriverReport(rows,r));
 }catch(e){console.log('Driver history local read failed',e);}
 const seen=new Set();
 return rows.filter(r=>{
  const k=[clean(r.driver),String(r.date||''),r.type,clean(r.reason),String(r.service||''),String(r.fleet||'')].join('|');
  if(!clean(r.driver)||seen.has(k))return false;
  seen.add(k);return true;
 });
}

function matchesDriver(saved,current){
 const a=clean(saved),b=clean(current);
 if(!a||!b)return false;
 if(a===b)return true;
 const stripNumber=s=>s.replace(/\b\d{3,}\b/g,'').trim().replace(/\s+/g,' ');
 const an=stripNumber(a),bn=stripNumber(b);
 if(an&&bn&&an===bn)return true;
 return an.length>=5&&bn.length>=5&&(an.startsWith(bn+' ')||bn.startsWith(an+' '));
}

function historyCard(r){
 return `<div class="historyItem">
  <div class="historyItemTitle">${outcomeLabel(r.type)} — ${esc(r.date||'Date not recorded')}${r.savedTime?` at ${esc(r.savedTime)}`:''}</div>
  ${line('Source',r.source)}
  ${line('Inspector',r.inspector)}
  ${line('Driver',r.driver)}
  ${line('Depot',r.depot)}
  ${line('Service',r.service)}
  ${line('Fleet number',r.fleet)}
  ${line('Time boarded',r.timeOn)}
  ${line('Boarding point',r.boarding)}
  ${line('Destination',r.destination)}
  ${line('NSA working',r.nsa)}
  ${line('NSA fault',r.nsaFault)}
  ${line('NSA notes',r.nsaNotes)}
  <div class="historyReason"><b>Driver report reason / inspection notes:</b><br>${esc(r.reason||'No reason or notes entered')}</div>
 </div>`;
}

function render(force=false){
 const driver=byId('csDriver');
 const flag=ensureFlag();
 if(!driver||!flag)return;
 const name=driver.value.trim();
 if(!name){flag.className='';flag.innerHTML='';lastSignature='';return;}
 const issues=allIssueRows().filter(r=>matchesDriver(r.driver,name));
 const signature=clean(name)+'|'+issues.map(r=>Object.values(r).join('~')).join('||');
 if(!force&&signature===lastSignature)return;
 const wasOpen=!!flag.querySelector('details[open]');
 if(!issues.length){flag.className='';flag.innerHTML='';lastSignature=signature;return;}
 const reported=issues.filter(r=>r.type==='reported').length;
 const advised=issues.filter(r=>r.type==='advised').length;
 issues.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
 const cls=reported?'reported':'advised';
 const title=reported?'⚠️ PREVIOUS REPORTED ISSUE':'⚠️ PREVIOUS ADVICE RECORDED';
 const summary=[reported?`${reported} reported`:null,advised?`${advised} advised`:null].filter(Boolean).join(' • ');
 flag.className=`show ${cls}`;
 flag.innerHTML=`<div class="historyTitle">${title}</div><div class="historySummary">${esc(name)} has previous history: ${summary}.</div><details${wasOpen?' open':''}><summary>View all previous information</summary>${issues.map(historyCard).join('')}</details>`;
 lastSignature=signature;
}

function init(){
 addStyles();ensureFlag();
 const driver=byId('csDriver');
 if(!driver)return;
 ['input','change','blur'].forEach(ev=>driver.addEventListener(ev,()=>setTimeout(()=>render(true),50)));
 document.addEventListener('click',e=>{if(e.target.closest('[data-driver-suggestion]'))setTimeout(()=>render(true),150);});
 const clear=byId('clearCheckFormBtn');if(clear)clear.addEventListener('click',()=>setTimeout(()=>render(true),50));
 setInterval(()=>render(false),1500);
 setTimeout(()=>render(true),1800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();