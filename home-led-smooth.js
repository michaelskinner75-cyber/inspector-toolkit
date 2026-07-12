(function(){
'use strict';
const el=id=>document.getElementById(id);
function rows(sheet){try{return typeof cloud!=='undefined'&&cloud&&Array.isArray(cloud[sheet])?cloud[sheet].slice():[];}catch(e){return[];}}
function trimHeader(data){if(!data.length)return data;const first=(data[0]||[]).map(v=>String(v||'').toLowerCase());return first.some(v=>['date','time','inspector','driver','fleet','service','depot','location'].includes(v))?data.slice(1):data;}
function stamp(date,time){const d=new Date(String(date||'')+(time?' '+String(time):''));return Number.isNaN(d.getTime())?0:d.getTime();}
function recent(){const out=[];
 trimHeader(rows('Inspections')).forEach(r=>{const a=String(r[13]||'');let label='CHECKED';if(/advis/i.test(a))label='ADVISED';else if((/report/i.test(a)||/offence/i.test(a))&&!/no driver report/i.test(a))label='REPORTED';out.push({n:stamp(r[0],r[1]),text:[label,r[4],r[5]&&'SERVICE '+r[5],r[6]&&'FLEET '+r[6],r[14]].filter(Boolean).join('  •  ')});});
 trimHeader(rows('Early Running')).forEach(r=>{const m=Number(r[10]);out.push({n:stamp(r[0],r[1]),text:[m<0?'EARLY RUNNING':'TIMING CHECK',r[7],r[4]&&'SERVICE '+r[4],r[6]&&'FLEET '+r[6],r[3]].filter(Boolean).join('  •  ')});});
 trimHeader(rows('NSA Faults')).forEach(r=>{if(!(r[7]==='No'||(r[8]&&r[8]!=='Fully Working'&&r[8]!=='N/A')))return;out.push({n:stamp(r[0],r[1]),text:['NSA FAULT',r[6],r[5]&&'SERVICE '+r[5],r[4]&&'FLEET '+r[4],r[8]||r[9]].filter(Boolean).join('  •  ')});});
 return out.sort((a,b)=>b.n-a.n).slice(0,8).map(x=>x.text);
}
function text(){const now=new Date();const date=now.toLocaleDateString('en-GB');const time=now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});const inspector=typeof getInspector==='function'?getInspector():'';return ['DATE '+date+'  TIME '+time+(inspector?'  INSPECTOR: '+inspector:''),...recent()].join('     ◆     ');}
function style(){if(el('homeLedSmoothCss'))return;const s=document.createElement('style');s.id='homeLedSmoothCss';s.textContent='#recentActivityBox,#compactHomeClock{display:none!important}#home .loggedInBox{grid-template-columns:1fr auto!important;padding:8px 10px!important;font-size:13px!important}#home .loggedInBox strong{font-size:17px!important}#home #changeInspectorBtn{padding:7px 12px!important;font-size:11px!important;min-height:34px!important;width:auto!important;margin:0!important}#home .ledShell{display:block!important;height:54px!important;margin-top:8px!important}#home .ledBar{font-size:18px!important;animation-duration:30s!important;animation-timing-function:linear!important;will-change:transform}#home .status{font-size:12px;padding:6px 8px;margin-top:6px}';document.head.appendChild(s);}
function init(){style();const bar=el('homeClock');if(!bar)return;bar.textContent=text();bar.addEventListener('animationiteration',()=>{const next=text();if(next!==bar.textContent)bar.textContent=next;});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();