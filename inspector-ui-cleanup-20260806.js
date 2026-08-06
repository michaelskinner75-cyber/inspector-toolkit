(function(){
'use strict';
const $=id=>document.getElementById(id);
function removeUnwanted(){
 ['homeSearchWrap','homeTodayChecksBtn','checksheetShareControls'].forEach(id=>$(id)?.remove());
 document.querySelectorAll('.savedCheckShareBtn').forEach(x=>x.remove());
 const cs=$('checksheet');
 if(!cs)return;
 [...cs.children].forEach(el=>{
  const t=(el.textContent||'').replace(/\s+/g,' ').trim();
  if(/Inspector\s+.*Date\s+.*Status\s+Live/i.test(t)&&!el.closest('.compactCheck'))el.remove();
 });
}
function addStyle(){
 if($('inspectorUiCleanupCss'))return;
 const s=document.createElement('style');
 s.id='inspectorUiCleanupCss';
 s.textContent='#homeSearchWrap,#homeTodayChecksBtn,.savedCheckShareBtn,#checksheetShareControls{display:none!important}#checksheet .compactModeSwitch{display:grid!important;grid-template-columns:1fr 1fr!important;gap:0!important;max-width:440px;margin:10px auto 16px!important;padding:4px!important;border-radius:999px!important;background:#091b2b!important;border:1px solid #416783!important}#checksheet .compactModeSwitch button{min-height:44px!important;padding:8px 12px!important;border:0!important;border-radius:999px!important;background:transparent!important;color:#c8d5df!important;font-size:13px!important;box-shadow:none!important}#checksheet .compactModeSwitch button.active{background:#eea83e!important;color:#07131e!important}#checksheet .otherNotesPanel{padding:0!important;overflow:hidden;margin-top:12px!important}#checksheet .otherNotesToggle{width:100%;display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border:0;background:#17324b;color:#fff;font-weight:900;text-align:left}#checksheet .otherNotesPanel #otherNotesBody{padding:12px}#checksheet .otherNotesPanel label{display:block;margin-bottom:7px;color:#c8d5df;font-weight:800}#checksheet .otherNotesPanel textarea{min-height:120px;box-sizing:border-box;width:100%}#integratedTimingPanel .timingResultsActionBtn{width:100%;margin-top:12px;min-height:50px;font-weight:900}';
 document.head.appendChild(s);
}
function buildToggle(){
 const chooser=$('checkTypeChooser');
 if(!chooser)return;
 chooser.classList.add('compactModeSwitch');
 const inspection=chooser.querySelector('[data-check-type="inspection"]');
 const timing=chooser.querySelector('[data-check-type="timing"]');
 if(inspection)inspection.textContent='INSPECTION';
 if(timing)timing.textContent='TIMING';
}
function setNsaDefault(){
 const nsa=$('csNSA');
 if(nsa&&!nsa.dataset.cleanupDefaulted){
  nsa.value='N/A';
  nsa.dataset.cleanupDefaulted='1';
  nsa.dispatchEvent(new Event('change',{bubbles:true}));
 }
}
function notesAnchor(){
 const reason=$('csDriverReason');
 if(reason){const panel=reason.closest('.panel');if(panel)return{parent:panel.parentNode,before:panel.nextSibling};}
 const vehicle=$('csVehicleComments');
 if(vehicle){const panel=vehicle.closest('.panel');if(panel)return{parent:panel.parentNode,before:panel.nextSibling};}
 const save=$('saveCheckSheetBtn');
 if(save){const host=save.closest('.grid')||save.parentElement;return{parent:host.parentNode,before:host};}
 return null;
}
function syncNotesVisibility(){
 const panel=$('otherNotesPanel');
 if(!panel)return;
 const active=$('checkTypeChooser')?.querySelector('[data-check-type="inspection"]')?.classList.contains('active');
 panel.classList.toggle('inspectionModeHidden',active===false);
}
function buildOtherNotes(){
 const anchor=notesAnchor();
 if(!anchor)return;
 let panel=$('otherNotesPanel');
 if(!panel){
  panel=document.createElement('div');
  panel.id='otherNotesPanel';
  panel.className='panel otherNotesPanel inspectionOtherNotes';
  panel.innerHTML='<button type="button" id="otherNotesToggle" class="otherNotesToggle" aria-expanded="false"><span>Other Notes</span><span id="otherNotesArrow">▼</span></button><div id="otherNotesBody" hidden><label for="csOtherNotes">Additional inspection notes</label><textarea class="field" id="csOtherNotes" placeholder="Add any other notes for this inspection"></textarea></div>';
  anchor.parent.insertBefore(panel,anchor.before);
  $('otherNotesToggle').onclick=()=>{
   const body=$('otherNotesBody');
   const open=body.hidden;
   body.hidden=!open;
   $('otherNotesToggle').setAttribute('aria-expanded',String(open));
   $('otherNotesArrow').textContent=open?'▲':'▼';
  };
 }
 syncNotesVisibility();
}
function buildTimingResultsButton(){
 const wrap=document.querySelector('#integratedTimingPanel .itResultsWrap');
 const body=$('itResultsBody');
 if(!wrap||!body||$('timingResultsActionBtn'))return;
 const btn=document.createElement('button');
 btn.type='button';
 btn.id='timingResultsActionBtn';
 btn.className='btn timingResultsActionBtn';
 btn.textContent='VIEW TIMING CHECK RESULTS';
 wrap.parentNode.insertBefore(btn,wrap);
 const old=$('itToggleResults');if(old)old.style.display='none';
 const head=wrap.querySelector('.itResultsHead');if(head)head.style.display='none';
 wrap.style.display='none';body.style.display='none';
 btn.onclick=()=>{
  const open=wrap.style.display==='none';
  wrap.style.display=open?'block':'none';
  body.style.display=open?'':'none';
  btn.textContent=open?'HIDE TIMING CHECK RESULTS':'VIEW TIMING CHECK RESULTS';
 };
}
function bindSave(){
 const save=$('saveCheckSheetBtn');
 if(!save||save.dataset.otherNotesHooked)return;
 save.dataset.otherNotesHooked='1';
 save.addEventListener('click',()=>{
  const note=($('csOtherNotes')?.value||'').trim();
  const reason=$('csDriverReason');
  if(note&&reason&&!reason.value.includes('Other Notes:'))reason.value=(reason.value.trim()?reason.value.trim()+'\n\n':'')+'Other Notes: '+note;
 },true);
}
function apply(){
 addStyle();removeUnwanted();buildToggle();setNsaDefault();buildOtherNotes();buildTimingResultsButton();bindSave();syncNotesVisibility();
}
function init(){
 apply();
 setTimeout(apply,500);
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-check-type]'))setTimeout(syncNotesVisibility,0);
  if(e.target.closest('[data-open="checksheet"]'))setTimeout(apply,0);
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();