(function(){
'use strict';
const $=id=>document.getElementById(id);
function inspector(){return (typeof getInspector==='function'?getInspector():(localStorage.getItem('activeInspector')||'')).trim();}
function michael(){return inspector().toLowerCase()==='m skinner';}
function openManagementFromTools(){
 if(!michael())return;
 const entered=prompt('Enter Management Summary PIN');
 const required=['82','91'].join('');
 if(entered===null)return;
 if(String(entered).trim()!==required){alert('Incorrect PIN.');return;}
 if(typeof openSection==='function')openSection('managementSummary');
 const back=$('mgBack');if(back)back.textContent='← Other Links & Tools';
 if(typeof loadCloud==='function'){const p=loadCloud();if(p&&typeof p.then==='function')p.then(()=>setTimeout(()=>$('mgRefresh')?.click(),50));else setTimeout(()=>$('mgRefresh')?.click(),900);}
 window.scrollTo(0,0);
}
function setup(){
 $('managementLoginBtn')?.remove();
 const nav=$('otherToolsNav');if(!nav)return;
 let btn=$('managementToolsBtn');
 if(!michael()){if(btn)btn.remove();return;}
 if(!btn){btn=document.createElement('button');btn.id='managementToolsBtn';btn.type='button';btn.innerHTML='<span class="navIcon">📊</span>Management Overview Summary';nav.appendChild(btn);}
 btn.onclick=openManagementFromTools;
 const back=$('mgBack');
 if(back&&back.dataset.toolBack!=='1'){
  back.dataset.toolBack='1';back.textContent='← Other Links & Tools';
  back.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(typeof openSection==='function')openSection('otherLinksTools');},true);
 }
}
function init(){
 setup();
 setInterval(setup,1000);
 document.addEventListener('click',e=>{if(e.target.closest('#loginBtn,[data-login-name],#changeInspectorBtn'))setTimeout(setup,250);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();