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

function isCompletelyBlankRow(row){
  return !Array.isArray(row)||row.every(value=>String(value??'').trim()==='');
}

function removeBlankCloudRows(){
  if(typeof window.cloud!=='object'||!window.cloud)return;
  ['Inspections','NSA Faults','Driver Reports','Early Running'].forEach(sheet=>{
    const rows=window.cloud[sheet];
    if(!Array.isArray(rows)||!rows.length)return;
    const first=rows[0];
    window.cloud[sheet]=[first,...rows.slice(1).filter(row=>!isCompletelyBlankRow(row))];
  });
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
    removeBlankCloudRows();
  },1000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,3000));
else setTimeout(init,3000);
})();