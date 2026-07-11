(function(){
'use strict';
function cleanOtherDepot(){
  const input=document.getElementById('csDepotOther');
  if(!input)return;
  const block=input.closest('.fieldBlock');
  if(!block)return;
  const label=block.querySelector('label');
  if(label&&label.textContent.trim()==='Other Depot')label.remove();
  const hidden=input.hidden||getComputedStyle(input).display==='none';
  block.style.display=hidden?'none':'';
}
function init(){
  cleanOtherDepot();
  const depot=document.getElementById('csDepot');
  if(depot)depot.addEventListener('change',()=>setTimeout(cleanOtherDepot,0));
  new MutationObserver(cleanOtherDepot).observe(document.body,{subtree:true,attributes:true,attributeFilter:['style','hidden','class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1800));else setTimeout(init,1800);
})();