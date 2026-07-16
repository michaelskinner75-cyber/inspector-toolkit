(function(){
'use strict';
const frame=document.getElementById('hubFrame');
function inject(){
 const d=frame&&frame.contentDocument;if(!d)return;
 if(!d.getElementById('journeyTidyScript')){const s=d.createElement('script');s.id='journeyTidyScript';s.src='checksheet-nearby-stops.js?v=20260716-185';d.body.appendChild(s);}
 if(!d.getElementById('loginVersion185')){const v=d.createElement('script');v.id='loginVersion185';v.src='login-version.js?v=20260716-185';d.body.appendChild(v);}
}
frame?.addEventListener('load',()=>setTimeout(inject,1800));
setTimeout(inject,4200);
})();