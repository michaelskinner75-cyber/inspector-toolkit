(function(){
'use strict';
// Reliable check-sheet submit: persist before upload; confirm each sheet by read-back.
// Own only the check-sheet Save button. Other forms retain their existing handlers.
const OUTBOX='inspectorHubInspectionOutboxV1';
const DRAFT_PREFIX='inspectorHubInspectionDraftV1:';
const FIELDS=['csDate','csDepot','csDepotOther','csDriver','csService','csServiceSearch','csFleet','csTimeOn','csBoarding','csDestination','csDestinationChoice','csDestinationManual','csNSA','csNSAFault','csNSANotes','csDriverReport','csDriverReason','csNatureOffence','csPassengers','csJourneyStatus','csConfirmedEarly','csVehicleIssue','csVehicleIssueNotes'];
const $=id=>document.getElementById(id);
const val=id=>String($(id)?.value||'').trim();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const getName=()=>typeof getInspector==='function'?getInspector():'';
let queue=[],working=false,recoveryTimer=0,draftTimer=0,restoring=false;
try{const saved=JSON.parse(localStorage.getItem(OUTBOX)||'[]');queue=Array.isArray(saved)?saved:[];}catch(e){queue=[];}
function persist(){localStorage.setItem(OUTBOX,JSON.stringify(queue));}
function draftKey(){return DRAFT_PREFIX+(getName()||'unassigned');}
function collectDraft(){const data={};FIELDS.forEach(id=>{if($(id))data[id]=$(id).value;});return data;}
function saveDraft(){
 if(restoring||!getName())return;
 try{
  const data=collectDraft();
  if(!val('csDriver')&&!val('csServiceSearch')&&!val('csService')&&!val('csFleet')&&!val('csDriverReason')&&!val('csNSANotes')&&!val('csVehicleIssueNotes')){localStorage.removeItem(draftKey());return;}
  localStorage.setItem(draftKey(),JSON.stringify(data));
 }catch(e){console.warn('Check-sheet draft could not be stored',e);}
}
function restoreDraft(){
 if(!getName())return;
 let data;try{data=JSON.parse(localStorage.getItem(draftKey())||'null');}catch(e){}
 if(!data||typeof data!=='object')return;
 // Never overwrite an inspection the user has already started entering.
 if(val('csDriver')||val('csFleet')||val('csServiceSearch')||val('csService'))return;
 restoring=true;
 try{
  FIELDS.forEach(id=>{if($(id)&&Object.prototype.hasOwnProperty.call(data,id))$(id).value=data[id];});
  if($('csDepotOther'))$('csDepotOther').style.display=val('csDepot')==='Other'?'block':'none';
  if($('csDestinationManual'))$('csDestinationManual').style.display=val('csDestinationChoice')==='__manual__'?'block':'none';
  $('csJourneyStatus')?.dispatchEvent(new Event('change',{bubbles:true}));
 }finally{restoring=false;}
 feedback('An unfinished inspection was restored from this device.');
}
function canonDate(v){
 const s=String(v||'').trim();
 let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return [m[1],m[2].padStart(2,'0'),m[3].padStart(2,'0')].join('-');
 m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);if(m)return [(m[3].length===2?'20':'')+m[3],m[2].padStart(2,'0'),m[1].padStart(2,'0')].join('-');
 const d=new Date(s);return isNaN(d)?s:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function canonTime(v){
 const s=String(v||'').trim();let m=s.match(/^(\d{1,2}):(\d{2})/);
 if(m)return String(Number(m[1])).padStart(2,'0')+':'+m[2];
 const d=new Date(s);return isNaN(d)?s:d.toISOString().slice(11,16);
}
function sameRow(sheet,a,b){
 if(!Array.isArray(a)||!Array.isArray(b))return false;
 const ids=sheet==='Inspections'?[2,3,4,5,6,7,8,9,13,14]:sheet==='Driver Reports'?[2,3,4,5,6,7,8,9]:[2,3,4,5,6,7,8,9,10,11];
 return canonDate(a[0])===canonDate(b[0])&&canonTime(a[1])===canonTime(b[1])&&ids.every(i=>String(a[i]??'').trim()===String(b[i]??'').trim());
}
function label(){
 const pending=queue.filter(e=>e.items.some(i=>!i.confirmed)).length;
 if(pending)return pending+' inspection'+(pending===1?'':'s')+' stored on this device, awaiting Google Sheets confirmation. Keep this device until synced.';
 return 'All queued inspections have been confirmed in Google Sheets.';
}
function feedback(message){
 let box=$('inspectionSaveRecoveryStatus');
 if(!box){
  const btn=$('saveCheckSheetBtn');if(!btn)return;
  box=document.createElement('div');box.id='inspectionSaveRecoveryStatus';box.setAttribute('role','status');
  box.style.cssText='margin:10px 0;padding:10px 12px;border:1px solid #496980;border-radius:10px;background:#102a3d;color:#fff;font-size:13px;line-height:1.5;';
  const parent=btn.parentElement||btn;parent.insertAdjacentElement('afterend',box);
 }
 const pending=queue.some(e=>e.items.some(i=>!i.confirmed));
 box.textContent=message||label();
 if(pending){
  const retry=document.createElement('button');retry.type='button';retry.textContent='RETRY SYNC';
  retry.style.cssText='display:block;margin-top:8px;padding:7px 12px;border:1px solid #deb56c;border-radius:7px;background:#4a3417;color:white;font-weight:700;';
  retry.addEventListener('click',()=>{queue.forEach(e=>e.items.forEach(i=>{if(!i.confirmed)i.sentAt=0;}));try{persist();}catch(e){}sync();});
  box.appendChild(retry);
 }
}
function nextOffenceRef(date,inspector){
 const parts=String(inspector).trim().split(/\s+/).filter(Boolean);
 const initials=parts.length<2?String(parts[0]||'XX').slice(0,2).toUpperCase():(parts[0][0]+parts[parts.length-1][0]).toUpperCase();
 const iso=canonDate(date),digits=iso.slice(8,10)+iso.slice(5,7)+iso.slice(2,4),prefix=digits+'/'+initials+'/';
 let high=0;const inspect=r=>{const x=String(r?.[15]||'');if(x.startsWith(prefix)){const n=Number(x.slice(prefix.length));if(Number.isFinite(n))high=Math.max(high,n);}};
 try{(cloud['Inspections']||[]).forEach(inspect);}catch(e){}
 try{(JSON.parse(localStorage.getItem('local_Inspections')||'[]')||[]).forEach(inspect);}catch(e){}
 queue.forEach(e=>e.items.filter(x=>x.sheet==='Inspections').forEach(x=>inspect(x.row)));
 const key='offenceRefCounter:'+prefix;high=Math.max(high,Number(localStorage.getItem(key)||0)||0);
 const result=prefix+(high+1);localStorage.setItem(key,String(high+1));return result;
}
function buildRows(){
 const depot=val('csDepot')==='Other'?val('csDepotOther'):val('csDepot');
 const service=val('csServiceSearch')||val('csService');
 const destination=val('csDestinationChoice')==='__manual__'?val('csDestinationManual'):(val('csDestinationChoice')||val('csDestination'));
 const driver=val('csDriver'),fleet=val('csFleet');
 if(!depot||!service||!driver||!fleet){alert('Please select a depot and enter the driver, service and fleet number.');return null;}
 const date=typeof normaliseDateForSave==='function'?normaliseDateForSave(val('csDate')):val('csDate');
 const time=typeof normaliseTimeForSave==='function'?normaliseTimeForSave(typeof now==='function'?now():new Date().toLocaleTimeString()):new Date().toLocaleTimeString();
 const boarded=typeof normaliseTimeForSave==='function'?normaliseTimeForSave(val('csTimeOn')):val('csTimeOn');
 const inspector=getName();if(!inspector){alert('Please select an inspector before saving.');return null;}
 const reportType=val('csDriverReport')||'No Driver Report';
 const vehicleIssue=val('csVehicleIssue'),vehicleNotes=val('csVehicleIssueNotes');
 const vehicleText=vehicleIssue&&vehicleIssue!=='No Vehicle Issues'?'Vehicle issue: '+vehicleIssue+(vehicleNotes?' — '+vehicleNotes:''):(vehicleNotes?'Vehicle comments: '+vehicleNotes:'');
 const reportReason=[vehicleText,val('csDriverReason')].filter(Boolean).join('\n');
 const ref=reportType==='Offence Report Submitted'?nextOffenceRef(date,inspector):'';
 const nature=val('csNatureOffence'),passengers=val('csPassengers'),status=val('csJourneyStatus')||'On Time',early=status==='Early'?(val('csConfirmedEarly')||'No'):'No';
 const row=[date,time,inspector,depot,driver,service,fleet,boarded,val('csBoarding'),destination,val('csNSA'),val('csNSAFault'),val('csNSANotes'),reportType,reportReason,ref,nature,passengers,status,early];
 const items=[{sheet:'Inspections',row,confirmed:false,sentAt:0},
  {sheet:'NSA Faults',row:[date,time,inspector,depot,fleet,service,driver,row[10],row[11],row[12],row[8],row[9],'Inspector Check Sheet'],confirmed:false,sentAt:0}];
 if(reportType!=='No Driver Report')items.push({sheet:'Driver Reports',row:[date,time,inspector,driver,depot,reportType,reportReason,service,fleet,ref,row[8],row[9],nature,passengers,depot],confirmed:false,sentAt:0});
 return {items,ref};
}
function storeLocal(row){
 const key='local_Inspections';let rows=[];
 try{rows=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(rows))rows=[];}catch(e){}
 if(!rows.some(r=>sameRow('Inspections',r,row))){rows.push(row);try{localStorage.setItem(key,JSON.stringify(rows));}catch(e){console.warn('Secondary local cache full',e);}}
}
function resetForm(){
 restoring=true;
 try{
  if(typeof clearCheckForm==='function')clearCheckForm();
  ['csServiceSearch','csDestinationChoice','csDestinationManual','csNatureOffence','csPassengers','csVehicleIssueNotes'].forEach(id=>{if($(id))$(id).value='';});
  if($('csVehicleIssue'))$('csVehicleIssue').value='No Vehicle Issues';
  if($('csJourneyStatus'))$('csJourneyStatus').value='On Time';
  if($('csConfirmedEarly'))$('csConfirmedEarly').value='No';
  $('csJourneyStatus')?.dispatchEvent(new Event('change',{bubbles:true}));
  const el=$('csService');if(el)el.dispatchEvent(new Event('change',{bubbles:true}));
 }finally{restoring=false;}
 try{localStorage.removeItem(draftKey());}catch(e){}
}
function submit(){
 if(working&&queue.length>30){feedback();return;}
 const built=buildRows();if(!built)return;
 const entry={id:String(Date.now())+'-'+Math.random().toString(36).slice(2,10),inspector:getName(),createdAt:Date.now(),items:built.items};
 // A durable local record is mandatory before the form can be cleared.
 queue.push(entry);
 try{persist();}catch(e){queue.pop();alert('This device could not store the inspection. Your completed form has NOT been cleared. Check available device storage and try again.');return;}
 storeLocal(built.items[0].row);
 resetForm();
 feedback('Inspection protected on this device. '+label());
 if(typeof setStatus==='function')setStatus('Inspection protected locally. Syncing to Google Sheets…');
 if(built.ref)alert('Offence reference allocated: '+built.ref);
 sync();
}
async function timeoutFetch(url,options,ms){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),ms);
 try{return await fetch(url,{...options,signal:controller.signal});}finally{clearTimeout(timer);}
}
async function remoteRows(sheet){
 const url=WEB_APP_URL+(WEB_APP_URL.includes('?')?'&':'?')+'sheet='+encodeURIComponent(sheet)+'&_='+Date.now();
 const response=await timeoutFetch(url,{cache:'no-store'},9000);
 if(!response.ok)throw new Error('Read failed: '+response.status);
 const json=await response.json();
 if(!json||!Array.isArray(json.data))throw new Error('Unexpected Google Sheets reply');
 return json.data;
}
async function syncItem(item){
 // Read before every upload, including recovery after an uncertain network timeout.
 let rows=await remoteRows(item.sheet);
 if(rows.some(r=>sameRow(item.sheet,r,item.row))){item.confirmed=true;return;}
 // A previous opaque POST might still complete: do not fire another one immediately.
 if(item.sentAt&&Date.now()-item.sentAt<120000)return;
 item.sentAt=Date.now();persist();
 await timeoutFetch(WEB_APP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({sheet:item.sheet,row:item.row})},12000);
 await wait(850);
 rows=await remoteRows(item.sheet);
 if(!rows.some(r=>sameRow(item.sheet,r,item.row))){
  await wait(1800);
  rows=await remoteRows(item.sheet);
 }
 if(rows.some(r=>sameRow(item.sheet,r,item.row)))item.confirmed=true;
}
async function sync(){
 if(working||!queue.some(e=>e.items.some(i=>!i.confirmed)))return;
 working=true;
 try{
  for(const entry of queue.slice()){
   for(const item of entry.items){
    if(item.confirmed)continue;
    try{await syncItem(item);}
    catch(err){console.warn('Inspection sync deferred:',item.sheet,err);}
    try{persist();}catch(e){}
   }
  }
  const completed=queue.filter(e=>e.items.every(i=>i.confirmed));
  if(completed.length){
   queue=queue.filter(e=>!e.items.every(i=>i.confirmed));persist();
   try{if(typeof loadCloud==='function')loadCloud(true);}catch(e){}
   if(typeof setStatus==='function')setStatus('Inspection confirmed in Google Sheets.');
  }
  feedback();
 }finally{
  working=false;
  clearTimeout(recoveryTimer);
  if(queue.some(e=>e.items.some(i=>!i.confirmed)))recoveryTimer=setTimeout(sync,18000);
 }
}
function init(){
 document.addEventListener('click',e=>{
  if(!e.target.closest?.('#saveCheckSheetBtn'))return;
  // Capture before legacy handlers that clear the form before upload finishes.
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  submit();
 },true);
 document.addEventListener('input',e=>{if(FIELDS.includes(e.target?.id)){clearTimeout(draftTimer);draftTimer=setTimeout(saveDraft,350);}},true);
 document.addEventListener('change',e=>{if(FIELDS.includes(e.target?.id)){clearTimeout(draftTimer);draftTimer=setTimeout(saveDraft,350);}},true);
 document.addEventListener('inspector-hub-login-change',()=>setTimeout(restoreDraft,150));
 window.addEventListener('online',sync);
 window.addEventListener('focus',()=>{restoreDraft();sync();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
 if(queue.length)feedback();
 setTimeout(()=>{restoreDraft();sync();},900);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();