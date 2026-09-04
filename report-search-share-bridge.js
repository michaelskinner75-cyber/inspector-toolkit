(function(){
'use strict';

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function norm(v){return String(v||'').trim().toLowerCase().replace(/\s+/g,' ');}
function fmtDate(v){try{return typeof formatDateValue==='function'?formatDateValue(v):String(v||'');}catch(e){return String(v||'');}}
function fmtTime(v){try{return typeof formatTimeValue==='function'?formatTimeValue(v):String(v||'');}catch(e){return String(v||'');}}
function detailLines(card){
 const details=card&&card.querySelector('.compactDetails');if(!details)return[];
 const clone=details.cloneNode(true);clone.querySelectorAll('button').forEach(b=>b.remove());
 clone.querySelectorAll('br').forEach(br=>br.replaceWith('\n'));
 return clone.textContent.split('\n').map(v=>v.trim()).filter(Boolean);
}
function labelled(lines,labels){
 for(const line of lines){const raw=String(line||'').trim(),lower=raw.toLowerCase();for(const label of labels){const prefix=String(label||'').trim().toLowerCase()+':';if(lower.startsWith(prefix))return raw.slice(raw.indexOf(':')+1).trim();}}
 return'';
}
function firstTitle(card){return String(card?.querySelector('.compactDetails b')?.textContent||'').trim();}
function canCreate(card){const title=firstTitle(card);return title==='Inspector Check'||title==='Driver Report';}
function dataRows(sheet){
 const rows=(window.cloud&&cloud[sheet])||[];if(!rows.length)return[];
 const first=(rows[0]||[]).map(v=>norm(v));const header=first.some(v=>['date','time','inspector','driver','fleet','service','depot','location'].includes(v));
 return header?rows.slice(1):rows.slice();
}
function visibleKeys(card){
 const lines=detailLines(card),dateTime=labelled(lines,['Date'])||'';
 const m=dateTime.match(/^(.*?)(?:\s+)(\d{1,2}:\d{2})$/);
 return{lines,date:m?m[1]:dateTime,time:m?m[2]:'',driver:labelled(lines,['Driver']),fleet:labelled(lines,['Fleet','Fleet Number']),service:labelled(lines,['Service']),inspector:labelled(lines,['Inspector'])};
}
function findInspection(card){
 const k=visibleKeys(card);return dataRows('Inspections').find(r=>norm(fmtDate(r[0]))===norm(k.date)&&norm(r[4])===norm(k.driver)&&norm(r[6])===norm(k.fleet)&&norm(r[5])===norm(k.service)&&(!k.inspector||norm(r[2])===norm(k.inspector)))||null;
}
function findDriverReport(card){
 const k=visibleKeys(card);const ref=labelled(k.lines,['Report reference','Offence Reference']);
 const rows=dataRows('Driver Reports');
 if(ref){const byRef=rows.find(r=>norm(r[9])===norm(ref));if(byRef)return byRef;}
 return rows.find(r=>norm(fmtDate(r[0]))===norm(k.date)&&norm(r[3])===norm(k.driver)&&norm(r[8])===norm(k.fleet)&&norm(r[7])===norm(k.service)&&(!k.inspector||norm(r[2])===norm(k.inspector)))||null;
}
function proxyHtml(d){
 return `<div class="compactTop"></div><div class="compactDetails">${esc(d.date)} ${esc(d.savedTime)}<br>Inspector: ${esc(d.inspector)}<br>Depot: ${esc(d.depot)}<br>Driver: ${esc(d.driver)}<br>Service: ${esc(d.service)}<br>Fleet Number: ${esc(d.fleet)}<br>Time Checked: ${esc(d.timeChecked)}<br>Journey: ${esc(d.boarding)} to ${esc(d.destination)}<br>NSA: ${esc(d.nsa)} - ${esc(d.nsaDetails)}<br>Driver Report: ${esc(d.driverReport)}<br>Driver report reason / inspection notes: ${esc(d.reason)}${d.offenceRef?'<br>Offence Reference: '+esc(d.offenceRef):''}${d.nature?'<br>Nature of Offence: '+esc(d.nature):''}${d.passengers?'<br>Passengers: '+esc(d.passengers):''}</div>`;
}
function fromInspection(r){return{date:fmtDate(r[0]),savedTime:fmtTime(r[1]),inspector:r[2]||'-',depot:r[3]||'-',driver:r[4]||'-',service:r[5]||'-',fleet:r[6]||'-',timeChecked:fmtTime(r[7]),boarding:r[8]||'-',destination:r[9]||'-',nsa:r[10]||'-',nsaDetails:[r[11],r[12]].map(v=>String(v||'').trim()).filter(Boolean).join(' - ')||((String(r[10]||'')==='Yes')?'Fully Working':'-'),driverReport:r[13]||'No Driver Report',reason:r[14]||'-',offenceRef:r[15]||'',nature:r[16]||'',passengers:r[17]||''};}
function fromDriverReport(r){return{date:fmtDate(r[0]),savedTime:fmtTime(r[1]),inspector:r[2]||'-',depot:r[4]||'-',driver:r[3]||'-',service:r[7]||'-',fleet:r[8]||'-',timeChecked:r[10]||fmtTime(r[1]),boarding:r[14]||r[4]||'-',destination:'-',nsa:'-',nsaDetails:'-',driverReport:r[5]||'Driver Report',reason:r[6]||'-',offenceRef:r[9]||'',nature:r[12]||'',passengers:r[13]||''};}
function fromVisible(card){
 const k=visibleKeys(card),lines=k.lines;
 const nsa=labelled(lines,['NSA Working'])||'-',fault=labelled(lines,['NSA Status/Fault','NSA Status','NSA Fault'])||'-';
 return{date:k.date||'-',savedTime:k.time||'-',inspector:k.inspector||'-',depot:labelled(lines,['Depot','Depot/Location'])||'-',driver:k.driver||'-',service:k.service||'-',fleet:k.fleet||'-',timeChecked:labelled(lines,['Checked at','Time Checked'])||k.time||'-',boarding:labelled(lines,['Boarding point','Boarding Point','Location','Report location'])||labelled(lines,['Depot/Location'])||'-',destination:labelled(lines,['Destination'])||'-',nsa,nsaDetails:fault,driverReport:labelled(lines,['Driver outcome','Driver Report'])||'No Driver Report',reason:labelled(lines,['Report details','Inspection notes','Driver report reason / inspection notes','Notes'])||'-',offenceRef:labelled(lines,['Report reference','Offence Reference'])||'',nature:labelled(lines,['Nature of offence','Nature of Offence'])||'',passengers:labelled(lines,['Passengers'])||''};
}
function buildProxy(card){
 const title=firstTitle(card);let d=null;
 if(title==='Inspector Check'){const row=findInspection(card);if(row)d=fromInspection(row);}
 else if(title==='Driver Report'){const row=findDriverReport(card);if(row)d=fromDriverReport(row);}
 if(!d)d=fromVisible(card);
 const proxy=document.createElement('div');proxy.className='compactCheck reportSearchShareProxy';proxy.style.display='none';proxy.innerHTML=proxyHtml(d);return proxy;
}
function createReport(card,visibleBtn){
 const checkList=document.getElementById('checkList');if(!checkList){alert('The report generator is not ready yet. Please reopen Report Search and try again.');return;}
 const proxy=buildProxy(card);checkList.appendChild(proxy);visibleBtn.disabled=true;visibleBtn.textContent='CREATING REPORT…';let attempts=0;
 const timer=setInterval(()=>{attempts++;const generated=proxy.querySelector('.savedCheckShareBtn');if(generated){clearInterval(timer);generated.click();setTimeout(()=>proxy.remove(),1500);setTimeout(()=>{visibleBtn.disabled=false;visibleBtn.textContent='SEND REPORT';},900);return;}if(attempts>=20){clearInterval(timer);proxy.remove();visibleBtn.disabled=false;visibleBtn.textContent='SEND REPORT';alert('The report generator could not be opened. Please refresh the Inspector Hub once and try again.');}},100);
}
function decorate(){
 const box=document.getElementById('reportResults');if(!box)return;
 box.querySelectorAll('.compactCheck').forEach(card=>{if(!canCreate(card)||card.querySelector('.reportSearchShareBtn'))return;const top=card.querySelector('.compactTop');if(!top)return;const btn=document.createElement('button');btn.type='button';btn.className='savedCheckShareBtn reportSearchShareBtn';btn.textContent='SEND REPORT';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();createReport(card,btn);});top.appendChild(btn);});
}
function start(){const box=document.getElementById('reportResults');if(!box){setTimeout(start,500);return;}decorate();new MutationObserver(()=>requestAnimationFrame(decorate)).observe(box,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
