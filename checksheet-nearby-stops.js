(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const endpoints=['https://overpass.private.coffee/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://overpass-api.de/api/interpreter','https://lz4.overpass-api.de/api/interpreter','https://overpass.osm.ch/api/interpreter'];
const CACHE_KEY='inspectorNearbyStopsCacheV9';
const officialNameCache=new Map();
let currentStops=[],autoTried=false,activeLookup=null;
function distance(a,b,c,d){const R=6371000,p=Math.PI/180,x=(d-b)*p*Math.cos((a+c)*p/2),y=(c-a)*p;return Math.round(Math.sqrt(x*x+y*y)*R);}
function clean(v){return String(v||'').trim();}
function tag(t,name){const wanted=String(name).toLowerCase();const hit=Object.keys(t||{}).find(k=>k.toLowerCase()===wanted);return hit?clean(t[hit]):'';}
function indicatorWords(v){const x=clean(v),l=x.toLowerCase();if(l==='adj')return'adjacent to';if(l==='opp')return'opposite';if(l==='nr')return'near';return x;}
function fallbackStopName(t){const common=tag(t,'naptan:CommonName')||clean(t.name)||clean(t.local_ref)||clean(t.ref)||'Bus stop';const locality=tag(t,'naptan:LocalityName')||tag(t,'naptan:Locality')||clean(t.locality)||clean(t.town)||clean(t.village)||clean(t.suburb)||clean(t.place);const rawIndicator=tag(t,'naptan:Indicator')||clean(t.indicator),indicator=indicatorWords(rawIndicator);let title=common;if(indicator&&!common.toLowerCase().includes(indicator.toLowerCase()))title=/^(adjacent to|opposite|near)$/i.test(indicator)?indicator+' '+common:common+' ('+indicator+')';if(locality&&!title.toLowerCase().startsWith(locality.toLowerCase()))title=locality+', '+title;return title||'Bus stop';}
function stopCode(t){const atco=tag(t,'naptan:AtcoCode')||tag(t,'atco_code')||tag(t,'atcocode');if(atco)return atco.toUpperCase();const values=Object.values(t||{}).map(clean).filter(Boolean),atcoLike=values.find(x=>/^\d{4}[A-Z][A-Z0-9]{4,7}$/i.test(x));if(atcoLike)return atcoLike.toUpperCase();return tag(t,'naptan:NaptanCode')||tag(t,'naptan_code')||clean(t.local_ref)||clean(t.ref)||'';}
function stopBearing(t){return tag(t,'naptan:Indicator')||tag(t,'naptan:Bearing')||clean(t.direction)||clean(t.bearing)||'';}
function stripSiteSuffix(value){return clean(value).replace(/\s+[-–—]\s+(?:bus\s*times|bustimes(?:\.org)?).*$/i,'').trim();}
function parseOfficialTitle(text){const lines=String(text||'').split(/\r?\n/).map(clean).filter(Boolean);const heading=lines.find(x=>/^#\s+/.test(x)&&!/bustimes\.org/i.test(x));if(heading)return stripSiteSuffix(heading.replace(/^#\s+/,''));const title=lines.find(x=>/^Title:\s*/i.test(x));if(title)return stripSiteSuffix(title.replace(/^Title:\s*/i,''));return'';}
async function officialStopName(code){const key=clean(code).toUpperCase();if(!key)return'';if(officialNameCache.has(key))return officialNameCache.get(key);const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),2500);try{const url='https://r.jina.ai/http://https://bustimes.org/stops/'+encodeURIComponent(key);const r=await fetch(url,{headers:{Accept:'text/plain'},signal:controller.signal});if(!r.ok)throw new Error('Official title unavailable');const name=parseOfficialTitle(await r.text());officialNameCache.set(key,name);return name;}catch(e){officialNameCache.set(key,'');return'';}finally{clearTimeout(timer);}}
async function enrichNamesInBackground(stops,lat,lon){const batch=stops.slice(0,5);await Promise.all(batch.map(async s=>{const official=await officialStopName(s.code);if(official)s.name=official;}));if(stops===currentStops||stops.every((s,i)=>currentStops[i]?.key===s.key))publishStops(lat,lon);}
async function fetchStops(lat,lon){
 let hadValidResponse=false,lastError=null;
 for(const radius of [1800,3500,5500]){
  const query='[out:json][timeout:10];(node(around:'+radius+','+lat+','+lon+')[highway=bus_stop];node(around:'+radius+','+lat+','+lon+')[public_transport=platform][bus=yes];way(around:'+radius+','+lat+','+lon+')[public_transport=platform][bus=yes];);out center;';
  const controllers=[];
  const requests=endpoints.map(async url=>{
   const controller=new AbortController();controllers.push(controller);
   let timer;
   try{
    const response=await Promise.race([
     fetch(url+'?data='+encodeURIComponent(query),{method:'GET',headers:{Accept:'application/json'},signal:controller.signal,cache:'no-store'}),
     new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Stop service timed out'));},8500);})
    ]);
    if(!response.ok)throw new Error('Bus stop service returned '+response.status);
    const data=await response.json();
    if(!Array.isArray(data.elements))throw new Error('Invalid stop response');
    hadValidResponse=true;
    const seen=new Set();
    const found=data.elements.map(e=>{
     const la=Number(e.lat??e.center?.lat),lo=Number(e.lon??e.center?.lon);
     if(!Number.isFinite(la)||!Number.isFinite(lo))return null;
     const t=e.tags||{},name=fallbackStopName(t),code=stopCode(t),bearing=stopBearing(t);
     return{name,code,bearing,dist:distance(lat,lon,la,lo),lat:la,lon:lo,key:(code||e.type+':'+e.id).toLowerCase()};
    }).filter(s=>{if(!s||seen.has(s.key))return false;seen.add(s.key);return true;})
      .sort((a,b)=>a.dist-b.dist).slice(0,20);
    if(!found.length)throw new Error('No mapped stops within '+radius+' metres');
    return found;
   }catch(e){lastError=e;throw e;}
   finally{clearTimeout(timer);}
  });
  try{return await Promise.any(requests);}
  catch(e){lastError=lastError||e;}
  finally{controllers.forEach(c=>c.abort());}
 }
 // A previous nearby result is safer than a permanent spinner while public map services are down.
 const cached=window.inspectorNearbyStops;
 if(cached?.stops?.length&&Date.now()-Number(cached.updated)<86400000&&
    Number.isFinite(Number(cached.lat))&&Number.isFinite(Number(cached.lon))&&
    distance(lat,lon,Number(cached.lat),Number(cached.lon))<700){
   return cached.stops.map(stop=>({...stop,dist:distance(lat,lon,Number(stop.lat),Number(stop.lon))}))
     .sort((a,b)=>a.dist-b.dist).slice(0,20);
 }
 if(hadValidResponse)return [];
 throw lastError||new Error('Unable to load bus stops');
}
function publishStops(lat,lon){window.inspectorNearbyStops={stops:currentStops.slice(),lat,lon,updated:Date.now(),formatVersion:9};try{localStorage.setItem(CACHE_KEY,JSON.stringify(window.inspectorNearbyStops));}catch(e){}document.dispatchEvent(new CustomEvent('inspector-nearby-stops',{detail:window.inspectorNearbyStops}));}
function hydrateCache(){try{const cached=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');if(cached?.formatVersion===9&&cached?.stops?.length&&Date.now()-cached.updated<600000){currentStops=cached.stops.slice();window.inspectorNearbyStops=cached;}}catch(e){}}
hydrateCache();
function sharedLookup(force){
 if(activeLookup)return activeLookup;
 activeLookup=new Promise((resolve,reject)=>{
  if(!navigator.geolocation){activeLookup=null;reject(new Error('Location unavailable'));return;}
  navigator.geolocation.getCurrentPosition(async p=>{
   try{
    const lat=p.coords.latitude,lon=p.coords.longitude,cached=window.inspectorNearbyStops;
    window.inspectorLastNearbyPosition={lat,lon,updated:Date.now()};
    const nearbyCache=!force&&cached?.formatVersion===9&&cached?.stops?.length&&Date.now()-cached.updated<600000&&Number.isFinite(Number(cached.lat))&&Number.isFinite(Number(cached.lon))&&distance(lat,lon,Number(cached.lat),Number(cached.lon))<300;
    if(nearbyCache){currentStops=cached.stops.slice();resolve(currentStops);return;}
    currentStops=await fetchStops(lat,lon);
    publishStops(lat,lon);
    resolve(currentStops);
    if(currentStops.length)enrichNamesInBackground(currentStops,lat,lon);
   }catch(e){reject(e);}
   finally{activeLookup=null;}
  },e=>{activeLookup=null;reject(e);},{enableHighAccuracy:true,timeout:12000,maximumAge:force?0:60000});
 });
 return activeLookup;
}
window.inspectorFindNearbyStops=sharedLookup;
function setBoarding(s){const input=$('csBoarding');if(!s||!input)return;input.value=s.name+(s.code?' ('+s.code+')':'');input.dataset.stopCode=s.code||'';input.dataset.stopLat=String(s.lat||'');input.dataset.stopLon=String(s.lon||'');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}
function close(){const m=$('nearbyStopsModal');if(m)m.classList.remove('show');}
function selectStop(i){const s=currentStops[Number(i)];if(!s)return;setBoarding(s);close();}
function renderStops(){const box=$('nearbyStopsList');if(!box)return;box.innerHTML=currentStops.length?currentStops.map((s,i)=>'<button type="button" class="nearbyStopRow" data-stop-index="'+i+'"><div><b>'+esc(s.name)+'</b><span>'+(s.code?'ATCO stop code: '+esc(s.code):'No ATCO stop code listed')+(s.bearing?' • '+esc(s.bearing):'')+'</span></div><strong>'+s.dist+' m</strong></button>').join(''):'<div class="nearbyStopsEmpty">No nearby bus stops were found. Use Location will be available instead, or you can type the boarding point manually.</div>';}
function status(text){const el=$('nearbyStopsStatus');if(el)el.textContent=text;const inline=$('nearbyInlineStatus');if(inline)inline.textContent=text;}
function fallback(message){ensureLocationControl();renderStops();status(message||'No mapped bus stops were found nearby. Try again or enter the boarding point manually.');}
async function locate(showModal,force=false){currentStops=[];const list=$('nearbyStopsList');if(list)list.innerHTML='<div class="nearbyStopsEmpty">Looking for nearby stops…</div>';ensureLocationControl();status('Finding nearest bus stops…');if(showModal)$('nearbyStopsModal')?.classList.add('show');try{currentStops=await sharedLookup(force);renderStops();if(currentStops.length){if(!$('csBoarding')?.value)setBoarding(currentStops[0]);status(showModal?'Nearest stop selected. Tap another stop if required.':'Nearest bus stop added automatically.');ensureLocationControl();}else fallback(); }catch(e){
 const denied=e?.code===1;
 const gpsFound=!!window.inspectorLastNearbyPosition&&Date.now()-window.inspectorLastNearbyPosition.updated<60000;
 fallback(denied?'Location permission denied. Enable Location Services for your browser, or enter the boarding point manually.':
   gpsFound?'GPS position found, but the live bus stop service is unavailable. Try again or use your current location instead.':
   'Unable to find your location or load stops. Check location permissions and connection, or enter the boarding point manually.');
}}
function placeJourneyFields(){consolidateBoarding();const journey=[...document.querySelectorAll('#checksheet .formSection')].find(x=>x.querySelector('.formSectionTitle.journey'));const grid=journey?.querySelector('.sectionGrid');if(!grid)return false;const boardingWrap=$('findNearbyStopBtn')?.closest('.boardingStopWrap');const destination=$('csDestinationChoice')?.closest('.destinationChoiceWrap')||$('csDestination');if(boardingWrap&&boardingWrap.parentElement!==grid)grid.appendChild(boardingWrap);if(destination){destination.classList.add('full');grid.appendChild(destination);}return true;}
function consolidateBoarding(){
 const input=$('csBoarding'),wrap=$('findNearbyStopBtn')?.closest('.boardingStopWrap');
 if(!input||!wrap)return;
 const existing=input.closest('.locationWrap');
 if(existing&&!wrap.contains(existing))wrap.insertBefore(existing,$('findNearbyStopBtn'));
 else if(!wrap.contains(input))wrap.insertBefore(input,$('findNearbyStopBtn'));
}
function ensureLocationControl(){
 consolidateBoarding();
 const wrap=$('findNearbyStopBtn')?.closest('.boardingStopWrap');if(!wrap)return;
 const native=$('useCurrentLocationBtn');
 let alt=$('nearbyUseCurrentLocationBtn');
 if(native){
  if(alt)alt.remove();
  native.hidden=false;native.style.display='block';
  if(!/locating/i.test(native.textContent))native.textContent='USE CURRENT LOCATION';
  native.classList.add('nearbyGeoAction');
  if(!wrap.contains(native))wrap.insertBefore(native,$('nearbyInlineStatus'));
  return;
 }
 if(!alt){
  alt=document.createElement('button');
  alt.id='nearbyUseCurrentLocationBtn';alt.type='button';alt.className='btn nearbyGeoAction';
  alt.textContent='USE CURRENT LOCATION';
  wrap.insertBefore(alt,$('nearbyInlineStatus'));
  alt.onclick=()=>{
   const input=$('csBoarding');if(!navigator.geolocation){status('GPS location is unavailable. Enter the boarding point manually.');return;}
   alt.disabled=true;alt.textContent='LOCATING…';
   navigator.geolocation.getCurrentPosition(pos=>{
    const lat=pos.coords.latitude,lon=pos.coords.longitude;
    if(input){input.value=lat.toFixed(5)+', '+lon.toFixed(5);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}
    status('Location added. You can edit the boarding point.');alt.disabled=false;alt.textContent='USE CURRENT LOCATION';
   },()=>{status('Unable to get GPS location. Enter the boarding point manually.');alt.disabled=false;alt.textContent='USE CURRENT LOCATION';},{enableHighAccuracy:true,timeout:10000,maximumAge:30000});
  };
 }
}
function findNearby(){locate(true,true);}
function build(){const input=$('csBoarding');if(!input)return false;let wrap=$('findNearbyStopBtn')?.closest('.boardingStopWrap');if(!wrap){wrap=document.createElement('div');wrap.className='boardingStopWrap full';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);const btn=document.createElement('button');btn.type='button';btn.id='findNearbyStopBtn';btn.className='btn nearbyStopBtn';btn.textContent='FIND NEARBY BUS STOP';wrap.appendChild(btn);const hint=document.createElement('div');hint.className='small nearbyStopHint';hint.id='nearbyInlineStatus';hint.textContent='The nearest bus stop will be added automatically. Use this button to choose a different stop.';wrap.appendChild(hint);btn.onclick=findNearby;}
if(!$('nearbyStopsModal')){const modal=document.createElement('div');modal.id='nearbyStopsModal';modal.className='nearbyStopsModal';modal.innerHTML='<div class="nearbyStopsCard"><div class="nearbyStopsHead"><div><h3>Nearby Bus Stops</h3><div class="small" id="nearbyStopsStatus">Finding nearby stops…</div></div><button type="button" class="btn" id="nearbyStopsClose">CLOSE</button></div><div id="nearbyStopsList"></div><div class="nearbyModalActions"><button type="button" class="btn" id="nearbyStopsRetry">TRY BUS STOPS AGAIN</button><button type="button" class="btn" id="nearbyModalUseLocation">📍 USE CURRENT LOCATION</button></div><button type="button" class="btn nearbyManualBtn" id="nearbyStopsManual">ENTER BOARDING POINT MANUALLY</button></div>';document.body.appendChild(modal);$('nearbyStopsClose').onclick=close;$('nearbyStopsRetry').onclick=()=>locate(true,true);$('nearbyModalUseLocation').onclick=()=>{close();ensureLocationControl();const btn=$('useCurrentLocationBtn')||$('nearbyUseCurrentLocationBtn');if(btn)btn.click();else status('Location button unavailable. Type the boarding point manually.');};$('nearbyStopsManual').onclick=()=>{close();input.focus();};modal.addEventListener('click',e=>{const row=e.target.closest('[data-stop-index]');if(row)selectStop(row.dataset.stopIndex);if(e.target===modal)close();});}
placeJourneyFields();ensureLocationControl();return true;}
function style(){if($('nearbyStopsCss'))return;const s=document.createElement('style');s.id='nearbyStopsCss';s.textContent='.boardingStopWrap{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center}.boardingStopWrap .locationWrap{grid-column:1/-1;width:100%;min-width:0}.boardingStopWrap #findNearbyStopBtn{grid-column:1/-1}.boardingStopWrap #nearbyInlineStatus{grid-column:1/-1}.boardingStopWrap #csBoarding{width:100%}.nearbyStopHint{grid-column:1/-1}.nearbyStopBtn{white-space:nowrap}.boardingStopWrap .nearbyGeoAction{display:block!important;min-height:52px!important;border:1px solid #5b84a0!important;border-radius:10px;background:#173d5c!important;color:#fff!important;font-weight:900!important;padding:12px!important;white-space:nowrap}.destinationChoiceWrap.full{grid-column:1/-1}.nearbyStopsModal{display:none;position:fixed;inset:0;z-index:10050;padding:18px;background:rgba(0,0,0,.76);overflow:auto}.nearbyStopsModal.show{display:flex;align-items:center;justify-content:center}.nearbyStopsCard{width:min(680px,100%);max-height:88vh;overflow:auto;padding:17px;border-radius:15px;background:#0b1b2b;border:3px solid #eea83e}.nearbyStopsHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;position:sticky;top:-17px;padding:17px 0 12px;background:#0b1b2b;z-index:2}.nearbyStopsHead h3{margin:0 0 5px}.nearbyStopRow{width:100%;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;text-align:left;padding:13px;margin:8px 0;border:1px solid #36586f;border-radius:11px;background:#102b40;color:#fff}.nearbyStopRow b{display:block;font-size:16px}.nearbyStopRow span{display:block;margin-top:4px;color:#b8c5ce;font-size:12px}.nearbyStopRow strong{color:#eea83e;white-space:nowrap}.nearbyStopsEmpty{padding:24px;text-align:center;color:#b8c5ce}.nearbyManualBtn{width:100%;margin-top:10px}.nearbyModalActions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.nearbyModalActions .btn{min-height:46px;white-space:normal;font-size:12px}@media(max-width:620px){.boardingStopWrap{grid-template-columns:1fr}.boardingStopWrap .locationWrap{grid-template-columns:1fr!important}.boardingStopWrap .locationWrap .geoBtn{width:100%}.nearbyModalActions{grid-template-columns:1fr}.nearbyStopBtn{width:100%}.nearbyStopRow{grid-template-columns:1fr}.nearbyStopsHead{flex-direction:column}.nearbyStopsHead .btn{width:100%}}';document.head.appendChild(s);}
function init(){style();setTimeout(ensureLocationControl,1700);let repairCount=0;const repair=setInterval(()=>{placeJourneyFields();ensureLocationControl();if(++repairCount>=48)clearInterval(repair);},250);let n=0;const t=setInterval(()=>{n++;if(build()||n>60){clearInterval(t);setTimeout(()=>{placeJourneyFields();if(!autoTried&&!$('csBoarding')?.value){autoTried=true;locate(false,false);}},300);}},200);document.addEventListener('click',e=>{if(e.target.closest('[data-open="checksheet"]'))setTimeout(()=>{build();placeJourneyFields();ensureLocationControl();if(!$('csBoarding')?.value){autoTried=true;locate(false,false);}},250);if(e.target.id==='clearCheckFormBtn')setTimeout(()=>{autoTried=false;ensureLocationControl();locate(false,false);},100);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();