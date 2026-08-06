(function(){
'use strict';
const LOGO='https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/StagecoachGroup.svg/500px-StagecoachGroup.svg.png';
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
function textLines(card){const d=card.querySelector('.compactDetails');if(!d)return[];const c=d.cloneNode(true);c.querySelectorAll('br').forEach(x=>x.replaceWith('\n'));return c.textContent.split('\n').map(clean).filter(Boolean);}
function strip(v,labels){let s=clean(v);labels.forEach(l=>s=s.replace(new RegExp('^'+l+'\\s*:\\s*','i'),''));return clean(s)||'-';}
function splitJourney(v){const s=strip(v,['Journey']);const p=s.split(/\s+(?:to|→)\s+/i);return{from:clean(p[0])||'-',to:clean(p.slice(1).join(' to '))||'-'};}
function parse(card){
 const l=textLines(card),journey=splitJourney(l[7]||'');
 const all=clean(l.slice(10).join(' '));
 const issueMatches=[...all.matchAll(/Vehicle issue\s*:\s*([^]*?)(?=Vehicle comments\s*:|$)/ig)];
 const commentMatches=[...all.matchAll(/Vehicle comments\s*:\s*([^]*?)(?=Vehicle issue\s*:|$)/ig)];
 const vehicleIssue=clean(issueMatches.at(-1)?.[1])||'-';
 let vehicleComments=clean(commentMatches.at(-1)?.[1])||'-';
 let driverNotes=all
  .replace(/Vehicle issue\s*:\s*[^]*?(?=Vehicle comments\s*:|$)/ig,' ')
  .replace(/Vehicle comments\s*:\s*[^]*?(?=Vehicle issue\s*:|$)/ig,' ');
 if(vehicleComments!=='-'){
  const marker=vehicleComments.match(/(Driver advised[^]*?)$/i);
  if(marker){driverNotes=clean(driverNotes+' '+marker[1]);vehicleComments=clean(vehicleComments.slice(0,vehicleComments.length-marker[1].length));}
 }
 driverNotes=clean(driverNotes.replace(/^(?:-|None|N\/A)$/i,''))||'-';
 vehicleComments=clean(vehicleComments.replace(/Driver advised[^]*$/i,''))||'-';
 const dt=clean(l[0]).match(/^(.*?)(?:\s+)(\d{1,2}:\d{2})$/);
 const nsa=strip(l[8]||'',['NSA']);
 return{date:dt?dt[1]:strip(l[0]||'',['Date']),savedTime:dt?dt[2]:'-',inspector:strip(l[1],['Inspector']),depot:strip(l[2],['Depot']),driver:strip(l[3],['Driver']),service:strip(l[4],['Service']),fleet:strip(l[5],['Fleet','Fleet Number']),time:strip(l[6],['Time Checked','Time boarded']),from:journey.from,to:journey.to,nsa:nsa.split(/\s+-\s+/)[0]||'-',nsaDetails:nsa.split(/\s+-\s+/).slice(1).join(' - ')||(nsa==='Yes'?'Fully Working':'-'),outcome:strip(l[9],['Driver Report']),driverNotes,vehicleIssue,vehicleComments};
}
function load(src,id){return new Promise((ok,no)=>{if(document.getElementById(id))return ok();const s=document.createElement('script');s.id=id;s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s);});}
async function img(url){try{const b=await(await fetch(url,{mode:'cors'})).blob();return await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.onerror=()=>r(null);f.readAsDataURL(b);});}catch(e){return null;}}
async function pdf(d){
 await load('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js','generalReportPdf');
 const{jsPDF}=window.jspdf,p=new jsPDF({unit:'pt',format:'a4'}),W=p.internal.pageSize.width,H=p.internal.pageSize.height,M=38,C={navy:[11,48,70],orange:[244,174,48],grey:[241,244,246],text:[28,43,55],muted:[91,108,121]};let y=34;
 const fill=c=>p.setFillColor(...c),colour=c=>p.setTextColor(...c);
 function footer(){fill(C.navy);p.rect(0,H-28,W,28,'F');colour([255,255,255]);p.setFontSize(7);p.text('Inspector Hub • General Inspection Report',M,H-11);p.text('Designed & Developed by Michael Skinner',W-M,H-11,{align:'right'});}
 function page(h=0){if(y+h>H-48){footer();p.addPage();y=34;}}
 function heading(t){page(34);fill(C.navy);p.roundedRect(M,y,W-M*2,28,4,4,'F');fill(C.orange);p.rect(M,y,7,28,'F');colour([255,255,255]);p.setFont('helvetica','bold');p.setFontSize(12);p.text(t.toUpperCase(),M+17,y+18);y+=38;}
 function pair(label,value){page(28);colour(C.muted);p.setFont('helvetica','bold');p.setFontSize(8);p.text(label.toUpperCase(),M,y);colour(C.text);p.setFont('helvetica','normal');p.setFontSize(10.5);const lines=p.splitTextToSize(String(value||'-'),W-M*2-135);p.text(lines,M+135,y);y+=Math.max(22,lines.length*13+8);}
 function narrative(title,value){if(!value||value==='-')return;heading(title);const lines=p.splitTextToSize(value,W-M*2-24),h=lines.length*14+28;page(h);fill(C.grey);p.roundedRect(M,y,W-M*2,h,5,5,'F');colour(C.text);p.setFont('helvetica','normal');p.setFontSize(10.5);p.text(lines,M+12,y+20);y+=h+12;}
 fill([255,255,255]);p.rect(0,0,W,H,'F');const logo=await img(LOGO);if(logo)try{p.addImage(logo,'PNG',M,y,135,36);}catch(e){}colour(C.navy);p.setFont('helvetica','bold');p.setFontSize(21);p.text('GENERAL INSPECTION REPORT',W-M,y+22,{align:'right'});y+=55;fill(C.orange);p.rect(M,y,W-M*2,3,'F');y+=20;
 heading('Inspection Overview');pair('Date',d.date);pair('Time checked',d.time);pair('Inspector',d.inspector);pair('Driver',d.driver);pair('Depot',d.depot);pair('Fleet number',d.fleet);
 heading('Journey');pair('Service',d.service);pair('Boarding point',d.from);pair('Destination',d.to);
 heading('Outcome');pair('Driver outcome',d.outcome);pair('NSA working',d.nsa);pair('NSA details',d.nsaDetails);
 narrative('Driver Report / Inspection Notes',d.driverNotes);
 if(d.vehicleIssue!=='-'||d.vehicleComments!=='-'){heading('Vehicle Fault');pair('Fault type',d.vehicleIssue);pair('Fault comments',d.vehicleComments);}
 heading('Report Sign-off');pair('Report generated',new Date().toLocaleString('en-GB'));pair('Generated by',d.inspector);
 footer();p.setProperties({title:'General Inspection Report',author:d.inspector});return p.output('arraybuffer');
}
async function share(card,btn){btn.disabled=true;btn.textContent='CREATING REPORT…';try{const d=parse(card),bytes=await pdf(d),name=('General-Inspection-Report-'+d.service+'-'+d.fleet).replace(/[^a-z0-9-]+/gi,'-')+'.pdf',file=new File([bytes],name,{type:'application/pdf'});if(navigator.canShare&&navigator.canShare({files:[file]}))await navigator.share({files:[file]});else{const u=URL.createObjectURL(file),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000);}}catch(e){if(e?.name!=='AbortError')alert('The report could not be created. Please try again.');}finally{btn.disabled=false;btn.textContent='SEND REPORT';}}
function decorate(){document.querySelectorAll('#checkList .compactCheck').forEach(card=>{card.querySelectorAll('.savedCheckShareBtn').forEach(b=>b.remove());if(card.querySelector('.generalReportBtn'))return;const b=document.createElement('button');b.type='button';b.className='savedCheckShareBtn generalReportBtn';b.textContent='SEND REPORT';b.onclick=e=>{e.preventDefault();e.stopPropagation();share(card,b);};(card.querySelector('.compactTop')||card).appendChild(b);});}
function init(){decorate();const list=document.getElementById('checkList');if(list)new MutationObserver(()=>requestAnimationFrame(decorate)).observe(list,{childList:true,subtree:true});setInterval(decorate,2000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();