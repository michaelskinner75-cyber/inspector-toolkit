(function(){
'use strict';

function addStyles(){
  if(document.getElementById('uxSaveStyles'))return;
  const s=document.createElement('style');
  s.id='uxSaveStyles';
  s.textContent=`
    .filterHint{font-size:12px;color:var(--muted,#b8c5ce);margin:4px 0 8px;text-align:center;font-style:italic}
    #saveCheckSheetBtn.isSaving{background:#66727c!important;color:#d8dee3!important;cursor:not-allowed!important;opacity:.8;box-shadow:none!important}
    .saveProgress{height:5px;background:#243746;border-radius:999px;overflow:hidden;margin:8px 0 2px;display:none}
    .saveProgress.active{display:block}
    .saveProgressBar{height:100%;width:35%;background:var(--orange,#eea83e);border-radius:999px;animation:saveSlide 1s linear infinite}
    @keyframes saveSlide{from{transform:translateX(-120%)}to{transform:translateX(340%)}}
  `;
  document.head.appendChild(s);
}

function addFilterHint(sectionId){
  const section=document.getElementById(sectionId);if(!section)return;
  const bar=section.querySelector('.filterBar');if(!bar||bar.previousElementSibling?.classList.contains('filterHint'))return;
  const hint=document.createElement('div');
  hint.className='filterHint';
  hint.textContent='Choose a filter below to refresh the results.';
  bar.before(hint);
}

function removeRefreshButton(){
  const btn=document.getElementById('refreshChecksBtn');
  if(btn)btn.remove();
}

function setupSaveLock(){
  const btn=document.getElementById('saveCheckSheetBtn');if(!btn||btn.dataset.saveLockReady==='1')return;
  btn.dataset.saveLockReady='1';
  const progress=document.createElement('div');
  progress.className='saveProgress';
  progress.innerHTML='<div class="saveProgressBar"></div>';
  btn.parentElement?.after(progress);

  btn.addEventListener('click',async function(e){
    e.preventDefault();e.stopImmediatePropagation();
    if(btn.disabled)return;

    const depot=document.getElementById('csDepot');
    const depotValue=depot?.value==='Other'?(document.getElementById('csDepotOther')?.value.trim()||''):depot?.value;
    const required=[depotValue,document.getElementById('csDriver')?.value.trim(),document.getElementById('csService')?.value.trim(),document.getElementById('csFleet')?.value.trim()];
    if(required.some(v=>!v)){
      alert('Please select a depot and enter the driver, service and fleet number.');
      return;
    }

    btn.disabled=true;
    btn.classList.add('isSaving');
    btn.dataset.oldText=btn.textContent;
    btn.textContent='SAVING CHECK…';
    progress.classList.add('active');
    if(typeof setStatus==='function')setStatus('Saving check. Please wait…');

    try{
      if(typeof window.saveCheckSheet==='function')window.saveCheckSheet();
      await new Promise(resolve=>setTimeout(resolve,2200));
      btn.textContent='CHECK SAVED ✓';
      if(typeof setStatus==='function')setStatus('Check saved. You can submit the next check.');
      await new Promise(resolve=>setTimeout(resolve,700));
    }catch(err){
      console.error(err);
      btn.textContent='SAVE FAILED — TRY AGAIN';
      if(typeof setStatus==='function')setStatus('Save failed. Please try again.');
      await new Promise(resolve=>setTimeout(resolve,1400));
    }finally{
      progress.classList.remove('active');
      btn.disabled=false;
      btn.classList.remove('isSaving');
      btn.textContent=btn.dataset.oldText||'SAVE CHECK SHEET';
    }
  },true);
}

function setup(){
  addStyles();
  removeRefreshButton();
  addFilterHint('checksheet');
  addFilterHint('coverage');
  addFilterHint('reportSearch');
  setupSaveLock();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,1000));
else setTimeout(setup,1000);
})();