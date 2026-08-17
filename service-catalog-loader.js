(function(){
'use strict';
const frame=document.getElementById('hubFrame');
if(!frame)return;
function load(){
  let doc;
  try{doc=frame.contentDocument;}catch(e){return;}
  if(!doc||doc.getElementById('serviceCatalogue20260817'))return;
  const script=doc.createElement('script');
  script.id='serviceCatalogue20260817';
  script.src='service-catalog-20260817.js?v=20260817-1';
  doc.body.appendChild(script);
}
frame.addEventListener('load',load);
if(frame.contentDocument&&frame.contentDocument.readyState!=='loading')load();
})();
