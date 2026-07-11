(function(){
'use strict';

const $=id=>document.getElementById(id);

function addStyles(){
  if($('defaultHiddenSectionsCss'))return;
  const style=document.createElement('style');
  style.id='defaultHiddenSectionsCss';
  style.textContent=`
    .hubSectionToggle{width:100%;margin:12px 0 8px;background:#17324b;border:1px solid #416783;color:#fff;border-radius:10px;padding:12px;font-weight:800;font-size:15px;cursor:pointer}
    .hubForcedHidden{display:none!important}
  `;
  document.head.appendChild(style);
}

function makeToggle(id,beforeEl,showText,hideText,targets){
  if(!beforeEl)return null;
  let btn=$(id);
  if(!btn){
    btn=document.createElement('button');
    btn.type='button';
    btn.id=id;
    btn.className='hubSectionToggle';
    beforeEl.before(btn);
  }
  const apply=hidden=>{
    targets().filter(Boolean).forEach(el=>el.classList.toggle('hubForcedHidden',hidden));
    btn.textContent=hidden?showText:hideText;
    btn.setAttribute('aria-expanded',String(!hidden));
  };
  if(btn.dataset.hubReady!=='1'){
    btn.dataset.hubReady='1';
    btn.onclick=()=>apply(!targets().filter(Boolean).some(el=>el.classList.contains('hubForcedHidden')));
    apply(true);
  }
  return btn;
}

function setupChecksheet(){
  const section=$('checksheet');
  if(!section)return;
  const formSections=()=>Array.from(section.querySelectorAll('.formSection'));
  const saveRow=$('saveCheckSheetBtn')?.parentElement;
  const first=formSections()[0]||saveRow;
  makeToggle('toggleCheckEntryBtn',first,'Show Check Details','Hide Check Details',()=>[...formSections(),saveRow]);

  const historyBtn=$('toggleCheckHistoryBtn');
  const search=$('checkSearch');
  const panel=search?.closest('.panel');
  const list=$('checkList');
  const title=section.querySelector('.historyPanelTitle');
  if(historyBtn&&historyBtn.dataset.hubReady!=='1'){
    historyBtn.dataset.hubReady='1';
    [panel,list,title].filter(Boolean).forEach(el=>el.classList.add('historyHidden','hubForcedHidden'));
    historyBtn.textContent='Show Previous Checks';
    historyBtn.setAttribute('aria-expanded','false');
    historyBtn.onclick=()=>{
      const hidden=[panel,list,title].filter(Boolean).some(el=>el.classList.contains('hubForcedHidden'));
      [panel,list,title].filter(Boolean).forEach(el=>{el.classList.toggle('hubForcedHidden',!hidden);el.classList.toggle('historyHidden',!hidden);});
      historyBtn.textContent=hidden?'Hide Previous Checks':'Show Previous Checks';
      historyBtn.setAttribute('aria-expanded',String(hidden));
    };
  }
}

function setupNsa(){
  const section=$('nsa');if(!section)return;
  const manualPanel=section.querySelector('.panel');
  const manualBtn=$('toggleNsaManualBtn');
  if(manualBtn&&manualPanel&&manualBtn.dataset.hubReady!=='1'){
    manualBtn.dataset.hubReady='1';
    manualPanel.classList.add('nsaSectionHidden','hubForcedHidden');
    manualBtn.textContent='Show Manual Input';manualBtn.setAttribute('aria-expanded','false');
    manualBtn.onclick=()=>{
      const hidden=manualPanel.classList.contains('hubForcedHidden');
      manualPanel.classList.toggle('hubForcedHidden',!hidden);manualPanel.classList.toggle('nsaSectionHidden',!hidden);
      manualBtn.textContent=hidden?'Hide Manual Input':'Show Manual Input';manualBtn.setAttribute('aria-expanded',String(hidden));
    };
  }
  const reportsBtn=$('toggleNsaReportsBtn'),filters=$('nsaFilters'),list=$('nsaList');
  const heading=section.querySelector('.nsaSectionHeading');
  if(reportsBtn&&reportsBtn.dataset.hubReady!=='1'){
    reportsBtn.dataset.hubReady='1';
    [filters,list,heading].filter(Boolean).forEach(el=>el.classList.add('nsaSectionHidden','hubForcedHidden'));
    reportsBtn.textContent='Show Completed Reports';reportsBtn.setAttribute('aria-expanded','false');
    reportsBtn.onclick=()=>{
      const hidden=[filters,list,heading].filter(Boolean).some(el=>el.classList.contains('hubForcedHidden'));
      [filters,list,heading].filter(Boolean).forEach(el=>{el.classList.toggle('hubForcedHidden',!hidden);el.classList.toggle('nsaSectionHidden',!hidden);});
      reportsBtn.textContent=hidden?'Hide Completed Reports':'Show Completed Reports';reportsBtn.setAttribute('aria-expanded',String(hidden));
    };
  }
}

function setupTiming(){
  const section=$('timing');if(!section)return;
  const historyPanel=$('timingSearch')?.closest('.panel');
  const saveButton=$('saveTimingBtn');
  const entryPanel=saveButton?.closest('.panel')||$('tcLocation')?.closest('.panel');
  if(!entryPanel)return;

  const matching=Array.from(section.querySelectorAll('button')).filter(btn=>/^(show|hide) timing check details$/i.test((btn.textContent||'').trim()));
  let entryBtn=$('toggleTimingEntryBtn')||matching[0];
  matching.forEach(btn=>{if(btn!==entryBtn)btn.remove();});

  if(!entryBtn){
    entryBtn=document.createElement('button');
    entryPanel.before(entryBtn);
  }
  entryBtn.id='toggleTimingEntryBtn';
  entryBtn.type='button';
  entryBtn.className='hubSectionToggle';

  const applyEntry=hidden=>{
    entryPanel.classList.toggle('hubForcedHidden',hidden);
    entryPanel.classList.toggle('timingHidden',hidden);
    entryPanel.hidden=false;
    entryPanel.style.display='';
    entryBtn.textContent=hidden?'Show Timing Check Details':'Hide Timing Check Details';
    entryBtn.setAttribute('aria-expanded',String(!hidden));
  };
  entryBtn.onclick=()=>{
    const hidden=entryPanel.classList.contains('hubForcedHidden')||entryPanel.classList.contains('timingHidden');
    applyEntry(!hidden);
  };
  if(entryBtn.dataset.hubReady!=='1'){
    entryBtn.dataset.hubReady='1';
    applyEntry(true);
  }

  const historyBtn=$('toggleTimingHistoryBtn'),list=$('timingList');
  const title=section.querySelector('.timingHistoryTitle');
  if(historyBtn&&historyBtn.dataset.hubReady!=='1'){
    historyBtn.dataset.hubReady='1';
    [historyPanel,list,title].filter(Boolean).forEach(el=>el.classList.add('timingHidden','hubForcedHidden'));
    historyBtn.textContent='Show Completed Timing Checks';historyBtn.setAttribute('aria-expanded','false');
    historyBtn.onclick=()=>{
      const hidden=[historyPanel,list,title].filter(Boolean).some(el=>el.classList.contains('hubForcedHidden'));
      [historyPanel,list,title].filter(Boolean).forEach(el=>{el.classList.toggle('hubForcedHidden',!hidden);el.classList.toggle('timingHidden',!hidden);});
      historyBtn.textContent=hidden?'Hide Completed Timing Checks':'Show Completed Timing Checks';historyBtn.setAttribute('aria-expanded',String(hidden));
    };
  }
}

function init(){
  addStyles();
  setupChecksheet();setupNsa();setupTiming();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,3200));
else setTimeout(init,3200);
})();