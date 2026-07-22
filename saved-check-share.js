(function(){
'use strict';
const LOGO='https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/StagecoachGroup.svg/500px-StagecoachGroup.svg.png';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function linesFromCard(card){
 const details=card.querySelector('.compactDetails');
 if(!details)return[];
 const clone=details.cloneNode(true);
 clone.querySelectorAll('br').forEach(br=>br.replaceWith('\n'));
 return clone.textContent.split('\n').map(v=>v.trim()).filter(Boolean);
}
function parseJourney(text){
 const parts=String(text||'').split(/\s+(?:to|→)\s+/i);
 return {boarding:(parts[0]||'-').trim(),destination:(parts.slice(1).join(' to ')||'-').trim()};
}
function reportFromCard(card){
 const x=linesFromCard(card);
 const journey=parseJourney(x[7]);
 const nsaRaw=String(x[8]||'NSA: -').replace(/^NSA:\s*/i,'');
 const nsaParts=nsaRaw.split(/\s+-\s+/);
 const driverReport=String(x[9]||'Driver Report: -').replace(/^Driver Report:\s*/i,'');
 return {
  created:new Date(),dateTime:x[0]||'-',inspector:x[1]||'-',depot:x[2]||'-',driver:x[3]||'-',service:x[4]||'-',fleet:x[5]||'-',timeChecked:x[6]||'-',boarding:journey.boarding,destination:journey.destination,nsa:nsaParts[0]||'-',nsaDetails:nsaParts.slice(1).join(' - ')||((nsaParts[0]||'')==='Yes'?'Fully Working':'-'),driverReport,reason:x[10]||'-'
 };
}
function title(d){return 'Inspector Check Sheet - Report Record'+(d.service&&d.service!=='-'?' - Service '+d.service:'')+(d.fleet&&d.fleet!=='-'?' - Fleet '+d.fleet:'');}
function text(d){return ['STAGECOACH SOUTH SCOTLAND','INSPECTOR CHECK SHEET / REPORT RECORD','',`Inspection date/time: ${d.dateTime}`,`Inspector: ${d.inspector}`,'','INSPECTION DETAILS',`Driver: ${d.driver}`,`Depot: ${d.depot}`,`Fleet Number: ${d.fleet}`,`Time Checked: ${d.timeChecked}`,'','JOURNEY DETAILS',`Service: ${d.service}`,`Boarding point: ${d.boarding}`,`Destination: ${d.destination}`,'','NSA',`NSA Working: ${d.nsa}`,`Details: ${d.nsaDetails}`,'','DRIVER',`Driver Report: ${d.driverReport}`,`Driver report reason / inspection notes: ${d.reason}`,'','Stagecoach South Scotland','Designed & Developed by Michael Skinner'].join('\n');}
function row(label,value){return `<div class="r"><div class="l">${esc(label)}</div><div class="v">${esc(value)}</div></div>`;}
function section(name,rows){return `<section><h2>${esc(name)}</h2><div class="grid">${rows}</div></section>`;}
function html(d){return `<article><header><img src="${LOGO}" alt="Stagecoach"><strong>STAGECOACH SOUTH SCOTLAND</strong></header><div class="title"><h1>INSPECTOR CHECK SHEET / REPORT RECORD</h1></div><div class="meta">${row('Inspection date/time',d.dateTime)}${row('Inspector',d.inspector)}</div>${section('Inspection Details',row('Driver',d.driver)+row('Depot',d.depot)+row('Fleet Number',d.fleet)+row('Time Checked',d.timeChecked))}${section('Journey Details',row('Service',d.service)+row('Boarding point',d.boarding)+row('Destination',d.destination))}${section('NSA',row('NSA Working',d.nsa)+row('Details',d.nsaDetails))}${section('Driver',row('Driver Report',d.driverReport)+row('Driver report reason / inspection notes',d.reason))}<footer><span>Stagecoach South Scotland</span><span>Designed &amp; Developed by Michael Skinner</span></footer></article>`;}
function css(){return `*{box-sizing:border-box}body{margin:0;padding:24px;background:#eef2f5;color:#102333;font-family:Arial,sans-serif}article{max-width:850px;margin:auto;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,.12)}header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px 28px;border-bottom:1px solid #dbe3e8}header img{width:210px;max-width:58%;height:auto}header strong{font-size:12px;letter-spacing:.14em;color:#173c57;text-align:right}.title{padding:24px 28px;border-bottom:5px solid #f5a623;background:#0d2b40;color:#fff}.title h1{margin:0;font-size:27px}.meta,section{margin:0}.meta{padding:18px 28px 0}section{padding:20px 28px 0}section h2{margin:0;padding:9px 12px;background:#173c57;color:#fff;border-left:7px solid #f5a623;font-size:16px;text-transform:uppercase}.grid{border:1px solid #d9e1e6;border-top:0}.r{display:grid;grid-template-columns:minmax(150px,34%) 1fr;border-top:1px solid #e1e7eb}.r:first-child{border-top:0}.l{padding:11px 13px;background:#f3f6f8;font-weight:700;color:#385266}.v{padding:11px 13px;white-space:pre-wrap}footer{display:flex;justify-content:space-between;gap:20px;margin-top:26px;padding:16px 28px;background:#0d2b40;color:#dbe7ee;font-size:11px}@media(max-width:600px){body{padding:0}article{box-shadow:none}header{align-items:flex-start}header img{width:170px}.r{grid-template-columns:1fr}.l{padding-bottom:4px}.v{padding-top:4px}footer{display:block}footer span{display:block;margin-top:4px}}`;}
async function share(card){
 const d=reportFromCard(card),t=text(d),name=title(d),doc='<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>'+esc(name)+'</title><style>'+css()+'</style></head><body>'+html(d)+'</body></html>';
 try{
  const file=new File([doc],name.replace(/[^a-z0-9]+/gi,'-')+'.html',{type:'text/html'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:name,text:t,files:[file]});return;}
  if(navigator.share){await navigator.share({title:name,text:t});return;}
 }catch(e){if(e.name==='AbortError')return;}
 location.href='mailto:?subject='+encodeURIComponent(name)+'&body='+encodeURIComponent(t.slice(0,12000));
}
function decorate(){
 document.querySelectorAll('#checkList .compactCheck').forEach(card=>{
  if(card.querySelector('.savedCheckShareBtn'))return;
  const btn=document.createElement('button');btn.type='button';btn.className='savedCheckShareBtn';btn.textContent='SEND REPORT';
  btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();share(card);});
  const top=card.querySelector('.compactTop');(top||card).appendChild(btn);
 });
}
function removePrint(){const b=document.getElementById('printReportBtn');if(b)b.remove();}
function style(){if(document.getElementById('savedCheckShareCss'))return;const s=document.createElement('style');s.id='savedCheckShareCss';s.textContent='.compactTop{position:relative;padding-bottom:46px!important}.savedCheckShareBtn{position:absolute;right:12px;bottom:8px;border:1px solid #f4b23f;border-radius:9px;background:#f3aa35;color:#07131e;font-weight:800;font-size:12px;padding:8px 12px;z-index:3}.savedCheckShareBtn:active{transform:scale(.98)}';document.head.appendChild(s);}
function init(){style();decorate();removePrint();const list=document.getElementById('checkList');if(list)new MutationObserver(()=>requestAnimationFrame(decorate)).observe(list,{childList:true,subtree:true});new MutationObserver(removePrint).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();