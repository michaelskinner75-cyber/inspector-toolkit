(function(){
'use strict';
const $=id=>document.getElementById(id);
const TARGETS=['busTimes','utrack','ticketFinder','journeyPlanner','driverKnowledge','driversHandbook'];
function isMichael(){return (($('loggedInInspector')?.textContent||'').trim().toLowerCase()==='m skinner');}
function findAdminButtons(nav){return [...nav.querySelectorAll('button[data-open]')].filter(b=>{const t=(b.textContent+' '+(b.dataset.open||'')).toLowerCase();return t.includes('admin');});}
function loadNearbyTool(){if($('nearbyCheckSuggestionScript'))return;const s=document.createElement('script');s.id='nearbyCheckSuggestionScript';s.src='nearby-check-suggestions.js?v=20260716-186';document.body.appendChild(s);}
function setup(){
 const home=$('home'),nav=home?.querySelector('.nav');
 if(!home||!nav||$('otherLinksTools')){loadNearbyTool();return;}
 const folderBtn=document.createElement('button');
 folderBtn.dataset.open='otherLinksTools';
 folderBtn.innerHTML='<span class="navIcon">🧰</span>Other Links &amp; Tools';
 nav.appendChild(folderBtn);
 const section=document.createElement('section');
 section.id='otherLinksTools';section.className='section';
 section.innerHTML='<button class="backBtn" data-open="home">← Back</button><h2>Other Links &amp; Tools</h2><div class="oltHero"><span>🧰</span><div><b>Other Links &amp; Tools</b><small>Useful operational links and reference tools.</small></div></div><div class="nav oltNav" id="otherToolsNav"></div>';
 const anchor=$('busTimes')||document.querySelector('.section:last-of-type');
 anchor.parentNode.insertBefore(section,anchor);
 const dest=$('otherToolsNav');
 TARGETS.forEach(id=>{const b=nav.querySelector('button[data-open="'+id+'"]');if(b)dest.appendChild(b);});
 findAdminButtons(nav).forEach(b=>{if(isMichael())dest.appendChild(b);else b.style.display='none';});
 [...dest.querySelectorAll('button[data-open]')].forEach(b=>{const page=$(b.dataset.open);const back=page?.querySelector('.backBtn[data-open="home"]');if(back)back.dataset.open='otherLinksTools';});
 const observer=new MutationObserver(()=>{findAdminButtons(nav).forEach(b=>{if(isMichael()){dest.appendChild(b);const page=$(b.dataset.open);const back=page?.querySelector('.backBtn[data-open="home"]');if(back)back.dataset.open='otherLinksTools';}else b.style.display='none';});});
 observer.observe(nav,{childList:true,subtree:true});loadNearbyTool();
}
function style(){if($('otherLinksToolsCss'))return;const s=document.createElement('style');s.id='otherLinksToolsCss';s.textContent=`.oltHero{display:flex;align-items:center;gap:13px;margin:10px 0 16px;padding:16px;border-radius:15px;background:linear-gradient(135deg,#071b2d,#123c5f);border-left:7px solid #f4a51c}.oltHero>span{font-size:38px}.oltHero b{display:block;font-size:20px}.oltHero small{display:block;margin-top:4px;opacity:.75}.oltNav{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.oltNav button{min-height:64px}.oltNav:empty:after{content:'No tools are available.';display:block;padding:16px;opacity:.7}@media(max-width:620px){.oltNav{grid-template-columns:1fr}.oltHero b{font-size:18px}}`;document.head.appendChild(s);}
function init(){style();setup();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1500));else setTimeout(init,1500);
})();