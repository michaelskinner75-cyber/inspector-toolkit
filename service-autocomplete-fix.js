(function(){
'use strict';
const TARGETS=['tcService','nsaService'];
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
 wrap.append(label,search,suggestions,help);
 input.before(wrap);
 let shown=[],active=-1,selected=null;
 const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const clean=s=>String(s??'').trim().toUpperCase();
 function options(){
  const expanded=getServices().flatMap(item=>{
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