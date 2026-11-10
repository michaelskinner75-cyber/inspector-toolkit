(function(){
'use strict';
const TARGETS=['tcService','nsaService'];
// Operator routes from bustimes.org/operators/stagecoach-west-scotland (10 November 2026).
// Keep separate from the East Scotland Google Sheets master and coverage list.
const WEST_SCOTLAND_SERVICES=[{"code":"1","route":"Kilmarnock Bus Station - Priestland Loudon Avenue","id":"west-0"},{"code":"1","route":"Masonhill, Ayr - Hayhill, Ayr","id":"west-1"},{"code":"1A","route":"Kilmarnock Bus Station - Drumleyhill Drive, Hurlford","id":"west-2"},{"code":"1B","route":"Kilmarnock - Galston","id":"west-3"},{"code":"2","route":"Carrick Street, Ayr - Carrick Street, Ayr","id":"west-4"},{"code":"2","route":"Kilmarnock Bus Station - Hurlford","id":"west-5"},{"code":"2A","route":"Ayr Town Centre - Citadel Leisure Centre","id":"west-6"},{"code":"3","route":"Amlaird Road, Onthank, Kilmarnock - Loreny Drive, Shortlees, Kilmarnock","id":"west-7"},{"code":"3","route":"Ayr Snowdrop Square - Ayr Snowdrop Square","id":"west-8"},{"code":"3B","route":"Ayr Snowdrop Square - Ayr Snowdrop Square","id":"west-9"},{"code":"4","route":"Buchanan Bus Station, Glasgow - Ayr Bus Station","id":"west-10"},{"code":"5","route":"Kilmarnock Bus Station - Kennedy Drive, New Farm Loch","id":"west-11"},{"code":"6","route":"New Farm Loch, Kilmarnock - Bellfield, Kilmarnock","id":"west-12"},{"code":"6","route":"Boswell Park, Ayr - Boswell Park, Ayr","id":"west-13"},{"code":"7","route":"New Farm Loch, Kilmarnock - Bellfield, Kilmarnock","id":"west-14"},{"code":"9","route":"Ayr - Doonfoot","id":"west-15"},{"code":"9","route":"Kilmarnock - Stewarton","id":"west-16"},{"code":"10","route":"Kilmarnock Bus Station - Barassie Westward Way","id":"west-17"},{"code":"11","route":"Chapelhill Mount, Ardrossan - Kilmarnock Bus Station","id":"west-18"},{"code":"12","route":"Stanley Road, Ardrossan - Sommerville Drive, Stevenston","id":"west-19"},{"code":"14","route":"Ayr Hospital - High Street, Irvine","id":"west-20"},{"code":"18","route":"New England, Saltcoats - Hayocks, Stevenston","id":"west-21"},{"code":"X19","route":"New South Glasgow Hospitals - Easterhouse","id":"west-22"},{"code":"22","route":"Castlepark, Irvine - Holehouse Roundabout, Irvine","id":"west-23"},{"code":"23","route":"Dickson Drive, Irvine - Broomlands, Irvine","id":"west-24"},{"code":"25","route":"Irvine Bridgegate - Beith Strand","id":"west-25"},{"code":"25A","route":"Stanecastle Middleton Road - Beith Strand","id":"west-26"},{"code":"25B","route":"Kilbirnie Milton Quadrant - Beith Grahamfield Place","id":"west-27"},{"code":"25C","route":"Kilwinning Claremont Crescent - Beith Grahamfield Place","id":"west-28"},{"code":"25D","route":"Stanecastle Middleton Road - Beith Grahamfield Place","id":"west-29"},{"code":"25E","route":"Stanecastle Middleton Road - Kilbirnie Milton Quadrant","id":"west-30"},{"code":"25X","route":"Kilwinning Claremont Crescent - Beith Grahamfield Place","id":"west-31"},{"code":"28","route":"Tesco, Irvine - Bourtreehill, Irvine","id":"west-32"},{"code":"28A","route":"Livingstone Terrace, Irvine - Broomlands, Irvine","id":"west-33"},{"code":"X36","route":"Glasgow Buchanan Bus Station - Ardrossan","id":"west-34"},{"code":"X36A","route":"Ardrossan Hill Street - Beith Strand","id":"west-35"},{"code":"42","route":"Ayr Bus Station - Muirkirk Bridge Street","id":"west-36"},{"code":"42A","route":"Ayr Bus Station - Cumnock Tanyard","id":"west-37"},{"code":"X42","route":"Ayr Bus Station - Muirkirk Bridge Street","id":"west-38"},{"code":"43","route":"Ayr Bus Station - Greenbraes Drive, New Cumnock","id":"west-39"},{"code":"43A","route":"Ayr Bus Station or Burns Statue Square - Annbank","id":"west-40"},{"code":"50","route":"Cumnock Bus Stance - Kilmarnock Bus Station","id":"west-41"},{"code":"52","route":"Ayr Bus Station - Bellsbank Glenmount","id":"west-42"},{"code":"58","route":"Ayr Bus Station - Girvan Elder Avenue","id":"west-43"},{"code":"60","route":"Ayr Bus Station - Girvan Elder Avenue","id":"west-44"},{"code":"61","route":"Ayr Bus Station / Carrick Street - Dunure","id":"west-45"},{"code":"X71","route":"Glasgow Buchanan Bus Station - Kilmarnock Bus Station - Priestland Loudoun Avenue","id":"west-46"},{"code":"X74","route":"Dumfries - Glasgow","id":"west-47"},{"code":"76","route":"Cumnock / New Cumnock - Kilmarnock Bus Station","id":"west-48"},{"code":"X76","route":"Hillhead University Union - Ardle Avenue","id":"west-49"},{"code":"X76B","route":"Muirkirk - Cumnock","id":"west-50"},{"code":"X77","route":"Hillhead University Union - Alloway Burns Birthplace Museum","id":"west-51"},{"code":"X77K","route":"Glasgow Buchanan Bus Station - Ayr Bus Station","id":"west-52"},{"code":"X78","route":"Glasgow Buchanan Bus Station - Kilmarnock Bus Station - Barassie, Troon","id":"west-53"},{"code":"X79","route":"Irvine Cross - Kilmarnock","id":"west-54"},{"code":"97","route":"Ayr Bus Station - Craig Tara Holiday Park","id":"west-55"},{"code":"110","route":"Templehill, Troon - Kilmarnock Bus Station","id":"west-56"},{"code":"301","route":"Ayr Fullarton Street - Holmston Shavin Brae","id":"west-57"},{"code":"302","route":"Prestwick Carnell Crescent - Ayr Fullarton Street","id":"west-58"},{"code":"306","route":"Marchburn, Ayr - Hillfoot Road, Ayr","id":"west-59"},{"code":"322","route":"Brodick - Blackwaterfoot","id":"west-60"},{"code":"323","route":"Brodick Douglas Place - Blackwaterfoot Ferry Cottage","id":"west-61"},{"code":"323A","route":"Brodick Douglas Place - Blackwaterfoot Ferry Cottage","id":"west-62"},{"code":"324","route":"Brodick - Blackwaterfoot","id":"west-63"},{"code":"343","route":"Ayr Bus Station - New Cumnock","id":"west-64"},{"code":"347","route":"Douglas Street, Ayr - Kerse Terrace, Rankinston","id":"west-65"},{"code":"352","route":"Ayr Bus Station - Burnton Turning Circle","id":"west-66"},{"code":"356","route":"Bellsbank Terminus - Cumnock Tanyard","id":"west-67"},{"code":"358","route":"Ayr Bus Station - Stranraer Cross","id":"west-68"},{"code":"360","route":"Ayr Bus Station - Stranraer Cross","id":"west-69"},{"code":"361","route":"Straiton - Dunure","id":"west-70"},{"code":"585","route":"Largs Laverock Drive - Ayr Bus Station","id":"west-71"},{"code":"585A","route":"Largs Brisbane Glen - Stevenston Golf Avenue","id":"west-72"},{"code":"X585","route":"Ardrossan Princes Street - Largs Manse Court","id":"west-73"}];

const GROUPS=[['1-9','Services 1–9'],['10-19','Services 10–19'],['20-29','Services 20–29'],['30-39','Services 30–39'],['40-49','Services 40–49'],['50-59','Services 50–59'],['60-69','Services 60–69'],['70-79','Services 70–79'],['80-89','Services 80–89'],['90-99','Services 90–99'],['X','X Services'],['OTHER','Other services']];
const $=id=>document.getElementById(id);
function getServices(){let source=null;try{source=JSON.parse(localStorage.getItem('serviceCoverageList')||'null');}catch(e){}if(!Array.isArray(source)||!source.length)source=Array.isArray(window.INSPECTOR_SERVICES)?window.INSPECTOR_SERVICES:[];return source.map(item=>typeof item==='string'?{code:item.trim(),route:'',aliases:[]}:{code:String(item.code||item.service||'').trim(),route:String(item.route||item.description||'').trim(),aliases:Array.isArray(item.aliases)?item.aliases:[]}).filter(item=>item.code);}
function groupFor(code){const c=String(code||'').trim().toUpperCase();if(c.startsWith('X'))return'X';const m=c.match(/^(\d+)/);if(!m)return'OTHER';const n=Number(m[1]);if(n>=1&&n<=9)return'1-9';if(n>=10&&n<=19)return'10-19';if(n>=20&&n<=29)return'20-29';if(n>=30&&n<=39)return'30-39';if(n>=40&&n<=49)return'40-49';if(n>=50&&n<=59)return'50-59';if(n>=60&&n<=69)return'60-69';if(n>=70&&n<=79)return'70-79';if(n>=80&&n<=89)return'80-89';if(n>=90&&n<=99)return'90-99';return'OTHER';}
function uniqueServices(list){const seen=new Set();return list.filter(item=>{const key=(item.code+'|'+item.route).toLowerCase();if(seen.has(key))return false;seen.add(key);return true;});}
function buildSelector(input){
 if(!input||input.dataset.serviceSelectReady==='1')return;input.dataset.serviceSelectReady='1';input.type='hidden';input.removeAttribute('list');
 const wrapper=document.createElement('div');wrapper.className='serviceSelectWrap';wrapper.dataset.forService=input.id;
 const group=document.createElement('select');group.className='field serviceGroupSelect';group.innerHTML='<option value="">Select service group</option>'+GROUPS.map(g=>'<option value="'+g[0]+'">'+g[1]+'</option>').join('');
 const service=document.createElement('select');service.className='field serviceCodeSelect';service.disabled=true;service.innerHTML='<option value="">Select service</option>';
 const manual=document.createElement('input');manual.type='text';manual.className='field serviceManualEntry';manual.placeholder='Or enter service manually';manual.autocomplete='off';manual.style.display='none';
 const route=document.createElement('div');route.className='small serviceRouteText';route.textContent='Choose a group, then select the exact service, or enter it manually.';
 wrapper.append(group,service,manual,route);input.before(wrapper);
 function fillServices(){const selectedGroup=group.value;const items=uniqueServices(getServices().filter(x=>groupFor(x.code)===selectedGroup));service.innerHTML='<option value="">Select service</option>'+items.map((x,i)=>'<option value="'+i+'">'+x.code+(x.route?' — '+x.route:'')+'</option>').join('')+'<option value="__manual__">Enter service manually…</option>';service._items=items;service.disabled=!selectedGroup;manual.style.display='none';manual.value='';input.value='';route.textContent=selectedGroup?(items.length?'Select a service or choose manual entry.':'No services in this group; choose manual entry.'):'Choose a group, then select the exact service, or enter it manually.';}
 group.addEventListener('change',fillServices);
 service.addEventListener('change',()=>{const item=service._items&&service._items[Number(service.value)];if(service.value==='__manual__'){manual.style.display='block';manual.focus();input.value=manual.value;route.textContent='Manual service entry';}else{manual.style.display='none';manual.value='';input.value=item?item.code:'';route.textContent=item?(item.route||item.code):'Select a service or enter it manually.';}input.dispatchEvent(new Event('change',{bubbles:true}));});
 manual.addEventListener('input',()=>{input.value=manual.value;route.textContent=manual.value?'Manual service: '+manual.value:'Enter the service code or name.';input.dispatchEvent(new Event('change',{bubbles:true}));});
 wrapper._refresh=function(){const current=input.value;const currentGroup=current?groupFor(current):group.value;if(currentGroup){group.value=currentGroup;fillServices();const items=service._items||[];const idx=items.findIndex(x=>x.code.toLowerCase()===current.toLowerCase());if(idx>=0){service.value=String(idx);route.textContent=items[idx].route||items[idx].code;input.value=current;}else if(current){service.value='__manual__';manual.value=current;manual.style.display='block';input.value=current;route.textContent='Manual service: '+current;}}};
}

/* The Inspector Check Sheet has one searchable service field instead of two dropdowns.
   Keep the original #csService field (hidden) so existing cloud saves and reports work. */
function buildInspectorSearch(){
 const input=$('csService');
 if(!input||input.dataset.inspectorServiceSearch==='1')return;
 input.dataset.inspectorServiceSearch='1';
 input.type='hidden';
 input.removeAttribute('list');
 const existing=document.querySelector('[data-for-service="csService"]');
 if(existing)existing.remove();
 const wrap=document.createElement('div');
 wrap.className='serviceSelectWrap inspectorServiceSearchWrap';
 wrap.dataset.forService='csService';
 // Region is selected automatically from the depot, not by an inspector.
 const region=document.createElement('input');
 region.type='hidden';
 region.id='csServiceRegion';
 region.value='east';
 function updateRegion(){
  const depot=String($('csDepot')?.value||'').trim().toLowerCase();
  const next=['ayr','ardrossan','kilmarnock'].includes(depot)?'west':'east';
  if(region.value===next)return;
  region.value=next;
  selected=null;wrap._selectedService=null;search.value='';
  close();emit('');
  help.textContent=next==='west'?'Search West Scotland services by number or route. Manual entry is also available.':'Type to narrow the results, then tap a service. You can also enter a service manually.';
  region.dispatchEvent(new Event('change',{bubbles:true}));
 }
 const label=document.createElement('label');
 label.className='inspectorServiceLabel';
 label.htmlFor='csServiceSearch';
 label.textContent='Service Number';
 const search=document.createElement('input');
 search.type='text';
 search.id='csServiceSearch';
 search.className='field inspectorServiceSearchInput';
 search.placeholder='Start typing service number or route';
 search.autocomplete='off';
 search.setAttribute('role','combobox');
 search.setAttribute('aria-autocomplete','list');
 search.setAttribute('aria-expanded','false');
 search.setAttribute('aria-controls','csServiceSuggestions');
 const suggestions=document.createElement('div');
 suggestions.id='csServiceSuggestions';
 suggestions.className='inspectorServiceSuggestions';
 suggestions.setAttribute('role','listbox');
 const help=document.createElement('div');
 help.className='small inspectorServiceHint';
 help.textContent='Type to narrow the results, then tap a service. You can also enter a service manually.';
 wrap.append(region,label,search,suggestions,help);
 input.before(wrap);
 let shown=[],active=-1,selected=null;
 const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const clean=s=>String(s??'').trim().toUpperCase();
 function options(){
  const expanded=(region.value==='west'?WEST_SCOTLAND_SERVICES:getServices()).flatMap(item=>{
   const variants=item.code.split(/[\/,;&]+/).map(x=>x.trim()).filter(Boolean);
   return variants.map(code=>({code,route:item.route,aliases:item.aliases}));
  });
  return uniqueServices(expanded);
 }
 function close(){
  shown=[];active=-1;suggestions.innerHTML='';
  suggestions.classList.remove('show');
  search.setAttribute('aria-expanded','false');
  search.removeAttribute('aria-activedescendant');
 }
 function emit(code){input.value=code;input.dispatchEvent(new Event('change',{bubbles:true}));}
 function choose(item){
  selected={code:item.code,route:item.route};
  wrap._selectedService=selected;
  search.value=item.code;
  close();
  emit(item.code);
 }
 function draw(){
  const text=search.value.trim();
  if(!text){close();return;}
  const tokens=clean(text).split(/\s+/).filter(Boolean);
  const list=options().filter(item=>{
   const searchable=clean([item.code,item.route,...(item.aliases||[])].join(' '));
   return tokens.every(token=>searchable.includes(token));
  }).sort((a,b)=>{
   const score=x=>{
    const q=clean(text),code=clean(x.code);
    return code===q?0:code.startsWith(q)?1:code.includes(q)?2:3;
   };
   return score(a)-score(b)||a.code.localeCompare(b.code,undefined,{numeric:true})||a.route.localeCompare(b.route);
  });
  shown=list.slice(0,12);
  active=-1;
  suggestions.innerHTML=shown.map((x,i)=>'<button type="button" role="option" aria-selected="false" id="csServiceOption'+i+'" class="inspectorServiceOption" data-service-index="'+i+'"><strong>'+esc(x.code)+'</strong><span>'+esc(x.route||'Route not specified')+'</span></button>').join('')+
   (!list.length?'<div class="inspectorServiceNoMatch">No match. You can still enter this service manually.</div>':list.length>shown.length?'<div class="inspectorServiceNoMatch">More matches available — type more to narrow the list.</div>':'');
  suggestions.classList.add('show');
  search.setAttribute('aria-expanded','true');
 }
 function highlight(next){
  if(!shown.length)return;
  active=(next+shown.length)%shown.length;
  suggestions.querySelectorAll('[data-service-index]').forEach((button,i)=>{
   button.classList.toggle('active',i===active);
   button.setAttribute('aria-selected',String(i===active));
  });
  const row=$('csServiceOption'+active);
  if(row){search.setAttribute('aria-activedescendant',row.id);row.scrollIntoView({block:'nearest'});}
 }
 $('csDepot')?.addEventListener('change',updateRegion);
 document.addEventListener('change',e=>{if(e.target.id==='csDepot')updateRegion();});
 updateRegion();
 search.addEventListener('input',()=>{
  selected=null;wrap._selectedService=null;
  emit(search.value.trim());
  draw();
 });
 search.addEventListener('focus',draw);
 search.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'){e.preventDefault();if(!shown.length)draw();highlight(active+1);}
  else if(e.key==='ArrowUp'){e.preventDefault();if(!shown.length)draw();highlight(active-1);}
  else if(e.key==='Enter'&&shown.length){e.preventDefault();choose(shown[active<0?0:active]);}
  else if(e.key==='Escape')close();
 });
 suggestions.addEventListener('click',e=>{
  const option=e.target.closest('[data-service-index]');
  if(option&&shown[Number(option.dataset.serviceIndex)])choose(shown[Number(option.dataset.serviceIndex)]);
 });
 document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target))close();});
 wrap._selectedService=null;
 wrap._clear=()=>{selected=null;wrap._selectedService=null;search.value='';close();};
 wrap._refresh=()=>{
  if(document.activeElement!==search&&search.value!==input.value){
   search.value=input.value;selected=null;wrap._selectedService=null;
  }
  if(selected&&selected.code===input.value){
   const updated=options().find(item=>item.code===selected.code&&item.route===selected.route);
   if(!updated){selected=null;wrap._selectedService=null;}
  }
  if(suggestions.classList.contains('show'))draw();
 };
 const style=document.createElement('style');
 style.id='inspectorServiceSearchCss';
 style.textContent='.inspectorServiceSearchWrap{display:grid;gap:6px;min-width:0}.inspectorServiceLabel{font-size:13px;font-weight:800;color:#d8e5ef}.inspectorServiceSearchInput{width:100%;min-height:50px;box-sizing:border-box}.inspectorServiceSuggestions{display:none;max-height:265px;overflow-y:auto;border:1px solid #436b85;background:#0e2538;border-radius:10px;box-sizing:border-box}.inspectorServiceSuggestions.show{display:block}.inspectorServiceOption{display:block;width:100%;min-height:52px;text-align:left;padding:10px 12px;color:white;background:transparent;border:0;border-bottom:1px solid #29455a;cursor:pointer}.inspectorServiceOption strong{display:block;font-size:16px}.inspectorServiceOption span{display:block;margin-top:3px;font-size:12px;color:#bfd0dd;overflow-wrap:anywhere}.inspectorServiceOption.active,.inspectorServiceOption:focus-visible{background:#234a64;outline:2px solid #e8aa3d;outline-offset:-2px}.inspectorServiceNoMatch{padding:10px 12px;color:#c3d1dc;font-size:12px}.inspectorServiceHint{font-size:12px;color:#b8c5ce}';
 document.head.appendChild(style);
 if(input.value)search.value=input.value;
}

function refreshAll(){buildInspectorSearch();TARGETS.forEach(id=>{const input=$(id);if(input){buildSelector(input);const wrap=document.querySelector('[data-for-service="'+id+'"]');if(wrap&&wrap._refresh)wrap._refresh();}});}
function resetSelector(id){const input=$(id);if(input)input.value='';const wrap=document.querySelector('[data-for-service="'+id+'"]');if(id==='csService'){wrap?._clear?.();input?.dispatchEvent(new Event('change',{bubbles:true}));return;}if(!wrap)return;wrap.querySelectorAll('select').forEach((s,i)=>{s.value='';if(i===1)s.disabled=true;});const manual=wrap.querySelector('.serviceManualEntry');if(manual){manual.value='';manual.style.display='none';}const route=wrap.querySelector('.serviceRouteText');if(route)route.textContent='Choose a group, then select the exact service, or enter it manually.';}
function start(){refreshAll();setTimeout(refreshAll,500);setTimeout(refreshAll,1500);const previousClear=window.clearCheckForm;if(typeof previousClear==='function'&&!previousClear.__inspectorSearchWrapped){const wrapped=function(){const result=previousClear.apply(this,arguments);resetSelector('csService');return result;};wrapped.__inspectorSearchWrapped=true;window.clearCheckForm=wrapped;}document.addEventListener('click',e=>{if(e.target.id==='clearCheckFormBtn')setTimeout(()=>resetSelector('csService'),0);if(e.target.id==='clearTimingBtn'||e.target.id==='clearTimingFormBtn')setTimeout(()=>resetSelector('tcService'),0);if(e.target.id==='saveManualNsaBtn')setTimeout(()=>resetSelector('nsaService'),50);if(e.target.id==='addServiceBtn'||e.target.closest('[data-delete-service]'))setTimeout(refreshAll,100);});window.addEventListener('storage',e=>{if(e.key==='serviceCoverageList')refreshAll();});const oldSave=window.saveServices;if(typeof oldSave==='function'&&!oldSave.__serviceSelectWrapped){const wrapped=function(){const result=oldSave.apply(this,arguments);setTimeout(refreshAll,0);return result;};wrapped.__serviceSelectWrapped=true;window.saveServices=wrapped;}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();