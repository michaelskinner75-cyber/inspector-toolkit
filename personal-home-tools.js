(function(){
'use strict';
const $=id=>document.getElementById(id);
const blocked=new Set(['home','otherLinksTools','reportsChecks']);
function user(){return (localStorage.getItem('activeInspector')||$('loggedInInspector')?.textContent||'').trim()||'Guest';}
function key(){return 'inspectorHubHomeTools:'+user().toLowerCase();}
function saved(){try{return JSON.parse(localStorage.getItem(key())||'[]');}catch(e){return[];}}
function store(v){localStorage.setItem(key(),JSON.stringify([...new Set(v)]));}
function titleFor(id){const section=$(id);return section?.querySelector('h2')?.textContent?.trim()||document.querySelector('button[data-open="'+id+'"]')?.textContent?.trim()||id;}
function allTools(){return [...document.querySelectorAll('.section[id]')].map(s=>s.id).filter(id=>!blocked.has(id)&&id!=='loginPage');}
function ensureHomeBox(){
 const home=$('home'),nav=home?.querySelector('.nav');if(!home||!nav)return null;
 let box=$('myHomeTools');
 if(!box){
  box=document.createElement('div');box.id='myHomeTools';box.className='myHomeTools';
  box.innerHTML='<div class="myHomeToolsHead"><b>⭐ My Home Tools</b><small>Your personal shortcuts</small></div><div class="nav myHomeToolsNav" id="myHomeToolsNav"></div>';
  nav.parentNode.insertBefore(box,nav);
 }
 return $('myHomeToolsNav');
}
function renderHome(){
 const dest=ensureHomeBox();if(!dest)return;
 const ids=saved().filter(id=>$(id));
 dest.innerHTML=ids.map(id=>'<button data-open="'+id+'"><span class="navIcon">⭐</span>'+titleFor(id)+'</button>').join('')||'<div class="myHomeToolsEmpty">Open any tool and press “Add to Home Screen”.</div>';
}
function addControls(){
 allTools().forEach(id=>{
  const section=$(id);if(!section||section.querySelector('.homeToolToggle'))return;
  const btn=document.createElement('button');btn.type='button';btn.className='btn homeToolToggle';btn.dataset.homeTool=id;
  const back=section.querySelector('.backBtn');
  if(back)back.insertAdjacentElement('afterend',btn);else section.insertBefore(btn,section.firstChild);
 });
 updateControls();
}
function updateControls(){
 const set=new Set(saved());
 document.querySelectorAll('.homeToolToggle').forEach(btn=>{
  const on=set.has(btn.dataset.homeTool);
  btn.textContent=on?'✓ Remove from Home Screen':'＋ Add to Home Screen';
  btn.classList.toggle('activeHomeTool',on);
 });
}
function toggle(id){const list=saved();const i=list.indexOf(id);if(i>=0)list.splice(i,1);else list.push(id);store(list);renderHome();updateControls();}
function refreshUser(){renderHome();updateControls();}
function init(){
 ensureHomeBox();addControls();renderHome();
 document.addEventListener('click',e=>{const btn=e.target.closest('.homeToolToggle');if(btn){e.preventDefault();toggle(btn.dataset.homeTool);}});
 const name=$('loggedInInspector');if(name)new MutationObserver(refreshUser).observe(name,{childList:true,subtree:true,characterData:true});
 const observer=new MutationObserver(()=>{addControls();renderHome();});
 observer.observe(document.body,{childList:true,subtree:true});
}
function style(){if($('personalHomeToolsCss'))return;const s=document.createElement('style');s.id='personalHomeToolsCss';s.textContent='.myHomeTools{margin:12px 0;padding:12px;border-radius:14px;background:#0d263b;border:1px solid rgba(255,255,255,.12);border-left:6px solid #f4a51c}.myHomeToolsHead{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:9px}.myHomeToolsHead b{font-size:17px}.myHomeToolsHead small{opacity:.7}.myHomeToolsNav{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.myHomeToolsNav button{min-height:58px}.myHomeToolsEmpty{grid-column:1/-1;padding:10px;opacity:.7;font-size:13px}.homeToolToggle{margin:0 0 10px 8px;padding:8px 11px!important;font-size:12px!important}.homeToolToggle.activeHomeTool{background:#1f6f55!important}@media(max-width:620px){.myHomeToolsNav{grid-template-columns:1fr}.myHomeToolsHead{align-items:flex-start;flex-direction:column}}';document.head.appendChild(s);}
function start(){style();setTimeout(init,1800);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();