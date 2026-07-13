(function(){
'use strict';

function normal(v){return String(v||'').trim().toLowerCase().replace(/\s+/g,' ');}
function dateText(v){try{return typeof formatDateValue==='function'?formatDateValue(v):String(v||'');}catch(e){return String(v||'');}}
function setValue(id,value){const el=document.getElementById(id);if(el)el.value=value||'';}

function extract(card,label){
 const text=card.innerText||'';
 const re=new RegExp(label+'\\s*:\\s*([^\\n]+)','i');
 const m=text.match(re);
 return m?m[1].trim():'';
}

function driverReportRows(){
 const all=(window.cloud&&cloud['Driver Reports'])||[];
 if(!all.length)return[];
 const first=(all[0]||[]).map(v=>normal(v));
 const hasHeader=first.some(v=>['date','time','inspector','driver','fleet','service','depot'].includes(v));
 return hasHeader?all.slice(1):all.slice();
}

function findDriverReport(card){
 const driver=extract(card,'Driver');
 const fleet=extract(card,'Fleet');
 const service=extract(card,'Service');
 const dateLine=extract(card,'Date');
 const dateOnly=(dateLine.split(/\s+/)[0]||'').trim();
 const rows=driverReportRows();
 if(!rows.length)return null;
 let index=rows.findIndex(r=>{
  const offence=/offence/i.test(String(r[5]||''))||String(r[9]||'').trim();
  if(!offence)return false;
  const sameDriver=!driver||normal(r[3])===normal(driver);
  const sameFleet=!fleet||normal(r[8])===normal(fleet);
  const sameService=!service||normal(r[7])===normal(service);
  const sameDate=!dateOnly||normal(dateText(r[0]))===normal(dateOnly);
  return sameDriver&&sameFleet&&sameService&&sameDate;
 });
 if(index<0)index=rows.findIndex(r=>(/offence/i.test(String(r[5]||''))||String(r[9]||'').trim())&&normal(r[3])===normal(driver)&&normal(r[8])===normal(fleet));
 return index<0?null:{rows,row:rows[index],index};
}

function initialiseGenerator(found){
 const trigger=document.createElement('button');
 trigger.type='button';
 trigger.className='createOffenceWord';
 trigger.dataset.reportIndex=String(found.index);
 trigger.style.display='none';
 document.body.appendChild(trigger);
 trigger.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
 trigger.remove();
}

function fillAndOpen(r){
 const modal=document.getElementById('offenceReportModal');
 if(!modal)return false;
 setValue('orReference',r[9]);
 setValue('orNature',r[12]||r[5]||'Driver Offence');
 setValue('orDate',dateText(r[0]));
 setValue('orEmployee',r[3]);
 setValue('orDepot',r[4]);
 setValue('orRoute',r[7]);
 setValue('orBus',r[8]);
 setValue('orCheckedAt',r[10]);
 setValue('orTime',typeof formatTimeValue==='function'?formatTimeValue(r[1]):r[1]);
 setValue('orPassengers',r[13]);
 setValue('orInspector',r[2]);
 setValue('orLocation',r[14]||r[4]);
 setValue('orDetails',r[6]);
 const status=document.getElementById('offenceBuildStatus');if(status)status.textContent='Ready.';
 modal.style.display='block';
 return true;
}

function openGenerator(card){
 const found=findDriverReport(card);
 if(!found){alert('The matching offence report data could not be found. Refresh cloud data and try again.');return;}
 if(fillAndOpen(found.row))return;
 initialiseGenerator(found);
 setTimeout(()=>{
  if(!fillAndOpen(found.row))alert('The offence report generator could not be opened. Please refresh the page once and try again.');
 },100);
}

function addButtons(){
 const box=document.getElementById('reportResults');if(!box)return;
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
 const btn=e.target.closest('.openOffenceGenerator');if(!btn)return;
 e.preventDefault();e.stopPropagation();
 openGenerator(btn.closest('.compactCheck'));
});

const observer=new MutationObserver(addButtons);
function start(){const box=document.getElementById('reportResults');if(box){observer.observe(box,{childList:true,subtree:true});addButtons();}else setTimeout(start,500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();