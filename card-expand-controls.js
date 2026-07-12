(function(){
'use strict';

const selectors=[
 {root:'#checkList',card:'.compactCheck',details:'.compactDetails'},
 {root:'#nsaList',card:'.nsaCompactRow',details:'.nsaCompactDetails'},
 {root:'#timingList',card:'.timingCompactRow',details:'.timingCompactDetails'},
 {root:'#reportResults',card:'.compactCheck',details:'.compactDetails'}
];

function addStyles(){
 if(document.getElementById('cardExpandControlsCss'))return;
 const style=document.createElement('style');
 style.id='cardExpandControlsCss';
 style.textContent=`
 .cardExpandBtn{
   display:block!important;width:calc(100% - 28px)!important;box-sizing:border-box!important;
   margin:0 14px 12px!important;padding:10px 12px!important;border-radius:9px!important;
   border:1px solid #4d83c4!important;background:#173a59!important;color:#fff!important;
   font:inherit!important;font-size:13px!important;font-weight:900!important;letter-spacing:.02em!important;
   text-align:center!important;cursor:pointer!important;touch-action:manipulation!important;
 }
 .cardExpandBtn[aria-expanded="true"]{background:#294456!important;border-color:#6f91aa!important}
 #nsaList .cardExpandBtn,#timingList .cardExpandBtn{margin-left:22px!important;width:calc(100% - 36px)!important}
 .compactDetails.cardDetailsOpen,.nsaCompactDetails.cardDetailsOpen,.timingCompactDetails.cardDetailsOpen{display:block!important}
 `;
 document.head.appendChild(style);
}

function isOpen(details){
 return details.classList.contains('show')||details.classList.contains('cardDetailsOpen');
}

function setOpen(card,details,button,open){
 details.classList.toggle('show',open);
 details.classList.toggle('cardDetailsOpen',open);
 button.setAttribute('aria-expanded',String(open));
 button.textContent=open?'CLOSE DETAILS':'OPEN DETAILS';
 card.dataset.cardDetailsOpen=open?'1':'0';
}

function enhanceCard(card,detailsSelector){
 const details=card.querySelector(detailsSelector);
 if(!details)return;
 let button=card.querySelector(':scope > .cardExpandBtn');
 if(!button){
   button=document.createElement('button');
   button.type='button';
   button.className='cardExpandBtn';
   details.insertAdjacentElement('beforebegin',button);
   button.addEventListener('click',event=>{
     event.preventDefault();
     event.stopPropagation();
     setOpen(card,details,button,!isOpen(details));
   });
 }
 setOpen(card,details,button,isOpen(details)||card.dataset.cardDetailsOpen==='1');
}

function enhanceRoot(config){
 const root=document.querySelector(config.root);
 if(!root)return;
 root.querySelectorAll(config.card).forEach(card=>enhanceCard(card,config.details));
 if(root.dataset.expandObserverReady==='1')return;
 root.dataset.expandObserverReady='1';
 new MutationObserver(()=>{
   root.querySelectorAll(config.card).forEach(card=>enhanceCard(card,config.details));
 }).observe(root,{childList:true,subtree:true});
}

function init(){
 addStyles();
 selectors.forEach(enhanceRoot);
 setInterval(()=>selectors.forEach(enhanceRoot),1500);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1800));
else setTimeout(init,1800);
})();