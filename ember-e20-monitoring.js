(function(){
'use strict';

const $=id=>document.getElementById(id);
const SHEET='Ember E20';

function inspector(){
  try{
    if(typeof getInspector==='function')return getInspector()||'';
  }catch(e){}
  return localStorage.getItem('activeInspector')||'';
}
function nowTime(){
  return new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});
}
function dateGb(){
  try{return typeof normaliseDateForSave==='function'?normaliseDateForSave(''):new Date().toLocaleDateString('en-GB');}
  catch(e){return new Date().toLocaleDateString('en-GB');}
}
function uid(){
  return 'EMBER-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
}
function setStatus(text,kind=''){
  const el=$('emberStatus');
  if(!el)return;
  el.textContent=text;
  el.className='emberStatus '+kind;
}
function resetForm(){
  if($('emberTime'))$('emberTime').value=nowTime();
  if($('emberNotes'))$('emberNotes').value='';
}
function rowFromForm(){
  const time=$('emberTime')?.value||'';
  const notes=$('emberNotes')?.value.trim()||'';
  return [
    uid(),dateGb(),time,inspector(),'','',time,'','','','','','','','','','','','',notes,'',''
  ];
}
async function saveObservation(){
  const btn=$('saveEmberBtn');
  if(btn)btn.disabled=true;
  setStatus('Saving…');
  try{
    const row=rowFromForm();
    if(typeof cloudAppend==='function'){
      await cloudAppend(SHEET,row);
    }else{
      await fetch(WEB_APP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sheet:SHEET,row})});
    }
    setStatus('Saved to Google Sheets.','good');
    resetForm();
  }catch(e){
    console.error(e);
    setStatus('Could not save. Please retry.','bad');
  }finally{
    if(btn)btn.disabled=false;
  }
}
function addStyles(){
  if($('emberSimpleCss'))return;
  const s=document.createElement('style');
  s.id='emberSimpleCss';
  s.textContent=`
  #emberE20Btn{border:2px solid #f4a51c!important;box-shadow:0 0 0 2px rgba(244,165,28,.12) inset}
  .emberSimplePanel{max-width:680px;margin:12px auto;padding:18px}
  .emberInspector{margin:0 0 16px;padding:10px 12px;border-radius:10px;background:#0d263b;border:1px solid rgba(255,255,255,.12)}
  .emberFieldLabel{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;font-size:16px;font-weight:700;color:#d8e7f2}
  .emberFieldLabel input{width:100%;box-sizing:border-box;font-size:20px}
  #emberNotes{width:100%;min-height:220px;box-sizing:border-box;resize:vertical;font-size:16px;line-height:1.45}
  .emberActions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
  .emberStatus{margin-top:12px;padding:10px;border-radius:10px;background:#24394b}.emberStatus.good{background:#164c3f}.emberStatus.bad{background:#6a2525}
  @media(max-width:620px){.emberSimplePanel{padding:14px}.emberActions{grid-template-columns:1fr}#emberNotes{min-height:260px}}
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
    b.innerHTML='<span class="navIcon">🔥</span>Ember Monitoring';
    nav.insertBefore(b,nav.firstChild);
  }
  const anchor=$('otherLinksTools')||document.querySelector('.section:last-of-type');
  if(!anchor||!anchor.parentNode)return;
  const section=document.createElement('section');
  section.id='emberE20';
  section.className='section';
  section.innerHTML=`
    <button class="backBtn" data-open="home">← Back</button>
    <h2>Ember Monitoring</h2>
    <div class="panel emberSimplePanel">
      <div class="emberInspector">Submitting as <strong id="emberInspectorName"></strong></div>
      <label class="emberFieldLabel">Time<input class="field" id="emberTime" type="time"></label>
      <label class="emberFieldLabel">Notes<textarea class="field" id="emberNotes" placeholder="Enter notes"></textarea></label>
      <div class="emberActions">
        <button class="btn" id="saveEmberBtn">SAVE</button>
        <button class="btn danger" id="clearEmberBtn">CLEAR</button>
      </div>
      <div id="emberStatus" class="emberStatus">Ready.</div>
    </div>
  `;
  anchor.parentNode.insertBefore(section,anchor);

  const refreshInspector=()=>{if($('emberInspectorName'))$('emberInspectorName').textContent=inspector()||'Not logged in';};
  refreshInspector();
  $('saveEmberBtn').onclick=saveObservation;
  $('clearEmberBtn').onclick=()=>{resetForm();setStatus('Ready.');};
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-open="emberE20"],#loginBtn,[data-login-name],#changeInspectorBtn')){
      setTimeout(refreshInspector,120);
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
