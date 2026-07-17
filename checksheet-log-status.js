(function(){
'use strict';
const byId=id=>document.getElementById(id);
let observer=null;
let scheduled=false;
function addCss(){
 if(byId('checkLogStatusCss'))return;
 const s=document.createElement('style');
 s.id='checkLogStatusCss';
 s.textContent='#checkList .compactCheck{position:relative;border-left:7px solid #35a86b;border-radius:12px;overflow:hidden;margin:9px 0}#checkList .compactCheck.logAdvised{border-left-color:#e6b53f;background:#44391b}#checkList .compactCheck.logOffence{border-left-color:#d84a53;background:#4a2026}#checkList .compactCheck.logClear{border-left-color:#35a86b;background:#15382d}#checkList .compactTop{position:relative;padding-right:100px}#checkList .nsaBadge{position:absolute;right:9px;top:50%;transform:translateY(-50%);min-width:70px;padding:7px;border-radius:9px;text-align:center;font-size:9px;font-weight:900;line-height:1.15;pointer-events:none}#checkList .nsaGood{background:#1f8a55;color:#fff}#checkList .nsaBad{background:#b93440;color:#fff}#checkList .nsaNA{background:#2878b8;color:#fff}@media(max-width:520px){#checkList .compactTop{padding-right:86px}#checkList .nsaBadge{min-width:60px;right:6px}}';
 document.head.appendChild(s);
}
function decorate(){
 const list=byId('checkList');
 if(!list)return;
 if(observer)observer.disconnect();
 list.querySelectorAll('.compactCheck').forEach(card=>{
  const details=card.querySelector('.compactDetails');
  const text=((details&&details.textContent)||card.textContent||'').toLowerCase();
  card.classList.remove('logClear','logAdvised','logOffence');
  if(/offence report submitted|offence report to be submitted|driver report:\s*offence/i.test(text))card.classList.add('logOffence');
  else if(/driver advised|driver report:\s*advised/i.test(text))card.classList.add('logAdvised');
  else card.classList.add('logClear');
  const top=card.querySelector('.compactTop');
  if(!top)return;
  let badge=top.querySelector('.nsaBadge');
  if(!badge){badge=document.createElement('span');badge.className='nsaBadge';top.appendChild(badge);}
  if(/nsa:\s*n\/?a\b/i.test(text)){badge.className='nsaBadge nsaNA';badge.textContent='NSA N/A';}
  else if(/nsa:\s*no\b/i.test(text)){badge.className='nsaBadge nsaBad';badge.textContent='NSA NOT WORKING';}
  else{badge.className='nsaBadge nsaGood';badge.textContent='NSA WORKING';}
 });
 if(observer)observer.observe(list,{childList:true});
}
function schedule(){
 if(scheduled)return;
 scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;decorate();});
}
function init(){
 addCss();
 const list=byId('checkList');
 if(!list)return;
 observer=new MutationObserver(schedule);
 observer.observe(list,{childList:true});
 decorate();
 document.addEventListener('click',e=>{if(e.target.closest('[data-check-filter],#refreshChecksBtn,#toggleCheckHistoryBtn'))setTimeout(schedule,50);});
 document.addEventListener('input',e=>{if(e.target.id==='checkSearch')setTimeout(schedule,50);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1200));else setTimeout(init,1200);
})();