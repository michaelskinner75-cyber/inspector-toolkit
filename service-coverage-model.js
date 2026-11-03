(function(){
'use strict';
const clean=v=>String(v??'').trim(),norm=v=>clean(v).toUpperCase().replace(/[^A-Z0-9]/g,'');
const h=s=>{let n=2166136261;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619);}return'b'+(n>>>0).toString(36);};
const date=v=>{if(v instanceof Date)return isNaN(v)?'':v.getFullYear()+'-'+String(v.getMonth()+1).padStart(2,'0')+'-'+String(v.getDate()).padStart(2,'0');if(typeof v==='number'&&v>20000&&v<90000)return new Date(Date.UTC(1899,11,30)+v*86400000).toISOString().slice(0,10);const t=clean(v);let m=t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');m=t.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4}|\d{2})/);if(m){let a=+m[1],b=+m[2];if(b>12&&a<=12)[a,b]=[b,a];return (m[3].length===2?'20':'')+m[3]+'-'+String(b).padStart(2,'0')+'-'+String(a).padStart(2,'0');}const p=new Date(t);return isNaN(p)?'':date(p);};
const time=v=>{if(typeof v==='number'&&v>=0&&v<1){const m=Math.round(v*1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}const m=clean(v).match(/(?:^|\s)(\d{1,2}):(\d{2})/);if(m&&+m[1]<24&&+m[2]<60)return m[1].padStart(2,'0')+':'+m[2];return'';};
const rows=s=>{const a=(typeof cloud!=='undefined'&&cloud&&Array.isArray(cloud[s]))?cloud[s]:[];return a.filter(r=>Array.isArray(r)&&r.length>2&&clean(r[0]).toLowerCase()!=='date');};
const isSchoolService=x=>/^(AM|BB|BW|CH|GF|GR|GW|LA|LK|MD|MK|ML|MT|PK|QA|SA|SH|SM|SP|ST|WD|SC)\d+[A-Z]?$/i.test(clean(x?.code));
const defs=()=>{let all=[];try{all=typeof serviceDefs!=='undefined'&&Array.isArray(serviceDefs)?serviceDefs:window.INSPECTOR_SERVICES||[];}catch(e){all=window.INSPECTOR_SERVICES||[];}return all.filter(x=>x&&x.code&&clean(x.code).toUpperCase()!=='73B'&&!isSchoolService(x)).map(x=>({...x,id:x.id||h((x.code+'|'+(x.route||'')).toLowerCase())}));};
const codes=x=>[...new Set([x.code,...(Array.isArray(x.aliases)?x.aliases:[])].flatMap(c=>clean(c).split(/[\/,;&]+/)).map(norm).filter(Boolean))];
function region(s){const t=clean(s).toUpperCase();if(/DUNFERMLINE|KIRKCALDY|GLENROTHES|LEVEN|CUPAR|ST ANDREWS|KELTY|COWDENBEATH|LOCHGELLY|HALBEATH|FERRYTOLL|ABERHILL|CROMBIE|ROSYTH|DALGETY|TAYPORT|INVERKEITHING|FIFE/.test(t))return'FIFE';if(/PERTH|BLAIRGOWRIE|PITLOCHRY|KINROSS|AUCHTERARDER|CRIEFF|ABERFELDY|DUNKELD|BROXDEN|SCONE|BERTHA PARK/.test(t))return'PERTH';if(/ARBROATH|FORFAR|MONTROSE|BRECHIN|KIRRIEMUIR|CARNOUSTIE|MONIFIETH|ANGUS|EDZELL|STRACATHRO|MIDGRIP|HILLHEAD OF HEDDERWICK/.test(t))return'ANGUS';if(/DUNDEE|NINEWELLS|HOSPITALFIELD/.test(t))return'DUNDEE';return'';}
// Inspection forms can record a group such as X24/X24A or 75/75A.
// Match every explicitly recorded service code independently; the old matcher
// dropped the entire group whenever more than one directory entry matched.
// For a *single* code used in different areas, retain the area safeguard.
function matches(code,places,all){
 const requested=codes({code});if(!requested.length)return[];
 const hints=Array.isArray(places)?places:[places];
 const areas=[...new Set(hints.map(region).filter(Boolean))];
 const selected=new Map();
 requested.forEach(requestedCode=>{
  const found=all.filter(s=>codes(s).includes(requestedCode));
  if(found.length===1){selected.set(found[0].id,found[0]);return;}
  if(found.length<2)return;
  // A number can be used in two areas (e.g. 7 in Perth and Fife).
  // Never credit both just because an inspector recorded the number.
  for(const area of areas){
   const inArea=found.filter(s=>region((s.route||'').split(/\\s+(?:-|to)\\s+/i)[0])===area);
   if(inArea.length===1){selected.set(inArea[0].id,inArea[0]);break;}
  }
 });
 return [...selected.values()];
}
function automatic(all){
 const map=new Map(all.map(s=>[s.id,[]]));
 const add=(service,place,d,t,inspector,kind)=>{const key=date(d);if(!key)return;matches(service,place,all).forEach(s=>map.get(s.id).push({date:key,time:time(t),inspector:clean(inspector),kind,recordedService:clean(service)}));};
 rows('Inspections').forEach(r=>add(r[5],[r[3],r[8],r[9]],r[0],time(r[7])||r[1],r[2],'Inspection'));
 rows('Timing Checks').forEach(r=>{if(r.length>=10)add(r[4],[r[3],r[5]],r[0],time(r[9])||r[1],r[2],'Timing check');});
 rows('Early Running').forEach(r=>{if(r.length>=12)add(r[4],[r[3],r[5]],r[0],time(r[9])||r[1],r[2],'Timing check');else if(r.length>=9)add(r[5],[r[4],r[6]],r[0],r[1],r[2],'Early running');});
 map.forEach(items=>items.sort((a,b)=>(b.date+'T'+b.time).localeCompare(a.date+'T'+a.time)));
 return map;
}
function manual(){const map=new Map();rows('Services').forEach(r=>{if(clean(r[1]).toUpperCase()!=='COVERAGE')return;const key=clean(r[2]);if(!key.startsWith('cov:'))return;const s=clean(r[4]).toUpperCase();if(!['CHECKED','NOT_CHECKED','AUTO'].includes(s))return;map.set(key.slice(4),{status:s,date:date(r[5]),time:time(r[6]),inspector:clean(r[7]),by:clean(r[8]),operation:clean(r[9]),kind:'Manual amendment'});});return map;}
function status(all,from='',to=''){const auto=automatic(all),edits=manual();const inRange=item=>!!item&&(!from||item.date>=from)&&(!to||item.date<=to);return all.map(s=>{const override=edits.get(s.id),history=auto.get(s.id)||[],original=history[0]||null;const item=override&&override.status!=='AUTO'?(override.status==='CHECKED'&&inRange(override)?{...override}:null):(history.find(inRange)||null);return {...s,original,override,item,checked:!!item,checkCount:history.length};});}
// Shared service-area allocation for Service Coverage and Suggested Checks.
// Service codes reused in Perth and Fife are disambiguated by their route.
// 56, 56B and 65 intentionally belong to both inspector areas.
const fifeServiceCodes=new Set(('1 1A 2 2A 3 4 4A 4B 4C 6 6A 7 7A 7B 7C 7D 8 8A 14A 19 28 32 32A 33 33A 34 34A 34B 35 35A 36 37 37A 38 39 39A 39B 40 41 41A 41B 43 43A 44 44A 44B 46 47A 48 49 56 56B 59 65 81 81A 82 82A 83 87 88 88A 90 90A 90B 90C 91 91A 95 99 99S 201 395 747 787 X22 X24 X24A X27 X51 X55 X57 X58 X59 X59A X61').split(' '));
const fifeDuplicateRoute={
 '1':/DUNFERMLINE/i,'1A':/DUNFERMLINE/i,'2':/DUNFERMLINE/i,'2A':/DUNFERMLINE/i,
 '3':/DUNFERMLINE/i,'4':/DUNFERMLINE/i,'6':/CROMBIE/i,
 '7':/DUNFERMLINE/i,'7A':/DUNFERMLINE/i,'7B':/KELTY/i,'7C':/KELTY/i,
 '8':/DUNFERMLINE/i,'14A':/KIRKCALDY/i,'33':/KIRKCALDY/i,
 '34':/KIRKCALDY/i,'34A':/KIRKCALDY/i,'40':/GLENROTHES/i,
 '47A':/LEVEN/i,'59':/GLENROTHES/i,'83':/DUNFERMLINE/i
};
const sharedServiceCodes=new Set(['56','56B','65']);
function fifeService(s){
 const code=clean(s?.code).toUpperCase();
 if(!fifeServiceCodes.has(code))return false;
 return !fifeDuplicateRoute[code]||fifeDuplicateRoute[code].test(clean(s?.route));
}
function strathtayService(s){
 return sharedServiceCodes.has(clean(s?.code).toUpperCase())||!fifeService(s);
}
window.InspectorCoverageModel={date,time,rows,defs,status,isSchoolService,fifeService,strathtayService};
})();