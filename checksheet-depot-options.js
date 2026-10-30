(function(){
'use strict';
// Update even when the existing depot dropdown was created by an older script.
const EXTRA_DEPOTS=['Ardrossan','Ayr','Kilmarnock'];
function ensureDepots(){
 const select=document.getElementById('csDepot');
 if(!select||select.tagName!=='SELECT')return false;
 const existing=()=>Array.from(select.options).map(o=>String(o.value||o.textContent||'').trim().toLowerCase());
 for(const name of EXTRA_DEPOTS){
  if(existing().includes(name.toLowerCase()))continue;
  const option=document.createElement('option');
  option.value=name;option.textContent=name;
  const other=Array.from(select.options).find(o=>String(o.value).trim().toLowerCase()==='other');
  if(other)select.insertBefore(option,other);else select.appendChild(option);
 }
 return EXTRA_DEPOTS.every(name=>existing().includes(name.toLowerCase()));
}
function initialise(){
 ensureDepots();
 const section=document.getElementById('checksheet');
 if(section&&typeof MutationObserver==='function'){
  new MutationObserver(()=>{
   const select=document.getElementById('csDepot');
   if(select?.tagName==='SELECT'&&EXTRA_DEPOTS.some(name=>![...select.options].some(o=>String(o.value).trim().toLowerCase()===name.toLowerCase())))ensureDepots();
  }).observe(section,{subtree:true,childList:true});
 }
 [100,400,1000,2500,5000].forEach(delay=>setTimeout(ensureDepots,delay));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialise,{once:true});
else initialise();
})();
