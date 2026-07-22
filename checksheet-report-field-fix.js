(function(){
'use strict';
function clean(text){return String(text||'').replace(/\s+/g,' ').replace(/[:*]+$/,'').trim();}
function sectionName(el){const section=el.closest('.formSection,.panel');const title=section&&section.querySelector('.formSectionTitle,h3,.panelTitle');return clean(title&&title.textContent);}
function currentLabel(el){const linked=el.id&&document.querySelector('label[for="'+CSS.escape(el.id)+'"]');if(linked)return clean(linked.textContent);const parent=el.closest('label');if(parent)return clean(parent.childNodes[0]&&parent.childNodes[0].textContent||parent.textContent);const block=el.closest('.fieldBlock,.formField,.fieldGroup');const blockLabel=block&&block.querySelector('label,.fieldLabel,.fieldTitle');if(blockLabel)return clean(blockLabel.textContent);const previous=el.previousElementSibling;if(previous&&/^(LABEL|H3|H4)$/.test(previous.tagName))return clean(previous.textContent);return clean(el.placeholder||'');}
function addTemporaryLabel(el,text,restore){let addedId=false;if(!el.id){el.id='reportFieldFix'+Math.random().toString(36).slice(2);addedId=true;}const label=document.createElement('label');label.htmlFor=el.id;label.textContent=text;label.hidden=true;el.parentNode.insertBefore(label,el);restore.push(()=>{label.remove();if(addedId)el.removeAttribute('id');});}
function prepareReportFields(){
 const sheet=document.getElementById('checksheet');if(!sheet)return;
 const controls=[...sheet.querySelectorAll('input,select,textarea')];
 const restore=[];
 const journey=controls.filter(el=>sectionName(el).toLowerCase()==='journey details');
 const generic=journey.filter(el=>currentLabel(el).toLowerCase()==='field');
 if(generic.length>1){const first=generic[0];const oldDisplay=first.style.display;first.style.display='none';restore.push(()=>{first.style.display=oldDisplay;});addTemporaryLabel(generic[1],'Service',restore);}
 else if(generic.length===1){addTemporaryLabel(generic[0],'Service',restore);}
 journey.forEach(el=>{if(currentLabel(el).toLowerCase()==='destination choice')addTemporaryLabel(el,'Destination',restore);});
 const nsa=controls.filter(el=>sectionName(el).toLowerCase()==='nsa');
 nsa.forEach(el=>{const label=currentLabel(el).toLowerCase();if(label==='nsa working yesnon/a'||label==='nsa working yes/no/n/a'||(label.includes('nsa working')&&label!=='nsa working'))addTemporaryLabel(el,'Details',restore);});
 setTimeout(()=>restore.reverse().forEach(fn=>fn()),0);
}
document.addEventListener('click',event=>{const button=event.target.closest('#previewCheckReportBtn,#shareCheckReportBtn');if(button)prepareReportFields();},true);
})();