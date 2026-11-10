/* Shared offline-friendly West Scotland NaPTAN source.
   Generated alongside the verified Google Sheets import on 10 November 2026. */
(function(){
'use strict';
let cache=null,pending=null;
function parseCSV(csv){
 const rows=[];let row=[],value='',quoted=false;
 for(let i=0;i<csv.length;i++){
  const c=csv[i];
  if(c==='"'){if(quoted&&csv[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){row.push(value);value='';}
  else if((c==='\r'||c==='\n')&&!quoted){
   if(c==='\r'&&csv[i+1]==='\n')i++;
   row.push(value);if(row.length>1)rows.push(row);
   row=[];value='';
  }else value+=c;
 }
 if(row.length||value){row.push(value);rows.push(row);}
 return rows;
}
window.inspectorWestBusStops=function(){
 if(cache)return Promise.resolve(cache);
 if(pending)return pending;
 pending=fetch('west-scotland-bus-stops.csv',{cache:'force-cache'})
  .then(r=>{if(!r.ok)throw new Error('West Scotland stop data unavailable');return r.text();})
  .then(text=>{
   const rows=parseCSV(text),header=rows.shift();
   if(!header||header[0]!=='ATCO Code')throw new Error('Invalid West Scotland stop catalogue');
   const result=rows.map(r=>[Number(r[4]),Number(r[5]),String(r[0]||''),String(r[1]||''),String(r[2]||''),String(r[3]||'')])
    .filter(r=>Number.isFinite(r[0])&&Number.isFinite(r[1])&&r[2]);
   if(result.length<15000)throw new Error('West Scotland stop catalogue incomplete');
   cache=result;
   window.INSPECTOR_WEST_STOPS_COUNT=result.length;
   return result;
  }).catch(e=>{pending=null;throw e;});
 return pending;
};
})();