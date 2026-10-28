(function(){
'use strict';
const $=id=>document.getElementById(id);let mode='inspection',resultFilter='today';
function minutes(s,a){if(!s||!a)return null;const [sh,sm]=s.split(':').map(Number),[ah,am]=a.split(':').map(Number);let d=(ah*60+am)-(sh*60+sm);if(d>720)d-=1440;if(d<-720)d+=1440;return d;}
function resultText(d){if(d===0)return'ON TIME';if(d<0){const n=Math.abs(d);return n+' MINUTE'+(n===1?'':'S')+' EARLY';}return d+' MINUTE'+(d===1?'':'S')+' LATE';}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function addStyle(){if($('integratedCheckCss'))return;const s=document.createElement('style');s.id='integratedCheckCss';s.textContent=`#checksheet .checkTypeChooser{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0 16px;padding:10px;border-radius:14px;background:#0d263b;border:1px solid rgba(255,255,255,.12)}#checksheet .checkTypeChooser button{min-height:58px;border:1px solid #416783;border-radius:11px;background:#17324b;color:#fff;font-weight:900;font-size:15px}#checksheet .checkTypeChooser button.active{background:#eea83e;color:#07131e;border-color:#eea83e}#integratedTimingPanel{padding:14px;border-radius:14px;background:#10263a;border:1px solid #31536d}#integratedTimingPanel .itGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.itFieldLabel{display:block;font-size:12px;font-weight:800;color:#c5d2dc}.itFieldRow{display:grid;grid-template-columns:1fr auto;gap:7px;align-items:end}.itKeep{display:flex!important;align-items:center;gap:5px;white-space:nowrap;font-size:11px!important;padding-bottom:13px}.itLocate{min-height:50px;margin-top:5px;padding:8px 10px}.itResultsWrap{margin-top:16px;padding-top:14px;border-top:1px solid #31536d}.itResultsHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.itResultsTools{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:9px}.itResultsTools button.active{background:#eea83e;color:#07131e}.itResultsSearch{width:100%;box-sizing:border-box;margin-bottom:9px}.itResultsList{max-height:520px;overflow:auto}.itResultCard{padding:11px;margin:8px 0;border-radius:10px;background:#0d1c2b;border-left:6px solid #459679}.itResultCard.early{border-left-color:#eea83e}.inspectionModeHidden{display:none!important}#timing .timingEntryOnly,#timing #toggleTimingEntryBtn{display:none!important}@media(max-width:620px){#checksheet .checkTypeChooser,#integratedTimingPanel .itGrid,.itResultsTools{grid-template-columns:1fr}.itResultsHead{align-items:stretch;flex-direction:column}.itFieldRow{grid-template-columns:1fr}.itKeep{padding-bottom:0}}`;document.head.appendChild(s);}
function field(label,id,placeholder,keepKey,extra=''){return `<label class="itFieldLabel">${label}<div class="itFieldRow"><input class="field" id="${id}" placeholder="${placeholder}" ${extra}><label class="itKeep"><input type="checkbox" data-it-keep="${keepKey}"> Keep</label></div></label>`;}
function buildTimingPanel(section){if($('integratedTimingPanel'))return $('integratedTimingPanel');const p=document.createElement('div');p.id='integratedTimingPanel';p.className='inspectionModeHidden';p.innerHTML='<h3>Timing Check</h3><div class="itGrid">'+field('Location Checked','itLocation','Location checked','location')+field('Service Number','itService','Service','service')+field('Destination','itDestination','Destination','destination')+field('Fleet Number','itFleet','Fleet number','fleet')+field('Driver','itDriver','Driver name or employee number','driver')+'<label class="itFieldLabel">Scheduled Time<input class="field" id="itScheduled" type="time"></label><label class="itFieldLabel">Actual Time<input class="field" id="itActual" type="time"></label></div><button class="btn itLocate" id="itUseLocation" type="button">USE CURRENT LOCATION</button><div id="integratedTimingActions"><button class="btn" id="itSave">SAVE TIMING CHECK</button><button class="btn danger" id="itClear">CLEAR FORM</button></div><div class="itResultsWrap"><div class="itResultsHead"><h3>Timing Check Results</h3><button class="btn" id="itToggleResults" type="button">HIDE CHECK RESULTS</button></div><div id="itResultsBody"><div class="itResultsTools"><button data-it-filter="today" class="active">Today</button><button data-it-filter="week">This Week</button><button data-it-filter="month">This Month</button><button data-it-filter="all">All</button></div><input class="field itResultsSearch" id="itResultsSearch" placeholder="Search location, service, fleet, driver or inspector"><div class="itResultsList" id="itResultsList"></div></div></div>';section.appendChild(p);return p;}
function inspectionChildren(section,chooser,panel){return [...section.children].filter(el=>el!==chooser&&el!==panel&&el.id!=='integratedOtherWorkPanel'&&el.id!=='fullDayPanel'&&!el.classList.contains('backBtn')&&el.tagName!=='H2'&&!el.classList.contains('homeToolToggle'));}
function setMode(next){mode=next;const section=$('checksheet'),chooser=$('checkTypeChooser'),panel=$('integratedTimingPanel');if(!section||!chooser||!panel)return;inspectionChildren(section,chooser,panel).forEach(el=>el.classList.toggle('inspectionModeHidden',mode!=='inspection'));panel.classList.toggle('inspectionModeHidden',mode!=='timing');const other=$('integratedOtherWorkPanel');if(other)other.classList.toggle('inspectionModeHidden',mode!=='other');const full=$('fullDayPanel');if(full)full.classList.toggle('inspectionModeHidden',mode!=='fullDay');chooser.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.checkType===mode));const h=section.querySelector('h2');if(h)h.textContent=mode==='inspection'?'Inspector Check Sheet':mode==='timing'?'New Timing Check':mode==='other'?'Other Work':'Full Day Report';if(mode==='timing')setTimeout(renderEmbeddedResults,50);if(mode==='other'){renderOtherWork();refreshOtherWork();}if(mode==='fullDay'){renderFullDay();refreshFullDay();}}
function keepState(){const out={};document.querySelectorAll('[data-it-keep]').forEach(c=>out[c.dataset.itKeep]=c.checked);return out;}
function clearTiming(){const ids={location:'itLocation',service:'itService',destination:'itDestination',fleet:'itFleet',driver:'itDriver'},keeps=keepState();Object.entries(ids).forEach(([k,id])=>{const el=$(id),v=el?.value||'';if(el&&!keeps[k])el.value='';localStorage.setItem('itKeep_'+k,keeps[k]?'1':'0');localStorage.setItem('itValue_'+k,keeps[k]?v:'');});['itScheduled','itActual'].forEach(id=>{if($(id))$(id).value='';});}
function rows(){try{const a=(typeof cloud!=='undefined'&&cloud&&Array.isArray(cloud['Timing Checks']))?cloud['Timing Checks']:[];if(!a.length)return[];const h=(a[0]||[]).map(v=>String(v||'').toLowerCase());return h.some(v=>['date','time','inspector','location','service'].includes(v))?a.slice(1):a.slice();}catch(e){return[];}}
function parseDate(v){if(typeof parseRowDate==='function')return parseRowDate(v);const p=String(v||'').split('/');if(p.length===3)return new Date(Number(p[2]),Number(p[1])-1,Number(p[0]));return new Date(v);}
function renderEmbeddedResults(){const dest=$('itResultsList');if(!dest)return;const q=($('itResultsSearch')?.value||'').toLowerCase(),now=new Date();let data=rows().filter(r=>{const d=parseDate(r[0]);if(resultFilter==='today'&&d.toDateString()!==now.toDateString())return false;if(resultFilter==='week'&&(now-d)>7*86400000)return false;if(resultFilter==='month'&&(now-d)>31*86400000)return false;return !q||r.join(' ').toLowerCase().includes(q);}).reverse();dest.innerHTML=data.map(r=>{const mins=isNaN(Number(r[10]))?minutes(r[8],r[9]):Number(r[10]),result=resultText(mins);return `<div class="itResultCard ${mins<0?'early':''}"><b>${esc(r[4]||'-')} • ${esc(result)}</b><div>${esc(r[0]||'')} ${esc(r[1]||'')}</div><div>${esc(r[3]||'-')} • ${esc(r[5]||'-')}</div><div>Fleet ${esc(r[6]||'-')} • ${esc(r[7]||'-')} • ${esc(r[2]||'-')}</div><div>Scheduled ${esc(r[8]||'-')} • Actual ${esc(r[9]||'-')}</div></div>`;}).join('')||'<div class="small">No timing checks for this view.</div>';document.querySelectorAll('[data-it-filter]').forEach(b=>b.classList.toggle('active',b.dataset.itFilter===resultFilter));}
function saveTiming(){const ids=['itLocation','itService','itScheduled','itActual'];if(ids.some(id=>!$(id)?.value)){alert('Please enter location, service, scheduled time and actual time.');return;}const d=minutes($('itScheduled').value,$('itActual').value),result=resultText(d),date=typeof normaliseDateForSave==='function'?normaliseDateForSave(''):new Date().toLocaleDateString('en-GB'),time=typeof normaliseTimeForSave==='function'?normaliseTimeForSave(new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})):new Date().toLocaleTimeString('en-GB'),inspector=typeof getInspector==='function'?getInspector():(localStorage.getItem('activeInspector')||''),row=[date,time,inspector,$('itLocation').value,$('itService').value,$('itDestination').value,$('itFleet').value,$('itDriver').value,$('itScheduled').value,$('itActual').value,d,result];if(typeof cloudAppend==='function')cloudAppend('Timing Checks',row);try{if(typeof cloud!=='undefined'){cloud['Timing Checks']=cloud['Timing Checks']||[];cloud['Timing Checks'].push(row);}}catch(e){}clearTiming();renderEmbeddedResults();setTimeout(()=>{if(typeof loadCloud==='function')loadCloud();setTimeout(renderEmbeddedResults,900);},1000);alert('Timing check saved.');}
async function useCurrentLocation(){const btn=$('itUseLocation'),input=$('itLocation');if(!navigator.geolocation){alert('Current location is not supported on this device.');return;}btn.textContent='FINDING LOCATION…';navigator.geolocation.getCurrentPosition(async pos=>{const {latitude,longitude}=pos.coords;let label=latitude.toFixed(5)+', '+longitude.toFixed(5);try{const r=await fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat='+latitude+'&lon='+longitude);const j=await r.json();label=j.display_name||label;}catch(e){}input.value=label;btn.textContent='USE CURRENT LOCATION';},()=>{btn.textContent='USE CURRENT LOCATION';alert('Location permission was not available.');},{enableHighAccuracy:true,timeout:12000});}

function addOtherWorkStyle(){if($('integratedOtherWorkCss'))return;const s=document.createElement('style');s.id='integratedOtherWorkCss';s.textContent='#checksheet .checkTypeChooser{grid-template-columns:repeat(3,minmax(0,1fr))}#integratedOtherWorkPanel{padding:14px;border-radius:14px;background:#10263a;border:1px solid #31536d}#integratedOtherWorkPanel .owGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}#integratedOtherWorkPanel .owField{display:block;color:#c5d2dc;font-size:13px;font-weight:800}#integratedOtherWorkPanel .owField .field{width:100%;box-sizing:border-box;margin-top:6px}#integratedOtherWorkPanel textarea.field{min-height:130px;resize:vertical}#integratedOtherWorkPanel .owActions{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}#integratedOtherWorkPanel .owActions button{flex:1 1 140px}#integratedOtherWorkPanel .owResults{margin-top:18px;padding-top:14px;border-top:1px solid #31536d}#integratedOtherWorkPanel .owTools{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}#integratedOtherWorkPanel .owTools button{padding:9px 10px;border:1px solid #416783;border-radius:8px;background:#17324b;color:#fff;font-weight:800}#integratedOtherWorkPanel .owTools button.active{background:#eea83e;color:#07131e}#integratedOtherWorkPanel .owCard{margin:9px 0;padding:12px;background:#0d1c2b;border-left:5px solid #459679;border-radius:10px}#integratedOtherWorkPanel .owCard small{display:block;color:#b8c5ce;margin:4px 0 8px}#integratedOtherWorkPanel .owDescription{white-space:pre-wrap;overflow-wrap:anywhere}#integratedOtherWorkPanel .owFeedback{font-size:13px;margin:9px 0;color:#c5d2dc}#integratedOtherWorkPanel .owList{max-height:600px;overflow-y:auto}@media(max-width:620px){#checksheet .checkTypeChooser,#integratedOtherWorkPanel .owGrid{grid-template-columns:1fr}}';document.head.appendChild(s);}
let otherWorkFilter='today';
function otherWorkLocalDate(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function otherWorkRows(){try{if(typeof cloud==='undefined'||!cloud||!Array.isArray(cloud['Other Work']))return[];return cloud['Other Work'].filter(function(r){return Array.isArray(r)&&r.length>=6&&String(r[0]||'').toLowerCase()!=='date';});}catch(e){return[];}}
function renderOtherWork(){const out=$('owRecords');if(!out)return;const q=String($('owSearch')?.value||'').trim().toLowerCase(),now=new Date();const records=otherWorkRows().filter(function(r){const date=parseDate(r[0]);if(isNaN(date.getTime()))return otherWorkFilter==='all';const elapsed=now-date;if(otherWorkFilter==='today'&&date.toDateString()!==now.toDateString())return false;if(otherWorkFilter==='week'&&(elapsed<0||elapsed>7*86400000))return false;if(otherWorkFilter==='month'&&(elapsed<0||elapsed>31*86400000))return false;return !q||r.join(' ').toLowerCase().includes(q);}).reverse();out.innerHTML=records.map(function(r){return '<div class="owCard"><b>'+esc(r[3]||'-')+' – '+esc(r[4]||'-')+'</b><small>'+esc(r[0]||'-')+' • '+esc(r[2]||'Inspector not recorded')+'</small><div class="owDescription">'+esc(r[5]||'')+'</div></div>';}).join('')||'<div class="small">No Other Work records for this view.</div>';document.querySelectorAll('[data-ow-filter]').forEach(function(b){b.classList.toggle('active',b.dataset.owFilter===otherWorkFilter);});}
async function refreshOtherWork(){const btn=$('owRefresh'),feedback=$('owFeedback');if(btn)btn.disabled=true;if(feedback)feedback.textContent='Refreshing shared records…';try{if(typeof fetchCloudSheet!=='function')throw new Error('Cloud loading unavailable');await fetchCloudSheet('Other Work');renderOtherWork();if(feedback)feedback.textContent='Shared records updated.';}catch(err){if(feedback)feedback.textContent='Unable to refresh shared records. Showing locally available records.';console.warn('Other Work refresh failed',err);}finally{if(btn)btn.disabled=false;}}
async function saveOtherWork(){const chosenDate=$('owDate').value,from=$('owFrom').value,until=$('owUntil').value,notes=$('owNotes').value.trim(),feedback=$('owFeedback'),btn=$('owSave');if(!chosenDate||!from||!until||!notes){alert('Enter Date, Time From, Time Until and a description of the work carried out.');return;}const date=typeof normaliseDateForSave==='function'?normaliseDateForSave(chosenDate):chosenDate.split('-').reverse().join('/');const recorded=new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});const inspector=typeof getInspector==='function'?getInspector():(localStorage.getItem('activeInspector')||'');if(!inspector){alert('Select an inspector before saving.');return;}const row=[date,recorded,inspector,from,until,notes];if(btn){btn.disabled=true;btn.textContent='SAVING…';}if(feedback)feedback.textContent='Submitting Other Work record…';try{if(typeof cloudAppend!=='function')throw new Error('Cloud saving unavailable');await cloudAppend('Other Work',row);$('owFrom').value='';$('owUntil').value='';$('owNotes').value='';renderOtherWork();if(feedback)feedback.textContent='Record submitted for cloud saving. Use Refresh Records to check the shared list.';}catch(err){console.error('Other Work save failed',err);if(feedback)feedback.textContent='Unable to submit Other Work. Check your connection and try again.';}finally{if(btn){btn.disabled=false;btn.textContent='SAVE OTHER WORK';}}}
function buildOtherWorkPanel(section){if($('integratedOtherWorkPanel'))return $('integratedOtherWorkPanel');const p=document.createElement('div');p.id='integratedOtherWorkPanel';p.className='inspectionModeHidden';p.innerHTML=['<h3>Other Work</h3>','<p class="small">Record work carried out outside an inspection or timing check. Today’s date is selected by default and can be changed. The inspector’s name is added automatically.</p>','<label class="owField">Date<input class="field" type="date" id="owDate"></label><div class="owGrid"><label class="owField">Time From<input class="field" type="time" id="owFrom"></label><label class="owField">Time Until<input class="field" type="time" id="owUntil"></label></div>','<label class="owField">Other Work Carried Out<textarea class="field" id="owNotes" placeholder="Enter details of the work carried out"></textarea></label>','<div class="owActions"><button type="button" class="btn" id="owSave">SAVE OTHER WORK</button><button type="button" class="btn danger" id="owClear">CLEAR FORM</button></div>','<div class="owFeedback" id="owFeedback" role="status"></div>','<div class="owResults"><h3>Previous Other Work</h3><div class="owTools"><button type="button" data-ow-filter="today" class="active">Today</button><button type="button" data-ow-filter="week">This Week</button><button type="button" data-ow-filter="month">This Month</button><button type="button" data-ow-filter="all">All</button></div><input class="field" id="owSearch" placeholder="Search inspector, date, or work carried out"><div class="owActions"><button type="button" class="btn" id="owRefresh">REFRESH RECORDS</button></div><div class="owList" id="owRecords"></div></div>'].join('');section.appendChild(p);$('owDate').value=otherWorkLocalDate();$('owSave').onclick=saveOtherWork;$('owClear').onclick=function(){$('owDate').value=otherWorkLocalDate();$('owFrom').value='';$('owUntil').value='';$('owNotes').value='';$('owFeedback').textContent='';};$('owRefresh').onclick=refreshOtherWork;$('owSearch').oninput=renderOtherWork;p.querySelectorAll('[data-ow-filter]').forEach(function(b){b.onclick=function(){otherWorkFilter=b.dataset.owFilter;renderOtherWork();};});return p;}


/* Full Day Report: one dated view across the shared inspection, timing and other-work sheets. */
const fullDaySources=['Inspections','Timing Checks','Early Running','Other Work'];
let fullDayLoading=null;
function fullDayIsMichael(){
  const name=typeof getInspector==='function'?getInspector():(localStorage.getItem('activeInspector')||'');
  return /^(?:m|michael)\.?\s+skinner$/i.test(String(name).trim());
}
function fullDayDateKey(value){
  if(value instanceof Date){if(isNaN(value.getTime()))return'';return [value.getFullYear(),String(value.getMonth()+1).padStart(2,'0'),String(value.getDate()).padStart(2,'0')].join('-');}
  if(typeof value==='number'&&value>20000&&value<90000)return new Date(Date.UTC(1899,11,30)+value*86400000).toISOString().slice(0,10);
  const v=String(value??'').trim();
  let m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\b|T)/);
  if(m)return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
  m=v.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})(?:\b|\s|$)/);
  if(m){const year=m[3].length===2?'20'+m[3]:m[3];return year+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');}
  const date=new Date(v);return isNaN(date.getTime())?'':fullDayDateKey(date);
}
function fullDayMinutes(value){
  const s=String(value??'').trim(),m=s.match(/^(\d{1,2}):(\d{2})/);
  if(m){const hour=Number(m[1]),min=Number(m[2]);if(hour<24&&min<60)return hour*60+min;}
  const d=new Date(s);return isNaN(d.getTime())?Infinity:d.getHours()*60+d.getMinutes();
}
function fullDayTime(value){
  const s=String(value??'').trim(),m=s.match(/^(\d{1,2}):(\d{2})/);
  if(m)return m[1].padStart(2,'0')+':'+m[2];
  if(typeof formatTimeValue==='function')return formatTimeValue(value);
  return s||'-';
}
function fullDayRows(sheet){
  try{
    const a=cloud?.[sheet];
    if(!Array.isArray(a))return[];
    return a.filter(r=>Array.isArray(r)&&r.length>2&&fullDayDateKey(r[0])&&String(r[2]||'').trim().toLowerCase()!=='inspector');
  }catch(e){return[];}
}
function fullDayRecords(){
  const records=[],seen=new Set();let order=0;
  for(const r of fullDayRows('Inspections')){
    const time=fullDayTime(r[7]||r[1]),entry={kind:'inspection',label:'Inspection',date:fullDayDateKey(r[0]),time,mins:fullDayMinutes(r[7]||r[1]),inspector:String(r[2]||''),raw:r,order:order++};
    const key='i|'+entry.date+'|'+r.map(v=>String(v??'').trim()).join('|');
    if(!seen.has(key)){seen.add(key);records.push(entry);}
  }
  for(const sheet of ['Timing Checks','Early Running']){
    for(const r of fullDayRows(sheet)){
      if(r.length<12)continue; // Exclude legacy early-running notes that are not timing checks.
      const entry={kind:'timing',label:'Timing Check',date:fullDayDateKey(r[0]),time:fullDayTime(r[9]||r[1]),mins:fullDayMinutes(r[9]||r[1]),inspector:String(r[2]||''),raw:r,order:order++};
      // A timing check could be saved to both historical and current sheets, or repeated locally.
      const key='t|'+entry.date+'|'+[r[2],r[3],r[4],r[5],r[6],r[7],r[8],r[9]].map(v=>String(v??'').trim().toLowerCase()).join('|');
      if(!seen.has(key)){seen.add(key);records.push(entry);}
    }
  }
  for(const r of fullDayRows('Other Work')){
    if(r.length<6)continue;
    const entry={kind:'other',label:'Other Work',date:fullDayDateKey(r[0]),time:fullDayTime(r[3]||r[1]),mins:fullDayMinutes(r[3]||r[1]),inspector:String(r[2]||''),raw:r,order:order++};
    const key='o|'+entry.date+'|'+[r[1],r[2],r[3],r[4],r[5]].map(v=>String(v??'').trim()).join('|');
    if(!seen.has(key)){seen.add(key);records.push(entry);}
  }
  return records;
}
function fullDayValue(label,v){
  const value=String(v??'').trim();
  if(!value||value==='-')return'';
  return '<div class="fdrDetail"><strong>'+esc(label)+'</strong><span>'+esc(value)+'</span></div>';
}
function fullDayCard(entry){
  const r=entry.raw,parts=[];let title=entry.label;
  if(entry.kind==='inspection'){
    title='Service '+(r[5]||'-')+' • '+(r[4]||'Driver not entered');
    parts.push(fullDayValue('Depot',r[3]),fullDayValue('Driver',r[4]),fullDayValue('Service',r[5]),fullDayValue('Fleet',r[6]),fullDayValue('Boarding point',r[8]),fullDayValue('Destination',r[9]),fullDayValue('Time checked',fullDayTime(r[7])),fullDayValue('NSA',r[10]),fullDayValue('NSA fault',r[11]),fullDayValue('NSA notes',r[12]),fullDayValue('Driver action',r[13]),fullDayValue('Offence reference',r[15]),fullDayValue('Inspection / offence details',r[14]));
  }else if(entry.kind==='timing'){
    title='Service '+(r[4]||'-')+' • '+(r[3]||'Location not entered');
    parts.push(fullDayValue('Location',r[3]),fullDayValue('Service',r[4]),fullDayValue('Destination',r[5]),fullDayValue('Fleet',r[6]),fullDayValue('Driver',r[7]),fullDayValue('Scheduled',fullDayTime(r[8])),fullDayValue('Actual',fullDayTime(r[9])),fullDayValue('Result',r[11]||(Number.isFinite(Number(r[10]))?resultText(Number(r[10])):'')));
  }else{
    title=r[5]||'Other Work';
    parts.push(fullDayValue('Time From',fullDayTime(r[3])),fullDayValue('Time Until',fullDayTime(r[4])),fullDayValue('Work carried out',r[5]));
  }
  return '<article class="fdrCard fdr-'+entry.kind+'"><div class="fdrCardTop"><span class="fdrTime">'+esc(entry.time)+'</span><span class="fdrType">'+esc(entry.label)+'</span></div><h4>'+esc(title)+'</h4><div class="fdrBy">'+esc(entry.inspector||'Inspector not recorded')+'</div><div class="fdrDetails">'+parts.filter(Boolean).join('')+'</div></article>';
}
function fullDayInspectorOptions(){
  const select=$('fdrInspector'),wrap=$('fdrInspectorWrap');
  if(!select||!wrap)return;
  const admin=fullDayIsMichael();
  wrap.hidden=!admin;
  const chosen=admin?select.value:'all';
  const names=[...new Set(fullDayRecords().map(x=>x.inspector.trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  select.replaceChildren();
  const all=document.createElement('option');all.value='all';all.textContent='All inspectors';select.append(all);
  names.forEach(name=>{const opt=document.createElement('option');opt.value=name;opt.textContent=name;select.append(opt);});
  select.value=admin&&names.includes(chosen)?chosen:'all';
}
function renderFullDay(){
  const root=$('fdrReport'),dateInput=$('fdrDate');if(!root||!dateInput)return;
  const key=dateInput.value||otherWorkLocalDate();
  fullDayInspectorOptions();
  const selected=fullDayIsMichael()?$('fdrInspector').value:'all';
  const entries=fullDayRecords().filter(x=>x.date===key&&(selected==='all'||x.inspector===selected)).sort((a,b)=>a.mins-b.mins||a.order-b.order);
  const counts={inspection:0,timing:0,other:0};entries.forEach(x=>counts[x.kind]++);
  const parts=key.split('-').map(Number);
  const heading=new Date(parts[0],parts[1]-1,parts[2]).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  root.innerHTML='<h3 class="fdrDayTitle">'+esc(heading)+'</h3><div class="fdrStats"><div><b>'+entries.length+'</b><span>Total entries</span></div><div><b>'+counts.inspection+'</b><span>Inspections</span></div><div><b>'+counts.timing+'</b><span>Timing checks</span></div><div><b>'+counts.other+'</b><span>Other work</span></div></div><div class="fdrTimeline">'+(entries.length?entries.map(fullDayCard).join(''):'<p class="small">No inspections, timing checks or other work recorded for this date'+(selected==='all'?'':' and inspector')+'.</p>')+'</div>';
}
async function refreshFullDay(){
  const btn=$('fdrRefresh'),status=$('fdrStatus');if(fullDayLoading)return fullDayLoading;
  if(typeof fetchCloudSheet!=='function'){if(status)status.textContent='Shared data is unavailable. Showing cached entries.';renderFullDay();return;}
  if(btn)btn.disabled=true;
  if(status)status.textContent='Refreshing inspections, timing checks and other work…';
  fullDayLoading=Promise.allSettled(fullDaySources.map(sheet=>fetchCloudSheet(sheet))).then(results=>{
    renderFullDay();
    const missing=results.filter(r=>r.status==='rejected').length;
    if(status)status.textContent=missing?'Some shared sources could not be refreshed ('+missing+' of '+results.length+'). Results may be incomplete.':'Full day report updated from shared records.';
  }).finally(()=>{if(btn)btn.disabled=false;fullDayLoading=null;});
  return fullDayLoading;
}
function addFullDayStyle(){
  if($('fullDayStyle'))return;
  const s=document.createElement('style');s.id='fullDayStyle';
  s.textContent='#checksheet .checkTypeChooser{grid-template-columns:repeat(2,minmax(0,1fr))}#fullDayPanel{padding:15px;border-radius:14px;background:#10263a;border:1px solid #31536d}#fullDayPanel .fdrControls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:end}#fullDayPanel .fdrField{font-size:13px;color:#c5d2dc;font-weight:800;display:block}#fullDayPanel .fdrField .field{width:100%;box-sizing:border-box;margin-top:6px}#fullDayPanel #fdrInspectorWrap[hidden]{display:none!important}#fullDayPanel .fdrRefreshRow{margin-top:12px}#fullDayPanel .fdrStatus{font-size:12px;color:#b8c5ce;margin:10px 0}#fullDayPanel .fdrDayTitle{font-size:18px;margin:16px 0 12px}#fullDayPanel .fdrStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}#fullDayPanel .fdrStats>div{background:#091d2d;padding:12px 8px;border:1px solid #31536d;border-radius:10px;text-align:center}#fullDayPanel .fdrStats b{display:block;color:#eea83e;font-size:24px}#fullDayPanel .fdrStats span{display:block;color:#d0dbe3;font-size:11px;margin-top:3px}#fullDayPanel .fdrCard{background:#0d1c2b;border-radius:12px;padding:13px;margin:10px 0;border-left:5px solid #459679}#fullDayPanel .fdrCard.fdr-timing{border-left-color:#eea83e}#fullDayPanel .fdrCard.fdr-other{border-left-color:#5b9ce1}#fullDayPanel .fdrCardTop{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#fff}#fullDayPanel .fdrTime{font-weight:900;font-size:16px}#fullDayPanel .fdrType{font-size:11px;font-weight:800;background:#21405b;border-radius:20px;padding:4px 8px}#fullDayPanel .fdrCard h4{font-size:15px;margin:8px 0;white-space:pre-wrap;overflow-wrap:anywhere}#fullDayPanel .fdrBy{font-size:12px;color:#b8c5ce;margin-bottom:9px}#fullDayPanel .fdrDetails{display:grid;grid-template-columns:1fr;gap:5px}#fullDayPanel .fdrDetail{font-size:13px;display:grid;grid-template-columns:minmax(110px,28%) minmax(0,1fr);gap:10px;padding-top:5px;border-top:1px solid #244055}#fullDayPanel .fdrDetail strong{color:#b8c5ce}#fullDayPanel .fdrDetail span{white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:620px){#checksheet .checkTypeChooser{grid-template-columns:repeat(2,minmax(0,1fr))}#fullDayPanel .fdrControls{grid-template-columns:1fr}#fullDayPanel .fdrStats{grid-template-columns:repeat(2,minmax(0,1fr))}#fullDayPanel .fdrDetail{grid-template-columns:1fr;gap:2px}}';
  document.head.appendChild(s);
}
function buildFullDayPanel(section){
  if($('fullDayPanel'))return $('fullDayPanel');
  const panel=document.createElement('div');panel.id='fullDayPanel';panel.className='inspectionModeHidden';
  panel.innerHTML='<h3>Full Day Report</h3><p class="small">All inspections, timing checks and other work for the date selected, shown in time order.</p><div class="fdrControls"><label class="fdrField">Select Date<input type="date" class="field" id="fdrDate"></label><label class="fdrField" id="fdrInspectorWrap" hidden>Filter by Inspector<select class="field" id="fdrInspector"><option value="all">All inspectors</option></select></label></div><div class="fdrRefreshRow"><button type="button" class="btn" id="fdrRefresh">REFRESH FULL DAY REPORT</button></div><div class="fdrStatus" id="fdrStatus" role="status">Select a date to review all recorded work.</div><div id="fdrReport"></div>';
  section.append(panel);
  $('fdrDate').value=otherWorkLocalDate();
  $('fdrDate').onchange=renderFullDay;
  $('fdrInspector').onchange=renderFullDay;
  $('fdrRefresh').onclick=refreshFullDay;
  renderFullDay();
  return panel;
}

function setupChecksheet(){const section=$('checksheet');if(!section||$('checkTypeChooser'))return false;const h=section.querySelector('h2');if(!h)return false;const chooser=document.createElement('div');chooser.id='checkTypeChooser';chooser.className='checkTypeChooser';chooser.innerHTML='<button type="button" data-check-type="inspection" class="active">INSPECTION</button><button type="button" data-check-type="timing">TIMING CHECK</button><button type="button" data-check-type="other">OTHER WORK</button><button type="button" data-check-type="fullDay">SHOW FULL DAY REPORT</button>';h.after(chooser);buildTimingPanel(section);buildOtherWorkPanel(section);buildFullDayPanel(section);chooser.onclick=e=>{const b=e.target.closest('[data-check-type]');if(b)setMode(b.dataset.checkType);};$('itSave').onclick=saveTiming;$('itClear').onclick=clearTiming;$('itUseLocation').onclick=useCurrentLocation;$('itToggleResults').onclick=()=>{const body=$('itResultsBody'),btn=$('itToggleResults'),open=body.style.display!=='none';body.style.display=open?'none':'';btn.textContent=open?'SHOW CHECK RESULTS':'HIDE CHECK RESULTS';};document.querySelectorAll('[data-it-filter]').forEach(b=>b.onclick=()=>{resultFilter=b.dataset.itFilter;renderEmbeddedResults();});$('itResultsSearch').oninput=renderEmbeddedResults;document.querySelectorAll('[data-it-keep]').forEach(c=>{const k=c.dataset.itKeep;c.checked=localStorage.getItem('itKeep_'+k)==='1';const el=$({location:'itLocation',service:'itService',destination:'itDestination',fleet:'itFleet',driver:'itDriver'}[k]);if(c.checked&&el)el.value=localStorage.getItem('itValue_'+k)||'';});setMode('inspection');setTimeout(renderEmbeddedResults,500);return true;}
function setupResults(){const section=$('timing');if(!section)return false;const h=section.querySelector('h2');if(h)h.textContent='Timing Check Results';document.querySelectorAll('button[data-open="timing"]').forEach(b=>{b.innerHTML='<span class="navIcon">⏱️</span>Timing Check Results';});const entry=$('tcLocation')?.closest('.panel');if(entry){entry.classList.add('timingEntryOnly');entry.style.display='none';}const entryBtn=$('toggleTimingEntryBtn');if(entryBtn)entryBtn.remove();return true;}
function init(){addStyle();addOtherWorkStyle();addFullDayStyle();setupChecksheet();setupResults();setTimeout(()=>{setupChecksheet();setupResults();renderEmbeddedResults();},1200);}
if(typeof renderAll==='function'){const previousRenderAll=renderAll;renderAll=function(){previousRenderAll();renderOtherWork();if(mode==='fullDay')renderFullDay();};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,2200));else setTimeout(init,2200);
})();