(function(){
'use strict';
function selectedInspector(){
 const selected=document.querySelector('.loginChoice.selected');
 return selected&&selected.dataset?String(selected.dataset.loginName||'').trim():'';
}
function finishLogin(){
 const name=selectedInspector();
 if(!name){alert('Please select an inspector.');return;}
 try{localStorage.setItem('activeInspector',name);}catch(e){}
 const display=document.getElementById('loggedInInspector');
 if(display)display.textContent=name;
 const login=document.getElementById('loginPage');
 if(login)login.classList.add('hidden');
 if(typeof openSection==='function')openSection('home');
 else{
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const home=document.getElementById('home');if(home)home.classList.add('active');
 }
 if(typeof renderAll==='function')renderAll();
}
window.completeLogin=finishLogin;
})();