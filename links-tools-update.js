(function(){
'use strict';
const $=id=>document.getElementById(id);
function apply(){
 const folder=$('otherLinksTools');
 const folderBtn=document.querySelector('#home .nav button[data-open="otherLinksTools"]');
 const dest=$('otherToolsNav');
 if(!folder||!folderBtn||!dest)return false;
 folderBtn.innerHTML='<span class="navIcon">🧰</span>Links &amp; Tools';
 const h2=folder.querySelector('h2');if(h2)h2.textContent='Links & Tools';
 const hero=folder.querySelector('.oltHero b');if(hero)hero.textContent='Links & Tools';
 const ticketBtn=document.querySelector('#home .nav button[data-open="ticket"]');
 if(ticketBtn&&!dest.contains(ticketBtn))dest.insertBefore(ticketBtn,dest.firstChild);
 const back=$('ticket')?.querySelector('.backBtn');if(back)back.dataset.open='otherLinksTools';
 return true;
}
let tries=0;const timer=setInterval(()=>{tries++;if(apply()||tries>30)clearInterval(timer);},200);
})();