(function(){
'use strict';

function applyDriverDropdownFix(){
  const driver=document.getElementById('csDriver');
  const suggestionWrap=document.getElementById('driverSuggestionWrap');
  const status=document.getElementById('csEmployeeLookupStatus');
  if(!driver||!suggestionWrap)return false;

  document.getElementById('csEmployeeNumber')?.remove();

  let host=document.getElementById('driverAutocompleteHost');
  if(!host){
    host=document.createElement('div');
    host.id='driverAutocompleteHost';
    host.className='driverAutocompleteHost';
    driver.parentNode.insertBefore(host,driver);
  }

  if(driver.parentNode!==host)host.appendChild(driver);
  if(status&&status.parentNode!==host)host.appendChild(status);
  if(suggestionWrap.parentNode!==host)host.appendChild(suggestionWrap);

  const fieldBlock=host.closest('.fieldBlock');
  if(fieldBlock)fieldBlock.style.overflow='visible';

  if(!document.getElementById('driverDropdownPositionCss')){
    const style=document.createElement('style');
    style.id='driverDropdownPositionCss';
    style.textContent=`
      #checksheet,#checksheet .formSection,#checksheet .sectionGrid,
      #checksheet .fieldBlock{overflow:visible!important}

      #driverAutocompleteHost{
        position:relative!important;
        display:block!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        overflow:visible!important;
        z-index:500!important;
      }

      #driverAutocompleteHost #csDriver{
        display:block!important;
        position:relative!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        box-sizing:border-box!important;
        margin:0!important;
        z-index:2!important;
      }

      #driverAutocompleteHost .employeeLookupStatus{
        display:block!important;
        position:relative!important;
        width:100%!important;
        margin:5px 0 0!important;
        grid-column:auto!important;
        z-index:2!important;
      }

      #driverAutocompleteHost .driverSuggestionWrap{
        display:block!important;
        position:absolute!important;
        top:calc(100% + 3px)!important;
        left:0!important;
        right:0!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        margin:0!important;
        padding:0!important;
        transform:none!important;
        grid-column:auto!important;
        z-index:99999!important;
      }

      #driverAutocompleteHost .driverSuggestions{
        display:none;
        position:static!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        box-sizing:border-box!important;
        margin:0!important;
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
        box-shadow:0 12px 25px rgba(0,0,0,.5)!important;
      }

      #driverAutocompleteHost .driverSuggestions.show{display:block!important}

      #driverAutocompleteHost .driverSuggestion{
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

      @media(max-width:430px){
        #driverAutocompleteHost .driverSuggestions{max-height:210px!important}
        #driverAutocompleteHost .driverSuggestion{padding:10px 11px!important}
      }
    `;
    document.head.appendChild(style);
  }

  return true;
}

function keepAttached(){
  applyDriverDropdownFix();
}

function init(){
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    keepAttached();
    if(attempts>40)clearInterval(timer);
  },200);

  const observer=new MutationObserver(()=>keepAttached());
  const sheet=document.getElementById('checksheet');
  if(sheet)observer.observe(sheet,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();