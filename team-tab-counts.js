(function(){
'use strict';
function updateTabCounts(){
 const hub=document.getElementById('teamHub');
 if(!hub)return false;
 const stats=hub.querySelector('.teamStats');
 if(stats)stats.style.display='none';
 const values={
  notes:document.getElementById('stNotes')?.textContent||'0',
  tasks:document.getElementById('stTasks')?.textContent||'0',
  drivers:document.getElementById('stDrivers')?.textContent||'0',
  events:document.getElementById('stEvents')?.textContent||'0'
 };
 const labels={notes:'Notes',tasks:'To Do',drivers:'Drivers To Check',events:'Events'};
 Object.keys(labels).forEach(key=>{
  const button=hub.querySelector('[data-team-tab="'+key+'"]');
  if(button)button.textContent=labels[key]+' ('+values[key]+')';
 });
 return true;
}
function init(){
 let tries=0;
 const timer=setInterval(()=>{
  tries++;
  if(updateTabCounts()||tries>40){
   if(tries>40)clearInterval(timer);
  }
 },250);
 const observer=new MutationObserver(updateTabCounts);
 observer.observe(document.body,{childList:true,subtree:true,characterData:true});
 setInterval(updateTabCounts,1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();