/* Inspector Hub: 50 x 180 mm service check status ticket for the Day Planner. */
(function(){
'use strict';
const PW=141.7323,PH=510.2362,L=7,R=PW-7,SX=42;
const M=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const W={ ' ':313,A:696,B:686,C:660,D:747,E:615,F:615,G:738,H:753,I:335,J:335,K:697,L:573,M:896,N:753,O:765,P:659,Q:765,R:693,S:648,T:614,U:731,V:696,W:993,X:694,Y:651,Z:652 };
for(let i=0;i<=9;i++)W[String(i)]=626;
const fmt=n=>Number(n).toFixed(3).replace(/0+$/,'').replace(/\.$/,'');
const safe=s=>String(s).replace(/[^\x20-\x7E]/g,'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
const bytes=s=>new TextEncoder().encode(s);
function width(s,size){let n=0;for(const c of s)n+=W[c]||600;return n*size/1000;}
function wrap(codes,size){
 const lines=[];let line='';
 for(const code of codes){const next=line?line+' '+code:code;
  if(line&&width(next,size)>R-SX){lines.push(line);line=code;}else line=next;
 }
 if(line)lines.push(line);return lines;
}
function groupRows(items){
 const g=new Map();let never=0,old=0,recent=0;
 for(const s of items){
  const code=String(s?.code||'').trim().toUpperCase();
  if(!/^[A-Z0-9]{1,8}$/.test(code))continue;
  const isNever=!s.last||!Number.isFinite(Number(s.days))||s.override?.status==='NOT_CHECKED';
  const days=isNever?null:Math.max(0,Math.floor(Number(s.days)));
  const label=isNever?'NEVER':days+'d';
  if(!g.has(label))g.set(label,[]);
  g.get(label).push(code);
  if(isNever)never++;else if(days>=14)old++;else recent++;
 }
 return {groups:[...g].sort((a,b)=>a[0]==='NEVER'?-1:b[0]==='NEVER'?1:parseInt(b[0])-parseInt(a[0])),never,old,recent,total:never+old+recent};
}
function makePdf(items,at=new Date()){
 const info=groupRows(items);
 if(!info.total)throw Error('No service coverage data is available to print');
 let scale=1,groups=[],bottom=0;
 do {
  groups=info.groups.map(([label,codes])=>({label,lines:wrap(codes,9.2*scale)}));
  bottom=PH-11.5-14-14-9-13-9-14-8-12-groups.reduce((sum,g)=>sum+(g.lines.length*12.1+2.7)*scale,0)-8;
  if(bottom>=7)break;
  scale-=0.025;
 }while(scale>=0.65);
 if(bottom<7)throw Error('Ticket contains too many lines for one 50 x 180 mm page');
 const ops=['0 g 0 G'];
 const draw=(x,y,s,sz,horizontal=100,bold=true)=>{
  ops.push('BT /'+(bold?'F1':'F2')+' '+fmt(sz)+' Tf '+fmt(horizontal)+' Tz 1 0 0 1 '+fmt(x)+' '+fmt(y)+' Tm ('+safe(s)+') Tj ET');
 };
 const line=y=>ops.push('0.45 w '+fmt(L)+' '+fmt(y)+' m '+fmt(R)+' '+fmt(y)+' l S');
 const stamp=String(at.getDate()).padStart(2,'0')+' '+M[at.getMonth()]+' '+at.getFullYear();
 let y=PH-11.5;
 draw(L,y,'STAGECOACH EAST SCOTLAND',8.1,97);y-=14;
 draw(L,y,'SERVICE CHECK STATUS',10.2,97);y-=14;
 draw(L,y,stamp+'  |  '+info.total+' SERVICES',8.75,99);y-=9;
 line(y);y-=13;
 draw(L,y,'NEVER '+info.never+'  |  14d+ '+info.old+'  |  0-13d '+info.recent,8.75,82);y-=9;
 line(y);y-=14;
 draw(L,y,'DAYS',7.6,98);draw(SX,y,'SERVICES',7.6,98);y-=8;line(y);y-=12;
 for(const g of groups){
  draw(L,y,g.label,(g.label==='NEVER'?8.3:9.05)*scale,107);
  g.lines.forEach((code,i)=>draw(SX,y-i*12.1*scale,code,9.2*scale,107));
  y-=(g.lines.length*12.1+2.7)*scale;
 }
 line(y+5);y-=8;
 draw(L,y,'0d = TODAY   |   d = DAYS AGO',8,82,false);
 const stream=ops.join('\n')+'\n';
 const objs=[
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+fmt(PW)+' '+fmt(PH)+'] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
  '<< /Length '+bytes(stream).length+' >>\nstream\n'+stream+'endstream',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
 ];
 let pdf='%PDF-1.4\n%InspectorHub\n';const offsets=[0];
 for(let i=0;i<objs.length;i++){offsets.push(bytes(pdf).length);pdf+=(i+1)+' 0 obj\n'+objs[i]+'\nendobj\n';}
 const xref=bytes(pdf).length;
 pdf+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n';
 for(let i=1;i<offsets.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
 pdf+='trailer\n<< /Size '+(objs.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
 return new Blob([bytes(pdf)],{type:'application/pdf'});
}
function download(items,at=new Date()){
 const pdf=makePdf(items,at),url=URL.createObjectURL(pdf);
 const a=document.createElement('a');a.href=url;
 a.download='Stagecoach_Service_Check_Status_'+at.getFullYear()+'-'+String(at.getMonth()+1).padStart(2,'0')+'-'+String(at.getDate()).padStart(2,'0')+'_50x180mm.pdf';
 a.style.display='none';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),90000);
 return {count:groupRows(items).total,filename:a.download};
}
window.InspectorHubTicket={makePdf,download,groupRows};
})();