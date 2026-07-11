(function(){
'use strict';

const byId=id=>document.getElementById(id);

function usefulValue(id){
  const el=byId(id);
  return el?String(el.value||'').trim():'';
}

function hasMinimumCheckDetails(){
  return Boolean(usefulValue('csDriver')||usefulValue('csService')||usefulValue('csFleet'));
}

function installSaveGuard(){
  if(typeof window.saveCheckSheet!=='function'||window.saveCheckSheet.__blankGuard)return;
  const original=window.saveCheckSheet;
  const guarded=function(){
    if(!hasMinimumCheckDetails()){
      alert('Please enter a driver, service or fleet number before saving the check.');
      const driver=byId('csDriver');
      if(driver)driver.focus();
      return false;
    }
    return original.apply(this,arguments);
  };
  guarded.__blankGuard=true;
  window.saveCheckSheet=guarded;
}

function meaningful(value){
  const text=String(value??'').trim();
  if(!text)return false;
  return !/^[-–—|:•.\s]+$/.test(text);
}

function isBlankInspectionRow(row){
  if(!Array.isArray(row))return true;
  // Ignore date/time and default dropdown values. A real inspection must contain
  // something in inspector, depot, driver, service, fleet, journey or notes.
  const meaningfulIndexes=[2,3,4,5,6,8,9,12,14];
  return meaningfulIndexes.every(index=>!meaningful(row[index]));
}

function isBlankNsaRow(row){
  if(!Array.isArray(row))return true;
  const meaningfulIndexes=[2,3,4,5,6,9,10,11,12];
  return meaningfulIndexes.every(index=>!meaningful(row[index]));
}

function isBlankGeneralRow(row){
  return !Array.isArray(row)||row.every(value=>!meaningful(value));
}

function removeBlankCloudRows(){
  if(typeof window.cloud!=='object'||!window.cloud)return false;
  let changed=false;
  const filters={
    'Inspections':isBlankInspectionRow,
    'NSA Faults':isBlankNsaRow,
    'Driver Reports':isBlankGeneralRow,
    'Early Running':isBlankGeneralRow
  };
  Object.entries(filters).forEach(([sheet,isBlank])=>{
    const rows=window.cloud[sheet];
    if(!Array.isArray(rows)||rows.length<2)return;
    const filtered=rows.slice(1).filter(row=>!isBlank(row));
    if(filtered.length!==rows.length-1){
      window.cloud[sheet]=[rows[0],...filtered];
      changed=true;
    }
  });
  return changed;
}

function refreshVisibleLists(){
  removeBlankCloudRows();
  if(typeof window.renderChecks==='function')window.renderChecks();
  if(typeof window.renderReportSearch==='function')window.renderReportSearch();
}

function init(){
  installSaveGuard();
  refreshVisibleLists();
  setInterval(()=>{
    installSaveGuard();
    if(removeBlankCloudRows()){
      if(typeof window.renderChecks==='function')window.renderChecks();
      if(typeof window.renderReportSearch==='function')window.renderReportSearch();
    }
  },1000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,3000));
else setTimeout(init,3000);
})();