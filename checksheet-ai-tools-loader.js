(function(){
'use strict';
const frame=document.getElementById('hubFrame');
function inject(){
  try{
    const d=frame&&frame.contentDocument;
    if(!d||!d.body||d.getElementById('checksheetAiToolsScript'))return;
    const s=d.createElement('script');
    s.id='checksheetAiToolsScript';
    s.src='checksheet-ai-tools.js?v=20260910-1';
    d.body.appendChild(s);
  }catch(e){console.error(e);}
}
if(frame)frame.addEventListener('load',()=>setTimeout(inject,2200));
setTimeout(inject,4200);
})();