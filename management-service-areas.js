(function(){
'use strict';
const $=id=>document.getElementById(id);
const clean=v=>String(v||'').trim();
const code=v=>clean(v).toUpperCase().replace(/\s+/g,'');
let queued=false;
const AREA_RULES=[
 ['Perth',['perth','kinross','blairgowrie','pitlochry','dunkeld','crieff','auchterarder','aberfeldy','newburgh','ballinluig','inveralmond','bru ar']],
 ['Kirkcaldy',['kirkcaldy','dysart','chapel','seafield','thornton','cardenden','kinghorn']],
 ['Dunfermline',['dunfermline','rosyth','halbeath','ferrytoll','inverkeithing','crossford','blairhall','steelend','townhill','dalgety bay','north queensferry']],
 ['Leven',['leven','methil','kennoway','windygates','cameron bridge','anstruther','east neuk']],
 ['Glenrothes',['glenrothes','leslie','markinch','newcastle','stenton']],
 ['St Andrews',['st andrews','cupar','guardbridge','tayport','newport']],
 ['Arbroath / Angus',['arbroath','forfar','kirriemuir','brechin','montrose','carnoustie','monifieth','stracathro','glamis','edzell']],
 ['Dundee',['dundee','ninewells','seagate']],
 ['Edinburgh / Express',['edinburgh','livingston','airport','glasgow','stirling']]
];
function areaFor(route){
 const t=clean(route).toLowerCase();
 for(const [area,words] of AREA_RULES)if(words.some(w=>t.includes(w)))return area;
 const first=clean(route).split(/\s+-\s+/)[0].replace(/\b(bus station|mill street|kinnoull street|south street|city centre|park and ride|p&r).*$/i,'').trim();
 return first||'Other Area';
}
function entries(){
 const src=Array.isArray(window.INSPECTOR_SERVICES)?window.INSPECTOR_SERVICES:[];
 const grouped={};
 src.forEach(s=>{const c=code(s.code);if(!c)return;(grouped[c]||(grouped[c]=[])).push({code:c,route:clean(s.route),area:areaFor(s.route)});});
 const out=[];
 Object.values(grouped).forEach(group=>{
  const duplicate=group.length>1;
  group.forEach((e,i)=>{e.key=duplicate?e.code+'@@'+e.area+'@@'+i:e.code;e.label=duplicate?e.code+' — '+e.area:e.code;out.push(e);});
 });
 return out.sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true})||a.area.localeCompare(b.area));
}
function checkRows(){
 try{const a=(typeof cloud!=='undefined'&&cloud&&Array.isArray(cloud.Inspections))?cloud.Inspections.slice():[];if(!a.length)return[];const h=(a[0]||[]).map(x=>clean(x).toLowerCase());return h.includes('date')?a.slice(1):a;}catch(e){return[];}
}
function parseDate(v){if(typeof parseRowDate==='function')return parseRowDate(v);const d=new Date(v);if(!isNaN(d))return d;const p=clean(v).split('/');return p.length===3?new Date(Number(p[2].length===2?'20'+p[2]:p[2]),Number(p[1])-1,Number(p[0])):new Date(0);}
function rangeStart(){
 const selected=document.querySelector('[data-mg-range].selected')?.dataset.mgRange||'month';
 const n=new Date();n.setHours(0,0,0,0);
 if(selected==='today')return n;
 if(selected==='week'){const d=n.getDay();n.setDate(n.getDate()-d+(d===0?-6:1));return n;}
 if(selected==='month')return new Date(n.getFullYear(),n.getMonth(),1);
 return new Date(0);
}
function activeInspector(){return $('mgInspectorFilter')?.value||'all';}
function score(entry,row){
 const context=[row[3],row[8],row[9],row[14]].map(clean).join(' ').toLowerCase();
 const words=(entry.route.toLowerCase().match(/[a-z]{4,}/g)||[]).filter(w=>!['street','station','centre','circular','turning','circle','road','park','ride'].includes(w));
 let s=0;words.forEach(w=>{if(context.includes(w))s+=2;});
 if(context.includes(entry.area.toLowerCase().split(' / ')[0]))s+=4;
 return s;
}
function checkedKeys(master){
 const grouped={};master.forEach(e=>(grouped[e.code]||(grouped[e.code]=[])).push(e));
 const out=new Set(),start=rangeStart(),inspector=activeInspector().toLowerCase();
 checkRows().filter(r=>parseDate(r[0])>=start&&(inspector==='all'||clean(r[2]).toLowerCase()===inspector)).forEach(r=>{
  const c=code(r[5]);const options=grouped[c]||[];if(options.length===1){out.add(options[0].key);return;}if(options.length>1){
   const ranked=options.map(e=>({e,s:score(e,r)})).sort((a,b)=>b.s-a.s);
   if(ranked[0]&&ranked[0].s>0)out.add(ranked[0].e.key);
   else options.forEach(e=>out.add(e.key));
  }
 });
 return out;
}
function apply(){
 const checkedBox=$('mgCheckedServices'),uncheckedBox=$('mgUncheckedServices');
 if(!checkedBox||!uncheckedBox)return;
 const master=entries();if(!master.length)return;
 const checked=checkedKeys(master),unchecked=master.filter(e=>!checked.has(e.key));
 checkedBox.innerHTML=master.filter(e=>checked.has(e.key)).map(e=>'<span title="'+e.route.replace(/"/g,'&quot;')+'">'+e.label+'</span>').join('')||'<em>No services checked in this period.</em>';
 uncheckedBox.innerHTML=unchecked.map(e=>'<span title="'+e.route.replace(/"/g,'&quot;')+'">'+e.label+'</span>').join('')||'<em>All listed services have been checked.</em>';
 const stats=$('mgStats')?.querySelectorAll('.mgStat b');
 if(stats&&stats.length>=4){stats[2].textContent=String(checked.size);stats[3].textContent=String(unchecked.length);}
 const coverage=master.length?Math.round(checked.size/master.length*100):0;
 if($('mgCoverageBar'))$('mgCoverageBar').style.width=Math.min(100,coverage)+'%';
 if($('mgCoverageText'))$('mgCoverageText').textContent=coverage+'% service coverage ('+checked.size+' of '+master.length+')';
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}
function init(){
 const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});
 document.addEventListener('click',e=>{if(e.target.closest('[data-mg-range],#mgRefresh,#managementLoginBtn'))setTimeout(schedule,250);});
 document.addEventListener('change',e=>{if(e.target.id==='mgInspectorFilter')setTimeout(schedule,100);});
 setInterval(schedule,1500);schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1800));else setTimeout(init,1800);
})();