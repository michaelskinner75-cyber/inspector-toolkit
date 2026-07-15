(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').trim().toLowerCase();
function addStyles(){if($('homeGlobalSearchCss'))return;const s=document.createElement('style');s.id='homeGlobalSearchCss';s.textContent=`
#home .ledShell{flex-direction:column!important;gap:4px!important;height:auto!important;min-height:78px!important;padding:8px 12px!important}
#home #staticBusClock{line-height:1.05!important}
#home #syncStatus{display:block!important;position:static!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;color:#ffb24d!important;font-size:11px!important;text-align:center!important;min-height:14px!important}
#homeSearchWrap{position:relative;order:3!important;margin:0!important}
#homeGlobalSearch{width:100%;box-sizing:border-box;padding:14px 46px 14px 14px;border-radius:12px;border:1px solid #416783;background:#0b2235;color:#fff;font-size:16px;font-weight:700}
#homeSearchClear{position:absolute;right:7px;top:7px;width:34px;height:34px;border:0;border-radius:8px;background:#173b57;color:#fff;font-size:20px}
#homeSearchResults{display:none;margin-top:8px;max-height:520px;overflow:auto;background:#071725;border:1px solid #345a78;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.45);padding:8px;position:relative;z-index:70}
#homeSearchResults.show{display:block}
.homeSearchGroup{padding:7px 9px 4px;color:#ffb24d;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
.homeSearchItem{display:block;width:100%;box-sizing:border-box;text-align:left;background:#102b40;color:#fff;border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:11px 12px;margin:6px 0}
.homeSearchItem b{display:block;font-size:14px}.homeSearchItem small{display:block;margin-top:3px;opacity:.75;line-height:1.35}
.homeSearchEmpty{padding:16px;text-align:center;opacity:.7}
@media(max-width:620px){#homeGlobalSearch{font-size:15px;padding:13px 44px 13px 12px}#homeSearchResults{max-height:440px}}
`;document.head.appendChild(s);}
function ensureUi(){const home=$('home'),panel=home?.querySelector('.panel'),shell=home?.querySelector('.ledShell'),status=$('syncStatus');if(!home||!panel||!shell)return false;if(status&&status.parentElement!==shell)shell.appendChild(status);if(!$('homeSearchWrap')){const wrap=document.createElement('div');wrap.id='homeSearchWrap';wrap.innerHTML='<input id="homeGlobalSearch" type="search" autocomplete="off" placeholder="Search drivers, fleet, services, checks, reports and tools…"><button id="homeSearchClear" type="button" aria-label="Clear search">×</button><div id="homeSearchResults"></div>';panel.appendChild(wrap);$('homeGlobalSearch').addEventListener('input',render);$('homeGlobalSearch').addEventListener('focus',render);$('homeSearchClear').onclick=()=>{$('homeGlobalSearch').value='';$('homeSearchResults').classList.remove('show');$('homeGlobalSearch').focus();};document.addEventListener('click',e=>{if(!wrap.contains(e.target))$('homeSearchResults')?.classList.remove('show');});}
return true;}
function dataRows(sheet){try{const a=(typeof cloud!=='undefined'&&Array.isArray(cloud[sheet]))?cloud[sheet]:[];if(!a.length)return[];const h=(a[0]||[]).map(x=>norm(x));const isHeader=h.some(x=>['date','time','inspector','driver','fleet','service','location'].includes(x));return isHeader?a.slice(1):a.slice();}catch(e){return[];}}
function employees(){const out=[];const seen=new Set();const sources=[window.SHARED_EMPLOYEE_DIRECTORY,window.INSPECTOR_EMPLOYEE_DIRECTORY];for(const src of sources){if(!Array.isArray(src))continue;for(const x of src){const e=Array.isArray(x)?{name:x[0],employeeNumber:x[1],depot:x[2],jobTitle:x[3]}:x;const name=String(e?.name||'').trim(),num=String(e?.employeeNumber||e?.['Employee Number']||'').trim();if(!name&&!num)continue;const key=(num||name).toLowerCase();if(seen.has(key))continue;seen.add(key);out.push({name,employeeNumber:num,depot:e?.depot||'',jobTitle:e?.jobTitle||''});}}
return out;}
function tools(){return [...document.querySelectorAll('button[data-open]')].filter(b=>b.offsetParent!==null||b.closest('.section')).map(b=>({title:(b.textContent||'').trim(),section:b.dataset.open})).filter(x=>x.title&&x.section);}
function countsFor(q){const key=norm(q);let fleet=0,service=0,driver=0;const inspectionRows=dataRows('Inspections');const timingRows=dataRows('Timing Checks');const reportRows=dataRows('Driver Reports');for(const r of inspectionRows){if(norm(r[6])===key)fleet++;if(norm(r[5])===key)service++;if(norm(r[4])===key)driver++;}
for(const r of timingRows){if(norm(r[6])===key)fleet++;if(norm(r[4])===key)service++;if(norm(r[7])===key)driver++;}
for(const r of reportRows){if(norm(r[8])===key)fleet++;if(norm(r[7])===key)service++;if(norm(r[3])===key)driver++;}
return {fleet,service,driver};}
function add(arr,type,title,sub,section,query){arr.push({type,title,sub,section,query});}
function buildResults(q){const n=norm(q),out=[];if(!n)return out;
for(const e of employees().filter(e=>norm(e.name).includes(n)||norm(e.employeeNumber).includes(n)).slice(0,12)){const c=countsFor(e.name);add(out,'Drivers',e.name,`Employee ${e.employeeNumber||'-'}${e.depot?' • '+e.depot:''}${c.driver?' • '+c.driver+' recorded check/report'+(c.driver===1?'':'s'):''}`,'database',e.name);}
for(const t of tools().filter(t=>norm(t.title).includes(n)).slice(0,10))add(out,'Tools',t.title,'Open tool',t.section,'');
const sheets=[
 {name:'Inspections',type:'Checks',section:'checksheet',map:r=>({title:`${r[5]||'-'} • Fleet ${r[6]||'-'} • ${r[4]||'-'}`,sub:`${r[0]||''} • ${r[3]||'-'} • ${r[8]||'-'} to ${r[9]||'-'}`})},
 {name:'Timing Checks',type:'Timing Checks',section:'timing',map:r=>({title:`${r[4]||'-'} • Fleet ${r[6]||'-'} • ${r[7]||'-'}`,sub:`${r[0]||''} • ${r[3]||'-'} • Scheduled ${r[8]||'-'} / Actual ${r[9]||'-'}`})},
 {name:'Driver Reports',type:'Driver Reports',section:'driverReports',map:r=>({title:`${r[3]||'-'} • ${r[5]||'Driver Report'}`,sub:`${r[0]||''} • ${r[7]||'-'} • Fleet ${r[8]||'-'} • ${r[6]||''}`})},
 {name:'NSA Faults',type:'NSA Reports',section:'nsa',map:r=>({title:`Fleet ${r[4]||'-'} • ${r[5]||'-'} • ${r[8]||'-'}`,sub:`${r[0]||''} • ${r[3]||'-'} • ${r[6]||'-'}`})}
];
for(const s of sheets){let added=0;for(const r of dataRows(s.name).slice().reverse()){if(added>=10)break;if(!r.join(' ').toLowerCase().includes(n))continue;const m=s.map(r);add(out,s.type,m.title,m.sub,s.section,q);added++;}}
const c=countsFor(q);if(c.fleet)add(out,'Summary',`Fleet ${q}`,`Checked or reported ${c.fleet} time${c.fleet===1?'':'s'}`,'database',q);if(c.service)add(out,'Summary',`Service ${q}`,`Checked or reported ${c.service} time${c.service===1?'':'s'}`,'coverage',q);if(c.driver)add(out,'Summary',q,`Appears in ${c.driver} check or report record${c.driver===1?'':'s'}`,'database',q);
return out.slice(0,50);}
function openResult(item){if(typeof openSection==='function')openSection(item.section);else{document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id===item.section));}
setTimeout(()=>{const q=item.query||'';const fields={checksheet:'checkSearch',timing:'timingSearch',driverReports:'reportSearch',nsa:'nsaSearch',database:'driverSearch',coverage:'coverageSearch'};const f=$(fields[item.section]);if(f&&q){f.value=q;f.dispatchEvent(new Event('input',{bubbles:true}));}window.scrollTo(0,0);},80);}
function render(){const input=$('homeGlobalSearch'),box=$('homeSearchResults');if(!input||!box)return;const q=input.value.trim();if(!q){box.classList.remove('show');box.innerHTML='';return;}const rows=buildResults(q);if(!rows.length){box.innerHTML='<div class="homeSearchEmpty">No matching drivers, checks, reports, fleet, services or tools found.</div>';box.classList.add('show');return;}let html='',last='';rows.forEach((r,i)=>{if(r.type!==last){html+=`<div class="homeSearchGroup">${esc(r.type)}</div>`;last=r.type;}html+=`<button class="homeSearchItem" data-home-result="${i}"><b>${esc(r.title)}</b><small>${esc(r.sub)}</small></button>`;});box.innerHTML=html;box.classList.add('show');box.querySelectorAll('[data-home-result]').forEach(b=>b.onclick=()=>openResult(rows[Number(b.dataset.homeResult)]));}
function init(){addStyles();let tries=0;const timer=setInterval(()=>{tries++;if(ensureUi()||tries>30)clearInterval(timer);},250);setTimeout(()=>{ensureUi();if(typeof loadCloud==='function')loadCloud();},2500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();