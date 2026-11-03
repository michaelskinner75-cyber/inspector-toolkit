(function(){
'use strict';
const el=id=>document.getElementById(id);
const clean=v=>String(v??'');
const html=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let last='',pending=false,loading=null,lastFetch=Date.now();
function setup(){
 const sheet=el('checksheet');if(!sheet||!window.InspectorCoverageModel)return false;
 let bar=el('suggestedChecksBar');
 if(!bar){
  bar=document.createElement('section');bar.id='suggestedChecksBar';bar.className='suggestedChecks';
  bar.setAttribute('aria-label','Suggested service checks');
  bar.innerHTML='<div class="suggestedHeader"><strong>SUGGESTED CHECKS</strong><span>Never checked and least checked services</span></div><div id="suggestedViewport" class="suggestedViewport" tabindex="0" role="region" aria-label="Scrolling service check suggestions">Loading shared checks…</div>';
  const style=document.createElement('style');style.id='suggestedChecksStyle';
  style.textContent=[
   '#checksheet .suggestedChecks{background:#0b273b;border:1px solid #4c6d83;border-radius:12px;padding:10px;margin:8px 0 14px;overflow:hidden}',
   '#checksheet .suggestedHeader{display:flex;justify-content:space-between;gap:6px;align-items:baseline;flex-wrap:wrap;margin-bottom:9px}',
   '#checksheet .suggestedHeader strong{font-size:14px;color:#f5bb58}#checksheet .suggestedHeader span{font-size:11px;color:#c0d4e3}',
   '#checksheet .suggestedViewport{overflow-x:auto;overflow-y:hidden;touch-action:pan-x;scrollbar-width:thin}',
   '#checksheet .suggestedTrack{display:flex;width:max-content;animation:suggestedSlide var(--speed,75s) linear infinite}',
   '#checksheet .suggestedSet{display:flex;gap:10px;padding-right:10px;flex:0 0 auto}',
   '#checksheet .suggestedCard{box-sizing:border-box;flex:0 0 210px;width:210px;max-width:65vw;background:#16364c;border-left:4px solid #eea83e;border-radius:9px;padding:9px}',
   '#checksheet .suggestedCard strong{display:block;font-size:20px}#checksheet .suggestedCard small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#c5d5df;font-size:11px;margin:4px 0}',
   '#checksheet .suggestedCard em{display:block;font-size:11px;color:#e9bd70;font-weight:800;font-style:normal}',
   '#checksheet .suggestedCard span{display:block;font-size:10px;color:#aabbc9;margin-top:4px}',
   '#checksheet .suggestedViewport:hover .suggestedTrack,#checksheet .suggestedViewport:focus-within .suggestedTrack,#checksheet .suggestedViewport:active .suggestedTrack{animation-play-state:paused}',
   '@keyframes suggestedSlide{to{transform:translateX(-50%)}}@media(prefers-reduced-motion:reduce){#checksheet .suggestedTrack{animation:none}}'
  ].join('');
  document.head.appendChild(style);
 }
 const anchor=el('checkTypeChooser')||sheet.querySelector('h2');
 if(anchor&&bar.previousElementSibling!==anchor)anchor.insertAdjacentElement('afterend',bar);
 const inspection=sheet.querySelector('[data-check-type="inspection"]');
 if(inspection)bar.classList.toggle('inspectionModeHidden',!inspection.classList.contains('active'));
 return true;
}
function render(){
 if(!setup())return;
 const model=window.InspectorCoverageModel,view=el('suggestedViewport');
 if(!model.rows('Inspections').length&&!model.rows('Timing Checks').length&&!model.rows('Early Running').length){view.textContent='Waiting for shared inspection records…';last='';return;}
 const count=s=>Math.max(0,Number(s.checkCount)||0);
 const compare=(a,b)=>count(a)-count(b)||clean(a.original?.date).localeCompare(clean(b.original?.date))||clean(a.code).localeCompare(clean(b.code),undefined,{numeric:true});
 const all=model.status(model.defs());
 const list=all.filter(s=>!s.checked).sort(compare).slice(0,10).concat(all.filter(s=>s.checked).sort(compare).slice(0,8));
 const key=list.map(s=>[s.id,s.checkCount,s.checked,s.original?.date].join(':')).join('|');
 if(last===key)return;last=key;
 if(!list.length){view.textContent='No suggested checks available.';return;}
 const card=s=>'<div class="suggestedCard"><strong>'+html(s.code)+'</strong><small title="'+html(s.route)+'">'+html(s.route||'Route not listed')+'</small><em>'+(!s.checked?(count(s)?'MARKED NOT CHECKED':'NEVER CHECKED'):count(s)===0?'MANUALLY CHECKED':count(s)===1?'CHECKED ONCE':count(s)+' CHECKS')+'</em><span>'+(s.original?.date?'Last: '+html(s.original.date):'No recorded checks')+'</span></div>';
 const group=list.map(card).join('');
 view.style.setProperty('--speed',Math.max(60,list.length*5)+'s');
 view.innerHTML='<div class="suggestedTrack"><div class="suggestedSet">'+group+'</div><div class="suggestedSet" aria-hidden="true">'+group+'</div></div>';
}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;render();});}
async function refresh(){
 if(loading||typeof fetchCloudSheet!=='function')return;
 loading=Promise.allSettled(['Inspections','Timing Checks','Early Running','Services'].map(name=>fetchCloudSheet(name))).then(()=>{lastFetch=Date.now();schedule();}).finally(()=>{loading=null;});
 return loading;
}
function start(){
 if(!setup())return false;
 schedule();
 const previous=window.renderAll;
 if(typeof previous==='function'&&!previous.suggestedChecksWrapped){
  const wrapped=function(...args){const result=previous.apply(this,args);schedule();return result;};
  wrapped.suggestedChecksWrapped=true;window.renderAll=wrapped;
 }
 const list=el('coverageList');
 if(list)new MutationObserver(schedule).observe(list,{childList:true});
 document.addEventListener('inspector-service-master-updated',schedule);
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-open="checksheet"]')){setTimeout(schedule,100);if(Date.now()-lastFetch>90000)setTimeout(refresh,300);}
  if(event.target.closest('#sctRefresh,#refreshChecksBtn'))setTimeout(schedule,500);
 });
 setInterval(()=>{if(el('checksheet')?.classList.contains('active')&&!document.hidden&&Date.now()-lastFetch>120000)refresh();},60000);
 return true;
}
let attempts=0;
const timer=setInterval(()=>{if(start()||++attempts>80)clearInterval(timer);},200);
})();