(function(){
'use strict';
const frame=document.getElementById('hubFrame');
function inject(){
 const d=frame&&frame.contentDocument;
 if(!d||d.getElementById('checksheetLogStatusScript'))return;
 const s=d.createElement('script');
 s.id='checksheetLogStatusScript';
 s.src='checksheet-log-status.js?v=20260717-212';
 d.body.appendChild(s);
}
if(frame)frame.addEventListener('load',()=>setTimeout(inject,1800));
setTimeout(inject,4000);
})();