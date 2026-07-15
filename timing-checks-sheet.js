(function(){
'use strict';
const SHEET='Timing Checks';
function ensureSheet(){
  try{if(typeof sheets!=='undefined'&&!sheets.includes(SHEET))sheets.push(SHEET);}catch(e){}
  try{if(typeof cloud!=='undefined'&&!Array.isArray(cloud[SHEET]))cloud[SHEET]=[];}catch(e){}
  try{
    if(typeof timingRows==='function')timingRows=function(){return dataRows(SHEET).filter(r=>r.length>=10);};
  }catch(e){}
}
async function loadTimingChecks(){
  ensureSheet();
  try{
    const res=await fetch(WEB_APP_URL+'?sheet='+encodeURIComponent(SHEET)+'&_='+Date.now(),{cache:'no-store'});
    const json=await res.json();
    if(typeof cloud!=='undefined')cloud[SHEET]=json.data||[];
    if(typeof renderTiming==='function')renderTiming();
  }catch(e){console.log('Timing Checks sheet could not be loaded',e);}
}
function init(){ensureSheet();loadTimingChecks();setTimeout(loadTimingChecks,1800);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();