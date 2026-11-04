/* Shared important updates ticker for M Skinner and A Fairbairn only.
   Google Sheets 'Important Updates' is the source of truth. */
(function(){
'use strict';
const SHEET='Important Updates';
const URL='https://docs.google.com/spreadsheets/d/110csCfzaZ6w_jFQwsK3l_KRy0KeupulU5SgyYxG1pQI/edit#gid=1020068254';
const CACHE='inspectorImportantUpdatesLastGoodV1';
const $=id=>document.getElementById(id);
let current=[],selectedId=null,editing=false,refreshing=false,lastRefresh=0,saving=false,paused=false;
const name=()=>String((typeof getInspector==='function'?getInspector():localStorage.getItem('activeInspector'))||'').trim().toLowerCase().replace(/\s+/g,' ');
const allowed=()=>/^(m\.?\s*skinner|michael skinner|a\.?\s*fairbairn|drew fairbairn|andrew fairbairn)$/.test(name());
const safe=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function latest(rows){
 const items=new Map();
 for(const r of Array.isArray(rows)?rows:[]){
  if(!Array.isArray(r)||!String(r[0]||'').trim()||/^update id$/i.test(String(r[0])))continue;
  const id=String(r[0]),action=String(r[4]||'').toUpperCase(),details=String(r[5]||'');
  if(action==='CLEAR'){items.clear();continue;}
  if(action==='DELETE'){items.delete(details);continue;}
  if(action==='SAVE'){
   // Editing an existing item writes a new row, keeping the original item ID.
   items.set(id,{id,title:String(r[3]||''),details});
  }
 }
 return [...items.values()].filter(x=>x.title);
}
function style(){
 if($('importantUpdatesStyle'))return;
 const s=document.createElement('style');s.id='importantUpdatesStyle';
 s.textContent=`
 #importantUpdatesBar[hidden],#importantUpdatesEditor[hidden]{display:none!important}
 #importantUpdatesBar{box-sizing:border-box;max-width:100%;margin:12px 0;padding:11px 12px;border-radius:12px;border:1px solid #c47b22;background:#132c40;color:#fff;overflow:hidden}
 #importantUpdatesBar .iuHeading{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:8px}
 #importantUpdatesBar .iuHeading strong{font-size:12px;letter-spacing:.04em;color:#ffcc79}
 #importantUpdatesBar button{border:1px solid #b57c2c;background:#3b2c20;color:#fff;border-radius:8px;padding:7px 12px;min-height:34px;font-size:12px;font-weight:800;cursor:pointer}
 #importantUpdatesBar .iuTrack{width:100%;overflow:hidden;white-space:nowrap;background:#071a29;border:1px solid #3c5669;border-radius:7px;padding:9px 0}
 #importantUpdatesBar .iuScroll{display:inline-block;min-width:100%;white-space:pre;will-change:transform;animation:iuMarquee 22s linear infinite;font-size:15px;font-weight:800;color:#fff}
 #importantUpdatesBar .iuScroll button{background:transparent!important;border:0!important;color:#fff!important;font-size:15px!important;text-decoration:underline;padding:0 35px!important;min-height:0!important;cursor:pointer}
 #importantUpdatesBar .iuTrack:hover .iuScroll,#importantUpdatesBar .iuTrack:focus-within .iuScroll,#importantUpdatesBar.iuPaused .iuScroll{animation-play-state:paused!important}
 #importantUpdatesBar .iuManageItem{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #345066;flex-wrap:wrap}\n #importantUpdatesBar .iuManageItem span{flex:1;min-width:130px;overflow-wrap:anywhere}\n #importantUpdatesBar .iuEmpty{padding:0 12px;color:#b8c8d4;font-size:13px}
 #importantUpdatesBar textarea{box-sizing:border-box;width:100%;min-height:90px;padding:10px;border-radius:9px;border:1px solid #64849d;background:#071a29;color:#fff;font:inherit;resize:vertical}
 #importantUpdatesBar .iuActions{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
 #importantUpdatesBar .iuFields label{display:block;margin:10px 0 5px;color:#ffcd83;font-size:12px;font-weight:800}
 #importantUpdatesBar input{box-sizing:border-box;width:100%;padding:10px;border-radius:9px;border:1px solid #64849d;background:#071a29;color:white;font:inherit}
 #iuDetailsOverlay[hidden]{display:none!important}
 #iuDetailsOverlay{position:fixed;inset:0;z-index:40000;background:rgba(0,9,18,.86);padding:15px;box-sizing:border-box;display:flex;align-items:center;justify-content:center}
 #iuDetailsDialog{width:min(590px,100%);max-height:85dvh;overflow-y:auto;box-sizing:border-box;background:#102c42;border:1px solid #bd842d;border-radius:14px;padding:18px;color:white}
 #iuDetailsDialog h2{color:#ffd18a;overflow-wrap:anywhere}
 #iuDetailsDialog .iuDetailsBody{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55;margin:12px 0 18px}
 #iuDetailsDialog .iuClose{background:#284c68;border:1px solid #67869c;color:white;border-radius:8px;padding:10px 15px;min-height:42px;font-weight:800}
 #importantUpdatesBar .iuStatus{margin-top:8px;color:#bdd0dc;font-size:12px;overflow-wrap:anywhere}
 @keyframes iuMarquee{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
 @media(prefers-reduced-motion:reduce){#importantUpdatesBar .iuScroll{animation:none;transform:none;white-space:normal}}
 `;document.head.appendChild(s);
}
function mount(){
 if($('importantUpdatesBar'))return;
 const home=$('home');if(!home)return;
 style();
 const el=document.createElement('div');el.id='importantUpdatesBar';el.hidden=true;
 el.innerHTML='<div class="iuHeading"><strong>📢 IMPORTANT UPDATES</strong><div style="display:flex;gap:7px"><button id="importantUpdatesPause" type="button" aria-pressed="false">⏸ PAUSE</button><button id="importantUpdatesEdit" type="button">EDIT</button></div></div><div class="iuTrack" aria-label="Important inspector updates"><div class="iuScroll" id="importantUpdatesText"></div><div id="importantUpdatesEmpty" class="iuEmpty" hidden>No important updates published.</div></div><div id="importantUpdatesEditor" class="iuFields" hidden><div id="iuManageList"></div><div class="iuActions"><button type="button" id="iuAddNew">+ ADD ANNOUNCEMENT</button></div><label for="importantUpdatesTitle">Title (scrolling headline)</label><input id="importantUpdatesTitle" maxlength="200" placeholder="Enter update title"><label for="importantUpdatesInput">Details (shown when title is clicked)</label><textarea id="importantUpdatesInput" maxlength="5000" placeholder="Enter full details…"></textarea><div class="iuActions"><button type="button" id="importantUpdatesSave">SAVE UPDATE</button><button type="button" id="importantUpdatesCancel">CANCEL</button><button type="button" id="importantUpdatesClear">DELETE SELECTED</button><a href="'+URL+'" target="_blank" rel="noopener" style="color:#ffcd83;font-size:12px;align-self:center">View Google Sheet</a></div></div><div id="importantUpdatesStatus" class="iuStatus" role="status"></div>';
 const driver=$('homeSearchWrap')||$('homeGlobalSearch')?.closest('#homeSearchWrap');
 if(driver&&driver.parentElement)driver.before(el);
 else{const p=home.querySelector('.panel');(p||home).appendChild(el);}
 $('importantUpdatesEdit').onclick=()=>{editing=!editing;$('importantUpdatesEditor').hidden=!editing;if(editing){selectedId=null;fillEditor();$('importantUpdatesTitle').focus();}};\n $('iuAddNew').onclick=()=>{selectedId=null;fillEditor();$('importantUpdatesTitle').focus();};
 $('importantUpdatesPause').onclick=()=>{paused=!paused;render();};
 $('importantUpdatesText').onclick=e=>{const btn=e.target.closest('[data-details]');if(btn)showDetails(btn.dataset.details);};
 $('importantUpdatesCancel').onclick=()=>{editing=false;$('importantUpdatesEditor').hidden=true;};
 $('importantUpdatesSave').onclick=()=>save(false);
 $('importantUpdatesClear').onclick=()=>{if(selectedId&&confirm('Delete this announcement for both inspectors?'))save(true);};
 render();
}
function fillEditor(){
 const item=current.find(x=>x.id===selectedId);
 $('importantUpdatesTitle').value=item?.title||'';
 $('importantUpdatesInput').value=item?.details||'';
 $('importantUpdatesClear').hidden=!item;
 const list=$('iuManageList');
 list.innerHTML=current.length?current.map(x=>'<div class="iuManageItem"><span>'+safe(x.title)+'</span><button type="button" data-edit="'+safe(x.id)+'">EDIT</button><button type="button" data-delete="'+safe(x.id)+'">DELETE</button></div>').join(''):'<p>No announcements yet.</p>';
 list.onclick=e=>{
  const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');
  if(edit){selectedId=edit.dataset.edit;fillEditor();}
  if(del&&confirm('Delete this announcement for both inspectors?')){selectedId=del.dataset.delete;save(true);}
 };
}
function render(){
 const el=$('importantUpdatesBar');if(!el)return;
 el.hidden=!allowed();
 if(el.hidden){editing=false;$('importantUpdatesEditor').hidden=true;const d=$('iuDetailsOverlay');if(d)d.hidden=true;return;}
 const t=$('importantUpdatesText'),empty=$('importantUpdatesEmpty');if(!t)return;
 t.hidden=!current.length;empty.hidden=!!current.length;
 t.innerHTML=current.map(x=>'<button type="button" data-details="'+safe(x.id)+'" title="View full details">'+safe(x.title)+'</button>').join(' <span aria-hidden="true"> • </span> ');
 el.classList.toggle('iuPaused',paused);
 const p=$('importantUpdatesPause');if(p){p.textContent=paused?'▶ PLAY':'⏸ PAUSE';p.setAttribute('aria-pressed',String(paused));}
 if(editing)fillEditor();
}
function showDetails(id){
 if(!allowed())return;
 const item=current.find(x=>x.id===id);if(!item)return;
 let overlay=$('iuDetailsOverlay');
 if(!overlay){overlay=document.createElement('div');overlay.id='iuDetailsOverlay';overlay.hidden=true;overlay.innerHTML='<div id="iuDetailsDialog" role="dialog" aria-modal="true" aria-labelledby="iuDetailsTitle"><h2 id="iuDetailsTitle"></h2><div class="iuDetailsBody" id="iuDetailsBody"></div><button type="button" class="iuClose" id="iuDetailsClose">CLOSE</button></div>';document.body.appendChild(overlay);
 overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.hidden=true;});$('iuDetailsClose').onclick=()=>{overlay.hidden=true;};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)overlay.hidden=true;});}
 $('iuDetailsTitle').textContent=item.title;$('iuDetailsBody').textContent=item.details||'No additional details provided.';overlay.hidden=false;$('iuDetailsClose').focus();
}
function status(s){const e=$('importantUpdatesStatus');if(e)e.textContent=s;}
async function refresh(force=false){
 if(!allowed()||refreshing||saving||(!force&&Date.now()-lastRefresh<30000))return;
 refreshing=true;lastRefresh=Date.now();
 try{
  if(typeof WEB_APP_URL!=='string'||!WEB_APP_URL)throw Error('Google Sheets connection unavailable');
  const res=await fetch(WEB_APP_URL+(WEB_APP_URL.includes('?')?'&':'?')+'sheet='+encodeURIComponent(SHEET)+'&_='+Date.now(),{cache:'no-store'});
  if(!res.ok)throw Error('Google Sheets returned '+res.status);
  const j=await res.json();if(!Array.isArray(j?.data))throw Error('Invalid response');
  current=latest(j.data);localStorage.setItem(CACHE,JSON.stringify(current));render();status('');
 }catch(e){status('Updates could not be refreshed. Showing the last saved copy, if available.');console.warn(e);}
 finally{refreshing=false;}
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function save(clear){
 if(saving||!allowed())return;
 const title=clear?'':$('importantUpdatesTitle').value.trim();
 const details=clear?'':$('importantUpdatesInput').value.trim();
 if(!clear&&!title){status('Enter a title, or choose Clear Update.');return;}
 if(typeof WEB_APP_URL!=='string'||!WEB_APP_URL){status('Google Sheets connection unavailable.');return;}
 saving=true;$('importantUpdatesSave').disabled=true;$('importantUpdatesClear').disabled=true;
 const id=clear?'IU-DELETE-'+Date.now():selectedId||'IU-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
 const row=[id,new Date().toISOString(),typeof getInspector==='function'?getInspector():name(),title,clear?'DELETE':'SAVE',clear?selectedId:details];
 status('Saving to Google Sheets…');
 try{
  await fetch(WEB_APP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sheet:SHEET,row})});
  // A no-cors POST does not confirm delivery; verify against a fresh GET before declaring success.
  let confirmed=false;
  for(let i=0;i<4;i++){
   await sleep(i===0?1200:1800);
   const res=await fetch(WEB_APP_URL+'?sheet='+encodeURIComponent(SHEET)+'&_='+Date.now(),{cache:'no-store'});
   if(!res.ok)continue;
   const json=await res.json();
   if(Array.isArray(json?.data)&&json.data.some(r=>String(r?.[0]||'')===id)){confirmed=true;break;}
  }
  if(!confirmed){status('Save not confirmed in Google Sheets. Please retry; your text is still here.');return;}
  if(clear)current=current.filter(x=>x.id!==selectedId);else{const i=current.findIndex(x=>x.id===id);const item={id,title,details};if(i>=0)current[i]=item;else current.push(item);}selectedId=null;localStorage.setItem(CACHE,JSON.stringify(current));editing=false;$('importantUpdatesEditor').hidden=true;render();status('Saved and shared across devices.');
 }catch(e){status('Unable to confirm saving to Google Sheets. Please retry.');console.warn(e);}
 finally{saving=false;$('importantUpdatesSave').disabled=false;$('importantUpdatesClear').disabled=false;lastRefresh=0;}
}
function tick(){
 mount();
 // Driver Search is created by another loader: keep the banner directly above it.
 const el=$('importantUpdatesBar'),driver=$('homeSearchWrap');
 if(el&&driver&&el.nextElementSibling!==driver)driver.before(el);
 render();
 if(allowed())refresh();
}
try{const v=localStorage.getItem(CACHE);if(v){const x=JSON.parse(v);current=Array.isArray(x)?x:(x?.title?[{id:'cached',title:x.title,details:x.details||''}]:[]);}}catch(e){current=[];}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick);else tick();
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-login-name],#loginBtn,#changeInspectorBtn'))setTimeout(tick,150);});
window.addEventListener('storage',e=>{if(e.key==='activeInspector'){lastRefresh=0;tick();}});
window.addEventListener('pageshow',()=>{lastRefresh=0;tick();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastRefresh=0;tick();}});
setInterval(()=>{if(!document.hidden)tick();},35000);
})();
