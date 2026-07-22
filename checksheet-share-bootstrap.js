(function(){
'use strict';
const frame=document.getElementById('hubFrame');
function add(doc,id,src){if(doc.getElementById(id))return;const script=doc.createElement('script');script.id=id;script.src=src;doc.body.appendChild(script);}
function inject(){
 try{
  const doc=frame&&frame.contentDocument;
  if(!doc||!doc.body)return;
  add(doc,'checksheetShareReportScript','checksheet-share-report.js?v=20260722-239');
  add(doc,'savedCheckShareScript','saved-check-share.js?v=20260722-239');
  add(doc,'removeLiveReportButtonsScript','remove-live-report-buttons.js?v=20260722-239');
 }catch(e){console.error(e);}
}
if(frame)frame.addEventListener('load',()=>setTimeout(inject,300),{once:true});
setTimeout(inject,1800);
})();