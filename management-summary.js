(function(){
'use strict';
const $=id=>document.getElementById(id);
let range='month';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v||'').trim();
function parseDate(v){if(typeof parseRowDate==='function')return parseRowDate(v);let d=new Date(v);if(!isNaN(d))return d;const p=String(v||'').split('/');if(p.length===3)return new Date(Number(p[2].length===2?'20'+p[2]:p[2]),Number(p[1])-1,Number(p[0]));return new Date(0);}
function rows(sheet){let a=[];try{if(typeof cloud!=='undefined'&&cloud&&Array.isArray(cloud[sheet]))a=cloud[sheet].slice();}catch(e){}if(!a.length)return[];const h=(a[0]||[]).map(v=>clean(v).toLowerCase());return h.some(v=>['date','time','inspector','driver','fleet','service','depot','location'].includes(v))?a.slice(1):a;}
function startOfPeriod(){const n=new Date();n.setHours(0,0,0,0);if(range==='today')return n;if(range==='week'){const d=n.getDay();n.setDate(n.getDate()-d+(d===0?-6:1));return n;}if(range==='month')return new Date(n.getFullYear(),n.getMonth(),1);return new Date(0);}
function inRange(r){return parseDate(r[0])>=startOfPeriod();}
function serviceCode(v){return clean(v).toUpperCase().replace(/\s+/g,'');}
function allServices(){const set=new Set();(window.INSPECTOR_SERVICES||[]).forEach(s=>{const code=serviceCode(s.code);if(!code)return;set.add(code);code.split('/').forEach(x=>x&&set.add(x));});return [...set].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));}
function data(){
 const checks=rows('Inspections').filter(inRange);
 const timing=rows('Early Running').filter(inRange);
 const nsa=rows('NSA Faults').filter(inRange).filter(r=>r[7]==='No'||(r[8]&&r[8]!=='Fully Working'&&r[8]!=='N/A'));
 const checkedSet=new Set(checks.map(r=>serviceCode(r[5])).filter(Boolean));
 const master=allServices();
 const unchecked=master.filter(s=>!checkedSet.has(s));
 const advised=checks.filter(r=>/advis/i.test(clean(r[13])));
 const reported=checks.filter(r=>/report|offence/i.test(clean(r[13]))&&!/no driver report/i.test(clean(r[13])));
 const early=timing.filter(r=>r.length>=12?Number(r[10])<0:true);
 const uniqueDrivers=new Set(checks.map(r=>clean(r[4]).toLowerCase()).filter(Boolean));
 const uniqueFleet=new Set(checks.map(r=>clean(r[6])).filter(Boolean));
 const coverage=master.length?Math.round((checkedSet.size/master.length)*100):0;
 return {checks,timing,nsa,checkedSet,master,unchecked,advised,reported,early,uniqueDrivers,uniqueFleet,coverage};
}
function latest(d){const list=[];d.checks.forEach(r=>list.push({date:r[0],time:r[1],type:/advis/i.test(r[13])?'Advised':(/report|offence/i.test(r[13])&&!/no driver report/i.test(r[13])?'Reported':'Inspector Check'),driver:r[4],service:r[5],fleet:r[6],detail:r[14]||r[8]||''}));d.timing.forEach(r=>list.push({date:r[0],time:r[1],type:(r.length>=12&&Number(r[10])<0)?'Early Running':'Timing Check',driver:r[7]||r[3],service:r[4]||r[5],fleet:r[6]||'',detail:r[11]||r[3]||r[9]||''}));d.nsa.forEach(r=>list.push({date:r[0],time:r[1],type:'NSA Fault',driver:r[6],service:r[5],fleet:r[4],detail:r[8]||r[9]||''}));return list.sort((a,b)=>parseDate(b.date)-parseDate(a.date)).slice(0,12);}
function stat(n,label,cls=''){return '<div class="mgStat '+cls+'"><b>'+n+'</b><span>'+label+'</span></div>';}
function render(){const root=$('managementSummary');if(!root)return;const d=data();
 $('mgStats').innerHTML=stat(d.checks.length,'Total Checks')+stat(d.uniqueDrivers.size,'Drivers Checked')+stat(d.checkedSet.size,'Services Checked','good')+stat(d.unchecked.length,'Services Not Checked','warn')+stat(d.reported.length,'Drivers Reported','bad')+stat(d.advised.length,'Drivers Advised','warn')+stat(d.nsa.length,'NSA Issues','bad')+stat(d.early.length,'Early Running','warn')+stat(d.timing.length,'Timing Checks')+stat(d.uniqueFleet.size,'Fleet Checked');
 $('mgCoverageBar').style.width=Math.min(100,d.coverage)+'%';$('mgCoverageText').textContent=d.coverage+'% service coverage ('+d.checkedSet.size+' of '+d.master.length+')';
 $('mgCheckedServices').innerHTML=[...d.checkedSet].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).map(x=>'<span>'+esc(x)+'</span>').join('')||'<em>No services checked in this period.</em>';
 $('mgUncheckedServices').innerHTML=d.unchecked.map(x=>'<span>'+esc(x)+'</span>').join('')||'<em>All listed services have been checked.</em>';
 const recent=latest(d);$('mgRecent').innerHTML=recent.map(x=>'<div class="mgRecentRow"><div><b>'+esc(x.type)+'</b><small>'+esc(x.date||'')+' '+esc(x.time||'')+'</small></div><div><strong>'+esc(x.driver||'No driver')+'</strong><small>Service '+esc(x.service||'-')+' • Fleet '+esc(x.fleet||'-')+'</small></div><div>'+esc(x.detail||'-')+'</div></div>').join('')||'<div class="mgEmpty">No activity in this period.</div>';
 document.querySelectorAll('[data-mg-range]').forEach(b=>b.classList.toggle('selected',b.dataset.mgRange===range));
}
function openManagement(){const login=$('loginPage');if(login)login.classList.add('hidden');if(typeof openSection==='function')openSection('managementSummary');render();if(typeof loadCloud==='function'){loadCloud().then?loadCloud().then(render):setTimeout(render,1500);}else setTimeout(render,1500);}
function backToLogin(){if(typeof openSection==='function')openSection('home');if(typeof showLogin==='function')showLogin();else $('loginPage')?.classList.remove('hidden');}
function addStyles(){if($('managementSummaryCss'))return;const s=document.createElement('style');s.id='managementSummaryCss';s.textContent=`
#managementLoginBtn{width:100%;margin-top:9px;background:#459679;color:#fff}
#managementSummary{padding-bottom:20px}.mgHeader{display:flex;justify-content:space-between;gap:10px;align-items:center}.mgHeader h2{margin:8px 0}.mgFilters{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:10px 0}.mgFilters button{padding:10px}.mgFilters button.selected{background:#eea83e;color:#0b1b2b}.mgStats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.mgStat{background:#0d2233;border:1px solid #36586f;border-radius:11px;padding:13px;text-align:center}.mgStat b{display:block;font-size:28px;color:#eea83e}.mgStat span{font-size:12px;color:#b8c5ce}.mgStat.good{border-left:6px solid #459679}.mgStat.warn{border-left:6px solid #eea83e}.mgStat.bad{border-left:6px solid #c83f49}.mgCoverage{height:18px;background:#07131e;border-radius:20px;overflow:hidden;border:1px solid #36586f}.mgCoverageBar{height:100%;background:linear-gradient(90deg,#459679,#eea83e);transition:width .3s}.mgCoverageText{text-align:center;margin-top:7px;font-weight:900}.mgTwo{display:grid;grid-template-columns:1fr 1fr;gap:12px}.mgServiceList{display:flex;flex-wrap:wrap;gap:6px;max-height:250px;overflow:auto}.mgServiceList span{background:#173a59;border:1px solid #47749a;border-radius:20px;padding:6px 10px;font-size:12px}.mgServiceList.unchecked span{background:#49232a;border-color:#8d4852}.mgRecentRow{display:grid;grid-template-columns:180px 230px 1fr;gap:12px;align-items:center;padding:10px;border-bottom:1px solid #28465b}.mgRecentRow small{display:block;color:#b8c5ce;margin-top:3px}.mgEmpty{padding:20px;text-align:center;color:#b8c5ce}
@media(max-width:900px){.mgStats{grid-template-columns:repeat(2,1fr)}.mgTwo{grid-template-columns:1fr}.mgRecentRow{grid-template-columns:1fr}.mgHeader{align-items:flex-start}.mgHeader button{padding:9px}}
`;document.head.appendChild(s);}
function build(){const loginCard=document.querySelector('#loginPage .loginCard');if(loginCard&&!$('managementLoginBtn')){const b=document.createElement('button');b.type='button';b.id='managementLoginBtn';b.className='btn';b.textContent='MANAGEMENT SUMMARY';const version=$('loginVersion');if(version)loginCard.insertBefore(b,version);else loginCard.appendChild(b);b.addEventListener('click',openManagement);}
 if($('managementSummary'))return;const machine=document.querySelector('.machine');if(!machine)return;const sec=document.createElement('section');sec.id='managementSummary';sec.className='section';sec.innerHTML='<div class="mgHeader"><div><button type="button" class="backBtn" id="mgBack">← Login Screen</button><h2>Management Summary</h2></div><button type="button" class="btn" id="mgRefresh">REFRESH DATA</button></div><div class="mgFilters"><button data-mg-range="today">Today</button><button data-mg-range="week">This Week</button><button data-mg-range="month">This Month</button><button data-mg-range="all">All Time</button></div><div class="mgStats" id="mgStats"></div><div class="panel"><h3>Service Coverage</h3><div class="mgCoverage"><div class="mgCoverageBar" id="mgCoverageBar"></div></div><div class="mgCoverageText" id="mgCoverageText"></div></div><div class="mgTwo"><div class="panel"><h3>Services Checked</h3><div class="mgServiceList" id="mgCheckedServices"></div></div><div class="panel"><h3>Services Not Checked</h3><div class="mgServiceList unchecked" id="mgUncheckedServices"></div></div></div><div class="panel"><h3>Recent Management Activity</h3><div id="mgRecent"></div></div>';
 machine.appendChild(sec);$('mgBack').addEventListener('click',backToLogin);$('mgRefresh').addEventListener('click',()=>{if(typeof loadCloud==='function')loadCloud();setTimeout(render,1000);});sec.addEventListener('click',e=>{const b=e.target.closest('[data-mg-range]');if(b){range=b.dataset.mgRange;render();}});}
function init(){addStyles();build();setTimeout(build,800);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();