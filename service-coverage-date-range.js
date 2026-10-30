(function(){
'use strict';
const $=id=>document.getElementById(id);
let mode=localStorage.getItem('coverageViewMode20261030')||'all';
const norm=v=>String(v||'').toUpperCase().replace(/\s+/g,'').replace(/[^A-Z0-9]/g,'');
function parseDate(v){
 if(v instanceof Date)return isNaN(v.getTime())?new Date(0):v;
 if(typeof v==='number'&&v>20000&&v<90000)return new Date(Date.UTC(1899,11,30)+v*86400000);
 const s=String(v??'').trim();if(!s)return new Date(0);
 let m=s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})$/);
 if(m){const y=Number(m[3].length===2?'20'+m[3]:m[3]);return new Date(y,Number(m[2])-1,Number(m[1]));}
 m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
 if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
 const d=new Date(s);return isNaN(d.getTime())?new Date(0):d;
}
function timeMinutes(v){
 if(typeof v==='number'&&v>=0&&v<1)return Math.round(v*1440);
 const s=String(v??'').trim();if(!s)return 0;
 const m=s.match(/^(\d{1,2}):(\d{2})(?:\:\d{2})?\s*(AM|PM)?/i);
 if(m){let h=Number(m[1]);const min=Number(m[2]);if(m[3]){h=h%12+(m[3].toUpperCase()==='PM'?12:0);}return h*60+min;}
 const d=new Date(s);return isNaN(d.getTime())?0:d.getHours()*60+d.getMinutes();
}
function checkStamp(item){return parseDate(item.date).getTime()+timeMinutes(item.time)*60000;}
function html(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function displayDate(v){const d=parseDate(v);return isNaN(d.getTime())||d.getTime()===0?String(v||'-'):d.toLocaleDateString('en-GB');}
function displayTime(v){const s=String(v??'').trim();const m=s.match(/^(\d{1,2}):(\d{2})/);if(m)return m[1].padStart(2,'0')+':'+m[2];if(typeof v==='number'&&v>=0&&v<1){const n=timeMinutes(v);return String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}const d=new Date(s);return !s?'Time not recorded':isNaN(d.getTime())?s:d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});}
function area(value){const text=String(value||'').toUpperCase();if(/PERTH|BLAIRGOWRIE|PITLOCHRY|AUCHTERARDER|DUNKELD|ABERFELDY|CRIEFF|KINROSS|BALLINLUIG|INVERALMOND|NEWBURGH/.test(text))return'PERTH';if(/FIFE|DUNFERMLINE|KIRKCALDY|LEVEN|GLENROTHES|ST ANDREWS|CUPAR|ROSYTH|INVERKEITHING|FERRYTOLL|HALBEATH|DALGETY|METHIL|ANSTRUTHER|TAYPORT|KELTY|COWDENBEATH|LOCHGELLY|NEWPORT/.test(text))return'FIFE';if(/ANGUS|ARBROATH|FORFAR|MONTROSE|BRECHIN|KIRRIEMUIR|CARNOUSTIE|MONIFIETH|EDZELL|STRACATHRO|GLAMIS|MIDGRIP|FERRYDEN/.test(text))return'ANGUS';if(/DUNDEE|NINEWELLS/.test(text))return'DUNDEE';if(/EDINBURGH|MUSSELBURGH|WALLYFORD|PORT SETON|LIVINGSTON/.test(text))return'EDINBURGH';if(/GLASGOW|STIRLING|FALKIRK|ALLOA/.test(text))return'CENTRAL';return'';}
function inspectionRows(){try{const a=(window.cloud&&Array.isArray(cloud.Inspections))?cloud.Inspections.slice():[];if(!a.length)return[];const h=(a[0]||[]).map(x=>String(x||'').toLowerCase());return h.some(x=>['date','driver','service','fleet'].includes(x))?a.slice(1):a;}catch(e){return[];}}
function inRange(v,from,to){const d=parseDate(v);if(from&&d<new Date(from+'T00:00:00'))return false;if(to&&d>new Date(to+'T23:59:59'))return false;return true;}
function codesFor(s){return [...new Set([s.code,...(Array.isArray(s.aliases)?s.aliases:[])].flatMap(code=>String(code||'').split(/[/,;&]+/)).map(norm).filter(Boolean))];}
function serviceCounts(){const counts={};(typeof serviceDefs!=='undefined'?serviceDefs:[]).forEach(s=>codesFor(s).forEach(code=>counts[code]=(counts[code]||0)+1));return counts;}
function latestMap(from,to){
 const map={};
 function add(item){
  if(!item.service||!inRange(item.date,from,to))return;
  const code=norm(item.service);if(!code)return;
  const recordArea=area([item.depot,item.location,item.destination].filter(Boolean).join(' '));
  const key=code+'|'+recordArea;
  const record={...item,area:recordArea};
  if(!map[key]||checkStamp(record)>checkStamp(map[key]))map[key]=record;
 }
 inspectionRows().forEach(r=>{if(!Array.isArray(r)||r.length<10)return;add({date:r[0],time:r[1],inspector:r[2]||'',depot:r[3]||'',driver:r[4]||'',service:r[5]||'',fleet:r[6]||'',location:r[8]||'',destination:r[9]||'',source:'Inspection'});});
 function timing(sheet){try{
  const rows=typeof dataRows==='function'?dataRows(sheet):((cloud&&cloud[sheet])||[]).filter(r=>Array.isArray(r)&&r.length>=12);
  rows.forEach(r=>{if(!Array.isArray(r)||r.length<12)return;add({date:r[0],time:r[1],inspector:r[2]||'',location:r[3]||'',service:r[4]||'',destination:r[5]||'',fleet:r[6]||'',driver:r[7]||'',source:'Timing Check'});});
 }catch(e){console.warn('Unable to read coverage checks from '+sheet,e);}}
 timing('Timing Checks');
 timing('Early Running');
 return map;
}
function matchService(service,map,counts){const serviceArea=area(service.route),codes=codesFor(service);for(const code of codes){const exact=map[code+'|'+serviceArea]||null;if(exact)return exact;}const candidates=[];codes.forEach(code=>{if((counts[code]||0)>1)return;Object.keys(map).filter(k=>k.indexOf(code+'|')===0).forEach(k=>candidates.push(map[k]));});return candidates.sort((a,b)=>checkStamp(b)-checkStamp(a))[0]||null;}
function addStyle(){if($('coverageRangeCss'))return;const s=document.createElement('style');s.id='coverageRangeCss';s.textContent='#coverageRangeControls{margin-top:10px}.coverageModeButtons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.coverageCard.recent{background:#10382e!important;border-left-color:#45aa79!important}.coverageCard.never{background:#192535!important;border-left-color:#778694!important}.coverageStatus{font-size:12px;font-weight:900;letter-spacing:.04em;margin-bottom:3px}.coverageCard.recent .coverageStatus{color:#8fe3b8}.coverageCard.never .coverageStatus{color:#bdc8d0}#coverageRefresh{margin:10px 0 0;width:100%}@media(max-width:620px){.coverageModeButtons{grid-template-columns:1fr}}.coverageModeButtons button.active{background:#eea83e;color:#0b1b2b}.coverageDatePanel{display:none;margin-top:10px}.coverageDatePanel.active{display:grid;grid-template-columns:1fr 1fr;gap:8px}.coverageDatePanel label{font-size:12px;color:#b8c5ce}.coverageDatePanel input{margin-top:4px}#toggleServiceEditBtn,#serviceEditPanel{display:none!important}@media(max-width:620px){.coverageDatePanel.active{grid-template-columns:1fr}}';document.head.appendChild(s);}
function build(){const sec=$('coverage'),search=$('coverageSearch');if(!sec||!search||$('coverageRangeControls'))return false;const old=search.parentElement.querySelector('.filterBar');if(old)old.style.display='none';const edit=$('toggleServiceEditBtn');if(edit)edit.remove();const editPanel=$('serviceEditPanel');if(editPanel)editPanel.remove();const box=document.createElement('div');box.id='coverageRangeControls';box.innerHTML='<div class="coverageModeButtons"><button type="button" class="btn" id="coverageAllBtn">ALL SERVICES</button><button type="button" class="btn" id="coverageCheckedBtn">CHECKED</button><button type="button" class="btn" id="coverageNotCheckedBtn">NOT CHECKED</button></div><div class="coverageDatePanel" id="coverageCheckedDates"><label>Checked from<input class="field" type="date" id="coverageCheckedFrom"></label><label>Checked to<input class="field" type="date" id="coverageCheckedTo"></label></div><div class="coverageDatePanel" id="coverageNotCheckedDates"><label>Not checked from<input class="field" type="date" id="coverageNotCheckedFrom"></label><label>Not checked to<input class="field" type="date" id="coverageNotCheckedTo"></label></div><button type="button" class="btn" id="coverageRefresh">REFRESH SHARED CHECKS</button><div class="small" id="coverageCloudMessage" role="status"></div>';search.insertAdjacentElement('afterend',box);['coverageCheckedFrom','coverageCheckedTo','coverageNotCheckedFrom','coverageNotCheckedTo'].forEach(id=>{const e=$(id);e.value=localStorage.getItem(id)||'';e.onchange=()=>{localStorage.setItem(id,e.value);render();};});$('coverageAllBtn').onclick=()=>{mode='all';localStorage.setItem('coverageViewMode20261030',mode);render();};$('coverageCheckedBtn').onclick=()=>{mode='checked';localStorage.setItem('coverageViewMode20261030',mode);render();};$('coverageNotCheckedBtn').onclick=()=>{mode='notchecked';localStorage.setItem('coverageViewMode20261030',mode);render();};$('coverageRefresh').onclick=refreshSharedChecks;return true;}
function render(){
 const el=$('coverageList'),summary=$('coverageSummary');
 if(typeof serviceDefs==='undefined'||!el||!summary)return;
 const checked=mode==='checked',notchecked=mode==='notchecked';
 $('coverageAllBtn')?.classList.toggle('active',mode==='all');
 $('coverageCheckedBtn')?.classList.toggle('active',checked);
 $('coverageNotCheckedBtn')?.classList.toggle('active',notchecked);
 $('coverageCheckedDates')?.classList.toggle('active',checked);
 $('coverageNotCheckedDates')?.classList.toggle('active',notchecked);
 const from=mode==='all'?'':($(checked?'coverageCheckedFrom':'coverageNotCheckedFrom')?.value||'');
 const to=mode==='all'?'':($(checked?'coverageCheckedTo':'coverageNotCheckedTo')?.value||'');
 const map=latestMap(from,to),counts=serviceCounts(),q=String($('coverageSearch')?.value||'').toLowerCase();
 const all=serviceDefs.map((s,i)=>({code:s.code,route:s.route,aliases:s.aliases||[],i,last:matchService(s,map,counts)}));
 const filtered=all.filter(x=>(mode==='all'||(checked?!!x.last:!x.last))&&(!q||(String(x.code)+' '+String(x.route)).toLowerCase().includes(q)));
 filtered.sort((a,b)=>String(a.code).localeCompare(String(b.code),undefined,{numeric:true})||String(a.route).localeCompare(String(b.route)));
 el.innerHTML=filtered.map(x=>{
  const checked=!!x.last;
  const meta=checked?('Checked '+displayDate(x.last.date)+' at '+displayTime(x.last.time)+' • Inspector: '+(x.last.inspector||'Not recorded')+' • '+(x.last.source||'Check')+' • Fleet '+(x.last.fleet||'-')+' • '+(x.last.location||x.last.depot||'-')):'No recorded inspection or timing check'+(mode==='all'?'':' within selected dates');
  return '<div class="coverageCard '+(checked?'recent':'never')+'"><div class="coverageTop"><div><div class="coverageCode">'+html(x.code)+'</div><div class="coverageRoute">'+html(x.route)+'</div></div></div><div class="coverageMeta"><div class="coverageStatus">'+(checked?'✓ CHECKED':'NOT YET CHECKED')+'</div>'+html(meta)+'</div></div>';
 }).join('')||'<div class="small">No services match this filter.</div>';
 const checkedCount=all.filter(x=>x.last).length;
 summary.innerHTML='<div class="coverageStat"><b>'+all.length+'</b>Total Services</div><div class="coverageStat"><b>'+checkedCount+'</b>Checked</div><div class="coverageStat"><b>'+(all.length-checkedCount)+'</b>Not Checked</div>';
}
let coverageRefreshing=false;
async function refreshSharedChecks(){
 if(coverageRefreshing||typeof fetchCloudSheet!=='function')return;
 coverageRefreshing=true;const btn=$('coverageRefresh'),message=$('coverageCloudMessage');
 if(btn){btn.disabled=true;btn.textContent='REFRESHING…';}if(message)message.textContent='Reading shared Google Sheets records…';
 const results=await Promise.allSettled(['Inspections','Timing Checks','Early Running'].map(name=>fetchCloudSheet(name)));
 const failed=results.filter(r=>r.status==='rejected').length;
 if(message)message.textContent=failed?('Some records could not be refreshed ('+failed+' source'+(failed===1?'':'s')+'). Showing available checks.'):'Shared records updated.';
 if(btn){btn.disabled=false;btn.textContent='REFRESH SHARED CHECKS';}
 coverageRefreshing=false;render();
}
function init(){
 addStyle();
 let tries=0;
 const timer=setInterval(()=>{tries++;if(build()||tries>40){clearInterval(timer);render();}},250);
 window.renderCoverage=render;
 document.addEventListener('input',e=>{if(e.target.id==='coverageSearch')render();});
 document.addEventListener('click',e=>{if(e.target.closest('[data-open="coverage"]'))setTimeout(refreshSharedChecks,50);});
 setInterval(()=>{if($('coverage')?.classList.contains('active'))refreshSharedChecks();},60000);
 setTimeout(render,1800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();