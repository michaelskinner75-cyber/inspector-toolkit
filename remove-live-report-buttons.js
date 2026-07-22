(function(){
'use strict';
function removeLiveButtons(){
 const controls=document.getElementById('checksheetShareControls');
 if(controls)controls.remove();
 const preview=document.getElementById('previewCheckReportBtn');
 if(preview)preview.remove();
 const share=document.getElementById('shareCheckReportBtn');
 if(share)share.remove();
}
removeLiveButtons();
const observer=new MutationObserver(removeLiveButtons);
observer.observe(document.body,{childList:true,subtree:true});
setTimeout(()=>observer.disconnect(),8000);
})();