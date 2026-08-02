(function(){
'use strict';
const frame=document.getElementById('hubFrame');
function inject(){
 const d=frame&&frame.contentDocument;
 if(!d||d.getElementById('managementSummaryRefreshScript'))return;
 d.getElementById('managementSummary')?.remove();
 d.getElementById('managementLoginBtn')?.remove();
 const s=d.createElement('script');
 s.id='managementSummaryRefreshScript';
 s.src='management-summary.js?v=20260802-301';
 d.body.appendChild(s);
}
frame?.addEventListener('load',()=>setTimeout(inject,2400));
setTimeout(inject,4500);
})();