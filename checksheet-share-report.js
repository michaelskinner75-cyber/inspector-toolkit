(function(){
'use strict';
const $=id=>document.getElementById(id);
const SKIP_IDS=new Set(['checkSearch','saveCheckSheetBtn','clearCheckFormBtn','refreshChecksBtn']);
function visible(el){return !!(el.offsetWidth||el.offsetHeight||el.getClientRects().length);}
function cleanLabel(text){return String(text||'').replace(/\s+/g,' ').replace(/[:*]+$/,'').trim();}
function fieldLabel(el){
 const linked=el.id&&document.querySelector('label[for="'+CSS.escape(el.id)+'"]');
 if(linked)return cleanLabel(linked.textContent);
 const parentLabel=el.closest('label');if(parentLabel)return cleanLabel(parentLabel.childNodes[0]?.textContent||parentLabel.textContent);
 const block=el.closest('.fieldBlock,.formField,.fieldGroup');
 const blockLabel=block&&block.querySelector('label,.fieldLabel,.fieldTitle');if(blockLabel)return cleanLabel(blockLabel.textContent);
 const previous=el.previousElementSibling;if(previous&&/^(LABEL|H3|H4)$/.test(previous.tagName))return cleanLabel(previous.textContent);
 if(el.placeholder)return cleanLabel(el.placeholder);
 return cleanLabel((el.id||el.name||'Field').replace(/^cs/,'').replace(/([a-z])([A-Z])/g,'$1 $2'));
}
function fieldValue(el){
 if(el.type==='checkbox'||el.type==='radio')return el.checked?(el.value&&el.value!=='on'?el.value:'Yes'):'';
 if(el.tagName==='SELECT')return cleanLabel(el.options[el.selectedIndex]?.text||el.value);
 if(el.type==='date'&&el.value){const d=new Date(el.value+'T00:00:00');return isNaN(d)?el.value:d.toLocaleDateString('en-GB');}
 return String(el.value||'').trim();
}
function sectionName(el){
 const section=el.closest('.formSection,.panel');
 const title=section&&section.querySelector('.formSectionTitle,h3,.panelTitle');
 return cleanLabel(title?.textContent)||'Inspection Details';
}
function buildReport(){
 const sheet=$('checksheet');if(!sheet)return'';
 const inspector=localStorage.getItem('activeInspector')||$('loggedInInspector')?.textContent?.trim()||'Not recorded';
 const controls=[...sheet.querySelectorAll('input,select,textarea')].filter(el=>!SKIP_IDS.has(el.id)&&el.type!=='file'&&visible(el));
 const groups=new Map();
 for(const el of controls){
  const value=fieldValue(el);if(!value)continue;
  const label=fieldLabel(el);if(!label)continue;
  const section=sectionName(el);
  if(!groups.has(section))groups.set(section,[]);
  groups.get(section).push([label,value]);
 }
 const now=new Date();
 const lines=['INSPECTOR CHECK SHEET REPORT','',`Inspector: ${inspector}`,`Report created: ${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`];
 for(const [section,rows] of groups){
  lines.push('',section.toUpperCase(),'-'.repeat(Math.min(42,Math.max(8,section.length))));
  const seen=new Set();
  for(const [label,value] of rows){const key=label+'|'+value;if(seen.has(key))continue;seen.add(key);lines.push(label+': '+value);}
 }
 lines.push('','Generated from Inspector Hub.');
 return lines.join('\n');
}
function ensureModal(){
 if($('checksheetReportModal'))return;
 const modal=document.createElement('div');modal.id='checksheetReportModal';modal.className='shareReportModal';modal.hidden=true;
 modal.innerHTML='<div class="shareReportCard" role="dialog" aria-modal="true" aria-labelledby="shareReportTitle"><h3 id="shareReportTitle">Inspection Report Preview</h3><textarea id="shareReportText" readonly></textarea><div class="shareReportActions"><button type="button" class="btn" id="copyReportBtn">COPY</button><button type="button" class="btn" id="shareReportNowBtn">SHARE REPORT</button><button type="button" class="btn danger" id="closeReportBtn">CLOSE</button></div></div>';
 document.body.appendChild(modal);
 $('closeReportBtn').onclick=()=>{modal.hidden=true;};
 modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
 $('copyReportBtn').onclick=async()=>{const text=$('shareReportText').value;try{await navigator.clipboard.writeText(text);alert('Report copied.');}catch(e){$('shareReportText').select();document.execCommand('copy');alert('Report copied.');}};
 $('shareReportNowBtn').onclick=()=>shareText($('shareReportText').value);
 }
async function shareText(text){
 if(!text)return;
 const service=$('csService')?.value?.trim();const fleet=$('csFleet')?.value?.trim();
 const title='Inspector Check Sheet Report'+(service?' - Service '+service:'')+(fleet?' - Fleet '+fleet:'');
 if(navigator.share){try{await navigator.share({title,text});return;}catch(e){if(e.name==='AbortError')return;}}
 const subject=encodeURIComponent(title);const body=encodeURIComponent(text.slice(0,12000));
 window.location.href='mailto:?subject='+subject+'&body='+body;
}
function preview(){const text=buildReport();if(!text){alert('Unable to create the report.');return;}ensureModal();$('shareReportText').value=text;$('checksheetReportModal').hidden=false;}
function addButtons(){
 const sheet=$('checksheet');const save=$('saveCheckSheetBtn');if(!sheet||!save||$('checksheetShareControls'))return false;
 const controls=document.createElement('div');controls.id='checksheetShareControls';controls.className='grid shareReportControls';
 controls.innerHTML='<button type="button" class="btn" id="previewCheckReportBtn">PREVIEW REPORT</button><button type="button" class="btn sharePrimary" id="shareCheckReportBtn">SHARE REPORT</button>';
 const saveGrid=save.closest('.grid');saveGrid.insertAdjacentElement('afterend',controls);
 $('previewCheckReportBtn').onclick=preview;
 $('shareCheckReportBtn').onclick=()=>{const text=buildReport();if(!text){alert('Unable to create the report.');return;}shareText(text);};
 return true;
}
function style(){if($('checksheetShareCss'))return;const s=document.createElement('style');s.id='checksheetShareCss';s.textContent='.shareReportControls{margin-top:10px}.shareReportControls .sharePrimary{background:#eea83e!important;color:#07131e!important}.shareReportModal{position:fixed;inset:0;z-index:100000;background:rgba(3,12,20,.82);padding:18px;overflow:auto}.shareReportModal[hidden]{display:none}.shareReportCard{max-width:720px;margin:4vh auto;background:#102b40;border:1px solid #507087;border-radius:16px;padding:16px;color:#fff}.shareReportCard h3{margin:0 0 12px}.shareReportCard textarea{box-sizing:border-box;width:100%;min-height:56vh;padding:14px;border:1px solid #7890a0;border-radius:10px;background:#fff;color:#07131e;font:14px/1.45 Arial,sans-serif;resize:vertical}.shareReportActions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px}@media(max-width:560px){.shareReportActions{grid-template-columns:1fr 1fr}.shareReportActions .danger{grid-column:1/-1}}';document.head.appendChild(s);}
function init(){style();ensureModal();if(addButtons())return;let tries=0;const timer=setInterval(()=>{if(addButtons()||++tries>20)clearInterval(timer);},250);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();