(function(){
'use strict';

const $=id=>document.getElementById(id);

function addStyles(){
  if($('checksheetPolishCss'))return;
  const style=document.createElement('style');
  style.id='checksheetPolishCss';
  style.textContent=`
    #checksheet .checkStatusBar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:10px 0 14px;padding:10px;border:1px solid #31536d;border-radius:12px;background:#10263a;font-size:12px;text-align:center}
    #checksheet .checkStatusItem{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#d8e5ef}
    #checksheet .checkStatusItem b{display:block;color:#fff;font-size:13px;margin-top:2px}
    #checksheet .formSectionTitle{margin:16px 0 8px;padding:8px 12px;border-radius:9px;font-weight:800;letter-spacing:.02em;background:#17324b;color:#fff;border-left:6px solid #4d83c4}
    #checksheet .formSectionTitle.inspection{border-left-color:#e8aa3d}
    #checksheet .formSectionTitle.outcome{border-left-color:#d64a50}
    #checksheet #csDriver{height:var(--field-height,56px)!important;min-height:56px!important;max-height:56px!important;padding-top:0!important;padding-bottom:0!important}
    #checksheet .historyToggle{width:100%;margin:14px 0 8px;background:#17324b;border:1px solid #416783;color:#fff;border-radius:10px;padding:12px;font-weight:800;font-size:15px}
    #checksheet .historyHidden{display:none!important}
    #checksheet .historyPanelTitle{font-size:18px;font-weight:800;margin:12px 0 4px;color:#fff}
    @media(max-width:520px){#checksheet .checkStatusBar{grid-template-columns:repeat(2,minmax(0,1fr));font-size:11px}}
  `;
  document.head.appendChild(style);
}

function addStatusBar(){
  const section=$('checksheet');
  if(!section||$('checkStatusBar'))return;
  const heading=section.querySelector('h2');
  const bar=document.createElement('div');
  bar.id='checkStatusBar';
  bar.className='checkStatusBar';
  bar.innerHTML=`
    <div class="checkStatusItem">Inspector<b id="checkStatusInspector">-</b></div>
    <div class="checkStatusItem">Depot<b id="checkStatusDepot">Not selected</b></div>
    <div class="checkStatusItem">Date<b id="checkStatusDate">-</b></div>
    <div class="checkStatusItem">Status<b id="checkStatusCloud">Live</b></div>`;
  heading.insertAdjacentElement('afterend',bar);
}

function addSectionTitles(){
  const section=$('checksheet');
  if(!section)return;
  const grids=section.querySelectorAll(':scope > .grid');
  if(grids[0]&&!section.querySelector('[data-form-title="journey"]')){
    const h=document.createElement('div');h.className='formSectionTitle';h.dataset.formTitle='journey';h.textContent='Journey Details';grids[0].before(h);
  }
  const nsa=$('csNSA');
  const nsaGrid=nsa&&nsa.closest('.grid');
  if(nsaGrid&&!section.querySelector('[data-form-title="inspection"]')){
    const h=document.createElement('div');h.className='formSectionTitle inspection';h.dataset.formTitle='inspection';h.textContent='Inspection';nsaGrid.before(h);
  }
  const action=$('csDriverReport');
  const actionGrid=action&&action.closest('.grid');
  if(actionGrid&&!section.querySelector('[data-form-title="outcome"]')){
    const h=document.createElement('div');h.className='formSectionTitle outcome';h.dataset.formTitle='outcome';h.textContent='Driver Outcome';actionGrid.before(h);
  }
}

function setupHistoryToggle(){
  const section=$('checksheet');
  const list=$('checkList');
  const search=$('checkSearch');
  const panel=search&&search.closest('.panel');
  if(!section||!list||!panel||$('toggleCheckHistoryBtn'))return;
  const title=document.createElement('div');
  title.className='historyPanelTitle';
  title.textContent='Previous Checks';
  panel.before(title);
  const btn=document.createElement('button');
  btn.type='button';btn.id='toggleCheckHistoryBtn';btn.className='historyToggle';
  title.before(btn);
  function apply(hidden){
    panel.classList.toggle('historyHidden',hidden);
    list.classList.toggle('historyHidden',hidden);
    title.classList.toggle('historyHidden',hidden);
    btn.textContent=hidden?'Show Previous Checks':'Hide Previous Checks';
    btn.setAttribute('aria-expanded',String(!hidden));
    localStorage.setItem('checkHistoryHidden',hidden?'1':'0');
  }
  btn.addEventListener('click',()=>apply(!panel.classList.contains('historyHidden')));
  apply(localStorage.getItem('checkHistoryHidden')==='1');
}

function updateStatus(){
  const inspector=$('checkStatusInspector');
  const depot=$('checkStatusDepot');
  const date=$('checkStatusDate');
  const cloud=$('checkStatusCloud');
  if(inspector)inspector.textContent=(typeof getInspector==='function'&&getInspector())||'Not logged in';
  const depotField=$('csDepot');
  if(depot)depot.textContent=(depotField&&depotField.value)||'Not selected';
  const dateField=$('csDate');
  if(date){
    const value=dateField&&dateField.value;
    date.textContent=(value&&typeof formatDateValue==='function')?formatDateValue(value):(value||'-');
  }
  const sync=$('syncStatus');
  if(cloud){
    const text=(sync&&sync.textContent)||'Live';
    cloud.textContent=/fail|offline|error/i.test(text)?'Check connection':'Live';
  }
}

function initialise(){
  addStyles();addStatusBar();addSectionTitles();setupHistoryToggle();updateStatus();
  ['csDepot','csDate'].forEach(id=>{const el=$(id);if(el){el.addEventListener('change',updateStatus);el.addEventListener('input',updateStatus);}});
  setInterval(updateStatus,2000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(initialise,900));
else setTimeout(initialise,900);
})();