(function(){
'use strict';

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=v=>{const s=String(v||'').normalize('NFKC').replace(/[^0-9a-z]/gi,'').toLowerCase();return /^\d+$/.test(s)?(s.replace(/^0+(?=\d)/,'')||'0'):s;};

function employees(){
  return Array.isArray(window.SHARED_EMPLOYEE_DIRECTORY)?window.SHARED_EMPLOYEE_DIRECTORY:[];
}

function matches(value){
  const raw=String(value||'').trim();
  if(!raw)return[];
  const lower=raw.toLowerCase();
  const numberSearch=/\d/.test(raw)&&!/[a-z]/i.test(raw);
  return employees().filter(e=>{
    if(numberSearch)return key(e.employeeNumber).includes(key(raw));
    return String(e.name||'').toLowerCase().includes(lower)||String(e.employeeNumber||'').toLowerCase().includes(lower);
  }).sort((a,b)=>{
    if(numberSearch){
      const ax=key(a.employeeNumber)===key(raw)?0:1;
      const bx=key(b.employeeNumber)===key(raw)?0:1;
      if(ax!==bx)return ax-bx;
    }else{
      const ax=String(a.name||'').toLowerCase().startsWith(lower)?0:1;
      const bx=String(b.name||'').toLowerCase().startsWith(lower)?0:1;
      if(ax!==bx)return ax-bx;
    }
    return String(a.name||'').localeCompare(String(b.name||''));
  }).slice(0,8);
}

function addStyles(){
  if($('timingDriverLookupCss'))return;
  const s=document.createElement('style');
  s.id='timingDriverLookupCss';
  s.textContent=`
    #timingDriverLookupHost{position:relative;display:block;width:100%;min-width:0;overflow:visible;z-index:120}
    #timingDriverLookupHost #tcDriver{display:block;width:100%;box-sizing:border-box}
    #timingDriverLookupStatus{font-size:12px;color:var(--muted,#b8c5ce);margin:5px 2px 0}
    #timingDriverLookupStatus.found{color:#6fd0a4;font-weight:800}
    #timingDriverLookupStatus.missing{color:#ffbf66;font-weight:800}
    #timingDriverSuggestions{display:none;width:100%;box-sizing:border-box;margin-top:4px;max-height:230px;overflow-y:auto;background:#102638;border:1px solid #3e6d8d;border-radius:0 0 10px 10px;box-shadow:0 10px 24px rgba(0,0,0,.45)}
    #timingDriverSuggestions.show{display:block}
    #timingDriverSuggestions .timingDriverSuggestion{display:block;width:100%;box-sizing:border-box;text-align:left;background:transparent;color:#fff;border:0;border-bottom:1px solid rgba(255,255,255,.09);padding:11px 13px;font:inherit}
    #timingDriverSuggestions .timingDriverSuggestion:last-child{border-bottom:0}
    #timingDriverSuggestions .timingDriverSuggestion:focus,#timingDriverSuggestions .timingDriverSuggestion:hover{background:#17415f;outline:none}
    #timingDriverSuggestions strong{display:block;font-size:15px}
    #timingDriverSuggestions span{display:block;font-size:12px;color:#b8cbd8;margin-top:3px}
  `;
  document.head.appendChild(s);
}

function setup(){
  const input=$('tcDriver');
  if(!input||input.dataset.employeeLookupReady==='1')return false;
  input.dataset.employeeLookupReady='1';
  input.placeholder='Driver name or employee number';
  input.autocomplete='off';

  const host=document.createElement('div');
  host.id='timingDriverLookupHost';
  input.parentNode.insertBefore(host,input);
  host.appendChild(input);

  const status=document.createElement('div');
  status.id='timingDriverLookupStatus';
  const list=document.createElement('div');
  list.id='timingDriverSuggestions';
  host.append(status,list);

  function close(){list.classList.remove('show');list.innerHTML='';}
  function choose(e){
    input.value=String(e.name||'').trim();
    status.textContent=`Selected: ${e.name} — ${e.employeeNumber}${e.depot?' — '+e.depot:''}${e.jobTitle?' — '+e.jobTitle:''}`;
    status.className='found';
    close();
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function show(){
    const value=input.value.trim();
    if(!value){status.textContent='';status.className='';close();return;}
    const rows=matches(value);
    if(!rows.length){status.textContent=employees().length?'No matching employee found':'Employee list is still loading';status.className='missing';close();return;}
    status.textContent='Select a driver below';status.className='';
    list.innerHTML=rows.map((e,i)=>`<button type="button" class="timingDriverSuggestion" data-timing-driver="${i}"><strong>${esc(e.name)}</strong><span>Employee ${esc(e.employeeNumber)}${e.depot?' • '+esc(e.depot):''}${e.jobTitle?' • '+esc(e.jobTitle):''}</span></button>`).join('');
    list.classList.add('show');
    list.querySelectorAll('[data-timing-driver]').forEach((b,i)=>b.onclick=()=>choose(rows[i]));
  }

  input.addEventListener('input',show);
  input.addEventListener('focus',show);
  input.addEventListener('keydown',e=>{
    if(e.key==='Escape')close();
    if(e.key==='Enter'&&list.classList.contains('show')){const first=list.querySelector('button');if(first){e.preventDefault();first.click();}}
  });
  document.addEventListener('click',e=>{if(!host.contains(e.target))close();});
  $('clearTimingBtn')?.addEventListener('click',()=>setTimeout(()=>{status.textContent='';status.className='';close();},0));
  return true;
}

function init(){
  addStyles();
  let tries=0;
  const timer=setInterval(()=>{tries++;if(setup()||tries>40)clearInterval(timer);},200);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
