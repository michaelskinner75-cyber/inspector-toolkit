(function(){
'use strict';
const DEPOTS=['Aberhill','Arbroath','Dunfermline','Glenrothes','St Andrews','Perth','Forfar','Blairgowrie','Other'];

function rowsWithoutHeader(sheet){
  const rows=(window.cloud&&cloud[sheet])||[];
  if(!rows.length)return [];
  const first=(rows[0]||[]).map(v=>String(v||'').trim().toLowerCase());
  const header=first.some(v=>['date','time','inspector','depot','driver','service','fleet','fleet number'].includes(v));
  return header?rows.slice(1):rows.slice();
}

function installDepotSelect(){
  const old=document.getElementById('csDepot');
  if(!old||old.tagName==='SELECT')return;
  const select=document.createElement('select');
  select.id='csDepot';select.className='field';
  select.innerHTML='<option value="">Select depot</option>'+DEPOTS.map(x=>`<option value="${x}">${x}</option>`).join('');
  const custom=document.createElement('input');
  custom.id='csDepotOther';custom.className='field';custom.placeholder='Enter other depot';custom.style.display='none';
  old.replaceWith(select);select.after(custom);
  select.addEventListener('change',()=>{custom.style.display=select.value==='Other'?'block':'none';if(select.value!=='Other')custom.value='';});
}

function depotValue(){
  const d=document.getElementById('csDepot');
  if(!d)return'';
  return d.value==='Other'?(document.getElementById('csDepotOther')?.value.trim()||'Other'):d.value;
}

window.renderChecks=function(){
  const list=document.getElementById('checkList');if(!list)return;
  let rows=rowsWithoutHeader('Inspections');
  const search=(document.getElementById('checkSearch')?.value||'').toLowerCase();
  const current=new Date();
  rows=rows.filter(r=>{
    const d=parseRowDate(r[0]);
    if(checkFilter==='today'&&!sameDay(d,current))return false;
    if(checkFilter==='week'&&!inThisWeek(d))return false;
    if(checkFilter==='month'&&!inThisMonth(d))return false;
    return !search||r.join(' ').toLowerCase().includes(search);
  });
  list.innerHTML=rows.reverse().map((r,i)=>{
    const date=formatDateValue(r[0]),saved=formatTimeValue(r[1]),boarded=formatTimeValue(r[7]);
    const details=[`Saved: ${date} ${saved}`,`Inspector: ${r[2]||'-'}`,`Depot: ${r[3]||'-'}`,`Driver: ${r[4]||'-'}`,`Service: ${r[5]||'-'}`,`Fleet: ${r[6]||'-'}`,`Time boarded: ${boarded}`,`${r[8]||'-'} to ${r[9]||'-'}`,`NSA: ${r[10]||'-'}${r[10]==='No'?' - '+(r[11]||'-')+' - '+(r[12]||'-'):''}`,`Driver Report: ${r[13]||'-'}`,r[14]||'-'];
    return `<div class="compactCheck ${statusClass(r)}"><div class="compactTop" data-toggle="fixedCheck${i}"><div class="compactMain">${date} ${boarded} | ${r[5]||'-'} | ${r[6]||'-'} | ${r[4]||'-'} | ${statusMark(r)}</div><div class="compactSub">${r[3]||'-'} • ${r[8]||'-'} → ${r[9]||'-'} • ${r[2]||'-'}</div></div><div class="compactDetails" id="fixedCheck${i}">${details.join('<br>')}</div></div>`;
  }).join('')||'No checks for this view.';
};

window.renderNSA=function(){
  const el=document.getElementById('nsaList');if(!el)return;
  const q=(document.getElementById('nsaSearch')?.value||'').toLowerCase();
  const current=new Date();
  let rows=rowsWithoutHeader('NSA Faults').filter(r=>{
    const d=parseRowDate(r[0]);
    if(nsaFilter==='today'&&!sameDay(d,current))return false;
    if(nsaFilter==='week'&&!inThisWeek(d))return false;
    if(nsaFilter==='month'&&!inThisMonth(d))return false;
    return !q||r.join(' ').toLowerCase().includes(q);
  });
  el.innerHTML=rows.reverse().map(r=>{
    const date=formatDateValue(r[0]),time=formatTimeValue(r[1]);
    const good=r[7]==='Yes'||r[8]==='Fully Working';
    const na=r[7]==='N/A'||r[8]==='N/A';
    const cls=na?'na':(good?'good':'bad');
    const title=na?'N/A':(good?'FULLY WORKING':(r[8]||'FAULT'));
    return `<div class="nsaCard ${cls}"><h3>${title}</h3><div>${date} ${time}</div><div><b>Depot:</b> ${r[3]||'-'}</div><div><b>Fleet:</b> ${r[4]||'-'}</div><div><b>Service:</b> ${r[5]||'-'}</div><div><b>Inspector:</b> ${r[2]||'-'}</div>${r[9]?`<div><b>Notes:</b> ${r[9]}</div>`:''}</div>`;
  }).join('')||'No NSA reports for this view.';
};

window.clearCheckForm=function(){
  ['csDriver','csService','csFleet','csTimeOn','csBoarding','csDestination','csNSANotes','csDriverReason'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  const depot=document.getElementById('csDepot');if(depot)depot.value='';
  const other=document.getElementById('csDepotOther');if(other){other.value='';other.style.display='none';}
  if(document.getElementById('csNSA'))document.getElementById('csNSA').value='Yes';
  if(document.getElementById('csNSAFault'))document.getElementById('csNSAFault').value='Fully Working';
  if(document.getElementById('csDriverReport'))document.getElementById('csDriverReport').value='No Driver Report';
};

window.saveCheckSheet=function(){
  const depot=depotValue();
  const service=document.getElementById('csService')?.value.trim()||'';
  const fleet=document.getElementById('csFleet')?.value.trim()||'';
  const driver=document.getElementById('csDriver')?.value.trim()||'';
  if(!depot||!service||!fleet||!driver){alert('Please select a depot and enter the driver, service and fleet number.');return;}
  const row=[normaliseDateForSave(document.getElementById('csDate').value),normaliseTimeForSave(now()),getInspector(),depot,driver,service,fleet,normaliseTimeForSave(document.getElementById('csTimeOn').value),document.getElementById('csBoarding').value,document.getElementById('csDestination').value,document.getElementById('csNSA').value,document.getElementById('csNSAFault').value,document.getElementById('csNSANotes').value,document.getElementById('csDriverReport').value,document.getElementById('csDriverReason').value];
  if(!cloud['Inspections'])cloud['Inspections']=[];
  cloud['Inspections'].push(row);
  cloudAppend('Inspections',row);
  const nsa=[row[0],row[1],getInspector(),depot,fleet,service,driver,row[10],row[11],row[12],row[8],row[9],'Inspector Check Sheet'];
  if(!cloud['NSA Faults'])cloud['NSA Faults']=[];
  cloud['NSA Faults'].push(nsa);
  cloudAppend('NSA Faults',nsa);
  if(row[13]!=='No Driver Report'){
    const report=[row[0],row[1],getInspector(),driver,depot,row[13],row[14],service,fleet];
    if(!cloud['Driver Reports'])cloud['Driver Reports']=[];
    cloud['Driver Reports'].push(report);
    cloudAppend('Driver Reports',report);
  }
  renderChecks();
  renderNSA();
  if(typeof renderDatabaseV2==='function')renderDatabaseV2();else if(typeof renderDatabase==='function')renderDatabase();
  if(typeof renderCoverage==='function')renderCoverage();
  clearCheckForm();
  setStatus('Check saved. Lists updated.');
};

function initialiseFix(){
  installDepotSelect();
  const save=document.getElementById('saveCheckSheetBtn');if(save)save.onclick=window.saveCheckSheet;
  const clear=document.getElementById('clearCheckFormBtn');if(clear)clear.onclick=window.clearCheckForm;
  const search=document.getElementById('checkSearch');if(search)search.addEventListener('input',window.renderChecks);
  const nsaSearch=document.getElementById('nsaSearch');if(nsaSearch)nsaSearch.addEventListener('input',window.renderNSA);
  window.renderChecks();
  window.renderNSA();
  if(typeof renderDatabaseV2==='function')renderDatabaseV2();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(initialiseFix,400));
else setTimeout(initialiseFix,400);
})();