(function(){
'use strict';
const $=id=>document.getElementById(id);

function addStyles(){
  if($('nsaLogPolishCss'))return;
  const style=document.createElement('style');
  style.id='nsaLogPolishCss';
  style.textContent=`
    #nsa .nsaToggleBtn{width:100%;margin:10px 0;background:#17324b;border:1px solid #416783;color:#fff;border-radius:10px;padding:12px;font-weight:800;font-size:15px}
    #nsa .nsaSectionHidden{display:none!important}
    #nsa .nsaSectionHeading{font-size:18px;font-weight:800;color:#fff;margin:14px 0 6px}
    #nsa .filterBar button.activeFilter{outline:3px solid rgba(255,255,255,.28);transform:translateY(-1px)}
  `;
  document.head.appendChild(style);
}

function renameHomeButton(){
  const btn=document.querySelector('[data-open="nsa"]');
  if(btn)btn.textContent='NSA LOG';
  const heading=document.querySelector('#nsa h2');
  if(heading)heading.textContent='NSA LOG';
}

function setupManualToggle(){
  const section=$('nsa');
  if(!section)return;
  const manualPanel=section.querySelector('.panel');
  if(!manualPanel||$('toggleNsaManualBtn'))return;

  const btn=document.createElement('button');
  btn.type='button';
  btn.id='toggleNsaManualBtn';
  btn.className='nsaToggleBtn';
  manualPanel.before(btn);

  function apply(hidden){
    manualPanel.classList.toggle('nsaSectionHidden',hidden);
    btn.textContent=hidden?'Show Manual Input':'Hide Manual Input';
    btn.setAttribute('aria-expanded',String(!hidden));
    localStorage.setItem('nsaManualHidden',hidden?'1':'0');
  }

  btn.addEventListener('click',()=>apply(!manualPanel.classList.contains('nsaSectionHidden')));
  const saved=localStorage.getItem('nsaManualHidden');
  apply(saved===null?true:saved==='1');
}

function setupReportsToggle(){
  const section=$('nsa');
  const filters=$('nsaFilters');
  const list=$('nsaList');
  if(!section||!filters||!list||$('toggleNsaReportsBtn'))return;

  const heading=document.createElement('div');
  heading.className='nsaSectionHeading';
  heading.textContent='Completed Reports';
  filters.before(heading);

  const btn=document.createElement('button');
  btn.type='button';
  btn.id='toggleNsaReportsBtn';
  btn.className='nsaToggleBtn';
  heading.before(btn);

  function apply(hidden){
    filters.classList.toggle('nsaSectionHidden',hidden);
    list.classList.toggle('nsaSectionHidden',hidden);
    heading.classList.toggle('nsaSectionHidden',hidden);
    btn.textContent=hidden?'Show Completed Reports':'Hide Completed Reports';
    btn.setAttribute('aria-expanded',String(!hidden));
    localStorage.setItem('nsaReportsHidden',hidden?'1':'0');
  }

  btn.addEventListener('click',()=>apply(!filters.classList.contains('nsaSectionHidden')));
  apply(localStorage.getItem('nsaReportsHidden')==='1');
}

function setTodayDefault(){
  if(typeof window.setNsaFilter==='function')window.setNsaFilter('today');
  else{
    try{nsaFilter='today';}catch(e){}
    if(typeof window.renderNSA==='function')window.renderNSA();
  }
  document.querySelectorAll('#nsa .filterBar button').forEach(btn=>{
    const isToday=/today/i.test(btn.textContent||'');
    btn.classList.toggle('activeFilter',isToday);
  });
}

function bindFilterHighlight(){
  document.addEventListener('click',e=>{
    const btn=e.target.closest('#nsa .filterBar button');
    if(!btn)return;
    document.querySelectorAll('#nsa .filterBar button').forEach(x=>x.classList.remove('activeFilter'));
    btn.classList.add('activeFilter');
  });
}

function initialise(){
  addStyles();
  renameHomeButton();
  setupManualToggle();
  setupReportsToggle();
  setTodayDefault();
  bindFilterHighlight();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(initialise,1300));
else setTimeout(initialise,1300);
})();