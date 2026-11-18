(function(){
'use strict';
const SHEET='Morning Run Out';
const $=id=>document.getElementById(id);
const DEPOTS=['Aberhill','Arbroath','Dunfermline','Glenrothes','St Andrews','Perth','Forfar','Blairgowrie','Other'];
let remote=[];
let pending=[],displayedRecords=[],editingId=null,editingOriginal=null;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').trim().toLowerCase().replace(/\s+/g,' ');
function iso(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function toIso(v){const s=String(v||'').trim(),a=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(a)return s;const b=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);if(b)return `${b[3].length===2?'20'+b[3]:b[3]}-${String(b[2]).padStart(2,'0')}-${String(b[1]).padStart(2,'0')}`;return '';}
function uk(v){const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:v;}
function hm(){return new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});}
function mins(v){const m=String(v||'').match(/^(\d{1,2}):(\d{2})/);return m?+m[1]*60 + +m[2]:null;}
function diff(s,a){const x=mins(s),y=mins(a);if(x===null||y===null)return null;let d=y-x;if(d<-720)d+=1440;if(d>720)d-=1440;return d;}
function text(d){if(d===null)return '';if(d<0)return `${-d} min early`;if(!d)return 'On time';if(d<6)return `${d} min late — within tolerance`;return `${d} min late`;}
function cls(d){return d>=6?'late':d>0?'tol':'good';}
function nsa(v){const x=norm(v);if(x==='working')return 'Working';if(x==='not working')return 'Not Working';if(x==='n/a'||x==='na')return 'N/A';return 'Not Checked';}
function nsaCls(v){const x=nsa(v);return x==='Working'?'ok':x==='Not Working'?'bad':'';}
function depotOf(r){return String(r?.[15]||'').trim();}
function selectedDepot(){return String($('mroDepot')?.value||'').trim();}
function key(r){return [toIso(r[0]),r[1],r[2],r[3],r[5],r[8],r[9],r[15]].map(norm).join('|');}
function local(){try{const x=JSON.parse(localStorage.getItem('local_'+SHEET)||'[]');return Array.isArray(x)?x:[];}catch(e){return [];}}
function token(){return 'MRO-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,11);}
function recordId(r){const v=String(r[13]||'');return /^MRO-[a-z0-9-]+$/i.test(v)?v:'MRO-LEGACY:'+key(r);}
function status(d){return d>=6?'LATE 6+':d<0?'EARLY':'ON TIME';}
function stillToCheck(r){return norm(r?.[16])==='yes';}
function changeMarker(id){return 'MRO-EVENT:'+token()+':'+encodeURIComponent(id);}
function changeInfo(r){
 if(r[11]!=='MRO_EDIT'&&r[11]!=='MRO_DELETE')return null;
 const m=/^MRO-EVENT:([^:]+):(.+)$/.exec(String(r[13]||''));
 if(!m)return null;
 try{return {action:r[11],eventId:m[1],target:decodeURIComponent(m[2])};}catch(e){return null;}
}
// Shared edit/delete actions are appended to the existing Google Sheet as an audit trail.
function records(){
 const a=remote.length&&norm(remote[0]?.[3])==='duty number'?remote.slice(1):remote;
 const map=new Map(),seenRows=new Set(),seenEvents=new Set();
 [...a,...local(),...pending].forEach(r=>{
  if(!Array.isArray(r)||!r[0]||!r[3])return;
  const event=changeInfo(r);
  if(event){
   if(seenEvents.has(event.eventId))return;
   seenEvents.add(event.eventId);
   if(event.action==='MRO_DELETE'){map.delete(event.target);return;}
   const replacement=r.slice();replacement[11]=status(diff(replacement[8],replacement[9]));replacement[13]=event.target;
   map.set(event.target,replacement);return;
  }
  const id=recordId(r);
  if(seenRows.has(id))return;
  seenRows.add(id);map.set(id,r);
 });
 return [...map].map(([id,row])=>({id,row}));
}
function rows(){return records().map(x=>x.row);}
function currentRecords(){
 const date=$('mroDate')?.value||iso(),depot=selectedDepot();
 return records().filter(x=>toIso(x.row[0])===date&&(!depot||norm(depotOf(x.row))===norm(depot)))
  .sort((a,b)=>((mins(b.row[1])??-1)-(mins(a.row[1])??-1))||String(b.row[8]).localeCompare(String(a.row[8])));
}
function current(){return currentRecords().map(x=>x.row);}
window.morningRunOutEffectiveRows=rows;
function stats(a){const c=a.filter(r=>diff(r[8],r[9])!==null),late=c.filter(r=>diff(r[8],r[9])>=6).length;return {total:c.length,late,on:c.length-late,p:c.length?(c.length-late)/c.length*100:0};}
function live(){const d=diff($('mroScheduled')?.value,$('mroActual')?.value),e=$('mroLive');if(!e)return;e.className='mroLive '+(d===null?'':cls(d));e.textContent=d===null?'Enter scheduled and actual time':text(d);}
function render(){
 const a=currentRecords(),list=$('mroList'),sum=$('mroSummary'),depot=selectedDepot();
 if(!list||!sum)return;
 displayedRecords=a;
 list.innerHTML=a.map(({row:r},i)=>{
  const d=diff(r[8],r[9]),nv=nsa(r[14]),rvDepot=depotOf(r),needsCheck=stillToCheck(r);
  return `<div class="mroCard ${cls(d)}${needsCheck?' mroNeedsCheck':''}"><div class="mroTop"><div><b>Duty ${esc(r[3])} • ${esc(r[4])}</b><span>Fleet ${esc(r[5])} • ${esc(r[8])} → ${esc(r[9])}</span></div><strong>${esc(text(d))}</strong></div><div class="mroTags"><span class="${norm(r[6])==='yes'?'ok':'bad'}">DQC ${norm(r[6])==='yes'?'✓':'✕'}</span><span class="${norm(r[7])==='yes'?'ok':'bad'}">Destination ${norm(r[7])==='yes'?'✓':'✕'}</span><span class="${nsaCls(nv)}">NSA ${esc(nv)}</span>${rvDepot?`<span>Depot ${esc(rvDepot)}</span>`:''}<span>${esc(r[2]||'-')}</span>${needsCheck?'<span class="mroNeedsBadge">STILL TO BE CHECKED</span>':''}</div>${r[12]?`<div class="mroComment">${esc(r[12])}</div>`:''}<div class="mroActions"><button type="button" class="mroCheckToggle" data-mro-action="toggleCheck" data-mro-index="${i}" aria-pressed="${needsCheck}" aria-label="${needsCheck?'Mark duty '+esc(r[3])+' as checked':'Highlight duty '+esc(r[3])+' as still to be checked'}">${needsCheck?'MARK CHECKED':'STILL TO CHECK'}</button><button type="button" class="mroEdit" data-mro-action="edit" data-mro-index="${i}" aria-label="Edit duty ${esc(r[3])}">EDIT</button><button type="button" class="mroDelete" data-mro-action="delete" data-mro-index="${i}" aria-label="Delete duty ${esc(r[3])}">DELETE</button></div></div>`;
 }).join('')||`<div class="panel">No Morning Run Out entries for this date${depot?' at '+esc(depot):''}.</div>`;
 const s=stats(a.map(x=>x.row));
 sum.innerHTML=`<div><small>TOTAL BUSES CHECKED</small><b>${s.total}</b></div><div><small>ON TIME / WITHIN 5 MIN</small><b>${s.on}</b></div><div><small>6+ MIN LATE</small><b>${s.late}</b></div><div class="score"><small>RUN OUT SCORE</small><b>${s.p.toFixed(1)}%</b></div>`;
}
function clear(){
 editingId=null;editingOriginal=null;
 if($('mroFormTitle'))$('mroFormTitle').textContent='Add Run Out Entry';
 if($('mroSave'))$('mroSave').textContent='SAVE ENTRY';
 if($('mroCancelEdit'))$('mroCancelEdit').hidden=true;
 ['mroDuty','mroName','mroFleet','mroScheduled','mroActual','mroComments'].forEach(id=>{if($(id))$(id).value='';});
 if($('mroDqc'))$('mroDqc').checked=true;
 if($('mroDest'))$('mroDest').checked=true;
 if($('mroNSA'))$('mroNSA').value='Not Checked';
 live();$('mroDuty')?.focus();
}
function editRecord(item){
 editingId=item.id;editingOriginal=item.row.slice();
 const r=item.row;
 $('mroDate').value=toIso(r[0])||iso();
 $('mroDepot').value=depotOf(r);
 $('mroDuty').value=r[3]||'';$('mroName').value=r[4]||'';$('mroFleet').value=r[5]||'';
 $('mroDqc').checked=norm(r[6])==='yes';$('mroDest').checked=norm(r[7])==='yes';
 $('mroScheduled').value=r[8]||'';$('mroActual').value=r[9]||'';
 $('mroComments').value=r[12]||'';$('mroNSA').value=nsa(r[14]);
 $('mroFormTitle').textContent='Edit Run Out Entry';
 $('mroSave').textContent='SAVE CHANGES';$('mroCancelEdit').hidden=false;
 live();render();
 $('mroFormTitle').scrollIntoView({behavior:'smooth',block:'start'});
 $('mroDuty').focus({preventScroll:true});
}
function toggleCheck(item){
 const change=item.row.slice();
 change[11]='MRO_EDIT';
 change[13]=changeMarker(item.id);
 change[16]=stillToCheck(item.row)?'No':'Yes';
 pending.push(change);
 if(editingId===item.id){editingOriginal=change.slice();editingOriginal[11]=status(diff(change[8],change[9]));editingOriginal[13]=item.id;}
 if(typeof cloudAppend==='function')cloudAppend(SHEET,change);
 render();setTimeout(load,1400);
}
function deleteRecord(item){
 const r=item.row;
 if(!confirm('Delete Duty '+r[3]+' (Fleet '+r[5]+') from the Morning Run Out list?'))return;
 const change=r.slice();change[11]='MRO_DELETE';change[13]=changeMarker(item.id);
 pending.push(change);
 if(editingId===item.id)clear();
 if(typeof cloudAppend==='function')cloudAppend(SHEET,change);
 render();setTimeout(load,1400);
}
function save(){
 const duty=$('mroDuty').value.trim(),name=$('mroName').value.trim(),fleet=$('mroFleet').value.trim(),s=$('mroScheduled').value,a=$('mroActual').value,depot=selectedDepot();
 if(!depot){alert('Please select a depot at the top of the Run Out page.');return;}
 if(!duty||!name||!fleet||!s||!a){alert('Please enter Duty Number, Name, Fleet Number, Scheduled Time and Actual Time Out.');return;}
 const d=diff(s,a),date=$('mroDate').value;
 const row=[uk(date),editingOriginal?.[1]||hm(),editingOriginal?.[2]||(typeof getInspector==='function'?getInspector():''),duty,name,fleet,$('mroDqc').checked?'Yes':'No',$('mroDest').checked?'Yes':'No',s,a,d,status(d),$('mroComments').value.trim(),editingId?changeMarker(editingId):token(),nsa($('mroNSA').value),depot,editingOriginal&&stillToCheck(editingOriginal)?'Yes':'No'];
 if(editingId)row[11]='MRO_EDIT';
 if(!remote.length)remote=[['Date','Saved Time','Inspector','Duty Number','Name','Fleet Number','DQC','Correct Destination','Scheduled Time','Actual Time Out','Minutes Early/Late','Status','Comments','Run ID','NSA','Depot']];
 pending.push(row);
 if(typeof cloudAppend==='function')cloudAppend(SHEET,row);
 clear();render();setTimeout(load,1400);
}
async function load(){
 try{
  const j=WEB_APP_URL.includes('?')?'&':'?';
  const res=await fetch(WEB_APP_URL+j+'sheet='+encodeURIComponent(SHEET)+'&_='+Date.now(),{cache:'no-store'}),x=await res.json();
  if(x&&Array.isArray(x.data)){remote=x.data;if(typeof cloud!=='undefined')cloud[SHEET]=x.data;}
 }catch(e){console.log('Morning Run Out load failed',e);}
 render();
}
function exportExcel(){
 const a=current();if(!a.length){alert('There are no entries to export for this date and depot.');return;}
 const s=stats(a),date=$('mroDate').value,depot=selectedDepot()||'All Depots';
 const head=['DUTY NO','NAME','FLEET NUMBER','DQC','CORRECT DESTINATION','NSA','SCHEDULED','ACTUAL','MIN EARLY/LATE','STATUS','COMMENTS'];
 const body=a.map(r=>[r[3],r[4],r[5],r[6],r[7],nsa(r[14]),r[8],r[9],r[10],r[11],r[12]]);
 const table=[head,...body].map(row=>'<tr>'+row.map(v=>`<td>${esc(v)}</td>`).join('')+'</tr>').join('');
 const html=`<html><head><meta charset="utf-8"></head><body><h2>Morning Run Out Check</h2><p><b>Date:</b> ${uk(date)} &nbsp; <b>Depot:</b> ${esc(depot)} &nbsp; <b>Inspector:</b> ${esc(typeof getInspector==='function'?getInspector():'')}</p><table border="1">${table}</table><br><table border="1"><tr><td>Total buses checked</td><td>${s.total}</td></tr><tr><td>On time / within 5 min</td><td>${s.on}</td></tr><tr><td>6+ min late</td><td>${s.late}</td></tr><tr><td>Run out score</td><td>${s.p.toFixed(1)}%</td></tr></table></body></html>`;
 const blob=new Blob([html],{type:'application/vnd.ms-excel'}),url=URL.createObjectURL(blob),x=document.createElement('a');
 x.href=url;x.download=`Morning-Run-Out-${depot.replace(/[^a-z0-9]+/gi,'-')}-${date}.xls`;x.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function build(){
 if($('morningRunOut'))return;
 const nav=$('home')?.querySelector('.nav'),machine=document.querySelector('.machine');
 if(!nav||!machine)return;
 const b=document.createElement('button');b.type='button';b.dataset.open='morningRunOut';b.textContent='Morning Run Out Check';nav.insertBefore(b,nav.children[1]||null);
 const sec=document.createElement('section');sec.id='morningRunOut';sec.className='section';
 const depotOptions=DEPOTS.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join('');
 sec.innerHTML=`<button class="backBtn">← Back</button><h2>Morning Run Out Check</h2><div class="panel mroBar"><label class="fieldLabel">Run Date<input class="field" id="mroDate" type="date"></label><label class="fieldLabel">Depot<select class="field" id="mroDepot"><option value="">Select depot</option>${depotOptions}</select></label><button class="btn" id="mroRefresh">REFRESH</button><button class="btn" id="mroExport">EXPORT EXCEL</button></div><div class="panel"><h3 id="mroFormTitle">Add Run Out Entry</h3><div class="grid"><input class="field" id="mroDuty" placeholder="Duty number"><input class="field" id="mroName" placeholder="Name"><input class="field" id="mroFleet" placeholder="Fleet number"></div><div class="mroChecks"><label><input type="checkbox" id="mroDqc" checked> DQC Checked</label><label><input type="checkbox" id="mroDest" checked> Correct Destination</label><label class="mroNsaBox"><span>NSA</span><select id="mroNSA"><option>Not Working</option><option>Working</option><option selected>Not Checked</option><option>N/A</option></select></label></div><div class="grid mroTimes"><label class="fieldLabel">Scheduled Time<input class="field" id="mroScheduled" type="time"></label><label class="fieldLabel">Actual Time Out<input class="field" id="mroActual" type="time"></label><div id="mroLive" class="mroLive">Enter scheduled and actual time</div></div><textarea class="field" id="mroComments" placeholder="Comments for this entry"></textarea><div class="grid"><button class="btn" id="mroSave">SAVE ENTRY</button><button class="btn" id="mroCancelEdit" hidden>CANCEL EDIT</button><button class="btn danger" id="mroClear">CLEAR FORM</button></div></div><div class="panel small">0–5 minutes late counts as within tolerance. 6+ minutes late counts against the score.</div><div id="mroList"></div><div id="mroSummary" class="mroSummary"></div>`;
 machine.appendChild(sec);
 $('mroDate').value=iso();
 b.onclick=()=>{if(typeof openSection==='function')openSection('morningRunOut');load();};
 sec.querySelector('.backBtn').onclick=()=>{if(typeof openSection==='function')openSection('home');};
 $('mroDate').onchange=render;$('mroDepot').onchange=render;$('mroRefresh').onclick=load;$('mroExport').onclick=exportExcel;$('mroSave').onclick=save;$('mroClear').onclick=clear;$('mroCancelEdit').onclick=clear;$('mroScheduled').oninput=$('mroActual').oninput=live;
 $('mroList').addEventListener('click',e=>{const button=e.target.closest('button[data-mro-action]');if(!button)return;const item=displayedRecords[Number(button.dataset.mroIndex)];if(!item)return;if(button.dataset.mroAction==='edit')editRecord(item);else if(button.dataset.mroAction==='delete')deleteRecord(item);else if(button.dataset.mroAction==='toggleCheck')toggleCheck(item);});
 render();load();
}
function style(){
 if($('mroCss'))return;
 const s=document.createElement('style');s.id='mroCss';
 s.textContent=`.nav button[data-open="morningRunOut"]::before{content:'🌅'}.mroBar{display:grid;grid-template-columns:minmax(150px,1fr) minmax(150px,1fr) auto auto auto;gap:8px;align-items:end}.mroChecks{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:10px 0}.mroChecks label{background:#102b40;border:1px solid #36586f;border-radius:10px;padding:12px;color:#fff;font-weight:800}.mroChecks input{width:22px;height:22px;vertical-align:middle;margin-right:8px}.mroNsaBox{display:flex;flex-direction:column;gap:5px}.mroNsaBox select{width:100%;padding:9px;border:0;border-radius:7px;font-size:16px;background:#fff;color:#102030;font-weight:700}.mroTimes{align-items:end}.mroLive{min-height:48px;display:flex;align-items:center;justify-content:center;text-align:center;background:#102b40;border:1px solid #36586f;border-radius:10px;font-weight:900;padding:8px}.mroLive.good,.mroCard.good{border-color:#35a86b}.mroLive.tol,.mroCard.tol{border-color:#e1a53c}.mroLive.late,.mroCard.late{border-color:#d64545}.mroCard{background:#0a1b2a;border:1px solid #36586f;border-left-width:7px;border-radius:10px;padding:11px;margin:9px 0}.mroTop{display:flex;justify-content:space-between;gap:10px}.mroTop b,.mroTop span{display:block}.mroTop span{font-size:12px;color:#b8c5ce;margin-top:3px}.mroTags{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.mroTags span{font-size:11px;background:#213b4e;border-radius:999px;padding:4px 7px}.mroTags .ok{background:#174735;color:#8be1b7}.mroTags .bad{background:#5a1d22;color:#ffaaaa}.mroComment{margin-top:8px;padding-top:8px;border-top:1px solid #36586f}.mroActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.mroActions button{min-height:38px;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:900;cursor:pointer;border:1px solid #55728a;background:#18394e;color:white}.mroActions .mroDelete{border-color:#a94e53;background:#51252a}.mroActions .mroCheckToggle{border-color:#3997e3;background:#184b78}.mroCard.mroNeedsCheck{background:#123e70;border-color:#3ba5ff;box-shadow:inset 0 0 0 1px rgba(85,174,255,.32)}.mroCard.mroNeedsCheck .mroTop span{color:#e2efff}.mroTags .mroNeedsBadge{background:#2781cd;color:#fff;font-weight:900;letter-spacing:.02em}.mroActions button:focus-visible{outline:2px solid #fff;outline-offset:2px}#mroCancelEdit[hidden]{display:none!important}.mroSummary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}.mroSummary>div{background:#102b40;border:1px solid #36586f;border-radius:10px;text-align:center;padding:12px}.mroSummary small{display:block;color:#b8c5ce;font-weight:800}.mroSummary b{display:block;font-size:25px;margin-top:5px}.mroSummary .score{background:#123d33;border-color:#35a86b}.mroSummary .score b{color:#8be1b7}@media(max-width:650px){.mroBar{grid-template-columns:1fr 1fr}.mroBar .fieldLabel{grid-column:auto}.mroChecks{grid-template-columns:1fr}.mroTimes{grid-template-columns:1fr}.mroSummary{grid-template-columns:1fr 1fr}.mroTop{display:block}.mroTop strong{display:block;margin-top:6px}}`;
 document.head.appendChild(s);
}
function init(){
 style();
 if(typeof sheets!=='undefined'&&!sheets.includes(SHEET))sheets.push(SHEET);
 if(typeof cloud!=='undefined'&&!cloud[SHEET])cloud[SHEET]=[];
 let n=0,t=setInterval(()=>{if($('home')&&document.querySelector('.machine')){clearInterval(t);build();}else if(++n>40)clearInterval(t);},250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();