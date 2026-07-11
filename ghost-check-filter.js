(function(){
'use strict';

function cleanText(value){
  return String(value||'').replace(/\s+/g,' ').trim();
}

function isBlankCheckCard(card){
  const main=cleanText(card.querySelector('.compactMain')?.textContent);
  const sub=cleanText(card.querySelector('.compactSub')?.textContent);
  const details=cleanText(card.querySelector('.compactDetails')?.textContent);

  const blankMain=/^-\s+-\s*\|\s*-\s*\|\s*-\s*\|\s*-\s*\|\s*OK$/i.test(main);
  const blankSub=/^-\s*[•·]\s*-\s*(?:→|to)?\s*-\s*[•·]\s*-$/.test(sub);
  const blankReportMain=/^-\s+-\s*\|\s*Inspector Check\s*\|\s*-\s*\|\s*Fleet\s*-$/i.test(main);
  const blankReportSub=/^-\s*[•·]\s*-\s*[•·]\s*-$/.test(sub);

  if((blankMain&&blankSub)||(blankReportMain&&blankReportSub))return true;

  const stripped=details
    .replace(/Inspector Check/gi,'')
    .replace(/Date:/gi,'')
    .replace(/Driver:/gi,'')
    .replace(/Fleet:/gi,'')
    .replace(/Service:/gi,'')
    .replace(/Depot\/Location:/gi,'')
    .replace(/Destination:/gi,'')
    .replace(/Inspector:/gi,'')
    .replace(/NSA:\s*Yes/gi,'')
    .replace(/Fully Working/gi,'')
    .replace(/Driver Report:\s*No Driver Report/gi,'')
    .replace(/No Driver Report/gi,'')
    .replace(/OK/gi,'')
    .replace(/[\s|•·→:\-]/g,'');

  return stripped.length===0;
}

function removeGhostCards(){
  document.querySelectorAll('#checkList .compactCheck,#reportResults .compactCheck').forEach(card=>{
    if(isBlankCheckCard(card))card.remove();
  });

  const checkList=document.getElementById('checkList');
  if(checkList&&!checkList.querySelector('.compactCheck')&&!cleanText(checkList.textContent))checkList.textContent='No checks for this view.';

  const reportResults=document.getElementById('reportResults');
  if(reportResults&&!reportResults.querySelector('.compactCheck')&&!cleanText(reportResults.textContent))reportResults.textContent='No matching reports.';
}

function init(){
  removeGhostCards();
  const observer=new MutationObserver(removeGhostCards);
  ['checkList','reportResults'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)observer.observe(el,{childList:true,subtree:true});
  });
  setInterval(removeGhostCards,800);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,3200));
else setTimeout(init,3200);
})();
