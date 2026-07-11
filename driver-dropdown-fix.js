(function(){
'use strict';

function attachDropdown(){
  const driver=document.getElementById('csDriver');
  const wrap=document.getElementById('driverSuggestionWrap');
  const status=document.getElementById('csEmployeeLookupStatus');
  if(!driver||!wrap)return false;

  document.getElementById('csEmployeeNumber')?.remove();

  const parent=driver.parentElement;
  if(!parent)return false;

  if(wrap.parentElement!==parent)driver.insertAdjacentElement('afterend',wrap);
  else if(driver.nextElementSibling!==wrap)driver.insertAdjacentElement('afterend',wrap);

  if(status){
    if(status.parentElement!==parent)wrap.insertAdjacentElement('afterend',status);
    else if(wrap.nextElementSibling!==status)wrap.insertAdjacentElement('afterend',status);
  }

  parent.style.position='relative';
  parent.style.overflow='visible';

  if(!document.getElementById('driverDropdownPositionCss')){
    const style=document.createElement('style');
    style.id='driverDropdownPositionCss';
    style.textContent=`
      #checksheet #driverSuggestionWrap{
        display:block!important;
        position:static!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        margin:0!important;
        padding:0!important;
        transform:none!important;
        grid-column:auto!important;
        z-index:auto!important;
      }
      #checksheet #driverSuggestions{
        display:none;
        position:static!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        box-sizing:border-box!important;
        margin:-1px 0 0!important;
        padding:0!important;
        transform:none!important;
        max-height:240px!important;
        overflow-x:hidden!important;
        overflow-y:auto!important;
        -webkit-overflow-scrolling:touch;
        background:#102638!important;
        border:1px solid #3e6d8d!important;
        border-top:0!important;
        border-radius:0 0 10px 10px!important;
        box-shadow:0 10px 22px rgba(0,0,0,.42)!important;
      }
      #checksheet #driverSuggestions.show{display:block!important}
      #checksheet #driverSuggestions .driverSuggestion{
        display:block!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        box-sizing:border-box!important;
        margin:0!important;
        padding:11px 13px!important;
        text-align:left!important;
        white-space:normal!important;
      }
      #checksheet #csEmployeeLookupStatus{
        display:block!important;
        position:static!important;
        width:100%!important;
        margin:5px 0 0!important;
        grid-column:auto!important;
      }
      @media(max-width:430px){
        #checksheet #driverSuggestions{max-height:200px!important}
        #checksheet #driverSuggestions .driverSuggestion{padding:10px 11px!important}
      }
    `;
    document.head.appendChild(style);
  }

  return true;
}

function init(){
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(attachDropdown()||attempts>40)clearInterval(timer);
  },200);

  const sheet=document.getElementById('checksheet');
  if(sheet){
    const observer=new MutationObserver(()=>attachDropdown());
    observer.observe(sheet,{childList:true,subtree:true});
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();