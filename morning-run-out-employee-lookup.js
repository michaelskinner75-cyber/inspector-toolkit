(function(){
'use strict';
const SHEET='Employees';
const $=id=>document.getElementById(id);
const key=v=>{const s=String(v||'').normalize('NFKC').replace(/[^0-9a-z]/gi,'').toLowerCase();return /^\d+$/.test(s)?(s.replace(/^0+(?=\d)/,'')||'0'):s;};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let employees=[];
let loading=false;

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

function currentDirectory(){
 if(Array.isArray(window.SHARED_EMPLOYEE_DIRECTORY)&&window.SHARED_EMPLOYEE_DIRECTORY.length)return window.SHARED_EMPLOYEE_DIRECTORY;
 try{
  if(typeof cloud!=='undefined'&&cloud&&Array.isArray(cloud[SHEET])&&cloud[SHEET].length)return parseRows(cloud[SHEET]);
 }catch(e){}
 return employees;
}

async function loadEmployees(){
 if(loading)return;
 loading=true;
 try{
  const shared=currentDirectory();
  if(shared.length){employees=shared.slice();return;}
  if(typeof WEB_APP_URL==='undefined'||!WEB_APP_URL)return;
  const j=WEB_APP_URL.includes('?')?'&':'?';
  const res=await fetch(WEB_APP_URL+j+'sheet='+encodeURIComponent(SHEET)+'&_='+Date.now(),{cache:'no-store'});
  const json=await res.json();
  employees=parseRows(json.data||[]);
  if(employees.length)window.SHARED_EMPLOYEE_DIRECTORY=employees;
 }catch(e){console.log('Morning Run Out employee lookup could not load Employees',e);}
 finally{loading=false;}
}

function matchesFor(value){
 const rows=currentDirectory();
 const raw=String(value||'').trim();
 if(!raw||!rows.length)return[];
 const lower=raw.toLowerCase();
 const numberSearch=/\d/.test(raw)&&!/[a-z]/i.test(raw);
 return rows.filter(e=>{
  if(numberSearch)return key(e.employeeNumber).includes(key(raw));
  return e.name.toLowerCase().includes(lower)||String(e.employeeNumber).toLowerCase().includes(lower);
 }).sort((a,b)=>{
  if(numberSearch){
   const ae=key(a.employeeNumber)===key(raw)?0:1,be=key(b.employeeNumber)===key(raw)?0:1;
   if(ae!==be)return ae-be;
  }else{
   const as=a.name.toLowerCase().startsWith(lower)?0:1,bs=b.name.toLowerCase().startsWith(lower)?0:1;
   if(as!==bs)return as-bs;
  }
  return a.name.localeCompare(b.name);
 }).slice(0,8);
}

function setup(){
 const input=$('mroName');
 if(!input||$('mroEmployeeLookupWrap'))return false;
 input.placeholder='Name or employee number';
 input.autocomplete='off';

 const wrap=document.createElement('div');
 wrap.id='mroEmployeeLookupWrap';
 wrap.className='mroEmployeeLookupWrap';
 input.parentNode.insertBefore(wrap,input);
 wrap.appendChild(input);

 const status=document.createElement('div');
 status.id='mroEmployeeLookupStatus';
 status.className='mroEmployeeLookupStatus';
 wrap.appendChild(status);

 const list=document.createElement('div');
 list.id='mroEmployeeSuggestions';
 list.className='mroEmployeeSuggestions';
 wrap.appendChild(list);

 function close(){list.classList.remove('show');list.innerHTML='';}
 function choose(e){
  input.value=e.name;
  input.dataset.employeeNumber=e.employeeNumber;
  status.textContent=`Selected: ${e.name} — ${e.employeeNumber}${e.depot?' — '+e.depot:''}${e.jobTitle?' — '+e.jobTitle:''}`;
  status.className='mroEmployeeLookupStatus found';
  close();
  input.dispatchEvent(new Event('change',{bubbles:true}));
 }
 function show(){
  const value=input.value.trim();
  input.dataset.employeeNumber='';
  if(!value){status.textContent='';status.className='mroEmployeeLookupStatus';close();return;}
  const rows=matchesFor(value);
  if(!rows.length){
   status.textContent=currentDirectory().length?'No matching employee found':'Loading employee directory…';
   status.className='mroEmployeeLookupStatus missing';
   close();
   if(!currentDirectory().length)loadEmployees().then(show);
   return;
  }
  status.textContent=/^\d/.test(value)?'Select the matching driver below':'Select a driver from the suggestions below';
  status.className='mroEmployeeLookupStatus';
  list.innerHTML=rows.map((e,i)=>`<button type="button" class="mroEmployeeSuggestion" data-mro-employee="${i}"><strong>${esc(e.name)}</strong><span>Employee ${esc(e.employeeNumber)}${e.depot?' • '+esc(e.depot):''}${e.jobTitle?' • '+esc(e.jobTitle):''}</span></button>`).join('');
  list.classList.add('show');
  list.querySelectorAll('[data-mro-employee]').forEach((b,i)=>b.addEventListener('click',()=>choose(rows[i])));
 }

 input.addEventListener('input',show);
 input.addEventListener('focus',show);
 input.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&list.classList.contains('show')){
   const first=list.querySelector('.mroEmployeeSuggestion');
   if(first){e.preventDefault();first.click();}
  }
  if(e.key==='Escape')close();
 });
 input.addEventListener('blur',()=>{
  const exact=matchesFor(input.value).find(e=>key(e.employeeNumber)===key(input.value)||e.name.toLowerCase()===input.value.trim().toLowerCase());
  if(exact&&!input.dataset.employeeNumber)choose(exact);
 });
 document.addEventListener('click',e=>{if(!wrap.contains(e.target))close();});
 const clear=$('mroClear');
 if(clear)clear.addEventListener('click',()=>setTimeout(()=>{status.textContent='';status.className='mroEmployeeLookupStatus';input.dataset.employeeNumber='';close();},0));
 loadEmployees();
 return true;
}

function style(){
 if($('mroEmployeeLookupCss'))return;
 const s=document.createElement('style');
 s.id='mroEmployeeLookupCss';
 s.textContent=`
 .mroEmployeeLookupWrap{min-width:0;width:100%}
 .mroEmployeeLookupWrap .field{margin-bottom:2px}
 .mroEmployeeLookupStatus{min-height:18px;font-size:11px;color:#b8c5ce;padding:0 3px 3px}
 .mroEmployeeLookupStatus.found{color:#7fddb4;font-weight:800}
 .mroEmployeeLookupStatus.missing{color:#ffbf66;font-weight:800}
 .mroEmployeeSuggestions{display:none;width:100%;max-height:230px;overflow-y:auto;background:#102638;border:1px solid #3e6d8d;border-radius:9px;margin:2px 0 6px;box-shadow:0 6px 18px rgba(0,0,0,.3)}
 .mroEmployeeSuggestions.show{display:block}
 .mroEmployeeSuggestion{display:block;width:100%;min-height:52px;text-align:left;background:transparent;color:#fff;border:0;border-bottom:1px solid rgba(255,255,255,.09);border-radius:0;padding:9px 11px;box-shadow:none}
 .mroEmployeeSuggestion:last-child{border-bottom:0}
 .mroEmployeeSuggestion strong,.mroEmployeeSuggestion span{display:block}
 .mroEmployeeSuggestion span{font-size:11px;color:#b8cbd8;margin-top:3px}
 .mroEmployeeSuggestion:focus,.mroEmployeeSuggestion:hover{background:#17415f;outline:none}
 `;
 document.head.appendChild(s);
}

function init(){
 style();
 let n=0;
 const t=setInterval(()=>{if(setup()||++n>80)clearInterval(t)},250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();