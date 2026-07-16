(function(){
'use strict';
const $=id=>document.getElementById(id);
const TARGETS=['busTimes','utrack','ticketFinder','journeyPlanner','driverKnowledge','driversHandbook'];
const SERVICE_UPDATES_URL='https://www.stagecoachbus.com/regional-service-updates/east-scotland/glenrothes-leven-and-kirkcaldy';
function isMichael(){return (($('loggedInInspector')?.textContent||'').trim().toLowerCase()==='m skinner');}
function findAdminButtons(nav){return [...nav.querySelectorAll('button[data-open]')].filter(b=>{const t=(b.textContent+' '+(b.dataset.open||'')).toLowerCase();return t.includes('admin');});}
function addServiceUpdates(dest){
 let link=$('serviceUpdatesDirect');
 if(!link){
  link=document.createElement('a');
  link.id='serviceUpdatesDirect';
  link.className='oltDirectLink';
  link.href=SERVICE_UPDATES_URL;
  link.target='_blank';
  link.rel='noopener';
  link.innerHTML='<span class="navIcon">⚠️</span><span>Service Updates</span>';
 }
 dest.appendChild(link);
}
function loadNearbyTool(){if($('nearbyCheckSuggestionScript'))return;const s=document.createElement('script');s.id='nearbyCheckSuggestionScript';s.src='nearby-check-suggestions.js?v=20260716-197';document.body.appendChild(s);}
function setup(){
 const home=$('home'),nav=home?.querySelector('.nav');
 if(!home||!nav||$('otherLinksTools')){const dest=$('otherToolsNav');if(dest)addServiceUpdates(dest);loadNearbyTool();return;}
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
 addServiceUpdates(dest);
 findAdminButtons(nav).forEach(b=>{if(isMichael())dest.appendChild(b);else b.style.display='none';});
 [...dest.querySelectorAll('button[data-open]')].forEach(b=>{const page=$(b.dataset.open);const back=page?.querySelector('.backBtn[data-open="home"]');if(back)back.dataset.open='otherLinksTools';});
 const observer=new MutationObserver(()=>{findAdminButtons(nav).forEach(b=>{if(isMichael()){dest.appendChild(b);const page=$(b.dataset.open);const back=page?.querySelector('.backBtn[data-open="home"]');if(back)back.dataset.open='otherLinksTools';}else b.style.display='none';});});
 observer.observe(nav,{childList:true,subtree:true});loadNearbyTool();
}
function style(){if($('otherLinksToolsCss'))return;const s=document.createElement('style');s.id='otherLinksToolsCss';s.textContent=`.oltHero{display:flex;align-items:center;gap:13px;margin:10px 0 16px;padding:16px;border-radius:15px;background:linear-gradient(135deg,#071b2d,#123c5f);border-left:7px solid #f4a51c}.oltHero>span{font-size:38px}.oltHero b{display:block;font-size:20px}.oltHero small{display:block;margin-top:4px;opacity:.75}.oltNav{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.oltNav button,.oltDirectLink{min-height:64px}.oltDirectLink{display:flex;align-items:center;justify-content:center;gap:10px;padding:12px;border:1px solid #36586f;border-radius:12px;background:#102b40;color:#fff;text-decoration:none;font-weight:700;text-align:center}.oltDirectLink .navIcon{font-size:22px}.oltDirectLink:active{transform:scale(.99)}.oltNav:empty:after{content:'No tools are available.';display:block;padding:16px;opacity:.7}@media(max-width:620px){.oltNav{grid-template-columns:1fr}.oltHero b{font-size:18px}}`;document.head.appendChild(s);}
function init(){style();setup();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1500));else setTimeout(init,1500);
})();