(function(){
'use strict';
const $=id=>document.getElementById(id);
function apply(){
 const section=$('timing'),location=$('tcLocation');
 if(!section||!location)return false;
 const panel=location.closest('.panel');
 if(!panel)return false;
 let btn=$('toggleTimingEntryBtn');
 if(!btn){btn=document.createElement('button');btn.id='toggleTimingEntryBtn';btn.type='button';btn.className='hubSectionToggle';panel.before(btn);}
 const setOpen=open=>{
  panel.classList.remove('hubForcedHidden','timingHidden');
  panel.style.removeProperty('display');
  panel.querySelectorAll('.hubForcedHidden,.timingHidden').forEach(el=>el.classList.remove('hubForcedHidden','timingHidden'));
  if(!open)panel.classList.add('hubForcedHidden');
  btn.textContent=open?'Hide New Check':'Enter New Check';
  btn.dataset.open=open?'1':'0';
  btn.setAttribute('aria-expanded',String(open));
 };
 btn.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();setOpen(btn.dataset.open!=='1');};
 if(btn.dataset.entryFixReady!=='1'){btn.dataset.entryFixReady='1';setOpen(false);}
 return true;
}
let tries=0;const timer=setInterval(()=>{tries++;apply();if(tries>25)clearInterval(timer);},250);
})();