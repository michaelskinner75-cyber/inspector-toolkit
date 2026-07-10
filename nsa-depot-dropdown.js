(function(){
'use strict';

const DEPOTS=['Aberhill','Arbroath','Dunfermline','Glenrothes','St Andrews','Perth','Forfar','Blairgowrie','Other'];

function setup(){
  const original=document.getElementById('nsaDepot');
  if(!original||original.dataset.depotDropdownReady==='1')return;
  original.dataset.depotDropdownReady='1';
  original.type='hidden';

  const wrap=document.createElement('div');
  wrap.className='nsaDepotWrap';

  const select=document.createElement('select');
  select.id='nsaDepotSelect';
  select.className='field';
  select.innerHTML='<option value="">Select depot</option>'+DEPOTS.map(d=>`<option value="${d}">${d}</option>`).join('');

  const custom=document.createElement('input');
  custom.id='nsaDepotOther';
  custom.className='field';
  custom.placeholder='Enter other depot';
  custom.style.display='none';

  function sync(){
    const value=select.value==='Other' ? custom.value.trim() : select.value;
    original.value=value;
    original.dispatchEvent(new Event('change',{bubbles:true}));
  }

  select.addEventListener('change',()=>{
    custom.style.display=select.value==='Other'?'block':'none';
    if(select.value!=='Other')custom.value='';
    sync();
  });
  custom.addEventListener('input',sync);

  wrap.append(select,custom);
  original.before(wrap);

  const style=document.createElement('style');
  style.textContent='#nsa .nsaDepotWrap{display:grid;grid-template-columns:1fr;gap:10px;width:100%}#nsa .nsaDepotWrap .field{width:100%;box-sizing:border-box}';
  document.head.appendChild(style);

  const save=document.getElementById('saveManualNsaBtn');
  if(save){
    save.addEventListener('click',()=>{
      if(select.value==='Other')sync();
    },true);
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,1700));
else setTimeout(setup,1700);
})();