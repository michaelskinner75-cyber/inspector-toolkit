(function(){
'use strict';
const frame=document.getElementById('hubFrame');
function inject(){
 const d=frame&&frame.contentDocument;
 if(!d||d.getElementById('managementRangeDropdownScript'))return;
 const s=d.createElement('script');
 s.id='managementRangeDropdownScript';
 s.src='management-range-dropdown.js?v=20260802-303';
 d.body.appendChild(s);
}
frame?.addEventListener('load',()=>setTimeout(inject,3000));
setTimeout(inject,5200);
})();