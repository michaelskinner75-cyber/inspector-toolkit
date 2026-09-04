(function(){
'use strict';

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function detailLines(card){
 const details=card&&card.querySelector('.compactDetails');
 if(!details)return[];
 const clone=details.cloneNode(true);
 clone.querySelectorAll('button').forEach(b=>b.remove());
 clone.querySelectorAll('br').forEach(br=>br.replaceWith('\n'));
 return clone.textContent.split('\n').map(v=>v.trim()).filter(Boolean);
}
function labelled(lines,labels){
 for(const line of lines){
  const raw=String(line||'').trim();
  const lower=raw.toLowerCase();
  for(const label of labels){
   const prefix=String(label||'').trim().toLowerCase()+':';
   if(lower.startsWith(prefix))return raw.slice(raw.indexOf(':')+1).trim();
  }
 }
 return'';
}
function firstTitle(card){return String(card?.querySelector('.compactDetails b')?.textContent||'').trim();}
function canCreate(card){const title=firstTitle(card);return title==='Inspector Check'||title==='Driver Report';}
function splitNsa(value){
 const raw=String(value||'-').trim();
 if(!raw||raw==='-')return{working:'-',details:'-'};
 return{working:raw,details:'-'};
}
function buildProxy(card){
 const lines=detailLines(card);
 const date=labelled(lines,['Date'])||'-';
 const driver=labelled(lines,['Driver'])||'-';
 const fleet=labelled(lines,['Fleet','Fleet Number'])||'-';
 const service=labelled(lines,['Service'])||'-';
 const depot=labelled(lines,['Depot','Depot/Location'])||'-';
 const boarding=labelled(lines,['Boarding point','Boarding Point','Location','Report location'])||depot||'-';
 const destination=labelled(lines,['Destination'])||'-';
 const inspector=labelled(lines,['Inspector'])||'-';
 const outcome=labelled(lines,['Driver outcome','Driver Report'])||'No Driver Report';
 const nsaWorking=labelled(lines,['NSA Working'])||'-';
 const nsaFault=labelled(lines,['NSA Status/Fault','NSA Status','NSA Fault'])||'-';
 const notes=labelled(lines,['Inspection notes','Driver report reason / inspection notes','Report details','Notes'])||'-';
 const reference=labelled(lines,['Report reference','Offence Reference'])||'';
 const nature=labelled(lines,['Nature of offence','Nature of Offence'])||'';
 const passengers=labelled(lines,['Passengers'])||'';
 const checkedAt=labelled(lines,['Checked at','Time Checked'])||'';
 const dt=date.match(/^(.*?)(?:\s+)(\d{1,2}:\d{2})$/);
 const dateOnly=dt?dt[1]:date;
 const savedTime=dt?dt[2]:'-';
 const timeChecked=checkedAt||savedTime;
 const proxy=document.createElement('div');
 proxy.className='compactCheck reportSearchShareProxy';
 proxy.style.display='none';
 proxy.innerHTML=`<div class="compactTop"></div><div class="compactDetails">${esc(dateOnly)} ${esc(savedTime)}<br>Inspector: ${esc(inspector)}<br>Depot: ${esc(depot)}<br>Driver: ${esc(driver)}<br>Service: ${esc(service)}<br>Fleet Number: ${esc(fleet)}<br>Time Checked: ${esc(timeChecked)}<br>Journey: ${esc(boarding)} to ${esc(destination)}<br>NSA: ${esc(nsaWorking)} - ${esc(nsaFault)}<br>Driver Report: ${esc(outcome)}<br>Driver report reason / inspection notes: ${esc(notes)}${reference?'<br>Offence Reference: '+esc(reference):''}${nature?'<br>Nature of Offence: '+esc(nature):''}${passengers?'<br>Passengers: '+esc(passengers):''}</div>`;
 return proxy;
}
function createReport(card,visibleBtn){
 const checkList=document.getElementById('checkList');
 if(!checkList){alert('The report generator is not ready yet. Please reopen Report Search and try again.');return;}
 const proxy=buildProxy(card);
 checkList.appendChild(proxy);
 visibleBtn.disabled=true;
 visibleBtn.textContent='CREATING REPORT…';
 let attempts=0;
 const timer=setInterval(()=>{
  attempts++;
  const generated=proxy.querySelector('.savedCheckShareBtn');
  if(generated){
   clearInterval(timer);
   generated.click();
   setTimeout(()=>proxy.remove(),1500);
   setTimeout(()=>{visibleBtn.disabled=false;visibleBtn.textContent='SEND REPORT';},900);
   return;
  }
  if(attempts>=20){
   clearInterval(timer);proxy.remove();visibleBtn.disabled=false;visibleBtn.textContent='SEND REPORT';
   alert('The report generator could not be opened. Please refresh the Inspector Hub once and try again.');
  }
 },100);
}
function decorate(){
 const box=document.getElementById('reportResults');if(!box)return;
 box.querySelectorAll('.compactCheck').forEach(card=>{
  if(!canCreate(card)||card.querySelector('.reportSearchShareBtn'))return;
  const top=card.querySelector('.compactTop');if(!top)return;
  const btn=document.createElement('button');
  btn.type='button';btn.className='savedCheckShareBtn reportSearchShareBtn';btn.textContent='SEND REPORT';
  btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();createReport(card,btn);});
  top.appendChild(btn);
 });
}
function start(){
 const box=document.getElementById('reportResults');
 if(!box){setTimeout(start,500);return;}
 decorate();
 new MutationObserver(()=>requestAnimationFrame(decorate)).observe(box,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
