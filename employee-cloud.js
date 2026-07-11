(function(){
'use strict';
const SHEET='Employees';
const byId=id=>document.getElementById(id);
const key=v=>{const s=String(v||'').replace(/[^0-9a-z]/gi,'').toLowerCase();return /^\d+$/.test(s)?(s.replace(/^0+(?=\d)/,'')||'0'):s;};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let shared=[];

function parseRows(rows){
  if(!Array.isArray(rows)||!rows.length)return[];
  let start=0,nameCol=0,numCol=1,depotCol=2,jobCol=3;
  const first=(rows[0]||[]).map(x=>String(x||'').trim().toLowerCase());
  if(first.some(x=>x.includes('name'))&&first.some(x=>x.includes('employee'))){
    start=1;
    nameCol=first.findIndex(x=>x==='name'||x.includes('employee name'));
    numCol=first.findIndex(x=>x.includes('employee number')||x.includes('employee id'));
    depotCol=first.findIndex(x=>x.includes('depot'));
    jobCol=first.findIndex(x=>x.includes('job title')||x==='job');
  }
  return rows.slice(start).map(r=>({
    name:String(r[nameCol]||'').trim(),
    employeeNumber:String(r[numCol]||'').trim(),
    depot:depotCol>=0?String(r[depotCol]||'').trim():'',
    jobTitle:jobCol>=0?String(r[jobCol]||'').trim():''
  })).filter(e=>e.name&&e.employeeNumber);
}

function findNumber(v){const n=key(v);return n?shared.find(e=>key(e.employeeNumber)===n):null;}

function applyLookup(){
  const number=byId('csEmployeeNumber'),driver=byId('csDriver'),status=byId('csEmployeeLookupStatus');
  if(!number||!driver||!status)return;
  const value=number.value;
  if(!value.trim())return;
  const e=findNumber(value);
  if(e){
    driver.value=e.name;
    const depot=byId('csDepot');
    if(depot&&e.depot&&!depot.value.trim())depot.value=e.depot;
    status.textContent=`Found: ${e.name}${e.jobTitle?' — '+e.jobTitle:''}${e.depot?' — '+e.depot:''}`;
    status.className='employeeLookupStatus found';
  }else if(shared.length){
    status.textContent='Employee number not found';
    status.className='employeeLookupStatus missing';
  }
}

function renderShared(){
  const search=byId('employeeSearch'),results=byId('employeeResults'),count=byId('employeeCount');
  if(!search||!results||!count||!shared.length)return;
  const q=String(search.value||'').trim().toLowerCase();
  const qk=key(q);
  const rows=shared.filter(e=>!q||e.name.toLowerCase().includes(q)||String(e.employeeNumber).toLowerCase().includes(q)||key(e.employeeNumber).includes(qk)||e.depot.toLowerCase().includes(q)||e.jobTitle.toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));
  const shown=q?rows:rows.slice(0,50);
  count.textContent=q?`${rows.length} result${rows.length===1?'':'s'} from shared Google Sheet`:`Showing first ${shown.length} of ${shared.length} employees from shared Google Sheet`;
  results.innerHTML=shown.map(e=>`<div class="employeeCard"><h3>${esc(e.name)}</h3><div class="employeeNo">${esc(e.employeeNumber)}</div><div class="employeeInfo"><div><b>Depot:</b> ${esc(e.depot||'Not added')}</div><div><b>Job title:</b> ${esc(e.jobTitle||'Not added')}</div></div></div>`).join('')||'<div class="panel">No matching employee found.</div>';
}

async function loadEmployees(){
  try{
    const res=await fetch(WEB_APP_URL+'?sheet='+encodeURIComponent(SHEET)+'&_='+Date.now(),{cache:'no-store'});
    const json=await res.json();
    shared=parseRows(json.data||[]);
    window.SHARED_EMPLOYEE_DIRECTORY=shared;
    if(typeof sheets!=='undefined'&&!sheets.includes(SHEET))sheets.push(SHEET);
    if(typeof cloud!=='undefined')cloud[SHEET]=json.data||[];
    renderShared();applyLookup();
  }catch(e){console.log('Employees sheet could not be loaded',e);}
}

function bind(){
  document.addEventListener('input',e=>{
    if(e.target&&e.target.id==='csEmployeeNumber')applyLookup();
    if(e.target&&e.target.id==='employeeSearch')setTimeout(renderShared,0);
  });
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='csEmployeeNumber')applyLookup();});
  document.addEventListener('focusout',e=>{if(e.target&&e.target.id==='csEmployeeNumber')applyLookup();});
}

function init(){bind();loadEmployees();setTimeout(loadEmployees,2500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();