(function(){
'use strict';
const $=id=>document.getElementById(id);
const TARGETS=[
  {id:'csVehicleIssueNotes',context:'vehicle'},
  {id:'csDriverReason',context:'driver'}
];
function style(){
  if($('checksheetAiToolsCss'))return;
  const s=document.createElement('style');
  s.id='checksheetAiToolsCss';
  s.textContent=`
    #checksheet .aiCommentTools{display:grid;grid-template-columns:auto auto auto 1fr;gap:7px;align-items:center;margin-top:7px}
    #checksheet .aiCommentBtn{border:1px solid #416783;border-radius:9px;background:#17324b;color:#fff;padding:8px 10px;font-weight:800;font-size:11px;min-height:36px}
    #checksheet .aiCommentBtn.rewrite{background:#eea83e;border-color:#eea83e;color:#07131e}
    #checksheet .aiCommentBtn.undo{display:none;background:#263e51}
    #checksheet .aiCommentStatus{font-size:11px;color:#b8c5ce;text-align:right;min-height:16px}
    #checksheet .aiCommentTools.busy .aiCommentBtn{opacity:.55;pointer-events:none}
    @media(max-width:620px){#checksheet .aiCommentTools{grid-template-columns:1fr 1fr 1fr}#checksheet .aiCommentStatus{grid-column:1/-1;text-align:left}}
  `;
  document.head.appendChild(s);
}
function messageFor(error){
  const msg=String(error&&error.message||error||'').trim();
  if(/AI_NOT_CONFIGURED|unknown action|not configured/i.test(msg))return 'Automatic AI is ready here, but the secure AI service still needs to be enabled.';
  if(/Failed to fetch|NetworkError|Load failed/i.test(msg))return 'AI service could not be reached. Your text has not been changed.';
  return msg||'AI could not update this comment.';
}
async function runAi(textarea,context,mode,tools){
  const original=String(textarea.value||'').trim();
  const status=tools.querySelector('.aiCommentStatus');
  if(!original){status.textContent='Type a comment first.';textarea.focus();return;}
  if(typeof WEB_APP_URL==='undefined'||!WEB_APP_URL){status.textContent='AI service is not connected.';return;}
  tools.classList.add('busy');
  status.textContent=mode==='spellcheck'?'Checking spelling and grammar…':'Rewriting professionally…';
  try{
    const response=await fetch(WEB_APP_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'aiComment',mode,context,text:original})});
    const raw=await response.text();
    let data=null;try{data=JSON.parse(raw);}catch(e){throw new Error('AI_NOT_CONFIGURED');}
    if(!data||data.ok!==true||!String(data.text||'').trim())throw new Error((data&&data.error)||'AI_NOT_CONFIGURED');
    textarea.dataset.aiPrevious=textarea.value;
    textarea.value=String(data.text).trim();
    textarea.dispatchEvent(new Event('input',{bubbles:true}));
    const undo=tools.querySelector('.aiCommentBtn.undo');if(undo)undo.style.display='block';
    status.textContent=mode==='spellcheck'?'Spelling and grammar corrected.':'Comment rewritten. Check it before saving.';
  }catch(error){
    status.textContent=messageFor(error);
  }finally{
    tools.classList.remove('busy');
  }
}
function addTools(textarea,context){
  if(!textarea||textarea.dataset.aiTools==='1')return false;
  textarea.dataset.aiTools='1';
  textarea.spellcheck=true;
  textarea.autocapitalize='sentences';
  const box=document.createElement('div');
  box.className='aiCommentTools';
  box.dataset.aiFor=textarea.id;
  box.innerHTML='<button type="button" class="aiCommentBtn" data-ai-mode="spellcheck">✓ SPELL CHECK</button><button type="button" class="aiCommentBtn rewrite" data-ai-mode="rewrite">✦ REWRITE</button><button type="button" class="aiCommentBtn undo">UNDO</button><span class="aiCommentStatus"></span>';
  textarea.insertAdjacentElement('afterend',box);
  box.addEventListener('click',event=>{
    const action=event.target.closest('[data-ai-mode]');
    if(action){event.preventDefault();runAi(textarea,context,action.dataset.aiMode,box);return;}
    const undo=event.target.closest('.undo');
    if(undo&&textarea.dataset.aiPrevious!==undefined){
      textarea.value=textarea.dataset.aiPrevious;
      delete textarea.dataset.aiPrevious;
      undo.style.display='none';
      textarea.dispatchEvent(new Event('input',{bubbles:true}));
      box.querySelector('.aiCommentStatus').textContent='Previous wording restored.';
    }
  });
  return true;
}
function enhance(){
  style();
  TARGETS.forEach(t=>addTools($(t.id),t.context));
}
function init(){
  enhance();
  const sheet=$('checksheet');
  if(sheet)new MutationObserver(()=>requestAnimationFrame(enhance)).observe(sheet,{childList:true,subtree:true});
  let tries=0;const timer=setInterval(()=>{enhance();if(TARGETS.every(t=>$(t.id)?.dataset.aiTools==='1')||++tries>30)clearInterval(timer);},350);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();