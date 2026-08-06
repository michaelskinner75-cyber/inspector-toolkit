(function(){
'use strict';
const frame=document.getElementById('hubFrame');
function inject(){
 const d=frame&&frame.contentDocument;
 if(!d||!d.body||d.getElementById('inspectorUiCleanupScript'))return;
 const s=d.createElement('script');s.id='inspectorUiCleanupScript';s.src='inspector-ui-cleanup-20260806.js?v=20260806-307';d.body.appendChild(s);
}
frame?.addEventListener('load',()=>setTimeout(inject,3200));
setTimeout(inject,5200);
})();