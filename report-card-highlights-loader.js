(function(){
'use strict';
const frame=document.getElementById('hubFrame');
function inject(){
 const d=frame&&frame.contentDocument;if(!d||!d.body||d.getElementById('reportCardHighlightsScript'))return;
 const s=d.createElement('script');s.id='reportCardHighlightsScript';s.src='report-card-highlights.js?v=20260806-2';d.body.appendChild(s);
}
frame?.addEventListener('load',()=>setTimeout(inject,2200));
setTimeout(inject,4200);
})();
