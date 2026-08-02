(function(){
'use strict';
const $=id=>document.getElementById(id);
const OPTIONS=[
 ['today','Today'],['yesterday','Yesterday'],['week','This Week'],['lastweek','Last Week'],
 ['month','This Month'],['lastmonth','Last Month'],['30days','Last 30 Days'],['90days','Last 90 Days'],
 ['year','This Year'],['all','All Time'],['custom','Exact Date Range']
];
function build(){
 const filters=document.querySelector('#managementSummary .mgFilters');
 if(!filters||$('mgRangeSelectWrap'))return false;
 filters.style.display='none';
 const wrap=document.createElement('div');
 wrap.id='mgRangeSelectWrap';
 wrap.className='mgRangeSelectWrap';
 wrap.innerHTML='<label for="mgRangeSelect">Reporting Period</label><select id="mgRangeSelect" class="field">'+OPTIONS.map(o=>'<option value="'+o[0]+'">'+o[1]+'</option>').join('')+'</select>';
 filters.parentNode.insertBefore(wrap,filters);
 const select=$('mgRangeSelect');
 select.addEventListener('change',()=>{
   const button=document.querySelector('[data-mg-range="'+select.value+'"]');
   if(button)button.click();
 });
 sync();
 return true;
}
function sync(){
 const select=$('mgRangeSelect');
 if(!select)return;
 const selected=document.querySelector('[data-mg-range].selected');
 const active=selected?.dataset.mgRange||window.MANAGEMENT_DATE_FILTER?.range||'month';
 if(select.value!==active)select.value=active;
}
function style(){
 if($('mgRangeDropdownCss'))return;
 const s=document.createElement('style');
 s.id='mgRangeDropdownCss';
 s.textContent='.mgRangeSelectWrap{margin:10px 0}.mgRangeSelectWrap label{display:block;margin-bottom:5px;font-size:12px;color:#b8c5ce;font-weight:800}.mgRangeSelectWrap select{width:100%;min-height:48px;font-size:16px;font-weight:800}.mgFilterRow{grid-template-columns:minmax(0,2fr) minmax(190px,1fr)!important}.mgCustomRange{margin-top:2px!important}@media(max-width:700px){.mgFilterRow{grid-template-columns:1fr!important}.mgRangeSelectWrap select{min-height:52px;font-size:17px}}';
 document.head.appendChild(s);
}
function init(){
 style();
 let tries=0;
 const timer=setInterval(()=>{tries++;if(build()||tries>60)clearInterval(timer);sync();},200);
 document.addEventListener('click',e=>{if(e.target.closest('[data-mg-range]')||e.target.closest('[data-open="managementSummary"]'))setTimeout(sync,30);});
 window.addEventListener('managementDateRangeChanged',sync);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();