(function(){
  function getServices(){
    try{
      const saved=JSON.parse(localStorage.getItem('serviceCoverageList')||'null');
      if(Array.isArray(saved)&&saved.length)return saved;
    }catch(e){}
    return Array.isArray(window.INSPECTOR_SERVICES)?window.INSPECTOR_SERVICES:[];
  }

  function ensureList(id){
    let list=document.getElementById(id);
    if(!list){
      list=document.createElement('datalist');
      list.id=id;
      document.body.appendChild(list);
    }
    return list;
  }

  function rebuild(){
    const services=getServices();
    const list=ensureList('serviceCoverageOptions');
    list.innerHTML='';
    services.forEach(s=>{
      if(!s||!s.code)return;
      const option=document.createElement('option');
      option.value=String(s.code).trim();
      option.label=(s.route||'').trim();
      option.textContent=(s.route||'').trim();
      list.appendChild(option);
    });
    ['csService','tcService','nsaService'].forEach(id=>{
      const input=document.getElementById(id);
      if(input){
        input.setAttribute('list','serviceCoverageOptions');
        input.setAttribute('autocomplete','off');
      }
    });
  }

  function start(){
    rebuild();
    setTimeout(rebuild,500);
    setTimeout(rebuild,1500);

    const originalSave=window.saveServices;
    if(typeof originalSave==='function'&&!originalSave.__autocompleteWrapped){
      const wrapped=function(){
        const result=originalSave.apply(this,arguments);
        rebuild();
        return result;
      };
      wrapped.__autocompleteWrapped=true;
      window.saveServices=wrapped;
    }

    document.addEventListener('click',e=>{
      if(e.target&&(
        e.target.id==='addServiceBtn'||
        e.target.matches('[data-delete-service]')
      )) setTimeout(rebuild,50);
    });
    window.addEventListener('storage',e=>{
      if(e.key==='serviceCoverageList')rebuild();
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
  else start();
})();