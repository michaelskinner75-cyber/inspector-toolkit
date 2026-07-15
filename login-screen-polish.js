(function(){
'use strict';
function apply(){
 const page=document.getElementById('loginPage');if(!page)return false;
 const title=page.querySelector('.loginTitle');if(title)title.textContent='INSPECTOR HUB';
 const prompt=page.querySelector('.loginCard > p');if(prompt)prompt.remove();
 const other=page.querySelector('.loginChoice[data-login-name="Other"]');if(other)other.remove();
 const input=document.getElementById('loginOtherInspector');if(input)input.style.display='none';
 return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
setTimeout(apply,500);
})();