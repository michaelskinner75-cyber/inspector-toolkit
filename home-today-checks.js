(function(){
'use strict';
const $=id=>document.getElementById(id);
let pendingRows=[];
let refreshBusy=false;
let lastRefresh=0;

function parseDate(v){
 const s=String(v||'').trim();
 let d=new Date(s);
 if(!isNaN(d))return d;
 const p=s.split('/');
 if(p.length===3){d=new Date(p[2].length===2?'20'+p[2]:p[2],Number(p[1])-1,Number(p[0]));if(!isNaN(d))return d;}
 return null;
}
function remoteRows(){
 try{
  const rows=(typeof cloud!=='undefined'&&cloud&&Array.isArray(cloud['Inspections']))?cloud['Inspections']:[];
  if(!rows.length)return[];
  const first=String(rows[0]?.[0]||'').trim().toLowerCase();
  return first==='date'?rows.slice(1):rows.slice();
 }catch(e){return[];}
}
function localRows(){
 try{
  const rows=JSON.parse(localStorage.getItem('local_Inspections')||'[]');
  return Array.isArray(rows)?rows:[];
 }catch(e){return[];}
}
function rowKey(r){
 return JSON.stringify((Array.isArray(r)?r:[]).map(v=>String(v??'').trim()));
}
function countMap(rows){
 const m=new Map();
 rows.forEach(r=>{const k=rowKey(r);m.set(k,(m.get(k)||0)+1);});
 return m;
}
function mergedRows(){
 const sources=[remoteRows(),localRows(),pendingRows];
 const maps=sources.map(countMap),sample=new Map();
 sources.forEach(rows=>rows.forEach(r=>sample.set(rowKey(r),r)));
 const out=[];
 sample.forEach((r,k)=>{
  const n=Math.max(...maps.map(m=>m.get(k)||0));
  for(let i=0;i<n;i++)out.push(r);
 });
 return out;
}
function countToday(){
 try{
  const now=new Date();
  return mergedRows().filter(r=>{const d=parseDate(r&&r[0]);return d&&d.toDateString()===now.toDateString();}).length;
 }catch(e){return 0;}
}
function update(){
 const count=$('homeTodayChecksCount');
 if(count)count.textContent=String(countToday());
}
function rememberPending(row){
 if(!Array.isArray(row))return;
 pendingRows.push(row.slice());
 update();
 setTimeout(update,250);
}
function patchCloudAppend(){
 try{
  if(typeof cloudAppend!=='function'||cloudAppend.__todayCounterPatched)return false;
  const original=cloudAppend;
  const wrapped=function(sheet,row){
   if(sheet==='Inspections')rememberPending(row);
   return original.apply(this,arguments);
  };
  wrapped.__todayCounterPatched=true;
  window.cloudAppend=wrapped;
  return true;
 }catch(e){return false;}
}
async function refreshInspections(force){
 if(refreshBusy)return;
 const now=Date.now();
 if(!force&&now-lastRefresh<8000)return;
 if(typeof WEB_APP_URL==='undefined'||!WEB_APP_URL)return;
 refreshBusy=true;lastRefresh=now;
 try{
  const joiner=WEB_APP_URL.includes('?')?'&':'?';
  const res=await fetch(WEB_APP_URL+joiner+'sheet='+encodeURIComponent('Inspections')+'&_='+Date.now(),{cache:'no-store'});
  const json=await res.json();
  if(json&&Array.isArray(json.data)&&typeof cloud!=='undefined'&&cloud){
   cloud['Inspections']=json.data;
   const remote=countMap(remoteRows());
   pendingRows=pendingRows.filter(r=>(remote.get(rowKey(r))||0)===0);
  }
 }catch(e){}
 refreshBusy=false;
 update();
}
function openTodayChecks(){
 try{
  checkFilter='today';
  localStorage.setItem('checkFilter','today');
  document.querySelectorAll('[data-check-filter]').forEach(b=>b.classList.toggle('active',b.dataset.checkFilter==='today'));
  if(typeof renderChecks==='function')renderChecks();
  if(typeof openSection==='function')openSection('checksheet');
  else $('checksheet')?.classList.add('active');
  setTimeout(()=>$('checkList')?.scrollIntoView({behavior:'smooth',block:'start'}),120);
 }catch(e){
  document.querySelector('[data-open="checksheet"]')?.click();
  setTimeout(()=>document.querySelector('[data-check-filter="today"]')?.click(),150);
 }
}
function build(){
 const home=$('home');if(!home||$('homeTodayChecksBtn'))return false;
 const btn=document.createElement('button');
 btn.type='button';btn.id='homeTodayChecksBtn';btn.className='homeTodayChecksBtn';
 btn.innerHTML='<span class="homeTodayChecksIcon">✓</span><span><small>Checks completed today</small><b id="homeTodayChecksCount">0</b></span>';
 btn.onclick=openTodayChecks;
 const stop=$('homeNearestStopCard');
 if(stop&&stop.parentNode===home)stop.insertAdjacentElement('afterend',btn);
 else{const nav=home.querySelector('.nav');if(nav)home.insertBefore(btn,nav);else home.appendChild(btn);}
 update();return true;
}
function style(){
 if($('homeTodayChecksCss'))return;
 const s=document.createElement('style');s.id='homeTodayChecksCss';
 s.textContent='.homeTodayChecksBtn{width:100%;display:flex;align-items:center;gap:10px;margin:0 0 10px;padding:9px 12px;border:1px solid #36586f;border-left:5px solid #35a86b;border-radius:11px;background:#102b40;color:#fff;text-align:left}.homeTodayChecksBtn:active{transform:scale(.99)}.homeTodayChecksIcon{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#35a86b;color:#fff;font-weight:900}.homeTodayChecksBtn span:nth-child(2){display:flex;align-items:center;justify-content:space-between;gap:12px;flex:1}.homeTodayChecksBtn small{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#b8c5ce;font-weight:800}.homeTodayChecksBtn b{font-size:22px;color:#fff}';
 document.head.appendChild(s);
}
function init(){
 style();
 let n=0;
 const boot=setInterval(()=>{
  n++;build();patchCloudAppend();update();
  if(n===2)refreshInspections(true);
  if(n>60)clearInterval(boot);
 },500);
 document.addEventListener('click',e=>{
  if(e.target.closest('#saveCheckSheetBtn')){
   setTimeout(update,50);
   setTimeout(()=>refreshInspections(true),1500);
   setTimeout(()=>refreshInspections(true),4500);
  }
  if(e.target.closest('#refreshChecksBtn,[data-open="home"]')){
   update();
   setTimeout(()=>refreshInspections(true),100);
  }
 });
 window.addEventListener('focus',()=>refreshInspections(false));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshInspections(false);});
 setInterval(()=>{if(!document.hidden)refreshInspections(false);},15000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1800));else setTimeout(init,1800);
})();