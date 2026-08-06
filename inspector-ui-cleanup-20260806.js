(function(){
'use strict';
const $=id=>document.getElementById(id);
function removeUnwanted(){
 ['homeSearchWrap','homeTodayChecksBtn','checksheetShareControls'].forEach(id=>$(id)?.remove());
 document.querySelectorAll('.savedCheckShareBtn').forEach(x=>x.remove());
 const cs=$('checksheet');if(!cs)return;
 [...cs.children].forEach(el=>{
  const t=(el.textContent||'').replace(/\s+/g,' ').trim();
  if(/Inspector\s+.*Date\s+.*Status\s+Live/i.test(t)&&!el.closest('.compactCheck'))el.remove();
 });
}
function buildToggle(){
 const chooser=$('checkTypeChooser');if(!chooser)return false;
 if(chooser.classList.contains('compactModeSwitch'))return true;
 chooser.classList.add('compactModeSwitch');
 const inspection=chooser.querySelector('[data-check-type="inspection"]');
 const timing=chooser.querySelector('[data-check-type="timing"]');
 if(inspection)inspection.textContent='INSPECTION';
 if(timing)timing.textContent='TIMING';
 return true;
}
function setNsaDefault(){
 const nsa=$('csNSA');if(!nsa)return;
 if(!nsa.dataset.cleanupDefaulted){nsa.value='N/A';nsa.dataset.cleanupDefaulted='1';nsa.dispatchEvent(new Event('change',{bubbles:true}));}
}
function buildOtherNotes(){
 const section=$('checksheet');if(!section||$('otherNotesPanel'))return false;
 const save=$('saveCheckSheetBtn');if(!save)return false;
 const panel=document.createElement('div');panel.id='otherNotesPanel';panel.className='panel otherNotesPanel';
 panel.innerHTML='<button type="button" id="otherNotesToggle" class="otherNotesToggle" aria-expanded="false"><span>OTHER NOTES</span><span id="otherNotesArrow">▼</span></button><div id="otherNotesBody" hidden><textarea class="field" id="csOtherNotes" placeholder="Add any other notes for this inspection"></textarea></div>';
 const host=save.closest('.grid')||save.parentElement;host.parentNode.insertBefore(panel,host);
 $('otherNotesToggle').onclick=()=>{const body=$('otherNotesBody'),open=body.hidden;body.hidden=!open;$('otherNotesToggle').setAttribute('aria-expanded',String(open));$('otherNotesArrow').textContent=open?'▲':'▼';};
 return true;
}
function preserveOtherNotes(){
 const save=$('saveCheckSheetBtn');if(!save||save.dataset.otherNotesHooked)return;
 save.dataset.otherNotesHooked='1';
 save.addEventListener('click',()=>{
  const note=($('csOtherNotes')?.value||'').trim(),reason=$('csDriverReason');
  if(note&&reason&&!reason.value.includes('Other Notes:'))reason.value=(reason.value.trim()?reason.value.trim()+'\n\n':'')+'Other Notes: '+note;
 },true);
 const reset=()=>setTimeout(()=>{if($('csOtherNotes'))$('csOtherNotes').value='';if($('otherNotesBody'))$('otherNotesBody').hidden=true;if($('otherNotesArrow'))$('otherNotesArrow').textContent='▼';if($('otherNotesToggle'))$('otherNotesToggle').setAttribute('aria-expanded','false');const nsa=$('csNSA');if(nsa){nsa.value='N/A';nsa.dispatchEvent(new Event('change',{bubbles:true}));}},80);
 $('clearCheckFormBtn')?.addEventListener('click',reset);
 save.addEventListener('click',reset);
}
function style(){if($('inspectorUiCleanupCss'))return;const s=document.createElement('style');s.id='inspectorUiCleanupCss';s.textContent=`
#homeSearchWrap,#homeTodayChecksBtn,.savedCheckShareBtn,#checksheetShareControls{display:none!important}
#checksheet .compactModeSwitch{position:relative;display:grid!important;grid-template-columns:1fr 1fr!important;gap:0!important;max-width:440px;margin:10px auto 16px!important;padding:4px!important;border-radius:999px!important;background:#091b2b!important;border:1px solid #416783!important}
#checksheet .compactModeSwitch button{min-height:44px!important;padding:8px 12px!important;border:0!important;border-radius:999px!important;background:transparent!important;color:#c8d5df!important;font-size:13px!important;box-shadow:none!important}
#checksheet .compactModeSwitch button.active{background:#eea83e!important;color:#07131e!important}
.otherNotesPanel{padding:0!important;overflow:hidden}.otherNotesToggle{width:100%;display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border:0;background:#17324b;color:#fff;font-weight:900;text-align:left}.otherNotesPanel #otherNotesBody{padding:12px}.otherNotesPanel textarea{min-height:120px;box-sizing:border-box;width:100%}
`;
 document.head.appendChild(s);}
function init(){style();let tries=0;const timer=setInterval(()=>{tries++;removeUnwanted();buildToggle();setNsaDefault();buildOtherNotes();preserveOtherNotes();if(tries>80)clearInterval(timer);},250);new MutationObserver(()=>{removeUnwanted();buildToggle();buildOtherNotes();}).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,2200));else setTimeout(init,2200);
})();