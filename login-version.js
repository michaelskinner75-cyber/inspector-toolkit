(function(){
'use strict';
const VERSION='13.07.26.122';
const UPLOADED='13/07/2026 18:11';
function addVersion(){
 const card=document.querySelector('#loginPage .loginCard');
 if(!card)return;
 let label=document.getElementById('loginVersion');
 if(!label){label=document.createElement('div');label.id='loginVersion';card.appendChild(label);}
 label.innerHTML='Version '+VERSION+'<br>Uploaded '+UPLOADED;
 label.style.cssText='margin-top:10px;font-size:11px;line-height:1.5;letter-spacing:.06em;opacity:.7;text-align:center;';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addVersion);else addVersion();
setTimeout(addVersion,500);
})();