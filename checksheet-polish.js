(function(){
'use strict';

const $=id=>document.getElementById(id);

function addStyles(){
  if($('checksheetPolishCss'))return;
  const style=document.createElement('style');
  style.id='checksheetPolishCss';
  style.textContent=`
    #checksheet .checkStatusBar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:10px 0 14px;padding:10px;border:1px solid #31536d;border-radius:12px;background:#10263a;font-size:12px;text-align:center}
    #checksheet .checkStatusItem{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#d8e5ef}
    #checksheet .checkStatusItem b{display:block;color:#fff;font-size:13px;margin-top:2px}
    #checksheet .formSection{margin:12px 0 16px;padding:12px;border:1px solid #31536d;border-radius:13px;background:#10263a}
    #checksheet .formSectionTitle{margin:-2px 0 10px;padding:8px 12px;border-radius:9px;font-weight:800;letter-spacing:.02em;background:#17324b;color:#fff;border-left:6px solid #e8aa3d}
    #checksheet .formSectionTitle.journey{border-left-color:#4d83c4}
    #checksheet .formSectionTitle.vehicle{border-left-color:#49a17f}
    #checksheet .formSectionTitle.driver{border-left-color:#d64a50}
    #checksheet .sectionGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    #checksheet .sectionGrid.inspectionRows{grid-template-columns:1fr}
    #checksheet .sectionGrid .full{grid-column:1/-1}
    #checksheet .fieldBlock{display:flex;flex-direction:column;gap:6px;min-width:0}
    #checksheet .fieldBlock>label{font-size:13px;font-weight:800;color:#d8e5ef;padding-left:2px}
    #checksheet .fieldBlock .field,#checksheet .fieldBlock select,#checksheet .fieldBlock input{width:100%;box-sizing:border-box}
    #checksheet #csDriver{height:56px!important;min-height:56px!important;max-height:56px!important;padding-top:0!important;padding-bottom:0!important}
    #checksheet .locationWrap{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:stretch}
    #checksheet .geoBtn{border:1px solid #4d83c4;background:#17324b;color:#fff;border-radius:10px;padding:0 12px;font-weight:800;font-size:13px;min-height:56px}
    #checksheet .geoStatus{font-size:12px;color:#b8c5ce;margin-top:5px;grid-column:1/-1}
    #checksheet .historyToggle{width:100%;margin:14px 0 8px;background:#17324b;border:1px solid #416783;color:#fff;border-radius:10px;padding:12px;font-weight:800;font-size:15px}
    #checksheet .historyHidden{display:none!important}
    #checksheet .historyPanelTitle{font-size:18px;font-weight:800;margin:12px 0 4px;color:#fff}
    #checksheet .serviceRouteText{display:none!important}
    @media(max-width:520px){#checksheet .checkStatusBar{grid-template-columns:1fr 1fr 1fr;font-size:10px}#checksheet .sectionGrid{grid-template-columns:1fr 1fr}#checksheet .sectionGrid.inspectionRows{grid-template-columns:1fr}#checksheet .locationWrap{grid-template-columns:1fr auto}}
  `;
  document.head.appendChild(style);
}

function addStatusBar(){
  const section=$('checksheet');
  if(!section)return;
  let bar=$('checkStatusBar');
  if(!bar){
    const heading=section.querySelector('h2');
    bar=document.createElement('div');
    bar.id='checkStatusBar';bar.className='checkStatusBar';
    heading.insertAdjacentElement('afterend',bar);
  }
  bar.innerHTML=`
    <div class="checkStatusItem">Inspector<b id="checkStatusInspector">-</b></div>
    <div class="checkStatusItem">Date<b id="checkStatusDate">-</b></div>
    <div class="checkStatusItem">Status<b id="checkStatusCloud">Live</b></div>`;
}

function makeSection(title,cls){
  const section=document.createElement('div');section.className='formSection';
  const heading=document.createElement('div');heading.className='formSectionTitle '+cls;heading.textContent=title;
  const grid=document.createElement('div');grid.className='sectionGrid';
  section.append(heading,grid);return{section,grid};
}

function moveElement(el,container,full){
  if(!el)return;
  if(full)el.classList.add('full');
  container.appendChild(el);
}

function labelledField(el,labelText){
  if(!el)return null;
  const block=document.createElement('div');
  block.className='fieldBlock full';
  const label=document.createElement('label');
  label.textContent=labelText;
  label.htmlFor=el.id;
  block.append(label,el);
  return block;
}

function buildLayout(){
  const section=$('checksheet');if(!section||section.dataset.layoutRebuilt==='2')return;
  const saveBtn=$('saveCheckSheetBtn');const saveGrid=saveBtn&&saveBtn.parentElement;if(!saveGrid)return;

  section.querySelectorAll(':scope > .formSectionTitle,:scope > .formSection').forEach(x=>x.remove());
  const oldGrids=[...section.querySelectorAll(':scope > .grid')].filter(g=>g!==saveGrid);

  const inspection=makeSection('Inspection Details','inspection');
  inspection.grid.classList.add('inspectionRows');
  const journey=makeSection('Journey Details','journey');
  const vehicle=makeSection('Vehicle','vehicle');
  const driver=makeSection('Driver','driver');

  const serviceWrap=document.querySelector('[data-for-service="csService"]');
  const depot=$('csDepot');
  const depotOther=$('csDepotOther');
  const nsaLabel=$('csNSA')?.closest('label')||$('csNSA');

  const dateBlock=labelledField($('csDate'),'Date');if(dateBlock)inspection.grid.appendChild(dateBlock);
  const time=$('csTimeOn');if(time)time.setAttribute('aria-label','Time Checked');
  const timeBlock=labelledField(time,'Time Checked');if(timeBlock)inspection.grid.appendChild(timeBlock);
  const depotBlock=labelledField(depot,'Depot');if(depotBlock)inspection.grid.appendChild(depotBlock);
  if(depotOther){const otherBlock=labelledField(depotOther,'Other Depot');if(otherBlock)inspection.grid.appendChild(otherBlock);}
  const driverBlock=labelledField($('csDriver'),'Driver');if(driverBlock)inspection.grid.appendChild(driverBlock);
  const fleetBlock=labelledField($('csFleet'),'Fleet Number');if(fleetBlock)inspection.grid.appendChild(fleetBlock);

  moveElement(serviceWrap||$('csService'),journey.grid,true);

  const boarding=$('csBoarding');
  if(boarding){
    const wrap=document.createElement('div');wrap.className='locationWrap full';
    const btn=document.createElement('button');btn.type='button';btn.className='geoBtn';btn.id='useCurrentLocationBtn';btn.textContent='Use Location';
    const status=document.createElement('div');status.className='geoStatus';status.id='geoLocationStatus';status.textContent='';
    wrap.append(boarding,btn,status);journey.grid.appendChild(wrap);
  }
  moveElement($('csDestination'),journey.grid,true);

  moveElement(nsaLabel,vehicle.grid);
  moveElement($('csNSAFault'),vehicle.grid);
  moveElement($('csNSANotes'),vehicle.grid,true);

  const issueSelect=document.createElement('select');issueSelect.id='csVehicleIssue';issueSelect.className='field full';
  issueSelect.innerHTML='<option value="No Vehicle Issues">No Vehicle Issues</option><option>Defect Card Issue</option><option>Cleanliness</option><option>Interior Damage</option><option>Exterior Damage</option><option>Warning Light</option><option>Destination Display</option><option>Ramp / Accessibility</option><option>Other Vehicle Issue</option>';
  const issueNotes=document.createElement('textarea');issueNotes.id='csVehicleIssueNotes';issueNotes.className='field full';issueNotes.placeholder='Vehicle issue comments';
  vehicle.grid.append(issueSelect,issueNotes);

  const report=$('csDriverReport');
  if(report){report.innerHTML='<option value="No Driver Report">No Driver Issues</option><option value="Advised">Driver Advised</option><option value="Offence Report Submitted">Offence Report to be Submitted</option>';}
  moveElement(report,driver.grid,true);
  const notes=$('csDriverReason');if(notes){notes.placeholder='Driver report reason / inspection notes';moveElement(notes,driver.grid,true);}

  oldGrids.forEach(g=>{if(g.isConnected&&g.children.length===0)g.remove();});
  saveGrid.before(inspection.section,journey.section,vehicle.section,driver.section);
  section.dataset.layoutRebuilt='2';
}

function readableAddress(address){
  if(!address)return'';
  const road=address.road||address.pedestrian||address.footway||address.cycleway||address.path||'';
  const locality=address.suburb||address.neighbourhood||address.village||address.town||address.city||'';
  const area=address.county||'';
  return [road,locality,area].filter((x,i,a)=>x&&a.indexOf(x)===i).join(', ');
}

async function reverseGeocode(lat,lon){
  const url=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1&accept-language=en`;
  const response=await fetch(url,{headers:{'Accept':'application/json'}});
  if(!response.ok)throw new Error('Location lookup failed');
  const data=await response.json();
  return readableAddress(data.address)||(data.display_name||'').split(',').slice(0,3).join(', ');
}

function setupGeolocation(){
  const btn=$('useCurrentLocationBtn');if(!btn||btn.dataset.ready==='1')return;
  btn.dataset.ready='1';
  btn.addEventListener('click',()=>{
    const status=$('geoLocationStatus');const boarding=$('csBoarding');
    if(!navigator.geolocation){if(status)status.textContent='Location is not supported on this device.';return;}
    btn.disabled=true;btn.textContent='Locating…';if(status)status.textContent='Waiting for location permission…';
    navigator.geolocation.getCurrentPosition(async pos=>{
      const lat=pos.coords.latitude,lon=pos.coords.longitude;
      try{
        if(status)status.textContent='Finding the nearest street or place…';
        const place=await reverseGeocode(lat,lon);
        if(boarding)boarding.value=place||`${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        if(status)status.textContent=place?'Street/place added. You can edit it if needed.':'Coordinates added because a street name was unavailable.';
      }catch(err){
        if(boarding)boarding.value=`${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        if(status)status.textContent='Coordinates added because the street-name lookup was unavailable.';
      }finally{
        btn.disabled=false;btn.textContent='Use Location';
      }
    },err=>{
      if(status)status.textContent=err.code===1?'Location permission was not allowed.':'Unable to get current location.';
      btn.disabled=false;btn.textContent='Use Location';
    },{enableHighAccuracy:true,timeout:12000,maximumAge:30000});
  });
}

function wrapSave(){
  if(typeof window.saveCheckSheet!=='function'||window.saveCheckSheet.__vehicleWrapped)return;
  const original=window.saveCheckSheet;
  const wrapped=function(){
    const notes=$('csDriverReason');
    const issue=$('csVehicleIssue')?.value||'No Vehicle Issues';
    const issueNotes=$('csVehicleIssueNotes')?.value.trim()||'';
    const originalText=notes?.value||'';
    const vehicleText=issue!=='No Vehicle Issues'?`Vehicle issue: ${issue}${issueNotes?' — '+issueNotes:''}`:(issueNotes?`Vehicle comments: ${issueNotes}`:'');
    if(notes&&vehicleText)notes.value=[vehicleText,originalText].filter(Boolean).join('\n');
    const result=original.apply(this,arguments);
    if(notes&&notes.value&&vehicleText&&notes.value.startsWith(vehicleText))notes.value=originalText;
    if($('csVehicleIssue'))$('csVehicleIssue').value='No Vehicle Issues';
    if($('csVehicleIssueNotes'))$('csVehicleIssueNotes').value='';
    return result;
  };
  wrapped.__vehicleWrapped=true;window.saveCheckSheet=wrapped;
}

function setupHistoryToggle(){
  const section=$('checksheet');const list=$('checkList');const search=$('checkSearch');const panel=search&&search.closest('.panel');
  if(!section||!list||!panel)return;
  let title=section.querySelector('.historyPanelTitle');
  if(!title){title=document.createElement('div');title.className='historyPanelTitle';title.textContent='Previous Checks';panel.before(title);}
  let btn=$('toggleCheckHistoryBtn');
  if(!btn){btn=document.createElement('button');btn.type='button';btn.id='toggleCheckHistoryBtn';btn.className='historyToggle';title.before(btn);}
  function apply(hidden){panel.classList.toggle('historyHidden',hidden);list.classList.toggle('historyHidden',hidden);title.classList.toggle('historyHidden',hidden);btn.textContent=hidden?'Show Previous Checks':'Hide Previous Checks';btn.setAttribute('aria-expanded',String(!hidden));localStorage.setItem('checkHistoryHidden',hidden?'1':'0');}
  if(btn.dataset.ready!=='1'){btn.dataset.ready='1';btn.addEventListener('click',()=>apply(!panel.classList.contains('historyHidden')));}
  apply(localStorage.getItem('checkHistoryHidden')==='1');
}

function updateStatus(){
  const inspector=$('checkStatusInspector'),date=$('checkStatusDate'),cloud=$('checkStatusCloud');
  if(inspector)inspector.textContent=(typeof getInspector==='function'&&getInspector())||'Not logged in';
  const dateField=$('csDate');if(date){const value=dateField&&dateField.value;date.textContent=(value&&typeof formatDateValue==='function')?formatDateValue(value):(value||'-');}
  const sync=$('syncStatus');if(cloud){const text=(sync&&sync.textContent)||'Live';cloud.textContent=/fail|offline|error/i.test(text)?'Check connection':'Live';}
}

function initialise(){
  addStyles();addStatusBar();buildLayout();setupGeolocation();wrapSave();setupHistoryToggle();updateStatus();
  const date=$('csDate');if(date){date.addEventListener('change',updateStatus);date.addEventListener('input',updateStatus);}
  setInterval(updateStatus,2000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(initialise,1100));
else setTimeout(initialise,1100);
})();