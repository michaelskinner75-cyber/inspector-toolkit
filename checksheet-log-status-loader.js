(function(){
'use strict';
var frame=document.getElementById('hubFrame');
function inject(){
 var d=frame&&frame.contentDocument;
 if(!d)return;
 if(!d.getElementById('checksheetNsaVehicleSplitScript')){
  var a=d.createElement('script');
  a.id='checksheetNsaVehicleSplitScript';
  a.src='checksheet-nsa-vehicle-split.js?v=20260717-213';
  d.body.appendChild(a);
 }
 if(!d.getElementById('checksheetLogStatusScript')){
  var b=d.createElement('script');
  b.id='checksheetLogStatusScript';
  b.src='checksheet-log-status.js?v=20260717-225';
  d.body.appendChild(b);
 }
}
if(frame)frame.addEventListener('load',function(){setTimeout(inject,1800);});
setTimeout(inject,4000);
})();