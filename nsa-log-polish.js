(function(){
'use strict';
const $=id=>document.getElementById(id);

function addStyles(){
  if($('nsaLogPolishCss'))return;
  const style=document.createElement('style');
  style.id='nsaLogPolishCss';
  style.textContent=`
    #nsa .nsaToggleBtn{width:100%;margin:10px 0;background:#17324b;border:1px solid #416783;color:#fff;border-radius:10px;padding:12px;font-weight:800;font-size:15px}
    #nsa .nsaSectionHidden{display:none!important}
    #nsa .nsaSectionHeading{font-size:18px;font-weight:800;color:#fff;margin:14px 0 6px}
    #nsa .filterBar button.activeFilter{outline:3px solid rgba(255,255,255,.28);transform:translateY(-1px)}
    #nsa .nsaCompactRow{position:relative;margin:8px 0;border-radius:11px;background:#0d1c2b;overflow:hidden;border:1px solid rgba(255,255,255,.05)}
    #nsa .nsaCompactRow::before{content:"";position:absolute;left:0;top:0;bottom:0;width:7px;background:#7f98aa}
    #nsa .nsaCompactRow.good::before{background:#49a17f}
    #nsa .nsaCompactRow.bad::before{background:#d64a50}
    #nsa .nsaCompactRow.na::before{background:#7f98aa}
    #nsa .nsaCompactTop{padding:13px 14px 12px 22px;cursor:pointer}
    #nsa .nsaCompactMain{font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:15px}
    #nsa .nsaCompactSub{margin-top:4px;color:#b8c5ce;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}
    #nsa .nsaCompactDetails{display:none;padding:0 14px 14px 22px;color:#dce7ee;line-height:1.55;font-size:13px}
    #nsa .nsaCompactDetails.show{display:block}
  `;
  document.head.appendChild(style);
}

function renameHomeButton(){
  const btn=document.querySelector('[data-open="nsa"]');
  if(btn)btn.textContent='NSA LOG';
  const heading=document.querySelector('#nsa h2');
  if(heading)heading.textContent='NSA LOG';
}

function setupManualToggle(){
  const section=$('nsa');
  if(!section)return;
  const manualPanel=section.querySelector('.panel');
  if(!manualPanel||$('toggleNsaManualBtn'))return;
  const btn=document.createElement('button');
  btn.type='button';btn.id='toggleNsaManualBtn';btn.className='nsaToggleBtn';
  manualPanel.before(btn);
  function apply(hidden){
    manualPanel.classList.toggle('nsaSectionHidden',hidden);
    btn.textContent=hidden?'Show Manual Input':'Hide Manual Input';
    btn.setAttribute('aria-expanded',String(!hidden));
    localStorage.setItem('nsaManualHidden',hidden?'1':'0');
  }
  btn.addEventListener('click',()=>apply(!manualPanel.classList.contains('nsaSectionHidden')));
  const saved=localStorage.getItem('nsaManualHidden');
  apply(saved===null?true:saved==='1');
}

function setupReportsToggle(){
  const section=$('nsa'),filters=$('nsaFilters'),list=$('nsaList');
  if(!section||!filters||!list||$('toggleNsaReportsBtn'))return;
  const heading=document.createElement('div');
  heading.className='nsaSectionHeading';heading.textContent='Completed Reports';filters.before(heading);
  const btn=document.createElement('button');
  btn.type='button';btn.id='toggleNsaReportsBtn';btn.className='nsaToggleBtn';heading.before(btn);
  function apply(hidden){
    filters.classList.toggle('nsaSectionHidden',hidden);
    list.classList.toggle('nsaSectionHidden',hidden);
    heading.classList.toggle('nsaSectionHidden',hidden);
    btn.textContent=hidden?'Show Completed Reports':'Hide Completed Reports';
    btn.setAttribute('aria-expanded',String(!hidden));
    localStorage.setItem('nsaReportsHidden',hidden?'1':'0');
  }
  btn.addEventListener('click',()=>apply(!filters.classList.contains('nsaSectionHidden')));
  apply(localStorage.getItem('nsaReportsHidden')==='1');
}

function rowsWithoutHeader(){
  const rows=(window.cloud&&cloud['NSA Faults'])||[];
  if(!rows.length)return[];
  const first=(rows[0]||[]).map(v=>String(v||'').trim().toLowerCase());
  const header=first.some(v=>['date','time','inspector','depot','fleet','fleet number','service'].includes(v));
  return header?rows.slice(1):rows.slice();
}

function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function compactRenderNSA(){
  const el=$('nsaList');if(!el)return;
  const q=($('nsaSearch')?.value||'').toLowerCase();
  const current=new Date();
  let rows=rowsWithoutHeader().filter(r=>{
    const d=typeof parseRowDate==='function'?parseRowDate(r[0]):new Date(r[0]);
    try{
      if(nsaFilter==='today'&&typeof sameDay==='function'&&!sameDay(d,current))return false;
      if(nsaFilter==='week'&&typeof inThisWeek==='function'&&!inThisWeek(d))return false;
      if(nsaFilter==='month'&&typeof inThisMonth==='function'&&!inThisMonth(d))return false;
    }catch(e){}
    return !q||r.join(' ').toLowerCase().includes(q);
  }).reverse();

  el.innerHTML=rows.map((r,i)=>{
    const date=typeof formatDateValue==='function'?formatDateValue(r[0]):r[0];
    const time=typeof formatTimeValue==='function'?formatTimeValue(r[1]):r[1];
    const good=r[7]==='Yes'||r[8]==='Fully Working';
    const na=r[7]==='N/A'||r[8]==='N/A';
    const cls=na?'na':(good?'good':'bad');
    const status=na?'N/A':(good?'FULLY WORKING':(r[8]||'FAULT'));
    const details=[
      `<b>Date:</b> ${esc(date)} ${esc(time)}`,
      `<b>Status:</b> ${esc(status)}`,
      `<b>Depot:</b> ${esc(r[3]||'-')}`,
      `<b>Fleet:</b> ${esc(r[4]||'-')}`,
      `<b>Service:</b> ${esc(r[5]||'-')}`,
      `<b>Inspector:</b> ${esc(r[2]||'-')}`,
      r[9]?`<b>Notes:</b> ${esc(r[9])}`:'',
      r[12]?`<b>Source:</b> ${esc(r[12])}`:''
    ].filter(Boolean).join('<br>');
    return `<div class="nsaCompactRow ${cls}"><div class="nsaCompactTop" data-nsa-toggle="nsaDetail${i}"><div class="nsaCompactMain">${esc(date)} ${esc(time)} | ${esc(r[5]||'-')} | ${esc(r[4]||'-')} | ${esc(status)}</div><div class="nsaCompactSub">${esc(r[3]||'-')} • ${esc(r[2]||'-')}</div></div><div class="nsaCompactDetails" id="nsaDetail${i}">${details}</div></div>`;
  }).join('')||'No NSA reports for this view.';
}

function setTodayDefault(){
  try{nsaFilter='today';}catch(e){}
  window.renderNSA=compactRenderNSA;
  compactRenderNSA();
  document.querySelectorAll('#nsa .filterBar button').forEach(btn=>btn.classList.toggle('activeFilter',/today/i.test(btn.textContent||'')));
}

function bindInteractions(){
  document.addEventListener('click',e=>{
    const filterBtn=e.target.closest('#nsa .filterBar button');
    if(filterBtn){
      document.querySelectorAll('#nsa .filterBar button').forEach(x=>x.classList.remove('activeFilter'));
      filterBtn.classList.add('activeFilter');
      setTimeout(compactRenderNSA,0);
    }
    const toggle=e.target.closest('[data-nsa-toggle]');
    if(toggle){
      const details=$(toggle.dataset.nsaToggle);
      if(details)details.classList.toggle('show');
    }
  });
  const search=$('nsaSearch');if(search)search.addEventListener('input',compactRenderNSA);
}

function initialise(){
  addStyles();renameHomeButton();setupManualToggle();setupReportsToggle();setTodayDefault();bindInteractions();
  setTimeout(()=>{window.renderNSA=compactRenderNSA;compactRenderNSA();},800);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(initialise,1300));
else setTimeout(initialise,1300);
})();