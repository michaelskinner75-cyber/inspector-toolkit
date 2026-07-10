(function(){
'use strict';

function getServices(){
  try{
    const saved=JSON.parse(localStorage.getItem('serviceCoverageList')||'null');
    if(Array.isArray(saved)&&saved.length)return saved;
  }catch(e){}
  return Array.isArray(window.INSPECTOR_SERVICES)?window.INSPECTOR_SERVICES:[];
}

function normaliseService(s){
  if(!s)return null;
  if(Array.isArray(s))return {code:String(s[0]||'').trim(),route:String(s[1]||'').trim()};
  return {code:String(s.code||'').trim(),route:String(s.route||s.description||'').trim()};
}

function ensureStyle(){
  if(document.getElementById('serviceSuggestStyle'))return;
  const style=document.createElement('style');
  style.id='serviceSuggestStyle';
  style.textContent=`
    .serviceSuggestWrap{position:relative;min-width:0}
    .serviceSuggestions{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:99999;background:#fff;color:#0b1b2b;border:2px solid #4c7fc4;border-radius:12px;max-height:260px;overflow:auto;box-shadow:0 12px 28px rgba(0,0,0,.35);display:none}
    .serviceSuggestion{padding:12px 14px;border-bottom:1px solid #d8e0e8;cursor:pointer;text-align:left}
    .serviceSuggestion:last-child{border-bottom:0}
    .serviceSuggestion b{display:block;font-size:1rem}
    .serviceSuggestion span{display:block;font-size:.82rem;color:#536273;margin-top:3px}
    .serviceSuggestion:active{background:#eaf2ff}
  `;
  document.head.appendChild(style);
}

function attach(id){
  const input=document.getElementById(id);
  if(!input||input.dataset.customServiceReady==='1')return;
  input.dataset.customServiceReady='1';
  input.removeAttribute('list');
  input.setAttribute('autocomplete','off');

  const parent=input.parentElement;
  const wrap=document.createElement('div');
  wrap.className='serviceSuggestWrap';
  parent.insertBefore(wrap,input);
  wrap.appendChild(input);

  const box=document.createElement('div');
  box.className='serviceSuggestions';
  wrap.appendChild(box);

  function hide(){box.style.display='none';}
  function show(){
    const q=input.value.trim().toLowerCase();
    if(!q){hide();return;}
    const matches=getServices().map(normaliseService).filter(Boolean).filter(s=>s.code&&(`${s.code} ${s.route}`.toLowerCase().includes(q))).slice(0,30);
    if(!matches.length){hide();return;}
    box.innerHTML=matches.map((s,i)=>`<div class="serviceSuggestion" data-service-index="${i}"><b>${s.code}</b><span>${s.route||''}</span></div>`).join('');
    box.style.display='block';
    box.querySelectorAll('.serviceSuggestion').forEach((el,i)=>{
      el.addEventListener('mousedown',e=>e.preventDefault());
      el.addEventListener('click',()=>{input.value=matches[i].code;hide();input.dispatchEvent(new Event('change',{bubbles:true}));});
    });
  }

  input.addEventListener('input',show);
  input.addEventListener('focus',show);
  input.addEventListener('blur',()=>setTimeout(hide,150));
}

function rebuild(){
  ensureStyle();
  ['csService','tcService','nsaService'].forEach(attach);
}

function start(){
  rebuild();
  setTimeout(rebuild,300);
  setTimeout(rebuild,1000);
  setTimeout(rebuild,2500);
  const observer=new MutationObserver(()=>rebuild());
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('storage',e=>{if(e.key==='serviceCoverageList')rebuild();});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();