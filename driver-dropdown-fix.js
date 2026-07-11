(function(){
'use strict';

function applyDriverDropdownFix(){
  const driver=document.getElementById('csDriver');
  const suggestionWrap=document.getElementById('driverSuggestionWrap');
  if(!driver||!suggestionWrap)return false;

  document.getElementById('csEmployeeNumber')?.remove();

  let host=document.getElementById('driverAutocompleteHost');
  if(!host){
    host=document.createElement('div');
    host.id='driverAutocompleteHost';
    host.className='driverAutocompleteHost';
    driver.parentNode.insertBefore(host,driver);
    host.appendChild(driver);
    host.appendChild(suggestionWrap);
  }else{
    if(driver.parentNode!==host)host.insertBefore(driver,host.firstChild);
    if(suggestionWrap.parentNode!==host)host.appendChild(suggestionWrap);
  }

  if(!document.getElementById('driverDropdownPositionCss')){
    const style=document.createElement('style');
    style.id='driverDropdownPositionCss';
    style.textContent=`
      #checksheet .grid{overflow:visible!important}
      #driverAutocompleteHost{
        position:relative!important;
        width:100%!important;
        min-width:0!important;
        overflow:visible!important;
        z-index:80!important;
      }
      #driverAutocompleteHost #csDriver{
        display:block!important;
        width:100%!important;
        box-sizing:border-box!important;
        margin:0!important;
      }
      #driverAutocompleteHost .driverSuggestionWrap{
        position:absolute!important;
        top:calc(100% + 4px)!important;
        left:0!important;
        right:0!important;
        width:100%!important;
        margin:0!important;
        grid-column:auto!important;
        z-index:9999!important;
      }
      #driverAutocompleteHost .driverSuggestions{
        position:relative!important;
        top:auto!important;
        left:auto!important;
        right:auto!important;
        width:100%!important;
        box-sizing:border-box!important;
        margin:0!important;
        max-height:260px!important;
        overflow-y:auto!important;
        background:#102638!important;
        border:1px solid #3e6d8d!important;
        border-radius:0 0 10px 10px!important;
        box-shadow:0 10px 24px rgba(0,0,0,.45)!important;
      }
      #driverAutocompleteHost .driverSuggestion{
        width:100%!important;
        box-sizing:border-box!important;
      }
    `;
    document.head.appendChild(style);
  }
  return true;
}

function init(){
  if(applyDriverDropdownFix())return;
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(applyDriverDropdownFix()||attempts>30)clearInterval(timer);
  },200);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();