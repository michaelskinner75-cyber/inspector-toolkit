(function(){
'use strict';
const LOGO='https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/StagecoachGroup.svg/500px-StagecoachGroup.svg.png';
function linesFromCard(card){const details=card.querySelector('.compactDetails');if(!details)return[];const clone=details.cloneNode(true);clone.querySelectorAll('br').forEach(br=>br.replaceWith('\n'));return clone.textContent.split('\n').map(v=>v.trim()).filter(Boolean);}
function strip(value,labels){let out=String(value||'-').trim();for(const label of labels)out=out.replace(new RegExp('^'+label+'\\s*:\\s*','i'),'').trim();return out||'-';}
function parseJourney(text){const clean=strip(text,['Journey']);const parts=clean.split(/\s+(?:to|→)\s+/i);return{boarding:(parts[0]||'-').trim(),destination:(parts.slice(1).join(' to ')||'-').trim()};}
function splitDateTime(value){const s=String(value||'-').trim();const m=s.match(/^(.*?)(?:\s+)(\d{1,2}:\d{2})$/);return m?{date:m[1],time:m[2]}:{date:s,time:'-'};}
function labelled(lines,labels){
 for(const line of lines){
  const raw=String(line||'').trim();
  const lower=raw.toLowerCase();
  for(const label of labels){
   const prefix=String(label||'').trim().toLowerCase()+':';
   if(lower.startsWith(prefix))return raw.slice(raw.indexOf(':')+1).trim();
  }
 }
 return'';
}
function formatSavedDate(v){try{return typeof formatDateValue==='function'?formatDateValue(v):String(v||'-');}catch(e){return String(v||'-');}}
function formatSavedTime(v){try{return typeof formatTimeValue==='function'?formatTimeValue(v):String(v||'-');}catch(e){return String(v||'-');}}
function inspectionRows(){
 const rows=[];
 try{if(typeof cloud!=='undefined'&&cloud&&Array.isArray(cloud['Inspections']))rows.push(...cloud['Inspections']);}catch(e){}
 try{const local=JSON.parse(localStorage.getItem('local_Inspections')||'[]');if(Array.isArray(local))rows.push(...local);}catch(e){}
 return rows.filter(Array.isArray);
}
function rowByReference(ref){
 const wanted=String(ref||'').trim().toLowerCase();
 if(!wanted)return null;
 return inspectionRows().find(r=>String(r[15]||'').trim().toLowerCase()===wanted)||null;
}
function reportFromRow(r){
 const nsaDetails=[r[11],r[12]].map(v=>String(v||'').trim()).filter(Boolean).join(' - ')||((String(r[10]||'').trim()==='Yes')?'Fully Working':'-');
 return{
  date:formatSavedDate(r[0]),savedTime:formatSavedTime(r[1]),inspector:String(r[2]||'-').trim()||'-',
  depot:String(r[3]||'-').trim()||'-',driver:String(r[4]||'-').trim()||'-',service:String(r[5]||'-').trim()||'-',
  fleet:String(r[6]||'-').trim()||'-',timeChecked:formatSavedTime(r[7]),boarding:String(r[8]||'-').trim()||'-',
  destination:String(r[9]||'-').trim()||'-',nsa:String(r[10]||'-').trim()||'-',nsaDetails,
  driverReport:String(r[13]||'-').trim()||'-',reason:String(r[14]||'-').trim()||'-',
  offenceRef:String(r[15]||'').trim(),nature:String(r[16]||'').trim(),passengers:String(r[17]||'').trim()
 };
}
function reportFromCard(card){
 const x=linesFromCard(card);
 const offenceRef=labelled(x,['Offence Reference']);
 const saved=rowByReference(offenceRef);
 if(saved)return reportFromRow(saved);

 const dateLine=x.find(v=>/^\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}\b/.test(v)||/^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}\b/.test(v))||x[0]||'-';
 const dateIndex=Math.max(0,x.indexOf(dateLine));
 const dt=splitDateTime(strip(dateLine,['Inspection date/time','Date']));
 const val=(labels,offset)=>labelled(x,labels)||strip(x[dateIndex+offset],labels);

 const journey=parseJourney(val(['Journey'],7));
 const nsaRaw=val(['NSA'],8);
 const nsaParts=nsaRaw.split(/\s+-\s+/);
 const reportIndex=x.findIndex(v=>String(v||'').trim().toLowerCase().startsWith('driver report:'));

 let reason=labelled(x,['Driver report reason / inspection notes','Reason','Notes']);
 if(!reason&&reportIndex>=0){
  reason=x.slice(reportIndex+1).filter(v=>{
   const s=String(v||'').trim().toLowerCase();
   return !['offence reference:','nature of offence:','passengers:','inspector:','depot:','driver:','service:','fleet:','fleet number:','time checked:','time boarded:','journey:','nsa:','driver report:'].some(p=>s.startsWith(p));
  }).join('\n').trim();
 }
 if(!reason)reason=strip(x[dateIndex+10],['Driver report reason / inspection notes','Reason','Notes']);

 return{
  date:dt.date,savedTime:dt.time,inspector:val(['Inspector'],1),depot:val(['Depot'],2),driver:val(['Driver'],3),
  service:val(['Service'],4),fleet:val(['Fleet Number','Fleet'],5),timeChecked:val(['Time Checked','Time boarded'],6),
  boarding:journey.boarding,destination:journey.destination,nsa:strip(nsaParts[0],['NSA Working']),
  nsaDetails:strip(nsaParts.slice(1).join(' - ')||((nsaParts[0]||'')==='Yes'?'Fully Working':'-'),['Details']),
  driverReport:labelled(x,['Driver Report'])||val(['Driver Report'],9),reason:reason||'-',offenceRef,
  nature:labelled(x,['Nature of Offence']),passengers:labelled(x,['Passengers'])
 };
}
function title(d){return'Inspection-Report'+(d.service&&d.service!=='-'?'-Service-'+d.service:'')+(d.fleet&&d.fleet!=='-'?'-Fleet-'+d.fleet:'');}
function loadScript(src,id){return new Promise((resolve,reject)=>{if(document.getElementById(id))return resolve();const s=document.createElement('script');s.id=id;s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
async function imageData(url){try{const res=await fetch(url,{mode:'cors'});const blob=await res.blob();return await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>resolve(null);r.readAsDataURL(blob);});}catch(e){return null;}}
async function makePdf(d,name){
 await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js','reportJsPdf');
 const{jsPDF}=window.jspdf;const pdf=new jsPDF({orientation:'portrait',unit:'pt',format:'a4',compress:true});const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight();
 const C={white:[255,255,255],navy:[11,48,70],orange:[246,169,35],text:[21,40,55],label:[60,83,102],light:[243,246,248],line:[216,224,230]};
 const margin=16,left=34,right=W-34,contentW=right-left;let y=16;
 const fill=c=>pdf.setFillColor(c[0],c[1],c[2]);const colour=c=>pdf.setTextColor(c[0],c[1],c[2]);
 function footer(){fill(C.navy);pdf.rect(margin,H-28,W-margin*2,20,'F');colour([215,227,234]);pdf.setFont('helvetica','normal');pdf.setFontSize(7);pdf.text('Stagecoach South Scotland',left,H-15);pdf.text('Designed & Developed by Michael Skinner',right,H-15,{align:'right'});}
 function newPage(){footer();pdf.addPage();fill(C.white);pdf.rect(0,0,W,H,'F');y=24;}
 function ensure(h){if(y+h>H-42)newPage();}
 function sectionTitle(text){ensure(34);fill(C.navy);pdf.rect(left,y,contentW,28,'F');fill(C.orange);pdf.rect(left,y,6,28,'F');colour(C.white);pdf.setFont('helvetica','bold');pdf.setFontSize(14);pdf.text(text.toUpperCase(),left+15,y+19);y+=28;}
 function tableRow(label,value){const labelW=190;pdf.setFont('helvetica','normal');pdf.setFontSize(11);const lines=pdf.splitTextToSize(String(value||'-'),contentW-labelW-22);const h=Math.max(31,14+lines.length*13);ensure(h);fill(C.light);pdf.rect(left,y,labelW,h,'F');fill(C.white);pdf.rect(left+labelW,y,contentW-labelW,h,'F');pdf.setDrawColor(C.line[0],C.line[1],C.line[2]);pdf.rect(left,y,contentW,h,'S');pdf.line(left+labelW,y,left+labelW,y+h);colour(C.label);pdf.setFont('helvetica','bold');pdf.setFontSize(10.5);pdf.text(String(label),left+10,y+19);colour(C.text);pdf.setFont('helvetica','normal');pdf.setFontSize(11);pdf.text(lines,left+labelW+10,y+19);y+=h;}
 fill(C.white);pdf.rect(0,0,W,H,'F');
 const logo=await imageData(LOGO);fill(C.white);pdf.rect(margin,y,W-margin*2,66,'F');if(logo){try{pdf.addImage(logo,'PNG',left+4,y+10,142,38);}catch(e){}}else{colour(C.navy);pdf.setFont('helvetica','bold');pdf.setFontSize(18);pdf.text('Stagecoach',left+4,y+34);}colour(C.navy);pdf.setFont('helvetica','bold');pdf.setFontSize(9);pdf.text('STAGECOACH SOUTH SCOTLAND',right-2,y+30,{align:'right'});y+=66;
 fill(C.navy);pdf.rect(margin,y,W-margin*2,58,'F');fill(C.orange);pdf.rect(margin,y+55,W-margin*2,3,'F');colour(C.white);pdf.setFont('helvetica','bold');pdf.setFontSize(18);pdf.text('INSPECTOR CHECK SHEET / REPORT RECORD',left,y+35);y+=58;
 const created=new Date();const metaH=46,metaW=(W-margin*2)/3;fill(C.light);pdf.rect(margin,y,W-margin*2,metaH,'F');pdf.setDrawColor(C.line[0],C.line[1],C.line[2]);pdf.rect(margin,y,W-margin*2,metaH,'S');pdf.line(margin+metaW,y,margin+metaW,y+metaH);pdf.line(margin+metaW*2,y,margin+metaW*2,y+metaH);
 const meta=[['INSPECTOR',d.inspector],['REPORT CREATED',created.toLocaleDateString('en-GB')],['TIME',created.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})]];meta.forEach((m,i)=>{const x=margin+i*metaW+14;colour([101,119,133]);pdf.setFont('helvetica','normal');pdf.setFontSize(7.5);pdf.text(m[0],x,y+15);colour(C.text);pdf.setFont('helvetica','bold');pdf.setFontSize(10.5);pdf.text(String(m[1]||'-'),x,y+31);});y+=60;
 sectionTitle('Inspection Details');tableRow('Date',d.date);tableRow('Time Checked',d.timeChecked);tableRow('Driver',d.driver);tableRow('Depot',d.depot);tableRow('Fleet Number',d.fleet);y+=14;
 sectionTitle('Journey Details');tableRow('Service',d.service);tableRow('Boarding point',d.boarding);tableRow('Destination',d.destination);y+=14;
 sectionTitle('NSA');tableRow('NSA Working',d.nsa);tableRow('Details',d.nsaDetails);y+=14;
 sectionTitle('Driver');tableRow('Driver Report',d.driverReport);
 const isOffence=/offence/i.test(String(d.driverReport||''))||d.offenceRef||d.nature||d.passengers;
 if(isOffence){
  y+=14;sectionTitle('Offence Details');
  if(d.offenceRef)tableRow('Offence Reference',d.offenceRef);
  if(d.nature)tableRow('Nature of Offence',d.nature);
  if(d.passengers)tableRow('Passengers',d.passengers);
  tableRow('Inspector offence details / notes',d.reason);
 }else{
  tableRow('Driver report reason / inspection notes',d.reason);
 }
 footer();pdf.setProperties({title:name,subject:'Inspector Check Sheet / Report Record',author:'Stagecoach South Scotland'});
 const bytes=pdf.output('arraybuffer');const safe=name.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'Inspection-Report';return{bytes,name:safe+'.pdf'};
}
async function share(card){const d=reportFromCard(card),name=title(d),btn=card.querySelector('.savedCheckShareBtn');if(btn){btn.disabled=true;btn.textContent='CREATING PDF…';}try{const result=await makePdf(d,name);const attachment=new File([result.bytes],result.name,{type:'application/octet-stream',lastModified:Date.now()});if(navigator.canShare&&navigator.canShare({files:[attachment]})){await navigator.share({files:[attachment]});return;}const pdfFile=new File([result.bytes],result.name,{type:'application/pdf',lastModified:Date.now()});const url=URL.createObjectURL(pdfFile),a=document.createElement('a');a.href=url;a.download=pdfFile.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}catch(e){if(e&&e.name==='AbortError')return;alert('The PDF could not be shared. Please try again.');}finally{if(btn){btn.disabled=false;btn.textContent='SEND REPORT';}}}
function decorate(){document.querySelectorAll('#checkList .compactCheck').forEach(card=>{if(card.querySelector('.savedCheckShareBtn'))return;const btn=document.createElement('button');btn.type='button';btn.className='savedCheckShareBtn';btn.textContent='SEND REPORT';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();share(card);});const top=card.querySelector('.compactTop');(top||card).appendChild(btn);});}
function removeLive(){const c=document.getElementById('checksheetShareControls');if(c)c.remove();}
function style(){if(document.getElementById('savedCheckShareCss'))return;const s=document.createElement('style');s.id='savedCheckShareCss';s.textContent='.compactTop{position:relative;padding-bottom:46px!important}.savedCheckShareBtn{position:absolute;right:12px;bottom:8px;border:1px solid #f4b23f;border-radius:9px;background:#f3aa35;color:#07131e;font-weight:800;font-size:12px;padding:8px 12px;z-index:3}.savedCheckShareBtn:disabled{opacity:.7}.savedCheckShareBtn:active{transform:scale(.98)}';document.head.appendChild(s);}
function init(){style();decorate();removeLive();const list=document.getElementById('checkList');if(list)new MutationObserver(()=>requestAnimationFrame(decorate)).observe(list,{childList:true,subtree:true});const observer=new MutationObserver(removeLive);observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),10000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();