(function(){
'use strict';
function addStyle(){
 if(document.getElementById('cardExpandButtonCss'))return;
 const s=document.createElement('style');
 s.id='cardExpandButtonCss';
 s.textContent=`
 .compactTop{position:relative!important;padding-right:112px!important}
 .cardExpandBtn{position:absolute;right:10px;top:50%;transform:translateY(-50%);min-width:92px;padding:9px 11px;border:1px solid rgba(255,255,255,.38);border-radius:8px;background:#245f91;color:#fff;font-weight:900;font-size:12px;line-height:1;z-index:2;cursor:pointer}
 .cardExpandBtn[aria-expanded="true"]{background:#d97900}
 body.display-phone .compactTop{padding-right:96px!important}
 body.display-phone .cardExpandBtn{right:7px;min-width:82px;padding:9px 8px;font-size:11px}
 body.display-plus .cardExpandBtn{min-width:88px}
 body.display-ipad .cardExpandBtn{min-width:104px;padding:11px 14px;font-size:13px}
 body.display-laptop .cardExpandBtn{min-width:112px;padding:11px 16px;font-size:13px}
 `;
 document.head.appendChild(s);
}
function isOpen(details){
 return details.style.display==='block'||details.classList.contains('open')||getComputedStyle(details).display!=='none';
}
function syncButton(btn,details){
 const open=isOpen(details);
 btn.textContent=open?'COLLAPSE':'EXPAND';
 btn.setAttribute('aria-expanded',open?'true':'false');
}
function decorate(root){
 (root||document).querySelectorAll('.compactCheck').forEach(card=>{
  const top=card.querySelector('.compactTop[data-toggle]');
  if(!top)return;
  const id=top.dataset.toggle;
  const details=document.getElementById(id);
  if(!details)return;
  let btn=top.querySelector('.cardExpandBtn');
  if(!btn){
   btn=document.createElement('button');
   btn.type='button';
   btn.className='cardExpandBtn';
   btn.dataset.expandTarget=id;
   top.appendChild(btn);
  }
  syncButton(btn,details);
 });
}
function toggle(btn){
 const details=document.getElementById(btn.dataset.expandTarget||'');
 if(!details)return;
 const open=isOpen(details);
 details.style.display=open?'none':'block';
 details.classList.toggle('open',!open);
 syncButton(btn,details);
}
function watch(id){
 const el=document.getElementById(id);
 if(!el)return;
 new MutationObserver(()=>decorate(el)).observe(el,{childList:true,subtree:true});
 decorate(el);
}
function init(){
 addStyle();
 watch('checkList');
 watch('reportResults');
 document.addEventListener('click',e=>{
  const btn=e.target.closest('.cardExpandBtn');
  if(!btn)return;
  e.preventDefault();
  e.stopPropagation();
  toggle(btn);
 });
 setTimeout(()=>decorate(document),500);
 setTimeout(()=>decorate(document),1800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();