(function(){
'use strict';
const labels={notes:'Notes',tasks:'To Do',drivers:'Drivers To Check',events:'Events'};
function updateTabCounts(){
 const hub=document.getElementById('teamHub');
 if(!hub)return;
 const stats=hub.querySelector('.teamStats');
 if(stats)stats.style.display='none';
 const values={
  notes:document.getElementById('stNotes')?.textContent||'0',
  tasks:document.getElementById('stTasks')?.textContent||'0',
  drivers:document.getElementById('stDrivers')?.textContent||'0',
  events:document.getElementById('stEvents')?.textContent||'0'
 };
 Object.keys(labels).forEach(key=>{
  const button=hub.querySelector('[data-team-tab="'+key+'"]');
  if(!button)return;
  const wanted=labels[key]+' ('+values[key]+')';
  if(button.textContent!==wanted)button.textContent=wanted;
 });
}
function init(){
 updateTabCounts();
 setTimeout(updateTabCounts,500);
 setInterval(updateTabCounts,1500);
 document.addEventListener('click',e=>{if(e.target.closest('[data-team-tab]'))setTimeout(updateTabCounts,0);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();