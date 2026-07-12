(function(){
'use strict';
function openTool(id){
 const target=document.getElementById(id);
 if(!target)return;
 document.querySelectorAll('.section').forEach(section=>section.classList.remove('active'));
 target.classList.add('active');
 window.scrollTo(0,0);
}
document.addEventListener('click',function(event){
 const button=event.target.closest('[data-open]');
 if(!button)return;
 const id=button.getAttribute('data-open');
 if(!id||!document.getElementById(id))return;
 event.preventDefault();
 event.stopImmediatePropagation();
 openTool(id);
},true);
window.openSection=openTool;
})();