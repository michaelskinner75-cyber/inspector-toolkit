(function(){
'use strict';
const frame=document.getElementById('hubFrame');
function inject(){
 const d=frame&&frame.contentDocument;
 if(!d||d.getElementById('managementPrintReportScript'))return;
 const s=d.createElement('script');
 s.id='managementPrintReportScript';
 s.src='management-print-report.js?v=20260802-302';
 d.body.appendChild(s);
}
frame?.addEventListener('load',()=>setTimeout(inject,3200));
setTimeout(inject,5200);
})();