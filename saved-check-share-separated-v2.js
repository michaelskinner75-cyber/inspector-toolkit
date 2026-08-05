(function(){
'use strict';
const LOGO='https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/StagecoachGroup.svg/500px-StagecoachGroup.svg.png';
const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
function textLines(node){if(!node)return[];const c=node.cloneNode(true);c.querySelectorAll('br').forEach(br=>br.replaceWith('\n'));return c.textContent.split('\n').map(v=>v.trim()).filter(Boolean);}
function strip(v,labels){let s=String(v||'-').trim();labels.forEach(l=>s=s.replace(new RegExp('^'+l+'\\s*:\\s*','i'),'').trim());return s||'-';}
function parseJourney(v){const p=strip(v,['Journey']).split(/\s+(?:to|→)\s+/i);return{boarding:(p[0]||'-').trim(),destination:(p.slice(1).join(' to ')||'-').trim()};}
function splitDateTime(v){const s=String(v||'-').trim(),m=s.match(/^(.*?)(?:\s+)(\d{1,2}:\d{2})$/);return m?{date:m[1],time:m[2]}:{date:s,time:'-'};}
function escapeRe(s){return String(s||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function parseCard(card){
 const details=card.querySelector('.compactDetails');
 const allDesc=[...(details?details.querySelectorAll('*'):[])];
 const faultBox=allDesc.filter(el=>{const t=clean(el.textContent);return /vehicle issue\s*:/i.test(t)&&/vehicle comments?\s*:/i.test(t);}).sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0]||null;
 const faultText=clean(faultBox&&faultBox.textContent);
 const issue=(faultText.match(/vehicle issue\s*:\s*(.*?)(?=vehicle comments?\s*:|$)/i)||[])[1]||'';
 const comments=(faultText.match(/vehicle comments?\s*:\s*([\s\S]*)$/i)||[])[1]||'';
 const clone=details?details.cloneNode(true):null;
 if(clone&&faultBox){const candidates=[...clone.querySelectorAll('*')];const matching=candidates.filter(el=>clean(el.textContent)===faultText).sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0];if(matching)matching.remove();}
 const x=textLines(clone),journey=parseJourney(x[7]),nsaRaw=strip(x[8],['NSA']),nsaParts=nsaRaw.split(/\s+-\s+/),dt=splitDateTime(strip(x[0],['Inspection date/time','Date']));
 let reason=x.slice(10).join('\n').trim();
 if(issue&&comments){
  const prefix=new RegExp('^\\s*vehicle issue\\s*:\\s*'+escapeRe(issue)+'\\s*vehicle comments?\\s*:\\s*'+escapeRe(comments)+'\\s*','i');
  reason=reason.replace(prefix,'').trim();
 }
 if(faultText)reason=reason.replace(new RegExp(escapeRe(faultText)+'\\s*$','i'),'').trim();
 reason=reason.replace(/^vehicle issue\s*:[\s\S]*?vehicle comments?\s*:\s*/i,'').trim();
 return{date:dt.date,inspector:strip(x[1],['Inspector']),depot:strip(x[2],['Depot']),driver:strip(x[3],['Driver']),service:strip(x[4],['Service']),fleet:strip(x[5],['Fleet Number','Fleet']),timeChecked:strip(x[6],['Time Checked','Time boarded']),boarding:journey.boarding,destination:journey.destination,nsa:strip(nsaParts[0],['NSA Working']),nsaDetails:strip(nsaParts.slice(1).join(' - ')||((nsaParts[0]||'')==='Yes'?'Fully Working':'-'),['Details']),driverReport:strip(x[9],['Driver Report']),reason:reason||'-',vehicleIssue:issue||'-',vehicleComments:comments||'-'};
}
function loadScript(src,id){return new Promise((res,rej)=>{if(document.getElementById(id))return res();const s=document.createElement('script');s.id=id;s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
async function imageData(url){try{const r=await fetch(url,{mode:'cors'}),b=await r.blob();return await new Promise(ok=>{const f=new FileReader();f.onload=()=>ok(f.result);f.onerror=()=>ok(null);f.readAsDataURL(b);});}catch(e){return null;}}
async function makePdf(d){
 await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js','reportJsPdf');
 const{jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'portrait',unit:'pt',format:'a4',compress:true}),W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight();
 const C={white:[255,255,255],navy:[11,48,70],orange:[246,169,35],text:[21,40,55],label:[60,83,102],light:[243,246,248],line:[216,224,230]};
 const margin=16,left=34,right=W-34,cw=right-left;let y=16;
 const fill=c=>pdf.setFillColor(...c),colour=c=>pdf.setTextColor(...c);
 function footer(){fill(C.navy);pdf.rect(margin,H-28,W-margin*2,20,'F');colour([215,227,234]);pdf.setFont('helvetica','normal');pdf.setFontSize(7);pdf.text('Stagecoach South Scotland',left,H-15);pdf.text('Designed & Developed by Michael Skinner',right,H-15,{align:'right'});}
 function newPage(){footer();pdf.addPage();fill(C.white);pdf.rect(0,0,W,H,'F');y=24;}
 function ensure(h){if(y+h>H-42)newPage();}
 function section(t){ensure(34);fill(C.navy);pdf.rect(left,y,cw,28,'F');fill(C.orange);pdf.rect(left,y,6,28,'F');colour(C.white);pdf.setFont('helvetica','bold');pdf.setFontSize(14);pdf.text(t.toUpperCase(),left+15,y+19);y+=28;}
 function row(label,value){const lw=190;pdf.setFont('helvetica','normal');pdf.setFontSize(11);const lines=pdf.splitTextToSize(String(value||'-'),cw-lw-22),h=Math.max(31,14+lines.length*13);ensure(h);fill(C.light);pdf.rect(left,y,lw,h,'F');fill(C.white);pdf.rect(left+lw,y,cw-lw,h,'F');pdf.setDrawColor(...C.line);pdf.rect(left,y,cw,h,'S');pdf.line(left+lw,y,left+lw,y+h);colour(C.label);pdf.setFont('helvetica','bold');pdf.setFontSize(10.5);pdf.text(label,left+10,y+19);colour(C.text);pdf.setFont('helvetica','normal');pdf.setFontSize(11);pdf.text(lines,left+lw+10,y+19);y+=h;}
 fill(C.white);pdf.rect(0,0,W,H,'F');const logo=await imageData(LOGO);fill(C.white);pdf.rect(margin,y,W-margin*2,66,'F');if(logo){try{pdf.addImage(logo,'PNG',left+4,y+10,142,38);}catch(e){}}colour(C.navy);pdf.setFont('helvetica','bold');pdf.setFontSize(9);pdf.text('STAGECOACH SOUTH SCOTLAND',right-2,y+30,{align:'right'});y+=66;
 fill(C.navy);pdf.rect(margin,y,W-margin*2,58,'F');fill(C.orange);pdf.rect(margin,y+55,W-margin*2,3,'F');colour(C.white);pdf.setFont('helvetica','bold');pdf.setFontSize(18);pdf.text('INSPECTOR CHECK SHEET / REPORT RECORD',left,y+35);y+=72;
 section('Inspection Details');row('Date',d.date);row('Time Checked',d.timeChecked);row('Driver',d.driver);row('Depot',d.depot);row('Fleet Number',d.fleet);y+=14;
 section('Journey Details');row('Service',d.service);row('Boarding point',d.boarding);row('Destination',d.destination);y+=14;
 section('NSA');row('NSA Working',d.nsa);row('Details',d.nsaDetails);y+=14;
 section('Driver Report');row('Driver Report',d.driverReport);row('Driver report reason / inspection notes',d.reason);y+=14;
 if(d.vehicleIssue!=='-'||d.vehicleComments!=='-'){section('Vehicle Faults');row('Vehicle issue',d.vehicleIssue);row('Vehicle comments',d.vehicleComments);}
 footer();const name=('Inspection-Report-Service-'+d.service+'-Fleet-'+d.fleet).replace(/[^a-z0-9]+/gi,'-')+'.pdf';return{bytes:pdf.output('arraybuffer'),name};
}
async function share(card,btn){btn.disabled=true;btn.textContent='CREATING PDF…';try{const d=parseCard(card),r=await makePdf(d),file=new File([r.bytes],r.name,{type:'application/pdf',lastModified:Date.now()});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file]});}else{const u=URL.createObjectURL(file),a=document.createElement('a');a.href=u;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000);}}catch(e){if(e&&e.name!=='AbortError')alert('The PDF could not be shared. Please try again.');}finally{btn.disabled=false;btn.textContent='SEND REPORT';}}
function decorate(){document.querySelectorAll('#checkList .compactCheck').forEach(card=>{const old=card.querySelector('.savedCheckShareBtn');if(!old||old.dataset.separatedV2)return;const btn=old.cloneNode(true);btn.dataset.separatedV2='1';old.replaceWith(btn);btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();share(card,btn);});});}
function init(){decorate();const list=document.getElementById('checkList');if(list)new MutationObserver(()=>requestAnimationFrame(decorate)).observe(list,{childList:true,subtree:true});setInterval(decorate,1500);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();