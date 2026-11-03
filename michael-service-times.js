/* Inspector Hub — Michael-only Fife service stop and timetable editor.
   Shared Google Sheets tab: Fife Service Times. Append-only revision snapshots
   preserve stop deletions, order, and edit history. No invented scheduled times. */
(function(){
'use strict';
const SHEET='Fife Service Times';
const TAB_URL='https://docs.google.com/spreadsheets/d/110csCfzaZ6w_jFQwsK3l_KRy0KeupulU5SgyYxG1pQI/edit#gid=1420726301';
const CACHE_KEY='fifeTimesReadCacheV1',DRAFT_KEY='fifeTimesDraftV1:',QUEUE_KEY='fifeTimesPendingV1';
const $=id=>document.getElementById(id),str=v=>String(v??'').trim();
const esc=v=>str(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const timeOK=v=>/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(str(v));
let current='',rows=[],originalRevision='',saved={},pending=[],busy=false,loading=false,loaded=false,notice='',status='idle',search='',dirty=false,booted=false,autoDraftTimer=0;
function michael(){
 let name='';try{name=typeof getInspector==='function'?getInspector():localStorage.getItem('activeInspector')||'';}catch(e){}
 return /^(?:m\.?\s*skinner|michael\s+skinner)$/i.test(str(name))&&Number(localStorage.getItem('michaelLoginExpiresAt')||0)>Date.now();
}
function services(){
 const m=window.InspectorCoverageModel;
 return m?m.defs().filter(m.fifeService).sort((a,b)=>str(a.code).localeCompare(str(b.code),undefined,{numeric:true})||str(a.route).localeCompare(str(b.route))):[];
}
function linkFor(s){
 const url=str(window.InspectorCoverageTimetableUrl?.(s)||'');
 return /^https:\/\/(?:www\.)?bustimes\.org\/services\/[a-z0-9/_-]+(?:\?[a-z0-9=&_%.-]*)?$/i.test(url)?url:'';
}
function safeEntries(items){
 if(!Array.isArray(items))return[];
 return items.filter(v=>v&&typeof v==='object').map(x=>({
  stop:str(x.stop).slice(0,300),time:str(x.time).slice(0,10),
  direction:str(x.direction).slice(0,140),days:str(x.days).slice(0,80),
  notes:str(x.notes).slice(0,600)
 })).filter(x=>x.stop&&timeOK(x.time));
}
function readLocal(){
 try{const x=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');if(x&&typeof x==='object'&&!Array.isArray(x))saved=x;}catch(e){saved={};}
 try{const q=JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]');if(Array.isArray(q))pending=q.filter(x=>x&&x.id&&Array.isArray(x.parts));}catch(e){pending=[];}
}
function persistPending(){
 try{localStorage.setItem(QUEUE_KEY,JSON.stringify(pending));return true;}
 catch(e){alert('Device storage is full. Nothing has been sent; your times have not been cleared. Export or free storage and try again.');return false;}
}
function persistCache(){try{localStorage.setItem(CACHE_KEY,JSON.stringify(saved));}catch(e){}}
function draftKey(id){return DRAFT_KEY+id;}
function saveDraft(){
 if(!current||!michael())return;
 try{localStorage.setItem(draftKey(current),JSON.stringify(rows));}catch(e){}
 dirty=true;renderStatus();
}
function discardDraft(id){try{localStorage.removeItem(draftKey(id));}catch(e){}}
function dayStamp(){return new Date().toISOString();}
function revision(){return 'FIFE-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);}
function readCloudRows(raw){
 const snapshots={},chunks=new Map(),revisions=new Map();
 for(const r of Array.isArray(raw)?raw:[]){
  if(!Array.isArray(r)||r.length<10)continue;
  const id=str(r[1]),action=str(r[9]).toUpperCase(),rev=str(r[8]);
  if(!id||id.toLowerCase()==='service id')continue;
  if(action==='SEED'){if(!snapshots[id])snapshots[id]={stops:[],revision:rev,updated:'',editor:'',code:r[2],route:r[3]};continue;}
  if(action==='CHUNK'){
   const base=rev.replace(/#(\d+)\/(\d+)$/,'');
   const match=rev.match(/#(\d+)\/(\d+)$/);
   if(!match)continue;
   try{
    const part=JSON.parse(str(r[7])||'[]');
    if(!Array.isArray(part))continue;
    const key=id+'|'+base;
    if(!chunks.has(key))chunks.set(key,[]);
    chunks.get(key)[Number(match[1])]={entries:part,total:Number(match[2])};
   }catch(e){}
   revisions.set(id+'|'+rev,true);
   continue;
  }
  if(action==='SAVE'){
   try{
    const data=JSON.parse(str(r[7])||'[]');if(!Array.isArray(data))continue;
    snapshots[id]={stops:safeEntries(data),revision:rev,updated:str(r[0]),editor:str(r[4]),code:r[2],route:r[3]};
    revisions.set(id+'|'+rev,true);
   }catch(e){}
   continue;
  }
  if(action==='COMMIT'){
   let meta={};try{meta=JSON.parse(str(r[7])||'{}');}catch(e){}
   const total=Number(meta.parts)||0;
   const parts=chunks.get(id+'|'+rev)||[];
   if(total>0&&parts.length>=total&&Array.from({length:total},(_,i)=>parts[i]).every(Boolean)){
    const data=Array.from({length:total},(_,i)=>parts[i].entries).flat();
    snapshots[id]={stops:safeEntries(data),revision:rev,updated:str(r[0]),editor:str(r[4]),code:r[2],route:r[3]};
    revisions.set(id+'|'+rev,true);
   }
  }
 }
 return {snapshots,revisions};
}
function cloudUrl(){if(typeof WEB_APP_URL!=='string')throw Error('Inspector Hub Google Sheets connection unavailable');return WEB_APP_URL;}
async function readCloud(){
 const url=cloudUrl()+(cloudUrl().includes('?')?'&':'?')+'sheet='+encodeURIComponent(SHEET)+'&_='+Date.now();
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),26000);
 try{
  const response=await fetch(url,{cache:'no-store',signal:controller.signal});
  if(!response.ok)throw Error('Google Sheets HTTP '+response.status);
  const payload=await response.json();
  if(!payload||!Array.isArray(payload.data))throw Error('Invalid Google Sheets data');
  return payload.data;
 }finally{clearTimeout(timer);}
}
function parseAndPublish(raw){
 const result=readCloudRows(raw);saved=result.snapshots;loaded=true;persistCache();return result;
}
async function refresh(){
 if(loading||!michael())return;
 loading=true;notice='Reading saved stops and times';status='loading';renderStatus();
 try{
  const cloudRows=await readCloud();
  parseAndPublish(cloudRows);notice='Latest entries loaded from Google Sheets';status='ready';
  if(current&&!dirty&&!pending.some(p=>p.serviceId===current))loadEditor(current,false);
 }catch(err){
  notice='Google Sheets could not be reached ('+str(err.message)+'). Showing cached data, if available.';
  status='warning';
 }finally{loading=false;renderServices();renderStatus();}
}
function formatRows(list){return list.map(x=>[x.direction||'—',x.days||'—',x.time,x.stop,x.notes].join(' | ')).join('\n');}
function segment(list){
 const blocks=[],maxBytes=15000,maxLines=90;
 let block=[];
 for(const x of list){
  const candidate=[...block,x];
  if(block.length&&(candidate.length>maxLines||JSON.stringify(candidate).length>maxBytes||formatRows(candidate).length>maxBytes)){
   blocks.push(block);block=[x];
  }else block=candidate;
 }
 if(block.length)blocks.push(block);
 return blocks;
}
function formRows(eventId,service,entries){
 const pieces=segment(entries);
 const row=(list,index,total,action)=>[
   dayStamp(),service.id,service.code,service.route,'M Skinner',entries.length,
   formatRows(list),action==='COMMIT'?JSON.stringify({parts:total}):JSON.stringify(list),
   action==='CHUNK'?eventId+'#'+(index+1)+'/'+total:eventId,action,linkFor(service)
 ];
 if(pieces.length<=1)return [row(entries,0,1,'SAVE')];
 return [...pieces.map((p,i)=>row(p,i,pieces.length,'CHUNK')),row([],pieces.length,pieces.length,'COMMIT')];
}
function remoteContains(raw,item){
 return (raw||[]).some(r=>Array.isArray(r)&&str(r[1])===item.serviceId&&str(r[8])===item.row[8]&&str(r[9]).toUpperCase()===str(item.row[9]).toUpperCase());
}
async function sendRow(item){
 item.sentAt=Date.now();item.error='';if(!persistPending())throw Error('Unable to store upload status locally');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);
 try{
  await fetch(cloudUrl(),{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sheet:SHEET,row:item.row}),signal:controller.signal});
 }finally{clearTimeout(timer);}
}
function percent(){
 const parts=pending.flatMap(p=>p.parts);
 return parts.length?Math.round(parts.filter(p=>p.confirmed).length/parts.length*100):(loaded?100:0);
}
function pendingFor(id){return pending.some(p=>p.serviceId===id&&p.parts.some(x=>!x.confirmed));}
function message(v,mode){notice=v;status=mode||'ready';renderStatus();}
async function sync(){
 if(busy||!michael()||!pending.length)return;
 busy=true;message('Checking Google Sheets', 'loading');
 try{
  for(const record of pending.slice()){
   for(const item of record.parts){
    if(item.confirmed)continue;
    let remote=null;
    try{
     remote=await readCloud();
     if(remoteContains(remote,item)){item.confirmed=true;item.error='';persistPending();renderStatus();continue;}
    }catch(e){item.error='Unable to confirm Google Sheets ('+str(e.message)+')';persistPending();message('Connection unavailable. Your saved copy remains on this device.','warning');break;}
    if(item.sentAt){
     item.error='Previously sent but not confirmed. Do not resend without checking the sheet.';
     persistPending();message('Waiting for Google Sheets confirmation','warning');break;
    }
    // Each row can only be POSTed once automatically; opaque responses are not proof of save.
    try{
     await sendRow(item);
     await wait(1250);
     remote=await readCloud();
     if(remoteContains(remote,item)){item.confirmed=true;item.error='';}
     else item.error='Upload sent; not yet visible in Google Sheets';
    }catch(e){
     item.error='Upload result uncertain ('+str(e.message)+'). Check sheet before resending.';
    }
    persistPending();renderStatus();
    if(!item.confirmed)break;
   }
   if(record.parts.every(x=>x.confirmed)){
    pending=pending.filter(p=>p.id!==record.id);
    persistPending();
    // Cloud wins only after complete revision is present.
    try{const data=await readCloud();parseAndPublish(data);}catch(e){}
    if(current===record.serviceId&&!dirty){
     discardDraft(current);
     loadEditor(current,false);
    }
   }
  }
  if(!pending.length)message('All stop and time changes confirmed in Google Sheets','success');
  else message('Some records are awaiting Google Sheets confirmation','warning');
 }finally{busy=false;renderServices();renderStatus();}
}
async function save(){
 if(!michael()||!current)return;
 readEditor();
 const s=services().find(x=>x.id===current);if(!s)return;
 const incomplete=rows.findIndex(x=>!x.stop||!timeOK(x.time));
 if(incomplete>=0){alert('Stop '+(incomplete+1)+' needs a stop name and valid 24-hour time (HH:MM).');return;}
 if(!rows.length&&!confirm('Remove all stops and times for service '+s.code+'? This will be saved as an empty list.'))return;
 if(pendingFor(current)){message('This service already has a pending update. Check sync status before submitting another.','warning');return;}
 if(!loaded){message('Connect to Google Sheets before saving. Your draft remains on this device.','warning');return;}
 // Detect a change made by another device after the editor opened.
 try{
  const remote=readCloudRows(await readCloud()),latest=remote.snapshots[current]?.revision||'';
  if(latest!==originalRevision){
   message('This service was updated on another device. Review the latest version before saving. Your draft is preserved.','warning');return;
  }
 }catch(e){message('Cannot verify the latest version in Sheets. Your draft is preserved; try again when connected.','warning');return;}
 const tx=revision(),snapshot=rows.map(x=>({...x})),parts=formRows(tx,s,snapshot).map(row=>({serviceId:current,row,sentAt:0,confirmed:false,error:''}));
 pending.push({id:tx,serviceId:current,createdAt:Date.now(),parts});
 if(!persistPending()){pending=pending.filter(p=>p.id!==tx);return;}
 dirty=false;
 message('Saved on this device. Sending changes to Google Sheets…','loading');
 await sync();
}
function styles(){
 if($('fifeTimesStyle'))return;
 const st=document.createElement('style');st.id='fifeTimesStyle';
 st.textContent=[
  '#michaelServiceTimes{color:#e5eef5}',
  '#michaelServiceTimes .fstPanel{background:#0d2b41;border:1px solid #426c86;border-radius:12px;padding:13px;margin:10px 0}',
  '#michaelServiceTimes h2{color:#f4be65;margin:0 0 8px;font-size:21px}',
  '#michaelServiceTimes h3{color:#f4be65;font-size:16px;margin:0 0 10px}',
  '#michaelServiceTimes .fstDescription{color:#bacfdd;line-height:1.5;font-size:12px;margin:6px 0 12px}',
  '#michaelServiceTimes .fstToolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}',
  '#michaelServiceTimes .fstInput{background:#102338;border:1px solid #527992;border-radius:8px;color:white;font-size:15px;box-sizing:border-box;min-height:42px;padding:8px;width:100%;font-family:inherit}',
  '#michaelServiceTimes textarea.fstInput{resize:vertical;min-height:92px;line-height:1.45}',
  '#michaelServiceTimes .fstButton{display:inline-flex;justify-content:center;align-items:center;gap:5px;font-size:11px;font-weight:850;min-height:38px;border:1px solid #6189a3;background:#25516c;color:#fff;border-radius:8px;padding:8px 10px;cursor:pointer;text-decoration:none}',
  '#michaelServiceTimes .fstButton.primary{background:#f0b653;color:#142b3d;border-color:#f0b653}',
  '#michaelServiceTimes .fstButton.danger{background:#61333b;border-color:#a7656f}',
  '#michaelServiceTimes .fstButton:disabled{opacity:.45;cursor:not-allowed}',
  '#michaelServiceTimes .fstGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
  '#michaelServiceTimes .fstField{display:flex;flex-direction:column;gap:4px;color:#c4d7e5;font-size:11px;font-weight:800;min-width:0}',
  '#michaelServiceTimes .fstAll{grid-column:1/-1}',
  '#michaelServiceTimes .fstServices{max-height:540px;overflow-y:auto;border:1px solid #416780;border-radius:9px}',
  '#michaelServiceTimes .fstService{padding:12px;display:flex;justify-content:space-between;align-items:start;gap:10px;border-bottom:1px solid #355971}',
  '#michaelServiceTimes .fstService:last-child{border-bottom:0}',
  '#michaelServiceTimes .fstService.active{background:#1d465f}',
  '#michaelServiceTimes .fstService strong{font-size:16px}',
  '#michaelServiceTimes .fstRoute{color:#c4d7e5;font-size:11px;margin:3px 0;line-height:1.4}',
  '#michaelServiceTimes .fstServiceActions{display:flex;gap:6px;flex-direction:column;min-width:110px}',
  '#michaelServiceTimes .fstServiceActions .fstButton{font-size:10px;min-height:34px}',
  '#michaelServiceTimes .fstBadge{display:inline-block;border:1px solid #688da4;color:#d2e6f2;font-size:10px;font-weight:850;padding:4px 7px;border-radius:6px}',
  '#michaelServiceTimes .fstEditRow{border:1px solid #456d85;background:#163c54;border-radius:10px;padding:10px;margin:9px 0}',
  '#michaelServiceTimes .fstRowTop{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}',
  '#michaelServiceTimes .fstRowTop strong{font-size:12px;color:#f1c678}',
  '#michaelServiceTimes .fstRowButtons{display:flex;flex-wrap:wrap;gap:5px}',
  '#michaelServiceTimes .fstRowButtons .fstButton{font-size:10px;min-height:31px;padding:5px 7px}',
  '#michaelServiceTimes .fstStatus{border-radius:9px;padding:9px;background:#193d54;border:1px solid #496e89;margin:10px 0}',
  '#michaelServiceTimes .fstStatusTop{display:flex;justify-content:space-between;gap:8px;font-size:11px;font-weight:850}',
  '#michaelServiceTimes .fstBar{height:11px;background:#203649;border:1px solid #476883;border-radius:20px;overflow:hidden;margin-top:8px}',
  '#michaelServiceTimes .fstFill{height:100%;background:#e4b65f;transition:width .3s ease}',
  '#michaelServiceTimes .fstStatus.success .fstFill{background:#42bd85}',
  '#michaelServiceTimes .fstStatus.warning .fstFill{background:#dcad4c}',
  '#michaelServiceTimes .fstNotice{font-size:11px;line-height:1.45;color:#e4d7bc;margin-top:6px}',
  '#michaelServiceTimes .fstSmall{font-size:11px;color:#c1d4df;line-height:1.5}',
  '#michaelServiceTimes .fstEmpty{text-align:center;color:#bfd2e0;font-size:12px;padding:17px}',
  '#michaelServiceTimes .fstFlex{display:flex;gap:9px;align-items:center;flex-wrap:wrap}',
  '#michaelServiceTimes [hidden]{display:none!important}',
  '@media(max-width:600px){#michaelServiceTimes .fstGrid{grid-template-columns:1fr}#michaelServiceTimes .fstAll{grid-column:auto}#michaelServiceTimes .fstServiceActions{min-width:95px}#michaelServiceTimes .fstServiceActions .fstButton{padding:6px}}'
 ].join('');
 document.head.appendChild(st);
}
function renderServices(){
 const box=$('fstServiceList');if(!box)return;
 const all=services(),display=all.filter(s=>(s.code+' '+s.route).toLowerCase().includes(search));
 $('fstTotal').textContent=all.length+' Fife & Surrounding services';
 box.innerHTML=display.length?display.map(s=>{
  const record=saved[s.id],count=record?.stops?.length||0,hasPending=pendingFor(s.id),url=linkFor(s);
  return '<div class="fstService'+(current===s.id?' active':'')+'"><div><strong>'+esc(s.code)+'</strong>'+
   '<div class="fstRoute">'+esc(s.route)+'</div>'+
   '<span class="fstBadge">'+count+' stop/time entr'+(count===1?'y':'ies')+'</span>'+
   (hasPending?'<span class="fstBadge">SYNC PENDING</span>':'')+
   (record?.updated?'<div class="fstSmall">Updated '+esc(record.updated.slice(0,16).replace('T',' '))+'</div>':'')+
   '</div><div class="fstServiceActions"><button class="fstButton primary" type="button" data-fst-select="'+esc(s.id)+'">SHOW STOPS &amp; TIMES</button>'+
   (url?'<a class="fstButton" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">BUSTIMES ↗</a>':'')+
   '</div></div>';
 }).join(''):'<p class="fstEmpty">No services match your search.</p>';
}
function renderStatus(){
 const box=$('fstSync');if(!box)return;
 const pct=percent();
 box.className='fstStatus '+status;
 $('fstSyncTitle').textContent=busy?'CHECKING GOOGLE SHEETS':pending.length?'SYNC PENDING':loaded?'GOOGLE SHEETS READY':'CONNECTING TO GOOGLE SHEETS';
 $('fstSyncCount').textContent=pending.length?pct+'%':status==='success'?'100%':loaded?'READY':'—';
 $('fstFill').style.width=pending.length?pct+'%':(status==='success'?'100%':'0%');
 $('fstSyncMessage').textContent=notice||'Stops and times are stored in the Fife Service Times Google Sheets tab.';
 $('fstCheckSync').hidden=!pending.length;
 $('fstResend').hidden=!pending.some(p=>p.parts.some(x=>!x.confirmed&&x.sentAt&&Date.now()-x.sentAt>300000));
 $('fstCheckSync').disabled=busy||loading;
 $('fstSave').disabled=!michael()||!current||busy||pendingFor(current);
}
function readEditor(){
 if(!current)return;
 const inputs=$('fstRows')?.querySelectorAll('[data-fst-row]');
 if(!inputs)return;
 rows=[...inputs].map(el=>({
  stop:el.querySelector('[data-fst-field="stop"]')?.value.trim()||'',
  time:el.querySelector('[data-fst-field="time"]')?.value.trim()||'',
  direction:el.querySelector('[data-fst-field="direction"]')?.value.trim()||'',
  days:el.querySelector('[data-fst-field="days"]')?.value.trim()||'',
  notes:el.querySelector('[data-fst-field="notes"]')?.value.trim()||''
 }));
}
function renderEditor(){
 const wrap=$('fstEditor');if(!wrap)return;
 if(!current){wrap.hidden=true;return;}
 wrap.hidden=false;
 const s=services().find(x=>x.id===current);
 if(!s){wrap.hidden=true;return;}
 $('fstServiceName').textContent=s.code+' — '+s.route;
 $('fstStopCount').textContent=rows.length+' rows';
 const link=linkFor(s);$('fstCurrentBusTimes').hidden=!link;if(link)$('fstCurrentBusTimes').href=link;
 $('fstRows').innerHTML=rows.length?rows.map((r,i)=>'<article data-fst-row="'+i+'" class="fstEditRow">'+
  '<div class="fstRowTop"><strong>STOP '+(i+1)+'</strong><div class="fstRowButtons">'+
  '<button type="button" class="fstButton" data-fst-up="'+i+'" aria-label="Move stop up" '+(i?'':'disabled')+'>↑</button>'+
  '<button type="button" class="fstButton" data-fst-down="'+i+'" aria-label="Move stop down" '+(i===rows.length-1?'disabled':'')+'>↓</button>'+
  '<button type="button" class="fstButton danger" data-fst-delete="'+i+'">REMOVE</button></div></div>'+
  '<div class="fstGrid"><label class="fstField">Stop / location<input class="fstInput" data-fst-field="stop" value="'+esc(r.stop)+'" placeholder="e.g. Kirkcaldy Bus Station"></label>'+
  '<label class="fstField">Scheduled time<input class="fstInput" type="time" data-fst-field="time" value="'+esc(timeOK(r.time)?r.time:'')+'"></label>'+
  '<label class="fstField">Direction / destination<input class="fstInput" data-fst-field="direction" value="'+esc(r.direction)+'" placeholder="e.g. Towards Leven"></label>'+
  '<label class="fstField">Days / timetable<input class="fstInput" data-fst-field="days" value="'+esc(r.days)+'" placeholder="e.g. Mon–Fri"></label>'+
  '<label class="fstField fstAll">Notes (optional)<input class="fstInput" data-fst-field="notes" value="'+esc(r.notes)+'" placeholder="Stand, journey or other detail"></label></div></article>').join(''):'<p class="fstEmpty">No stops entered. Add one individually or paste multiple from BusTimes below.</p>';
 renderStatus();
}
function loadEditor(id,keepDraft=true){
 if(!michael())return;
 const s=services().find(x=>x.id===id);if(!s)return;
 if(current&&current!==id){readEditor();saveDraft();}
 current=id;originalRevision=saved[id]?.revision||'';
 rows=(saved[id]?.stops||[]).map(x=>({...x}));dirty=false;
 if(keepDraft){
  try{
   const draft=JSON.parse(localStorage.getItem(draftKey(id))||'null');
   if(Array.isArray(draft)){rows=draft.map(x=>({...x}));dirty=true;notice='Restored your unfinished edits for this service';}
  }catch(e){}
 }
 renderServices();renderEditor();
 $('fstEditor')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function parsePaste(raw,direction,days){
 const result=[],ignored=[];
 const rx=/(?:^|[^\d])([01]?\d|2[0-3]):([0-5]\d)(?!\d)/g;
 for(const line of str(raw).split(/\r?\n/)){
  const value=line.trim();if(!value)continue;
  const matches=[...value.matchAll(rx)];
  if(!matches.length){ignored.push(value);continue;}
  let stop='';
  const first=matches[0],last=matches.at(-1);
  const before=value.slice(0,first.index).replace(/[\t,;| ]+$/,'').trim();
  const after=value.slice(last.index+last[0].length).replace(/^[\t,;| ]+/,'').trim();
  if(before.replace(/[\t,;| ]/g,'').length>2)stop=before;
  else if(after.replace(/[\t,;| ]/g,'').length>2)stop=after;
  stop=stop.replace(/^[,;|\t ]+|[,;|\t ]+$/g,'').trim();
  if(!stop||/^(time|stop|direction|bus times|service)$/i.test(stop)){ignored.push(value);continue;}
  for(const m of matches){
   const time=String(Number(m[1])).padStart(2,'0')+':'+m[2];
   result.push({stop:stop.slice(0,300),time,direction,days,notes:''});
  }
 }
 return {result,ignored};
}
function bulkAdd(){
 if(!current)return;
 readEditor();
 const pasted=$('fstPaste').value;
 const parsed=parsePaste(pasted,str($('fstPasteDirection').value),str($('fstPasteDays').value));
 if(!parsed.result.length){alert('No valid stop/time lines found. Use one stop and a 24-hour time per line, e.g. Kirkcaldy Bus Station<TAB>09:15.');return;}
 rows.push(...parsed.result);
 saveDraft();renderEditor();
 $('fstPaste').value='';
 const n=parsed.result.length;message(n+' stop/time entries added to this editor'+(parsed.ignored.length?'; '+parsed.ignored.length+' lines skipped':'')+'. Press SAVE TO GOOGLE SHEETS to publish.','ready');
}
function select(id){loadEditor(id,true);}
function addRow(){
 if(!current)return;readEditor();
 rows.push({stop:'',time:'',direction:'',days:'',notes:''});saveDraft();renderEditor();
 const last=[...$('fstRows').querySelectorAll('[data-fst-row]')].at(-1);
 last?.querySelector('[data-fst-field="stop"]')?.focus();
}
function moveRow(n,up){
 readEditor();const j=n+(up?-1:1);if(n<0||j<0||n>=rows.length||j>=rows.length)return;
 [rows[n],rows[j]]=[rows[j],rows[n]];saveDraft();renderEditor();
}
function deleteRow(n){
 readEditor();if(n<0||n>=rows.length)return;
 rows.splice(n,1);saveDraft();renderEditor();
}
async function explicitResend(){
 if(!michael()||!pending.length)return;
 if(!confirm('Before resending, check the Fife Service Times Google Sheet tab. Only resend if the pending revision is not there. An unnecessary resend can duplicate the history. Continue?'))return;
 for(const p of pending){
  for(const part of p.parts){if(!part.confirmed&&part.sentAt&&Date.now()-part.sentAt>300000){part.sentAt=0;part.error='Manually authorised resend';}}
 }
 persistPending();await sync();
}
function build(){
 if(!michael()||!window.InspectorCoverageModel)return false;
 const home=$('home'),nav=home?.querySelector('.nav'),machine=document.querySelector('.machine');
 if(!home||!nav||!machine)return false;
 styles();
 if(!$('michaelServiceTimesNav')){
  const b=document.createElement('button');b.id='michaelServiceTimesNav';b.dataset.open='michaelServiceTimes';b.type='button';
  b.innerHTML='<span class="navIcon">🕒</span>Times &amp; Stops';
  const after=$('dpNavButton');
  if(after?.parentElement===nav)after.insertAdjacentElement('afterend',b);else nav.insertBefore(b,nav.firstChild);
 }
 if(!$('michaelServiceTimes')){
  const sec=document.createElement('section');sec.id='michaelServiceTimes';sec.className='section';
  sec.innerHTML=[
   '<button class="backBtn" data-open="home">← Back</button>',
   '<div class="fstPanel"><h2>🕒 FIFE SERVICE TIMES &amp; STOPS</h2>',
   '<p class="fstDescription">Michael-only editor for all Fife &amp; Surrounding Stagecoach services. Select any service to show and edit its stops and scheduled times. Copy information from the linked BusTimes timetable and paste or type it here.</p>',
   '<div class="fstToolbar"><a class="fstButton" target="_blank" rel="noopener noreferrer" href="'+TAB_URL+'">OPEN GOOGLE SHEETS TAB ↗</a>',
   '<button id="fstRefresh" type="button" class="fstButton">REFRESH FROM SHEETS</button>',
   '<span id="fstTotal" class="fstBadge">Loading services</span></div>',
   '<div id="fstSync" class="fstStatus"><div class="fstStatusTop"><strong id="fstSyncTitle">CONNECTING TO GOOGLE SHEETS</strong><span id="fstSyncCount">—</span></div>',
   '<div class="fstBar"><div id="fstFill" class="fstFill" style="width:0%"></div></div>',
   '<div class="fstNotice" id="fstSyncMessage"></div><div class="fstToolbar"><button id="fstCheckSync" class="fstButton" type="button" hidden>CHECK SYNC STATUS</button>',
   '<button id="fstResend" class="fstButton danger" type="button" hidden>RESEND AFTER CHECKING SHEET</button></div></div>',
   '<label class="fstField">Search services<input id="fstSearch" class="fstInput" placeholder="Service, number or route, e.g. 7 or Kirkcaldy"></label>',
   '<div id="fstServiceList" class="fstServices"></div></div>',
   '<div class="fstPanel" id="fstEditor" hidden><h3 id="fstServiceName">Select a service</h3>',
   '<div class="fstToolbar"><span id="fstStopCount" class="fstBadge">0 stops</span>',
   '<a id="fstCurrentBusTimes" class="fstButton" target="_blank" rel="noopener noreferrer" hidden>OPEN SERVICE TIMETABLE ↗</a>',
   '<button id="fstAdd" type="button" class="fstButton">+ ADD STOP &amp; TIME</button></div>',
   '<div id="fstRows"></div><div class="fstToolbar"><button id="fstAddBottom" class="fstButton" type="button">+ ADD ANOTHER STOP</button></div>',
   '<div class="fstPanel"><h3>PASTE FROM BUSTIMES</h3>',
   '<p class="fstSmall">Paste each stop with its time on a separate line, separated by tabs, spaces or commas. Multiple times on the same line will create multiple entries for that stop.</p>',
   '<div class="fstGrid"><label class="fstField">Direction / destination for pasted stops<input id="fstPasteDirection" class="fstInput" placeholder="e.g. To Dunfermline"></label>',
   '<label class="fstField">Days / timetable for pasted stops<input id="fstPasteDays" class="fstInput" placeholder="e.g. Monday to Friday"></label>',
   '<label class="fstField fstAll">Stop and time lines<textarea id="fstPaste" class="fstInput" rows="5" placeholder="Kirkcaldy Bus Station     09:15\nVictoria Hospital     09:27\nGlenrothes Bus Station     09:45"></textarea></label></div>',
   '<div class="fstToolbar"><button id="fstPasteAdd" class="fstButton primary" type="button">ADD PASTED STOPS</button></div></div>',
   '<div class="fstToolbar"><button id="fstSave" class="fstButton primary" type="button">SAVE TO GOOGLE SHEETS</button>',
   '<button id="fstDiscard" class="fstButton" type="button">DISCARD UNSAVED CHANGES</button></div>',
   '<p class="fstSmall">The stop list can be as long as you need. Removing a stop and saving creates a new full version of that service, without deleting other services or their histories. Pending saves are kept on this device. Timetable times are the ones you enter; the app does not guess them.</p>',
   '</div>'
  ].join('');
  machine.appendChild(sec);
 }
 return true;
}
function visibility(){
 if(!michael()){
  if($('michaelServiceTimes')?.classList.contains('active')&&typeof openSection==='function')openSection('home');
  $('michaelServiceTimesNav')?.remove();
  $('michaelServiceTimes')?.remove();
  current='';rows=[];dirty=false;
  return false;
 }
 return build();
}
function init(){
 if(booted)return;booted=true;
 readLocal();visibility();renderServices();renderStatus();
 document.addEventListener('inspector-hub-login-change',()=>{visibility();});
 window.addEventListener('storage',e=>{if(['activeInspector','michaelLoginExpiresAt'].includes(e.key))visibility();});
 window.addEventListener('inspector-service-master-updated',()=>{if(michael())renderServices();});
 document.addEventListener('click',e=>{
  const target=e.target;
  if(target.closest?.('[data-open="michaelServiceTimes"]')){
   if(!michael()){e.preventDefault();e.stopImmediatePropagation();visibility();return;}
   if(!loaded)refresh();else renderServices();
  }
  if(!michael())return;
  const selectEl=target.closest?.('[data-fst-select]');
  if(selectEl){select(selectEl.dataset.fstSelect);return;}
  const del=target.closest?.('[data-fst-delete]');if(del){deleteRow(Number(del.dataset.fstDelete));return;}
  const up=target.closest?.('[data-fst-up]');if(up){moveRow(Number(up.dataset.fstUp),true);return;}
  const down=target.closest?.('[data-fst-down]');if(down){moveRow(Number(down.dataset.fstDown),false);return;}
  if(target.closest?.('#fstAdd,#fstAddBottom')){addRow();return;}
  if(target.closest?.('#fstPasteAdd')){bulkAdd();return;}
  if(target.closest?.('#fstSave')){save();return;}
  if(target.closest?.('#fstRefresh')){refresh();return;}
  if(target.closest?.('#fstCheckSync')){sync();return;}
  if(target.closest?.('#fstResend')){explicitResend();return;}
  if(target.closest?.('#fstDiscard')&&current){
   if(!confirm('Discard unsaved edits for this service?'))return;
   discardDraft(current);dirty=false;loadEditor(current,false);return;
  }
 });
 document.addEventListener('input',e=>{
  if(!michael())return;
  if(e.target.id==='fstSearch'){search=str(e.target.value).toLowerCase();renderServices();return;}
  if(e.target.closest?.('#fstRows')){
   clearTimeout(autoDraftTimer);
   autoDraftTimer=setTimeout(()=>{if(current){readEditor();saveDraft();}},400);
  }
 });
 window.addEventListener('online',()=>{if(michael()){refresh();sync();}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&michael())visibility();});
 setInterval(()=>{if(michael()&&$('michaelServiceTimes')?.classList.contains('active')){if(pending.length)sync();else if(!loading)refresh();}},120000);
 // Recover previously stored edits without guessing whether an opaque POST succeeded.
 if(pending.length)sync();
}
let checks=0;
const timer=setInterval(()=>{if(typeof getInspector==='function'&&window.InspectorCoverageModel&&window.InspectorCoverageTimetableUrl&&document.querySelector('.machine')&&$('home')){
 clearInterval(timer);init();
}else if(++checks>100)clearInterval(timer);},200);
})();
