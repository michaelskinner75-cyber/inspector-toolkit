(function(){
'use strict';
function ensureStyle(){
 if(document.getElementById('teamNotesHomeCounterCss'))return;
 const s=document.createElement('style');
 s.id='teamNotesHomeCounterCss';
 s.textContent=`
 .nav button[data-open="teamHub"]{position:relative!important}
 .teamNotesHomeCounter{position:absolute;top:8px;right:8px;min-width:28px;height:28px;padding:0 8px;box-sizing:border-box;border-radius:999px;background:#ff7a00;color:#081823;border:2px solid #fff;font-weight:900;font-size:14px;line-height:24px;text-align:center;box-shadow:0 3px 10px rgba(0,0,0,.35)}
 body.display-phone .teamNotesHomeCounter{top:6px;right:6px;min-width:25px;height:25px;padding:0 7px;font-size:12px;line-height:21px}
 body.display-plus .teamNotesHomeCounter{top:7px;right:7px}
 body.display-ipad .teamNotesHomeCounter{top:10px;right:10px;min-width:31px;height:31px;font-size:15px;line-height:27px}
 body.display-laptop .teamNotesHomeCounter{top:11px;right:11px;min-width:34px;height:34px;font-size:16px;line-height:30px}
 `;
 document.head.appendChild(s);
}
function updateCounter(){
 ensureStyle();
 const btn=document.querySelector('#home .nav button[data-open="teamHub"]');
 if(!btn)return;
 let badge=btn.querySelector('.teamNotesHomeCounter');
 if(!badge){badge=document.createElement('span');badge.className='teamNotesHomeCounter';badge.setAttribute('aria-label','Team notes count');btn.appendChild(badge);}
 const rows=Array.isArray(window.cloud?.['Inspector Notes'])?window.cloud['Inspector Notes'].slice(1):[];
 const ids=new Map();
 rows.forEach(r=>{if(Array.isArray(r))ids.set(String(r[0]||Math.random()),r);});
 const count=[...ids.values()].length;
 badge.textContent=count>99?'99+':String(count);
 badge.title=`${count} team note${count===1?'':'s'}`;
 badge.style.display=count?'block':'none';
}
const oldRender=window.renderAll;
if(typeof oldRender==='function')window.renderAll=function(){oldRender.apply(this,arguments);updateCounter();};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(updateCounter,500));else setTimeout(updateCounter,500);
setInterval(updateCounter,5000);
})();