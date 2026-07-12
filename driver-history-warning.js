(function(){
'use strict';
const $=id=>document.getElementById(id);
const clean=v=>String(v||'').normalize('NFKD').toLowerCase().replace(/[’']/g,'').replace(/\b(employee|emp|driver|number|no)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function typeOf(v){const s=clean(v);if(!s||s.includes('no driver report'))return'';if(s.includes('report')||s.includes('offence')||s.includes('submitted'))return'reported';if(s.includes('advis'))return'advised';return'';}
function addStyle(){if($('driverHistoryWarningCss'))return;const s=document.createElement('style');s.id='driverHistoryWarningCss';s.textContent=`
#driverHistoryWarning{display:none;width:100%;box-sizing:border-box;border-radius:12px;padding:13px 14px;margin:8px 0 10px;line-height:1.4}
#driverHistoryWarning.show{display:block!important}
#driverHistoryWarning.advised{background:#4b3510;border:2px solid #e2a52b;color:#fff4d6}
#driverHistoryWarning.reported{background:#551c22;border:2px solid #e24e5b;color:#ffe7e9}
#driverHistoryWarning .t{font-size:17px;font-weight:900;margin-bottom:8px}
#driverHistoryWarning .item{padding:10px 0;border-top:1px solid rgba(255,255,255,.22)}
#driverHistoryWarning .item:first-of-type{border-top:0}
#driverHistoryWarning .reason{margin-top:4px;font-weight:800;white-space:pre-wrap}
#driverHistoryWarning .viewFullReport{margin-top:8px;width:100%;padding:10px;border:1px solid rgba(255,255,255,.45);border-radius:9px;background:rgba(0,0,0,.2);color:#fff;font-weight:900}
`;document.head.appendChild(s);}
function ensure(){const d=$('csDriver');if(!d)return null;let w=$('driverHistoryWarning');if(!w){w=document.createElement('div');w.id='driverHistoryWarning';w.setAttribute('role','alert');}const a=$('driverSuggestionWrap')||$('csEmployeeLookupStatus')||d;if(w.parentElement!==a.parentElement||a.nextElementSibling!==w)a.insertAdjacentElement('afterend',w);return w;}
function hide(){const w=$('driverHistoryWarning');if(w){w.className='';w.innerHTML='';}}
function same(a,b){const strip=s=>clean(s).replace(/\b\d{3,}\b/g,'').trim().replace(/\s+/g,' ');const x=strip(a),y=strip(b);return !!x&&!!y&&(x===y||(x.length>=5&&y.length>=5&&(x.startsWith(y+' ')||y.startsWith(x+' '))));}
function inspectionRows(){let rows=[];try{if(typeof cloud!=='undefined'&&cloud&&Array.isArray(cloud['Inspections']))rows=cloud['Inspections'].slice();}catch(e){}if(rows.length){const first=(rows[0]||[]).map(v=>clean(v));if(first.some(v=>['date','time','inspector','driver','fleet','service','depot','location'].includes(v)))rows=rows.slice(1);}try{const local=JSON.parse(localStorage.getItem('local_Inspections')||'[]');if(Array.isArray(local))rows=rows.concat(local);}catch(e){}return rows;}
function openFullReport(driver){if(typeof openSection==='function')openSection('reportSearch');const search=$('reportSearchText');if(search){search.value=driver;search.dispatchEvent(new Event('input',{bubbles:true}));}const type=$('reportType');if(type)type.value='all';if(typeof window.renderReportSearch==='function')window.renderReportSearch();setTimeout(()=>$('reportSearch')?.scrollIntoView({behavior:'smooth',block:'start'}),100);}
function render(){const d=$('csDriver'),w=ensure();if(!d||!w)return;const name=d.value.trim();if(!name){hide();return;}const seen=new Set();const hits=inspectionRows().map(r=>({type:typeOf(r[13]),date:r[0],driver:r[4],reason:r[14]})).filter(x=>{if(!x.type||!same(x.driver,name))return false;const key=[clean(x.driver),String(x.date||''),x.type,clean(x.reason)].join('|');if(seen.has(key))return false;seen.add(key);return true;});if(!hits.length){hide();return;}hits.reverse();const reported=hits.some(x=>x.type==='reported');w.className='show '+(reported?'reported':'advised');w.innerHTML='<div class="t">'+(reported?'⚠️ PREVIOUS REPORTED ISSUE':'⚠️ PREVIOUS ADVICE RECORDED')+'</div>'+hits.map(x=>'<div class="item"><b>'+(x.type==='reported'?'Reported':'Advised')+' — '+esc(x.date||'Date not recorded')+'</b><div class="reason">'+esc(x.reason||'No offence or advisory reason entered')+'</div><button type="button" class="viewFullReport" data-history-driver="'+esc(name)+'">VIEW FULL REPORT</button></div>').join('');}
function init(){addStyle();ensure();const d=$('csDriver');if(!d)return;['input','change','blur'].forEach(ev=>d.addEventListener(ev,()=>setTimeout(render,100)));const clear=$('clearCheckFormBtn');if(clear)clear.addEventListener('click',()=>{hide();setTimeout(hide,50);});document.addEventListener('click',e=>{if(e.target.closest('[data-driver-suggestion]'))setTimeout(render,180);const b=e.target.closest('.viewFullReport');if(b){e.preventDefault();e.stopPropagation();openFullReport(b.dataset.historyDriver||d.value);}});[1200,3000,6000].forEach(ms=>setTimeout(render,ms));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();