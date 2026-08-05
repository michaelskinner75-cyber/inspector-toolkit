(function(){
'use strict';
function detailsFor(card){
 if(!card)return null;
 const top=card.querySelector('.compactTop');
 const id=top&&top.dataset&&top.dataset.toggle;
 if(id){const byId=document.getElementById(id);if(byId)return byId;}
 return card.querySelector('.compactDetails');
}
function setButton(btn,open){
 if(!btn)return;
 btn.textContent=open?'HIDE FULL DETAILS':'OPEN FULL DETAILS';
 btn.setAttribute('aria-expanded',String(open));
}
function toggle(card,btn){
 const details=detailsFor(card);if(!details)return;
 const opening=!details.classList.contains('show');
 document.querySelectorAll('#checkList .compactCheck').forEach(other=>{
  if(other===card)return;
  const otherDetails=detailsFor(other);
  if(otherDetails)otherDetails.classList.remove('show');
  other.classList.remove('expanded');
  setButton(other.querySelector('.openFullDetailsBtn'),false);
 });
 details.classList.toggle('show',opening);
 card.classList.toggle('expanded',opening);
 setButton(btn,opening);
 if(opening)setTimeout(()=>details.scrollIntoView({behavior:'smooth',block:'nearest'}),60);
}
function decorate(){
 document.querySelectorAll('#checkList .compactCheck').forEach(card=>{
  if(card.querySelector('.openFullDetailsBtn'))return;
  const top=card.querySelector('.compactTop');if(!top)return;
  const btn=document.createElement('button');
  btn.type='button';
  btn.className='openFullDetailsBtn';
  btn.textContent='OPEN FULL DETAILS';
  btn.setAttribute('aria-expanded','false');
  btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggle(card,btn);});
  top.appendChild(btn);
 });
}
function style(){
 if(document.getElementById('savedCheckExpandFixCss'))return;
 const s=document.createElement('style');s.id='savedCheckExpandFixCss';
 s.textContent=`
 #checkList .compactTop{position:relative;padding-bottom:54px!important}
 #checkList .compactDetails.show{display:block!important}
 #checkList .compactCheck.expanded .compactTop{border-bottom-left-radius:0;border-bottom-right-radius:0}
 #checkList .openFullDetailsBtn{position:absolute;left:12px;bottom:9px;z-index:5;border:1px solid #6fa9dc;border-radius:9px;background:#3778b9;color:#fff;font-weight:900;font-size:11px;line-height:1;padding:10px 12px;min-height:34px}
 #checkList .openFullDetailsBtn:active{transform:scale(.98)}
 #checkList .compactCheck.expanded .openFullDetailsBtn{background:#173a59}
 @media(max-width:520px){#checkList .openFullDetailsBtn{left:8px;bottom:8px;font-size:10px;padding:9px 10px}.savedCheckShareBtn{right:8px!important}}
 `;
 document.head.appendChild(s);
}
function init(){
 style();decorate();
 const list=document.getElementById('checkList');
 if(list)new MutationObserver(()=>requestAnimationFrame(decorate)).observe(list,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();