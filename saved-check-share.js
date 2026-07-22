(function(){
'use strict';
const LOGO='https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/StagecoachGroup.svg/500px-StagecoachGroup.svg.png';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function linesFromCard(card){const details=card.querySelector('.compactDetails');if(!details)return[];const clone=details.cloneNode(true);clone.querySelectorAll('br').forEach(br=>br.replaceWith('\n'));return clone.textContent.split('\n').map(v=>v.trim()).filter(Boolean);}
function strip(value,labels){let out=String(value||'-').trim();for(const label of labels)out=out.replace(new RegExp('^'+label+'\\s*:\\s*','i'),'').trim();return out||'-';}
function parseJourney(text){const clean=strip(text,['Journey']);const parts=clean.split(/\s+(?:to|→)\s+/i);return{boarding:(parts[0]||'-').trim(),destination:(parts.slice(1).join(' to ')||'-').trim()};}
function reportFromCard(card){
 const x=linesFromCard(card),journey=parseJourney(x[7]);
 const nsaRaw=strip(x[8],['NSA']);const nsaParts=nsaRaw.split(/\s+-\s+/);
 return{
  dateTime:strip(x[0],['Inspection date/time','Date']),
  inspector:strip(x[1],['Inspector']),depot:strip(x[2],['Depot']),driver:strip(x[3],['Driver']),
  service:strip(x[4],['Service']),fleet:strip(x[5],['Fleet Number','Fleet']),timeChecked:strip(x[6],['Time Checked','Time boarded']),
  boarding:journey.boarding,destination:journey.destination,nsa:strip(nsaParts[0],['NSA Working']),
  nsaDetails:strip(nsaParts.slice(1).join(' - ')||((nsaParts[0]||'')==='Yes'?'Fully Working':'-'),['Details']),
  driverReport:strip(x[9],['Driver Report']),reason:strip(x[10],['Driver report reason / inspection notes','Reason','Notes'])
 };
}
function title(d){return'Inspector Check Sheet - Report Record'+(d.service&&d.service!=='-'?' - Service '+d.service:'')+(d.fleet&&d.fleet!=='-'?' - Fleet '+d.fleet:'');}
function row(label,value,wide){return`<div class="r${wide?' wide':''}"><div class="l">${esc(label)}</div><div class="v">${esc(value)}</div></div>`;}
function section(name,rows){return`<section><h2>${esc(name)}</h2><div class="grid">${rows}</div></section>`;}
function html(d){
 const status=d.nsa==='Yes'?'Working':d.nsa==='N/A'?'N/A':'Attention required';
 return`<article><header><img src="${LOGO}" alt="Stagecoach"><strong>STAGECOACH SOUTH SCOTLAND</strong></header><div class="title"><h1>INSPECTOR CHECK SHEET / REPORT RECORD</h1></div><div class="meta"><div><span>Inspection date/time</span><b>${esc(d.dateTime)}</b></div><div><span>Inspector</span><b>${esc(d.inspector)}</b></div><div><span>Service</span><b>${esc(d.service)}</b></div><div><span>Fleet</span><b>${esc(d.fleet)}</b></div></div>${section('Inspection Details',row('Driver',d.driver)+row('Depot',d.depot)+row('Time Checked',d.timeChecked))}${section('Journey Details',row('Boarding point',d.boarding,true)+row('Destination',d.destination,true))}${section('NSA',row('NSA Working',d.nsa)+row('Status',status)+row('Details',d.nsaDetails,true))}${section('Driver Report',row('Outcome',d.driverReport)+row('Report reason / inspection notes',d.reason,true))}<footer><span>Stagecoach South Scotland</span><span>Designed &amp; Developed by Michael Skinner</span></footer></article>`;
}
function css(){return`*{box-sizing:border-box}body{margin:0;background:#fff;color:#102333;font-family:Arial,sans-serif}article{width:794px;min-height:1123px;background:#fff;position:relative;padding-bottom:62px}header{height:108px;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px 38px;border-bottom:1px solid #dbe3e8}header img{width:215px;height:auto}header strong{font-size:12px;letter-spacing:.16em;color:#173c57;text-align:right}.title{padding:22px 38px;border-bottom:5px solid #f5a623;background:#0d2b40;color:#fff}.title h1{margin:0;font-size:25px;letter-spacing:.015em}.meta{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #dbe3e8;background:#f7f9fa}.meta div{padding:13px 18px;border-right:1px solid #dbe3e8}.meta div:last-child{border-right:0}.meta span{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.09em;color:#647987}.meta b{display:block;margin-top:5px;font-size:13px}section{padding:17px 38px 0;break-inside:avoid}section h2{margin:0;padding:8px 12px;background:#173c57;color:#fff;border-left:7px solid #f5a623;font-size:15px;text-transform:uppercase;letter-spacing:.04em}.grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #d9e1e6;border-top:0}.r{display:grid;grid-template-columns:125px 1fr;min-height:48px;border-top:1px solid #e1e7eb}.r:nth-child(-n+2){border-top:0}.r:nth-child(odd){border-right:1px solid #e1e7eb}.r.wide{grid-column:1/-1;border-right:0}.l{padding:10px 11px;background:#f3f6f8;font-size:12px;font-weight:700;color:#385266}.v{padding:10px 11px;font-size:13px;line-height:1.35;white-space:pre-wrap;overflow-wrap:anywhere}footer{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;gap:20px;padding:17px 38px;background:#0d2b40;color:#dbe7ee;font-size:10px}`;}
function loadScript(src,id){return new Promise((resolve,reject)=>{if(document.getElementById(id))return resolve();const s=document.createElement('script');s.id=id;s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
async function makePdf(d,name){
 await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js','reportHtml2Canvas');
 await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js','reportJsPdf');
 const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0;width:794px;background:#fff;z-index:-1';host.innerHTML='<style>'+css()+'</style>'+html(d);document.body.appendChild(host);
 await new Promise(r=>setTimeout(r,350));
 const canvas=await html2canvas(host.querySelector('article'),{scale:2.2,useCORS:true,backgroundColor:'#ffffff',logging:false});host.remove();
 const{jsPDF}=window.jspdf;const pdf=new jsPDF('p','pt','a4'),pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight(),margin=18,imgW=pageW-margin*2,imgH=canvas.height*imgW/canvas.width,img=canvas.toDataURL('image/jpeg',0.98);
 if(imgH<=pageH-margin*2){pdf.addImage(img,'JPEG',margin,margin,imgW,imgH,'FAST');}
 else{let y=margin,remaining=imgH;pdf.addImage(img,'JPEG',margin,y,imgW,imgH,'FAST');remaining-=pageH-margin*2;while(remaining>0){pdf.addPage();y=margin-(imgH-remaining);pdf.addImage(img,'JPEG',margin,y,imgW,imgH,'FAST');remaining-=pageH-margin*2;}}
 return new File([pdf.output('blob')],name.replace(/[^a-z0-9]+/gi,'-')+'.pdf',{type:'application/pdf'});
}
async function share(card){const d=reportFromCard(card),name=title(d),btn=card.querySelector('.savedCheckShareBtn');if(btn){btn.disabled=true;btn.textContent='CREATING PDF…';}try{const file=await makePdf(d,name);if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file]});return;}const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}catch(e){if(e&&e.name==='AbortError')return;alert('The PDF could not be shared. Please try again.');}finally{if(btn){btn.disabled=false;btn.textContent='SEND REPORT';}}}
function decorate(){document.querySelectorAll('#checkList .compactCheck').forEach(card=>{if(card.querySelector('.savedCheckShareBtn'))return;const btn=document.createElement('button');btn.type='button';btn.className='savedCheckShareBtn';btn.textContent='SEND REPORT';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();share(card);});const top=card.querySelector('.compactTop');(top||card).appendChild(btn);});}
function removeLive(){const c=document.getElementById('checksheetShareControls');if(c)c.remove();}
function style(){if(document.getElementById('savedCheckShareCss'))return;const s=document.createElement('style');s.id='savedCheckShareCss';s.textContent='.compactTop{position:relative;padding-bottom:46px!important}.savedCheckShareBtn{position:absolute;right:12px;bottom:8px;border:1px solid #f4b23f;border-radius:9px;background:#f3aa35;color:#07131e;font-weight:800;font-size:12px;padding:8px 12px;z-index:3}.savedCheckShareBtn:disabled{opacity:.7}.savedCheckShareBtn:active{transform:scale(.98)}';document.head.appendChild(s);}
function init(){style();decorate();removeLive();const list=document.getElementById('checkList');if(list)new MutationObserver(()=>requestAnimationFrame(decorate)).observe(list,{childList:true,subtree:true});const observer=new MutationObserver(removeLive);observer.observe(document.body,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),10000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();