(function(){
'use strict';
const $=id=>document.getElementById(id);
function parseDate(v){
 const s=String(v||'').trim();
 let d=new Date(s);
 if(!isNaN(d))return d;
 const p=s.split('/');
 if(p.length===3){d=new Date(p[2].length===2?'20'+p[2]:p[2],Number(p[1])-1,Number(p[0]));if(!isNaN(d))return d;}
 return null;
}
function countToday(){
 try{
  const rows=(typeof cloud!=='undefined'&&cloud&&Array.isArray(cloud['Inspections']))?cloud['Inspections'].slice(1):[];
  const now=new Date();
  return rows.filter(r=>{const d=parseDate(r&&r[0]);return d&&d.toDateString()===now.toDateString();}).length;
 }catch(e){return 0;}
}
function update(){
 const count=$('homeTodayChecksCount');
 if(count)count.textContent=String(countToday());
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
function style(){if($('homeTodayChecksCss'))return;const s=document.createElement('style');s.id='homeTodayChecksCss';s.textContent='.homeTodayChecksBtn{width:100%;display:flex;align-items:center;gap:10px;margin:0 0 10px;padding:9px 12px;border:1px solid #36586f;border-left:5px solid #35a86b;border-radius:11px;background:#102b40;color:#fff;text-align:left}.homeTodayChecksBtn:active{transform:scale(.99)}.homeTodayChecksIcon{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#35a86b;color:#fff;font-weight:900}.homeTodayChecksBtn span:nth-child(2){display:flex;align-items:center;justify-content:space-between;gap:12px;flex:1}.homeTodayChecksBtn small{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#b8c5ce;font-weight:800}.homeTodayChecksBtn b{font-size:22px;color:#fff}';document.head.appendChild(s);}
function init(){style();let n=0;const t=setInterval(()=>{n++;build();update();if(n>60)clearInterval(t);},500);document.addEventListener('click',e=>{if(e.target.closest('#saveCheckSheetBtn,#refreshChecksBtn,[data-open="home"]'))setTimeout(update,1400);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1800));else setTimeout(init,1800);
})();