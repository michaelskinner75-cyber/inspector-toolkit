(function(){
'use strict';
function place(){
 const hidden=document.getElementById('csDestination');
 const wrap=document.querySelector('.destinationChoiceWrap');
 if(!hidden||!wrap)return false;
 if(wrap.nextElementSibling!==hidden)hidden.before(wrap);
 return true;
}
function init(){
 let tries=0;
 const timer=setInterval(()=>{
  tries++;
  place();
  if(tries>50)clearInterval(timer);
 },200);
 const target=document.getElementById('checksheet')||document.body;
 new MutationObserver(()=>requestAnimationFrame(place)).observe(target,{childList:true,subtree:true});
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-open="checksheet"],#inspectionModeBtn,#timingModeBtn'))setTimeout(place,50);
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();