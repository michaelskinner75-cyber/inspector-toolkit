/* Michael-only Fife service Times notes. Each service has one free-text field. */
(function(){
'use strict';
const SHEET='Fife Service Times',TAB='https://docs.google.com/spreadsheets/d/110csCfzaZ6w_jFQwsK3l_KRy0KeupulU5SgyYxG1pQI/edit#gid=1420726301';
const CACHE='inspectorTimesPlainCache',OUTBOX='inspectorTimesPlainOutbox',DRAFT='inspectorTimesPlainDraft:', $=id=>document.getElementById(id);
const str=v=>String(v??''),clean=v=>str(v).trim(),esc=v=>str(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let saved={},drafts={},bases={},queue=[],loaded=false,loading=false,syncing=false,search='',ready=false;
const expanded=new Set(),editing=new Set();
const FILTER_PREF='inspectorTimesUpcomingOnlyV1';
let upcomingOnly=true; // Default to upcoming times; the inspector can switch back to all.
try{const preference=localStorage.getItem(FILTER_PREF);if(preference!==null)upcomingOnly=preference==='true';}catch(e){}
// Match clock times only (e.g. 06:15, 9:05). Never interpret service numbers as times.
const CLOCK_RE=/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g;
function ukMinutes(date=new Date()){
 try{
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const h=Number(parts.find(x=>x.type==='hour')?.value),m=Number(parts.find(x=>x.type==='minute')?.value);
  if(Number.isFinite(h)&&Number.isFinite(m))return h*60+m;
 }catch(e){}
 return date.getHours()*60+date.getMinutes();
}
function clockMinutes(value){
 const match=String(value).match(/^(\d{1,2}):(\d{2})$/);
 return match?Number(match[1])*60+Number(match[2]):NaN;
}
function upcomingView(note,from=ukMinutes()){
 const text=str(note),lines=text.split(/\r?\n/),output=[],headers=[];
 let matched=0,kept=0;
 for(const line of lines){
  const times=[...line.matchAll(CLOCK_RE)];
  if(!times.length){headers.push(line);continue;}
  matched+=times.length;
  let count=0;
  // In copied BusTimes tables one stop has many departures on one line.
  // Strip only departed clock tokens and retain this stop's heading if any remain.
  const filtered=line.replace(CLOCK_RE,time=>{
   if(clockMinutes(time)>=from){count++;return time;}
   return '';
  }).replace(/\t{2,}/g,'\t').replace(/[ \t]{2,}/g,' ').replace(/[ \t]+,/g,',').replace(/,\s*$/,'').trim();
  if(count){
   output.push(...headers);
   output.push(filtered);
   kept+=count;
  }
  headers.length=0;
 }
 // For prose without detectable HH:MM departures, never hide the notes.
 if(matched===0)return {text,matched:0,kept:0};
 return {text:output.join('\n').trim(),matched,kept};
}
function filterLabel(){
 const now=ukMinutes(),hour=String(Math.floor(now/60)).padStart(2,'0'),minute=String(now%60).padStart(2,'0');
 return 'From '+hour+':'+minute+' (UK time)';
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function allowed(){let n='';try{n=typeof getInspector==='function'?getInspector():localStorage.getItem('activeInspector')||'';}catch(e){}return /^(m\.?\s*skinner|michael\s+skinner)$/i.test(clean(n))&&Number(localStorage.getItem('michaelLoginExpiresAt')||0)>Date.now();}
function services(){const m=window.InspectorCoverageModel;return m?m.defs().filter(m.fifeService).sort((a,b)=>clean(a.code).localeCompare(clean(b.code),undefined,{numeric:true})||clean(a.route).localeCompare(clean(b.route))):[];}
function link(s){const u=clean(window.InspectorCoverageTimetableUrl?.(s));return /^https:\/\/(?:www\.)?bustimes\.org\/services\/[a-z0-9/_-]+(?:\?[a-z0-9=&_%.-]*)?$/i.test(u)?u:'';}
function oldText(a){return Array.isArray(a)?a.filter(x=>x&&x.stop).map(x=>[x.time,x.stop,x.direction,x.days,x.notes].map(clean).filter(Boolean).join(' — ')).join('\n'):'';}
function decode(all){
 const found={},parts=new Map();
 for(const r of Array.isArray(all)?all:[]){
  if(!Array.isArray(r)||r.length<10)continue;
  const id=clean(r[1]),action=clean(r[9]).toUpperCase(),rev=clean(r[8]);
  if(!id||/^service id$/i.test(id))continue;
  const info={revision:rev,updated:clean(r[0])};
  if(action==='SEED'){if(!found[id])found[id]={...info,text:''};continue;}
  if(action==='TIMES'){found[id]={...info,text:str(r[6])};continue;}
  if(action==='TIMES_PART'||action==='CHUNK'){
   const m=rev.match(/^(.*)#(\d+)\/(\d+)$/);if(!m)continue;
   const i=Number(m[2])-1,n=Number(m[3]);if(i<0||n<2||n>1000||i>=n)continue;
   const key=action+'|'+id+'|'+m[1];
   if(!parts.has(key))parts.set(key,{total:n,sections:[]});
   let val;
   if(action==='TIMES_PART')val=str(r[6]);
   else{try{val=JSON.parse(clean(r[7])||'[]');if(!Array.isArray(val))continue;}catch(e){continue;}}
   if(parts.get(key).total===n)parts.get(key).sections[i]=val;
   continue;
  }
  if(action==='TIMES_COMMIT'||action==='COMMIT'){
   const chunk=parts.get((action==='COMMIT'?'CHUNK':'TIMES_PART')+'|'+id+'|'+rev);
   if(chunk&&chunk.sections.length===chunk.total&&Array.from({length:chunk.total},(_,i)=>chunk.sections[i]!==undefined).every(Boolean))
    found[id]={...info,text:action==='COMMIT'?oldText(chunk.sections.flat()):chunk.sections.join('')};
   continue;
  }
  if(action==='SAVE'){try{found[id]={...info,text:oldText(JSON.parse(clean(r[7])||'[]'))};}catch(e){}}
 }
 return found;
}
function readLocal(){
 try{const c=JSON.parse(localStorage.getItem(CACHE)||'{}');if(c&&typeof c==='object')saved=c;}catch(e){}
 try{const q=JSON.parse(localStorage.getItem(OUTBOX)||'[]');if(Array.isArray(q))queue=q.filter(t=>t&&t.id&&Array.isArray(t.parts));}catch(e){}
 for(const s of services()){
  try{
   const raw=localStorage.getItem(DRAFT+s.id);
   if(raw!==null){const d=JSON.parse(raw);drafts[s.id]=str(d.text);bases[s.id]=clean(d.base);}
   else{
    const old=localStorage.getItem('fifeTimesDraftV1:'+s.id);
    if(old&&Array.isArray(JSON.parse(old))){drafts[s.id]=oldText(JSON.parse(old));bases[s.id]=saved[s.id]?.revision||'';saveDraft(s.id);}
   }
  }catch(e){}
 }
}
function saveDraft(id){try{localStorage.setItem(DRAFT+id,JSON.stringify({text:drafts[id],base:bases[id]||''}));}catch(e){console.warn('Times draft storage unavailable',e);}}
function clearDraft(id){delete drafts[id];delete bases[id];try{localStorage.removeItem(DRAFT+id);}catch(e){}}
function persist(){try{localStorage.setItem(OUTBOX,JSON.stringify(queue));return true;}catch(e){alert('Unable to store this save on your device. Your Times have not been cleared.');return false;}}
function pending(id){return queue.some(x=>x.serviceId===id&&x.parts.some(p=>!p.confirmed));}
function cloudURL(){if(typeof WEB_APP_URL!=='string'||!WEB_APP_URL)throw Error('Google Sheets connection unavailable');return WEB_APP_URL;}
async function cloud(){
 const u=cloudURL()+(cloudURL().includes('?')?'&':'?')+'sheet='+encodeURIComponent(SHEET)+'&_='+Date.now(),c=new AbortController(),timer=setTimeout(()=>c.abort(),22000);
 try{const r=await fetch(u,{cache:'no-store',signal:c.signal});if(!r.ok)throw Error('Google Sheets '+r.status);const j=await r.json();if(!Array.isArray(j?.data))throw Error('Invalid sheet response');return j.data;}finally{clearTimeout(timer);}
}
function top(t){const x=$('ftTopStatus');if(x)x.textContent=t;}
function note(id){return Object.prototype.hasOwnProperty.call(drafts,id)?drafts[id]:str(saved[id]?.text);}
function isOriginalBlank(id,record){
 return (!record?.revision||record.revision==='SEED-'+id)&&!str(record?.text).length;
}
function reconcileCloud(next){
 // Fresh devices could capture a draft before the first sheet read.
 // Repair the draft revision only while the remote entry is still the blank seed.
 for(const id of Object.keys(drafts)){
  const remote=next[id]||{revision:'',text:''};
  if(drafts[id]===str(remote.text))clearDraft(id);
  else if(!bases[id]&&isOriginalBlank(id,remote)){
   bases[id]=remote.revision||'';
   saveDraft(id);
  }
 }
 saved=next;loaded=true;
 try{localStorage.setItem(CACHE,JSON.stringify(saved));}catch(e){}
}
function isTimesVisible(){return !!$('michaelServiceTimes')?.classList.contains('active');}
function state(id,t,color){
 const label=$('ftStatus-'+id);if(label){label.textContent=t;label.dataset.kind=color||'';}
 const b=$('ftSave-'+id);if(b)b.disabled=pending(id)||syncing||!allowed();
}
function css(){
 if($('ftPlainCss'))return;const n=document.createElement('style');n.id='ftPlainCss';
 n.textContent=[
  '#michaelServiceTimes{color:#e5eef5}#michaelServiceTimes .ftPanel{background:#102b40;border:1px solid #416980;border-radius:12px;padding:13px;margin:10px 0}',
  '#michaelServiceTimes h2{color:#f0bc6a;font-size:21px;margin:0 0 8px}',
  '#michaelServiceTimes .ftHelp,#michaelServiceTimes .ftStatus,#michaelServiceTimes .ftTop{color:#c3d7e5;font-size:12px;line-height:1.45}',
  '#michaelServiceTimes .ftTools{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0}',
  '#michaelServiceTimes .ftBtn{display:inline-flex;justify-content:center;align-items:center;min-height:38px;box-sizing:border-box;color:#fff;background:#23516e;border:1px solid #6087a3;border-radius:8px;padding:8px 11px;font-size:11px;font-weight:850;text-decoration:none;cursor:pointer}',
  '#michaelServiceTimes .ftBtn.primary{background:#efb65d;color:#142a39;border-color:#efb65d}#michaelServiceTimes .ftBtn:disabled{opacity:.5}',
  '#michaelServiceTimes .ftInput{background:#0c2436;color:#fff;font-family:inherit;font-size:15px;width:100%;min-height:44px;padding:10px;border:1px solid #5a829c;border-radius:8px;box-sizing:border-box}',
  '#michaelServiceTimes .ftCard{background:#16374f;border:1px solid #446b83;border-radius:10px;padding:12px;margin:10px 0}',
  '#michaelServiceTimes .ftCardHead{display:flex;align-items:start;justify-content:space-between;gap:8px}#michaelServiceTimes .ftCode{font-size:18px;font-weight:950}',
  '#michaelServiceTimes .ftRoute{font-size:11px;color:#c6d8e4;margin:4px 0 10px;line-height:1.4}',
  '#michaelServiceTimes .ftLabel{font-size:13px;color:#f3bf6a;font-weight:900;display:block;margin:8px 0 5px}',
  '#michaelServiceTimes textarea{display:block;min-height:110px;width:100%;box-sizing:border-box;resize:vertical;background:#0b2537;color:white;border:1px solid #6486a0;border-radius:8px;font-family:inherit;font-size:14px;line-height:1.5;padding:10px}',
  '#michaelServiceTimes .ftReadOnly{white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;font-family:inherit;font-size:13px;line-height:1.55;background:#0a2335;color:#e1eff7;border:1px solid #426882;border-radius:8px;padding:12px;min-height:48px;margin:4px 0 9px;user-select:text}',
  '#michaelServiceTimes .ftReadOnly.empty{color:#b8ccd9;font-style:italic}',
  '#michaelServiceTimes .ftDetails{border-top:1px solid #375c75;margin-top:9px;padding-top:8px}',
  '#michaelServiceTimes .ftCardHead .ftBtn{white-space:nowrap}',
  '#michaelServiceTimes .ftControls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}',
  '#michaelServiceTimes .ftStatus{display:inline-block;margin:5px 0 0}',
  '#michaelServiceTimes .ftFilterLabel{display:inline-flex;align-items:center;gap:9px;font-size:12px;font-weight:850;color:#fff;background:#173c52;border:1px solid #537d95;border-radius:8px;min-height:38px;padding:7px 10px;cursor:pointer}',
  '#michaelServiceTimes .ftFilterLabel input{accent-color:#f0bd62;width:19px;height:19px;margin:0;flex:none}',
  '#michaelServiceTimes .ftFilterTime{font-size:11px;color:#d0e0ed;font-variant-numeric:tabular-nums}',
  '#michaelServiceTimes .ftFilterHint{font-size:11px;color:#c1d5e2;margin:5px 0 11px}',

  '#michaelServiceTimes .ftStatus[data-kind="success"]{color:#7de0ad}#michaelServiceTimes .ftStatus[data-kind="warning"]{color:#f6c77e}',
  '#michaelServiceTimes [hidden]{display:none!important}@media(max-width:550px){#michaelServiceTimes .ftPanel,#michaelServiceTimes .ftCard{padding:10px}}'
 ].join('');document.head.appendChild(n);
}
function build(){
 if(!allowed()||!window.InspectorCoverageModel)return false;
 const h=$('home'),nav=h?.querySelector('.nav'),host=document.querySelector('.machine');
 if(!h||!nav||!host)return false;css();
 if(!$('michaelServiceTimesNav')){
  const b=document.createElement('button');b.id='michaelServiceTimesNav';b.dataset.open='michaelServiceTimes';b.type='button';b.textContent='🕒 Times';
  const planner=$('dpNavButton');if(planner?.parentElement===nav)planner.insertAdjacentElement('afterend',b);else nav.insertBefore(b,nav.firstChild);
 }
 if(!$('michaelServiceTimes')){
  const section=document.createElement('section');section.id='michaelServiceTimes';section.className='section';
  section.innerHTML='<button class="backBtn" data-open="home">← Back</button><div class="ftPanel"><h2>🕒 Fife &amp; Surrounding Times</h2>'+
   '<p class="ftHelp">Tap <b>SHOW TIMES</b> to read the notes. Press <b>EDIT TIMES</b> to make changes, then <b>SAVE TIMES</b> to share them to Google Sheets and your other devices.</p>'+
   '<div class="ftTools"><a class="ftBtn" href="'+TAB+'" target="_blank" rel="noopener noreferrer">OPEN GOOGLE SHEET ↗</a>'+
   '<button id="ftRefresh" class="ftBtn" type="button">REFRESH FROM SHEETS</button><span id="ftTotal" class="ftHelp"></span></div>'+
   '<div class="ftTools"><label class="ftFilterLabel" for="ftUpcomingOnly"><input id="ftUpcomingOnly" type="checkbox" '+(upcomingOnly?'checked':'')+'>SHOW UPCOMING TIMES ONLY</label><span class="ftFilterTime" id="ftFilterTime"></span></div>'+
   '<p class="ftFilterHint">View only: hides departures before the current UK time. Switch off to see everything. Editing always shows all saved times.</p>'+
   '<input id="ftSearch" class="ftInput" type="search" placeholder="Search service number or route" aria-label="Search services">'+
   '<p class="ftTop" id="ftTopStatus" role="status">Loading Times…</p><div id="ftServices"></div></div>';
  host.appendChild(section);
 }
 return true;
}
function statusText(id){
 return pending(id)?'NOT SHARED YET — check Google Sheets sync':
  Object.prototype.hasOwnProperty.call(drafts,id)?'UNSAVED — ONLY ON THIS DEVICE':
  saved[id]?.updated?'Saved to Google Sheets ✓':'No times entered';
}
function statusKind(id){
 return pending(id)||Object.prototype.hasOwnProperty.call(drafts,id)?'warning':
  saved[id]?.updated?'success':'';
}
function card(s){
 const id=esc(s.id),url=link(s),open=expanded.has(s.id),edit=editing.has(s.id);
 const value=note(s.id),hasNotes=!!clean(value);
 const filtered=upcomingOnly&&!edit?upcomingView(value):null;
 const shown=filtered?filtered.text:value;
 const emptyText=hasNotes&&upcomingOnly&&filtered?.matched>0?
  'No upcoming times remaining today. Switch off the filter to view all times.':'No times entered yet.';
 return '<article class="ftCard" id="ftCard-'+id+'" data-ft-service="'+id+'">'+
  '<div class="ftCardHead"><div><div class="ftCode">'+esc(s.code)+'</div>'+
  '<div class="ftRoute">'+esc(s.route)+'</div></div>'+
  '<button class="ftBtn" type="button" data-ft-toggle="'+id+'" aria-expanded="'+open+'" aria-controls="ftDetails-'+id+'">'+(open?'HIDE TIMES':'SHOW TIMES')+'</button></div>'+
  '<div class="ftStatus" id="ftStatus-'+id+'" role="status" data-kind="'+statusKind(s.id)+'">'+esc(statusText(s.id))+'</div>'+
  '<div class="ftDetails" id="ftDetails-'+id+'" '+(open?'':'hidden')+'>'+
  '<div class="ftLabel">Times</div>'+
  (edit?
    '<textarea id="ftText-'+id+'" data-ft-text="'+id+'" rows="6" aria-label="Edit times for service '+esc(s.code)+'" placeholder="Paste or type stops and times however you like…">'+esc(value)+'</textarea>'+
    '<div class="ftControls"><button id="ftSave-'+id+'" data-ft-save="'+id+'" type="button" class="ftBtn primary" '+(pending(s.id)?'disabled':'')+'>SAVE TIMES</button>'+
    '<button type="button" class="ftBtn" data-ft-end-edit="'+id+'">STOP EDITING</button></div>':
    '<div id="ftView-'+id+'" class="ftReadOnly'+(clean(shown)?'':' empty')+'">'+(clean(shown)?esc(shown):esc(emptyText))+'</div>'+
    '<div class="ftControls"><button class="ftBtn primary" type="button" data-ft-edit="'+id+'">EDIT TIMES</button></div>')+
  (url?'<a class="ftBtn" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">BUSTIMES ↗</a>':'')+
  '</div></article>';
}
function render(){
 const root=$('ftServices');if(!root)return;
 const all=services(),list=all.filter(s=>(s.code+' '+s.route).toLowerCase().includes(search));
 const total=$('ftTotal');if(total)total.textContent=all.length+' services';
 const filter=$('ftUpcomingOnly');if(filter)filter.checked=upcomingOnly;
 const now=$('ftFilterTime');if(now)now.textContent=upcomingOnly?filterLabel():'All times shown';
 root.innerHTML=list.map(card).join('')||'<p class="ftHelp">No services found.</p>';
}
function updateCard(id){
 const s=services().find(s=>s.id===id),el=$('ftCard-'+id);
 if(s&&el)el.outerHTML=card(s);
}
function toggleTimes(id){
 if(expanded.has(id)){expanded.delete(id);editing.delete(id);}
 else expanded.add(id);
 updateCard(id);
}
function startEdit(id){
 if(!services().some(s=>s.id===id))return;
 expanded.add(id);editing.add(id);updateCard(id);
 $('ftText-'+id)?.focus();
}
function stopEdit(id){
 editing.delete(id);updateCard(id);
}
function refreshFields(){
 const filterTime=$('ftFilterTime');if(filterTime)filterTime.textContent=upcomingOnly?filterLabel():'All times shown';
 for(const box of $('ftServices')?.querySelectorAll('[data-ft-service]')||[]){
  const id=box.dataset.ftService;
  const view=$('ftView-'+id);
  if(view){
   const value=note(id),hasValue=!!clean(value);
   const filtered=upcomingOnly?upcomingView(value):null;
   const shown=filtered?filtered.text:value;
   const emptyText=hasValue&&upcomingOnly&&filtered?.matched>0?
    'No upcoming times remaining today. Switch off the filter to view all times.':'No times entered yet.';
   view.textContent=clean(shown)?shown:emptyText;
   view.classList.toggle('empty',!clean(shown));
  }
  const field=$('ftText-'+id);
  if(field&&!Object.prototype.hasOwnProperty.call(drafts,id)&&document.activeElement!==field)
   field.value=note(id);
  state(id,statusText(id),statusKind(id));
 }
}
async function refresh(){
 if(!allowed()||loading)return;
 loading=true;top('Loading Times from Google Sheets…');
 try{
  reconcileCloud(decode(await cloud()));
  top('Latest Times loaded from Google Sheets — ready to view on all devices.');
  refreshFields();
 }catch(e){top('Google Sheets unavailable. Your unsaved Times are kept on this device.');}
 finally{loading=false;}
}
function rowsFor(s,text,rev){
 const chars=Array.from(text),chunks=[];for(let i=0;i<chars.length;i+=15000)chunks.push(chars.slice(i,i+15000).join(''));
 if(!chunks.length)chunks.push('');
 const now=new Date().toISOString(),count=text.split(/\r?\n/).filter(Boolean).length;
 const row=(value,revision,action)=>[now,s.id,s.code,s.route,'M Skinner',count,value,'',revision,action,link(s)];
 if(chunks.length===1)return [row(text,rev,'TIMES')];
 return [...chunks.map((c,i)=>row(c,rev+'#'+(i+1)+'/'+chunks.length,'TIMES_PART')),row('',rev,'TIMES_COMMIT')];
}
function present(data,item){return (data||[]).some(r=>Array.isArray(r)&&clean(r[1])===clean(item.row[1])&&clean(r[8])===clean(item.row[8])&&clean(r[9])===clean(item.row[9]));}
async function send(item){
 const c=new AbortController(),t=setTimeout(()=>c.abort(),18000);
 try{await fetch(cloudURL(),{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sheet:SHEET,row:item.row}),signal:c.signal});}
 finally{clearTimeout(t);}
}
async function sync(){
 if(syncing||!allowed()||!queue.length)return;
 syncing=true;top('Checking Times saves…');
 try{
  for(const tx of queue.slice()){
   for(const part of tx.parts){
    if(part.confirmed)continue;
    let data;
    try{data=await cloud();}catch(e){part.error='Sheet unavailable';break;}
    if(present(data,part)){part.confirmed=true;persist();continue;}
    if(part.sentAt){part.error='Upload not yet confirmed';break;}
    part.sentAt=Date.now();if(!persist())break;
    try{await send(part);await sleep(1100);data=await cloud();
     if(present(data,part)){part.confirmed=true;part.error='';}else{part.error='Awaiting sheet confirmation';}
    }catch(e){part.error='Upload outcome uncertain';}
    persist();if(!part.confirmed)break;
   }
   if(tx.parts.every(p=>p.confirmed)){
    queue=queue.filter(q=>q.id!==tx.id);persist();
    try{saved=decode(await cloud());loaded=true;localStorage.setItem(CACHE,JSON.stringify(saved));}catch(e){}
    if(Object.prototype.hasOwnProperty.call(drafts,tx.serviceId)&&drafts[tx.serviceId]===tx.note){
     clearDraft(tx.serviceId);
     editing.delete(tx.serviceId);
     updateCard(tx.serviceId);
    }
    state(tx.serviceId,'Saved to Google Sheets ✓','success');
   }else state(tx.serviceId,'Not confirmed — your Times are kept on this device','warning');
  }
 }finally{syncing=false;top(queue.length?'Some Times saves are awaiting confirmation. Use REFRESH FROM SHEETS to recheck.':'Times ready.');refreshFields();}
}
async function save(id){
 if(!allowed())return;const s=services().find(x=>x.id===id),el=$('ftText-'+id);if(!s||!el)return;
 const note=str(el.value);
 if(!Object.prototype.hasOwnProperty.call(drafts,id))bases[id]=saved[id]?.revision||'';
 drafts[id]=note;saveDraft(id);
 if(pending(id)){state(id,'Already waiting for confirmation','warning');return;}
 if(!loaded){state(id,'Connecting to Google Sheets…','warning');await refresh();if(!loaded)return;}
 try{
  const remote=decode(await cloud())[id]||{revision:'',text:''};
  const latest=remote.revision||'';
  let base=bases[id]??saved[id]?.revision??'';
  if(!base&&isOriginalBlank(id,remote)){
   base=latest;bases[id]=latest;saveDraft(id);
  }
  if(latest!==base){
   if(str(remote.text)===note){
    reconcileCloud({...saved,[id]:remote});refreshFields();
    state(id,'Already saved in Google Sheets ✓','success');
    return;
   }
   state(id,'NOT UPLOADED: newer Times exist on another device. Your notes are preserved here. Copy them before reloading the latest version.','warning');
   return;
  }
 }catch(e){state(id,'NOT UPLOADED: cannot verify Google Sheets. Your Times remain on this device.','warning');return;}
 const rev='T-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
 const tx={id:rev,serviceId:id,note,parts:rowsFor(s,note,rev).map(row=>({row,sentAt:0,confirmed:false,error:''}))};
 queue.push(tx);if(!persist()){queue=queue.filter(q=>q.id!==rev);return;}
 state(id,'Saving Times…','warning');await sync();
}
function capture(id,note){
 if(!Object.prototype.hasOwnProperty.call(drafts,id))bases[id]=saved[id]?.revision||'';
 drafts[id]=str(note);saveDraft(id);state(id,'Unsaved changes','warning');
}
function visibility(){
 if(!allowed()){
  if($('michaelServiceTimes')?.classList.contains('active')&&typeof openSection==='function')openSection('home');
  expanded.clear();editing.clear();
  $('michaelServiceTimes')?.remove();$('michaelServiceTimesNav')?.remove();return false;
 }
 return build();
}
function init(){
 if(ready)return;ready=true;readLocal();visibility();render();top('Enter your Times under each service, then save.');
 document.addEventListener('inspector-hub-login-change',visibility);
 window.addEventListener('storage',e=>{if(['activeInspector','michaelLoginExpiresAt'].includes(e.key))visibility();});
 window.addEventListener('inspector-service-master-updated',()=>{if(allowed())render();});
 document.addEventListener('input',e=>{if(!allowed())return;
  if(e.target?.id==='ftUpcomingOnly'){
   upcomingOnly=!!e.target.checked;
   try{localStorage.setItem(FILTER_PREF,String(upcomingOnly));}catch(err){}
   refreshFields();
   return;
  }
  if(e.target?.id==='ftSearch'){search=clean(e.target.value).toLowerCase();render();return;}
  const x=e.target?.closest?.('[data-ft-text]');if(x)capture(x.dataset.ftText,x.value);
 });
 document.addEventListener('click',e=>{
  if(e.target.closest?.('[data-open="michaelServiceTimes"]')){if(!allowed()){e.preventDefault();e.stopImmediatePropagation();visibility();return;}refresh().then(()=>{if(queue.length)sync();});}
  if(!allowed())return;
  const toggle=e.target.closest?.('[data-ft-toggle]');if(toggle){toggleTimes(toggle.dataset.ftToggle);return;}
  const edit=e.target.closest?.('[data-ft-edit]');if(edit){startEdit(edit.dataset.ftEdit);return;}
  const end=e.target.closest?.('[data-ft-end-edit]');if(end){stopEdit(end.dataset.ftEndEdit);return;}
  const b=e.target.closest?.('[data-ft-save]');if(b){save(b.dataset.ftSave);return;}
  if(e.target.closest?.('#ftRefresh')){refresh().then(sync);return;}
 });
 window.addEventListener('online',()=>{if(allowed())refresh().then(sync);});
 document.addEventListener('visibilitychange',()=>{
  if(!document.hidden){
   visibility();
   if(allowed()&&isTimesVisible())refresh().then(()=>{if(queue.length)sync();});
  }
 });
 window.addEventListener('pageshow',()=>{
  if(allowed()&&isTimesVisible())refresh().then(()=>{if(queue.length)sync();});
 });
 setInterval(()=>{
  visibility();
  if(allowed()&&isTimesVisible()){
   if(upcomingOnly)refreshFields(); // Recalculate as soon as the next minute is reached.
   if(queue.length)sync();else refresh();
  }
 },60000);
 if(queue.length)sync();
}
let tries=0;const timer=setInterval(()=>{
 if(typeof getInspector==='function'&&window.InspectorCoverageModel&&window.InspectorCoverageTimetableUrl&&$('home')&&document.querySelector('.machine')){clearInterval(timer);init();}
 else if(++tries>90)clearInterval(timer);
},200);
})();