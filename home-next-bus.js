(function(){
'use strict';
const $=id=>document.getElementById(id);
let lastCode='',busy=false;
function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function stopCode(){const href=$('homeNearestOpen')?.href||'';const m=href.match(/\/stops\/([^/?#]+)/);return m?decodeURIComponent(m[1]):'';}
function parse(text){
 const lines=String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 for(const line of lines){
  if(!/^\|?\s*[A-Za-z0-9]+\s*\|/.test(line))continue;
  const parts=line.replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
  if(parts.length<4)continue;
  const service=parts[0].replace(/\[[^\]]*\]\([^)]*\)/g,'').trim();
  const to=parts[1].replace(/\[[^\]]*\]\([^)]*\)/g,'').trim();
  const scheduled=parts[2].trim(),expected=parts[3].trim();
  if(!service||!/\d{1,2}:\d{2}/.test(scheduled)||/sched|service|route/i.test(service))continue;
  const vm=to.match(/^(.*?)(?:\s+(\d{4,6})(?:\s*-\s*([A-Z0-9 ]{5,10}))?)?$/i);
  return{service,destination:(vm?.[1]||to).trim(),fleet:vm?.[2]||'',reg:(vm?.[3]||'').trim(),scheduled,expected:expected||scheduled};
 }
 return null;
}
function render(bus,msg){const box=$('homeNextBusBox');if(!box)return;if(!bus){box.innerHTML='<span class="hnbLabel">NEXT BUS</span><b class="hnbMessage">'+esc(msg||'Live vehicle details unavailable')+'</b>';return;}box.innerHTML='<span class="hnbLabel">NEXT BUS</span><div class="hnbGrid"><b class="hnbService">'+esc(bus.service)+'</b><span class="hnbDest">to '+esc(bus.destination)+'</span><span><small>Scheduled</small><strong>'+esc(bus.scheduled)+'</strong></span><span><small>Expected</small><strong>'+esc(bus.expected)+'</strong></span></div><div class="hnbVehicle">'+(bus.fleet?'<b>Fleet '+esc(bus.fleet)+'</b>':'<b>Fleet not yet assigned</b>')+(bus.reg?' <span>'+esc(bus.reg)+'</span>':'')+'</div>';}
async function refresh(force){const code=stopCode();if(!code||busy)return;if(!force&&code===lastCode&&$('homeNextBusBox')?.dataset.loaded==='1')return;busy=true;render(null,'Loading next service…');try{const url='https://r.jina.ai/http://bustimes.org/stops/'+encodeURIComponent(code)+'?t='+Date.now();const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('fetch');const bus=parse(await r.text());render(bus,bus?'':'No upcoming live journey found');$('homeNextBusBox').dataset.loaded='1';lastCode=code;}catch(e){render(null,'Live vehicle details unavailable');}finally{busy=false;}}
function build(){const card=$('homeNearestStopCard');if(!card||$('homeNextBusBox'))return false;const box=document.createElement('div');box.id='homeNextBusBox';box.className='homeNextBusBox';const head=$('homeNearestToggle');if(head)head.insertAdjacentElement('afterend',box);else card.prepend(box);render(null,'Loading next service…');setTimeout(()=>refresh(true),400);return true;}
function style(){if($('homeNextBusCss'))return;const s=document.createElement('style');s.id='homeNextBusCss';s.textContent='.homeNextBusBox{margin:0 10px 10px;padding:10px 11px;border:1px solid #36586f;border-radius:10px;background:#0b1b2b}.hnbLabel{display:block;margin-bottom:5px;color:#eea83e;font-size:9px;font-weight:900;letter-spacing:.1em}.hnbGrid{display:grid;grid-template-columns:auto 1fr auto auto;gap:8px;align-items:center}.hnbService{font-size:23px;color:#7b68ee}.hnbDest{font-size:14px;font-weight:800}.hnbGrid span small,.hnbGrid span strong{display:block;text-align:center}.hnbGrid span small{font-size:8px;color:#9eb0bd;text-transform:uppercase}.hnbGrid span strong{font-size:15px}.hnbVehicle{margin-top:7px;padding-top:7px;border-top:1px solid #29485e;font-size:12px}.hnbVehicle b{color:#fff}.hnbVehicle span{color:#b8c5ce}.hnbMessage{font-size:12px;color:#b8c5ce}@media(max-width:520px){.hnbGrid{grid-template-columns:auto 1fr}.hnbGrid>span:nth-child(3),.hnbGrid>span:nth-child(4){padding-top:5px;border-top:1px solid #29485e}.hnbGrid>span:nth-child(3){grid-column:1}.hnbGrid>span:nth-child(4){grid-column:2}}';document.head.appendChild(s);}
function init(){style();let n=0,t=setInterval(()=>{n++;build();if($('homeNextBusBox')||n>50)clearInterval(t);},250);const obs=new MutationObserver(()=>{build();const code=stopCode();if(code&&code!==lastCode)setTimeout(()=>refresh(true),150);});obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});document.addEventListener('click',e=>{if(e.target.closest('#homeNearestRefresh,#homeNearestToggle,.homeNearbyStopChoice'))setTimeout(()=>refresh(true),900);});setInterval(()=>refresh(true),30000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1800));else setTimeout(init,1800);
})();