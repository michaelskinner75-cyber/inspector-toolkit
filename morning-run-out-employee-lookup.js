(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=v=>{const s=String(v||'').normalize('NFKC').replace(/[^0-9a-z]/gi,'').toLowerCase();return /^\d+$/.test(s)?(s.replace(/^0+(?=\d)/,'')||'0'):s;};
let sourceRef=null,indexed=[];
function parseRows(rows){
 if(!Array.isArray(rows)||!rows.length)return[];
 let start=0,nameCol=0,numCol=1,depotCol=2,jobCol=3;const h=(rows[0]||[]).map(x=>String(x||'').trim().toLowerCase());
 if(h.some(x=>x.includes('name'))&&h.some(x=>x.includes('employee'))){start=1;nameCol=h.findIndex(x=>x==='name'||x.includes('employee name'));numCol=h.findIndex(x=>x.includes('employee number')||x.includes('employee id'));depotCol=h.findIndex(x=>x.includes('depot'));jobCol=h.findIndex(x=>x.includes('job title')||x==='job');}
 return rows.slice(start).map(r=>({name:String(r[nameCol]||'').trim(),employeeNumber:String(r[numCol]||'').trim(),depot:depotCol>=0?String(r[depotCol]||'').trim():'',jobTitle:jobCol>=0?String(r[jobCol]||'').trim():''})).filter(e=>e.name&&e.employeeNumber);
}
function rawDirectory(){
 if(Array.isArray(window.SHARED_EMPLOYEE_DIRECTORY)&&window.SHARED_EMPLOYEE_DIRECTORY.length)return window.SHARED_EMPLOYEE_DIRECTORY;
 try{if(typeof cloud!=='undefined'&&Array.isArray(cloud?.Employees)&&cloud.Employees.length)return parseRows(cloud.Employees);}catch(e){}
 try{const c=JSON.parse(sessionStorage.getItem('sharedEmployeesCacheV2')||'[]');if(Array.isArray(c)&&c.length)return c;}catch(e){}
 try{const l=JSON.parse(localStorage.getItem('inspectorEmployeeDirectoryV3')||localStorage.getItem('inspectorEmployeeDirectoryV2')||'[]');if(Array.isArray(l)&&l.length)return l;}catch(e){}
 return[];
}
function directory(){
 const src=rawDirectory();if(src!==sourceRef){sourceRef=src;indexed=src.map(e=>({name:String(e.name||e[0]||'').trim(),employeeNumber:String(e.employeeNumber||e[1]||'').trim(),depot:String(e.depot||e[2]||'').trim(),jobTitle:String(e.jobTitle||e[3]||'').trim(),nameLower:String(e.name||e[0]||'').trim().toLowerCase(),numberKey:key(e.employeeNumber||e[1])})).filter(e=>e.name&&e.employeeNumber);}return indexed;
}
function matchesFor(value){const rows=directory(),raw=String(value||'').trim();if(!raw||!rows.length)return[];const lower=raw.toLowerCase(),rawKey=key(raw),numberSearch=/\d/.test(raw)&&!/[a-z]/i.test(raw),out=[];for(const e of rows){if(numberSearch?e.numberKey.includes(rawKey):(e.nameLower.includes(lower)||e.numberKey.includes(rawKey))){out.push(e);if(out.length>=30)break;}}out.sort((a,b)=>{if(numberSearch){const ae=a.numberKey===rawKey?0:1,be=b.numberKey===rawKey?0:1;if(ae!==be)return ae-be;}else{const as=a.nameLower.startsWith(lower)?0:1,bs=b.nameLower.startsWith(lower)?0:1;if(as!==bs)return as-bs;}return a.name.localeCompare(b.name);});return out.slice(0,8);}
function setup(){
 const input=$('mroName');if(!input||$('mroEmployeeLookupWrap'))return false;input.placeholder='Name or employee number';input.autocomplete='off';
 const wrap=document.createElement('div');wrap.id='mroEmployeeLookupWrap';wrap.className='mroEmployeeLookupWrap';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
 const status=document.createElement('div');status.id='mroEmployeeLookupStatus';status.className='mroEmployeeLookupStatus';wrap.appendChild(status);
 const list=document.createElement('div');list.id='mroEmployeeSuggestions';list.className='mroEmployeeSuggestions';wrap.appendChild(list);let timer=0,waitTimer=0;
 function close(){list.classList.remove('show');list.innerHTML='';}
 function choose(e){input.value=e.name;input.dataset.employeeNumber=e.employeeNumber;status.textContent=`Selected: ${e.name} — ${e.employeeNumber}${e.depot?' — '+e.depot:''}${e.jobTitle?' — '+e.jobTitle:''}`;status.className='mroEmployeeLookupStatus found';close();input.dispatchEvent(new Event('change',{bubbles:true}));}
 function showNow(){const value=input.value.trim();input.dataset.employeeNumber='';if(!value){status.textContent='';status.className='mroEmployeeLookupStatus';close();return;}const dir=directory();if(!dir.length){status.textContent='Employee directory loading…';status.className='mroEmployeeLookupStatus';close();clearTimeout(waitTimer);waitTimer=setTimeout(()=>{if(input.value.trim()&&!directory().length){status.textContent='Directory still loading — you can enter the name manually or try again in a moment.';status.className='mroEmployeeLookupStatus missing';}},4000);return;}clearTimeout(waitTimer);const rows=matchesFor(value);if(!rows.length){status.textContent='No matching employee found';status.className='mroEmployeeLookupStatus missing';close();return;}status.textContent='Select the matching driver below';status.className='mroEmployeeLookupStatus';list.innerHTML=rows.map((e,i)=>`<button type="button" class="mroEmployeeSuggestion" data-mro-employee="${i}"><strong>${esc(e.name)}</strong><span>Employee ${esc(e.employeeNumber)}${e.depot?' • '+esc(e.depot):''}${e.jobTitle?' • '+esc(e.jobTitle):''}</span></button>`).join('');list.classList.add('show');list.querySelectorAll('[data-mro-employee]').forEach((b,i)=>b.onclick=()=>choose(rows[i]));}
 function show(){clearTimeout(timer);timer=setTimeout(showNow,70);}
 input.addEventListener('input',show);input.addEventListener('focus',showNow);document.addEventListener('employee-directory-ready',()=>{sourceRef=null;if(input.value.trim())showNow();});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&list.classList.contains('show')){const first=list.querySelector('.mroEmployeeSuggestion');if(first){e.preventDefault();first.click();}}if(e.key==='Escape')close();});document.addEventListener('click',e=>{if(!wrap.contains(e.target))close();});
 const clear=$('mroClear');if(clear)clear.addEventListener('click',()=>setTimeout(()=>{status.textContent='';status.className='mroEmployeeLookupStatus';input.dataset.employeeNumber='';close();},0));return true;
}
function style(){if($('mroEmployeeLookupCss'))return;const s=document.createElement('style');s.id='mroEmployeeLookupCss';s.textContent=`.mroEmployeeLookupWrap{min-width:0;width:100%}.mroEmployeeLookupWrap .field{margin-bottom:2px}.mroEmployeeLookupStatus{min-height:18px;font-size:11px;color:#b8c5ce;padding:0 3px 3px}.mroEmployeeLookupStatus.found{color:#7fddb4;font-weight:800}.mroEmployeeLookupStatus.missing{color:#ffbf66;font-weight:800}.mroEmployeeSuggestions{display:none;width:100%;max-height:230px;overflow-y:auto;background:#102638;border:1px solid #3e6d8d;border-radius:9px;margin:2px 0 6px;box-shadow:0 6px 18px rgba(0,0,0,.3)}.mroEmployeeSuggestions.show{display:block}.mroEmployeeSuggestion{display:block;width:100%;min-height:52px;text-align:left;background:transparent;color:#fff;border:0;border-bottom:1px solid rgba(255,255,255,.09);border-radius:0;padding:9px 11px;box-shadow:none}.mroEmployeeSuggestion:last-child{border-bottom:0}.mroEmployeeSuggestion strong,.mroEmployeeSuggestion span{display:block}.mroEmployeeSuggestion span{font-size:11px;color:#b8cbd8;margin-top:3px}.mroEmployeeSuggestion:focus,.mroEmployeeSuggestion:hover{background:#17415f;outline:none}`;document.head.appendChild(s);}
function init(){style();let n=0,t=setInterval(()=>{if(setup()||++n>40)clearInterval(t)},250);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();