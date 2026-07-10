(function(){
'use strict';
const $=id=>document.getElementById(id);

function addStyles(){
  if($('finalEveningFixCss'))return;
  const s=document.createElement('style');
  s.id='finalEveningFixCss';
  s.textContent=`
    #timing .timingDetailsToggle{width:100%;margin:10px 0;background:#17324b;border:1px solid #416783;color:#fff;border-radius:10px;padding:12px;font-weight:800;font-size:15px}
    #timing .timingDetailsHidden{display:none!important}
    #timing .timingLocationRow{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:stretch}
    #timing .timingLocationRow .timingFieldWrap{margin:0}
    #timing .timingGeoBtn{border:1px solid #4d83c4;background:#17324b;color:#fff;border-radius:10px;padding:0 14px;font-weight:800;font-size:13px;min-height:56px}
    #timing .timingGeoStatus{grid-column:1/-1;font-size:12px;color:#b8c5ce;margin:0 2px 2px}
  `;
  document.head.appendChild(s);
}

function setupTimingDetailsToggle(){
  const section=$('timing');
  if(!section)return;
  const panel=section.querySelector('.panel');
  if(!panel||$('toggleTimingDetailsBtn'))return;
  const btn=document.createElement('button');
  btn.type='button';
  btn.id='toggleTimingDetailsBtn';
  btn.className='timingDetailsToggle';
  panel.before(btn);
  function apply(hidden){
    panel.classList.toggle('timingDetailsHidden',hidden);
    btn.textContent=hidden?'Show Timing Check Details':'Hide Timing Check Details';
    btn.setAttribute('aria-expanded',String(!hidden));
    localStorage.setItem('timingDetailsHidden',hidden?'1':'0');
  }
  btn.addEventListener('click',()=>apply(!panel.classList.contains('timingDetailsHidden')));
  const saved=localStorage.getItem('timingDetailsHidden');
  apply(saved===null?true:saved==='1');
}

function forceHistoryDefaultHidden(){
  const section=$('timing');
  const list=$('timingList');
  const search=$('timingSearch');
  const panel=search&&search.closest('.panel');
  const btn=$('toggleTimingHistoryBtn');
  const title=section&&section.querySelector('.timingHistoryTitle');
  if(!panel||!list||!btn)return;
  const saved=localStorage.getItem('timingHistoryHidden');
  const hidden=saved===null?true:saved==='1';
  panel.classList.toggle('timingHidden',hidden);
  list.classList.toggle('timingHidden',hidden);
  if(title)title.classList.toggle('timingHidden',hidden);
  btn.textContent=hidden?'Show Completed Timing Checks':'Hide Completed Timing Checks';
  btn.setAttribute('aria-expanded',String(!hidden));
  if(saved===null)localStorage.setItem('timingHistoryHidden','1');
}

function readablePlace(data){
  const a=(data&&data.address)||{};
  const stop=a.bus_stop||a.road||a.pedestrian||a.neighbourhood||a.suburb||a.village||a.town||a.city||'';
  const area=a.town||a.city||a.village||a.suburb||'';
  if(stop&&area&&stop.toLowerCase()!==area.toLowerCase())return stop+', '+area;
  return stop||area||(data&&data.display_name)||'';
}

function setupTimingLocation(){
  const input=$('tcLocation');
  if(!input||$('useTimingLocationBtn'))return;
  const fieldWrap=input.closest('.timingFieldWrap');
  if(!fieldWrap)return;
  const row=document.createElement('div');
  row.className='timingLocationRow';
  fieldWrap.before(row);
  row.appendChild(fieldWrap);
  const btn=document.createElement('button');
  btn.type='button';btn.id='useTimingLocationBtn';btn.className='timingGeoBtn';btn.textContent='Use Location';
  const status=document.createElement('div');status.id='timingGeoStatus';status.className='timingGeoStatus';
  row.append(btn,status);
  btn.addEventListener('click',()=>{
    if(!navigator.geolocation){status.textContent='Location is not supported on this device.';return;}
    btn.disabled=true;btn.textContent='Locating…';status.textContent='Finding your location…';
    navigator.geolocation.getCurrentPosition(async pos=>{
      const lat=pos.coords.latitude,lon=pos.coords.longitude;
      try{
        const response=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`,{headers:{'Accept':'application/json'}});
        if(!response.ok)throw new Error('Lookup failed');
        const data=await response.json();
        const place=readablePlace(data);
        input.value=place||`${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        status.textContent=place?'Nearest street/place added.':'Coordinates added.';
      }catch(err){
        input.value=`${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        status.textContent='Street lookup unavailable; coordinates added.';
      }finally{
        input.dispatchEvent(new Event('input',{bubbles:true}));
        btn.disabled=false;btn.textContent='Use Location';
      }
    },err=>{
      status.textContent=err.code===1?'Location permission was not allowed.':'Unable to get current location.';
      btn.disabled=false;btn.textContent='Use Location';
    },{enableHighAccuracy:true,timeout:12000,maximumAge:30000});
  });
}

function cleanHomeButtons(){
  const labels={
    checksheet:['📋','Inspector Check Sheet'],ticket:['🎫','Ticket Log'],nsa:['🔊','NSA LOG'],
    reportSearch:['🔎','Report Search'],timing:['⏱️','Timing Checks'],coverage:['🗺️','Service Coverage'],
    busTimes:['📍','BusTimes'],utrack:['🛰️','UTrack'],ticketFinder:['🎟️','Ticket Finder'],journeyPlanner:['🧭','Plan a Journey']
  };
  document.querySelectorAll('#home .nav button[data-open]').forEach(btn=>{
    const key=btn.dataset.open;
    const item=labels[key];
    if(item)btn.innerHTML=`<span class="navIcon">${item[0]}</span>${item[1]}`;
    else{
      const icons=btn.querySelectorAll('.navIcon');
      icons.forEach((icon,i)=>{if(i>0)icon.remove();});
    }
  });
  const utrackHeading=document.querySelector('#utrack h2');if(utrackHeading)utrackHeading.textContent='UTrack';
}

function initialise(){
  addStyles();cleanHomeButtons();setupTimingDetailsToggle();forceHistoryDefaultHidden();setupTimingLocation();
  setTimeout(()=>{cleanHomeButtons();setupTimingDetailsToggle();forceHistoryDefaultHidden();setupTimingLocation();},1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(initialise,1800));else setTimeout(initialise,1800);
})();