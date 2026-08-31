(function(){
'use strict';

const $=id=>document.getElementById(id);
const SHEET='Ember E20';
const LOCATION='Edinburgh Airport';
const SERVICE='E20';
const LAUNCH='Wednesday 2 September 2026';

function inspector(){
  try{
    if(typeof getInspector==='function')return getInspector()||'';
  }catch(e){}
  return localStorage.getItem('activeInspector')||'';
}
function nowGb(){
  try{return typeof now==='function'?normaliseTimeForSave(now()):new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});}
  catch(e){return new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});}
}
function dateGb(){
  try{return typeof normaliseDateForSave==='function'?normaliseDateForSave(''):new Date().toLocaleDateString('en-GB');}
  catch(e){return new Date().toLocaleDateString('en-GB');}
}
function uid(){
  return 'E20-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
}
function minsDiff(scheduled,actual){
  if(!scheduled||!actual)return null;
  const [sh,sm]=scheduled.split(':').map(Number);
  const [ah,am]=actual.split(':').map(Number);
  if([sh,sm,ah,am].some(Number.isNaN))return null;
  let d=(ah*60+am)-(sh*60+sm);
  if(d>720)d-=1440;
  if(d<-720)d+=1440;
  return d;
}
function punct(d){
  if(d===null||d===undefined||d==='')return '';
  d=Number(d);
  if(d===0)return 'ON TIME';
  if(d<0)return Math.abs(d)+' MIN'+(Math.abs(d)===1?'':'S')+' EARLY';
  return d+' MIN'+(d===1?'':'S')+' LATE';
}
function safe(v){
  return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function numberValue(id){
  const v=$(id)?.value;
  return v===''||v==null?'':Math.max(0,Number(v)||0);
}
function setStatus(text,kind=''){
  const el=$('emberStatus');
  if(!el)return;
  el.textContent=text;
  el.className='emberStatus '+kind;
}
function updatePreview(){
  const d=minsDiff($('emberScheduled')?.value,$('emberActual')?.value);
  const el=$('emberPunctuality');
  if(!el)return;
  el.textContent=d===null?'Enter scheduled and actual times':punct(d);
  el.className='emberPunctuality '+(d===null?'neutral':d<0?'early':d>0?'late':'ontime');
}
function resetForm(){
  ['emberScheduled','emberActual','emberVehicle','emberPassengersOff','emberPassengersOn','emberLoadAfter','emberStance','emberConflictMinutes','emberNotes'].forEach(id=>{if($(id))$(id).value='';});
  if($('emberType'))$('emberType').value='Departure';
  if($('emberCorrectStance'))$('emberCorrectStance').value='';
  if($('ember747'))$('ember747').value='None';
  if($('ember787'))$('ember787').value='None';
  if($('emberIssue'))$('emberIssue').value='None';
  updatePreview();
}
function rowFromForm(){
  const type=$('emberType').value;
  const scheduled=$('emberScheduled').value;
  const actual=$('emberActual').value;
  const d=minsDiff(scheduled,actual);
  return [
    uid(),dateGb(),nowGb(),inspector(),type,scheduled,actual,d===null?'':d,punct(d),
    $('emberVehicle').value.trim(),numberValue('emberPassengersOff'),numberValue('emberPassengersOn'),
    numberValue('emberLoadAfter'),$('emberStance').value.trim(),$('emberCorrectStance').value,
    numberValue('emberConflictMinutes'),$('ember747').value,$('ember787').value,$('emberIssue').value,
    $('emberNotes').value.trim(),LOCATION,SERVICE
  ];
}
function validate(){
  const type=$('emberType').value;
  const movement=type==='Departure'||type==='Arrival';
  if(movement&&(!$('emberScheduled').value||!$('emberActual').value)){
    alert('Please enter both the scheduled and actual time.');
    return false;
  }
  if(type!=='General'&&!$('emberCorrectStance').value){
    alert('Please confirm whether the E20 used the correct stance.');
    return false;
  }
  const issue=$('emberIssue').value!=='None'||$('ember747').value!=='None'||$('ember787').value!=='None';
  if(issue&&!$('emberNotes').value.trim()){
    alert('Please add a short note explaining the issue or impact.');
    return false;
  }
  return true;
}
async function saveObservation(){
  if(!validate())return;
  const btn=$('saveEmberBtn');
  if(btn)btn.disabled=true;
  setStatus('Saving observation…');
  const row=rowFromForm();
  try{
    if(typeof cloudAppend==='function'){
      await cloudAppend(SHEET,row);
    }else{
      await fetch(WEB_APP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sheet:SHEET,row})});
    }
    setStatus('Saved to Google Sheets.','good');
    resetForm();
    setTimeout(loadSharedData,900);
  }catch(e){
    console.error(e);
    setStatus('Could not send to Google Sheets. Please retry.','bad');
  }finally{
    if(btn)btn.disabled=false;
  }
}
function cleanRows(data){
  if(!Array.isArray(data))return [];
  if(data.length&&Array.isArray(data[0])&&String(data[0][0]||'').trim().toLowerCase()==='id')return data.slice(1);
  return data;
}
function renderSummary(rows){
  const total=rows.length;
  const on=rows.reduce((s,r)=>s+(Number(r[11])||0),0);
  const off=rows.reduce((s,r)=>s+(Number(r[10])||0),0);
  const stanceRows=rows.filter(r=>String(r[14]||'').toLowerCase()==='yes'||String(r[14]||'').toLowerCase()==='no');
  const stanceYes=stanceRows.filter(r=>String(r[14]||'').toLowerCase()==='yes').length;
  const stancePct=stanceRows.length?Math.round(stanceYes/stanceRows.length*100):0;
  const i747=rows.filter(r=>r[16]&&r[16]!=='None').length;
  const i787=rows.filter(r=>r[17]&&r[17]!=='None').length;
  const early=rows.filter(r=>Number(r[7])<0).length;
  const late=rows.filter(r=>Number(r[7])>0).length;
  const put=(id,v)=>{if($(id))$(id).textContent=v;};
  put('emberStatObs',total);
  put('emberStatOn',on);
  put('emberStatOff',off);
  put('emberStatStance',stanceRows.length?stancePct+'%':'—');
  put('emberStat747',i747);
  put('emberStat787',i787);
  put('emberStatTiming',early+' early • '+late+' late');
}
function renderRecent(rows){
  const el=$('emberRecent');
  if(!el)return;
  if(!rows.length){
    el.innerHTML='<div class="emberEmpty">No E20 observations have been submitted yet.</div>';
    return;
  }
  el.innerHTML=rows.slice().reverse().slice(0,30).map(r=>{
    const movement=r[4]||'Observation';
    const timing=(r[5]||r[6])?('<b>Scheduled '+safe(r[5]||'—')+' • Actual '+safe(r[6]||'—')+'</b> • '+safe(r[8]||'')):'';
    const pax='Off '+safe(r[10]||0)+' • On '+safe(r[11]||0)+(r[12]!==''?' • Load '+safe(r[12]):'');
    const stance='Stance '+safe(r[13]||'—')+' • Correct E: '+safe(r[14]||'—');
    const impacts='747: '+safe(r[16]||'None')+' • 787: '+safe(r[17]||'None');
    const note=r[19]?'<div class="emberNote">'+safe(r[19])+'</div>':'';
    return '<div class="emberLogCard"><div class="emberLogTop"><b>'+safe(movement)+'</b><span>'+safe(r[1]||'')+' '+safe(r[2]||'')+'</span></div><div>'+timing+'</div><div>'+pax+'</div><div>'+stance+'</div><div>'+impacts+' • '+safe(r[18]||'None')+'</div><div class="small">'+safe(r[3]||'Unknown inspector')+(r[9]?' • '+safe(r[9]):'')+'</div>'+note+'</div>';
  }).join('');
}
async function loadSharedData(){
  setStatus('Refreshing shared E20 log…');
  try{
    const res=await fetch(WEB_APP_URL+'?sheet='+encodeURIComponent(SHEET)+'&_='+Date.now(),{cache:'no-store'});
    const json=await res.json();
    const rows=cleanRows(json.data||[]);
    renderSummary(rows);
    renderRecent(rows);
    setStatus('Shared log updated '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false})+'.','good');
  }catch(e){
    console.error(e);
    setStatus('Shared log could not refresh. You can still submit observations.','bad');
  }
}
function addStyles(){
  if($('emberE20Css'))return;
  const s=document.createElement('style');
  s.id='emberE20Css';
  s.textContent=`
  #emberE20Btn{border:2px solid #f4a51c!important;box-shadow:0 0 0 2px rgba(244,165,28,.12) inset}
  .emberHero{display:flex;gap:14px;align-items:center;padding:15px;margin:8px 0 14px;border-radius:16px;background:linear-gradient(135deg,#071b2d,#123c5f);border-left:7px solid #f4a51c}
  .emberHeroIcon{font-size:38px}.emberHero b{display:block;font-size:20px}.emberHero small{display:block;margin-top:4px;opacity:.78}
  .emberInspector{margin:10px 0;padding:10px 12px;border-radius:10px;background:#0d263b;border:1px solid rgba(255,255,255,.12)}
  .emberFieldLabel{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:700;color:#d8e7f2}
  .emberFieldLabel select,.emberFieldLabel input{width:100%;box-sizing:border-box}
  .emberPunctuality{padding:12px;border-radius:10px;text-align:center;font-weight:900;margin:9px 0}.emberPunctuality.neutral{background:#263b4d}.emberPunctuality.ontime{background:#164c3f}.emberPunctuality.early{background:#71530d}.emberPunctuality.late{background:#6a2525}
  .emberStatus{margin:10px 0;padding:10px;border-radius:10px;background:#24394b}.emberStatus.good{background:#164c3f}.emberStatus.bad{background:#6a2525}
  .emberStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:12px 0}.emberStat{padding:12px 8px;border-radius:12px;background:#0d263b;border:1px solid rgba(255,255,255,.1);text-align:center}.emberStat b{display:block;font-size:22px;color:#f4a51c}.emberStat span{font-size:11px;opacity:.8}
  .emberTimingWide{grid-column:1/-1}.emberLogCard{margin:9px 0;padding:12px;border-radius:12px;background:#102a40;border-left:5px solid #f4a51c}.emberLogTop{display:flex;justify-content:space-between;gap:10px}.emberLogTop span{font-size:12px;opacity:.72}.emberNote{margin-top:7px;padding-top:7px;border-top:1px solid rgba(255,255,255,.12)}.emberEmpty{padding:14px;opacity:.72}
  @media(max-width:620px){.emberStats{grid-template-columns:repeat(2,minmax(0,1fr))}.emberHero b{font-size:18px}.emberLogTop{flex-direction:column;gap:2px}}
  `;
  document.head.appendChild(s);
}
function setup(){
  if($('emberE20'))return;
  addStyles();
  const home=$('home');
  const nav=home?.querySelector('.nav');
  if(nav&&!$('emberE20Btn')){
    const b=document.createElement('button');
    b.id='emberE20Btn';
    b.dataset.open='emberE20';
    b.innerHTML='<span class="navIcon">🔥</span>Ember E20 Monitoring';
    nav.insertBefore(b,nav.firstChild);
  }
  const anchor=$('otherLinksTools')||document.querySelector('.section:last-of-type');
  if(!anchor||!anchor.parentNode)return;
  const section=document.createElement('section');
  section.id='emberE20';
  section.className='section';
  section.innerHTML=`
    <button class="backBtn" data-open="home">← Back</button>
    <h2>Ember E20 Monitoring</h2>
    <div class="emberHero"><div class="emberHeroIcon">🔥</div><div><b>Launch Day Monitoring</b><small>${LAUNCH} • E20 Glasgow ↔ Edinburgh Airport • Expected stance E</small></div></div>
    <div class="emberInspector">Submitting as <strong id="emberInspectorName"></strong></div>
    <div class="panel">
      <div class="grid">
        <label class="emberFieldLabel">Observation Type<select class="field" id="emberType"><option>Departure</option><option>Arrival</option><option>Stance Watch</option><option>General</option></select></label>
        <label class="emberFieldLabel">Scheduled Time<input class="field" id="emberScheduled" type="time"></label>
        <label class="emberFieldLabel">Actual Time<input class="field" id="emberActual" type="time"></label>
        <label class="emberFieldLabel">Vehicle / Fleet / Reg<input class="field" id="emberVehicle" placeholder="If known"></label>
        <label class="emberFieldLabel">Passengers Off<input class="field" id="emberPassengersOff" type="number" min="0" inputmode="numeric" placeholder="0"></label>
        <label class="emberFieldLabel">Passengers On<input class="field" id="emberPassengersOn" type="number" min="0" inputmode="numeric" placeholder="0"></label>
        <label class="emberFieldLabel">Approx Load After<input class="field" id="emberLoadAfter" type="number" min="0" inputmode="numeric" placeholder="Optional"></label>
        <label class="emberFieldLabel">Stance Used<input class="field" id="emberStance" placeholder="e.g. E"></label>
        <label class="emberFieldLabel">Correct Stance E?<select class="field" id="emberCorrectStance"><option value="">Select</option><option>Yes</option><option>No</option><option>Not observed</option></select></label>
        <label class="emberFieldLabel">Stance Conflict (minutes)<input class="field" id="emberConflictMinutes" type="number" min="0" inputmode="numeric" placeholder="0"></label>
        <label class="emberFieldLabel">Impact on 747<select class="field" id="ember747"><option>None</option><option>Delay</option><option>Blocked</option><option>Stance conflict</option><option>Passengers affected</option><option>Other</option></select></label>
        <label class="emberFieldLabel">Impact on 787<select class="field" id="ember787"><option>None</option><option>Delay</option><option>Blocked</option><option>Stance conflict</option><option>Passengers affected</option><option>Other</option></select></label>
        <label class="emberFieldLabel">Issue Category<select class="field" id="emberIssue"><option>None</option><option>Wrong stance</option><option>Punctuality</option><option>Obstruction / stand conflict</option><option>Passenger issue</option><option>Safety</option><option>Service information</option><option>Other</option></select></label>
      </div>
      <div id="emberPunctuality" class="emberPunctuality neutral">Enter scheduled and actual times</div>
      <textarea class="field" id="emberNotes" placeholder="Other notes / describe any issue with the E20, 747 or 787"></textarea>
      <div class="grid2"><button class="btn" id="saveEmberBtn">SAVE E20 OBSERVATION</button><button class="btn danger" id="clearEmberBtn">CLEAR FORM</button></div>
      <div id="emberStatus" class="emberStatus">Ready.</div>
    </div>
    <div class="panel">
      <h3>Live Team Summary</h3>
      <div class="emberStats">
        <div class="emberStat"><b id="emberStatObs">0</b><span>Observations</span></div>
        <div class="emberStat"><b id="emberStatOn">0</b><span>Passengers On</span></div>
        <div class="emberStat"><b id="emberStatOff">0</b><span>Passengers Off</span></div>
        <div class="emberStat"><b id="emberStatStance">—</b><span>Correct Stance E</span></div>
        <div class="emberStat"><b id="emberStat747">0</b><span>747 Impacts</span></div>
        <div class="emberStat"><b id="emberStat787">0</b><span>787 Impacts</span></div>
        <div class="emberStat emberTimingWide"><b id="emberStatTiming">0 early • 0 late</b><span>Punctuality Events</span></div>
      </div>
      <button class="btn" id="refreshEmberBtn">REFRESH SHARED LOG</button>
    </div>
    <div class="panel"><h3>Recent Team Observations</h3><div id="emberRecent"></div></div>
  `;
  anchor.parentNode.insertBefore(section,anchor);

  const refreshInspector=()=>{if($('emberInspectorName'))$('emberInspectorName').textContent=inspector()||'Not logged in';};
  refreshInspector();
  $('emberScheduled').addEventListener('input',updatePreview);
  $('emberActual').addEventListener('input',updatePreview);
  $('saveEmberBtn').onclick=saveObservation;
  $('clearEmberBtn').onclick=resetForm;
  $('refreshEmberBtn').onclick=loadSharedData;
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-open="emberE20"],#loginBtn,[data-login-name],#changeInspectorBtn')){
      setTimeout(()=>{refreshInspector();if($('emberE20')?.classList.contains('active'))loadSharedData();},120);
    }
  });
  resetForm();
}
function init(){
  setup();
  setTimeout(setup,1800);
  setTimeout(setup,3600);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();