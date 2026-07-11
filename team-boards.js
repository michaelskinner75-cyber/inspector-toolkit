(function(){
'use strict';

const ISSUE_SHEET='Known Issues';
const TASK_SHEET='Upcoming Tasks';
const ADMIN_NAME='M Skinner';
const ADMIN_PIN='8291';

if(typeof sheets!=='undefined'){
  if(!sheets.includes(ISSUE_SHEET))sheets.push(ISSUE_SHEET);
  if(!sheets.includes(TASK_SHEET))sheets.push(TASK_SHEET);
}
if(typeof cloud!=='undefined'){
  if(!cloud[ISSUE_SHEET])cloud[ISSUE_SHEET]=[];
  if(!cloud[TASK_SHEET])cloud[TASK_SHEET]=[];
}

const byId=id=>document.getElementById(id);
const html=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const isAdmin=()=>getInspector()===ADMIN_NAME&&sessionStorage.getItem('inspectorAdmin')==='1';

function addStyles(){
  if(byId('teamBoardsCss'))return;
  const s=document.createElement('style');
  s.id='teamBoardsCss';
  s.textContent=`
    .changeInspectorBtn{width:auto!important;min-width:0!important;padding:7px 11px!important;font-size:12px!important;border-radius:8px!important;justify-self:end!important}
    #home .loggedInBox{grid-template-columns:1fr auto!important}
    .nav button[data-open="knownIssues"]::before{content:'⚠️'}
    .nav button[data-open="upcomingTasks"]::before{content:'📝'}
    .teamForm{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .teamForm .full{grid-column:1/-1}
    .teamToolbar{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:10px}
    .teamToggle{display:flex;align-items:center;gap:8px;font-weight:700}
    .teamToggle input{width:20px;height:20px}
    .teamCard{background:#0a1b2a;border-left:7px solid var(--orange,#eea83e);border-radius:10px;padding:12px;margin:9px 0}
    .teamCard.closed{border-left-color:var(--green,#459679);opacity:.88}
    .teamCard h3{margin:0 0 7px}
    .teamMeta{font-size:12px;color:var(--muted,#b8c5ce);margin-top:7px;line-height:1.5}
    .teamActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
    .teamActions .btn{padding:8px 10px;font-size:12px}
    @media(max-width:650px){.teamForm{grid-template-columns:1fr}.teamForm .full{grid-column:auto}}
  `;
  document.head.appendChild(s);
}

function addHomeButtons(){
  const nav=document.querySelector('#home .nav');
  if(!nav)return;
  if(!nav.querySelector('[data-open="knownIssues"]')){
    const b=document.createElement('button');b.type='button';b.dataset.open='knownIssues';b.textContent='Known Issues';nav.appendChild(b);
  }
  if(!nav.querySelector('[data-open="upcomingTasks"]')){
    const b=document.createElement('button');b.type='button';b.dataset.open='upcomingTasks';b.textContent='Ongoing / Upcoming Tasks';nav.appendChild(b);
  }
}

function addPages(){
  const machine=document.querySelector('.machine');
  if(!machine||byId('knownIssues'))return;
  machine.insertAdjacentHTML('beforeend',`
    <section id="knownIssues" class="section">
      <button class="backBtn" data-open="home">← Back</button>
      <h2>Known Issues</h2>
      <div class="panel">
        <div class="teamForm">
          <input class="field" id="issueDepot" placeholder="Depot / area">
          <input class="field" id="issueFleet" placeholder="Fleet number (optional)">
          <input class="field" id="issueService" placeholder="Service (optional)">
          <textarea class="field full" id="issueText" placeholder="Known issue"></textarea>
        </div>
        <button class="btn" id="addIssueBtn">ADD ISSUE</button>
        <div class="teamToolbar"><label class="teamToggle"><input type="checkbox" id="hideResolved" checked> Hide resolved</label><button class="btn refreshCloud" type="button">REFRESH</button></div>
      </div>
      <div class="log" id="knownIssuesList"></div>
    </section>
    <section id="upcomingTasks" class="section">
      <button class="backBtn" data-open="home">← Back</button>
      <h2>Ongoing / Upcoming Tasks</h2>
      <div class="panel">
        <div class="teamForm">
          <input class="field" id="taskDepot" placeholder="Depot / area (optional)">
          <input class="field" id="taskDue" type="date" aria-label="Due date">
          <textarea class="field full" id="taskText" placeholder="Task or note"></textarea>
        </div>
        <button class="btn" id="addTaskBtn">ADD TASK / NOTE</button>
        <div class="teamToolbar"><label class="teamToggle"><input type="checkbox" id="hideCompleted" checked> Hide completed</label><button class="btn refreshCloud" type="button">REFRESH</button></div>
      </div>
      <div class="log" id="upcomingTasksList"></div>
    </section>`);
}

function rowsFor(sheet){
  const rows=(cloud&&cloud[sheet])||[];
  if(!rows.length)return[];
  const first=rows[0]||[];
  return String(first[0]||'').toLowerCase()==='id'?rows.slice(1):rows.slice();
}

function rebuild(sheet){
  const state={};
  rowsFor(sheet).forEach(r=>{
    const id=String(r[0]||'');if(!id)return;
    const action=String(r[1]||'ADD').toUpperCase();
    if(action==='DELETE'){delete state[id];return;}
    if(action==='STATUS'){
      if(state[id]){state[id].status=r[9]||state[id].status;state[id].updatedBy=r[4]||'';state[id].updatedDate=r[2]||'';state[id].updatedTime=r[3]||'';}
      return;
    }
    state[id]={id,action,date:r[2]||'',time:r[3]||'',inspector:r[4]||'',text:r[5]||'',depot:r[6]||'',fleet:r[7]||'',serviceOrDue:r[8]||'',status:r[9]||'Open'};
  });
  return Object.values(state).sort((a,b)=>parseRowDate(b.date)-parseRowDate(a.date));
}

function appendEvent(sheet,row){
  if(!cloud[sheet])cloud[sheet]=[];
  cloud[sheet].push(row);
  cloudAppend(sheet,row);
}

function addIssue(){
  const text=byId('issueText').value.trim();if(!text){alert('Please enter the known issue.');return;}
  const row=[uid(),'ADD',normaliseDateForSave(''),normaliseTimeForSave(now()),getInspector(),text,byId('issueDepot').value.trim(),byId('issueFleet').value.trim(),byId('issueService').value.trim(),'Open'];
  appendEvent(ISSUE_SHEET,row);
  ['issueText','issueDepot','issueFleet','issueService'].forEach(id=>byId(id).value='');
  renderIssues();setTimeout(loadCloud,1200);
}

function addTask(){
  const text=byId('taskText').value.trim();if(!text){alert('Please enter the task or note.');return;}
  const row=[uid(),'ADD',normaliseDateForSave(''),normaliseTimeForSave(now()),getInspector(),text,byId('taskDepot').value.trim(),' ',byId('taskDue').value||'','Outstanding'];
  appendEvent(TASK_SHEET,row);
  ['taskText','taskDepot','taskDue'].forEach(id=>byId(id).value='');
  renderTasks();setTimeout(loadCloud,1200);
}

function statusEvent(sheet,id,status){
  appendEvent(sheet,[id,'STATUS',normaliseDateForSave(''),normaliseTimeForSave(now()),getInspector(),'','','','',status]);
  renderBoards();setTimeout(loadCloud,1200);
}

function deleteEvent(sheet,id){
  if(!isAdmin()){alert('Only M Skinner can delete entries.');return;}
  if(!confirm('Delete this entry?'))return;
  appendEvent(sheet,[id,'DELETE',normaliseDateForSave(''),normaliseTimeForSave(now()),getInspector(),'','','','','Deleted']);
  renderBoards();setTimeout(loadCloud,1200);
}

function renderIssues(){
  const el=byId('knownIssuesList');if(!el)return;
  const hide=byId('hideResolved')?.checked!==false;
  const rows=rebuild(ISSUE_SHEET).filter(x=>!(hide&&x.status==='Resolved'));
  el.innerHTML=rows.map(x=>`<div class="teamCard ${x.status==='Resolved'?'closed':''}"><h3>${html(x.status.toUpperCase())}</h3><div>${html(x.text)}</div>${x.depot?`<div><b>Depot/Area:</b> ${html(x.depot)}</div>`:''}${x.fleet?`<div><b>Fleet:</b> ${html(x.fleet)}</div>`:''}${x.serviceOrDue?`<div><b>Service:</b> ${html(x.serviceOrDue)}</div>`:''}<div class="teamMeta">Added by ${html(x.inspector||'-')} • ${html(formatDateValue(x.date))} ${html(formatTimeValue(x.time))}</div><div class="teamActions">${x.status!=='Resolved'?`<button class="btn" data-issue-status="${html(x.id)}">MARK RESOLVED</button>`:`<button class="btn" data-issue-status="${html(x.id)}">REOPEN</button>`}${isAdmin()?`<button class="btn danger" data-issue-delete="${html(x.id)}">DELETE</button>`:''}</div></div>`).join('')||'No known issues.';
}

function renderTasks(){
  const el=byId('upcomingTasksList');if(!el)return;
  const hide=byId('hideCompleted')?.checked!==false;
  const rows=rebuild(TASK_SHEET).filter(x=>!(hide&&x.status==='Completed'));
  el.innerHTML=rows.map(x=>`<div class="teamCard ${x.status==='Completed'?'closed':''}"><h3>${html(x.status.toUpperCase())}</h3><div>${html(x.text)}</div>${x.depot?`<div><b>Depot/Area:</b> ${html(x.depot)}</div>`:''}${x.serviceOrDue?`<div><b>Due:</b> ${html(formatDateValue(x.serviceOrDue))}</div>`:''}<div class="teamMeta">Added by ${html(x.inspector||'-')} • ${html(formatDateValue(x.date))} ${html(formatTimeValue(x.time))}</div><div class="teamActions">${x.status!=='Completed'?`<button class="btn" data-task-status="${html(x.id)}">MARK COMPLETED</button>`:`<button class="btn" data-task-status="${html(x.id)}">REOPEN</button>`}${isAdmin()?`<button class="btn danger" data-task-delete="${html(x.id)}">DELETE</button>`:''}</div></div>`).join('')||'No ongoing or upcoming tasks.';
}

function renderBoards(){renderIssues();renderTasks();}

function setupLogout(){
  const btn=byId('changeInspectorBtn');if(!btn)return;
  btn.textContent='LOGOUT';btn.title='Return to inspector login';
  btn.addEventListener('click',()=>sessionStorage.removeItem('inspectorAdmin'),true);
}

function setupAdminLogin(){
  const btn=byId('loginBtn');if(!btn||btn.dataset.adminReady==='1')return;
  btn.dataset.adminReady='1';
  btn.addEventListener('click',e=>{
    e.preventDefault();e.stopImmediatePropagation();
    if(pendingInspector===ADMIN_NAME){
      const pin=prompt('Enter admin PIN');
      if(pin!==ADMIN_PIN){sessionStorage.removeItem('inspectorAdmin');alert('Incorrect PIN.');return;}
      sessionStorage.setItem('inspectorAdmin','1');
    }else sessionStorage.removeItem('inspectorAdmin');
    completeLogin();
    renderBoards();
  },true);
}

function setupEvents(){
  byId('addIssueBtn').onclick=addIssue;
  byId('addTaskBtn').onclick=addTask;
  byId('hideResolved').onchange=renderIssues;
  byId('hideCompleted').onchange=renderTasks;
  document.addEventListener('click',e=>{
    const issueStatus=e.target.dataset.issueStatus;
    if(issueStatus){const item=rebuild(ISSUE_SHEET).find(x=>x.id===issueStatus);statusEvent(ISSUE_SHEET,issueStatus,item?.status==='Resolved'?'Open':'Resolved');}
    const taskStatus=e.target.dataset.taskStatus;
    if(taskStatus){const item=rebuild(TASK_SHEET).find(x=>x.id===taskStatus);statusEvent(TASK_SHEET,taskStatus,item?.status==='Completed'?'Outstanding':'Completed');}
    if(e.target.dataset.issueDelete)deleteEvent(ISSUE_SHEET,e.target.dataset.issueDelete);
    if(e.target.dataset.taskDelete)deleteEvent(TASK_SHEET,e.target.dataset.taskDelete);
  });
}

function wrapRenderAll(){
  if(typeof window.renderAll!=='function'||window.renderAll.__teamBoards)return;
  const original=window.renderAll;
  window.renderAll=function(){original.apply(this,arguments);renderBoards();};
  window.renderAll.__teamBoards=true;
}

function init(){
  addStyles();addHomeButtons();addPages();setupLogout();setupAdminLogin();setupEvents();wrapRenderAll();renderBoards();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,2000));else setTimeout(init,2000);
})();