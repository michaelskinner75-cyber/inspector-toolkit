/* Inspector Hub: searchable NaPTAN stop catalogue for East/West check sheet boarding point. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let catalogue={east:null,west:null},loading={east:null,west:null},results=[];
function load(){
 const kind=region();
 if(catalogue[kind])return Promise.resolve(catalogue[kind]);
 if(loading[kind])return loading[kind];
 const request=kind==='west'&&typeof window.inspectorWestBusStops==='function'
  ?window.inspectorWestBusStops()
  :fetch('scotland-bus-stops.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('Stop data not published');return r.json();}).then(d=>{if(!Array.isArray(d.stops)||d.stops.length<1000)throw new Error('Stop data incomplete');return d.stops;});
 loading[kind]=request.then(stops=>{catalogue[kind]=stops;loading[kind]=null;return stops;},err=>{loading[kind]=null;throw err;});
 return loading[kind];
}
function nameOf(s){
 const locality=String(s[4]||'').trim(),name=String(s[3]||'').trim(),indicator=String(s[5]||'').trim();
 const title=(locality&&!name.toLowerCase().startsWith(locality.toLowerCase())?locality+', ':'')+(name||'Bus stop');
 return title+(indicator&&!title.toLowerCase().includes(indicator.toLowerCase())?' ('+indicator+')':'');
}
function isWest(s){
 const lat=Number(s[0]),lon=Number(s[1]);
 // Wide approximate West Scotland footprint; no claim that a particular service calls here.
 return Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=54.5&&lat<=56.35&&lon>=-6.6&&lon<=-3.75;
}
function region(){return $('csServiceRegion')?.value||'east';}
function setStatus(msg){const el=$('csBoardingSearchStatus');if(el)el.textContent=msg;}
function close(){const box=$('csBoardingResults');if(box){box.innerHTML='';box.hidden=true;}results=[];}
function draw(query){
 const box=$('csBoardingResults');if(!box)return;
 const q=query.trim().toLowerCase();
 if(q.length<2){close();setStatus('Type at least 2 characters, or use Find Nearby Bus Stop.');return;}
 const records=catalogue[region()];
 if(!records){const selectedRegion=region();setStatus('Loading '+(selectedRegion==='west'?'West Scotland':'Scottish')+' bus stops…');load().then(()=>{if(region()===selectedRegion&&$('csBoarding')?.value.trim().toLowerCase()===q)draw(q);}).catch(()=>setStatus('Stop catalogue unavailable. You can still enter the boarding point manually or use Find Nearby.'));return;}
 const tokens=q.split(/\s+/).filter(Boolean),west=region()==='west';
 const matches=[];
 for(const stop of records){
  if(!Array.isArray(stop)||stop.length<5)continue;
  if(west&&!stop[2])continue;
  const searchable=[stop[2],stop[3],stop[4],stop[5]].map(v=>String(v||'')).join(' ').toLowerCase();
  if(tokens.every(t=>searchable.includes(t))){matches.push(stop);if(matches.length===40)break;}
 }
 results=matches.slice(0,15);
 box.innerHTML=results.map((s,i)=>'<button type="button" class="csStopSearchRow" data-stop-search-index="'+i+'"><strong>'+esc(nameOf(s))+'</strong><span>NaPTAN '+esc(s[2]||'no code')+'</span></button>').join('')+(matches.length>results.length?'<div class="csStopSearchNote">More matches available. Keep typing to narrow your search.</div>':'');
 box.hidden=!results.length;
 setStatus(results.length?(results.length+' matching stops. Select a stop, or continue typing manually.'):'No matching stops in the available catalogue. Enter the boarding point manually or use Find Nearby.');
}
function init(){
 const input=$('csBoarding');if(!input||$('csBoardingResults'))return false;
 const wrap=document.createElement('div');wrap.className='csStopSearchWrap';
 const resultsBox=document.createElement('div');resultsBox.id='csBoardingResults';resultsBox.className='csStopSearchResults';resultsBox.hidden=true;
 const status=document.createElement('div');status.id='csBoardingSearchStatus';status.className='small';status.textContent='Type a stop name or ATCO code to search Scottish stops.';
 input.after(wrap);wrap.append(resultsBox,status);
 input.autocomplete='off';input.placeholder='Type boarding stop, town or ATCO code';
 input.addEventListener('input',()=>draw(input.value));
 input.addEventListener('focus',()=>{if(input.value.trim().length>1)draw(input.value);else load().catch(()=>{});});
 resultsBox.addEventListener('click',e=>{
  const button=e.target.closest('[data-stop-search-index]');if(!button)return;
  const stop=results[Number(button.dataset.stopSearchIndex)];if(!stop)return;
  input.value=nameOf(stop)+(stop[2]?' ('+stop[2]+')':'');
  input.dataset.stopCode=String(stop[2]||'');
  input.dataset.stopLat=String(stop[0]||'');
  input.dataset.stopLon=String(stop[1]||'');
  close();setStatus('Boarding stop selected.');input.dispatchEvent(new Event('change',{bubbles:true}));
 });
 document.addEventListener('pointerdown',e=>{if(e.target!==input&&!wrap.contains(e.target))close();});
 $('csServiceRegion')?.addEventListener('change',()=>{close();load().catch(()=>{});setStatus('Search '+(region()==='west'?'West Scotland':'Scottish')+' boarding stops, or use Find Nearby.');});
 document.addEventListener('click',e=>{if(e.target.id==='clearCheckFormBtn'||e.target.id==='saveCheckSheetBtn')setTimeout(()=>{close();setStatus('Type a stop name or ATCO code to search Scottish stops.');},80);});
 return true;
}
function start(){
 if(!$('csStopSearchCss')){const css=document.createElement('style');css.id='csStopSearchCss';css.textContent='.csStopSearchWrap{grid-column:1/-1;min-width:0}.csStopSearchResults{max-height:240px;overflow:auto;border:1px solid #446a83;border-radius:10px;background:#0d263a}.csStopSearchResults[hidden]{display:none}.csStopSearchRow{width:100%;display:block;text-align:left;padding:11px 12px;border:0;border-bottom:1px solid #29475c;background:transparent;color:white}.csStopSearchRow:focus-visible,.csStopSearchRow:hover{background:#244d66}.csStopSearchRow strong{display:block;font-size:14px}.csStopSearchRow span{display:block;color:#b6cddd;font-size:12px;margin-top:3px}.csStopSearchNote{font-size:12px;padding:10px;color:#b6cddd}#csBoardingSearchStatus{margin-top:6px;color:#becedb;font-size:12px}';document.head.appendChild(css);}
 if(init())return;
 let tries=0;const timer=setInterval(()=>{if(init()||++tries>60)clearInterval(timer);},250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();