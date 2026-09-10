(function(){
'use strict';
const $=id=>document.getElementById(id);
function addStyle(){
 if($('homeStopRefreshCss'))return;
 const s=document.createElement('style');
 s.id='homeStopRefreshCss';
 s.textContent='.homeUseLocationBtn{display:block;width:calc(100% - 20px);margin:0 10px 10px!important;min-height:44px!important;background:#173d5c!important;border:1px solid #5b84a0!important;color:#fff!important;font-size:12px!important;font-weight:900!important;letter-spacing:.02em}.homeUseLocationBtn:disabled{opacity:.65}.homeUseLocationBtn.locating{position:relative}.homeUseLocationBtn.locating:after{content:"";display:inline-block;width:12px;height:12px;margin-left:8px;border:2px solid rgba(255,255,255,.45);border-top-color:#fff;border-radius:50%;vertical-align:-2px;animation:homeLocationSpin .8s linear infinite}@keyframes homeLocationSpin{to{transform:rotate(360deg)}}';
 document.head.appendChild(s);
}
function openCard(){
 const body=$('homeNearestBody'),toggle=$('homeNearestToggle'),chev=$('homeNearestChevron');
 if(body&&body.hidden){body.hidden=false;if(toggle)toggle.setAttribute('aria-expanded','true');if(chev)chev.textContent='⌃';}
}
function waitForFinder(){
 return new Promise((resolve,reject)=>{
  let tries=0;
  const check=()=>{
   if(typeof window.inspectorFindNearbyStops==='function'){resolve(window.inspectorFindNearbyStops);return;}
   if(++tries>20){reject(new Error('Location lookup unavailable'));return;}
   setTimeout(check,150);
  };
  check();
 });
}
async function useCurrentLocation(btn){
 if(btn.disabled)return;
 openCard();
 const name=$('homeNearestStopName'),meta=$('homeNearestStopMeta'),box=$('homeNearbyStops'),pick=$('homePickNearby');
 btn.disabled=true;btn.classList.add('locating');btn.textContent='FINDING NEARBY STOPS';
 if(name)name.textContent='Finding nearby bus stops…';
 if(meta)meta.textContent='Checking your current location…';
 if(box)box.hidden=true;
 try{
  const finder=await waitForFinder();
  const stops=await finder(true);
  if(!stops||!stops.length)throw new Error('No nearby stops found');
  window.inspectorNearbyStops={...(window.inspectorNearbyStops||{}),stops:stops.slice(),updated:Date.now()};
  document.dispatchEvent(new CustomEvent('inspector-nearby-stops',{detail:window.inspectorNearbyStops}));
  setTimeout(()=>{
   if(box)box.hidden=false;
   if(pick){pick.style.display='';pick.textContent='HIDE NEARBY STOPS';}
  },50);
 }catch(e){
  if(name)name.textContent='Unable to find nearby stops';
  if(meta)meta.textContent='Check location access, then tap Use Current Location again.';
 }finally{
  btn.disabled=false;btn.classList.remove('locating');btn.textContent='📍 USE CURRENT LOCATION';
 }
}
function addControl(){
 const card=$('homeNearestStopCard'),body=$('homeNearestBody');
 if(!card||!body)return false;
 const old=$('homeNearestRefresh');if(old)old.remove();
 let btn=$('homeUseCurrentLocation');
 if(!btn){
  btn=document.createElement('button');btn.type='button';btn.id='homeUseCurrentLocation';btn.className='btn homeUseLocationBtn';btn.textContent='📍 USE CURRENT LOCATION';
  body.before(btn);btn.onclick=e=>{e.preventDefault();e.stopPropagation();useCurrentLocation(btn);};
 }
 const cached=window.inspectorNearbyStops;
 const pick=$('homePickNearby');
 if(pick&&!cached?.stops?.length)pick.style.display='none';
 const name=$('homeNearestStopName'),meta=$('homeNearestStopMeta');
 if(!cached?.stops?.length&&name&&/finding|waiting|unable/i.test(name.textContent||'')){
  name.textContent='Find a nearby bus stop';
  if(meta)meta.textContent='Tap Use Current Location, then choose the stop you want.';
 }
 return true;
}
function init(){
 addStyle();
 let n=0;const t=setInterval(()=>{n++;if(addControl()||n>100)clearInterval(t);},200);
 document.addEventListener('inspector-nearby-stops',e=>{if(e.detail?.stops?.length){const pick=$('homePickNearby');if(pick)pick.style.display='';}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,900));else setTimeout(init,900);
})();