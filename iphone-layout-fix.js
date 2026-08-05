(function(){
'use strict';
function isPhoneViewport(){return Math.min(window.innerWidth||9999,document.documentElement.clientWidth||9999)<=600;}
function apply(){
 if(!isPhoneViewport())return;
 document.body.classList.remove('display-plus','display-ipad','display-laptop','display-large');
 document.body.classList.add('display-phone');
 document.documentElement.dataset.displaySize='phone';
 try{localStorage.setItem('inspectorDisplaySize','phone');}catch(e){}
 document.querySelectorAll('[data-display-size]').forEach(b=>{
  const on=b.dataset.displaySize==='phone';
  b.classList.toggle('selected',on);
  b.setAttribute('aria-pressed',String(on));
 });
}
function init(){apply();setTimeout(apply,300);setTimeout(apply,1200);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.addEventListener('resize',apply);
})();