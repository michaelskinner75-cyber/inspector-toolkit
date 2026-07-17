(function(){
'use strict';
const frame=document.getElementById('hubFrame');
function inject(){
 const d=frame&&frame.contentDocument;
 if(!d||d.getElementById('managementTimeCoverageScript'))return;
 const s=d.createElement('script');
 s.id='managementTimeCoverageScript';
 s.src='management-time-coverage.js?v=20260717-209';
 d.body.appendChild(s);
}
frame?.addEventListener('load',()=>setTimeout(inject,1200));
setTimeout(inject,3500);
})();