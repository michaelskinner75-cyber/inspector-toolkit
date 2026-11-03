/* All-service, live coverage ticker: Fife for Michael/Drew; Perth/Strathtay for Ali. */
(function(){
'use strict';
const el=id=>document.getElementById(id);
const clean=v=>String(v??'').trim();
const html=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let signature='',items=[],paused=false,shuffleMode=false,pending=false,loading=null,lastFetch=Date.now(),observer=null;
const bars=[{section:'checksheet',id:'suggestedChecksBar',view:'suggestedViewport'}];
function inspectorScope(){
 let name='';
 try{name=typeof getInspector==='function'?getInspector():localStorage.getItem('activeInspector')||'';}catch(e){}
 const norm=clean(name).toLowerCase().replace(/\./g,'').replace(/\s+/g,' ');
 if(['m skinner','michael skinner','a fairbairn','drew fairbairn'].includes(norm))return'fife';
 if(['a duncan','ali duncan','alan duncan'].includes(norm))return'strathtay';
 return'all';
}
function scopeLabel(scope){return scope==='fife'?'Fife & surrounding':scope==='strathtay'?'Strathtay & Perth':'All service areas';}
function todayKey(){
 const d=new Date();
 return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function ageDays(iso){
 const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/),t=todayKey().split('-').map(Number);
 if(!m)return Infinity;
 const then=Date.UTC(+m[1],+m[2]-1,+m[3]),now=Date.UTC(t[0],t[1]-1,t[2]);
 return Math.round((now-then)/86400000);
}
function classify(s,model){
 const recorded=model.date(s.checked?(s.item?.date||s.original?.date):(s.original?.date||''));
 const days=ageDays(recorded);
 // A manually marked NOT CHECKED service is not green, even with recent history.
 if(!recorded||!Number.isFinite(days))return {kind:'never',text:'NEVER CHECKED',date:'No recorded check',days:Infinity,rank:0};
 if(s.override?.status==='NOT_CHECKED'||!s.checked||days<0||days>14)
  return {kind:'overdue',text:'NOT CHECKED IN A WHILE',date:'Last: '+recorded,days,rank:1};
 return {kind:'recent',text:'CHECKED IN 2 WEEKS',date:'Last: '+recorded,days,rank:2};
}
function orderPriority(a,b){
 return a.state.rank-b.state.rank||
  (a.state.rank===0?0:b.state.days-a.state.days)||
  clean(a.code).localeCompare(clean(b.code),undefined,{numeric:true})||
  clean(a.route).localeCompare(clean(b.route));
}
function shuffled(list){
 const result=list.slice();
 for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
 if(result.length>1&&result.every((x,i)=>x===list[i]))result.push(result.shift());
 return result;
}
function timetable(s){
 const get=window.InspectorCoverageTimetableUrl;
 if(typeof get!=='function')return'';
 const url=clean(get(s));
 return /^https:\/\/(?:www\.)?bustimes\.org\/services\/[a-z0-9/_-]+(?:\?[a-z0-9=&_%.-]*)?$/i.test(url)?url:'';
}
function styles(){
 if(el('suggestedChecksStyle'))return;
 const style=document.createElement('style');style.id='suggestedChecksStyle';
 style.textContent=[
  '.suggestedChecks{background:#0b273b;border:1px solid #4c6d83;border-radius:12px;padding:10px;margin:9px 0 14px;overflow:hidden;box-sizing:border-box;min-width:0}',
  '.suggestedHeader{display:flex;justify-content:space-between;gap:6px;align-items:baseline;flex-wrap:wrap;margin-bottom:7px}',
  '.suggestedHeader strong{font-size:14px;color:#f5bb58}.suggestedHeader span{font-size:11px;color:#c0d4e3}',
  '.suggestedToolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:7px;margin:6px 0 9px}',
  '.suggestedLegend{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:10px;color:#deebf3}',
  '.suggestedLegend i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:3px;background:var(--dot)}',
  '.suggestedButtons{display:flex;align-items:center;gap:7px}',
  '.suggestedControl{font-family:inherit;font-size:11px;font-weight:850;color:#fff;background:#24506c;border:1px solid #62859f;border-radius:7px;min-height:33px;padding:6px 10px;cursor:pointer}',
  '.suggestedControl[aria-pressed="true"]{background:#f0b752;color:#112639;border-color:#f0b752}',
  '.suggestedViewport{width:100%;min-width:0;overflow-x:auto;overflow-y:hidden;touch-action:pan-x;scrollbar-width:thin;overscroll-behavior-inline:contain;scrollbar-color:#567890 transparent}',
  '.suggestedTrack{display:flex;width:max-content;animation:suggestedSlide var(--speed,120s) linear infinite}',
  '.suggestedSet{display:flex;align-items:stretch;gap:10px;padding-right:10px;flex:0 0 auto}',
  '.suggestedCard{box-sizing:border-box;display:flex;flex-direction:column;gap:5px;flex:0 0 205px;width:205px;max-width:65vw;background:#16364c;border:2px solid var(--tone);border-left-width:7px;border-radius:9px;padding:9px;color:#fff!important;text-decoration:none!important;text-align:left;min-height:112px}',
  '.suggestedCard.never{--tone:#e25760;background:#3d202b}',
  '.suggestedCard.overdue{--tone:#efbb4f;background:#423923}',
  '.suggestedCard.recent{--tone:#48b981;background:#183e36}',
  '.suggestedCard strong{font-size:20px;font-weight:950;line-height:1.1}',
  '.suggestedCard small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;color:#e1e8ed}',
  '.suggestedCard em{font-size:10px;font-weight:950;font-style:normal;color:var(--tone);letter-spacing:.02em}',
  '.suggestedCard .suggestedLast{display:block;font-size:10px;color:#d3dfe7}',
  '.suggestedCard .suggestedLinkHint{display:block;margin-top:auto;font-size:10px;font-weight:800;color:#e9f4ff}',
  '.suggestedDriverCard{box-sizing:border-box;display:flex;flex-direction:column;align-items:flex-start;gap:6px;flex:0 0 205px;width:205px;max-width:65vw;min-height:112px;background:#18384e;border:2px solid #56778f;border-left:7px solid #efb64f;border-radius:9px;padding:9px;color:#fff;text-align:left;cursor:pointer;font:inherit}',
  '.suggestedDriverCard.reported{border-left-color:#e25760}',
  '.suggestedDriverCard.driverRecent{border-top-color:#ffcc6d;border-right-color:#ffcc6d;border-bottom-color:#ffcc6d;box-shadow:0 0 10px rgba(255,204,109,.26)}',
  '.suggestedDriverCard strong{font-size:17px;font-weight:950;line-height:1.2;overflow-wrap:anywhere}',
  '.suggestedDriverCard em{font-size:11px;font-style:normal;font-weight:900;color:#ffcd7b}',
  '.suggestedDriverCard.reported em{color:#ff9fa7}',
  '.suggestedDriverCard .driverCategory{color:#b9cfde;font-size:9px;font-weight:850;letter-spacing:.05em}',
  '.suggestedDriverCard .driverRecentBadge{display:inline-flex;align-items:center;background:#ffcc6d;color:#172a39;font-size:9px;font-weight:950;border-radius:4px;padding:3px 6px;letter-spacing:.04em}',
  '.suggestedDriverCard .suggestedLinkHint{display:block;margin-top:auto;font-size:10px;font-weight:800;color:#e9f4ff}',
  '.suggestedCard:focus-visible,.suggestedDriverCard:focus-visible,.suggestedControl:focus-visible{outline:2px solid white!important;outline-offset:2px}',
  '.suggestedChecks.isPaused .suggestedTrack,.suggestedViewport:hover .suggestedTrack,.suggestedViewport:focus-within .suggestedTrack,.suggestedViewport:active .suggestedTrack{animation-play-state:paused!important}',
  '@keyframes suggestedSlide{from{transform:translateX(0)}to{transform:translateX(-50%)}}',
  '@media(max-width:540px){.suggestedChecks{padding:9px 8px}.suggestedControl{font-size:10px;padding:6px 8px}.suggestedLegend{font-size:9px;gap:6px}.suggestedCard,.suggestedDriverCard{flex-basis:185px;width:185px;min-height:113px}}',
  '@media(prefers-reduced-motion:reduce){.suggestedTrack{animation:none!important}}'
 ].join('');
 document.head.appendChild(style);
}
function createBar(info){
 const section=el(info.section);if(!section)return false;
 let bar=el(info.id);if(bar)return true;
 bar=document.createElement('section');bar.id=info.id;bar.className='suggestedChecks';
 bar.setAttribute('aria-label','Combined scrolling service checks and driver advice or reports');
 bar.innerHTML='<div class="suggestedHeader"><strong>🚌 SERVICE CHECKS &amp; DRIVER ACTIONS</strong><span class="suggestedArea">Loading area…</span></div>'+
  '<div class="suggestedToolbar"><div class="suggestedLegend"><span style="--dot:#e25760"><i></i>Never checked</span><span style="--dot:#efbb4f"><i></i>Over 2 weeks</span><span style="--dot:#48b981"><i></i>Within 2 weeks</span></div><div class="suggestedButtons"><button type="button" class="suggestedControl" data-suggested-pause aria-pressed="false">⏸ PAUSE</button><button type="button" class="suggestedControl" data-suggested-shuffle>⤨ SHUFFLE</button></div></div>'+
  '<div class="suggestedViewport" id="'+info.view+'" role="region" tabindex="0" aria-label="One scrolling bar with service checks and driver advice or reports. Tap for timetable or driver details">Loading shared checks…</div>';
 const anchor=el('checkTypeChooser')||section.querySelector('h2');
 if(anchor)anchor.insertAdjacentElement('afterend',bar);
 else section.insertBefore(bar,section.firstChild);
 return true;
}
function setup(){
 if(!window.InspectorCoverageModel)return false;
 styles();
 bars.forEach(createBar);
 // Both former Home Screen tickers have moved here; never show a second bar.
 el('homeSuggestedChecksBar')?.remove();
 el('homeDriverActionViewport')?.closest('.homeDriverActionShell')?.classList.add('inspectionModeHidden');
 el('suggestedChecksBar')?.classList.remove('inspectionModeHidden');
 return !!el('suggestedChecksBar');
}
function updateControls(){
 for(const info of bars){
  const bar=el(info.id);if(!bar)continue;
  bar.classList.toggle('isPaused',paused);
  const btn=bar.querySelector('[data-suggested-pause]');
  if(btn){btn.textContent=paused?'▶ RESUME':'⏸ PAUSE';btn.setAttribute('aria-pressed',String(paused));btn.setAttribute('aria-label',paused?'Resume scrolling suggested checks':'Pause scrolling suggested checks');}
 }
}
function serviceCard(s,duplicate){
 const url=timetable(s),state=s.state;
 const desc=html(s.code+' '+s.route);
 const common='class="suggestedCard '+state.kind+'" '+(duplicate?'tabindex="-1" ':'')+
  'title="'+html(url?'Open timetable: '+s.code+' '+s.route:'No timetable link available for '+s.code)+'"';
 const open=url?'<a '+common+' href="'+html(url)+'" target="_blank" rel="noopener noreferrer" aria-label="Open '+desc+' timetable">':'<div '+common+'>';
 const close=url?'</a>':'</div>';
 return open+'<strong>'+html(s.code)+'</strong><small>'+html(s.route||'Route not listed')+'</small><em>'+html(state.text)+'</em><span class="suggestedLast">'+html(state.date)+'</span><span class="suggestedLinkHint">'+(url?'TAP FOR TIMETABLE ↗':'TIMETABLE NOT LINKED')+'</span>'+close;
}
function driverCard(d,duplicate){
 const category=d.action==='REPORTED'?'reported':'advised';
 return '<button type="button" class="suggestedDriverCard '+category+(d.isRecent?' driverRecent':'')+'" data-unified-driver-index="'+Number(d.index)+'" '+(duplicate?'tabindex="-1" ':'')+'aria-label="'+html('View '+d.driver+' '+d.action.toLowerCase()+(d.isRecent?', recent':'')+' details')+'"><small class="driverCategory">DRIVER ACTION</small><strong>'+html(d.driver)+'</strong><em>'+html(d.action)+'</em>'+(d.isRecent?'<span class="driverRecentBadge">RECENT</span>':'')+'<span class="suggestedLinkHint">TAP FOR DETAILS ↗</span></button>';
}
function combinedCard(item,duplicate){
 return item.type==='driver'?driverCard(item,duplicate):serviceCard(item,duplicate);
}
function interleave(services,drivers){
 const result=[],randomDrivers=shuffled(drivers);
 const length=Math.max(services.length,randomDrivers.length);
 for(let i=0;i<length;i++){
  if(i<services.length)result.push(services[i]);
  if(i<randomDrivers.length)result.push(randomDrivers[i]);
 }
 return result;
}
function paint(){
 const view=el('suggestedViewport');if(!view)return;
 if(!items.length){view.textContent='No service or driver activity records available.';return;}
 const group=items.map(x=>combinedCard(x,false)).join('');
 const copy=items.map(x=>combinedCard(x,true)).join('');
 view.style.setProperty('--speed',Math.max(95,items.length*4)+'s');
 view.innerHTML='<div class="suggestedTrack"><div class="suggestedSet">'+group+'</div><div class="suggestedSet" aria-hidden="true">'+copy+'</div></div>';
 view.scrollLeft=0;
 updateControls();
}
function setPaused(next){paused=!!next;updateControls();}
window.InspectorUnifiedTicker={setPaused};
function shuffleNow(){
 if(items.length<2)return;
 items=shuffled(items);
 shuffleMode=true;
 paint();
}
function render(){
 if(!setup())return;
 const model=window.InspectorCoverageModel,scope=inspectorScope();
 const all=model.status(model.defs()).filter(s=>scope==='fife'?model.fifeService(s):scope==='strathtay'?model.strathtayService(s):true);
 const services=all.map(s=>({...s,type:'service',state:classify(s,model)})).sort(orderPriority);
 const driverAPI=window.InspectorHubDriverActions;
 const drivers=driverAPI&&typeof driverAPI.getItems==='function'?driverAPI.getItems().map(d=>({...d,type:'driver'})):[];
 const key=scope+'|'+todayKey()+'|'+services.map(s=>[s.id,s.checked,s.state.kind,s.state.date,s.checkCount].join(':')).join('|')+
  '|drivers|'+drivers.map(d=>[d.driver,d.action,d.date,d.time,d.note,d.service,d.fleet,d.inspector].join(':')).join('|');
 const label=el('suggestedChecksBar')?.querySelector('.suggestedArea');
 if(label)label.textContent=scopeLabel(scope)+' · '+services.length+' services · '+drivers.length+' driver actions';
 if(key===signature&&el('suggestedViewport')?.querySelector('.suggestedTrack'))return;
 signature=key;
 const merged=interleave(services,drivers);
 items=shuffleMode?shuffled(merged):merged;
 paint();
}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;render();});}
async function refresh(){
 if(loading||typeof fetchCloudSheet!=='function')return loading;
 loading=Promise.allSettled(['Inspections','Timing Checks','Early Running','Services','Driver Reports'].map(name=>fetchCloudSheet(name))).then(()=>{lastFetch=Date.now();schedule();}).finally(()=>{loading=null;});
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
 const coverage=el('coverageList');
 if(coverage&&!observer){observer=new MutationObserver(schedule);observer.observe(coverage,{childList:true});}
 document.addEventListener('inspector-service-master-updated',schedule);
 document.addEventListener('inspector-hub-login-change',()=>{signature='';shuffleMode=false;schedule();});
 window.addEventListener('storage',e=>{if(e.key==='activeInspector'){signature='';shuffleMode=false;schedule();}});
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-suggested-pause]')){setPaused(!paused);return;}
  if(e.target.closest('[data-suggested-shuffle]')){shuffleNow();return;}
  const driver=e.target.closest('[data-unified-driver-index]');
  if(driver?.closest('#suggestedViewport')){
   window.InspectorHubDriverActions?.open(Number(driver.dataset.unifiedDriverIndex),driver);
   return;
  }
  if(e.target.closest('[data-open="checksheet"]')){setTimeout(schedule,100);if(Date.now()-lastFetch>90000)setTimeout(refresh,300);}
  if(e.target.closest('#sctRefresh,#refreshChecksBtn'))setTimeout(schedule,500);
 });
 document.addEventListener('pointerdown',e=>{if(e.target.closest('.suggestedViewport'))setPaused(true);},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
 setInterval(()=>{
  if(!document.hidden&&el('checksheet')?.classList.contains('active')&&Date.now()-lastFetch>120000)refresh();
  else if(!document.hidden)schedule();
 },60000);
 return true;
}
let attempts=0;
const timer=setInterval(()=>{if(start()||++attempts>80)clearInterval(timer);},200);
})();