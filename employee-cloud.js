(function(){
'use strict';
const SHEET='Employees';
const byId=id=>document.getElementById(id);
const key=v=>{const s=String(v||'').replace(/[^0-9a-z]/gi,'').toLowerCase();return /^\d+$/.test(s)?(s.replace(/^0+(?=\d)/,'')||'0'):s;};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let shared=[];
let editingOriginalNumber='';

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
  if(!search||!results||!count)return;
  const q=String(search.value||'').trim().toLowerCase();
  const qk=key(q);
  const rows=shared.filter(e=>!q||e.name.toLowerCase().includes(q)||String(e.employeeNumber).toLowerCase().includes(q)||key(e.employeeNumber).includes(qk)||e.depot.toLowerCase().includes(q)||e.jobTitle.toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));
  const shown=q?rows:rows.slice(0,50);
  count.textContent=shared.length?(q?`${rows.length} result${rows.length===1?'':'s'} from shared Google Sheet`:`Showing first ${shown.length} of ${shared.length} employees from shared Google Sheet`):'No employees found in the shared Google Sheet.';
  results.innerHTML=shown.map(e=>`<div class="employeeCard"><h3>${esc(e.name)}</h3><div class="employeeNo">${esc(e.employeeNumber)}</div><div class="employeeInfo"><div><b>Depot:</b> ${esc(e.depot||'Not added')}</div><div><b>Job title:</b> ${esc(e.jobTitle||'Not added')}</div></div><div class="employeeActions"><button class="btn" data-cloud-employee-edit="${esc(e.employeeNumber)}">EDIT</button><button class="btn danger" data-cloud-employee-remove="${esc(e.employeeNumber)}">REMOVE</button></div></div>`).join('')||'<div class="panel">No matching employee found.</div>';
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

function editorEntry(){
  return {
    name:String(byId('employeeName')?.value||'').trim(),
    employeeNumber:String(byId('employeeNumber')?.value||'').trim(),
    depot:String(byId('employeeDepot')?.value||'').trim(),
    jobTitle:String(byId('employeeJobTitle')?.value||'').trim()
  };
}
function resetEditor(){
  editingOriginalNumber='';
  ['employeeName','employeeNumber','employeeDepot','employeeJobTitle'].forEach(id=>{if(byId(id))byId(id).value='';});
  if(byId('employeeEditorTitle'))byId('employeeEditorTitle').textContent='Add Employee';
  if(byId('saveEmployeeBtn'))byId('saveEmployeeBtn').textContent='ADD EMPLOYEE';
  if(byId('cancelEmployeeBtn'))byId('cancelEmployeeBtn').style.display='none';
}
async function sendEmployeeAction(action,employee,originalEmployeeNumber){
  if(byId('employeeCount'))byId('employeeCount').textContent='Saving to shared Google Sheet...';
  try{
    await fetch(WEB_APP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sheet:SHEET,action,employee,originalEmployeeNumber:originalEmployeeNumber||''})});
    setTimeout(loadEmployees,1200);
  }catch(e){alert('The employee change could not be sent to Google Sheets.');}
}
function saveSharedEmployee(){
  const entry=editorEntry();
  if(!entry.name||!entry.employeeNumber){alert('Enter the employee name and employee number.');return;}
  const duplicate=shared.find(e=>key(e.employeeNumber)===key(entry.employeeNumber)&&key(e.employeeNumber)!==key(editingOriginalNumber));
  if(duplicate){alert('That employee number already exists.');return;}
  const action=editingOriginalNumber?'update':'add';
  sendEmployeeAction(action,entry,editingOriginalNumber);
  resetEditor();
}
function editSharedEmployee(number){
  const e=findNumber(number);if(!e)return;
  editingOriginalNumber=e.employeeNumber;
  byId('employeeName').value=e.name;
  byId('employeeNumber').value=e.employeeNumber;
  byId('employeeDepot').value=e.depot||'';
  byId('employeeJobTitle').value=e.jobTitle||'';
  byId('employeeEditorTitle').textContent='Edit Employee';
  byId('saveEmployeeBtn').textContent='SAVE CHANGES';
  byId('cancelEmployeeBtn').style.display='';
  byId('employeeDirectory').scrollIntoView({behavior:'smooth'});
}
function removeSharedEmployee(number){
  const e=findNumber(number);if(!e)return;
  if(!confirm(`Remove ${e.name} (${e.employeeNumber}) from the shared directory?`))return;
  sendEmployeeAction('delete',null,e.employeeNumber);
}

function bind(){
  document.addEventListener('input',e=>{
    if(e.target&&e.target.id==='csEmployeeNumber')applyLookup();
    if(e.target&&e.target.id==='employeeSearch')setTimeout(renderShared,0);
  });
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='csEmployeeNumber')applyLookup();});
  document.addEventListener('focusout',e=>{if(e.target&&e.target.id==='csEmployeeNumber')applyLookup();});
  document.addEventListener('click',e=>{
    if(e.target&&e.target.id==='saveEmployeeBtn'){
      e.preventDefault();e.stopImmediatePropagation();saveSharedEmployee();return;
    }
    if(e.target&&e.target.id==='cancelEmployeeBtn'){
      e.preventDefault();e.stopImmediatePropagation();resetEditor();return;
    }
    const edit=e.target.closest('[data-cloud-employee-edit]');
    if(edit){e.preventDefault();editSharedEmployee(edit.dataset.cloudEmployeeEdit);return;}
    const remove=e.target.closest('[data-cloud-employee-remove]');
    if(remove){e.preventDefault();removeSharedEmployee(remove.dataset.cloudEmployeeRemove);}
  },true);
}

function init(){bind();loadEmployees();setTimeout(loadEmployees,2500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();