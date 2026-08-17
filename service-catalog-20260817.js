(function(){
'use strict';

const CHANGE_ID='east-scotland-2026-08';
const withdrawals=[
  {code:'5',route:'Ferrytoll Park and Ride - Duloch Park - Ferrytoll Park and Ride',effectiveDate:'2026-08-17'},
  {code:'X56',route:'Edinburgh - Halbeath P&R - Perth',effectiveDate:'2026-08-24'}
];
const additions=[
  {code:'83',route:"Dunfermline bus station - Duloch Park - St David's Harbour - Inverkeithing Railway Station",effectiveDate:'2026-08-17'},
  {code:'87',route:'Wellwood Community Centre - Dunfermline - Duloch Park - Dalgety Bay - Inverkeithing Railway Station',effectiveDate:'2026-08-17'}
];

function clean(value){return String(value||'').trim().toLowerCase();}
function same(a,b){return clean(a.code)===clean(b.code)&&clean(a.route)===clean(b.route);}
function today(){
  const now=new Date();
  return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
}
function update(list){
  const date=today();
  const activeWithdrawals=withdrawals.filter(item=>item.effectiveDate<=date);
  const next=(Array.isArray(list)?list:[]).filter(item=>!activeWithdrawals.some(withdrawn=>same(item,withdrawn)));
  additions.filter(item=>item.effectiveDate<=date).forEach(item=>{
    if(!next.some(existing=>same(existing,item)))next.push({code:item.code,route:item.route});
  });
  return next;
}
function apply(){
  if(!Array.isArray(window.INSPECTOR_SERVICES))return false;
  const next=update(window.INSPECTOR_SERVICES);
  const changed=JSON.stringify(next)!==JSON.stringify(window.INSPECTOR_SERVICES);
  window.INSPECTOR_SERVICES=next;
  try{
    window.serviceDefs=next;
    window.eval('if(typeof serviceDefs!=="undefined")serviceDefs=window.INSPECTOR_SERVICES');
    localStorage.setItem('serviceCoverageList',JSON.stringify(next));
    localStorage.setItem('inspectorServiceCatalogueChange',CHANGE_ID);
  }catch(e){}
  if(!changed)return false;
  document.querySelectorAll('[data-for-service]').forEach(wrapper=>{
    if(typeof wrapper._refresh==='function')wrapper._refresh();
  });
  if(typeof window.renderCoverage==='function')window.renderCoverage();
  window.dispatchEvent(new StorageEvent('storage',{key:'serviceCoverageList'}));
  window.INSPECTOR_SERVICE_CATALOGUE={
    changeId:CHANGE_ID,
    effectiveDate:'2026-08-17',
    source:'Stagecoach Fife and Perth service changes',
    withdrawn:withdrawals,
    added:additions
  };
  return changed;
}

let tries=0;
const timer=setInterval(()=>{
  tries+=1;
  apply();
  if(tries>=80)clearInterval(timer);
},250);
})();
