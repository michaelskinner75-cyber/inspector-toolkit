(function(){
'use strict';

const DOCX_CDN='https://unpkg.com/docx@8.5.0/build/index.umd.js';
let activeReport=null;
let generatedFile=null;

function h(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function val(id){const el=$(id);return el?el.value.trim():'';}
function safeName(v){return String(v||'Offence Report').replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').trim();}
function fileName(d){return safeName(`${d.reference||'Offence Report'} - ${d.employee||'Driver'} - Service ${d.route||'Unknown'}`)+'.docx';}
function rowToReport(r){return{
 date:r[0]||'',time:r[1]||'',inspector:r[2]||'',employee:r[3]||'',depot:r[4]||'',reportType:r[5]||'',details:r[6]||'',route:r[7]||'',bus:r[8]||'',reference:r[9]||'',
 checkedAt:r[10]||'',destination:r[11]||'',nature:r[12]||r[5]||'Driver Offence',passengers:r[13]||'',location:r[14]||r[4]||''
};}

function addCheckFields(){
 const reason=$('csDriverReason');
 if(!reason||$('csNatureOffence'))return;
 const box=document.createElement('div');box.className='grid';box.id='offenceExtraFields';box.innerHTML=`
  <input class="field" id="csNatureOffence" placeholder="Nature of offence (for offence report)">
  <input class="field" id="csPassengers" type="number" min="0" inputmode="numeric" placeholder="Number of passengers">
 `;
 reason.before(box);
}

function saveCheckSheetWithReportData(){
 const date=normaliseDateForSave($('csDate').value),savedTime=normaliseTimeForSave(now()),inspector=getInspector(),reportType=$('csDriverReport').value;
 const offenceRef=reportType==='Offence Report Submitted'&&typeof nextOffenceReference==='function'?nextOffenceReference(date,inspector):'';
 // offence-reference.js keeps nextOffenceReference private, so use the existing saver when unavailable.
 if(reportType==='Offence Report Submitted'&&!offenceRef){return window.__offenceBaseSave?window.__offenceBaseSave():null;}
 const nature=val('csNatureOffence'),passengers=val('csPassengers');
 const row=[date,savedTime,inspector,val('csDepot'),val('csDriver'),val('csService'),val('csFleet'),normaliseTimeForSave(val('csTimeOn')),val('csBoarding'),val('csDestination'),$('csNSA').value,$('csNSAFault').value,val('csNSANotes'),reportType,val('csDriverReason'),offenceRef,nature,passengers];
 cloudAppend('Inspections',row);
 cloudAppend('NSA Faults',[row[0],row[1],inspector,row[3],row[6],row[5],row[4],row[10],row[11],row[12],row[8],row[9],'Inspector Check Sheet']);
 if(reportType!=='No Driver Report'){
  const dr=[date,savedTime,inspector,row[4],row[3],reportType,row[14],row[5],row[6],offenceRef,row[8],row[9],nature,passengers,row[3]];
  cloudAppend('Driver Reports',dr);if(!cloud['Driver Reports'])cloud['Driver Reports']=[];cloud['Driver Reports'].push(dr);
 }
 if(!cloud['Inspections'])cloud['Inspections']=[];cloud['Inspections'].push(row);
 clearCheckForm();if($('csNatureOffence'))$('csNatureOffence').value='';if($('csPassengers'))$('csPassengers').value='';renderAll();if(offenceRef)alert('Offence reference allocated: '+offenceRef);setTimeout(loadCloud,1200);
}

function ensureModal(){
 if($('offenceReportModal'))return;
 const modal=document.createElement('div');modal.id='offenceReportModal';modal.style.cssText='display:none;position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:99999;overflow:auto;padding:16px;box-sizing:border-box';
 modal.innerHTML=`<div style="max-width:850px;margin:auto;background:#10283d;border:1px solid #53738d;border-radius:16px;padding:16px;color:white;box-shadow:0 18px 60px #000">
 <div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><h2 style="margin:0">Create Offence Report</h2><button class="btn danger" id="closeOffenceReport">CLOSE</button></div>
 <p class="small">Check or amend the details before creating the Word report.</p>
 <div class="grid">
  <input class="field" id="orReference" placeholder="Offence reference"><input class="field" id="orNature" placeholder="Nature of offence">
  <input class="field" id="orDate" placeholder="Date of offence"><input class="field" id="orEmployee" placeholder="Employee name">
  <input class="field" id="orDepot" placeholder="Depot"><input class="field" id="orRoute" placeholder="Route or route number">
  <input class="field" id="orBus" placeholder="Bus number"><input class="field" id="orCheckedAt" placeholder="Checked at">
  <input class="field" id="orTime" placeholder="Time"><input class="field" id="orPassengers" type="number" min="0" placeholder="Number of passengers">
  <input class="field" id="orInspector" placeholder="Inspector"><input class="field" id="orLocation" placeholder="Inspector location">
 </div>
 <textarea class="field" id="orDetails" style="min-height:220px" placeholder="Full details of offence"></textarea>
 <div class="grid" style="margin-top:12px">
  <button class="btn" id="downloadOffenceWord">DOWNLOAD WORD</button><button class="btn" id="saveOffenceOneDrive">SAVE TO ONEDRIVE</button>
  <button class="btn" id="printOffenceReport">PRINT / SAVE PDF</button><button class="btn" id="copyOffenceDetails">COPY DETAILS</button>
 </div><div id="offenceBuildStatus" class="status">Ready.</div></div>`;
 document.body.appendChild(modal);
 $('closeOffenceReport').onclick=()=>modal.style.display='none';
 $('downloadOffenceWord').onclick=()=>makeAndDownload(false);
 $('saveOffenceOneDrive').onclick=()=>makeAndDownload(true);
 $('printOffenceReport').onclick=printReport;
 $('copyOffenceDetails').onclick=copyDetails;
}
function setField(id,v){const e=$(id);if(e)e.value=v||'';}
function openReport(r){ensureModal();activeReport=rowToReport(r);setField('orReference',activeReport.reference);setField('orNature',activeReport.nature);setField('orDate',formatDateValue(activeReport.date));setField('orEmployee',activeReport.employee);setField('orDepot',activeReport.depot);setField('orRoute',activeReport.route);setField('orBus',activeReport.bus);setField('orCheckedAt',activeReport.checkedAt);setField('orTime',formatTimeValue(activeReport.time));setField('orPassengers',activeReport.passengers);setField('orInspector',activeReport.inspector);setField('orLocation',activeReport.location);setField('orDetails',activeReport.details);$('offenceBuildStatus').textContent='Ready.';$('offenceReportModal').style.display='block';}
function currentData(){return{reference:val('orReference'),nature:val('orNature'),date:val('orDate'),employee:val('orEmployee'),depot:val('orDepot'),route:val('orRoute'),bus:val('orBus'),checkedAt:val('orCheckedAt'),time:val('orTime'),passengers:val('orPassengers'),inspector:val('orInspector'),location:val('orLocation'),details:val('orDetails')};}
function loadDocx(){return new Promise((resolve,reject)=>{if(window.docx)return resolve(window.docx);const s=document.createElement('script');s.src=DOCX_CDN;s.onload=()=>window.docx?resolve(window.docx):reject(new Error('Word generator did not load'));s.onerror=()=>reject(new Error('Could not load Word generator'));document.head.appendChild(s);});}
function borders(docx){return{top:{style:docx.BorderStyle.SINGLE,size:4,color:'333333'},bottom:{style:docx.BorderStyle.SINGLE,size:4,color:'333333'},left:{style:docx.BorderStyle.SINGLE,size:4,color:'333333'},right:{style:docx.BorderStyle.SINGLE,size:4,color:'333333'},insideHorizontal:{style:docx.BorderStyle.SINGLE,size:4,color:'333333'},insideVertical:{style:docx.BorderStyle.SINGLE,size:4,color:'333333'}};}
function p(docx,text,bold=false,size=22){return new docx.Paragraph({children:[new docx.TextRun({text:String(text||''),bold,size,font:'Arial'})],spacing:{after:80}});}
function cell(docx,label,value,width){return new docx.TableCell({width:{size:width,type:docx.WidthType.PERCENTAGE},margins:{top:90,bottom:90,left:100,right:100},children:[new docx.Paragraph({children:[new docx.TextRun({text:label+' ',bold:true,size:19,font:'Arial'}),new docx.TextRun({text:String(value||''),size:19,font:'Arial'})]})]});}
async function buildDocx(d){
 const x=await loadDocx();const b=borders(x);
 const info=new x.Table({width:{size:100,type:x.WidthType.PERCENTAGE},borders:b,rows:[
  new x.TableRow({children:[cell(x,'Nature of Offence',d.nature,60),cell(x,'Date of Offence',d.date,40)]}),
  new x.TableRow({children:[cell(x,'Employee Name',d.employee,60),cell(x,'Depot',d.depot,40)]}),
  new x.TableRow({children:[cell(x,'Route or Route No',d.route,60),cell(x,'Bus No',d.bus,40)]}),
  new x.TableRow({children:[cell(x,'Checked at',d.checkedAt,45),cell(x,'Time',d.time,25),cell(x,'No of passengers',d.passengers,30)]})
 ]});
 const detailCell=new x.TableCell({margins:{top:140,bottom:140,left:140,right:140},children:[p(x,d.details,false,20),...Array(12).fill(0).map(()=>p(x,'',false,18))]});
 const detailsTable=new x.Table({width:{size:100,type:x.WidthType.PERCENTAGE},borders:b,rows:[new x.TableRow({height:{value:5600,rule:x.HeightRule.ATLEAST},children:[detailCell]})]});
 const signTable=new x.Table({width:{size:100,type:x.WidthType.PERCENTAGE},borders:b,rows:[new x.TableRow({children:[cell(x,'Signature','',34),cell(x,'Inspector',d.inspector,33),cell(x,'Location',d.location,33)]})]});
 const actionTable=new x.Table({width:{size:100,type:x.WidthType.PERCENTAGE},borders:b,rows:[new x.TableRow({children:[new x.TableCell({children:[p(x,'Final particulars of action taken and explanation given',true,20),...Array(7).fill(0).map(()=>p(x,''))]})]})]});
 const interviewTable=new x.Table({width:{size:100,type:x.WidthType.PERCENTAGE},borders:b,rows:[new x.TableRow({children:[new x.TableCell({children:[p(x,'I have been interviewed regarding the above and note the action shown in Part 3 above.',true,20),...Array(10).fill(0).map(()=>p(x,''))]})]}),new x.TableRow({children:[cell(x,'Date','',50),cell(x,'Signature','',50)]})]});
 const recordTable=new x.Table({width:{size:100,type:x.WidthType.PERCENTAGE},borders:b,rows:[new x.TableRow({children:[cell(x,'Date entered in Record Book','',50),cell(x,'Signature','',50)]})]});
 const doc=new x.Document({sections:[{properties:{page:{margin:{top:650,right:650,bottom:650,left:650}}},children:[
  p(x,'STAGECOACH',true,36),p(x,'STAGECOACH EAST SCOTLAND OFFENCE REPORT NO: '+d.reference,true,26),p(x,'Part 1',true,23),info,p(x,'FULL DETAILS OF OFFENCE',true,23),detailsTable,signTable,p(x,'Part 3',true,23),actionTable,
  new x.Paragraph({pageBreakBefore:true,children:[new x.TextRun({text:'STAGECOACH',bold:true,size:36,font:'Arial'})]}),p(x,'Part 4',true,23),interviewTable,p(x,'',false,20),recordTable,new x.Paragraph({alignment:x.AlignmentType.CENTER,spacing:{before:300},children:[new x.TextRun({text:'REPORT TO BE SUBMITTED IN DUPLICATE',bold:true,size:24,font:'Arial'})]})
 ]}]});
 return x.Packer.toBlob(doc);
}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2500);}
async function makeAndDownload(oneDrive){const d=currentData(),status=$('offenceBuildStatus');try{status.textContent='Creating Word report...';const blob=await buildDocx(d),name=fileName(d);generatedFile=new File([blob],name,{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});if(oneDrive&&navigator.share&&navigator.canShare&&navigator.canShare({files:[generatedFile]})){await navigator.share({title:'Offence Report',text:'Save this offence report to OneDrive.',files:[generatedFile]});status.textContent='Share menu opened — choose OneDrive.';}else{downloadBlob(blob,name);status.textContent=oneDrive?'Word report downloaded. Open OneDrive and upload it from Downloads.':'Word report downloaded.';if(oneDrive)setTimeout(()=>window.open('https://onedrive.live.com/','_blank'),500);}}catch(e){console.error(e);status.textContent='Could not create the Word report: '+e.message;alert(status.textContent);}}
function reportText(d){return `OFFENCE REPORT NO: ${d.reference}\nNature of Offence: ${d.nature}\nDate: ${d.date}\nEmployee: ${d.employee}\nDepot: ${d.depot}\nRoute: ${d.route}\nBus No: ${d.bus}\nChecked at: ${d.checkedAt}\nTime: ${d.time}\nPassengers: ${d.passengers}\nInspector: ${d.inspector}\nLocation: ${d.location}\n\nFULL DETAILS OF OFFENCE\n${d.details}`;}
async function copyDetails(){const text=reportText(currentData());try{await navigator.clipboard.writeText(text);$('offenceBuildStatus').textContent='Report details copied.';}catch(e){prompt('Copy the report details:',text);}}
function printReport(){const d=currentData(),w=window.open('','_blank');w.document.write(`<!doctype html><html><head><title>${h(d.reference)}</title><style>body{font-family:Arial;margin:28px;color:#111}h1{font-size:22px}table{width:100%;border-collapse:collapse}td{border:1px solid #333;padding:8px}.details{height:520px;vertical-align:top}.blank{height:180px;vertical-align:top}@media print{button{display:none}}</style></head><body><button onclick="print()">Print / Save PDF</button><h1>STAGECOACH EAST SCOTLAND OFFENCE REPORT NO: ${h(d.reference)}</h1><h2>Part 1</h2><table><tr><td><b>Nature of Offence</b> ${h(d.nature)}</td><td><b>Date of Offence</b> ${h(d.date)}</td></tr><tr><td><b>Employee Name</b> ${h(d.employee)}</td><td><b>Depot</b> ${h(d.depot)}</td></tr><tr><td><b>Route</b> ${h(d.route)}</td><td><b>Bus No</b> ${h(d.bus)}</td></tr><tr><td><b>Checked at</b> ${h(d.checkedAt)}</td><td><b>Time</b> ${h(d.time)} &nbsp; <b>Passengers</b> ${h(d.passengers)}</td></tr></table><h2>FULL DETAILS OF OFFENCE</h2><table><tr><td class="details">${h(d.details).replace(/\n/g,'<br>')}</td></tr><tr><td><b>Inspector:</b> ${h(d.inspector)} &nbsp;&nbsp; <b>Location:</b> ${h(d.location)}</td></tr></table><h2>Part 3</h2><table><tr><td class="blank"><b>Final particulars of action taken and explanation given</b></td></tr></table><div style="page-break-before:always"><h2>Part 4</h2><table><tr><td class="blank"><b>I have been interviewed regarding the above and note the action shown in Part 3 above.</b></td></tr><tr><td>Date: __________________ Signature: __________________</td></tr></table><br><table><tr><td>Date entered in Record Book: __________________</td><td>Signature: __________________</td></tr></table><h2 style="text-align:center">REPORT TO BE SUBMITTED IN DUPLICATE</h2></div></body></html>`);w.document.close();}

function renderDriverReportsWithButtons(){
 const el=$('driverReportsList');if(!el)return;const rows=(cloud['Driver Reports']||[]).slice(1).reverse();el.innerHTML=rows.map((r,i)=>{const offence=r[5]==='Offence Report Submitted'||r[9];return `<div class="row" style="display:block"><div><b>${h(r[9]||r[0]||'-')}</b><br><span class="small">${h(formatDateValue(r[0]))} ${h(formatTimeValue(r[1]))}</span></div><div>${h(r[3]||'-')} • ${h(r[4]||'-')}</div><div>${h(r[5]||'-')} • ${h(r[7]||'-')} • Fleet ${h(r[8]||'-')}${r[6]?'<br><span class="small">'+h(r[6])+'</span>':''}</div>${offence?`<button class="btn createOffenceWord" data-report-index="${rows.length-1-i}" style="margin-top:8px">CREATE WORD REPORT</button>`:''}</div>`;}).join('')||'No driver reports.';
}

const oldRenderCloud=window.renderCloudTable;window.renderCloudTable=function(sheet,el){if(sheet==='Driver Reports')return renderDriverReportsWithButtons();return oldRenderCloud(sheet,el);};
document.addEventListener('click',e=>{const b=e.target.closest('.createOffenceWord');if(!b)return;const rows=(cloud['Driver Reports']||[]).slice(1);const r=rows[Number(b.dataset.reportIndex)];if(r)openReport(r);});
window.addEventListener('load',()=>{addCheckFields();ensureModal();window.__offenceBaseSave=window.saveCheckSheet;const btn=$('saveCheckSheetBtn');if(btn)btn.onclick=window.saveCheckSheet;});
})();