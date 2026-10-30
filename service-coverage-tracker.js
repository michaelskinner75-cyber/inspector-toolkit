(function(){
'use strict';
const $=id=>document.getElementById(id), M=window.InspectorCoverageModel;
if(!M)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>c==='&'?'&amp;':c==='<'?'&lt;':c==='>'?'&gt;':c==='"'?'&quot;':'&#39;');
const today=()=>M.date(new Date()),clock=()=>new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});
let filter='all',editing='',lastRefresh=0,refreshing=null;
function group(s){const c=String(s.code||'').toUpperCase();if(c.startsWith('X'))return'X';if(/^[A-Z]/.test(c))return'OTHER';const n=parseInt(c,10);return Number.isNaN(n)||n>=100?'OTHER':String(Math.floor(n/10)*10);}
function editBox(s){
 const item=s.override&&s.override.status!=='AUTO'?s.override:s.item;
 const state=s.override?.status==='NOT_CHECKED'?'NOT_CHECKED':s.item?'CHECKED':'NOT_CHECKED';
 const inspector=item?.inspector||((typeof getInspector==='function')?getInspector():'');
 return '<form class="sctEdit" data-sct-form="'+esc(s.id)+'"><label>Status<select class="field" name="status"><option value="CHECKED" '+(state==='CHECKED'?'selected':'')+'>Checked</option><option value="NOT_CHECKED" '+(state==='NOT_CHECKED'?'selected':'')+'>Not checked</option><option value="AUTO">Return to automatic tracking</option></select></label><label>Inspector<input name="inspector" class="field" value="'+esc(inspector)+'"></label><label>Date checked<input name="date" type="date" class="field" value="'+esc(item?.date||today())+'"></label><label>Time checked<input name="time" type="time" class="field" value="'+esc(item?.time||clock())+'"></label><div class="sctActions"><button class="btn" type="submit">SAVE CHANGES</button><button class="btn danger" type="button" data-sct-cancel>CANCEL</button></div><div class="small">Amendments are shared; the original inspection record is unchanged.</div></form>';
}
function render(){
 const list=$('coverageList'),summary=$('coverageSummary');if(!list||!summary)return;
 const all=M.status(M.defs(),$('sctFrom')?.value||'',$('sctTo')?.value||'');
 const checked=all.filter(x=>x.checked).length;
 summary.innerHTML='<div class="coverageStat"><b>'+all.length+'</b>Total services</div><div class="coverageStat"><b>'+checked+'</b>Checked</div><div class="coverageStat"><b>'+(all.length-checked)+'</b>Still to check</div>';
 const q=String($('coverageSearch')?.value||'').toLowerCase(),g=$('sctGroup')?.value||'ALL';
 const entries=all.filter(s=>(filter==='all'||(filter==='checked'?s.checked:!s.checked))&&(g==='ALL'||group(s)===g)&&(!q||(s.code+' '+(s.route||'')).toLowerCase().includes(q))).sort((a,b)=>String(a.code).localeCompare(String(b.code),undefined,{numeric:true})||String(a.route).localeCompare(String(b.route)));
 if($('sctCount'))$('sctCount').textContent=entries.length+' service'+(entries.length===1?'':'s')+' shown';
 document.querySelectorAll('[data-sct-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.sctFilter===filter);b.setAttribute('aria-pressed',String(b.dataset.sctFilter===filter));});
 list.innerHTML=entries.map(s=>{
  const item=s.item,manually=s.override&&s.override.status!=='AUTO';
  const detail=item?esc(item.date)+' '+esc(item.time||'')+' • '+esc(item.inspector||'Inspector not recorded')+' • '+esc(item.kind||'Inspection')+(manually?' • Manually amended':''):'No check recorded for selected dates'+(manually?' • Manually marked not checked':'');
  return '<article class="sctCard '+(s.checked?'isChecked':'isPending')+'"><div class="sctMain"><div class="sctInfo"><div class="sctTitle">'+esc(s.code)+' <span class="sctState">'+(s.checked?'Checked':'Not checked')+'</span></div><div class="sctRoute">'+esc(s.route||'')+'</div><div class="sctDetail">'+detail+'</div></div><button type="button" class="btn" data-sct-edit="'+esc(s.id)+'">AMEND</button></div>'+(editing===s.id?editBox(s):'')+'</article>';
 }).join('')||'<div class="small">No services match this view.</div>';
}
async function refresh(){
 if(refreshing)return refreshing;
 if($('sctStatus'))$('sctStatus').textContent='Refreshing shared records…';
 refreshing=(async()=>{
  const names=['Inspections','Timing Checks','Early Running','Services'];
  const results=await Promise.allSettled(names.map(fetchCloudSheet));
  const ok=results.filter(r=>r.status==='fulfilled').length;lastRefresh=Date.now();
  if($('sctStatus'))$('sctStatus').textContent=ok===names.length?'Shared checks updated.':ok+' of '+names.length+' sources updated; some data may be delayed.';
  render();
 })().catch(e=>{if($('sctStatus'))$('sctStatus').textContent='Could not refresh all shared records.';console.warn(e);}).finally(()=>{refreshing=null;});
 return refreshing;
}
async function save(e){
 e.preventDefault();const form=e.target,service=M.defs().find(s=>s.id===form.dataset.sctForm);if(!service)return;
 const status=form.elements.namedItem('status').value,inspector=form.elements.namedItem('inspector').value.trim(),date=form.elements.namedItem('date').value,time=form.elements.namedItem('time').value;
 if(status==='CHECKED'&&(!inspector||!date||!time)){alert('Enter inspector, date and time for a checked service.');return;}
 const by=typeof getInspector==='function'?getInspector():'';if(!by){alert('Log in as an inspector first.');return;}
 const op='sct'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
 // "cov:" rows have blank service codes, so Service Directory ignores them.
 const row=[new Date().toISOString(),'COVERAGE','cov:'+service.id,'',status,date,time,inspector,by,op];
 const button=form.querySelector('[type=submit]'),label=$('sctStatus');
 button.disabled=true;button.textContent='SAVING…';if(label)label.textContent='Submitting amendment to shared records…';
 try{
  await cloudAppend('Services',row);editing='';render();
  if(label)label.textContent='Amendment submitted. Checking shared copy…';
  await new Promise(resolve=>setTimeout(resolve,650));
  await fetchCloudSheet('Services');
  const verified=M.rows('Services').some(r=>String(r[9]||'')===op);
  if(label)label.textContent=verified?'Amendment saved and confirmed across devices.':'Amendment submitted but not confirmed across devices. Use Refresh to verify.';
  render();
 }catch(err){
  console.warn('Coverage amendment not confirmed',err);
  if(label)label.textContent='Could not confirm the shared amendment. Refresh before trying again.';
  if(button){button.disabled=false;button.textContent='SAVE CHANGES';}
 }
}
function start(){
 if(!$('coverage')||!$('coverageList')||$('sctControls'))return false;
 const section=$('coverage');
 section.querySelector('.filterBar')?.remove();$('toggleServiceEditBtn')?.remove();$('serviceEditPanel')?.remove();
 const box=document.createElement('div');box.id='sctControls';box.className='panel';
 box.innerHTML='<div class="sctFilters"><button class="btn active" type="button" data-sct-filter="all">ALL SERVICES</button><button class="btn" type="button" data-sct-filter="checked">CHECKED</button><button class="btn" type="button" data-sct-filter="pending">NOT CHECKED</button></div><div class="sctDateFilters"><label>Checked from<input class="field" id="sctFrom" type="date"></label><label>Checked until<input class="field" id="sctTo" type="date"></label><label>Service group<select class="field" id="sctGroup"><option value="ALL">All services</option><option value="0">1–9</option><option value="10">10–19</option><option value="20">20–29</option><option value="30">30–39</option><option value="40">40–49</option><option value="50">50–59</option><option value="60">60–69</option><option value="70">70–79</option><option value="80">80–89</option><option value="90">90–99</option><option value="X">X Services</option><option value="OTHER">Other services</option></select></label></div><div class="sctFooter"><span class="small" id="sctCount"></span><button class="btn" type="button" id="sctRefresh">REFRESH SHARED CHECKS</button></div><div class="small" role="status" id="sctStatus">Checks update automatically. Tap Amend to change date, time or inspector.</div>';
 const search=$('coverageSearch');if(search){search.placeholder='Search service or route';search.insertAdjacentElement('afterend',box);}else section.insertBefore(box,$('coverageList'));
 section.querySelectorAll('[data-sct-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.sctFilter;render();}));
 ['sctFrom','sctTo','sctGroup'].forEach(id=>$(id).addEventListener('change',render));
 $('sctRefresh').addEventListener('click',refresh);
 section.addEventListener('click',e=>{const b=e.target.closest('[data-sct-edit]');if(b){editing=editing===b.dataset.sctEdit?'':b.dataset.sctEdit;render();}if(e.target.closest('[data-sct-cancel]')){editing='';render();}});
 section.addEventListener('submit',e=>{if(e.target.matches('[data-sct-form]'))save(e);});
 search?.addEventListener('input',render);
 window.renderCoverage=render;render();setTimeout(refresh,400);
 document.addEventListener('click',e=>{if(e.target.closest('[data-open="coverage"]'))setTimeout(()=>{if(Date.now()-lastRefresh>20000)refresh();},200);});
 setInterval(()=>{if(section.classList.contains('active')&&Date.now()-lastRefresh>55000)refresh();},60000);
 return true;
}
const style=document.createElement('style');
style.textContent='#sctControls .sctFilters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}#sctControls .sctFilters .active{background:#eea83e;color:#091c2b}#sctControls .sctDateFilters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:12px}#sctControls label,.sctEdit label{display:block;font-size:12px;font-weight:800;color:#c6d6e1}#sctControls label .field,.sctEdit label .field{display:block;box-sizing:border-box;width:100%;min-width:0;margin-top:5px}#sctControls .sctFooter{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;flex-wrap:wrap}.sctCard{padding:13px;margin:9px 0;background:#102b40;border-left:6px solid #b46a68;border-radius:12px}.sctCard.isChecked{border-left-color:#459679}.sctMain{display:flex;align-items:center;justify-content:space-between;gap:10px}.sctInfo{min-width:0;flex:1}.sctTitle{font-size:18px;font-weight:900}.sctState{font-size:11px;font-weight:800;color:#c9d6e0;margin-left:6px}.sctRoute{font-size:13px;overflow-wrap:anywhere}.sctDetail{margin-top:5px;font-size:12px;color:#bed0da;overflow-wrap:anywhere}.sctEdit{margin-top:12px;padding-top:12px;border-top:1px solid #386077;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sctEdit .sctActions,.sctEdit .small{grid-column:1/-1}.sctActions{display:flex;gap:9px;flex-wrap:wrap}@media(max-width:620px){#sctControls .sctDateFilters,.sctEdit{grid-template-columns:1fr}#sctControls .sctFilters{grid-template-columns:repeat(2,minmax(0,1fr))}#sctControls .sctFilters button,.sctMain button,.sctActions button{min-height:44px}}';
document.head.appendChild(style);
let count=0;const timer=setInterval(()=>{if(start()||++count>80)clearInterval(timer);},200);
})();