(function(){
'use strict';
const $=id=>document.getElementById(id);
function fieldBlock(el,labelText){
 if(!el)return null;
 const current=el.closest('.fieldBlock');
 if(current){const label=current.querySelector('label');if(label)label.textContent=labelText;return current;}
 const block=document.createElement('div');block.className='fieldBlock full';
 const label=document.createElement('label');label.textContent=labelText;label.htmlFor=el.id;
 el.parentNode.insertBefore(block,el);block.append(label,el);return block;
}
function splitLayout(){
 const nsa=$('csNSA'),issue=$('csVehicleIssue'),issueNotes=$('csVehicleIssueNotes');
 if(!nsa||!issue||!issueNotes)return false;
 const nsaSection=nsa.closest('.formSection');
 if(!nsaSection)return false;
 const nsaTitle=nsaSection.querySelector('.formSectionTitle');
 if(nsaTitle)nsaTitle.textContent='NSA';
 let vehicleSection=$('vehicleIssueSection');
 if(!vehicleSection){
  vehicleSection=document.createElement('div');vehicleSection.id='vehicleIssueSection';vehicleSection.className='formSection';
  vehicleSection.innerHTML='<div class="formSectionTitle vehicleIssue">Vehicle Issue</div><div class="sectionGrid" id="vehicleIssueGrid"></div>';
  nsaSection.insertAdjacentElement('afterend',vehicleSection);
 }
 const grid=$('vehicleIssueGrid');
 const issueBlock=fieldBlock(issue,'Vehicle Issue');
 const notesBlock=fieldBlock(issueNotes,'Vehicle Comments');
 issueNotes.placeholder='Enter vehicle issue comments';
 if(issueBlock&&issueBlock.parentElement!==grid)grid.appendChild(issueBlock);
 if(notesBlock&&notesBlock.parentElement!==grid)grid.appendChild(notesBlock);
 return true;
}
function installSave(){
 if(typeof window.saveCheckSheet!=='function'||window.saveCheckSheet.__vehicleSplitWrapped)return;
 const original=window.saveCheckSheet;
 const wrapped=function(){
  const issue=$('csVehicleIssue'),comments=$('csVehicleIssueNotes'),driverNotes=$('csDriverReason');
  const issueValue=String(issue?.value||'No Vehicle Issues').trim();
  const commentValue=String(comments?.value||'').trim();
  const originalDriver=String(driverNotes?.value||'');
  const vehicleLines=[];
  if(issueValue&&issueValue!=='No Vehicle Issues')vehicleLines.push('Vehicle issue: '+issueValue);
  if(commentValue)vehicleLines.push('Vehicle comments: '+commentValue);
  if(driverNotes&&vehicleLines.length)driverNotes.value=[...vehicleLines,originalDriver].filter(Boolean).join('\n');
  if(issue)issue.value='No Vehicle Issues';
  if(comments)comments.value='';
  return original.apply(this,arguments);
 };
 wrapped.__vehicleSplitWrapped=true;
 window.saveCheckSheet=wrapped;
}
function style(){
 if($('vehicleIssueSplitCss'))return;
 const s=document.createElement('style');s.id='vehicleIssueSplitCss';
 s.textContent='#checksheet .formSectionTitle.vehicleIssue{border-left-color:#d97706}';
 document.head.appendChild(s);
}
function init(){
 style();let tries=0;const timer=setInterval(()=>{tries++;const ready=splitLayout();installSave();if(ready&&tries>4)clearInterval(timer);if(tries>40)clearInterval(timer);},250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1400));else setTimeout(init,1400);
})();