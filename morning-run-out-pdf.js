(function(){
'use strict';
const $=id=>document.getElementById(id);
const LOGO='https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/StagecoachGroup.svg/500px-StagecoachGroup.svg.png';
function norm(v){return String(v??'').trim().toLowerCase().replace(/\s+/g,' ');}
function mins(v){const m=String(v||'').match(/^(\d{1,2}):(\d{2})/);return m?+m[1]*60 + +m[2]:null;}
function diff(s,a){const x=mins(s),y=mins(a);if(x===null||y===null)return null;let d=y-x;if(d<-720)d+=1440;if(d>720)d-=1440;return d;}
function timing(d){if(d===null)return '-';if(d<0)return `${-d} min early`;if(!d)return 'On time';if(d<6)return `${d} min late - within tolerance`;return `${d} min late`;}
function toIso(v){const s=String(v||'').trim(),a=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(a)return s;const b=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);if(b)return `${b[3].length===2?'20'+b[3]:b[3]}-${String(b[2]).padStart(2,'0')}-${String(b[1]).padStart(2,'0')}`;return '';}
function uk(v){const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(v||'-');}
function nsa(v){const x=norm(v);if(x==='working')return 'Working';if(x==='not working')return 'Not Working';if(x==='n/a'||x==='na')return 'N/A';return 'Not Checked';}
function key(r){return [toIso(r[0]),r[1],r[2],r[3],r[5],r[8],r[9]].map(norm).join('|');}
function localRows(){try{const x=JSON.parse(localStorage.getItem('local_Morning Run Out')||'[]');return Array.isArray(x)?x:[];}catch(e){return [];}}
function reportRows(){
 let remote=[];try{if(typeof cloud!=='undefined'&&Array.isArray(cloud['Morning Run Out']))remote=cloud['Morning Run Out'];}catch(e){}
 if(remote.length&&norm(remote[0]?.[3])==='duty number')remote=remote.slice(1);
 const map=new Map();[...localRows(),...remote].forEach(r=>{if(Array.isArray(r)&&r[0]&&r[3])map.set(key(r),r);});
 const date=$('mroDate')?.value||'';
 return [...map.values()].filter(r=>toIso(r[0])===date).sort((a,b)=>((mins(a[8])??9999)-(mins(b[8])??9999))||((mins(a[1])??9999)-(mins(b[1])??9999)));
}
function loadScript(src,id){return new Promise((resolve,reject)=>{if(document.getElementById(id))return resolve();const s=document.createElement('script');s.id=id;s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
async function imageData(url){try{const res=await fetch(url,{mode:'cors'});const blob=await res.blob();return await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>resolve(null);r.readAsDataURL(blob);});}catch(e){return null;}}
async function createPdf(){
 const rows=reportRows();if(!rows.length){alert('There are no Morning Run Out entries for this date.');return;}
 const btn=$('mroPdf');if(btn){btn.disabled=true;btn.textContent='CREATING PDF...';}
 try{
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js','mroJsPdf');
  const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'landscape',unit:'pt',format:'a4',compress:true});
  const W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),left=28,right=W-28,contentW=right-left;
  const C={navy:[11,48,70],orange:[246,169,35],text:[21,40,55],muted:[90,108,122],light:[243,246,248],line:[216,224,230],white:[255,255,255],green:[28,112,73],amber:[177,119,24],red:[178,48,48]};
  const fill=c=>pdf.setFillColor(...c),colour=c=>pdf.setTextColor(...c);let y=18;
  function footer(){fill(C.navy);pdf.rect(18,H-25,W-36,17,'F');colour([215,227,234]);pdf.setFont('helvetica','normal');pdf.setFontSize(6.5);pdf.text('Stagecoach South Scotland',left,H-14);pdf.text('Designed & Developed by Michael Skinner',right,H-14,{align:'right'});}
  function newPage(){footer();pdf.addPage();fill(C.white);pdf.rect(0,0,W,H,'F');y=22;tableHeader();}
  const widths=[55,122,58,45,72,68,58,58,80,190];
  const heads=['Duty','Driver','Fleet','DQC','Destination','NSA','Scheduled','Actual','Result','Comments'];
  function tableHeader(){fill(C.navy);pdf.rect(left,y,contentW,24,'F');colour(C.white);pdf.setFont('helvetica','bold');pdf.setFontSize(7.5);let x=left;heads.forEach((h,i)=>{pdf.text(h,x+4,y+15);x+=widths[i];});y+=24;}
  function row(r){const d=diff(r[8],r[9]),vals=[r[3],r[4],r[5],norm(r[6])==='yes'?'Yes':'No',norm(r[7])==='yes'?'Yes':'No',nsa(r[14]),r[8],r[9],timing(d),r[12]||'-'];pdf.setFont('helvetica','normal');pdf.setFontSize(7.2);const lines=vals.map((v,i)=>pdf.splitTextToSize(String(v||'-'),widths[i]-8));const h=Math.max(25,10+Math.max(...lines.map(x=>x.length))*9);if(y+h>H-35)newPage();fill(C.white);pdf.rect(left,y,contentW,h,'F');pdf.setDrawColor(...C.line);pdf.rect(left,y,contentW,h,'S');let x=left;lines.forEach((ls,i)=>{if(i===8){colour(d>=6?C.red:d>0?C.amber:C.green);pdf.setFont('helvetica','bold');}else{colour(C.text);pdf.setFont('helvetica','normal');}pdf.text(ls,x+4,y+14);x+=widths[i];if(i<lines.length-1)pdf.line(x,y,x,y+h);});y+=h;}
  fill(C.white);pdf.rect(0,0,W,H,'F');const logo=await imageData(LOGO);if(logo){try{pdf.addImage(logo,'PNG',left,y+4,125,33);}catch(e){}}else{colour(C.navy);pdf.setFont('helvetica','bold');pdf.setFontSize(18);pdf.text('Stagecoach',left,y+27);}colour(C.navy);pdf.setFont('helvetica','bold');pdf.setFontSize(9);pdf.text('STAGECOACH SOUTH SCOTLAND',right,y+23,{align:'right'});y+=45;
  fill(C.navy);pdf.rect(18,y,W-36,48,'F');fill(C.orange);pdf.rect(18,y+45,W-36,3,'F');colour(C.white);pdf.setFont('helvetica','bold');pdf.setFontSize(19);pdf.text('MORNING RUN OUT CHECK REPORT',left,y+30);y+=58;
  const date=$('mroDate')?.value||'',inspector=typeof getInspector==='function'?getInspector():'-',checked=rows.filter(r=>diff(r[8],r[9])!==null),late=checked.filter(r=>diff(r[8],r[9])>=6).length,on=checked.length-late,score=checked.length?on/checked.length*100:0;
  const meta=[['DATE',uk(date)],['INSPECTOR',inspector||'-'],['BUSES CHECKED',String(checked.length)],['ON TIME / WITHIN 5',String(on)],['6+ MIN LATE',String(late)],['RUN OUT SCORE',score.toFixed(1)+'%']];const mw=contentW/meta.length;fill(C.light);pdf.rect(left,y,contentW,42,'F');pdf.setDrawColor(...C.line);pdf.rect(left,y,contentW,42,'S');meta.forEach((m,i)=>{const x=left+i*mw;if(i)pdf.line(x,y,x,y+42);colour(C.muted);pdf.setFont('helvetica','normal');pdf.setFontSize(6.5);pdf.text(m[0],x+6,y+13);colour(C.text);pdf.setFont('helvetica','bold');pdf.setFontSize(11);pdf.text(String(m[1]),x+6,y+30);});y+=54;
  tableHeader();rows.forEach(row);footer();
  pdf.setProperties({title:`Morning Run Out Report ${uk(date)}`,subject:'Morning Run Out Check Report',author:'Stagecoach South Scotland'});
  const bytes=pdf.output('arraybuffer'),name=`Morning-Run-Out-Report-${date||'Report'}.pdf`,file=new File([bytes],name,{type:'application/pdf',lastModified:Date.now()});
  if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Morning Run Out Check Report'});return;}
  const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
 }catch(e){if(e&&e.name==='AbortError')return;console.error(e);alert('The Morning Run Out PDF could not be created. Please try again.');}
 finally{if(btn){btn.disabled=false;btn.textContent='SEND PDF REPORT';}}
}
function addButton(){const exportBtn=$('mroExport');if(!exportBtn||$('mroPdf'))return false;const b=document.createElement('button');b.type='button';b.className='btn';b.id='mroPdf';b.textContent='SEND PDF REPORT';b.onclick=createPdf;exportBtn.insertAdjacentElement('afterend',b);return true;}
function init(){let n=0,t=setInterval(()=>{if(addButton()||++n>60)clearInterval(t);},250);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();