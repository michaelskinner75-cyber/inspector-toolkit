(function(){
'use strict';
const $=id=>document.getElementById(id);
const clean=v=>String(v||'').normalize('NFKD').toLowerCase().replace(/[’']/g,'').replace(/\b(employee|emp|driver|number|no)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function reportType(v){
 const s=String(v||'').trim().toLowerCase();
 if(s==='offence report submitted')return'reported';
 if(s==='advised')return'advised';
 return'clear';
}
function addStyle(){if($('driverHistoryWarningCss'))return;const s=document.createElement('style');s.id='driverHistoryWarningCss';s.textContent=`
#driverHistoryWarning{display:none;width:100%;box-sizing:border-box;border-radius:12px;padding:13px 14px;margin:8px 0 10px;line-height:1.4}
#driverHistoryWarning.show{display:block!important}
#driverHistoryWarning.first{background:#102f55;border:2px solid #4c9bea;color:#e8f4ff}
#driverHistoryWarning.clear{background:#123e2b;border:2px solid #3fc17f;color:#e8fff3}
#driverHistoryWarning.advised{background:#4b3510;border:2px solid #e2a52b;color:#fff4d6}
#driverHistoryWarning.reported{background:#551c22;border:2px solid #e24e5b;color:#ffe7e9}
#driverHistoryWarning .t{font-size:17px;font-weight:900;margin-bottom:6px}
#driverHistoryWarning .sub{font-size:13px;opacity:.92}
#driverHistoryWarning .item{padding:10px 0;border-top:1px solid rgba(255,255,255,.22)}
#driverHistoryWarning .item:first-of-type{border-top:0}
#driverHistoryWarning .reason{margin-top:4px;font-weight:800;white-space:pre-wrap}
#driverHistoryWarning .viewFullReport{margin-top:8px;width:100%;padding:10px;border:1px solid rgba(255,255,255,.45);border-radius:9px;background:rgba(0,0,0,.2);color:#fff;font-weight:900}
`;document.head.appendChild(s);}
function ensure(){const d=$('csDriver');if(!d)return null;let w=$('driverHistoryWarning');if(!w){w=document.createElement('div');w.id='driverHistoryWarning';w.setAttribute('role','status');}const a=$('driverSuggestionWrap')||$('csEmployeeLookupStatus')||d;if(w.parentElement!==a.parentElement||a.nextElementSibling!==w)a.insertAdjacentElement('afterend',w);return w;}
function hide(){const w=$('driverHistoryWarning');if(w){w.className='';w.innerHTML='';}}
function same(a,b){const strip=s=>clean(s).replace(/\b\d{3,}\b/g,'').trim().replace(/\s+/g,' ');const x=strip(a),y=strip(b);return !!x&&!!y&&(x===y||(x.length>=5&&y.length>=5&&(x.startsWith(y+' ')||y.startsWith(x+' '))));}
function stripHeader(rows){if(!rows.length)return rows;const first=(rows[0]||[]).map(v=>clean(v));return first.some(v=>['date','time','inspector','driver','fleet','service','depot','location'].includes(v))?rows.slice(1):rows;}
function getRows(sheet){
 try{if(typeof cloud!=='undefined'&&cloud&&Array.isArray(cloud[sheet])&&cloud[sheet].length)return stripHeader(cloud[sheet].slice());}catch(e){}
 try{const local=JSON.parse(localStorage.getItem('local_'+sheet)||'[]');return Array.isArray(local)?local:[];}catch(e){return[];}
}
function historyRows(){
 const checks=getRows('Inspections').map(r=>({type:reportType(r[13]),date:r[0],driver:r[4],reason:r[14],source:'inspection'}));
 const reports=getRows('Driver Reports').map(r=>({type:reportType(r[5]),date:r[0],driver:r[3],reason:r[6],source:'driver-report'}));
 return [...checks,...reports];
}
function openFullReport(driver){if(typeof openSection==='function')openSection('reportSearch');const search=$('reportSearchText');if(search){search.value=driver;search.dispatchEvent(new Event('input',{bubbles:true}));}const type=$('reportType');if(type)type.value='all';if(typeof window.renderReportSearch==='function')window.renderReportSearch();setTimeout(()=>$('reportSearch')?.scrollIntoView({behavior:'smooth',block:'start'}),100);}
function render(){
 const d=$('csDriver'),w=ensure();if(!d||!w)return;const name=d.value.trim();if(!name){hide();return;}
 const seen=new Set();
 const matches=historyRows().filter(x=>{
  if(!same(x.driver,name))return false;
  const key=[clean(x.driver),String(x.date||''),x.type,clean(x.reason)].join('|');
  if(seen.has(key))return false;seen.add(key);return true;
 });
 if(!matches.length){w.className='show first';w.innerHTML='<div class="t">🔵 1ST TIME CHECK</div><div class="sub">No previous inspector checks were found for this driver.</div>';return;}
 const reported=matches.filter(x=>x.type==='reported');
 const advised=matches.filter(x=>x.type==='advised');
 let cls='clear',title='🟢 PREVIOUSLY CHECKED — NO ISSUES',relevant=matches;
 if(reported.length){cls='reported';title='🔴 PREVIOUS OFFENCE REPORT SUBMITTED';relevant=reported;}
 else if(advised.length){cls='advised';title='🟡 PREVIOUSLY ADVISED';relevant=advised;}
 w.className='show '+cls;
 if(cls==='clear'){
  const latest=matches[matches.length-1];
  w.innerHTML='<div class="t">'+title+'</div><div class="sub">Previously checked '+matches.length+' time'+(matches.length===1?'':'s')+(latest?.date?' — most recent '+esc(latest.date):'')+'.</div><button type="button" class="viewFullReport" data-history-driver="'+esc(name)+'">VIEW PREVIOUS CHECKS</button>';
  return;
 }
 relevant.reverse();
 w.innerHTML='<div class="t">'+title+'</div>'+relevant.map(x=>'<div class="item"><b>'+(x.type==='reported'?'Offence Report Submitted':'Advised')+' — '+esc(x.date||'Date not recorded')+'</b><div class="reason">'+esc(x.reason||'No reason entered')+'</div><button type="button" class="viewFullReport" data-history-driver="'+esc(name)+'">VIEW FULL REPORT</button></div>').join('');
}
function init(){addStyle();ensure();const d=$('csDriver');if(!d)return;['input','change','blur'].forEach(ev=>d.addEventListener(ev,()=>setTimeout(render,100)));const clear=$('clearCheckFormBtn');if(clear)clear.addEventListener('click',()=>{hide();setTimeout(hide,50);});document.addEventListener('click',e=>{if(e.target.closest('[data-driver-suggestion]'))setTimeout(render,180);const b=e.target.closest('.viewFullReport');if(b){e.preventDefault();e.stopPropagation();openFullReport(b.dataset.historyDriver||d.value);}});const status=$('syncStatus');if(status)new MutationObserver(()=>{if(/loaded/i.test(status.textContent||''))setTimeout(render,50);}).observe(status,{childList:true,subtree:true,characterData:true});[1200,3000,6000].forEach(ms=>setTimeout(render,ms));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();