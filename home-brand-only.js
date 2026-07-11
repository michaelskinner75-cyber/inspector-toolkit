(function(){
'use strict';

function updateBrandVisibility(){
  const home=document.getElementById('home');
  const onHome=!!(home&&home.classList.contains('active'));
  const header=document.querySelector('.machine > .brandHeader');
  const credit=document.querySelector('.machine > .credit');
  if(header)header.style.display=onHome?'':'none';
  if(credit)credit.style.display=onHome?'':'none';
}

function init(){
  updateBrandVisibility();
  const machine=document.querySelector('.machine');
  if(machine){
    new MutationObserver(updateBrandVisibility).observe(machine,{subtree:true,attributes:true,attributeFilter:['class']});
  }
  document.addEventListener('click',()=>setTimeout(updateBrandVisibility,0),true);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
