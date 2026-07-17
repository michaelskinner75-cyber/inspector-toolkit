(function(){
'use strict';
const $=id=>document.getElementById(id);
function style(){if($('homeSmallLogoutCss'))return;const s=document.createElement('style');s.id='homeSmallLogoutCss';s.textContent=`#home .loggedInBox{display:none!important}#homeSmallLogout{margin:16px 0 4px;text-align:center}#homeSmallLogout button{width:auto;min-height:0;padding:7px 12px;border-radius:7px;border:1px solid #416783;background:#10283b;color:#fff;font-size:10px;font-weight:800}`;document.head.appendChild(s);}
function setup(){const home=$('home');if(!home)return false;let bar=$('homeSmallLogout');if(!bar){bar=document.createElement('div');bar.id='homeSmallLogout';home.appendChild(bar);}bar.innerHTML='<button type="button" id="homeLogoutBtn">LOG OUT</button>';const btn=$('homeLogoutBtn');if(btn)btn.onclick=()=>{if(typeof changeInspector==='function')changeInspector();else{localStorage.removeItem('activeInspector');if(typeof showLogin==='function')showLogin();}};return true;}
function init(){style();let n=0;const t=setInterval(()=>{n++;if(setup()||n>30)clearInterval(t);},250);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();