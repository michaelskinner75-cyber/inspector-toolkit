/* Depot-driven operating region and resilient nearby stop lookup. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const WEST=new Set(['ayr','ardrossan','kilmarnock','arran','charles street']);
function syncRegion(){
 const depot=$('csDepot'),region=$('csServiceRegion');
 if(!depot||!region)return;
 const selected=String(depot.value||'').trim().toLowerCase();
 const wanted=WEST.has(selected)?'west':'east';
 if(region.value!==wanted){region.value=wanted;region.dispatchEvent(new Event('change',{bubbles:true}));}
}
function setupRegion(){
 const depot=$('csDepot'),region=$('csServiceRegion');
 if(!depot||!region)return false;
 const regionLabel=document.querySelector('label[for="csServiceRegion"]');
 region.hidden=true;region.style.display='none';if(regionLabel){regionLabel.hidden=true;regionLabel.style.display='none';}
 if(depot.dataset.autoServiceRegion!=='1'){
  depot.dataset.autoServiceRegion='1';
  depot.addEventListener('change',syncRegion);
  depot.addEventListener('input',syncRegion);
 }
 syncRegion();return true;
}
let finding=false;
function showMessage(title,sub){
 const name=$('homeNearestStopName'),meta=$('homeNearestStopMeta');
 if(name)name.textContent=title;
 if(meta)meta.textContent=sub;
}
function timeLimit(p,ms){
 return new Promise((resolve,reject)=>{
  let finished=false;
  const timer=setTimeout(()=>{if(!finished){finished=true;reject(new Error('Location or bus stop lookup timed out'));}},ms);
  Promise.resolve(p).then(x=>{if(!finished){finished=true;clearTimeout(timer);resolve(x);}},e=>{if(!finished){finished=true;clearTimeout(timer);reject(e);}});
 });
}
async function findStops(){
 if(finding)return;
 finding=true;
 const button=$('homeNearbyRetryReliable'),list=$('homeNearbyStops'),picker=$('homePickNearby');
 if(button){button.disabled=true;button.textContent='FINDING NEARBY STOPS…';}
 showMessage('Finding nearby bus stops…','Checking your location and the Scottish stop database…');
 try{
  if(!navigator.geolocation)throw new Error('Location is not supported');
  let count=0;
  while(typeof window.inspectorFindNearbyStops!=='function'&&count++<15)await new Promise(resolve=>setTimeout(resolve,200));
  if(typeof window.inspectorFindNearbyStops!=='function')throw new Error('Nearby stop finder failed to load');
  const stops=await timeLimit(window.inspectorFindNearbyStops(true),17000);
  if(!stops?.length)throw new Error('No bus stops were returned for this position');
  if(list)list.hidden=false;
  if(picker){picker.style.display='';picker.textContent='HIDE NEARBY STOPS';}
  document.dispatchEvent(new CustomEvent('inspector-nearby-stops',{detail:window.inspectorNearbyStops||{stops,updated:Date.now()}}));
  showMessage(stops[0].name||'Nearby bus stops found',stops.length+' nearby stops found. Select a stop from the list.');
 }catch(error){
  const denied=error?.code===1;
  showMessage('Nearby stops unavailable',denied?'Location permission is denied. Allow location access in Safari settings and try again.':'Could not complete the GPS or stop-data lookup. Tap Try Again, or type the stop manually on the check sheet.');
 }finally{
  finding=false;
  if(button){button.disabled=false;button.textContent='TRY FIND NEARBY STOPS';}
 }
}
function setupNearby(){
 const card=$('homeNearestStopCard'),body=$('homeNearestBody');
 if(!card||!body)return false;
 let btn=$('homeNearbyRetryReliable');
 if(!btn){
  btn=document.createElement('button');btn.id='homeNearbyRetryReliable';btn.type='button';
  btn.textContent='TRY FIND NEARBY STOPS';
  btn.style.cssText='display:block;width:calc(100% - 20px);margin:8px 10px 12px;padding:14px;border-radius:10px;border:1px solid #5b84a0;background:#194766;color:#fff;font-weight:800;font-size:14px;cursor:pointer;';
  body.before(btn);btn.addEventListener('click',findStops);
 }
 const old=$('homeUseCurrentLocation');
 if(old)old.style.display='none';
 return true;
}
function init(){
 setupRegion();setupNearby();
 // The older automatic location path must not leave the home screen spinning indefinitely.
 setTimeout(()=>{
  const name=$('homeNearestStopName'),meta=$('homeNearestStopMeta');
  if(!finding&&name&&/finding nearby|checking your current location/i.test((name.textContent||'')+' '+(meta?.textContent||'')))
   showMessage('Find your nearest bus stop','Tap Try Find Nearby Stops to use your current location.');
 },19000);
 let attempts=0;
 const timer=setInterval(()=>{setupRegion();setupNearby();if(++attempts>=30)clearInterval(timer);},1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
