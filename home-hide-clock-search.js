(function(){
'use strict';
function apply(){
 const home=document.getElementById('home');
 if(!home)return;
 const clock=home.querySelector('.ledShell');
 if(clock)clock.style.display='none';
 const search=document.getElementById('homeSearchWrap');
 if(search)search.style.display='none';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
