(function(){
'use strict';
const clean=v=>String(v||'').toLowerCase().replace(/\s+/g,' ').trim();
function formatDate(v){
 const s=String(v||'').trim();
 if(/^\d{4}-\d{2}-\d{2}$/.test(s)){const[y,m,d]=s.split('-');return d+'/'+m+'/'+y;}
 const p=s.split('/');if(p.length===3)return String(p[0]).padStart(2,'0')+'/'+String(p[1]).padStart(2,'0')+'/'+p[2];
 const d=new Date(s);return isNaN(d)?s:d.toLocaleDateString('en-GB');
}
function rows(){
 try{
  const data=(typeof cloud!=='undefined'&&cloud&&Array.isArray(cloud['Inspections']))?cloud['Inspections'].slice():[];
  if(!data.length)return[];
  const first=(data[0]||[]).map(clean);
  const body=first.some(v=>['date','time','inspector','driver','fleet','service','depot','location'].includes(v))?data.slice(1):data;
  return body.filter(r=>String(r[15]||'').trim()).map(r=>({date:formatDate(r[0]),driver:String(r[4]||''),service:String(r[5]||''),fleet:String(r[6]||''),ref:String(r[15]||'').trim()}));
 }catch(e){return[];}
}
function decorate(){
 const box=document.getElementById('reportResults');if(!box)return;
 const refs=rows();if(!refs.length)return;
 box.querySelectorAll('.compactCheck').forEach(card=>{
  const text=clean(card.textContent);
  const hit=refs.find(r=>text.includes(clean(r.date))&&(!r.driver||text.includes(clean(r.driver)))&&(!r.fleet||text.includes(clean(r.fleet)))&&(!r.service||text.includes(clean(r.service))));
  if(!hit)return;
  const main=card.querySelector('.compactMain');
  if(main&&!main.querySelector('.reportRefBadge'))main.insertAdjacentHTML('beforeend',' <span class="reportRefBadge">REF '+hit.ref.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))+'</span>');
  const details=card.querySelector('.compactDetails');
  if(details&&!details.querySelector('.reportRefDetail'))details.insertAdjacentHTML('afterbegin','<div class="reportRefDetail"><b>Offence Reference:</b> '+hit.ref.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))+'</div>');
 });
}
function style(){if(document.getElementById('reportReferenceDisplayCss'))return;const s=document.createElement('style');s.id='reportReferenceDisplayCss';s.textContent='.reportRefBadge{display:inline-block;margin-left:6px;padding:2px 7px;border-radius:6px;background:#ff7a00;color:#111;font-weight:900;font-size:.82em}.reportRefDetail{margin-bottom:8px;padding:8px;border-radius:7px;background:rgba(255,122,0,.16);border:1px solid #ff7a00;color:#fff}';document.head.appendChild(s);}
function init(){style();const run=()=>setTimeout(decorate,40);['reportSearchText','reportFrom','reportTo','reportType','reportSort','clearReportFilters'].forEach(id=>{const e=document.getElementById(id);if(e){e.addEventListener('input',run);e.addEventListener('change',run);e.addEventListener('click',run);}});document.addEventListener('click',e=>{if(e.target.closest('[data-report-range]'))run();});const old=window.renderReportSearch;if(typeof old==='function')window.renderReportSearch=function(){const result=old.apply(this,arguments);run();return result;};[800,1600,3000].forEach(ms=>setTimeout(decorate,ms));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,900));else setTimeout(init,900);
})();