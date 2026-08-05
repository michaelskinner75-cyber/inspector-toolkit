(function(){
'use strict';
const frame=document.getElementById('hubFrame');
function inject(){
 const doc=frame&&frame.contentDocument;
 if(!doc||!doc.body||doc.getElementById('destinationPlacementFixScript'))return;
 const s=doc.createElement('script');
 s.id='destinationPlacementFixScript';
 s.src='destination-placement-fix.js?v=20260805-304';
 doc.body.appendChild(s);
}
frame?.addEventListener('load',()=>setTimeout(inject,2600));
setTimeout(inject,4800);
})();