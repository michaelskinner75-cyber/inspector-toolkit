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

function coverageArea(value){
  const text=String(value||'').toUpperCase();
  if(/PERTH|BLAIRGOWRIE|PITLOCHRY|AUCHTERARDER|DUNKELD|ABERFELDY|CRIEFF|KINROSS|BALLINLUIG|INVERALMOND|NEWBURGH/.test(text))return'PERTH';
  if(/FIFE|DUNFERMLINE|KIRKCALDY|LEVEN|GLENROTHES|ST ANDREWS|CUPAR|ROSYTH|INVERKEITHING|FERRYTOLL|HALBEATH|DALGETY|METHIL|ANSTRUTHER|TAYPORT|KELTY|COWDENBEATH|LOCHGELLY|NEWPORT/.test(text))return'FIFE';
  if(/ANGUS|ARBROATH|FORFAR|MONTROSE|BRECHIN|KIRRIEMUIR|CARNOUSTIE|MONIFIETH|EDZELL|STRACATHRO|GLAMIS/.test(text))return'ANGUS';
  if(/DUNDEE|NINEWELLS/.test(text))return'DUNDEE';
  if(/EDINBURGH|MUSSELBURGH|WALLYFORD|PORT SETON|LIVINGSTON/.test(text))return'EDINBURGH';
  if(/GLASGOW|STIRLING|FALKIRK|ALLOA/.test(text))return'CENTRAL';
  return'';
}

function coverageKey(service,area){
  return normaliseService(service)+'|'+coverageArea(area);
}

function definitionArea(service){
  return coverageArea(service&&service.route);
}

function recordArea(item){
  return coverageArea([item.depot,item.location,item.destination].filter(Boolean).join(' '));
}

function coverageSortMode(){
  const coverage=document.getElementById('coverage');
  if(!coverage)return'oldest';
  const known=document.getElementById('coverageSort')||document.getElementById('coverageOrder')||document.getElementById('serviceCoverageSort');
  const select=known||[...coverage.querySelectorAll('select')].find(s=>[...s.options].some(o=>/newest|oldest/i.test(o.textContent+' '+o.value)));
  if(select){
    const value=String(select.value||select.options[select.selectedIndex]?.textContent||'').toLowerCase();
    return value.includes('new')||value.includes('desc')?'newest':'oldest';
  }
  const active=coverage.querySelector('[data-coverage-sort].active,[data-sort].active,[aria-pressed="true"]');
  const value=String(active&&(active.dataset.coverageSort||active.dataset.sort||active.textContent)||'').toLowerCase();
  return value.includes('new')||value.includes('desc')?'newest':'oldest';
}

window.serviceLastChecks=function(){
  const map={};

  function add(item){
    const service=normaliseService(item.service);
    if(!service)return;
    const area=recordArea(item);
    const key=service+'|'+area;
    if(newer(map[key],item))map[key]=item;
  }

  coverageRows('Inspections').forEach(r=>{
    add({
      date:r[0],
      inspector:r[2]||'',
      depot:r[3]||'',
      driver:r[4]||'',
      service:r[5]||'',
      fleet:r[6]||'',
      location:r[8]||'',
      destination:r[9]||'',
      source:'Inspector Check Sheet'
    });
  });

  coverageRows('Early Running').forEach(r=>{
    add({
      date:r[0],
      inspector:r[2]||'',
      depot:'',
      driver:r[7]||'',
      service:r[4]||'',
      fleet:r[6]||'',
      location:r[3]||'',
      destination:r[5]||'',
      source:'Timing Check'
    });
  });

  return map;
};

window.coverageLastCheckForService=function(service,last){
  const code=normaliseService(service.code);
  const exact=last[coverageKey(code,definitionArea(service))]||null;
  const duplicates=(window.serviceDefs||serviceDefs||[]).filter(s=>normaliseService(s.code)===code).length;
  if(exact||duplicates>1)return exact;
  return Object.keys(last)
    .filter(key=>key.indexOf(code+'|')===0)
    .map(key=>last[key])
    .sort((a,b)=>parseRowDate(b.date)-parseRowDate(a.date))[0]||null;
};

const originalRenderCoverage=window.renderCoverage;
if(typeof originalRenderCoverage==='function'){
  window.renderCoverage=function(){
    const el=$('coverageList');
    if(!el)return;
    const q=(($('coverageSearch')||{}).value||'').toLowerCase();
    const last=window.serviceLastChecks();
    const nowDate=new Date();
    const sortMode=coverageSortMode();
    let rows=serviceDefs.map((s,i)=>({...s,i,last:window.coverageLastCheckForService(s,last)}));
    rows=rows.filter(x=>{
      if(q&&!(`${x.code} ${x.route}`).toLowerCase().includes(q))return false;
      if(coverageFilter==='never')return!x.last;
      if(coverageFilter==='7'||coverageFilter==='30'){
        if(!x.last)return false;
        const age=(nowDate-parseRowDate(x.last.date))/86400000;
        return age<=Number(coverageFilter);
      }
      return true;
    });
    rows.sort((a,b)=>{
      if(!a.last&&!b.last)return a.code.localeCompare(b.code,undefined,{numeric:true});
      if(!a.last)return 1;
      if(!b.last)return-1;
      const difference=parseRowDate(a.last.date)-parseRowDate(b.last.date);
      return sortMode==='newest'?-difference:difference;
    });
    const edit=$('serviceEditPanel')?.style.display!=='none';
    el.innerHTML=rows.map(x=>{
      let cls='never',meta='Never checked';
      if(x.last){
        const age=(nowDate-parseRowDate(x.last.date))/86400000;
        cls=age<=7?'recent':'old';
        meta=`Last checked ${formatDateValue(x.last.date)} by ${x.last.inspector||'-'} • Fleet ${x.last.fleet||'-'} • Driver ${x.last.driver||'-'}`;
      }
      return `<div class="coverageCard ${cls}"><div class="coverageTop"><div><div class="coverageCode">${x.code}</div><div class="coverageRoute">${x.route}</div></div>${edit?`<button class="btn danger serviceDelete" data-delete-service="${x.i}">Remove</button>`:''}</div><div class="coverageMeta">${meta}</div></div>`;
    }).join('')||'No services match.';
    const total=serviceDefs.length;
    const matches=serviceDefs.map(s=>window.coverageLastCheckForService(s,last));
    const checked=matches.filter(Boolean).length;
    const never=total-checked;
    const recent=matches.filter(x=>x&&(nowDate-parseRowDate(x.date))/86400000<=7).length;
    $('coverageSummary').innerHTML=`<div class="coverageStat"><b>${total}</b>Total</div><div class="coverageStat"><b>${checked}</b>Checked</div><div class="coverageStat"><b>${recent}</b>Last 7 Days</div><div class="coverageStat"><b>${never}</b>Never</div>`;
  };
}

document.addEventListener('change',e=>{
  const coverage=document.getElementById('coverage');
  if(coverage&&coverage.contains(e.target)&&e.target.matches('select')&&[...e.target.options].some(o=>/newest|oldest/i.test(o.textContent+' '+o.value))){
    window.renderCoverage();
  }
});

document.addEventListener('click',e=>{
  const target=e.target.closest('[data-coverage-sort],[data-sort]');
  if(target&&document.getElementById('coverage')?.contains(target))setTimeout(()=>window.renderCoverage(),0);
});

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