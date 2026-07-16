(function(){
'use strict';
if(window.__nearbyFetchCacheInstalled)return;
window.__nearbyFetchCacheInstalled=true;
const originalFetch=window.fetch.bind(window);
const PREFIX='nearbyFetchCache:';
const MAX_AGE=30*60*1000;
function relevant(url){return /overpass|bustimes\.org\/stops\/|r\.jina\.ai\/(?:https?:\/\/)?bustimes\.org\/stops\//i.test(String(url||''));}
function key(input,options){const url=typeof input==='string'?input:(input&&input.url)||'';const body=options&&options.body?String(options.body):'';return PREFIX+btoa(unescape(encodeURIComponent(url+'|'+body))).slice(0,220);}
function read(k){try{const x=JSON.parse(localStorage.getItem(k)||'null');if(!x||!x.text||Date.now()-x.saved>MAX_AGE)return null;return x;}catch(e){return null;}}
function write(k,response,text){try{if(!text||text.length<40)return;localStorage.setItem(k,JSON.stringify({saved:Date.now(),status:response.status||200,type:response.headers.get('content-type')||'text/plain',text:text}));}catch(e){}}
function cachedResponse(x){return new Response(x.text,{status:x.status||200,headers:{'Content-Type':x.type||'text/plain','X-Inspector-Cache':'1'}});}
window.fetch=async function(input,options){
 const url=typeof input==='string'?input:(input&&input.url)||'';
 if(!relevant(url))return originalFetch(input,options);
 const k=key(input,options),cached=read(k);
 try{
  const response=await originalFetch(input,options);
  if(!response.ok){if(cached)return cachedResponse(cached);return response;}
  const clone=response.clone();
  const text=await clone.text();
  if(text&&text.length>=40)write(k,response,text);
  else if(cached)return cachedResponse(cached);
  return response;
 }catch(error){
  if(cached)return cachedResponse(cached);
  throw error;
 }
};
})();