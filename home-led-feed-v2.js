(function(){
'use strict';
const $=id=>document.getElementById(id);
const clean=v=>String(v??'').trim();
function data(sheet){try{return typeof cloud!=='undefined'&&cloud&&Array.isArray(cloud[sheet])?cloud[sheet].slice():[];}catch(e){return[];}}
function rows(sheet){const a=data(sheet);if(!a.length)return[];const h=(a[0]||[]).map(v=>clean(v).toLowerCase());return h.some(v=>['date','time','inspector','driver','fleet','service','depot','location'].includes(v))?a.slice(1):a;}
function dateValue(v,t){const s=clean(v),time=clean(t);let d=new Date(s+(time?' '+time:''));if(!Number.isNaN(d.getTime()))return d.getTime();const p=s.split('/');if(p.length===3){d=new Date(Number(p[2].length===2?'20'+p[2]:p[2]),Number(p[1])-1,Number(p[0]));return d.getTime();}return 0;}
function key(x){return [x.type,x.date,x.time,x.driver,x.service,x.fleet,x.detail].map(v=>clean(v).toLowerCase()).join('|');}
function records(){const out=[];
 rows('Inspections').forEach(r=>{const action=clean(r[13]);let type='CHECKED';if(/advis/i.test(action))type='ADVISED';else if((/report|offence/i.test(action))&&!/no driver report/i.test(action))type='REPORTED';out.push({type,date:r[0],time:r[1],driver:r[4],service:r[5],fleet:r[6],detail:r[14]||r[8]||'',stamp:dateValue(r[0],r[1])});});
 rows('Early Running').forEach(r=>{if(r.length>=12){const mins=Number(r[10]);out.push({type:mins<0?'EARLY RUNNING':'TIMING CHECK',date:r[0],time:r[1],driver:r[7],service:r[4],fleet:r[6],detail:r[11]||r[3]||'',stamp:dateValue(r[0],r[1])});}else{out.push({type:'EARLY RUNNING',date:r[0],time:r[1],driver:r[3],service:r[5],fleet:'',detail:r[6]||r[9]||'',stamp:dateValue(r[0],r[1])});}});
 rows('NSA Faults').forEach(r=>{const fault=clean(r[8]);if(!(r[7]==='No'||(fault&&fault!=='Fully Working'&&fault!=='N/A')))return;out.push({type:'NSA FAULT',date:r[0],time:r[1],driver:r[6],service:r[5],fleet:r[4],detail:fault||r[9]||'',stamp:dateValue(r[0],r[1])});});
 rows('Driver Reports').forEach(r=>{out.push({type:/advis/i.test(clean(r[5]))?'ADVISED':'REPORTED',date:r[0],time:r[1],driver:r[3],service:r[7],fleet:r[8],detail:r[6]||r[5]||'',stamp:dateValue(r[0],r[1])});});
 const seen=new Set();return out.filter(x=>{const k=key(x);if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>b.stamp-a.stamp).slice(0,10);
}
function message(){const now=new Date();const first='DATE '+now.toLocaleDateString('en-GB')+'  TIME '+now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})+((typeof getInspector==='function'&&getInspector())?'  INSPECTOR: '+getInspector():'');const items=records().map(x=>[x.type,x.driver,x.service&&'SERVICE '+x.service,x.fleet&&'FLEET '+x.fleet,x.detail].filter(Boolean).join('  •  '));return [first,...items].join('     ◆     ');}
function style(){if($('homeLedFeedV2Css'))return;const s=document.createElement('style');s.id='homeLedFeedV2Css';s.textContent='#home .ledBar{animation-duration:18s!important;animation-timing-function:linear!important;will-change:transform}';document.head.appendChild(s);}
function init(){style();const bar=$('homeClock');if(!bar)return;let pending=message();bar.textContent=pending;setInterval(()=>{pending=message();},3000);bar.addEventListener('animationiteration',()=>{if(pending&&pending!==bar.textContent)bar.textContent=pending;});setTimeout(()=>{const next=message();if(records().length&&bar.textContent.indexOf('◆')<0){bar.textContent=next;}},4500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();