(function(){
 'use strict';

 function inspectorInitials(name){
  const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
  if(!parts.length)return'XX';
  if(parts.length===1)return parts[0].replace(/[^A-Za-z]/g,'').slice(0,2).toUpperCase()||'XX';
  return (parts[0][0]+parts[parts.length-1][0]).toUpperCase();
 }

 function refDate(value){
  const d=typeof parseRowDate==='function'?parseRowDate(value):new Date(value);
  const safe=!d||isNaN(d)?new Date():d;
  return String(safe.getDate()).padStart(2,'0')+
   String(safe.getMonth()+1).padStart(2,'0')+
   String(safe.getFullYear()).slice(-2);
 }

 function nextOffenceReference(dateValue,inspector){
  const prefix=refDate(dateValue)+'/'+inspectorInitials(inspector)+'/';
  let highest=0;
  const inspect=function(row){
   const ref=String((row&&row[15])||'').trim().toUpperCase();
   if(ref.startsWith(prefix)){
    const n=Number(ref.slice(prefix.length));
    if(Number.isFinite(n)&&n>highest)highest=n;
   }
  };
  (cloud['Inspections']||[]).forEach(inspect);
  try{(JSON.parse(localStorage.getItem('local_Inspections')||'[]')||[]).forEach(inspect);}catch(e){}
  const counterKey='offenceRefCounter:'+prefix;
  const stored=Number(localStorage.getItem(counterKey)||0);
  highest=Math.max(highest,Number.isFinite(stored)?stored:0);
  const next=highest+1;
  localStorage.setItem(counterKey,String(next));
  return prefix+next;
 }

 window.saveCheckSheet=function(){
  const date=normaliseDateForSave($('csDate').value);
  const savedTime=normaliseTimeForSave(now());
  const inspector=getInspector();
  const reportType=$('csDriverReport').value;
  const offenceRef=reportType==='Offence Report Submitted'?nextOffenceReference(date,inspector):'';
  const nature=$('csNatureOffence')?$('csNatureOffence').value.trim():'';
  const passengers=$('csPassengers')?$('csPassengers').value.trim():'';
  const row=[date,savedTime,inspector,$('csDepot').value,$('csDriver').value,$('csService').value,$('csFleet').value,normaliseTimeForSave($('csTimeOn').value),$('csBoarding').value,$('csDestination').value,$('csNSA').value,$('csNSAFault').value,$('csNSANotes').value,reportType,$('csDriverReason').value,offenceRef,nature,passengers];

  cloudAppend('Inspections',row);
  cloudAppend('NSA Faults',[row[0],row[1],inspector,$('csDepot').value,$('csFleet').value,$('csService').value,$('csDriver').value,$('csNSA').value,$('csNSAFault').value,$('csNSANotes').value,$('csBoarding').value,$('csDestination').value,'Inspector Check Sheet']);
  if(reportType!=='No Driver Report'){
   cloudAppend('Driver Reports',[date,savedTime,inspector,$('csDriver').value,$('csDepot').value,reportType,$('csDriverReason').value,$('csService').value,$('csFleet').value,offenceRef,$('csBoarding').value,$('csDestination').value,nature,passengers,$('csDepot').value]);
  }

  if(!cloud['Inspections'])cloud['Inspections']=[];
  cloud['Inspections'].push(row);
  if(reportType!=='No Driver Report'){
   if(!cloud['Driver Reports'])cloud['Driver Reports']=[];
   cloud['Driver Reports'].push([date,savedTime,inspector,$('csDriver').value,$('csDepot').value,reportType,$('csDriverReason').value,$('csService').value,$('csFleet').value,offenceRef,$('csBoarding').value,$('csDestination').value,nature,passengers,$('csDepot').value]);
  }

  clearCheckForm();
  if($('csNatureOffence'))$('csNatureOffence').value='';
  if($('csPassengers'))$('csPassengers').value='';
  renderAll();
  if(offenceRef)alert('Offence reference allocated: '+offenceRef);
  setTimeout(loadCloud,1200);
 };

 window.renderChecks=function(){
  let rows=(cloud['Inspections']||[]).slice(1);
  const q=($('checkSearch').value||'').toLowerCase(),n=new Date();
  rows=rows.filter(r=>{const d=parseRowDate(r[0]);if(checkFilter==='today'&&!sameDay(d,n))return false;if(checkFilter==='week'&&!inThisWeek(d))return false;if(checkFilter==='month'&&!inThisMonth(d))return false;if(q&&!r.join(' ').toLowerCase().includes(q))return false;return true;});
  $('checkList').innerHTML=rows.reverse().map((r,i)=>{
   const date=formatDateValue(r[0]);const savedTime=formatTimeValue(r[1]);const timeOn=formatTimeValue(r[7]);const ref=r[15]||'';
   const details=[ref?'<b>Offence Reference: '+ref+'</b>':'',r[16]?'<b>Nature of Offence:</b> '+r[16]:'',r[17]?'<b>Passengers:</b> '+r[17]:'',`${date} ${savedTime}`,r[2]||'-',r[3]||'-',r[4]||'-',r[5]||'-',r[6]||'-',timeOn,`${r[8]||'-'} to ${r[9]||'-'}`,`NSA: ${r[10]||'-'}${r[10]==='No'?' - '+(r[11]||'-')+' - '+(r[12]||'-'):''}`,`Driver Report: ${r[13]||'-'}`,r[14]||'-'].filter(Boolean);
   return `<div class="compactCheck ${statusClass(r)}"><div class="compactTop" data-toggle="cd${i}"><div class="compactMain">${date} ${timeOn} | ${r[5]||'-'} | ${r[6]||'-'} | ${r[4]||'-'} | ${statusMark(r)}${ref?' | '+ref:''}</div><div class="compactSub">${r[3]||'-'} • ${r[8]||'-'} → ${r[9]||'-'} • ${r[2]||'-'}</div></div><div class="compactDetails" id="cd${i}">${details.join('<br>')}</div></div>`;
  }).join('')||'No checks for this view.';
 };

 const baseRenderCloudTable=window.renderCloudTable;
 window.renderCloudTable=function(sheet,el){
  if(sheet!=='Driver Reports')return baseRenderCloudTable(sheet,el);
  const rows=cloud[sheet]||[];
  el.innerHTML=rows.slice(1).reverse().map(r=>`<div class="row"><div><b>${r[9]||r[0]||'-'}</b><br><span class="small">${formatDateValue(r[0])} ${formatTimeValue(r[1])}</span></div><div>${r[3]||'-'} • ${r[4]||'-'}</div><div>${r[5]||'-'} • ${r[7]||'-'} • Fleet ${r[8]||'-'}${r[6]?'<br><span class="small">'+r[6]+'</span>':''}</div></div>`).join('')||'No driver reports.';
 };

 window.addEventListener('load',function(){
  const button=$('saveCheckSheetBtn');
  if(button)button.onclick=window.saveCheckSheet;
 });
})();