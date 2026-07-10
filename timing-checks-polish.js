(function(){
'use strict';
const $=id=>document.getElementById(id);

function addStyles(){
  if($('timingPolishCss'))return;
  const style=document.createElement('style');
  style.id='timingPolishCss';
  style.textContent=`
    #timing .timingStatusBar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:10px 0 14px;padding:10px;border:1px solid #31536d;border-radius:12px;background:#10263a;text-align:center;font-size:12px}
    #timing .timingStatusItem{color:#d8e5ef;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #timing .timingStatusItem b{display:block;color:#fff;font-size:13px;margin-top:2px}
    #timing .timingFormStack{display:grid!important;grid-template-columns:1fr!important;gap:10px!important}
    #timing .timingFormStack>.field,#timing .timingFormStack>.serviceSelectWrap,#timing .timingFieldWrap{width:100%!important;box-sizing:border-box!important}
    #timing .timingFormStack .serviceSelectWrap{display:grid;grid-template-columns:1fr;gap:10px}
    #timing .timingFormStack .serviceRouteText{display:none!important}
    #timing .timingFieldWrap{display:block}
    #timing .timingFieldLabel{display:block;color:#b8c5ce;font-size:12px;font-weight:700;margin:0 0 5px 3px}
    #timing .timingFieldWrap>.field{width:100%;box-sizing:border-box;min-height:56px}
    #timing .timingSectionTitle{margin:2px 0 12px;padding:9px 12px;border-radius:9px;background:#17324b;color:#fff;border-left:6px solid #4d83c4;font-size:18px;font-weight:800}
    #timing .timingKeepRow{padding:10px 12px;border:1px solid #31536d;border-radius:10px;background:#10263a;color:#d8e5ef}
    #timing .timingActionRow{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin-top:12px}
    #timing .timingSaveProgress{height:6px;background:#243746;border-radius:999px;overflow:hidden;display:none;margin:8px 0 2px}
    #timing .timingSaveProgress.active{display:block}
    #timing .timingSaveProgressBar{height:100%;width:34%;background:#e8aa3d;border-radius:999px;animation:timingSaveSlide 1s linear infinite}
    #timing #saveTimingBtn.isSaving{background:#66727c!important;color:#d8dee3!important;opacity:.8;cursor:not-allowed!important}
    @keyframes timingSaveSlide{from{transform:translateX(-120%)}to{transform:translateX(340%)}}
    #timing .timingToggleBtn{width:100%;margin:14px 0 8px;background:#17324b;border:1px solid #416783;color:#fff;border-radius:10px;padding:12px;font-weight:800;font-size:15px}
    #timing .timingHidden{display:none!important}
    #timing .timingHistoryTitle{font-size:18px;font-weight:800;color:#fff;margin:12px 0 5px}
    #timing .filterBar button.activeFilter{outline:3px solid rgba(255,255,255,.28);transform:translateY(-1px)}
    #timing .timingCompactRow{position:relative;margin:8px 0;border-radius:11px;background:#0d1c2b;overflow:hidden;border:1px solid rgba(255,255,255,.05)}
    #timing .timingCompactRow:before{content:"";position:absolute;left:0;top:0;bottom:0;width:7px;background:#49a17f}
    #timing .timingCompactRow.yellow:before{background:#e8aa3d}
    #timing .timingCompactRow.red:before{background:#d64a50}
    #timing .timingCompactTop{padding:13px 14px 12px 22px;cursor:pointer}
    #timing .timingCompactMain{font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:15px}
    #timing .timingCompactSub{margin-top:4px;color:#b8c5ce;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}
    #timing .timingCompactDetails{display:none;padding:0 14px 14px 22px;color:#dce7ee;line-height:1.55;font-size:13px}
    #timing .timingCompactDetails.show{display:block}
    @media(max-width:520px){#timing .timingActionRow{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);
}

function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function addStatusBar(){
  const section=$('timing');if(!section||$('timingStatusBar'))return;
  const heading=section.querySelector('h2');if(!heading)return;
  const bar=document.createElement('div');bar.id='timingStatusBar';bar.className='timingStatusBar';
  bar.innerHTML='<div class="timingStatusItem">Inspector<b id="timingStatusInspector">-</b></div><div class="timingStatusItem">Date<b id="timingStatusDate">-</b></div><div class="timingStatusItem">Status<b id="timingStatusCloud">Live</b></div>';
  heading.after(bar);
}

function labelField(el,text){
  if(!el||el.closest('.timingFieldWrap'))return el?.closest('.timingFieldWrap');
  const wrap=document.createElement('label');wrap.className='timingFieldWrap';
  const label=document.createElement('span');label.className='timingFieldLabel';label.textContent=text;
  el.before(wrap);wrap.append(label,el);return wrap;
}

function setupLayout(){
  const section=$('timing');const panel=section&&section.querySelector('.panel');
  if(!panel||panel.dataset.timingPolished==='1')return;
  panel.dataset.timingPolished='1';
  const grid=panel.querySelector('.grid');if(!grid)return;
  grid.classList.add('timingFormStack');
  const title=document.createElement('div');title.className='timingSectionTitle';title.textContent='Timing Check Details';
  panel.insertBefore(title,panel.firstChild);

  const keep=$('keepTimingLocation')?.closest('label');
  if(keep){keep.classList.add('timingKeepRow');title.after(keep);}

  const serviceWrap=document.querySelector('[data-for-service="tcService"]')||$('tcService');
  const fields=[
    [$('tcLocation'),'Location Checked'],
    [serviceWrap,'Service Number'],
    [$('tcDestination'),'Destination'],
    [$('tcFleet'),'Fleet Number'],
    [$('tcDriver'),'Driver'],
    [$('tcScheduled'),'Scheduled Time'],
    [$('tcActual'),'Actual Time']
  ];
  fields.forEach(([el,label])=>{
    if(!el)return;
    if(el===serviceWrap){
      const wrap=document.createElement('div');wrap.className='timingFieldWrap';
      const text=document.createElement('span');text.className='timingFieldLabel';text.textContent=label;
      el.before(wrap);wrap.append(text,el);grid.appendChild(wrap);
    }else grid.appendChild(labelField(el,label));
  });

  const result=$('timingResult');if(result)grid.after(result);
  const save=$('saveTimingBtn'),clear=$('clearTimingBtn');
  const action=save&&save.parentElement;
  if(action){action.classList.add('timingActionRow');if(clear&&clear.parentElement!==action)action.appendChild(clear);}
}

function setupSaveProgress(){
  const btn=$('saveTimingBtn');if(!btn||btn.dataset.timingLock==='1')return;
  btn.dataset.timingLock='1';
  const progress=document.createElement('div');progress.className='timingSaveProgress';progress.innerHTML='<div class="timingSaveProgressBar"></div>';
  btn.parentElement?.after(progress);
  btn.addEventListener('click',async e=>{
    e.preventDefault();e.stopImmediatePropagation();
    if(btn.disabled)return;
    const required=[$('tcLocation')?.value,$('tcService')?.value,$('tcScheduled')?.value,$('tcActual')?.value];
    if(required.some(v=>!v)){alert('Please enter the location, service, scheduled time and actual time.');return;}
    btn.disabled=true;btn.classList.add('isSaving');btn.textContent='SAVING TIMING CHECK…';progress.classList.add('active');
    try{
      if(typeof window.saveTimingCheck==='function')window.saveTimingCheck();else if(typeof saveTimingCheck==='function')saveTimingCheck();
      await new Promise(r=>setTimeout(r,2200));
      btn.textContent='TIMING CHECK SAVED ✓';
      await new Promise(r=>setTimeout(r,700));
    }catch(err){console.error(err);btn.textContent='SAVE FAILED — TRY AGAIN';await new Promise(r=>setTimeout(r,1300));}
    finally{progress.classList.remove('active');btn.disabled=false;btn.classList.remove('isSaving');btn.textContent='SAVE TIMING CHECK';}
  },true);
}

function timingDataRows(){
  const rows=(window.cloud&&cloud['Early Running'])||[];
  if(!rows.length)return[];
  const first=(rows[0]||[]).map(v=>String(v||'').trim().toLowerCase());
  const header=first.some(v=>['date','time','inspector','location','service','scheduled','actual'].includes(v));
  return header?rows.slice(1):rows.slice();
}

function difference(scheduled,actual){
  if(typeof minutesDifference==='function')return minutesDifference(scheduled,actual);
  if(!scheduled||!actual)return null;
  const [sh,sm]=scheduled.split(':').map(Number),[ah,am]=actual.split(':').map(Number);
  let d=(ah*60+am)-(sh*60+sm);if(d>720)d-=1440;if(d<-720)d+=1440;return d;
}
function resultFor(diff){
  if(typeof timingLabel==='function')return timingLabel(diff);
  if(diff===null)return{label:'-',cls:'green'};
  if(diff===0)return{label:'ON TIME',cls:'green'};
  if(diff<0){const n=Math.abs(diff);return{label:`${n} MINUTE${n===1?'':'S'} EARLY`,cls:n>3?'red':'yellow'};}
  return{label:`${diff} MINUTE${diff===1?'':'S'} LATE`,cls:'green'};
}

function compactRenderTiming(){
  const el=$('timingList');if(!el)return;
  const q=($('timingSearch')?.value||'').toLowerCase(),nowDate=new Date();
  let filter='today';try{filter=timingFilter||'today';}catch(e){filter=localStorage.getItem('timingFilter')||'today';}
  const rows=timingDataRows().filter(r=>{
    const d=typeof parseRowDate==='function'?parseRowDate(r[0]):new Date(r[0]);
    if(filter==='today'&&typeof sameDay==='function'&&!sameDay(d,nowDate))return false;
    if(filter==='week'&&typeof inThisWeek==='function'&&!inThisWeek(d))return false;
    if(filter==='month'&&typeof inThisMonth==='function'&&!inThisMonth(d))return false;
    return !q||r.join(' ').toLowerCase().includes(q);
  }).reverse();
  el.innerHTML=rows.map((r,i)=>{
    const mins=isNaN(Number(r[10]))?difference(r[8],r[9]):Number(r[10]);
    const result=resultFor(mins),date=typeof formatDateValue==='function'?formatDateValue(r[0]):r[0],time=typeof formatTimeValue==='function'?formatTimeValue(r[1]):r[1];
    const details=[`<b>Date:</b> ${esc(date)} ${esc(time)}`,`<b>Inspector:</b> ${esc(r[2]||'-')}`,`<b>Location:</b> ${esc(r[3]||'-')}`,`<b>Service:</b> ${esc(r[4]||'-')}`,`<b>Destination:</b> ${esc(r[5]||'-')}`,`<b>Fleet:</b> ${esc(r[6]||'-')}`,`<b>Driver:</b> ${esc(r[7]||'-')}`,`<b>Scheduled:</b> ${esc(typeof formatTimeValue==='function'?formatTimeValue(r[8]):r[8])}`,`<b>Actual:</b> ${esc(typeof formatTimeValue==='function'?formatTimeValue(r[9]):r[9])}`,`<b>Result:</b> ${esc(result.label)}`].join('<br>');
    return `<div class="timingCompactRow ${esc(result.cls)}"><div class="timingCompactTop" data-timing-detail="timingDetail${i}"><div class="timingCompactMain">${esc(date)} ${esc(time)} | ${esc(r[4]||'-')} | ${esc(r[6]||'-')} | ${esc(result.label)}</div><div class="timingCompactSub">${esc(r[3]||'-')} • ${esc(r[7]||'-')} • ${esc(r[2]||'-')}</div></div><div class="timingCompactDetails" id="timingDetail${i}">${details}</div></div>`;
  }).join('')||'No timing checks for this view.';
}

function setupHistory(){
  const section=$('timing'),list=$('timingList'),search=$('timingSearch'),panel=search&&search.closest('.panel');
  if(!section||!list||!panel||$('toggleTimingHistoryBtn'))return;
  const title=document.createElement('div');title.className='timingHistoryTitle';title.textContent='Completed Timing Checks';panel.before(title);
  const btn=document.createElement('button');btn.type='button';btn.id='toggleTimingHistoryBtn';btn.className='timingToggleBtn';title.before(btn);
  function apply(hidden){panel.classList.toggle('timingHidden',hidden);list.classList.toggle('timingHidden',hidden);title.classList.toggle('timingHidden',hidden);btn.textContent=hidden?'Show Completed Timing Checks':'Hide Completed Timing Checks';localStorage.setItem('timingHistoryHidden',hidden?'1':'0');}
  btn.addEventListener('click',()=>apply(!panel.classList.contains('timingHidden')));apply(localStorage.getItem('timingHistoryHidden')==='1');

  try{timingFilter='today';}catch(e){}localStorage.setItem('timingFilter','today');
  panel.querySelectorAll('[data-timing-filter]').forEach(b=>b.classList.toggle('activeFilter',b.dataset.timingFilter==='today'));
  window.renderTiming=compactRenderTiming;compactRenderTiming();
}

function bind(){
  document.addEventListener('click',e=>{
    const filter=e.target.closest('#timing [data-timing-filter]');
    if(filter){document.querySelectorAll('#timing [data-timing-filter]').forEach(x=>x.classList.remove('activeFilter'));filter.classList.add('activeFilter');setTimeout(compactRenderTiming,0);}
    const row=e.target.closest('[data-timing-detail]');if(row){const detail=$(row.dataset.timingDetail);if(detail)detail.classList.toggle('show');}
  });
  $('timingSearch')?.addEventListener('input',compactRenderTiming);
}

function updateStatus(){
  const inspector=$('timingStatusInspector'),date=$('timingStatusDate'),cloudStatus=$('timingStatusCloud');
  if(inspector)inspector.textContent=(typeof getInspector==='function'&&getInspector())||'Not logged in';
  if(date)date.textContent=new Date().toLocaleDateString('en-GB');
  if(cloudStatus){const sync=$('syncStatus')?.textContent||'Live';cloudStatus.textContent=/fail|offline|error/i.test(sync)?'Check connection':'Live';}
}

function initialise(){
  addStyles();addStatusBar();setupLayout();setupSaveProgress();setupHistory();bind();updateStatus();
  setTimeout(()=>{setupLayout();setupSaveProgress();window.renderTiming=compactRenderTiming;compactRenderTiming();},900);
  setInterval(updateStatus,2000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(initialise,1500));else setTimeout(initialise,1500);
})();