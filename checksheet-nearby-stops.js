(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const endpoints=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
const officialNameCache=new Map();
let currentStops=[],autoTried=false,activeLookup=null;
function distance(a,b,c,d){const R=6371000,p=Math.PI/180,x=(d-b)*p*Math.cos((a+c)*p/2),y=(c-a)*p;return Math.round(Math.sqrt(x*x+y*y)*R);}
function clean(v){return String(v||'').trim();}
function tag(t,name){const wanted=String(name).toLowerCase();const hit=Object.keys(t||{}).find(k=>k.toLowerCase()===wanted);return hit?clean(t[hit]):'';}
function indicatorWords(v){const x=clean(v),l=x.toLowerCase();if(l==='adj')return'adjacent to';if(l==='opp')return'opposite';if(l==='nr')return'near';return x;}
async function lookupLocality(lat,lon){try{const r=await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon)+'&zoom=14&addressdetails=1&accept-language=en',{headers:{Accept:'application/json'}});if(!r.ok)return'';const j=await r.json(),a=j.address||{};return clean(a.village||a.town||a.city||a.hamlet||a.suburb||a.municipality||'');}catch(e){return'';}}
function fallbackStopName(t,fallbackLocality){
 const common=tag(t,'naptan:CommonName')||clean(t.name)||clean(t.local_ref)||clean(t.ref)||'Bus stop';
 const locality=tag(t,'naptan:LocalityName')||tag(t,'naptan:Locality')||clean(t.locality)||clean(t.town)||clean(t.village)||clean(t.suburb)||clean(t.place)||clean(fallbackLocality);
 const rawIndicator=tag(t,'naptan:Indicator')||clean(t.indicator),indicator=indicatorWords(rawIndicator);
 let title=common;
 if(indicator&&!common.toLowerCase().includes(indicator.toLowerCase()))title=/^(adjacent to|opposite|near)$/i.test(indicator)?indicator+' '+common:common+' ('+indicator+')';
 if(locality&&!title.toLowerCase().startsWith(locality.toLowerCase()))title=locality+', '+title;
 return title||'Bus stop';
}
function stopCode(t){
 const atco=tag(t,'naptan:AtcoCode')||tag(t,'atco_code')||tag(t,'atcocode');
 if(atco)return atco.toUpperCase();
 const values=Object.values(t||{}).map(clean).filter(Boolean),atcoLike=values.find(x=>/^\d{4}[A-Z][A-Z0-9]{4,7}$/i.test(x));
 if(atcoLike)return atcoLike.toUpperCase();
 return tag(t,'naptan:NaptanCode')||tag(t,'naptan_code')||clean(t.local_ref)||clean(t.ref)||'';
}
function stopBearing(t){return tag(t,'naptan:Indicator')||tag(t,'naptan:Bearing')||clean(t.direction)||clean(t.bearing)||'';}
function parseOfficialTitle(text){
 const lines=String(text||'').split(/\r?\n/).map(clean).filter(Boolean);
 const heading=lines.find(x=>/^#\s+/.test(x)&&!/bustimes\.org/i.test(x));
 if(heading)return heading.replace(/^#\s+/,'').replace(/\s+[-–—]\s+bustimes\.org.*$/i,'').trim();
 const title=lines.find(x=>/^Title:\s*/i.test(x));
 if(title)return title.replace(/^Title:\s*/i,'').replace(/\s+[-–—]\s+bustimes\.org.*$/i,'').trim();
 return'';
}
async function officialStopName(code){
 const key=clean(code).toUpperCase();if(!key)return'';if(officialNameCache.has(key))return officialNameCache.get(key);
 try{
  const url='https://r.jina.ai/http://https://bustimes.org/stops/'+encodeURIComponent(key);
  const r=await fetch(url,{headers:{Accept:'text/plain'}});if(!r.ok)throw new Error('Official title unavailable');
  const name=parseOfficialTitle(await r.text());officialNameCache.set(key,name);return name;
 }catch(e){officialNameCache.set(key,'');return'';}
}
async function enrichNames(stops){
 const batch=stops.slice(0,15);
 await Promise.all(batch.map(async s=>{const official=await officialStopName(s.code);if(official)s.name=official;}));
 return stops;
}
async function fetchStops(lat,lon){
 const locality=await lookupLocality(lat,lon),query='[out:json][timeout:20];(node(around:900,'+lat+','+lon+')[highway=bus_stop];node(around:900,'+lat+','+lon+')[public_transport=platform][bus=yes];);out body;';let lastError=null;
 for(const url of endpoints){try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:'data='+encodeURIComponent(query)});if(!r.ok)throw new Error('Stop service unavailable');const j=await r.json(),seen=new Set();const stops=(j.elements||[]).map(e=>{const t=e.tags||{},name=fallbackStopName(t,locality),code=stopCode(t),bearing=stopBearing(t),dist=distance(lat,lon,e.lat,e.lon),key=(code||name+'|'+e.lat+'|'+e.lon).toLowerCase();return{name,code,bearing,dist,lat:e.lat,lon:e.lon,key};}).filter(x=>{if(seen.has(x.key))return false;seen.add(x.key);return true;}).sort((a,b)=>a.dist-b.dist).slice(0,15);return await enrichNames(stops);}catch(e){lastError=e;}}
 throw lastError||new Error('Could not load nearby stops');
}
function publishStops(lat,lon){window.inspectorNearbyStops={stops:currentStops.slice(),lat,lon,updated:Date.now(),formatVersion:5};document.dispatchEvent(new CustomEvent('inspector-nearby-stops',{detail:window.inspectorNearbyStops}));}
function sharedLookup(force){const cached=window.inspectorNearbyStops;if(!force&&cached?.formatVersion===5&&cached?.stops?.length&&Date.now()-cached.updated<300000){currentStops=cached.stops.slice();return Promise.resolve(currentStops);}if(activeLookup)return activeLookup;activeLookup=new Promise((resolve,reject)=>{if(!navigator.geolocation){reject(new Error('Location unavailable'));return;}navigator.geolocation.getCurrentPosition(async p=>{try{currentStops=await fetchStops(p.coords.latitude,p.coords.longitude);publishStops(p.coords.latitude,p.coords.longitude);resolve(currentStops);}catch(e){reject(e);}finally{activeLookup=null;}},e=>{activeLookup=null;reject(e);},{enableHighAccuracy:true,timeout:12000,maximumAge:30000});});return activeLookup;}
window.inspectorFindNearbyStops=sharedLookup;
function setBoarding(s){const input=$('csBoarding');if(!s||!input)return;input.value=s.name+(s.code?' ('+s.code+')':'');input.dataset.stopCode=s.code||'';input.dataset.stopLat=String(s.lat||'');input.dataset.stopLon=String(s.lon||'');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}
function close(){const m=$('nearbyStopsModal');if(m)m.classList.remove('show');}
function selectStop(i){const s=currentStops[Number(i)];if(!s)return;setBoarding(s);close();}
function renderStops(){const box=$('nearbyStopsList');if(!box)return;box.innerHTML=currentStops.length?currentStops.map((s,i)=>'<button type="button" class="nearbyStopRow" data-stop-index="'+i+'"><div><b>'+esc(s.name)+'</b><span>'+(s.code?'ATCO stop code: '+esc(s.code):'No ATCO stop code listed')+(s.bearing?' • '+esc(s.bearing):'')+'</span></div><strong>'+s.dist+' m</strong></button>').join(''):'<div class="nearbyStopsEmpty">No nearby bus stops were found. Use Location will be available instead, or you can type the boarding point manually.</div>';}
function status(text){const el=$('nearbyStopsStatus');if(el)el.textContent=text;const inline=$('nearbyInlineStatus');if(inline)inline.textContent=text;}
function fallback(){const btn=$('useCurrentLocationBtn');if(btn)btn.style.display='';status('No suitable bus stop was found. Use Location or enter the boarding point manually.');}
async function locate(showModal){currentStops=[];renderStops();status('Finding location and matching official BusTimes stop names…');if(showModal)$('nearbyStopsModal')?.classList.add('show');try{currentStops=await sharedLookup(true);renderStops();if(currentStops.length){if(!$('csBoarding')?.value)setBoarding(currentStops[0]);status(showModal?'Nearest stop selected. Tap another stop if required.':'Nearest bus stop added automatically.');const use=$('useCurrentLocationBtn');if(use)use.style.display='none';}else fallback();}catch(e){fallback();}}
function placeJourneyFields(){const journey=[...document.querySelectorAll('#checksheet .formSection')].find(x=>x.querySelector('.formSectionTitle.journey'));const grid=journey?.querySelector('.sectionGrid');if(!grid)return false;const boardingWrap=$('findNearbyStopBtn')?.closest('.boardingStopWrap');const destination=$('csDestinationChoice')?.closest('.destinationChoiceWrap')||$('csDestination');if(boardingWrap&&boardingWrap.parentElement!==grid)grid.appendChild(boardingWrap);if(destination){destination.classList.add('full');grid.appendChild(destination);}return true;}
function findNearby(){locate(true);}
function build(){const input=$('csBoarding');if(!input)return false;let wrap=$('findNearbyStopBtn')?.closest('.boardingStopWrap');if(!wrap){wrap=document.createElement('div');wrap.className='boardingStopWrap full';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);const btn=document.createElement('button');btn.type='button';btn.id='findNearbyStopBtn';btn.className='btn nearbyStopBtn';btn.textContent='FIND NEARBY BUS STOP';wrap.appendChild(btn);const hint=document.createElement('div');hint.className='small nearbyStopHint';hint.id='nearbyInlineStatus';hint.textContent='The nearest bus stop will be added automatically. Use this button to choose a different stop.';wrap.appendChild(hint);btn.onclick=findNearby;}
if(!$('nearbyStopsModal')){const modal=document.createElement('div');modal.id='nearbyStopsModal';modal.className='nearbyStopsModal';modal.innerHTML='<div class="nearbyStopsCard"><div class="nearbyStopsHead"><div><h3>Nearby Bus Stops</h3><div class="small" id="nearbyStopsStatus">Finding nearby stops…</div></div><button type="button" class="btn" id="nearbyStopsClose">CLOSE</button></div><div id="nearbyStopsList"></div><button type="button" class="btn nearbyManualBtn" id="nearbyStopsManual">ENTER BOARDING POINT MANUALLY</button></div>';document.body.appendChild(modal);$('nearbyStopsClose').onclick=close;$('nearbyStopsManual').onclick=()=>{close();input.focus();};modal.addEventListener('click',e=>{const row=e.target.closest('[data-stop-index]');if(row)selectStop(row.dataset.stopIndex);if(e.target===modal)close();});}
placeJourneyFields();const use=$('useCurrentLocationBtn');if(use&&!input.value)use.style.display='none';return true;}
function style(){if($('nearbyStopsCss'))return;const s=document.createElement('style');s.id='nearbyStopsCss';s.textContent='.boardingStopWrap{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center}.boardingStopWrap #csBoarding{width:100%}.nearbyStopHint{grid-column:1/-1}.nearbyStopBtn{white-space:nowrap}.destinationChoiceWrap.full{grid-column:1/-1}.nearbyStopsModal{display:none;position:fixed;inset:0;z-index:10050;padding:18px;background:rgba(0,0,0,.76);overflow:auto}.nearbyStopsModal.show{display:flex;align-items:center;justify-content:center}.nearbyStopsCard{width:min(680px,100%);max-height:88vh;overflow:auto;padding:17px;border-radius:15px;background:#0b1b2b;border:3px solid #eea83e}.nearbyStopsHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;position:sticky;top:-17px;padding:17px 0 12px;background:#0b1b2b;z-index:2}.nearbyStopsHead h3{margin:0 0 5px}.nearbyStopRow{width:100%;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;text-align:left;padding:13px;margin:8px 0;border:1px solid #36586f;border-radius:11px;background:#102b40;color:#fff}.nearbyStopRow b{display:block;font-size:16px}.nearbyStopRow span{display:block;margin-top:4px;color:#b8c5ce;font-size:12px}.nearbyStopRow strong{color:#eea83e;white-space:nowrap}.nearbyStopsEmpty{padding:24px;text-align:center;color:#b8c5ce}.nearbyManualBtn{width:100%;margin-top:10px}@media(max-width:620px){.boardingStopWrap{grid-template-columns:1fr}.nearbyStopBtn{width:100%}.nearbyStopRow{grid-template-columns:1fr}.nearbyStopsHead{flex-direction:column}.nearbyStopsHead .btn{width:100%}}';document.head.appendChild(s);}
function init(){style();let n=0;const t=setInterval(()=>{n++;if(build()||n>60){clearInterval(t);setTimeout(()=>{placeJourneyFields();if(!autoTried&&!$('csBoarding')?.value){autoTried=true;locate(false);}},700);}},200);document.addEventListener('click',e=>{if(e.target.closest('[data-open="checksheet"]'))setTimeout(()=>{build();placeJourneyFields();if(!$('csBoarding')?.value){autoTried=true;locate(false);}},500);if(e.target.id==='clearCheckFormBtn')setTimeout(()=>{autoTried=false;const use=$('useCurrentLocationBtn');if(use)use.style.display='none';locate(false);},150);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();