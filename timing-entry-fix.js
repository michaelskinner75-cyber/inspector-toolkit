(function(){
'use strict';
const $=id=>document.getElementById(id);
function setup(){
 const section=$('timing'),location=$('tcLocation');
 if(!section||!location)return false;
 const panel=location.closest('.panel');if(!panel)return false;
 let old=$('toggleTimingEntryBtn')||[...section.querySelectorAll('button')].find(b=>/timing check details|enter new check|hide new check/i.test((b.textContent||'').trim()));
 if(!old)return false;
 if(old.dataset.entryFixed==='1')return true;
 const btn=old.cloneNode(true);btn.id='toggleTimingEntryBtn';btn.dataset.entryFixed='1';old.replaceWith(btn);
 function setOpen(open){
  panel.classList.remove('hubForcedHidden','timingHidden','historyHidden','nsaSectionHidden');
  panel.style.removeProperty('display');panel.hidden=false;
  panel.querySelectorAll('.hubForcedHidden,.timingHidden').forEach(el=>el.classList.remove('hubForcedHidden','timingHidden'));
  if(!open)panel.classList.add('hubForcedHidden');
  btn.textContent=open?'Hide New Check':'Enter New Check';
  btn.setAttribute('aria-expanded',String(open));
  btn.dataset.open=open?'1':'0';
 }
 btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();setOpen(btn.dataset.open!=='1');},true);
 setOpen(false);
 return true;
}
let tries=0;const timer=setInterval(()=>{tries++;if(setup()||tries>40)clearInterval(timer);},250);
})();