(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const Z={
 'Dundee':{detail:'Unlimited travel on Stagecoach services in the Dundee zone.'},
 'Angus':{detail:'Includes the Forfar, Arbroath and Dundee zones. Valid until 04:00 the day after expiry.'},
 'North East Fife':{detail:'Includes the Dundee and St Andrews zones and extends through north-east Fife.'},
 'North Perthshire and the Carse':{detail:'Includes the Dundee and Perth zones and services towards Calvine, Aberfeldy, Spittal of Glenshee, Alyth and Newtyle.'},
 'South Perthshire and Kinross':{detail:'Includes the Perth zone and services towards St Fillans, Stirling, Kelty and Abernethy.'},
 'West Fife':{detail:'Unlimited travel throughout Dunfermline and the wider west Fife zone.'},
 'Dunfermline':{detail:'Unlimited travel within the Dunfermline town-zone boundaries.'},
 'Central Fife':{detail:'Covers Glenrothes, Leven and Kirkcaldy and the wider central Fife boundary. Valid until 04:00 the day after expiry.'},
 'Edinburgh':{detail:'Edinburgh city centre and Barnton, plus Stagecoach West Scotland services between the city centre and Fairmilehead.'},
 'Forfar':{detail:'Forfar town zone and services as far as Kirriemuir, Friockheim, Finavon, Netherton, Letham, Gallowfauld and Glamis.'},
 'Glenrothes':{detail:'Unlimited travel within the Glenrothes town-zone boundaries.'},
 'Kirkcaldy':{detail:'Unlimited travel within the Kirkcaldy town-zone boundaries.'},
 'Leven':{detail:'Unlimited travel within the Leven town-zone boundaries.'},
 'St Andrews':{detail:'Unlimited travel within the St Andrews town-zone boundaries.'},
 'Perth':{detail:'Unlimited travel in Perth City and as far as Almondbank, Scone Airport and Walnut Grove.'},
 'East Scotland':{detail:'Unlimited travel across the Stagecoach East Scotland operating area, subject to ticket conditions.'}
};
const rules=[
 {keys:['dundee','tealing','newbigging','ardestie','monifieth','tayport','forgan','wormit','kingoodie','star inn','invergowrie','muirhead'],area:'Dundee',tickets:['Dundee','Angus','North East Fife','North Perthshire and the Carse','East Scotland']},
 {keys:['arbroath','edzell','laurencekirk','glenogilvy','piperdam','newtyle'],area:'Angus',tickets:['Angus','East Scotland']},
 {keys:['forfar','kirriemuir','friockheim','finavon','netherton','letham','gallowfauld','glamis'],area:'Forfar',tickets:['Forfar','Angus','East Scotland']},
 {keys:['st andrews','strathtyrum','kinkell','cairnsmill','craigtoun','dewars mill','east neuk','newburgh','strathmiglo','freuchie','upper largo','largo','colinsburgh','l argoward'],area:'St Andrews / North East Fife',tickets:['St Andrews','North East Fife','East Scotland']},
 {keys:['glenrothes','markinch','coaltown of balgonie','foxton','southfield','whitehill','newcastle','leslie','collydean','pitcairn','gateside cottages'],area:'Glenrothes',tickets:['Glenrothes','Central Fife','North East Fife','East Scotland']},
 {keys:['leven','bonnybank','coldstream park','lundin links','muiredge','cameron hospital','windygates','denhead'],area:'Leven',tickets:['Leven','Central Fife','North East Fife','East Scotland']},
 {keys:['kirkcaldy','mitchelston','boreland','dysart','seafield','inverteil','chapel','dunnikier'],area:'Kirkcaldy',tickets:['Kirkcaldy','Central Fife','East Scotland']},
 {keys:['dunfermline','kingseat','townhill','queen margaret hospital','halbeath','sandpiper drive','masterton','rosyth','admiralty','castlandhill','pattiesmuir','leckerstone','crossford','craigluscar','parkneuk','wellwood'],area:'Dunfermline',tickets:['Dunfermline','West Fife','East Scotland']},
 {keys:['cowdenbeath','lochgelly','ballingry','kelty','aberdour','north queensferry','culross','kincardine','blairhall','saline','dollar','tillicoultry','bridge of allan','stirling','falkirk','beverkae','kinnesswood','falkland','ladybank','pitlessie','craigrothie'],area:'Fife regional zone',tickets:['Central Fife','West Fife','East Scotland']},
 {keys:['perth','almondbank','scone airport','walnut grove'],area:'Perth',tickets:['Perth','North Perthshire and the Carse','South Perthshire and Kinross','East Scotland']},
 {keys:['calvine','aberfeldy','spittal of glenshee','alyth'],area:'North Perthshire and the Carse',tickets:['North Perthshire and the Carse','East Scotland']},
 {keys:['st fillans','aber­nethy','abernethy','kinross'],area:'South Perthshire and Kinross',tickets:['South Perthshire and Kinross','East Scotland']},
 {keys:['edinburgh','barnton','fairmilehead'],area:'Edinburgh',tickets:['Edinburgh','East Scotland']}
];
function match(stop){const text=String(stop?.name||'').toLowerCase();for(const r of rules)if(r.keys.some(k=>text.includes(k)))return r;return{area:'Current stop area',tickets:['East Scotland']};}
function style(){if($('homeValidTicketsCss'))return;const s=document.createElement('style');s.id='homeValidTicketsCss';s.textContent='.homeValidTicketsBtn{width:100%;margin-top:10px;background:#f4a51c!important;color:#081827!important;font-weight:900}.hvtModal{display:none;position:fixed;inset:0;z-index:12000;padding:18px;background:rgba(0,0,0,.78);overflow:auto}.hvtModal.show{display:flex;align-items:center;justify-content:center}.hvtCard{width:min(620px,100%);max-height:88vh;overflow:auto;padding:17px;border-radius:16px;background:#0b1b2b;border:3px solid #f4a51c}.hvtHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.hvtHead h2{margin:0}.hvtStop{margin:7px 0 15px;color:#b8c5ce}.hvtTicket{padding:12px;margin:9px 0;border:1px solid #36586f;border-radius:12px;background:#102b40}.hvtTicket:first-child{border-left:7px solid #f4a51c}.hvtTicket h3{margin:0 0 5px}.hvtNote{margin-top:13px;font-size:12px;color:#b8c5ce}@media(max-width:560px){.hvtHead{flex-direction:column}.hvtHead .btn{width:100%}}';document.head.appendChild(s);}
function close(){$('homeValidTicketsModal')?.classList.remove('show');}
function show(){const stop=window.inspectorNearbyStops?.stops?.[0];const body=$('homeValidTicketsBody');if(!body)return;if(!stop){body.innerHTML='<div class="hvtTicket"><h3>Location needed</h3><div>Refresh the closest bus stop first, then open this again.</div></div>';}else{const r=match(stop);body.innerHTML='<div class="hvtStop"><strong>Closest stop:</strong> '+esc(stop.name)+(stop.dist!=null?' • '+esc(stop.dist)+' m away':'')+'<br><strong>Detected area:</strong> '+esc(r.area)+'</div><div>'+r.tickets.map((t,i)=>'<div class="hvtTicket"><h3>'+(i===0?'Best local match: ':'')+esc(t)+'</h3><div>'+esc(Z[t]?.detail||'See the Ticket Guide for full boundary details.')+'</div></div>').join('')+'</div><div class="hvtNote">This is matched from the closest stop name and the published boundary descriptions. Near zone edges, check the full Ticket Guide before confirming validity.</div>';} $('homeValidTicketsModal').classList.add('show');}
function build(){const card=$('homeNearestStopCard');if(!card)return false;if(!$('homeValidTicketsBtn')){const b=document.createElement('button');b.type='button';b.id='homeValidTicketsBtn';b.className='btn homeValidTicketsBtn';b.textContent='🎟️ TICKETS VALID HERE';b.onclick=e=>{e.preventDefault();e.stopPropagation();show();};card.appendChild(b);}if(!$('homeValidTicketsModal')){const m=document.createElement('div');m.id='homeValidTicketsModal';m.className='hvtModal';m.innerHTML='<div class="hvtCard"><div class="hvtHead"><div><h2>Tickets Valid Here</h2><div class="small">Based on your closest bus stop</div></div><button type="button" class="btn" id="homeValidTicketsClose">CLOSE</button></div><div id="homeValidTicketsBody"></div></div>';document.body.appendChild(m);$('homeValidTicketsClose').onclick=close;m.addEventListener('click',e=>{if(e.target===m)close();});}return true;}
function init(){style();let n=0,t=setInterval(()=>{n++;if(build()||n>100)clearInterval(t);},200);document.addEventListener('inspector-nearby-stops',()=>build());}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1200));else setTimeout(init,1200);
})();