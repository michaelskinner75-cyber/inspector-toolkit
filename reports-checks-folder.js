(function(){
'use strict';
const $=id=>document.getElementById(id);
const MATCHERS=[
 {label:'Service Coverage',test:(t,id)=>t.includes('service coverage')||id.includes('coverage')},
 {label:'Report Search',test:(t,id)=>t.includes('report search')||id.includes('reportsearch')},
 {label:'Operations Map',test:(t,id)=>t.includes('operations map')||id.includes('operationsmap')},
 {label:'NSA Log',test:(t,id)=>t.includes('nsa log')||t.includes('nsa faults')||t==='nsa'||id==='nsa'||id.includes('nsalog')},
 {label:'Management Summary',test:(t,id)=>t.includes('management summary')||id.includes('managementsummary')}
];
function details(button){return {text:(button.textContent||'').trim().toLowerCase(),id:(button.dataset.open||button.id||'').replace(/[^a-z0-9]/gi,'').toLowerCase()};}
function match(button){const d=details(button);return MATCHERS.find(x=>x.test(d.text,d.id));}
function setBack(button){const id=button.dataset.open;if(!id)return;const page=$(id);if(!page)return;page.querySelectorAll('.backBtn[data-open="home"],.backBtn[data-open="loginPage"]').forEach(b=>b.dataset.open='reportsChecks');}
function moveMatches(){const dest=$('reportsChecksNav');if(!dest)return;document.querySelectorAll('button').forEach(button=>{
 if(button.closest('#reportsChecksNav')||button.dataset.open==='reportsChecks')return;
 const found=match(button);if(!found)return;
 button.style.display='';
 if(!(button.textContent||'').trim())button.textContent=found.label;
 dest.appendChild(button);
 setBack(button);
 });
}
function setup(){
 const home=$('home'),nav=home?.querySelector('.nav');
 if(!home||!nav||$('reportsChecks'))return;
 const folder=document.createElement('button');
 folder.dataset.open='reportsChecks';
 folder.innerHTML='<span class="navIcon">📋</span>Reports &amp; Checks';
 nav.appendChild(folder);
 const section=document.createElement('section');
 section.id='reportsChecks';section.className='section';
 section.innerHTML='<button class="backBtn" data-open="home">← Back</button><h2>Reports &amp; Checks</h2><div class="rcHero"><span>📋</span><div><b>Reports &amp; Checks</b><small>Coverage, reports, maps, NSA records and management information.</small></div></div><div class="nav rcNav" id="reportsChecksNav"></div>';
 const anchor=$('otherLinksTools')||document.querySelector('.section:last-of-type');
 anchor.parentNode.insertBefore(section,anchor);
 moveMatches();
 const observer=new MutationObserver(()=>moveMatches());
 observer.observe(document.body,{childList:true,subtree:true});
 setTimeout(moveMatches,1000);setTimeout(moveMatches,2500);
}
function style(){if($('reportsChecksCss'))return;const s=document.createElement('style');s.id='reportsChecksCss';s.textContent=`.rcHero{display:flex;align-items:center;gap:13px;margin:10px 0 16px;padding:16px;border-radius:15px;background:linear-gradient(135deg,#071b2d,#123c5f);border-left:7px solid #f4a51c}.rcHero>span{font-size:38px}.rcHero b{display:block;font-size:20px}.rcHero small{display:block;margin-top:4px;opacity:.75}.rcNav{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.rcNav button{min-height:64px}.rcNav:empty:after{content:'No reports or checks are available.';display:block;padding:16px;opacity:.7}@media(max-width:620px){.rcNav{grid-template-columns:1fr}.rcHero b{font-size:18px}}`;document.head.appendChild(s);}
function init(){style();setup();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1800));else setTimeout(init,1800);
})();