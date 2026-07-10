(function(){
'use strict';

const TARGETS=['csService','tcService','nsaService'];
const GROUPS=[
  ['1-9','Services 1–9'],['10-19','Services 10–19'],['20-29','Services 20–29'],
  ['30-39','Services 30–39'],['40-49','Services 40–49'],['50-59','Services 50–59'],
  ['60-69','Services 60–69'],['70-79','Services 70–79'],['80-89','Services 80–89'],
  ['90-99','Services 90–99'],['X','X Services'],['OTHER','Other services']
];

function getServices(){
  let source=null;
  try{source=JSON.parse(localStorage.getItem('serviceCoverageList')||'null');}catch(e){}
  if(!Array.isArray(source)||!source.length)source=Array.isArray(window.INSPECTOR_SERVICES)?window.INSPECTOR_SERVICES:[];
  return source.map(item=>{
    if(typeof item==='string')return{code:item.trim(),route:''};
    return{code:String(item.code||item.service||'').trim(),route:String(item.route||item.description||'').trim()};
  }).filter(item=>item.code);
}

function groupFor(code){
  const c=String(code||'').trim().toUpperCase();
  if(c.startsWith('X'))return'X';
  const match=c.match(/^(\d+)/);
  if(!match)return'OTHER';
  const n=Number(match[1]);
  if(n>=1&&n<=9)return'1-9';
  if(n>=10&&n<=19)return'10-19';
  if(n>=20&&n<=29)return'20-29';
  if(n>=30&&n<=39)return'30-39';
  if(n>=40&&n<=49)return'40-49';
  if(n>=50&&n<=59)return'50-59';
  if(n>=60&&n<=69)return'60-69';
  if(n>=70&&n<=79)return'70-79';
  if(n>=80&&n<=89)return'80-89';
  if(n>=90&&n<=99)return'90-99';
  return'OTHER';
}

function uniqueServices(list){
  const seen=new Set();
  return list.filter(item=>{
    const key=(item.code+'|'+item.route).toLowerCase();
    if(seen.has(key))return false;
    seen.add(key);return true;
  });
}

function buildSelector(input){
  if(!input||input.dataset.serviceSelectReady==='1')return;
  input.dataset.serviceSelectReady='1';
  input.type='hidden';
  input.removeAttribute('list');

  const wrapper=document.createElement('div');
  wrapper.className='serviceSelectWrap';
  wrapper.dataset.forService=input.id;

  const group=document.createElement('select');
  group.className='field serviceGroupSelect';
  group.innerHTML='<option value="">Select service group</option>'+GROUPS.map(g=>`<option value="${g[0]}">${g[1]}</option>`).join('');

  const service=document.createElement('select');
  service.className='field serviceCodeSelect';
  service.disabled=true;
  service.innerHTML='<option value="">Select service</option>';

  const route=document.createElement('div');
  route.className='small serviceRouteText';
  route.textContent='Choose a group, then select the exact service.';

  wrapper.append(group,service,route);
  input.before(wrapper);

  function fillServices(){
    const selectedGroup=group.value;
    const items=uniqueServices(getServices().filter(x=>groupFor(x.code)===selectedGroup));
    service.innerHTML='<option value="">Select service</option>'+items.map((x,i)=>`<option value="${i}">${x.code}${x.route?' — '+x.route:''}</option>`).join('');
    service._items=items;
    service.disabled=!selectedGroup;
    input.value='';
    route.textContent=selectedGroup?(items.length?'Select the exact service.':'No services in this group.'):'Choose a group, then select the exact service.';
  }

  group.addEventListener('change',fillServices);
  service.addEventListener('change',()=>{
    const item=service._items&&service._items[Number(service.value)];
    input.value=item?item.code:'';
    route.textContent=item?(item.route||item.code):'Select the exact service.';
    input.dispatchEvent(new Event('change',{bubbles:true}));
  });

  wrapper._refresh=function(){
    const current=input.value;
    const currentGroup=current?groupFor(current):group.value;
    if(currentGroup){group.value=currentGroup;fillServices();
      const items=service._items||[];
      const idx=items.findIndex(x=>x.code===current);
      if(idx>=0){service.value=String(idx);route.textContent=items[idx].route||items[idx].code;input.value=current;}
    }
  };
}

function refreshAll(){
  TARGETS.forEach(id=>{
    const input=document.getElementById(id);
    if(input){buildSelector(input);const wrap=document.querySelector(`[data-for-service="${id}"]`);if(wrap&&wrap._refresh)wrap._refresh();}
  });
}

function resetSelector(id){
  const input=document.getElementById(id);if(input)input.value='';
  const wrap=document.querySelector(`[data-for-service="${id}"]`);if(!wrap)return;
  const selects=wrap.querySelectorAll('select');
  selects.forEach((s,i)=>{s.value='';if(i===1)s.disabled=true;});
  const route=wrap.querySelector('.serviceRouteText');if(route)route.textContent='Choose a group, then select the exact service.';
}

function start(){
  refreshAll();
  setTimeout(refreshAll,500);
  setTimeout(refreshAll,1500);

  document.addEventListener('click',e=>{
    if(e.target.id==='clearCheckFormBtn')setTimeout(()=>resetSelector('csService'),0);
    if(e.target.id==='clearTimingBtn'||e.target.id==='clearTimingFormBtn')setTimeout(()=>resetSelector('tcService'),0);
    if(e.target.id==='saveManualNsaBtn')setTimeout(()=>resetSelector('nsaService'),50);
    if(e.target.id==='addServiceBtn'||e.target.closest('[data-delete-service]'))setTimeout(refreshAll,100);
  });

  window.addEventListener('storage',e=>{if(e.key==='serviceCoverageList')refreshAll();});

  const oldSave=window.saveServices;
  if(typeof oldSave==='function'&&!oldSave.__serviceSelectWrapped){
    const wrapped=function(){const result=oldSave.apply(this,arguments);setTimeout(refreshAll,0);return result;};
    wrapped.__serviceSelectWrapped=true;window.saveServices=wrapped;
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();