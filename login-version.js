(function(){
'use strict';
const VERSION='13.07.26.120';
function addVersion(){
 const card=document.querySelector('#loginPage .loginCard');
 if(!card)return;
 let label=document.getElementById('loginVersion');
 if(!label){label=document.createElement('div');label.id='loginVersion';card.appendChild(label);}
 label.textContent='Version '+VERSION;
 label.style.cssText='margin-top:10px;font-size:11px;letter-spacing:.08em;opacity:.75;text-align:center;';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addVersion);else addVersion();
window.addEventListener('load',()=>setTimeout(addVersion,250));
})();