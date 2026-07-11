(function(){
'use strict';
if(document.getElementById('smallScreenPolishCss'))return;
const style=document.createElement('style');
style.id='smallScreenPolishCss';
style.textContent=`
/* Clear selected inspector state on every screen size */
.loginChoice.selected{
  background:#48a17f!important;
  border-color:#83d8b7!important;
  color:#fff!important;
  box-shadow:0 0 0 3px rgba(72,161,127,.28),0 8px 18px rgba(0,0,0,.25)!important;
  transform:translateY(-2px);
}
.loginChoice.selected::after{content:' ✓';font-weight:900}

/* Keep all controls inside their containers */
*,*::before,*::after{box-sizing:border-box}
input,select,textarea,button{max-width:100%}
#checksheet #csDate{width:100%!important;max-width:100%!important;min-width:0!important}

@media(max-width:430px){
  body{overflow-x:hidden!important}
  .wrap{width:100%!important;max-width:none!important;padding:8px!important;margin:0!important}
  .machine{width:100%!important;max-width:none!important;padding:10px!important;border-width:3px!important;border-radius:18px!important}
  .section{padding:0!important}
  .panel,#checksheet .formSection{padding:10px!important;margin:9px 0 12px!important;border-radius:12px!important}
  h2{font-size:24px!important;margin:10px 0 12px!important}
  h3{font-size:18px!important}
  .backBtn{padding:9px 13px!important;font-size:14px!important;margin-bottom:6px!important}

  .field,input.field,select.field,textarea.field,
  #checksheet input,#checksheet select,#checksheet textarea{
    width:100%!important;min-width:0!important;max-width:100%!important;
    min-height:50px!important;height:auto!important;
    padding:11px 12px!important;font-size:16px!important;border-radius:10px!important;
  }
  #checksheet input[type='date'],#checksheet input[type='time']{
    display:block!important;width:100%!important;max-width:100%!important;
    min-height:50px!important;height:50px!important;padding:8px 10px!important;
    font-size:16px!important;text-align:left!important;
  }
  #checksheet #csDriver{height:50px!important;min-height:50px!important;max-height:50px!important}
  #checksheet .sectionGrid,#checksheet .sectionGrid.inspectionRows,
  .grid,.grid2{grid-template-columns:1fr!important;gap:8px!important}
  #checksheet .fieldBlock{gap:4px!important}
  #checksheet .fieldBlock>label{font-size:13px!important}
  #checksheet .formSectionTitle{font-size:19px!important;padding:8px 10px!important;margin-bottom:9px!important}
  #checksheet .checkStatusBar{padding:8px 5px!important;gap:3px!important;margin-bottom:10px!important}
  #checksheet .checkStatusItem{font-size:10px!important}
  #checksheet .checkStatusItem b{font-size:12px!important}
  .btn{min-height:46px!important;padding:10px 12px!important;font-size:14px!important}
  .nav{gap:8px!important}
  .nav button{min-height:58px!important;padding:10px!important;font-size:14px!important}
  .filterBar{gap:7px!important}
  .filterBar button{min-height:44px!important;padding:8px!important;font-size:13px!important}
  .compactCheck,.nsaCard,.employeeCard{padding:10px!important;margin:8px 0!important}
  .compactMain{font-size:13px!important;line-height:1.35!important}
  .compactSub,.small{font-size:11px!important}
  .coverageSummary{gap:6px!important}
  .coverageStat{padding:8px 5px!important;font-size:11px!important}

  .loginPage{padding:14px!important;align-items:center!important}
  .loginCard{width:100%!important;max-width:390px!important;padding:18px 14px!important;border-radius:18px!important}
  .loginTitle{font-size:26px!important;padding:14px 8px!important}
  .loginCard h2{font-size:25px!important;margin:18px 0 8px!important}
  .loginCard p{font-size:16px!important;margin:6px 0 14px!important}
  .loginChoices{display:grid!important;grid-template-columns:1fr 1fr!important;gap:9px!important}
  .loginChoice{width:100%!important;min-width:0!important;min-height:54px!important;padding:9px 6px!important;font-size:16px!important}
  .loginChoice[data-login-name='Other']{grid-column:1/-1!important;width:50%!important;justify-self:center!important}
  .loginSelectionText{font-size:16px!important;margin:10px 0!important}
  .loginBtn{width:100%!important;min-height:52px!important;font-size:17px!important}
  .credit{font-size:12px!important}
}

@media(max-width:375px){
  .wrap{padding:5px!important}
  .machine{padding:7px!important}
  .loginCard{padding:15px 10px!important}
  .loginTitle{font-size:23px!important}
  .nav button{font-size:13px!important}
}
`;
document.head.appendChild(style);
})();