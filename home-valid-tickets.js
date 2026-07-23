(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localZones=[
 {name:'Dundee',lat:56.462,lon:-2.971,r:13,tickets:['Dundee','Angus','North East Fife','North Perthshire and the Carse','East Scotland']},
 {name:'Forfar',lat:56.644,lon:-2.889,r:12,tickets:['Forfar','Angus','East Scotland']},
 {name:'St Andrews',lat:56.340,lon:-2.796,r:8,tickets:['St Andrews','North East Fife','East Scotland']},
 {name:'Glenrothes',lat:56.197,lon:-3.173,r:9,tickets:['Glenrothes','Central Fife','North East Fife','East Scotland']},
 {name:'Leven',lat:56.190,lon:-2.998,r:8,tickets:['Leven','Central Fife','North East Fife','East Scotland']},
 {name:'Kirkcaldy',lat:56.111,lon:-3.167,r:9,tickets:['Kirkcaldy','Central Fife','East Scotland']},
 {name:'Dunfermline',lat:56.071,lon:-3.452,r:11,tickets:['Dunfermline','West Fife','East Scotland']},
 {name:'Perth',lat:56.396,lon:-3.437,r:10,tickets:['Perth','North Perthshire and the Carse','South Perthshire and Kinross','East Scotland']},
 {name:'Edinburgh',lat:55.953,lon:-3.189,r:12,tickets:['Edinburgh','East Scotland']}
];
const regionalZones=[
 {name:'Central Fife',lat:56.150,lon:-3.110,r:32,tickets:['Central Fife','East Scotland']},
 {name:'West Fife',lat:56.085,lon:-3.500,r:42,tickets:['West Fife','East Scotland']},
 {name:'North East Fife',lat:56.300,lon:-2.950,r:38,tickets:['North East Fife','East Scotland']},
 {name:'Angus',lat:56.610,lon:-2.780,r:48,tickets:['Angus','East Scotland']},
 {name:'North Perthshire and the Carse',lat:56.560,lon:-3.520,r:58,tickets:['North Perthshire and the Carse','East Scotland']},
 {name:'South Perthshire and Kinross',lat:56.260,lon:-3.500,r:55,tickets:['South Perthshire and Kinross','East Scotland']}
];
function km(a,b,c,d){const R=6371,p=Math.PI/180,x=(d-b)*p*Math.cos((a+c)*p/2),y=(c-a)*p;return Math.sqrt(x*x+y*y)*R;}
function ticketsFor(lat,lon){for(const z of localZones)if(km(lat,lon,z.lat,z.lon)<=z.r)return z.tickets;const matches=regionalZones.filter(z=>km(lat,lon,z.lat,z.lon)<=z.r).sort((a,b)=>km(lat,lon,a.lat,a.lon)-km(lat,lon,b.lat,b.lon));if(matches.length)return [...new Set(matches.flatMap(z=>z.tickets))];return['East Scotland'];}
function style(){if($('homeValidTicketsCss'))return;const s=document.createElement('style');s.id='homeValidTicketsCss';s.textContent='.homeValidTicketsBtn{width:auto!important;margin:6px 0 0!important;padding:5px 9px!important;min-height:0!important;font-size:10px!important;line-height:1.05;background:#f4a51c!important;color:#081827!important;font-weight:900}.hvtModal{display:none;position:fixed;inset:0;z-index:12000;padding:16px;background:rgba(0,0,0,.76)}.hvtModal.show{display:flex;align-items:center;justify-content:center}.hvtCard{width:min(330px,92vw);padding:12px;border-radius:13px;background:#0b1b2b;border:2px solid #f4a51c}.hvtHead{display:flex;align-items:center;justify-content:space-between;gap:8px}.hvtHead h3{margin:0;font-size:17px}.hvtClose{padding:5px 8px!important;font-size:11px!important}.hvtLinks{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.hvtLink{border:1px solid #4b718b;border-radius:999px;background:#12344e;color:#fff;padding:7px 10px;font-size:12px;font-weight:800;cursor:pointer}.hvtLink:first-child{border-color:#f4a51c}.hvtEmpty{font-size:12px;margin-top:10px;color:#b8c5ce}';document.head.appendChild(s);}
function close(){$('homeValidTicketsModal')?.classList.remove('show');}
function jump(title){close();const opener=document.querySelector('[data-open="guideTicketsFares"]')||$('guideTicketsFaresBtn');opener?.click();setTimeout(()=>{const wanted=(title+' zone').toLowerCase();const summaries=[...document.querySelectorAll('#guideTicketsFares summary')];const hit=summaries.find(x=>{const t=x.textContent.trim().toLowerCase();return t===title.toLowerCase()||t===wanted||t.startsWith(title.toLowerCase());});if(hit){const d=hit.closest('details');if(d)d.open=true;hit.scrollIntoView({behavior:'smooth',block:'center'});}},350);}
function renderTickets(list){const body=$('homeValidTicketsBody');if(!body)return;body.innerHTML='<div class="hvtLinks">'+list.map(t=>'<button type="button" class="hvtLink" data-ticket-link="'+esc(t)+'">'+esc(t)+'</button>').join('')+'</div>';body.querySelectorAll('[data-ticket-link]').forEach(b=>b.onclick=()=>jump(b.dataset.ticketLink));}
function show(){const body=$('homeValidTicketsBody');if(!body)return;$('homeValidTicketsModal').classList.add('show');body.innerHTML='<div class="hvtEmpty">Checking your current location…</div>';if(!navigator.geolocation){body.innerHTML='<div class="hvtEmpty">Location is unavailable on this device.</div>';return;}navigator.geolocation.getCurrentPosition(p=>renderTickets(ticketsFor(p.coords.latitude,p.coords.longitude)),()=>{const saved=window.inspectorNearbyStops;if(Number.isFinite(saved?.lat)&&Number.isFinite(saved?.lon))renderTickets(ticketsFor(saved.lat,saved.lon));else body.innerHTML='<div class="hvtEmpty">Allow location access to see valid tickets here.</div>';},{enableHighAccuracy:false,timeout:4500,maximumAge:600000});}
function build(){const card=$('homeNearestStopCard');if(!card)return false;if(!$('homeValidTicketsBtn')){const b=document.createElement('button');b.type='button';b.id='homeValidTicketsBtn';b.className='btn homeValidTicketsBtn';b.textContent='🎟️ TICKETS HERE';b.onclick=e=>{e.preventDefault();e.stopPropagation();show();};card.appendChild(b);}if(!$('homeValidTicketsModal')){const m=document.createElement('div');m.id='homeValidTicketsModal';m.className='hvtModal';m.innerHTML='<div class="hvtCard"><div class="hvtHead"><h3>Tickets Valid Here</h3><button type="button" class="btn hvtClose" id="homeValidTicketsClose">CLOSE</button></div><div id="homeValidTicketsBody"></div></div>';document.body.appendChild(m);$('homeValidTicketsClose').onclick=close;m.addEventListener('click',e=>{if(e.target===m)close();});}return true;}
function init(){style();let n=0,t=setInterval(()=>{n++;if(build()||n>100)clearInterval(t);},200);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1000));else setTimeout(init,1000);
})();