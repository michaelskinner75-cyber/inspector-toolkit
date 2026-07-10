(()=>{
  function getServices(){
    try{
      const saved=JSON.parse(localStorage.getItem('serviceCoverageList')||'null');
      if(Array.isArray(saved)&&saved.length)return saved;
    }catch(e){console.warn('Could not read saved service list',e);}
    return Array.isArray(window.INSPECTOR_SERVICES)?window.INSPECTOR_SERVICES:[];
  }

  function buildServiceList(){
    let list=document.getElementById('serviceCoverageOptions');
    if(!list){
      list=document.createElement('datalist');
      list.id='serviceCoverageOptions';
      document.body.appendChild(list);
    }
    const services=getServices();
    list.innerHTML=services
      .slice()
      .sort((a,b)=>String(a.code||'').localeCompare(String(b.code||''),undefined,{numeric:true})||String(a.route||'').localeCompare(String(b.route||'')))
      .map(s=>`<option value="${String(s.code||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}" label="${String(s.route||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}"></option>`)
      .join('');
  }

  function attach(){
    buildServiceList();
    ['csService','tcService'].forEach(id=>{
      const field=document.getElementById(id);
      if(!field)return;
      field.setAttribute('list','serviceCoverageOptions');
      field.setAttribute('autocomplete','off');
      field.addEventListener('focus',buildServiceList);
      field.addEventListener('input',buildServiceList);
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);
  else attach();

  document.addEventListener('click',e=>{
    if(e.target?.id==='addServiceBtn'||e.target?.dataset?.deleteService!==undefined){
      setTimeout(buildServiceList,50);
    }
  });
})();
