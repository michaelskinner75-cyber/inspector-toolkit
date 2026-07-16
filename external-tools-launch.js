(function(){
'use strict';
const tools={
  busTimes:()=> 'https://bustimes.org/',
  utrack:()=>{
    const d=new Date();
    const date=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
    return 'https://stagecoach.origin.utrack.com/data/trips/by-operator/ESAH/'+date;
  },
  ticketFinder:()=> 'https://www.stagecoachbus.com/tickets',
  journeyPlanner:()=> 'https://www.stagecoachbus.com/plan-a-journey'
};
function prepare(){
  Object.keys(tools).forEach(id=>{
    const section=document.getElementById(id);
    if(section){
      section.querySelectorAll('iframe').forEach(frame=>{try{frame.src='about:blank';frame.remove();}catch(e){}});
      const link=section.querySelector('a.openLink');
      if(link){link.href=tools[id]();link.target='_blank';link.rel='noopener noreferrer';}
    }
  });
}
document.addEventListener('click',e=>{
  const button=e.target.closest('button[data-open]');
  if(!button||!tools[button.dataset.open])return;
  e.preventDefault();
  e.stopImmediatePropagation();
  window.open(tools[button.dataset.open](),'_blank','noopener,noreferrer');
},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prepare);else prepare();
setTimeout(prepare,500);
})();