(function(){
'use strict';

function moveDriverBeforeDepot(){
  const driver=document.getElementById('csDriver');
  const depot=document.getElementById('csDepot');
  if(!driver||!depot)return false;

  const driverBlock=driver.closest('.fieldBlock')||driver.parentElement;
  const depotBlock=depot.closest('.fieldBlock')||depot.parentElement;
  if(!driverBlock||!depotBlock||driverBlock===depotBlock)return false;

  const parent=depotBlock.parentElement;
  if(parent&&driverBlock.parentElement===parent&&driverBlock.nextElementSibling!==depotBlock){
    parent.insertBefore(driverBlock,depotBlock);
  }
  return true;
}

function keepOpenAfterUserAction(){
  const btn=document.getElementById('toggleCheckEntryBtn');
  if(!btn||btn.dataset.stabilityReady==='1')return;
  btn.dataset.stabilityReady='1';
  btn.addEventListener('click',()=>{
    btn.dataset.userToggled='1';
  },true);
}

function apply(){
  moveDriverBeforeDepot();
  keepOpenAfterUserAction();
}

function init(){
  apply();
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    apply();
    if(attempts>=20)clearInterval(timer);
  },250);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1800));
else setTimeout(init,1800);
})();