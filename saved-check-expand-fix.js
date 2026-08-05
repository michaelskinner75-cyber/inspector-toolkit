(function(){
'use strict';
function detailsFor(top){
 const id=top&&top.dataset&&top.dataset.toggle;
 if(id){const byId=document.getElementById(id);if(byId)return byId;}
 return top&&top.parentElement?top.parentElement.querySelector('.compactDetails'):null;
}
function toggle(top){
 const details=detailsFor(top);if(!details)return;
 const opening=!details.classList.contains('show');
 document.querySelectorAll('#checkList .compactDetails.show').forEach(el=>{if(el!==details)el.classList.remove('show');});
 details.classList.toggle('show',opening);
 top.closest('.compactCheck')?.classList.toggle('expanded',opening);
}
function onClick(e){
 if(e.target.closest('.savedCheckShareBtn,.vehicleNotesBtn,button,a,input,select,textarea'))return;
 const top=e.target.closest('#checkList .compactTop');
 if(!top)return;
 e.preventDefault();
 e.stopImmediatePropagation();
 toggle(top);
}
function style(){
 if(document.getElementById('savedCheckExpandFixCss'))return;
 const s=document.createElement('style');s.id='savedCheckExpandFixCss';
 s.textContent='#checkList .compactTop{cursor:pointer}#checkList .compactDetails.show{display:block!important}#checkList .compactCheck.expanded .compactTop{border-bottom-left-radius:0;border-bottom-right-radius:0}';
 document.head.appendChild(s);
}
function init(){style();document.addEventListener('click',onClick,true);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();