(function(){
'use strict';
const frame=document.getElementById('hubFrame');
function apply(){
 try{
  const d=frame&&frame.contentDocument;
  if(!d||!d.head)return;
  let style=d.getElementById('homeHideClockSearchCss');
  if(!style){
   style=d.createElement('style');
   style.id='homeHideClockSearchCss';
   style.textContent='#home .ledShell,#homeSearchWrap{display:none!important}';
   d.head.appendChild(style);
  }
 }catch(e){}
}
if(frame)frame.addEventListener('load',apply);
setTimeout(apply,800);
})();
