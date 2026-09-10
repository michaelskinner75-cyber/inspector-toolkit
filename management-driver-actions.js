(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v||'').trim();
function parseDate(v){if(typeof parseRowDate==='function')return parseRowDate(v);let d=new Date(v);if(!isNaN(d))return d;const p=String(v||'').split('/');if(p.length===3)return new Date(Number(p[2].length===2?'20'+p[2]:p[2]),Number(p[1])-1,Number(p[0]));return new Date(0);}
function rows(){let a=[];try{if(window.cloud&&Array.isArray(window.cloud.Inspections))a=window.cloud.Inspections.slice();}catch(e){}if(!a.length)return[];const h=(a[0]||[]).map(v=>clean(v).toLowerCase());return h.some(v=>['date','time','inspector','driver','fleet','service','depot','location'].includes(v))?a.slice(1):a;}
function inCurrentRange(r){const f=window.MANAGEMENT_DATE_FILTER&&window.MANAGEMENT_DATE_FILTER.bounds;if(!f||!f.from||!f.to)return true;const d=parseDate(r[0]);return d>=f.from&&d<=f.to;}
function inspectorMatch(r){const sel=$('mgInspectorFilter');const wanted=sel&&sel.value?sel.value:'all';return wanted==='all'||clean(r[2]).toLowerCase()===clean(wanted).toLowerCase();}
function matching(type){return rows().filter(inCurrentRange).filter(inspectorMatch).filter(r=>type==='reported'?(/report|offence/i.test(clean(r[13]))&&!/no driver report/i.test(clean(r[13]))):/advis/i.test(clean(r[13])));}
function openList(type){
 const list=matching(type), label=type==='reported'?'Drivers Reported':'Drivers Advised';
 const title=$('mgModalTitle'), body=$('mgModalBody'), modal=$('mgModal');
 if(!body||!modal)return;
 if(title)title.textContent=label+' — '+list.length;
 body.innerHTML=list.map((r,i)=>'<button type="button" class="mgActionDetail" data-action-index="'+i+'" data-action-type="'+type+'"><div><strong>'+esc(r[4]||'Driver not recorded')+'</strong><small>'+esc(r[0]||'-')+' '+esc(r[1]||'')+'</small></div><div>Service '+esc(r[5]||'-')+' • Fleet '+esc(r[6]||'-')+'</div><div>'+esc(r[14]||r[13]||'-')+'</div><b>OPEN DETAILS</b></button>').join('')||'<div class="mgEmpty">No '+label.toLowerCase()+' in this period.</div>';
 modal.classList.add('show');
}
function openDetail(type,index){
 const r=matching(type)[Number(index)]; if(!r)return;
 const title=$('mgModalTitle'),body=$('mgModalBody');
 if(title)title.textContent=(type==='reported'?'Driver Reported':'Driver Advised')+' — Full Details';
 const fields=[['Date',r[0]],['Time',r[1]],['Inspector',r[2]],['Depot',r[3]],['Driver',r[4]],['Service',r[5]],['Fleet',r[6]],['Location',r[8]],['Destination',r[9]],['Outcome',r[13]],['Notes / Reason',r[14]]];
 body.innerHTML=fields.filter(x=>clean(x[1])).map(x=>'<div class="mgDetail"><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></div>').join('');
}
function enhance(){
 const sec=$('managementSummary'); if(!sec)return;
 [...sec.querySelectorAll('.panel')].forEach(p=>{const h=p.querySelector('h3');if(h&&clean(h.textContent)==='Recent Management Activity')p.remove();});
 sec.querySelectorAll('.mgStat').forEach(card=>{
   const label=clean(card.querySelector('span')?.textContent);
   let type=''; if(label==='Drivers Reported')type='reported'; else if(label==='Drivers Advised')type='advised'; else return;
   card.dataset.mgDriverAction=type; card.setAttribute('role','button'); card.setAttribute('tabindex','0'); card.classList.add('mgDriverAction');
 });
}
function style(){
 if($('mgDriverActionCss'))return;
 const s=document.createElement('style');s.id='mgDriverActionCss';s.textContent='.mgDriverAction{cursor:pointer}.mgDriverAction:hover{background:#153149}.mgDriverAction:focus{outline:2px solid #eea83e;outline-offset:2px}.mgActionDetail{width:100%;display:grid;grid-template-columns:1.3fr 1fr 1.5fr auto;gap:10px;align-items:center;padding:11px;border:0;border-bottom:1px solid #28465b;background:transparent;color:#fff;text-align:left}.mgActionDetail:hover{background:#102b40}.mgActionDetail small{display:block;color:#b8c5ce;margin-top:3px}.mgActionDetail>b{font-size:11px;color:#eea83e}@media(max-width:760px){.mgActionDetail{grid-template-columns:1fr}.mgActionDetail>b{justify-self:start}}';document.head.appendChild(s);
}
function init(){
 style(); enhance();
 const sec=$('managementSummary'); if(!sec){setTimeout(init,700);return;}
 const obs=new MutationObserver(enhance); obs.observe(sec,{childList:true,subtree:true});
 sec.addEventListener('click',e=>{const detail=e.target.closest('[data-action-index]');if(detail){openDetail(detail.dataset.actionType,detail.dataset.actionIndex);return;}const card=e.target.closest('[data-mg-driver-action]');if(card)openList(card.dataset.mgDriverAction);});
 sec.addEventListener('keydown',e=>{const card=e.target.closest('[data-mg-driver-action]');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openList(card.dataset.mgDriverAction);}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();