(function(){
'use strict';
const frame=document.getElementById('hubFrame');
function inject(){
 const d=frame&&frame.contentDocument;
 if(!d||d.getElementById('managementDriverActionsScript'))return;
 const s=d.createElement('script');
 s.id='managementDriverActionsScript';
 s.src='management-driver-actions.js?v=20260910-1';
 d.body.appendChild(s);
}
frame?.addEventListener('load',()=>setTimeout(inject,2800));
setTimeout(inject,5000);
})();