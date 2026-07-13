(function(){
'use strict';
const KEY='teamNotesInputVisibilityV1';
const sections=[
  {pane:'team-notes',label:'Note'},
  {pane:'team-tasks',label:'Task'},
  {pane:'team-drivers',label:'Driver'},
  {pane:'team-events',label:'Event'}
];
function loadState(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return{}}}
function saveState(state){localStorage.setItem(KEY,JSON.stringify(state));}
function addCss(){if(document.getElementById('teamInputToggleCss'))return;const s=document.createElement('style');s.id='teamInputToggleCss';s.textContent=`
.teamInputToggle{width:100%;margin:0 0 10px;padding:11px 14px;border:1px solid #4d7390;border-radius:10px;background:#173a59;color:#fff;font-weight:900;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:10px}
.teamInputToggle::after{content:'▼';font-size:12px;transition:transform .18s ease}.teamInputToggle.collapsed::after{transform:rotate(-90deg)}
.teamInputPanelCollapsed{display:none!important}
body.display-phone .teamInputToggle{font-size:14px;padding:11px}
body.display-plus .teamInputToggle{font-size:15px}
body.display-ipad .teamInputToggle{font-size:16px;padding:13px 15px}
body.display-laptop .teamInputToggle{font-size:17px;padding:14px 16px}
`;document.head.appendChild(s);}
function setup(){const hub=document.getElementById('teamHub');if(!hub)return false;addCss();const state=loadState();sections.forEach(({pane,label})=>{const el=document.getElementById(pane);if(!el)return;const panel=el.querySelector(':scope > .panel');if(!panel)return;if(panel.dataset.toggleReady==='yes')return;panel.dataset.toggleReady='yes';const btn=document.createElement('button');btn.type='button';btn.className='teamInputToggle';btn.setAttribute('aria-expanded','true');panel.parentNode.insertBefore(btn,panel);const setOpen=open=>{panel.classList.toggle('teamInputPanelCollapsed',!open);btn.classList.toggle('collapsed',!open);btn.setAttribute('aria-expanded',String(open));btn.textContent=(open?'Hide ':'Show ')+label+' Input';state[pane]=open;saveState(state);};const initial=state[pane]===undefined?false:!!state[pane];setOpen(initial);btn.addEventListener('click',()=>setOpen(panel.classList.contains('teamInputPanelCollapsed')));});return true;}
function init(){let tries=0;const timer=setInterval(()=>{tries++;if(setup()||tries>40)clearInterval(timer);},250);const obs=new MutationObserver(()=>setup());obs.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();