/* Shared important updates ticker for M Skinner and A Fairbairn only.
   Google Sheets 'Important Updates' is the source of truth. */
(function(){
'use strict';
const SHEET='Important Updates';
const URL='https://docs.google.com/spreadsheets/d/110csCfzaZ6w_jFQwsK3l_KRy0KeupulU5SgyYxG1pQI/edit#gid=1020068254';
const CACHE='inspectorImportantUpdatesLastGoodV1';
const $=id=>document.getElementById(id);
let current='',editing=false,refreshing=false,lastRefresh=0,saving=false;
const name=()=>String((typeof getInspector==='function'?getInspector():localStorage.getItem('activeInspector'))||'').trim().toLowerCase().replace(/\s+/g,' ');
const allowed=()=>/^(m\.?\s*skinner|michael skinner|a\.?\s*fairbairn|drew fairbairn|andrew fairbairn)$/.test(name());
const safe=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function latest(rows){
 const valid=(Array.isArray(rows)?rows:[]).filter(r=>Array.isArray(r)&&String(r[0]||'').trim()&&!/^update id$/i.test(String(r[0]||'')));
 return valid.length?String(valid[valid.length-1][4]||'').toUpperCase()==='CLEAR'?'':String(valid[valid.length-1][3]||''):'';
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
 #importantUpdatesBar .iuScroll span{padding:0 35px}
 #importantUpdatesBar .iuTrack:hover .iuScroll,#importantUpdatesBar .iuTrack:focus-within .iuScroll{animation-play-state:paused}
 #importantUpdatesBar .iuEmpty{padding:0 12px;color:#b8c8d4;font-size:13px}
 #importantUpdatesBar textarea{box-sizing:border-box;width:100%;min-height:90px;padding:10px;border-radius:9px;border:1px solid #64849d;background:#071a29;color:#fff;font:inherit;resize:vertical}
 #importantUpdatesBar .iuActions{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
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
 el.innerHTML='<div class="iuHeading"><strong>📢 IMPORTANT UPDATES</strong><button id="importantUpdatesEdit" type="button">EDIT</button></div><div class="iuTrack" aria-label="Important inspector updates"><div class="iuScroll" id="importantUpdatesText"></div><div id="importantUpdatesEmpty" class="iuEmpty" hidden>No important updates published.</div></div><div id="importantUpdatesEditor" hidden><textarea id="importantUpdatesInput" maxlength="2000" placeholder="Enter an important update to scroll across the homepage…"></textarea><div class="iuActions"><button type="button" id="importantUpdatesSave">SAVE UPDATE</button><button type="button" id="importantUpdatesCancel">CANCEL</button><button type="button" id="importantUpdatesClear">CLEAR UPDATE</button><a href="'+URL+'" target="_blank" rel="noopener" style="color:#ffcd83;font-size:12px;align-self:center">View Google Sheet</a></div></div><div id="importantUpdatesStatus" class="iuStatus" role="status"></div>';
 const driver=$('homeSearchWrap')||$('homeGlobalSearch')?.closest('#homeSearchWrap');
 if(driver&&driver.parentElement)driver.before(el);
 else{const p=home.querySelector('.panel');(p||home).appendChild(el);}
 $('importantUpdatesEdit').onclick=()=>{editing=!editing;$('importantUpdatesEditor').hidden=!editing;if(editing){$('importantUpdatesInput').value=current;$('importantUpdatesInput').focus();}};
 $('importantUpdatesCancel').onclick=()=>{editing=false;$('importantUpdatesEditor').hidden=true;};
 $('importantUpdatesSave').onclick=()=>save(false);
 $('importantUpdatesClear').onclick=()=>{if(confirm('Clear the scrolling update for both inspectors?'))save(true);};
 render();
}
function render(){
 const el=$('importantUpdatesBar');if(!el)return;
 el.hidden=!allowed();
 if(el.hidden){editing=false;$('importantUpdatesEditor').hidden=true;return;}
 const t=$('importantUpdatesText'),empty=$('importantUpdatesEmpty');
 if(!t)return;
 t.hidden=!current;empty.hidden=!!current;
 t.innerHTML=current?'<span>'+safe(current)+'</span><span aria-hidden="true">'+safe(current)+'</span>':'';
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
  current=latest(j.data);localStorage.setItem(CACHE,current);render();status('');
 }catch(e){status('Updates could not be refreshed. Showing the last saved copy, if available.');console.warn(e);}
 finally{refreshing=false;}
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function save(clear){
 if(saving||!allowed())return;
 const message=clear?'':$('importantUpdatesInput').value.trim();
 if(message.length>2000){status('Maximum 2,000 characters.');return;}
 if(!clear&&!message){status('Enter a message, or choose Clear Update.');return;}
 if(typeof WEB_APP_URL!=='string'||!WEB_APP_URL){status('Google Sheets connection unavailable.');return;}
 saving=true;$('importantUpdatesSave').disabled=true;$('importantUpdatesClear').disabled=true;
 const id='IU-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
 const row=[id,new Date().toISOString(),typeof getInspector==='function'?getInspector():name(),message,clear?'CLEAR':'SAVE'];
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
  current=message;localStorage.setItem(CACHE,current);editing=false;$('importantUpdatesEditor').hidden=true;render();status('Saved and shared across devices.');
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
try{current=localStorage.getItem(CACHE)||'';}catch(e){}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick);else tick();
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-login-name],#loginBtn,#changeInspectorBtn'))setTimeout(tick,150);});
window.addEventListener('storage',e=>{if(e.key==='activeInspector'){lastRefresh=0;tick();}});
window.addEventListener('pageshow',()=>{lastRefresh=0;tick();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastRefresh=0;tick();}});
setInterval(()=>{if(!document.hidden)tick();},35000);
})();
