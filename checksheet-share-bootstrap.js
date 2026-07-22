(function(){
'use strict';
const frame=document.getElementById('hubFrame');
function inject(){
 try{
  const doc=frame&&frame.contentDocument;
  if(!doc||!doc.body||doc.getElementById('checksheetShareReportScript'))return;
  const script=doc.createElement('script');
  script.id='checksheetShareReportScript';
  script.src='checksheet-share-report.js?v=20260722-237';
  doc.body.appendChild(script);
 }catch(e){console.error(e);}
}
if(frame)frame.addEventListener('load',()=>setTimeout(inject,300),{once:true});
setTimeout(inject,1800);
})();