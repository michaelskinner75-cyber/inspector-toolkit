/* Inspector Hub: Google Sheets Service List is the editable master.
   The bundled services.js remains an offline fallback; existing inspections are never changed. */
(function(){
'use strict';
const MASTER_URL='https://docs.google.com/spreadsheets/d/110csCfzaZ6w_jFQwsK3l_KRy0KeupulU5SgyYxG1pQI/edit#gid=902092960';
const SHEET='Service List';
const CACHE_KEY='inspectorServiceMasterLastGoodV1';
const MIN_ROWS=100;
let pending=null,lastRead=0,loaded=false;
const $=id=>document.getElementById(id);
const clean=s=>String(s??'').trim();
const hash=s=>{let n=2166136261;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619);}return'b'+(n>>>0).toString(36);};
const school=x=>/^(AM|BB|BE|BU|BW|CA|CH|CL|DB|DF|EW|FF|GF|GR|GW|IK|KR|LA|LK|MD|MK|ML|MT|PK|QA|SA|SC|SH|SM|SP|ST|TB|WD)\\d+[A-Z]?$/i.test(clean(x));
const readMasterRows=data=>{
 if(!Array.isArray(data)||data.length<MIN_ROWS)return null;
 const heading=(data[0]||[]).slice(0,4).map(s=>clean(s).toLowerCase());
 if(heading[0]!=='service'||heading[1]!=='route'||heading[2]!=='status')return null;
 const seen=new Set(),out=[];
 for(const row of data.slice(1)){
  const code=clean(row?.[0]).toUpperCase(),route=clean(row?.[1]),status=clean(row?.[2]).toUpperCase();
  if(!code||!route||status!=='ACTIVE'||school(code))continue;
  const id=clean(row?.[3])||hash((code+'|'+route).toLowerCase());
  if(seen.has(id))continue;
  seen.add(id);out.push({code,route,id});
 }
 return out.length>=MIN_ROWS?out:null;
};
function notice(message){
 let el=$('inspectorMasterSyncStatus');
 if(!el){
  const section=$('coverage'),anchor=$('sctStatus')||section?.querySelector('.coverageSummary');
  if(!anchor)return;
  el=document.createElement('div');
  el.id='inspectorMasterSyncStatus';el.className='small';
  el.style.cssText='margin:12px 0;padding:10px 12px;background:#102b40;border:1px solid #416783;border-radius:10px;display:flex;gap:9px;align-items:center;flex-wrap:wrap';
  const text=document.createElement('span');text.id='inspectorMasterSyncText';text.style.flex='1 1 200px';
  const link=document.createElement('a');link.href=MASTER_URL;link.target='_blank';link.rel='noopener';link.textContent='EDIT SERVICE LIST IN SHEETS';
  link.style.cssText='color:#eea83e;font-weight:800';
  const button=document.createElement('button');button.type='button';button.id='inspectorMasterSyncButton';button.className='btn';button.textContent='REFRESH SERVICE LIST';button.style.cssText='font-size:11px;padding:9px 10px;min-height:37px';
  button.addEventListener('click',()=>refresh(true));
  el.append(text,link,button);
  anchor.insertAdjacentElement('afterend',el);
 }
 const text=$('inspectorMasterSyncText');if(text)text.textContent=message;
}
function publish(list,fromCache){
 const current=JSON.stringify((window.INSPECTOR_SERVICES||[]).map(x=>[x.id,x.code,x.route]));
 const next=JSON.stringify(list.map(x=>[x.id,x.code,x.route]));
 window.INSPECTOR_SERVICE_MASTER_LOADED=true;
 window.INSPECTOR_SERVICES=list;
 try{serviceDefs=list;}catch(e){/* global lexical may not be ready */}
 window.serviceDefs=list;
 try{localStorage.setItem('serviceCoverageList',JSON.stringify(list));}catch(e){}
 if(current!==next){
  document.querySelectorAll('[data-for-service]').forEach(w=>{if(typeof w._refresh==='function')w._refresh();});
  if(typeof window.renderCoverage==='function')window.renderCoverage();
  window.dispatchEvent(new CustomEvent('inspector-service-master-updated',{detail:{count:list.length,cached:fromCache}}));
  try{window.dispatchEvent(new StorageEvent('storage',{key:'serviceCoverageList'}));}catch(e){}
 }
 loaded=true;
 notice((fromCache?'Cached service list':'Google Sheets master')+' loaded: '+list.length+' active services.');
}
function readCache(){
 try{const cached=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');if(cached?.saved&&Date.now()-cached.saved<604800000&&cached?.services?.length>=MIN_ROWS)return cached.services;}catch(e){}
 return null;
}
async function refresh(force){
 if(pending)return pending;
 pending=(async()=>{
  notice('Updating the master list from Google Sheets…');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),13000);
  try{
   if(typeof WEB_APP_URL!=='string')throw new Error('Spreadsheet connection not ready');
   const url=WEB_APP_URL+(WEB_APP_URL.includes('?')?'&':'?')+'sheet='+encodeURIComponent(SHEET)+'&_='+Date.now();
   const response=await fetch(url,{cache:'no-store',signal:controller.signal});
   if(!response.ok)throw new Error('Spreadsheet returned '+response.status);
   const json=await response.json();
   const list=readMasterRows(json?.data);
   if(!list)throw new Error('Master tab missing, empty or contains unexpected headings');
   publish(list,false);
   try{localStorage.setItem(CACHE_KEY,JSON.stringify({saved:Date.now(),services:list}));}catch(e){}
   lastRead=Date.now();
   return true;
  }catch(error){
   console.warn('Service master not available: using most recent good copy',error);
   if(!loaded){const cached=readCache();if(cached)publish(cached,true);}
   notice('Google Sheets service list unavailable. '+(loaded?'Keeping the last successful list.':'Using the built-in service list.')+' Tap Refresh to retry.');
   lastRead=Date.now();
   return false;
  }finally{clearTimeout(timer);}
 })().finally(()=>{pending=null;});
 return pending;
}
window.inspectorRefreshServiceMaster=refresh;
function start(){
 notice('Loading editable Stagecoach service list…');
 // First load makes the master authoritative, without blocking the rest of the Inspector Hub.
 refresh(false);
 document.addEventListener('click',event=>{
  const item=event.target?.closest?.('[data-open]');
  if(item&&['coverage','checksheet','serviceDirectoryManager'].includes(item.dataset.open)&&Date.now()-lastRead>60000)refresh(false);
 });
 document.addEventListener('inspector-service-master-updated',()=>notice('Google Sheets master loaded. Changes are shared across inspectors.'));
 setInterval(()=>{if(document.visibilityState!=='hidden'&&Date.now()-lastRead>180000)refresh(false);},190000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
