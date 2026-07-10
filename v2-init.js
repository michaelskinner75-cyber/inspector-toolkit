(()=>{
 const keep=localStorage.getItem('keepTimingLocation')==='1';
 if($('keepTimingLocation')){
  $('keepTimingLocation').checked=keep;
  if(keep)$('tcLocation').value=localStorage.getItem('timingLocation')||'';
 }
 if($('saveTimingBtn'))$('saveTimingBtn').onclick=saveTimingCheck;
 if($('clearTimingBtn'))$('clearTimingBtn').onclick=clearTimingForm;
 if($('exportTimingBtn'))$('exportTimingBtn').onclick=exportTimingToday;
 if($('toggleServiceEditBtn'))$('toggleServiceEditBtn').onclick=()=>{const p=$('serviceEditPanel');p.style.display=p.style.display==='none'?'block':'none';renderCoverage();};
 if($('addServiceBtn'))$('addServiceBtn').onclick=()=>{const code=$('newServiceCode').value.trim(),route=$('newServiceRoute').value.trim();if(!code)return;serviceDefs.push({code,route});saveServices();$('newServiceCode').value='';$('newServiceRoute').value='';renderCoverage();};
 renderTiming();renderCoverage();renderDatabaseV2();
})();
