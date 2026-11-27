(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').trim().toLowerCase();
function addStyles(){if($('homeGlobalSearchCss'))return;const s=document.createElement('style');s.id='homeGlobalSearchCss';s.textContent=`#home .ledShell{flex-direction:column!important;gap:4px!important;height:auto!important;min-height:78px!important;padding:8px 12px!important}#home #staticBusClock{line-height:1.05!important}#home #syncStatus{display:block!important;position:static!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;color:#ffb24d!important;font-size:11px!important;text-align:center!important;min-height:14px!important}#homeSearchWrap{position:relative;order:3!important;margin:0!important}#homeGlobalSearch{width:100%;box-sizing:border-box;padding:14px 46px 14px 14px;border-radius:12px;border:1px solid #416783;background:#0b2235;color:#fff;font-size:16px;font-weight:700}#homeSearchClear{position:absolute;right:7px;top:7px;width:34px;height:34px;border:0;border-radius:8px;background:#173b57;color:#fff;font-size:20px}#homeSearchResults{display:none;margin-top:8px;max-height:520px;overflow:auto;background:#071725;border:1px solid #345a78;border-radius:12px;padding:8px}#homeSearchResults.show{display:block}.homeDriverResult{padding:11px 12px;margin:7px 0;border-radius:10px;background:#102b40;border-left:6px solid #4c9bea}.homeDriverResult.clear{border-left-color:#3fc17f}.homeDriverResult.advised{border-left-color:#e2a52b}.homeDriverResult.reported{border-left-color:#e24e5b}.homeDriverResult b{display:block}.homeDriverResult small{display:block;margin-top:3px;opacity:.8}.homeDriverStatus{margin-top:7px;font-weight:900}.homeDriverExpand{width:100%;margin-top:9px;padding:9px;border-radius:8px;border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.18);color:#fff;font-weight:900}.homeDriverDetails{display:none;margin-top:9px}.homeDriverDetails.show{display:block}.homeHistoryItem{padding:9px;margin-top:7px;border-radius:8px;background:rgba(0,0,0,.18);font-size:12px;line-height:1.45}.homeHistoryItem.report{border-left:4px solid #e24e5b}.homeHistoryItem.advice{border-left:4px solid #e2a52b}.homeHistoryItem.check{border-left:4px solid #3fc17f}.homeHistoryReason{margin-top:4px;font-weight:800;white-space:pre-wrap}.homeSearchEmpty{padding:16px;text-align:center;opacity:.7}`;document.head.appendChild(s);}
function ensureUi(){const home=$('home'),panel=home?.querySelector('.panel'),shell=home?.querySelector('.ledShell'),status=$('syncStatus');if(!home||!panel||!shell)return false;if(status&&status.parentElement!==shell)shell.appendChild(status);if(!$('homeSearchWrap')){const wrap=document.createElement('div');wrap.id='homeSearchWrap';wrap.innerHTML='<input id="homeGlobalSearch" type="search" autocomplete="off" placeholder="Search driver name or employee number…"><button id="homeSearchClear" type="button">×</button><div id="homeSearchResults"></div>';panel.appendChild(wrap);$('homeGlobalSearch').addEventListener('input',render);$('homeGlobalSearch').addEventListener('focus',render);$('homeSearchClear').onclick=()=>{$('homeGlobalSearch').value='';$('homeSearchResults').classList.remove('show');};}return true;}
function rows(sheet){try{const a=(typeof cloud!=='undefined'&&Array.isArray(cloud[sheet]))?cloud[sheet]:[];if(!a.length)return[];const h=(a[0]||[]).map(x=>norm(x));return h.some(x=>['date','time','driver','service','fleet'].includes(x))?a.slice(1):a.slice();}catch(e){return[];}}
function employees(){const out=[],seen=new Set(),sources=[window.SHARED_EMPLOYEE_DIRECTORY,window.INSPECTOR_EMPLOYEE_DIRECTORY];try{sources.push(JSON.parse(localStorage.getItem('inspectorEmployeeDirectoryV3')||localStorage.getItem('inspectorEmployeeDirectoryV2')||'[]'));}catch(e){}for(const src of sources){if(!Array.isArray(src))continue;for(const x of src){const e=Array.isArray(x)?{name:x[0],employeeNumber:x[1],depot:x[2],jobTitle:x[3]}:x;const name=String(e?.name||'').trim(),num=String(e?.employeeNumber||e?.['Employee Number']||'').trim();if(!name&&!num)continue;const key=(num||name).toLowerCase();if(seen.has(key))continue;seen.add(key);out.push({name,employeeNumber:num,depot:e?.depot||'',jobTitle:e?.jobTitle||''});}}return out;}
function driverHistory(name){const key=norm(name);const checks=rows('Inspections').filter(r=>norm(r[4])===key);const actions=checks.filter(r=>norm(r[13])==='offence report submitted'||norm(r[13])==='advised');const offence=actions.filter(r=>norm(r[13])==='offence report submitted').length;const advised=actions.filter(r=>norm(r[13])==='advised').length;let cls='first',text='🔵 1ST TIME CHECK',sub='No previous inspector checks were found for this driver.';if(offence){cls='reported';text='🔴 PREVIOUS OFFENCE REPORT SUBMITTED';sub=`${offence} offence report${offence===1?'':'s'} • ${advised} advised record${advised===1?'':'s'}`;}else if(advised){cls='advised';text='🟡 PREVIOUSLY ADVISED';sub=`${advised} advised record${advised===1?'':'s'} • ${checks.length} previous check${checks.length===1?'':'s'}`;}else if(checks.length){cls='clear';text='🟢 PREVIOUSLY CHECKED — NO ISSUES';sub=`Previously checked ${checks.length} time${checks.length===1?'':'s'}`;}return{cls,text,sub,checks,actions};}
function detailsHtml(h){const items=[];h.checks.slice().reverse().forEach(r=>{const action=norm(r[13]);const isReport=action==='offence report submitted'||action==='advised';const type=action==='offence report submitted'?'report':action==='advised'?'advice':'check';items.push(`<div class="homeHistoryItem ${type}"><b>${isReport?esc(r[13]):'Inspector Check'} — ${esc(r[0]||'Date not recorded')}</b><div>Service ${esc(r[5]||'-')} • Fleet ${esc(r[6]||'-')}</div><div>${esc(r[3]||'-')} • ${esc(r[8]||'-')} to ${esc(r[9]||'-')} • ${esc(r[2]||'-')}</div>${isReport?`<div class="homeHistoryReason">${esc(r[14]||'No reason entered')}</div>`:''}</div>`);});return items.join('')||'<div class="homeHistoryItem">No previous report details available.</div>';}
function render(){const input=$('homeGlobalSearch'),box=$('homeSearchResults');if(!input||!box)return;const q=norm(input.value);if(!q){box.classList.remove('show');box.innerHTML='';return;}const matches=employees().filter(e=>norm(e.name).includes(q)||norm(e.employeeNumber).includes(q)).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,20);if(!matches.length){box.innerHTML='<div class="homeSearchEmpty">No matching driver found.</div>';box.classList.add('show');return;}box.innerHTML=matches.map((e,i)=>{const h=driverHistory(e.name),count=h.checks.length;return `<div class="homeDriverResult ${h.cls}"><b>${esc(e.name||'Unknown driver')}</b><small>Employee ${esc(e.employeeNumber||'-')}${e.depot?' • '+esc(e.depot):''}</small><div class="homeDriverStatus">${h.text}</div><small>${esc(h.sub)}</small>${count?`<button type="button" class="homeDriverExpand" data-expand-driver="${i}">SHOW REPORT DETAILS</button><div class="homeDriverDetails" id="homeDriverDetails${i}">${detailsHtml(h)}</div>`:''}</div>`;}).join('');box.classList.add('show');box.querySelectorAll('[data-expand-driver]').forEach(btn=>btn.onclick=()=>{const d=$('homeDriverDetails'+btn.dataset.expandDriver),open=d?.classList.toggle('show');btn.textContent=open?'HIDE REPORT DETAILS':'SHOW REPORT DETAILS';});}


function ensureUnchecked(){
 const nav=$('reportsChecksNav'),parent=$('reportsChecks');if(!nav||!parent)return false;if($('homeUncheckedDrivers'))return true;
 const btn=document.createElement('button');btn.type='button';btn.dataset.open='homeUncheckedDrivers';btn.textContent='Drivers Never Checked';nav.appendChild(btn);
 const section=document.createElement('section');section.id='homeUncheckedDrivers';section.className='section';
 section.innerHTML='<button class="backBtn" data-open="reportsChecks">← Back</button><h2>Drivers Never Checked</h2><div class="panel"><p>Employee list compared with all recorded inspections.</p><div id="homeUncheckedCount" aria-live="polite"></div><select class="field" id="homeUncheckedDepot" aria-label="Filter by depot"><option value="">All depots</option></select><input class="field" id="homeUncheckedQuery" type="search" placeholder="Search name or employee number"><button id="homeUncheckedRefresh" type="button">Refresh from Google Sheets</button><div id="homeUncheckedResults" aria-live="polite"></div></div>';
 parent.insertAdjacentElement('afterend',section);
 const normalize=v=>norm(v).normalize('NFKC').replace(/\s+/g,' ');
 const number=v=>String(v??'').trim().replace(/^0+(?=\d)/,'');
 const header=v=>normalize(v).replace(/[^a-z0-9]/g,'');
 let roster=null,checks=null,busy=false,error='';
 function parseEmployees(data){
  if(!data.length)throw Error('Employees sheet returned no rows');
  const h=data[0].map(header),name=h.findIndex(x=>['name','employeename','drivername','fullname','staffname'].includes(x)),num=h.findIndex(x=>['employeenumber','employeeid','staffnumber','payrollnumber','driver number'.replace(' ','')].includes(x));
  const first=h.findIndex(x=>['firstname','forename'].includes(x)),last=h.findIndex(x=>['lastname','surname'].includes(x));
  const hasHeader=name>=0||num>=0||first>=0;
  const depot=h.findIndex(x=>x.includes('depot')||x==='location');
  return data.slice(hasHeader?1:0).filter(Array.isArray).map(r=>({name:String(hasHeader?(name>=0?r[name]:first>=0&&last>=0?[r[first],r[last]].join(' '):r[0]):r[0]||'').trim(),employeeNumber:String(r[hasHeader&&num>=0?num:1]??'').trim(),depot:String(r[hasHeader?depot:2]??'').trim()})).filter(e=>e.name&&e.employeeNumber);
 }
 function parseChecks(data){
  if(!data.length)throw Error('Inspections sheet returned no rows');
  const h=data[0].map(header),driver=h.findIndex(x=>['driver','drivername','employeename'].includes(x)),num=h.findIndex(x=>['employeenumber','employeeid','drivernumber','payrollnumber'].includes(x));
  const hasHeader=driver>=0||h.includes('date')||h.includes('inspector');
  return data.slice(hasHeader?1:0).filter(Array.isArray).map(r=>({name:normalize(r[driver>=0?driver:4]),num:num>=0?number(r[num]):''})).filter(r=>r.name||r.num);
 }
 function renderUnchecked(){
  const box=$('homeUncheckedResults'),count=$('homeUncheckedCount'),select=$('homeUncheckedDepot');
  if(!roster||!checks){count.textContent=busy?'Loading both Google Sheets…':error||'Open to load records.';box.textContent='';return;}
  if(!roster.length){count.textContent='No employee records could be read. Check Employees sheet columns.';box.textContent='';return;}
  const selected=select.value,depots=[...new Set(roster.map(e=>e.depot).filter(Boolean))].sort();
  const opts=['<option value="">All depots</option>',...depots.map(d=>'<option value="'+esc(d)+'">'+esc(d)+'</option>')].join('');
  if(select.dataset.options!==opts){select.innerHTML=opts;select.dataset.options=opts;select.value=selected;}
  const names=new Set(checks.filter(r=>!r.num).map(r=>r.name)),nums=new Set(checks.map(r=>r.num).filter(Boolean));
  const unique=[...new Map(roster.map(e=>[number(e.employeeNumber),e])).values()];
  const list=unique.filter(e=>!nums.has(number(e.employeeNumber))&&!names.has(normalize(e.name))&&!names.has(normalize(e.employeeNumber))).sort((a,b)=>a.name.localeCompare(b.name));
  const query=normalize($('homeUncheckedQuery').value);
  const visible=list.filter(e=>(!select.value||e.depot===select.value)&&(!query||normalize(e.name).includes(query)||normalize(e.employeeNumber).includes(query)));
  count.textContent=list.length+' never checked • '+(unique.length-list.length)+' checked • '+unique.length+' employees compared';
  box.innerHTML=(error?'<p>'+esc(error)+' — showing last successful comparison.</p>':'')+'<p>'+visible.length+' matching results • '+checks.length+' inspection records read</p>'+(visible.map(e=>'<div class="homeDriverResult"><b>'+esc(e.name)+'</b><small>Employee '+esc(e.employeeNumber)+' • '+esc(e.depot||'Depot not recorded')+'</small></div>').join('')||'<p>No matching drivers.</p>');
 }
 async function getSheet(sheet){
  const url=WEB_APP_URL+(WEB_APP_URL.includes('?')?'&':'?')+'sheet='+encodeURIComponent(sheet)+'&_='+Date.now();
  const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw Error(sheet+' HTTP '+response.status);
  const json=await response.json();if(!Array.isArray(json.data))throw Error(sheet+' did not return a valid list');return json.data;
 }
 async function refresh(){if(busy)return;busy=true;error='';$('homeUncheckedRefresh').disabled=true;renderUnchecked();try{const [e,c]=await Promise.all([getSheet('Employees'),getSheet('Inspections')]);const nextRoster=parseEmployees(e),nextChecks=parseChecks(c);if(!nextRoster.length)throw Error('No employee records could be parsed');roster=nextRoster;checks=nextChecks;}catch(e){error='Google Sheets comparison failed: '+e.message;}finally{busy=false;$('homeUncheckedRefresh').disabled=false;renderUnchecked();}}
 btn.addEventListener('click',refresh);
 $('homeUncheckedRefresh').onclick=refresh;$('homeUncheckedDepot').onchange=renderUnchecked;$('homeUncheckedQuery').oninput=renderUnchecked;
 setInterval(()=>{if(section.classList.contains('active')&&!document.hidden)refresh();},30000);
 return true;
}


function init(){addStyles();let tries=0;const timer=setInterval(()=>{tries++;const homeReady=ensureUi(),reportReady=ensureUnchecked();if((homeReady&&reportReady)||tries>80)clearInterval(timer);},250);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();