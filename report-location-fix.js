(function(){
'use strict';

function norm(v){return String(v||'').trim().toLowerCase();}
function rows(){
  const data=(window.cloud&&window.cloud['Inspections'])||[];
  if(!Array.isArray(data)||!data.length)return[];
  const first=(data[0]||[]).map(v=>norm(v));
  const hasHeader=first.some(v=>['date','time','inspector','driver','fleet','service','depot','location'].includes(v));
  return hasHeader?data.slice(1):data;
}
function textAfter(html,label){
  const re=new RegExp(label+':\\s*([^<]+)','i');
  const m=String(html||'').match(re);
  return m?m[1].trim():'';
}
function findRow(card){
  const html=card.innerHTML;
  const driver=textAfter(html,'Driver');
  const fleet=textAfter(html,'Fleet');
  const service=textAfter(html,'Service');
  const inspector=textAfter(html,'Inspector');
  return rows().find(r=>
    (!driver||norm(r[4])===norm(driver))&&
    (!fleet||norm(r[6])===norm(fleet))&&
    (!service||norm(r[5])===norm(service))&&
    (!inspector||norm(r[2])===norm(inspector))
  );
}
function apply(){
  document.querySelectorAll('#reportResults .compactDetails').forEach(card=>{
    if(card.dataset.boardingFixed==='1')return;
    const title=card.querySelector('b')?.textContent||'';
    if(!/Inspector Check/i.test(title))return;
    const row=findRow(card);
    if(!row)return;
    const depot=row[3]||'-';
    const boarding=row[8]||'-';
    const destination=row[9]||'-';
    card.innerHTML=card.innerHTML
      .replace(/Depot\/Location:\s*[^<]*<br>/i,`Depot: ${depot}<br>Boarding Point: ${boarding}<br>`)
      .replace(/Destination:\s*[^<]*<br>/i,`Destination: ${destination}<br>`);
    if(!/Boarding Point:/i.test(card.innerHTML)){
      const inspectorLine=/Inspector:\s*[^<]*<br>/i;
      card.innerHTML=card.innerHTML.replace(inspectorLine,m=>m+`Depot: ${depot}<br>Boarding Point: ${boarding}<br>Destination: ${destination}<br>`);
    }
    card.dataset.boardingFixed='1';
  });
}
function init(){
  apply();
  const target=document.getElementById('reportResults');
  if(target)new MutationObserver(()=>apply()).observe(target,{childList:true,subtree:true});
  setInterval(apply,1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1500));else setTimeout(init,1500);
})();