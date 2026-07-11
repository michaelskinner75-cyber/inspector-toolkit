(function(){
'use strict';
const PIN_HASH='5d79ec69';
const SESSION_KEY='employeeDirectoryUnlocked';
const ADMIN_INSPECTOR='M Skinner';
const byId=id=>document.getElementById(id);

function hashPin(value){
  let h=2166136261;
  const s=String(value||'');
  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return (h>>>0).toString(16);
}

function currentInspector(){
  if(typeof getInspector==='function')return getInspector();
  return localStorage.getItem('activeInspector')||'';
}

function isMichael(){return currentInspector()===ADMIN_INSPECTOR;}
function unlocked(){return isMichael()&&sessionStorage.getItem(SESSION_KEY)==='1';}

function updateVisibility(){
  const button=document.querySelector('[data-open="employeeDirectory"]');
  if(button)button.style.display=isMichael()?'':'none';

  if(!isMichael()){
    sessionStorage.removeItem(SESSION_KEY);
    const directory=byId('employeeDirectory');
    if(directory&&directory.classList.contains('active')){
      directory.classList.remove('active');
      byId('home')?.classList.add('active');
    }
  }
}

function requestPin(){
  if(!isMichael())return false;
  if(unlocked())return true;
  const entered=prompt('Enter Employee Directory PIN');
  if(entered===null)return false;
  if(hashPin(entered)!==PIN_HASH){
    alert('Incorrect PIN.');
    return false;
  }
  sessionStorage.setItem(SESSION_KEY,'1');
  return true;
}

function protectDirectoryClick(e){
  const button=e.target.closest('[data-open="employeeDirectory"]');
  if(!button)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if(!isMichael())return;
  if(requestPin()&&typeof openSection==='function')openSection('employeeDirectory');
}

function protectDirectAccess(){
  updateVisibility();
  const directory=byId('employeeDirectory');
  if(!directory||!directory.classList.contains('active'))return;
  if(isMichael()&&unlocked())return;
  directory.classList.remove('active');
  byId('home')?.classList.add('active');
}

function clearOnLogout(){
  const logout=byId('changeInspectorBtn');
  if(logout)logout.addEventListener('click',()=>{
    sessionStorage.removeItem(SESSION_KEY);
    setTimeout(updateVisibility,0);
  },true);
}

function init(){
  document.addEventListener('click',protectDirectoryClick,true);
  clearOnLogout();
  updateVisibility();
  setInterval(protectDirectAccess,400);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();