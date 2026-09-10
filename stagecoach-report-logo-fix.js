(function(){
'use strict';
const TARGET='https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/StagecoachGroup.svg/500px-StagecoachGroup.svg.png';
if(window.__stagecoachReportLogoFix)return;
window.__stagecoachReportLogoFix=true;
const originalFetch=window.fetch.bind(window);
function flattenLogo(blob){
 return new Promise(resolve=>{
  const url=URL.createObjectURL(blob),img=new Image();
  img.onload=()=>{
   try{
    const canvas=document.createElement('canvas');
    canvas.width=img.naturalWidth||500;
    canvas.height=img.naturalHeight||120;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#ffffff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    canvas.toBlob(out=>{URL.revokeObjectURL(url);resolve(out||blob);},'image/png',1);
   }catch(e){URL.revokeObjectURL(url);resolve(blob);}
  };
  img.onerror=()=>{URL.revokeObjectURL(url);resolve(blob);};
  img.src=url;
 });
}
window.fetch=async function(input,init){
 const url=typeof input==='string'?input:(input&&input.url)||'';
 if(url===TARGET){
  try{
   const res=await originalFetch(input,init);
   if(!res.ok)return res;
   const flat=await flattenLogo(await res.blob());
   return new Response(flat,{status:200,statusText:'OK',headers:{'Content-Type':'image/png','Cache-Control':'no-store'}});
  }catch(e){return originalFetch(input,init);}
 }
 return originalFetch(input,init);
};
})();