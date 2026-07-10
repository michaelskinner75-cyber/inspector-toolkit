(function(){
'use strict';

function coverageRows(sheet){
  if(typeof dataRows==='function') return dataRows(sheet);
  const rows=(window.cloud&&cloud[sheet])||[];
  if(!rows.length)return[];
  const first=(rows[0]||[]).map(v=>String(v||'').trim().toLowerCase());
  const header=first.some(v=>['date','time','inspector','driver','fleet','service','location'].includes(v));
  return header?rows.slice(1):rows.slice();
}

function newer(existing,item){
  if(!existing)return true;
  return parseRowDate(item.date)>parseRowDate(existing.date);
}

window.serviceLastChecks=function(){
  const map={};

  coverageRows('Inspections').forEach(r=>{
    const key=normaliseService(r[5]);
    if(!key)return;
    const item={
      date:r[0],
      inspector:r[2]||'',
      depot:r[3]||'',
      driver:r[4]||'',
      service:r[5]||'',
      fleet:r[6]||'',
      location:r[8]||'',
      destination:r[9]||'',
      source:'Inspector Check Sheet'
    };
    if(newer(map[key],item))map[key]=item;
  });

  coverageRows('Early Running').forEach(r=>{
    const key=normaliseService(r[4]);
    if(!key)return;
    const item={
      date:r[0],
      inspector:r[2]||'',
      depot:'',
      driver:r[7]||'',
      service:r[4]||'',
      fleet:r[6]||'',
      location:r[3]||'',
      destination:r[5]||'',
      source:'Timing Check'
    };
    if(newer(map[key],item))map[key]=item;
  });

  return map;
};

// Rebuild coverage immediately and whenever shared data is rendered.
if(typeof renderCoverage==='function')renderCoverage();
const oldRenderAll=window.renderAll;
if(typeof oldRenderAll==='function'){
  window.renderAll=function(){
    oldRenderAll();
    if(typeof renderCoverage==='function')renderCoverage();
  };
}

})();