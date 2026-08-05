(function(){
'use strict';
const frame=document.getElementById('hubFrame');
function inject(){
 const d=frame&&frame.contentDocument;
 if(!d||!d.body||d.getElementById('savedCheckExpandFixScript'))return;
 const s=d.createElement('script');
 s.id='savedCheckExpandFixScript';
 s.src='saved-check-expand-fix.js?v=20260805-305';
 d.body.appendChild(s);
}
frame?.addEventListener('load',()=>setTimeout(inject,1800));
setTimeout(inject,3500);
})();