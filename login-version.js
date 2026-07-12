(function(){
'use strict';
const VERSION='107';
function addVersion(){
 const card=document.querySelector('#loginPage .loginCard');
 if(!card||document.getElementById('loginVersion'))return;
 const label=document.createElement('div');
 label.id='loginVersion';
 label.textContent='Version '+VERSION;
 label.style.cssText='margin-top:10px;font-size:11px;letter-spacing:.08em;opacity:.65;text-align:center;';
 card.appendChild(label);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addVersion);else addVersion();
})();