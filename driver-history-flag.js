(function(){
'use strict';
const byId=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
let lastValue='';

function addStyles(){
 if(byId('driverHistoryFlagCss'))return;
 const s=document.createElement('style');
 s.id='driverHistoryFlagCss';
 s.textContent=`
 #driverHistoryFlag{display:none;grid-column:1/-1;border-radius:12px;padding:13px 14px;margin:4px 0 8px;line-height:1.4}
 #driverHistoryFlag.show{display:block}
 #driverHistoryFlag.advised{background:#4b3510;border:2px solid #e2a52b;color:#fff4d6}
 #driverHistoryFlag.reported{background:#551c22;border:2px solid #e24e5b;color:#ffe7e9}
 #driverHistoryFlag .historyTitle{font-size:17px;font-weight:900;margin-bottom:5px}
 #driverHistoryFlag .historySummary{font-weight:800;margin-bottom:7px}
 #driverHistoryFlag details{margin-top:7px}
 #driverHistoryFlag summary{cursor:pointer;font-weight:800}
 #driverHistoryFlag .historyItem{padding:8px 0;border-top:1px solid rgba(255,255,255,.18);font-size:13px}
 #driverHistoryFlag .historyItem:first-child{margin-top:7px}
 `;
 document.head.appendChild(s);
}

function ensureFlag(){
 const driver=byId('csDriver');
 if(!driver)return null;
 let flag=byId('driverHistoryFlag');
 if(!flag){
  flag=document.createElement('div');
  flag.id='driverHistoryFlag';
  flag.setAttribute('role','alert');
 }
 const status=byId('csEmployeeLookupStatus');
 const wrap=byId('driverSuggestionWrap');
 const anchor=status||wrap||driver;
 if(flag.parentElement!==anchor.parentElement||anchor.nextElementSibling!==flag)anchor.insertAdjacentElement('afterend',flag);
 return flag;
}

function allIssueRows(){
 const rows=[];
 try{
  if(typeof cloud!=='undefined'){
   (cloud['Inspections']||[]).slice(1).forEach(r=>{
    const outcome=String(r[13]||'');
    if(outcome==='Advised'||outcome==='Offence Report Submitted')rows.push({driver:r[4],date:r[0],outcome,reason:r[14],service:r[5],fleet:r[6],depot:r[3]});
   });
   (cloud['Driver Reports']||[]).slice(1).forEach(r=>{
    const outcome=String(r[5]||'');
    if(outcome==='Advised'||outcome==='Offence Report Submitted')rows.push({driver:r[3],date:r[0],outcome,reason:r[6],service:r[7],fleet:r[8],depot:r[4]});
   });
  }
 }catch(e){}
 try{
  const localInspections=JSON.parse(localStorage.getItem('local_Inspections')||'[]');
  localInspections.forEach(r=>{
   const outcome=String(r[13]||'');
   if(outcome==='Advised'||outcome==='Offence Report Submitted')rows.push({driver:r[4],date:r[0],outcome,reason:r[14],service:r[5],fleet:r[6],depot:r[3]});
  });
  const localReports=JSON.parse(localStorage.getItem('local_Driver Reports')||'[]');
  localReports.forEach(r=>{
   const outcome=String(r[5]||'');
   if(outcome==='Advised'||outcome==='Offence Report Submitted')rows.push({driver:r[3],date:r[0],outcome,reason:r[6],service:r[7],fleet:r[8],depot:r[4]});
  });
 }catch(e){}
 const seen=new Set();
 return rows.filter(r=>{
  const k=[norm(r.driver),r.date,r.outcome,norm(r.reason),r.service,r.fleet].join('|');
  if(seen.has(k))return false;seen.add(k);return true;
 });
}

function matchesDriver(saved,current){
 const a=norm(saved),b=norm(current);
 if(!a||!b)return false;
 return a===b;
}

function render(){
 const driver=byId('csDriver');
 const flag=ensureFlag();
 if(!driver||!flag)return;
 const name=driver.value.trim();
 if(!name){flag.className='';flag.innerHTML='';lastValue='';return;}
 const issues=allIssueRows().filter(r=>matchesDriver(r.driver,name));
 if(!issues.length){flag.className='';flag.innerHTML='';lastValue=name;return;}
 const reported=issues.filter(r=>r.outcome==='Offence Report Submitted').length;
 const advised=issues.filter(r=>r.outcome==='Advised').length;
 issues.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
 const cls=reported?'reported':'advised';
 const title=reported?'⚠️ PREVIOUS REPORTED ISSUE':'⚠️ PREVIOUS ADVICE RECORDED';
 const summary=[reported?`${reported} reported`:null,advised?`${advised} advised`:null].filter(Boolean).join(' • ');
 flag.className=`show ${cls}`;
 flag.innerHTML=`<div class="historyTitle">${title}</div><div class="historySummary">${esc(name)} has previous history: ${summary}.</div><details><summary>View previous issues</summary>${issues.slice(0,5).map(r=>`<div class="historyItem"><b>${esc(r.outcome==='Offence Report Submitted'?'Reported':'Advised')}</b> — ${esc(r.date||'Date not recorded')}<br>${esc(r.reason||'No reason entered')}${r.service?`<br>Service ${esc(r.service)}`:''}${r.fleet?` • Fleet ${esc(r.fleet)}`:''}${r.depot?` • ${esc(r.depot)}`:''}</div>`).join('')}</details>`;
 lastValue=name;
}

function init(){
 addStyles();ensureFlag();
 const driver=byId('csDriver');
 if(!driver)return;
 ['input','change','blur'].forEach(ev=>driver.addEventListener(ev,()=>setTimeout(render,20)));
 document.addEventListener('click',e=>{if(e.target.closest('[data-driver-suggestion]'))setTimeout(render,60);});
 const clear=byId('clearCheckFormBtn');if(clear)clear.addEventListener('click',()=>setTimeout(render,20));
 setInterval(()=>{const value=driver.value.trim();if(value!==lastValue||value)render();},1200);
 setTimeout(render,1500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();