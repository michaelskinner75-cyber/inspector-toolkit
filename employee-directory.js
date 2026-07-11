(function(){
'use strict';
const KEY='inspectorEmployeeDirectoryV3';
const LEGACY_KEY='inspectorEmployeeDirectoryV2';
const byId=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').trim().toLowerCase();
const numberKey=v=>{const s=String(v||'').replace(/\s+/g,'').trim().toLowerCase();return /^\d+$/.test(s)?(s.replace(/^0+(?=\d)/,'')||'0'):s;};
const baseEmployees=Array.isArray(window.INSPECTOR_EMPLOYEE_DIRECTORY)?window.INSPECTOR_EMPLOYEE_DIRECTORY:[];
let employees=[];
let editing=-1;

function cleanEntry(e){
  if(Array.isArray(e))e={name:e[0],employeeNumber:e[1],depot:e[2]||'',jobTitle:e[3]||''};
  return {
    name:String(e?.name||'').replace(/\s*-\s*$/,'').trim(),
    employeeNumber:String(e?.employeeNumber||e?.['Employee Number']||e?.['Employee ID']||'').trim(),
    depot:String(e?.depot||e?.Depot||'').trim(),
    jobTitle:String(e?.jobTitle||e?.['Job Title']||'').trim()
  };
}
function mergeByNumber(base,local){
  const map=new Map();
  base.map(cleanEntry).filter(e=>e.name&&e.employeeNumber).forEach(e=>map.set(numberKey(e.employeeNumber),e));
  local.map(cleanEntry).filter(e=>e.name&&e.employeeNumber).forEach(e=>map.set(numberKey(e.employeeNumber),e));
  return [...map.values()];
}
function load(){
  let local=[];
  try{local=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(LEGACY_KEY)||'[]');}
  catch(e){local=[];}
  if(!Array.isArray(local))local=[];
  employees=mergeByNumber(baseEmployees,local);
}
function save(){localStorage.setItem(KEY,JSON.stringify(employees));}

function styles(){
  if(byId('employeeDirectoryCss'))return;
  const s=document.createElement('style');
  s.id='employeeDirectoryCss';
  s.textContent=`
  .nav button[data-open="employeeDirectory"]::before{content:'👥'}
  .employeeSearch{font-size:18px!important;padding:14px!important}
  .employeeForm{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
  .employeeTools,.employeeActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
  .employeeCount,.employeeHint{font-size:13px;color:var(--muted,#b8c5ce);margin-top:9px}
  .employeeCard{background:#0a1b2a;border-left:6px solid #4493c8;border-radius:10px;padding:12px;margin:9px 0}
  .employeeCard h3{margin:0 0 4px}.employeeNo{font-size:20px;font-weight:900;margin-bottom:7px}
  .employeeInfo{display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:13px}
  .employeeActions .btn{padding:8px 11px;font-size:12px}
  .employeeLookupStatus{grid-column:1/-1;font-size:12px;color:var(--muted,#b8c5ce);margin:-3px 0 3px}
  .employeeLookupStatus.found{color:#6fd0a4;font-weight:800}
  .employeeLookupStatus.missing{color:#ffbf66;font-weight:800}
  @media(max-width:650px){.employeeForm,.employeeInfo{grid-template-columns:1fr}}
  `;
  document.head.appendChild(s);
}
function homeButton(){
  const nav=document.querySelector('#home .nav');
  if(!nav||nav.querySelector('[data-open="employeeDirectory"]'))return;
  const b=document.createElement('button');
  b.type='button';b.dataset.open='employeeDirectory';b.textContent='Employee Directory';
  nav.appendChild(b);
}
function page(){
  const machine=document.querySelector('.machine');
  if(!machine||byId('employeeDirectory'))return;
  machine.insertAdjacentHTML('beforeend',`
  <section id="employeeDirectory" class="section">
    <button class="backBtn" data-open="home">← Back</button>
    <h2>Employee Directory</h2>
    <div class="panel">
      <input id="employeeSearch" class="field employeeSearch" type="search" placeholder="Search name or employee number">
      <div id="employeeCount" class="employeeCount"></div>
      <div class="employeeHint">The main employee list is built into the toolkit and is available on every device. Edits made here are saved on this device.</div>
      <div class="employeeTools">
        <button class="btn" id="importEmployeeBtn" type="button">IMPORT EXCEL</button>
        <input id="employeeFile" type="file" accept=".xlsx,.xls,.csv" hidden>
      </div>
    </div>
    <div class="panel">
      <h3 id="employeeEditorTitle">Add Employee</h3>
      <div class="employeeForm">
        <input id="employeeName" class="field" placeholder="Employee name">
        <input id="employeeNumber" class="field" placeholder="Employee number">
        <input id="employeeDepot" class="field" placeholder="Depot">
        <input id="employeeJobTitle" class="field" placeholder="Job title">
      </div>
      <div class="employeeTools">
        <button class="btn" id="saveEmployeeBtn" type="button">ADD EMPLOYEE</button>
        <button class="btn" id="cancelEmployeeBtn" type="button" style="display:none">CANCEL</button>
      </div>
    </div>
    <div id="employeeResults"></div>
  </section>`);
}
function render(){
  const q=norm(byId('employeeSearch')?.value);
  const qNumber=numberKey(q);
  const rows=employees.map((e,i)=>({e,i})).filter(x=>!q||norm(x.e.name).includes(q)||norm(x.e.employeeNumber).includes(q)||numberKey(x.e.employeeNumber).includes(qNumber)||norm(x.e.depot).includes(q)||norm(x.e.jobTitle).includes(q)).sort((a,b)=>a.e.name.localeCompare(b.e.name));
  const shown=q?rows:rows.slice(0,50);
  byId('employeeCount').textContent=employees.length?(q?`${rows.length} result${rows.length===1?'':'s'}`:`Showing first ${shown.length} of ${employees.length} employees — type to search`):'No employees loaded.';
  byId('employeeResults').innerHTML=shown.map(({e,i})=>`
    <div class="employeeCard">
      <h3>${esc(e.name)}</h3><div class="employeeNo">${esc(e.employeeNumber)}</div>
      <div class="employeeInfo"><div><b>Depot:</b> ${esc(e.depot||'Not added')}</div><div><b>Job title:</b> ${esc(e.jobTitle||'Not added')}</div></div>
      <div class="employeeActions"><button class="btn" data-employee-edit="${i}">EDIT</button><button class="btn danger" data-employee-remove="${i}">REMOVE</button></div>
    </div>`).join('')||'<div class="panel">No matching employee found.</div>';
}
function clearEditor(){
  editing=-1;
  ['employeeName','employeeNumber','employeeDepot','employeeJobTitle'].forEach(id=>byId(id).value='');
  byId('employeeEditorTitle').textContent='Add Employee';
  byId('saveEmployeeBtn').textContent='ADD EMPLOYEE';
  byId('cancelEmployeeBtn').style.display='none';
}
function saveEntry(){
  const entry={name:byId('employeeName').value.trim(),employeeNumber:byId('employeeNumber').value.trim(),depot:byId('employeeDepot').value.trim(),jobTitle:byId('employeeJobTitle').value.trim()};
  if(!entry.name||!entry.employeeNumber){alert('Enter the employee name and employee number.');return;}
  const duplicate=employees.findIndex((e,i)=>i!==editing&&numberKey(e.employeeNumber)===numberKey(entry.employeeNumber));
  if(duplicate>=0){alert('That employee number already exists.');return;}
  if(editing<0)employees.push(entry);else employees[editing]=entry;
  save();clearEditor();render();
}
function editEntry(i){
  const e=employees[i];if(!e)return;editing=i;
  byId('employeeName').value=e.name||'';byId('employeeNumber').value=e.employeeNumber||'';
  byId('employeeDepot').value=e.depot||'';byId('employeeJobTitle').value=e.jobTitle||'';
  byId('employeeEditorTitle').textContent='Edit Employee';byId('saveEmployeeBtn').textContent='SAVE CHANGES';
  byId('cancelEmployeeBtn').style.display='';
  byId('employeeDirectory').scrollIntoView({behavior:'smooth'});
}
function removeEntry(i){
  const e=employees[i];if(!e||!confirm(`Remove ${e.name} (${e.employeeNumber}) from this device?`))return;
  employees.splice(i,1);save();clearEditor();render();
}
function loadXlsx(){
  return new Promise((resolve,reject)=>{
    if(window.XLSX)return resolve();
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload=resolve;s.onerror=()=>reject(new Error('Excel reader could not load'));
    document.head.appendChild(s);
  });
}
async function importFile(file){
  try{
    await loadXlsx();
    const data=await file.arrayBuffer();
    const book=XLSX.read(data,{type:'array'});
    const sheet=book.Sheets[book.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(sheet,{defval:''});
    const imported=[];
    rows.forEach(row=>{
      const name=String(row.Name||row.name||row['Employee Name']||'').replace(/\s*-\s*$/,'').trim();
      const number=String(row['Employee Number']||row['Employee ID']||row.employeeNumber||'').trim();
      if(name&&number)imported.push({name,employeeNumber:number,depot:String(row.Depot||'').trim(),jobTitle:String(row['Job Title']||row.JobTitle||'').trim()});
    });
    if(!imported.length){alert('No Name and Employee Number columns were found.');return;}
    employees=mergeByNumber(baseEmployees,imported);save();clearEditor();render();
    alert(`${imported.length} employees imported on this device.`);
  }catch(error){alert('The Excel file could not be imported.');}
}
function findByNumber(value){
  const n=numberKey(value);
  return n?employees.find(e=>numberKey(e.employeeNumber)===n):null;
}
function setupChecksheetLookup(){
  const driver=byId('csDriver');
  if(!driver||byId('csEmployeeNumber'))return;
  const number=document.createElement('input');
  number.className='field';
  number.id='csEmployeeNumber';
  number.placeholder='Driver employee number';
  number.inputMode='numeric';
  driver.parentNode.insertBefore(number,driver);
  const status=document.createElement('div');
  status.id='csEmployeeLookupStatus';
  status.className='employeeLookupStatus';
  driver.parentNode.insertBefore(status,driver.nextSibling);

  const lookup=()=>{
    const value=number.value.trim();
    if(!value){status.textContent='';status.className='employeeLookupStatus';return;}
    const employee=findByNumber(value);
    if(employee){
      driver.value=employee.name;
      if(byId('csDepot')&&!byId('csDepot').value.trim()&&employee.depot)byId('csDepot').value=employee.depot;
      status.textContent=`Found: ${employee.name}${employee.jobTitle?' — '+employee.jobTitle:''}${employee.depot?' — '+employee.depot:''}`;
      status.className='employeeLookupStatus found';
      driver.dispatchEvent(new Event('input',{bubbles:true}));
    }else{
      status.textContent='Employee number not found';
      status.className='employeeLookupStatus missing';
    }
  };
  number.addEventListener('input',lookup);
  number.addEventListener('change',lookup);
  driver.addEventListener('change',()=>{
    const exact=employees.find(e=>norm(e.name)===norm(driver.value));
    if(exact){number.value=exact.employeeNumber;lookup();}
  });
  const clear=byId('clearCheckFormBtn');
  if(clear)clear.addEventListener('click',()=>setTimeout(()=>{number.value='';status.textContent='';status.className='employeeLookupStatus';},0));
}
function events(){
  byId('employeeSearch').oninput=render;
  byId('saveEmployeeBtn').onclick=saveEntry;
  byId('cancelEmployeeBtn').onclick=clearEditor;
  byId('importEmployeeBtn').onclick=()=>byId('employeeFile').click();
  byId('employeeFile').onchange=e=>{const f=e.target.files?.[0];if(f)importFile(f);e.target.value='';};
  document.addEventListener('click',e=>{
    const edit=e.target.closest('[data-employee-edit]');if(edit)editEntry(Number(edit.dataset.employeeEdit));
    const remove=e.target.closest('[data-employee-remove]');if(remove)removeEntry(Number(remove.dataset.employeeRemove));
  });
}
function init(){load();styles();homeButton();page();setupChecksheetLookup();events();render();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,2100));else setTimeout(init,2100);
})();