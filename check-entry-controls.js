(function(){
'use strict';
const $=id=>document.getElementById(id);
const EMPLOYEE_KEY='inspectorEmployeeDirectoryV3';
const LEGACY_KEY='inspectorEmployeeDirectoryV2';
const norm=v=>String(v||'').trim().toLowerCase();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function employees(){
 let local=[];try{local=JSON.parse(localStorage.getItem(EMPLOYEE_KEY)||localStorage.getItem(LEGACY_KEY)||'[]');}catch(e){}
 const base=Array.isArray(window.INSPECTOR_EMPLOYEE_DIRECTORY)?window.INSPECTOR_EMPLOYEE_DIRECTORY:[];
 const map=new Map();[...base,...(Array.isArray(local)?local:[])].forEach(x=>{const e=Array.isArray(x)?{name:x[0],employeeNumber:x[1]}:x;const name=String(e?.name||'').trim(),number=String(e?.employeeNumber||e?.['Employee Number']||'').trim();if(name&&number)map.set(number.replace(/^0+(?=\d)/,''),{name,employeeNumber:number});});
 return [...map.values()];
}
function style(){if($('checkEntryControlsCss'))return;const s=document.createElement('style');s.id='checkEntryControlsCss';s.textContent=`#itToggleEntry{width:100%;margin:0 0 12px;background:#17324b;border:1px solid #416783;color:#fff;border-radius:10px;padding:12px;font-weight:800;font-size:15px}#itManualEntry{display:none}#integratedTimingResult{display:none!important}.itDriverWrap{position:relative}.itDriverSuggestions{display:none;position:static;width:100%;max-height:230px;overflow-y:auto;background:#102638;border:1px solid #3e6d8d;border-top:0;border-radius:0 0 10px 10px;box-shadow:0 10px 22px rgba(0,0,0,.42);box-sizing:border-box}.itDriverSuggestions.show{display:block}.itDriverSuggestion{display:block;width:100%;padding:10px 12px;border:0;border-bottom:1px solid rgba(255,255,255,.08);background:transparent;color:#fff;text-align:left}.itDriverSuggestion b{display:block}.itDriverSuggestion small{opacity:.75}`;document.head.appendChild(s);}
function setupInspectionToggle(){
 const section=$('checksheet'),btn=$('toggleCheckEntryBtn');if(!section||!btn)return;
 const formSections=()=>Array.from(section.querySelectorAll('.formSection'));
 const saveRow=$('saveCheckSheetBtn')?.parentElement;
 const targets=()=>[...formSections(),saveRow].filter(Boolean);
 const setOpen=open=>{targets().forEach(el=>{el.classList.toggle('hubForcedHidden',!open);el.style.removeProperty('display');});btn.textContent=open?'HIDE INSPECTION':'SUBMIT NEW INSPECTION';btn.setAttribute('aria-expanded',String(open));btn.dataset.entryOpen=open?'1':'0';};
 btn.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();setOpen(btn.dataset.entryOpen!=='1');};
 if(btn.dataset.entryControlsReady!=='1'){btn.dataset.entryControlsReady='1';setOpen(false);}
}
function setupTimingToggle(){
 const panel=$('integratedTimingPanel');if(!panel)return;
 let manual=$('itManualEntry');
 if(!manual){manual=document.createElement('div');manual.id='itManualEntry';const results=panel.querySelector('.itResultsWrap');const moving=[...panel.children].filter(el=>el!==results&&el.id!=='itToggleEntry');moving.forEach(el=>manual.appendChild(el));panel.insertBefore(manual,results||null);}
 let btn=$('itToggleEntry');if(!btn){btn=document.createElement('button');btn.id='itToggleEntry';btn.type='button';btn.className='btn';panel.insertBefore(btn,manual);}
 const setOpen=open=>{manual.style.display=open?'block':'none';btn.textContent=open?'HIDE TIMING CHECK':'SUBMIT NEW TIMING CHECK';btn.setAttribute('aria-expanded',String(open));btn.dataset.entryOpen=open?'1':'0';};
 btn.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();setOpen(btn.dataset.entryOpen!=='1');};
 if(btn.dataset.entryControlsReady!=='1'){btn.dataset.entryControlsReady='1';setOpen(false);}
 const prompt=$('integratedTimingResult');if(prompt)prompt.remove();
}
function setupTimingDriver(){
 const input=$('itDriver');if(!input||input.dataset.directoryReady==='1')return;
 input.dataset.directoryReady='1';input.placeholder='Driver name or employee number';input.autocomplete='off';
 const label=input.closest('label')||input.parentElement;label?.classList.add('itDriverWrap');
 const list=document.createElement('div');list.id='itDriverSuggestions';list.className='itDriverSuggestions';input.insertAdjacentElement('afterend',list);
 const render=()=>{const q=norm(input.value);if(!q){list.classList.remove('show');list.innerHTML='';return;}const rows=employees().filter(e=>norm(e.name).includes(q)||norm(e.employeeNumber).includes(q)).slice(0,30);list.innerHTML=rows.map(e=>`<button type="button" class="itDriverSuggestion" data-name="${esc(e.name)}"><b>${esc(e.name)}</b><small>${esc(e.employeeNumber)}</small></button>`).join('');list.classList.toggle('show',rows.length>0);};
 input.addEventListener('input',render);input.addEventListener('focus',render);
 list.addEventListener('click',e=>{const b=e.target.closest('.itDriverSuggestion');if(!b)return;input.value=b.dataset.name||'';list.classList.remove('show');});
 document.addEventListener('click',e=>{if(!label?.contains(e.target))list.classList.remove('show');});
}
function run(){style();setupInspectionToggle();setupTimingToggle();setupTimingDriver();}
function init(){run();setTimeout(run,700);setTimeout(run,1800);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,2500));else setTimeout(init,2500);
})();