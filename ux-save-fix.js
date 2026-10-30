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


/* All visible inspection controls must match the values the legacy save function reads.
   In particular, service/destination search controls have hidden backing inputs. */
function syncVisibleInspectionValues(){
  const service=document.getElementById('csService');
  const search=document.getElementById('csServiceSearch');
  if(service&&search)service.value=search.value.trim();
  const destination=document.getElementById('csDestination');
  const choice=document.getElementById('csDestinationChoice');
  const manual=document.getElementById('csDestinationManual');
  if(destination&&choice){
    destination.value=choice.value==='__manual__'?(manual?.value||''):choice.value;
  }
}

function resetInspectionUI(){
  const ids=['csDriver','csService','csServiceSearch','csFleet','csTimeOn',
    'csBoarding','csDestination','csDestinationManual','csNSANotes',
    'csDriverReason','csNatureOffence','csPassengers','csVehicleIssueNotes'];
  ids.forEach(id=>{const el=document.getElementById(id);if(el){el.value='';el.removeAttribute('aria-invalid');}});
  const depot=document.getElementById('csDepot');
  if(depot)depot.value='';
  const depotOther=document.getElementById('csDepotOther');
  if(depotOther){depotOther.value='';depotOther.style.display='none';}
  const defaults={csNSA:'Yes',csNSAFault:'Fully Working',
    csDriverReport:'No Driver Report',csVehicleIssue:'No Vehicle Issues',
    csJourneyStatus:'On Time',csConfirmedEarly:'No',csDestinationChoice:''};
  Object.keys(defaults).forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.value=defaults[id];el.removeAttribute('aria-invalid');}
  });
  const route=document.querySelector('[data-for-service="csService"]');
  if(typeof route?._clear==='function')route._clear();
  const suggestions=document.getElementById('csServiceSuggestions');
  if(suggestions){suggestions.innerHTML='';suggestions.classList.remove('show');}
  const search=document.getElementById('csServiceSearch');
  if(search)search.setAttribute('aria-expanded','false');
  const driverSuggestions=document.getElementById('driverSuggestions');
  if(driverSuggestions){driverSuggestions.innerHTML='';driverSuggestions.classList.remove('show');}
  const driverStatus=document.getElementById('csEmployeeLookupStatus');
  if(driverStatus){driverStatus.textContent='';driverStatus.classList.remove('found','missing');}
  const early=document.getElementById('csEarlyConfirmWrap');
  if(early)early.classList.remove('show');
  const geo=document.getElementById('geoLocationStatus');
  if(geo)geo.textContent='';
  const service=document.getElementById('csService');
  if(service)service.dispatchEvent(new Event('change',{bubbles:true}));
  document.getElementById('checksheet')?.dispatchEvent(
    new CustomEvent('inspector-checksheet-cleared',{bubbles:true}));
  // Keep the selected inspection date so inspectors can log another check on that date.
}

function inspectionCount(){
  try{return typeof cloud!=='undefined'&&Array.isArray(cloud['Inspections'])?
    cloud['Inspections'].length:null;}catch(e){return null;}
}

function setupClearReset(){
  const btn=document.getElementById('clearCheckFormBtn');
  if(btn&&btn.dataset.fullResetReady!=='1'){
    btn.dataset.fullResetReady='1';
    btn.addEventListener('click',()=>setTimeout(resetInspectionUI,0));
  }
  const old=window.clearCheckForm;
  if(typeof old==='function'&&!old.__fullResetReady){
    const wrapped=function(){
      const result=old.apply(this,arguments);
      resetInspectionUI();
      return result;
    };
    wrapped.__fullResetReady=true;
    window.clearCheckForm=wrapped;
  }
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

    syncVisibleInspectionValues();
    const depot=document.getElementById('csDepot');
    const depotValue=depot?.value==='Other'?(document.getElementById('csDepotOther')?.value.trim()||''):depot?.value?.trim();
    const required=[
      {value:depotValue,name:'depot',id:depot?.value==='Other'?'csDepotOther':'csDepot'},
      {value:document.getElementById('csDriver')?.value.trim(),name:'driver',id:'csDriver'},
      {value:document.getElementById('csService')?.value.trim(),name:'service',id:document.getElementById('csServiceSearch')?'csServiceSearch':'csService'},
      {value:document.getElementById('csFleet')?.value.trim(),name:'fleet number',id:'csFleet'}
    ];
    const missing=required.filter(field=>!field.value);
    if(missing.length){
      alert('Please enter '+missing.map(x=>x.name).join(', ')+'.');
      document.getElementById(missing[0].id)?.focus();
      return;
    }

    btn.disabled=true;
    btn.classList.add('isSaving');
    btn.dataset.oldText=btn.textContent;
    btn.textContent='SAVING CHECK…';
    progress.classList.add('active');
    if(typeof setStatus==='function')setStatus('Saving check. Please wait…');

    try{
      if(typeof window.saveCheckSheet!=='function')throw new Error('Check saving is unavailable');
      const before=inspectionCount();
      const result=await Promise.resolve(window.saveCheckSheet());
      const after=inspectionCount();
      if(result===false||(before!==null&&after!==null&&after<=before))
        throw new Error('Inspection was not added; form has been preserved');
      resetInspectionUI();
      btn.textContent='CHECK SAVED ✓';
      if(typeof setStatus==='function')setStatus('Check saved. Ready for the next inspection.');
      await new Promise(resolve=>setTimeout(resolve,500));
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
  setupClearReset();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,1000));
else setTimeout(setup,1000);
})();