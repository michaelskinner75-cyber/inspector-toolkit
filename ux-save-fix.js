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
  // Notify add-on controls that the inspection is a new blank form.
  field('checksheet')?.dispatchEvent(new Event('inspector-checksheet-cleared',{bubbles:true}));
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

function field(id){return document.getElementById(id);}

function syncVisibleService(){
  const canonical=field('csService');
  const search=field('csServiceSearch');
  // The autocomplete is a visible input backed by a hidden value used by cloud saving.
  // Synchronise on every submit, including manually typed (unlisted) services.
  if(canonical&&search)canonical.value=search.value.trim();
  // Destination also has a separate visible dropdown/manual input.
  const destination=field('csDestination'),choice=field('csDestinationChoice'),manual=field('csDestinationManual');
  if(destination&&choice)destination.value=choice.value==='__manual__'?String(manual?.value||'').trim():choice.value;
}

function resetInspectionFields(){
  // Clear the official check-sheet state, then any controls introduced by add-on scripts.
  if(typeof window.clearCheckForm==='function')window.clearCheckForm();
  else ['csDepot','csDriver','csService','csFleet','csTimeOn','csBoarding','csDestination','csNSANotes','csDriverReason'].forEach(id=>{const el=field(id);if(el)el.value='';});
  const service=field('csService');
  const search=field('csServiceSearch');
  if(service)service.value='';
  if(search)search.value='';
  const serviceWrap=document.querySelector('[data-for-service="csService"]');
  if(typeof serviceWrap?._clear==='function')serviceWrap._clear();
  const other=field('csDepotOther');
  if(other){other.value='';other.style.display='none';}
  const driver=field('csDriver');
  if(driver){driver.value='';delete driver.dataset.employeeNumber;driver.removeAttribute('aria-invalid');}
  const driverSuggestion=field('driverSuggestions');
  if(driverSuggestion){driverSuggestion.classList.remove('show');driverSuggestion.innerHTML='';}
  const lookup=field('csEmployeeLookupStatus');
  if(lookup){lookup.textContent='';lookup.classList.remove('found','missing');}
  const geo=field('geoLocationStatus');if(geo)geo.textContent='';
  const manual=field('csDestinationManual');if(manual)manual.style.display='none';
  ['csService','csFleet','csTimeOn','csBoarding','csDestination','csDestinationManual','csNSANotes','csDriverReason','csNatureOffence','csPassengers','csVehicleIssueNotes'].forEach(id=>{const el=field(id);if(el){el.value='';el.removeAttribute('aria-invalid');}});
  const defaults={csNSA:'Yes',csNSAFault:'Fully Working',csDriverReport:'No Driver Report',csVehicleIssue:'No Vehicle Issues',csJourneyStatus:'On Time',csConfirmedEarly:'No',csDestinationChoice:''};
  Object.entries(defaults).forEach(([id,value])=>{const el=field(id);if(el)el.value=value;});
  const confirm=field('csEarlyConfirmWrap');
  if(confirm)confirm.classList.remove('show');
  if(service)service.dispatchEvent(new Event('change',{bubbles:true}));
  // Keep csDate and the inspector logged in, ready for the next inspection.
}

function setupSaveLock(){
  const btn=field('saveCheckSheetBtn');
  if(!btn||btn.dataset.saveLockReady==='2')return;
  btn.dataset.saveLockReady='2';
  const progress=document.createElement('div');
  progress.className='saveProgress';
  progress.innerHTML='<div class="saveProgressBar"></div>';
  btn.parentElement?.after(progress);

  const clear=field('clearCheckFormBtn');
  if(clear&&clear.dataset.fullResetReady!=='1'){
    clear.dataset.fullResetReady='1';
    clear.addEventListener('click',()=>setTimeout(resetInspectionFields,0));
  }

  btn.addEventListener('click',async function(e){
    e.preventDefault();
    e.stopImmediatePropagation();
    if(btn.disabled)return;
    syncVisibleService();
    const depot=field('csDepot');
    const depotValue=depot?.value==='Other'?(field('csDepotOther')?.value.trim()||''):String(depot?.value||'').trim();
    const required=[
      [depotValue,depot],
      [String(field('csDriver')?.value||'').trim(),field('csDriver')],
      [String(field('csService')?.value||'').trim(),field('csServiceSearch')||field('csService')],
      [String(field('csFleet')?.value||'').trim(),field('csFleet')]
    ];
    const missing=required.find(([value])=>!value);
    if(missing){
      alert('Please select a depot and enter the driver, service and fleet number.');
      missing[1]?.focus?.();
      return;
    }
    if(typeof window.saveCheckSheet!=='function'){
      alert('Inspection saving is unavailable. Please reopen Inspector Hub and try again.');
      return;
    }

    btn.disabled=true;
    btn.classList.add('isSaving');
    const oldText=btn.textContent;
    btn.textContent='SAVING CHECK…';
    progress.classList.add('active');
    if(typeof setStatus==='function')setStatus('Submitting inspection…');

    try{
      const before=typeof cloud!=='undefined'&&Array.isArray(cloud['Inspections'])?cloud['Inspections'].length:null;
      const outcome=window.saveCheckSheet();
      if(outcome&&typeof outcome.then==='function')await outcome;
      const after=typeof cloud!=='undefined'&&Array.isArray(cloud['Inspections'])?cloud['Inspections'].length:null;
      if(outcome===false||(before!==null&&after!==null&&after<=before)){
        throw new Error('Inspection was not accepted for saving');
      }
      resetInspectionFields();
      btn.textContent='CHECK SUBMITTED ✓';
      if(typeof setStatus==='function')setStatus('Inspection submitted. Ready for the next check.');
      await new Promise(resolve=>setTimeout(resolve,700));
    }catch(err){
      console.error('Inspector check sheet submission failed:',err);
      btn.textContent='SAVE FAILED — TRY AGAIN';
      if(typeof setStatus==='function')setStatus('Inspection not submitted. Your details have been kept.');
      await new Promise(resolve=>setTimeout(resolve,1200));
    }finally{
      progress.classList.remove('active');
      btn.disabled=false;
      btn.classList.remove('isSaving');
      btn.textContent=oldText||'SAVE CHECK SHEET';
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