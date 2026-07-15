(function(){
'use strict';
const $=id=>document.getElementById(id);
let entryOpen=false;
let historyOpen=false;
function entryPanel(){return $('tcLocation')?.closest('.panel')||null;}
function historyParts(){
 const panel=$('timingSearch')?.closest('.panel')||null;
 const list=$('timingList')||null;
 const title=$('timing')?.querySelector('.timingHistoryTitle')||null;
 return [panel,list,title].filter(Boolean);
}
function setVisible(el,show){
 if(!el)return;
 el.classList.remove('hubForcedHidden','timingHidden','historyHidden');
 el.style.setProperty('display',show?'':'none',show?'':'important');
 if(show)el.style.removeProperty('display');
}
function applyEntry(){
 const btn=$('toggleTimingEntryBtn'),panel=entryPanel();
 if(!btn||!panel)return false;
 setVisible(panel,entryOpen);
 btn.textContent=entryOpen?'Hide New Check':'Enter New Check';
 btn.setAttribute('aria-expanded',String(entryOpen));
 btn.dataset.stableTiming='1';
 return true;
}
function applyHistory(){
 const btn=$('toggleTimingHistoryBtn');
 const parts=historyParts();
 if(!btn||!parts.length)return false;
 parts.forEach(el=>setVisible(el,historyOpen));
 btn.textContent=historyOpen?'Hide Completed Timing Checks':'Show Completed Timing Checks';
 btn.setAttribute('aria-expanded',String(historyOpen));
 btn.dataset.stableTiming='1';
 return true;
}
function clickHandler(e){
 const entry=e.target.closest('#toggleTimingEntryBtn');
 if(entry){e.preventDefault();e.stopImmediatePropagation();entryOpen=!entryOpen;applyEntry();return;}
 const history=e.target.closest('#toggleTimingHistoryBtn');
 if(history){e.preventDefault();e.stopImmediatePropagation();historyOpen=!historyOpen;applyHistory();}
}
function init(){
 document.addEventListener('click',clickHandler,true);
 entryOpen=false;historyOpen=false;
 applyEntry();applyHistory();
 setTimeout(()=>{applyEntry();applyHistory();},600);
 setTimeout(()=>{applyEntry();applyHistory();},1800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,2200));else setTimeout(init,2200);
})();
