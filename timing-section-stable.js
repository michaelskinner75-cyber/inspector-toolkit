(function(){
'use strict';
const $=id=>document.getElementById(id);
function addStyle(){
 if($('timingStableCss'))return;
 const s=document.createElement('style');s.id='timingStableCss';
 s.textContent='#timing .timingStableHidden{display:none!important}#timing .timingStableShown{display:block!important}#timing .timingStableToggle{width:100%;margin:12px 0 8px;background:#17324b;border:1px solid #416783;color:#fff;border-radius:10px;padding:12px;font-weight:800;font-size:15px;cursor:pointer}';
 document.head.appendChild(s);
}
function build(){
 const section=$('timing'),location=$('tcLocation'),search=$('timingSearch'),list=$('timingList');
 if(!section||!location||!search||!list)return false;
 const entryPanel=location.closest('.panel'),historyPanel=search.closest('.panel');
 if(!entryPanel||!historyPanel)return false;
 section.querySelectorAll('#toggleTimingEntryBtn,#toggleTimingHistoryBtn').forEach(b=>b.remove());
 const entry=document.createElement('button');entry.id='toggleTimingEntryBtn';entry.type='button';entry.className='timingStableToggle';entry.textContent='Enter New Check';entry.setAttribute('aria-expanded','false');entryPanel.before(entry);
 let historyTitle=section.querySelector('.timingHistoryTitle');
 if(!historyTitle){historyTitle=document.createElement('div');historyTitle.className='timingHistoryTitle';historyTitle.textContent='Completed Timing Checks';historyPanel.before(historyTitle);}
 const history=document.createElement('button');history.id='toggleTimingHistoryBtn';history.type='button';history.className='timingStableToggle';history.textContent='Show Completed Timing Checks';history.setAttribute('aria-expanded','false');historyTitle.before(history);
 function setEntry(open){entryPanel.classList.remove('hubForcedHidden','timingHidden','timingStableHidden','timingStableShown');entryPanel.style.removeProperty('display');entryPanel.classList.add(open?'timingStableShown':'timingStableHidden');entry.textContent=open?'Hide New Check':'Enter New Check';entry.setAttribute('aria-expanded',String(open));entry.dataset.open=open?'1':'0';}
 function setHistory(open){[historyPanel,historyTitle,list].forEach(el=>{el.classList.remove('hubForcedHidden','timingHidden','historyHidden','timingStableHidden','timingStableShown');el.style.removeProperty('display');el.classList.add(open?'timingStableShown':'timingStableHidden');});history.textContent=open?'Hide Completed Timing Checks':'Show Completed Timing Checks';history.setAttribute('aria-expanded',String(open));history.dataset.open=open?'1':'0';}
 entry.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();setEntry(entry.dataset.open!=='1');},true);
 history.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();setHistory(history.dataset.open!=='1');},true);
 setEntry(false);setHistory(false);
 section.dataset.timingStable='1';
 return true;
}
function start(){addStyle();let tries=0;const timer=setInterval(()=>{tries++;const section=$('timing');if(section&&section.dataset.timingStable==='1'){clearInterval(timer);return;}if(build()||tries>40)clearInterval(timer);},250);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();