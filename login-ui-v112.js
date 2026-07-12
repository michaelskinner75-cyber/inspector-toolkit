(function(){
'use strict';
const $=id=>document.getElementById(id);
function styles(){
 if($('loginUiV112Styles'))return;
 const s=document.createElement('style');
 s.id='loginUiV112Styles';
 s.textContent='#loginPassword{width:100%;box-sizing:border-box}.pwModal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:10050;padding:20px;overflow:auto}.pwModal.show{display:flex;align-items:flex-start;justify-content:center}.pwCard{width:min(850px,100%);margin-top:30px;background:#0b1b2b;border:3px solid #eea83e;border-radius:16px;padding:18px}.pwHead{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.pwHead h2{margin:0 0 5px}.pwHead p{margin:0;color:#b8c5ce}.pwUserRow{display:grid;grid-template-columns:1.3fr 1.5fr auto auto;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid #28465b}.pwUserRow input{margin:0}@media(max-width:700px){.pwUserRow{grid-template-columns:1fr}.pwHead{flex-direction:column}.pwHead button{align-self:flex-end}}';
 document.head.appendChild(s);
}
function ensureLoginField(){
 const card=document.querySelector('#loginPage .loginCard');
 const btn=$('loginBtn');
 if(!card||!btn||$('loginPassword'))return;
 const input=document.createElement('input');
 input.id='loginPassword';
 input.className='field';
 input.type='password';
 input.autocomplete='current-password';
 input.placeholder='Enter password';
 input.style.marginTop='10px';
 card.insertBefore(input,btn);
 const msg=document.createElement('div');
 msg.id='loginPasswordMessage';
 msg.className='loginSelectionText';
 msg.style.minHeight='20px';
 msg.style.color='#f5b7b7';
 card.insertBefore(msg,btn);
}
function ensureManagerButton(){
 const nav=document.querySelector('#home .nav');
 if(!nav||$('manageUserPasswordsBtn'))return;
 const current=typeof getInspector==='function'?getInspector():(localStorage.getItem('activeInspector')||'');
 if(current!=='M Skinner')return;
 const btn=document.createElement('button');
 btn.type='button';
 btn.id='manageUserPasswordsBtn';
 btn.innerHTML='<span class="navIcon">🔐</span>Manage User Passwords';
 nav.appendChild(btn);
}
function init(){
 styles();
 ensureLoginField();
 ensureManagerButton();
 setTimeout(()=>{ensureLoginField();ensureManagerButton();},800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();