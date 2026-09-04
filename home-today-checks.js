(function(){
'use strict';
const $=id=>document.getElementById(id);
let pendingRows=[];
let refreshBusy=false;
let lastRefresh=0;

function normal(v){return String(v??'').trim().toLowerCase().replace(/\s+/g,' ');}
function parseDate(v){
 const s=String(v||'').trim();
 if(!s)return null;
 const uk=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
 if(uk){let y=Number(uk[3]);if(y<100)y+=2000;const d=new Date(y,Number(uk[2])-1,Number(uk[1]));return isNaN(d)?null:d;}
 const d=new Date(s);return isNaN(d)?null:d;
}
function dateKey(v){
 const d=parseDate(v);if(!d)return normal(v);
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function timeKey(v){
 const s=String(v||'').trim();
 const m=s.match(/(\d{1,2}):(\d{2})/);
 return m?`${String(Number(m[1])).padStart(2,'0')}:${m[2]}`:normal(s);
}
function remoteRows(){
 try{
  const rows=(typeof cloud!=='undefined'&&cloud&&Array.isArray(cloud['Inspections']))?cloud['Inspections']:[];
  if(!rows.length)return[];
  const first=(rows[0]||[]).map(v=>normal(v));
  const hasHeader=first.some(v=>['date','time','inspector','driver','fleet','service','depot'].includes(v));
  return hasHeader?rows.slice(1):rows.slice();
 }catch(e){return[];}
}
function localRows(){
 try{
  const rows=JSON.parse(localStorage.getItem('local_Inspections')||'[]');
  return Array.isArray(rows)?rows:[];
 }catch(e){return[];}
}
function meaningfulRow(r){
 if(!Array.isArray(r))return false;
 if(!parseDate(r[0]))return false;
 return [r[2],r[3],r[4],r[5],r[6],r[7],r[8],r[9]].some(v=>normal(v));
}
function rowKey(r){
 if(!Array.isArray(r))return'';
 return [
  dateKey(r[0]),timeKey(r[1]),normal(r[2]),normal(r[3]),normal(r[4]),normal(r[5]),normal(r[6]),timeKey(r[7]),normal(r[8]),normal(r[9])
 ].join('|');
}
function mergedRows(){
 const map=new Map();
 [localRows(),pendingRows,remoteRows()].forEach(rows=>rows.forEach(r=>{
  if(!meaningfulRow(r))return;
  const key=rowKey(r);if(key)map.set(key,r);
 }));
 return [...map.values()];
}
function countToday(){
 try{
  const today=dateKey(new Date());
  return mergedRows().filter(r=>dateKey(r[0])===today).length;
 }catch(e){return 0;}
}
function update(){
 const count=$('homeTodayChecksCount');
 if(count)count.textContent=String(countToday());
}
function rememberPending(row){
 if(!Array.isArray(row)||!meaningfulRow(row))return;
 const key=rowKey(row);
 if(!pendingRows.some(r=>rowKey(r)===key))pendingRows.push(row.slice());
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
   const remoteKeys=new Set(remoteRows().filter(meaningfulRow).map(rowKey));
   pendingRows=pendingRows.filter(r=>!remoteKeys.has(rowKey(r)));
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