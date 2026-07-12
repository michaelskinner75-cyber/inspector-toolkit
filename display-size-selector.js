(function(){
'use strict';
const KEY='inspectorDisplaySize';
const MODES={phone:'Standard Phone',plus:'Large Phone',ipad:'iPad',laptop:'Laptop / PC'};
function chooseDefault(){
 const w=Math.max(document.documentElement.clientWidth||0,window.innerWidth||0);
 const h=Math.max(document.documentElement.clientHeight||0,window.innerHeight||0);
 if(w>=1000&&w>h)return'laptop';
 if(w>=700)return'ipad';
 if(w>=430)return'plus';
 return'phone';
}
function apply(mode){
 if(!MODES[mode])mode=chooseDefault();
 document.body.classList.remove('display-phone','display-plus','display-ipad','display-laptop','display-large');
 document.body.classList.add('display-'+mode);
 document.documentElement.dataset.displaySize=mode;
 localStorage.setItem(KEY,mode);
 document.querySelectorAll('[data-display-size]').forEach(b=>{
  const on=b.dataset.displaySize===mode;
  b.classList.toggle('selected',on);
  b.setAttribute('aria-pressed',String(on));
 });
}
function addStyles(){
 if(document.getElementById('displaySizeCss'))return;
 const s=document.createElement('style');
 s.id='displaySizeCss';
 s.textContent=`
 .displaySizeBox{margin:14px 0 10px;padding:12px;background:#081823;border:1px solid #36586f;border-radius:12px;text-align:left}
 .displaySizeTitle{font-size:13px;font-weight:900;text-align:center;margin-bottom:9px;color:#f4f3ee}
 .displaySizeChoices{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}
 .displaySizeChoice{min-height:66px;padding:8px 5px!important;background:#173a59!important;border:2px solid #47749a!important;font-size:12px!important;text-align:center!important;box-shadow:none!important}
 .displaySizeChoice .sizeIcon{display:block;font-size:23px;margin-bottom:4px}
 .displaySizeChoice.selected{background:#eea83e!important;color:#0b1b2b!important;border-color:#fff0c7!important}
 .displaySizeHint{text-align:center;color:#b8c5ce;font-size:11px;margin-top:8px}
 body.display-phone .wrap{max-width:430px;padding:4px}
 body.display-phone .machine{padding:6px;border-width:3px;border-radius:12px}
 body.display-phone .brandHeader{padding:8px;gap:6px}
 body.display-phone .brandLogo{max-height:115px}
 body.display-phone .brandTitle{font-size:20px}
 body.display-phone .nav,body.display-phone .grid,body.display-phone .grid2{grid-template-columns:1fr!important}
 body.display-phone .nav button{min-height:58px;font-size:14px;padding:10px 31px 10px 9px}
 body.display-phone button,body.display-phone .btn,body.display-phone .backBtn{font-size:14px;padding:11px 8px}
 body.display-phone .field,body.display-phone .searchBar{font-size:16px;padding:11px}
 body.display-phone .filterBar{grid-template-columns:repeat(2,1fr)!important}
 body.display-phone .coverageSummary,body.display-phone .dbStats{grid-template-columns:repeat(2,1fr)!important}
 body.display-phone .loggedInBox{grid-template-columns:1fr!important}
 body.display-phone .loginPage{padding:8px;align-items:flex-start;overflow:auto}
 body.display-phone .loginCard{margin-top:8px;padding:12px;border-width:3px}
 body.display-phone .loginTitle{font-size:20px;padding:11px}
 body.display-phone .displaySizeChoices{grid-template-columns:1fr}
 body.display-phone .displaySizeChoice{min-height:48px;display:flex;align-items:center;justify-content:center;gap:9px}
 body.display-phone .displaySizeChoice .sizeIcon{display:inline;margin:0}
 body.display-plus .wrap{max-width:620px;padding:7px}
 body.display-plus .machine{padding:9px;border-width:4px}
 body.display-plus .nav,body.display-plus .grid,body.display-plus .grid2{grid-template-columns:repeat(2,1fr)!important}
 body.display-plus .nav button{min-height:70px}
 body.display-plus .brandLogo{max-height:155px}
 body.display-ipad .wrap{max-width:900px;min-height:100vh;padding:8px 10px 14px}
 body.display-ipad .machine{min-height:calc(100vh - 22px);padding:14px;border-width:4px;display:flex;flex-direction:column}
 body.display-ipad .brandHeader{padding:14px 16px}
 body.display-ipad .brandLogo{width:min(320px,46%);max-height:165px}
 body.display-ipad .brandTitle{font-size:30px}
 body.display-ipad #home.active{display:flex;flex:1;flex-direction:column;min-height:calc(100vh - 285px)}
 body.display-ipad #home>.panel{margin-top:10px}
 body.display-ipad #home>.nav{flex:1;align-content:stretch;grid-auto-rows:minmax(88px,1fr)}
 body.display-ipad .nav{grid-template-columns:repeat(2,1fr)!important;gap:13px;margin-top:14px}
 body.display-ipad .grid{grid-template-columns:repeat(2,1fr)!important;gap:11px}
 body.display-ipad .grid2{grid-template-columns:repeat(2,1fr)!important;gap:11px}
 body.display-ipad .nav button{min-height:88px;font-size:17px;padding:16px 40px 16px 16px}
 body.display-ipad .nav button::before{font-size:27px}
 body.display-ipad .panel,body.display-ipad .log{padding:15px}
 body.display-ipad .field,body.display-ipad .searchBar{font-size:17px;padding:14px}
 body.display-ipad button,body.display-ipad .btn,body.display-ipad .backBtn{font-size:16px}
 body.display-ipad .serviceFrame{height:760px}
 body.display-laptop .wrap{max-width:1380px;padding:16px}
 body.display-laptop .machine{padding:18px}
 body.display-laptop .nav{grid-template-columns:repeat(4,1fr)!important;gap:12px}
 body.display-laptop .grid{grid-template-columns:repeat(3,1fr)!important;gap:12px}
 body.display-laptop .grid2{grid-template-columns:repeat(2,1fr)!important;gap:12px}
 body.display-laptop .nav button{min-height:80px;font-size:16px}
 body.display-laptop .panel,body.display-laptop .log{padding:18px}
 body.display-laptop .field,body.display-laptop .searchBar{font-size:17px;padding:14px}
 body.display-laptop .brandTitle{font-size:34px}
 body.display-laptop .serviceFrame{height:780px}
 @media(max-width:760px){body.display-ipad .nav,body.display-ipad .grid,body.display-ipad .grid2,body.display-laptop .nav,body.display-laptop .grid,body.display-laptop .grid2{grid-template-columns:1fr!important}}
 `;
 document.head.appendChild(s);
}
function build(){
 const card=document.querySelector('#loginPage .loginCard');
 if(!card||document.getElementById('displaySizeBox'))return;
 const version=document.getElementById('loginVersion');
 const box=document.createElement('div');
 box.id='displaySizeBox';box.className='displaySizeBox';
 box.innerHTML='<div class="displaySizeTitle">Choose screen layout</div><div class="displaySizeChoices"><button type="button" class="displaySizeChoice" data-display-size="phone"><span class="sizeIcon">📱</span>Standard Phone</button><button type="button" class="displaySizeChoice" data-display-size="plus"><span class="sizeIcon">📲</span>Large Phone</button><button type="button" class="displaySizeChoice" data-display-size="ipad"><span class="sizeIcon">▯</span>iPad</button><button type="button" class="displaySizeChoice" data-display-size="laptop"><span class="sizeIcon">💻</span>Laptop / PC</button></div><div class="displaySizeHint">Your choice is remembered for next time.</div>';
 if(version)card.insertBefore(box,version);else{const loginBtn=document.getElementById('loginBtn');if(loginBtn)card.insertBefore(box,loginBtn);else card.appendChild(box);}
 box.addEventListener('click',e=>{const b=e.target.closest('[data-display-size]');if(b)apply(b.dataset.displaySize);});
 apply(localStorage.getItem(KEY)||chooseDefault());
}
function init(){addStyles();apply(localStorage.getItem(KEY)||chooseDefault());build();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();