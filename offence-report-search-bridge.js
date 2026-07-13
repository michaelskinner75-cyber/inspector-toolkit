(function(){
'use strict';

function normal(v){return String(v||'').trim().toLowerCase().replace(/\s+/g,' ');}
function dateText(v){try{return typeof formatDateValue==='function'?formatDateValue(v):String(v||'');}catch(e){return String(v||'');}}

function extract(card,label){
 const text=card.innerText||'';
 const re=new RegExp(label+'\\s*:\\s*([^\\n]+)','i');
 const m=text.match(re);
 return m?m[1].trim():'';
}

function findDriverReport(card){
 const driver=extract(card,'Driver');
 const fleet=extract(card,'Fleet');
 const service=extract(card,'Service');
 const dateLine=extract(card,'Date');
 const dateOnly=(dateLine.split(/\s+/)[0]||'').trim();
 const all=(window.cloud&&cloud['Driver Reports'])||[];
 if(!all.length)return null;
 const first=(all[0]||[]).map(v=>normal(v));
 const hasHeader=first.some(v=>['date','time','inspector','driver','fleet','service','depot'].includes(v));
 const rows=hasHeader?all.slice(1):all.slice();
 let idx=rows.findIndex(r=>{
  const offence=/offence/i.test(String(r[5]||''))||String(r[9]||'').trim();
  if(!offence)return false;
  const sameDriver=!driver||normal(r[3])===normal(driver);
  const sameFleet=!fleet||normal(r[8])===normal(fleet);
  const sameService=!service||normal(r[7])===normal(service);
  const sameDate=!dateOnly||normal(dateText(r[0]))===normal(dateOnly);
  return sameDriver&&sameFleet&&sameService&&sameDate;
 });
 if(idx<0){
  idx=rows.findIndex(r=>(/offence/i.test(String(r[5]||''))||String(r[9]||'').trim())&&normal(r[3])===normal(driver)&&normal(r[8])===normal(fleet));
 }
 if(idx<0)return null;
 return {rows,index:idx,row:rows[idx],hasHeader};
}

function openGenerator(card){
 const found=findDriverReport(card);
 if(!found){
  alert('The matching offence report data could not be found. Refresh cloud data and try again.');
  return;
 }
 const trigger=document.createElement('button');
 trigger.type='button';
 trigger.className='createOffenceWord';
 trigger.dataset.reportIndex=String(found.index);
 trigger.style.display='none';
 document.body.appendChild(trigger);
 trigger.click();
 trigger.remove();
}

function addButtons(){
 const box=document.getElementById('reportResults');
 if(!box)return;
 box.querySelectorAll('.compactCheck.offence').forEach(card=>{
  const details=card.querySelector('.compactDetails');
  if(!details||details.querySelector('.reportExportActions'))return;
  const actions=document.createElement('div');
  actions.className='reportExportActions';
  actions.style.cssText='margin-top:12px;display:flex;gap:8px;flex-wrap:wrap';
  actions.innerHTML='<button type="button" class="btn openOffenceGenerator">CREATE / EXPORT OFFENCE REPORT</button>';
  details.appendChild(actions);
 });
}

document.addEventListener('click',function(e){
 const btn=e.target.closest('.openOffenceGenerator');
 if(!btn)return;
 e.preventDefault();
 e.stopPropagation();
 openGenerator(btn.closest('.compactCheck'));
});

const observer=new MutationObserver(addButtons);
function start(){
 const box=document.getElementById('reportResults');
 if(box){observer.observe(box,{childList:true,subtree:true});addButtons();}
 else setTimeout(start,500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();