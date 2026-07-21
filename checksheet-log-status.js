(function(){
'use strict';
const byId=id=>document.getElementById(id);
let observer=null;
let scheduled=false;
function addCss(){
 if(byId('checkLogStatusCss'))return;
 const s=document.createElement('style');
 s.id='checkLogStatusCss';
 s.textContent='#checkList .compactCheck{position:relative;border-left:34px solid #35a86b;border-radius:12px;overflow:hidden;margin:9px 0}#checkList .compactCheck.logAdvised{border-left-color:#e6b53f}#checkList .compactCheck.logOffence{border-left-color:#d84a53}#checkList .compactCheck.logClear{border-left-color:#35a86b}#checkList .checkOutcomeLabel{position:absolute;left:-34px;top:0;bottom:0;width:34px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:7px;font-weight:900;letter-spacing:.05em;writing-mode:vertical-rl;transform:rotate(180deg);text-transform:uppercase;pointer-events:none;text-shadow:0 1px 1px rgba(0,0,0,.35)}#checkList .compactTop{position:relative;padding-right:130px;min-height:62px}#checkList .checkStatusStack{position:absolute;right:9px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:stretch;gap:5px;width:112px;pointer-events:none}#checkList .nsaBadge,#checkList .vehicleNotesBadge{display:block;padding:6px 7px;border-radius:9px;text-align:center;font-size:9px;font-weight:900;line-height:1.15}#checkList .nsaGood{background:#1f8a55;color:#fff}#checkList .nsaBad{background:#b93440;color:#fff}#checkList .nsaNA{background:#2878b8;color:#fff}#checkList .vehicleNotesBadge{background:#d97706;color:#fff}#checkList .vehicleDetailBlock{margin-top:9px;padding:9px 10px;border-left:5px solid #d97706;border-radius:8px;background:rgba(217,119,6,.12);line-height:1.45}#checkList .vehicleDetailBlock b{color:#f4b45f}@media(max-width:520px){#checkList .compactCheck{border-left-width:30px}#checkList .checkOutcomeLabel{left:-30px;width:30px;font-size:6px}#checkList .compactTop{padding-right:112px}#checkList .checkStatusStack{width:96px;right:6px}#checkList .nsaBadge,#checkList .vehicleNotesBadge{font-size:8px;padding:5px}}';
 document.head.appendChild(s);
}
function extractVehicle(raw){
 const issue=(raw.match(/vehicle issue:\s*([^\n]+)/i)||[])[1]||'';
 const comments=(raw.match(/vehicle comments:\s*([^\n]+)/i)||[])[1]||'';
 return{issue:issue.trim(),comments:comments.trim()};
}
function nsaState(text){
 const nsaLine=(text.match(/nsa(?:\s+status)?\s*:\s*([^\n]+)/i)||[])[1]||'';
 const value=nsaLine.trim().toLowerCase();
 if(/^(?:n\s*[\/.]?\s*a|na|not\s+applicable|not\s+required)\b/i.test(value))return'na';
 if(/^(?:no|not\s+working|failed|faulty)\b/i.test(value))return'bad';
 if(/^(?:yes|working|fully\s+working)\b/i.test(value))return'good';
 if(/nsa[^\n]*(?:n\s*[\/.]?\s*a|not\s+applicable|not\s+required)/i.test(text))return'na';
 return'good';
}
function decorate(){
 const list=byId('checkList');
 if(!list)return;
 if(observer)observer.disconnect();
 list.querySelectorAll('.compactCheck').forEach(card=>{
  const details=card.querySelector('.compactDetails');
  const raw=(details&&details.textContent)||card.textContent||'';
  const text=raw.toLowerCase();
  card.classList.remove('logClear','logAdvised','logOffence');
  let outcome='NO DRIVER ISSUE FOUND';
  if(/offence report submitted|offence report to be submitted|driver report:\s*offence/i.test(text)){card.classList.add('logOffence');outcome='OFFENCE';}
  else if(/driver advised|driver report:\s*advised/i.test(text)){card.classList.add('logAdvised');outcome='ADVISED';}
  else card.classList.add('logClear');
  let outcomeLabel=card.querySelector('.checkOutcomeLabel');
  if(!outcomeLabel){outcomeLabel=document.createElement('span');outcomeLabel.className='checkOutcomeLabel';card.appendChild(outcomeLabel);}
  outcomeLabel.textContent=outcome;
  const top=card.querySelector('.compactTop');
  if(!top)return;
  let stack=top.querySelector('.checkStatusStack');
  if(!stack){stack=document.createElement('span');stack.className='checkStatusStack';top.appendChild(stack);}
  let badge=stack.querySelector('.nsaBadge');
  if(!badge){badge=document.createElement('span');badge.className='nsaBadge';stack.appendChild(badge);}
  const state=nsaState(raw);
  if(state==='na'){badge.className='nsaBadge nsaNA';badge.textContent='NSA N/A';}
  else if(state==='bad'){badge.className='nsaBadge nsaBad';badge.textContent='NSA NOT WORKING';}
  else{badge.className='nsaBadge nsaGood';badge.textContent='NSA WORKING';}
  const vehicleData=extractVehicle(raw);
  const hasVehicleNotes=Boolean(vehicleData.issue||vehicleData.comments);
  let vehicle=stack.querySelector('.vehicleNotesBadge');
  if(hasVehicleNotes){
   if(!vehicle){vehicle=document.createElement('span');vehicle.className='vehicleNotesBadge';stack.appendChild(vehicle);}
   vehicle.textContent='VEHICLE NOTES';
  }else if(vehicle)vehicle.remove();
  if(details){
   let block=details.querySelector('.vehicleDetailBlock');
   if(hasVehicleNotes){
    if(!block){block=document.createElement('div');block.className='vehicleDetailBlock';details.appendChild(block);}
    block.innerHTML=(vehicleData.issue?'<b>Vehicle Issue:</b> '+vehicleData.issue:'')+(vehicleData.issue&&vehicleData.comments?'<br>':'')+(vehicleData.comments?'<b>Vehicle Comments:</b> '+vehicleData.comments:'');
   }else if(block)block.remove();
  }
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