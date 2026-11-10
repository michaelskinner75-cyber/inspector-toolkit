/* Automatically select the check sheet service region from its depot. */
(function(){
'use strict';
const WEST_DEPOTS=new Set(['ayr','ardrossan','kilmarnock','arran','charles street']);
const $=id=>document.getElementById(id);
function sync(){
 const depot=$('csDepot'),region=$('csServiceRegion');
 if(!depot||!region)return false;
 // Keep the region control available to destination and boarding-stop scripts,
 // but remove the extra selection from the inspector's check sheet.
 region.hidden=true;region.style.display='none';
 const label=document.querySelector('label[for="csServiceRegion"]');
 if(label){label.hidden=true;label.style.display='none';}
 const selected=String(depot.value||'').trim().toLowerCase();
 const desired=WEST_DEPOTS.has(selected)?'west':'east';
 if(region.value!==desired){
  region.value=desired;
  region.dispatchEvent(new Event('change',{bubbles:true}));
 }
 return true;
}
function init(){
 document.addEventListener('change',e=>{
  if(e.target?.id==='csDepot'||e.target?.id==='csDepotOther')sync();
 });
 document.addEventListener('click',e=>{
  if(e.target?.id==='clearCheckFormBtn'||e.target?.id==='saveCheckSheetBtn')setTimeout(sync,100);
 });
 let attempts=0;
 const timer=setInterval(()=>{sync();if(++attempts>=60)clearInterval(timer);},250);
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
