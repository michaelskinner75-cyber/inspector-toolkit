(function(){
'use strict';
const SHEET='Employees';
const byId=id=>document.getElementById(id);
const key=v=>{const s=String(v||'').normalize('NFKC').replace(/[^0-9a-z]/gi,'').toLowerCase();return /^\d+$/.test(s)?(s.replace(/^0+(?=\d)/,'')||'0'):s;};
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

function addLookupStyles(){
  if(byId('driverSuggestionCss'))return;
  const s=document.createElement('style');
  s.id='driverSuggestionCss';
  s.textContent=`
    #csDriver{position:relative}
    .driverSuggestionWrap{grid-column:1/-1;position:relative;margin-top:-8px}
    .driverSuggestions{display:none;background:#102638;border:1px solid #3e6d8d;border-radius:10px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.35);max-height:280px;overflow-y:auto;position:relative;z-index:50}
    .driverSuggestions.show{display:block}
    .driverSuggestion{display:block;width:100%;text-align:left;background:transparent;color:#fff;border:0;border-bottom:1px solid rgba(255,255,255,.09);padding:12px 14px;font:inherit;cursor:pointer}
    .driverSuggestion:last-child{border-bottom:0}
    .driverSuggestion:hover,.driverSuggestion:focus{background:#17415f;outline:none}
    .driverSuggestion strong{display:block;font-size:15px}
    .driverSuggestion span{display:block;font-size:12px;color:#b8cbd8;margin-top:3px}
    .employeeLookupStatus{grid-column:1/-1;font-size:12px;color:var(--muted,#b8c5ce);margin:-3px 0 3px}
    .employeeLookupStatus.found{color:#6fd0a4;font-weight:800}
    .employeeLookupStatus.missing{color:#ffbf66;font-weight:800}
  `;
  document.head.appendChild(s);
}

function setupUnifiedDriverLookup(){
  const driver=byId('csDriver');
  if(!driver)return;
  const oldNumber=byId('csEmployeeNumber');
  if(oldNumber)oldNumber.remove();
  driver.placeholder='Driver name or employee number';
  driver.autocomplete='off';

  let status=byId('csEmployeeLookupStatus');
  if(!status){
    status=document.createElement('div');
    status.id='csEmployeeLookupStatus';
    status.className='employeeLookupStatus';
    driver.parentNode.insertBefore(status,driver.nextSibling);
  }

  let wrap=byId('driverSuggestionWrap');
  if(!wrap){
    wrap=document.createElement('div');
    wrap.id='driverSuggestionWrap';
    wrap.className='driverSuggestionWrap';
    wrap.innerHTML='<div id="driverSuggestions" class="driverSuggestions"></div>';
    status.parentNode.insertBefore(wrap,status.nextSibling);
  }

  const suggestions=byId('driverSuggestions');

  function chooseEmployee(employee){
    driver.value=employee.name;
    const depot=byId('csDepot');
    if(depot&&employee.depot&&!depot.value.trim())depot.value=employee.depot;
    status.textContent=`Selected: ${employee.name} — ${employee.employeeNumber}${employee.jobTitle?' — '+employee.jobTitle:''}${employee.depot?' — '+employee.depot:''}`;
    status.className='employeeLookupStatus found';
    suggestions.classList.remove('show');
    suggestions.innerHTML='';
    driver.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function matchesFor(value){
    const raw=String(value||'').trim();
    if(!raw)return[];
    const lower=raw.toLowerCase();
    const numberSearch=/\d/.test(raw)&&!/[a-z]/i.test(raw);
    let rows=shared.filter(e=>{
      if(numberSearch)return key(e.employeeNumber).includes(key(raw));
      return e.name.toLowerCase().includes(lower)||String(e.employeeNumber).toLowerCase().includes(lower);
    });
    rows.sort((a,b)=>{
      if(numberSearch){
        const ae=key(a.employeeNumber)===key(raw)?0:1,be=key(b.employeeNumber)===key(raw)?0:1;
        if(ae!==be)return ae-be;
      }else{
        const as=a.name.toLowerCase().startsWith(lower)?0:1,bs=b.name.toLowerCase().startsWith(lower)?0:1;
        if(as!==bs)return as-bs;
      }
      return a.name.localeCompare(b.name);
    });
    return rows.slice(0,8);
  }

  function showSuggestions(){
    const value=driver.value.trim();
    if(!value||!shared.length){suggestions.classList.remove('show');suggestions.innerHTML='';status.textContent='';status.className='employeeLookupStatus';return;}
    const rows=matchesFor(value);
    if(!rows.length){
      suggestions.classList.remove('show');suggestions.innerHTML='';
      status.textContent='No matching employee found';status.className='employeeLookupStatus missing';
      return;
    }
    status.textContent=/^\d/.test(value)?'Select the matching driver below':'Select a driver from the suggestions below';
    status.className='employeeLookupStatus';
    suggestions.innerHTML=rows.map((e,i)=>`<button type="button" class="driverSuggestion" data-driver-suggestion="${i}"><strong>${esc(e.name)}</strong><span>Employee ${esc(e.employeeNumber)}${e.depot?' • '+esc(e.depot):''}${e.jobTitle?' • '+esc(e.jobTitle):''}</span></button>`).join('');
    suggestions.classList.add('show');
    suggestions.querySelectorAll('[data-driver-suggestion]').forEach((b,i)=>b.addEventListener('click',()=>chooseEmployee(rows[i])));
  }

  driver.addEventListener('input',showSuggestions);
  driver.addEventListener('focus',showSuggestions);
  driver.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&suggestions.classList.contains('show')){
      const first=suggestions.querySelector('.driverSuggestion');
      if(first){e.preventDefault();first.click();}
    }
    if(e.key==='Escape')suggestions.classList.remove('show');
  });
  document.addEventListener('click',e=>{if(e.target!==driver&&!wrap.contains(e.target))suggestions.classList.remove('show');});
  const clear=byId('clearCheckFormBtn');
  if(clear)clear.addEventListener('click',()=>setTimeout(()=>{status.textContent='';status.className='employeeLookupStatus';suggestions.innerHTML='';suggestions.classList.remove('show');},0));
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
    renderShared();
  }catch(e){console.log('Employees sheet could not be loaded',e);}
}

function editorEntry(){return{name:String(byId('employeeName')?.value||'').trim(),employeeNumber:String(byId('employeeNumber')?.value||'').trim(),depot:String(byId('employeeDepot')?.value||'').trim(),jobTitle:String(byId('employeeJobTitle')?.value||'').trim()};}
function resetEditor(){editingOriginalNumber='';['employeeName','employeeNumber','employeeDepot','employeeJobTitle'].forEach(id=>{if(byId(id))byId(id).value='';});if(byId('employeeEditorTitle'))byId('employeeEditorTitle').textContent='Add Employee';if(byId('saveEmployeeBtn'))byId('saveEmployeeBtn').textContent='ADD EMPLOYEE';if(byId('cancelEmployeeBtn'))byId('cancelEmployeeBtn').style.display='none';}
async function sendEmployeeAction(action,employee,originalEmployeeNumber){if(byId('employeeCount'))byId('employeeCount').textContent='Saving to shared Google Sheet...';try{await fetch(WEB_APP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sheet:SHEET,action,employee,originalEmployeeNumber:originalEmployeeNumber||''})});setTimeout(loadEmployees,1200);}catch(e){alert('The employee change could not be sent to Google Sheets.');}}
function saveSharedEmployee(){const entry=editorEntry();if(!entry.name||!entry.employeeNumber){alert('Enter the employee name and employee number.');return;}const duplicate=shared.find(e=>key(e.employeeNumber)===key(entry.employeeNumber)&&key(e.employeeNumber)!==key(editingOriginalNumber));if(duplicate){alert('That employee number already exists.');return;}sendEmployeeAction(editingOriginalNumber?'update':'add',entry,editingOriginalNumber);resetEditor();}
function editSharedEmployee(number){const e=findNumber(number);if(!e)return;editingOriginalNumber=e.employeeNumber;byId('employeeName').value=e.name;byId('employeeNumber').value=e.employeeNumber;byId('employeeDepot').value=e.depot||'';byId('employeeJobTitle').value=e.jobTitle||'';byId('employeeEditorTitle').textContent='Edit Employee';byId('saveEmployeeBtn').textContent='SAVE CHANGES';byId('cancelEmployeeBtn').style.display='';byId('employeeDirectory').scrollIntoView({behavior:'smooth'});}
function removeSharedEmployee(number){const e=findNumber(number);if(!e||!confirm(`Remove ${e.name} (${e.employeeNumber}) from the shared directory?`))return;sendEmployeeAction('delete',null,e.employeeNumber);}

function bind(){
  document.addEventListener('input',e=>{if(e.target&&e.target.id==='employeeSearch')setTimeout(renderShared,0);});
  document.addEventListener('click',e=>{
    if(e.target&&e.target.id==='saveEmployeeBtn'){e.preventDefault();e.stopImmediatePropagation();saveSharedEmployee();return;}
    if(e.target&&e.target.id==='cancelEmployeeBtn'){e.preventDefault();e.stopImmediatePropagation();resetEditor();return;}
    const edit=e.target.closest('[data-cloud-employee-edit]');if(edit){e.preventDefault();editSharedEmployee(edit.dataset.cloudEmployeeEdit);return;}
    const remove=e.target.closest('[data-cloud-employee-remove]');if(remove){e.preventDefault();removeSharedEmployee(remove.dataset.cloudEmployeeRemove);}
  },true);
}

function init(){addLookupStyles();setupUnifiedDriverLookup();bind();loadEmployees();setTimeout(loadEmployees,2500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();