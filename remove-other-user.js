(function(){
'use strict';
const ALLOWED=new Set(['M Skinner','A Duncan','A Fairbairn']);
function cleanLogin(){
 const other=document.querySelector('.loginChoice[data-login-name="Other"]');
 if(other)other.remove();
 const input=document.getElementById('loginOtherInspector');
 if(input)input.remove();
 const selected=document.querySelector('.loginChoice.selected[data-login-name="Other"]');
 if(selected)selected.classList.remove('selected');
}
function cleanManager(){
 const add=document.querySelector('#passwordManagerModal .pwAdd');
 if(add)add.remove();
 document.querySelectorAll('#passwordUserList .pwUserRow').forEach(row=>{
  const name=(row.querySelector('strong')?.textContent||'').trim();
  if(name&&!ALLOWED.has(name))row.remove();
 });
}
function clean(){cleanLogin();cleanManager();}
document.addEventListener('click',e=>{
 if(e.target.closest('#manageUserPasswordsBtn'))setTimeout(cleanManager,60);
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean);else clean();
setTimeout(clean,300);
setTimeout(clean,1000);
})();