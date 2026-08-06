(function(){
'use strict';
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
function addCss(doc){
 if(doc.getElementById('reportCardHighlightCss'))return;
 const s=doc.createElement('style');s.id='reportCardHighlightCss';
 s.textContent=`
#checkList .compactTop{position:relative}
#checkList .reportCardBadges{display:flex;flex-direction:column;align-items:flex-end;gap:6px;margin-left:auto;min-width:128px}
#checkList .reportCardBadge{display:inline-flex;align-items:center;justify-content:center;min-width:116px;padding:6px 10px;border-radius:999px;font-size:11px;font-weight:900;line-height:1.1;text-align:center;color:#fff}
#checkList .reportCardBadge.vehicle{background:#e67e00}
#checkList .reportCardBadge.driver{background:#d99b19;color:#07131e}
#checkList .reportDetailHighlight{margin:12px 0;padding:13px 14px;border-radius:10px;background:rgba(230,126,0,.13);border-left:6px solid #e67e00;white-space:pre-wrap}
#checkList .reportDetailHighlight.driver{background:rgba(217,155,25,.13);border-left-color:#d99b19}
#checkList .reportDetailHighlight b{color:#ffb24d}
@media(max-width:620px){#checkList .reportCardBadges{min-width:104px}#checkList .reportCardBadge{min-width:96px;padding:5px 7px;font-size:10px}}
`;
 doc.head.appendChild(s);
}
function valueAfter(text,label,nextLabels){
 const src=String(text||'');
 const start=src.toLowerCase().indexOf(label.toLowerCase());
 if(start<0)return'';
 let out=src.slice(start+label.length).trim();
 let end=out.length;
 for(const n of nextLabels){const i=out.toLowerCase().indexOf(n.toLowerCase());if(i>=0&&i<end)end=i;}
 return norm(out.slice(0,end).replace(/^[:\-\s]+/,''));
}
function enhanceCard(card){
 const top=card.querySelector('.compactTop');
 const details=card.querySelector('.compactDetails');
 if(!top)return;
 const all=norm((details||card).innerText);
 const vehicleIssue=valueAfter(all,'Vehicle issue',['Vehicle comments','Driver Report','NSA','Passenger']);
 const vehicleComments=valueAfter(all,'Vehicle comments',['Driver Report','NSA','Passenger']);
 const driverStatus=valueAfter(all,'Driver Report',['Vehicle issue','Vehicle comments','NSA','Passenger']);
 const driverReason=valueAfter(all,'Driver report reason / inspection notes',['Vehicle issue','Vehicle comments','NSA','Passenger']);
 let badgeWrap=top.querySelector('.reportCardBadges');
 if(!badgeWrap){badgeWrap=document.createElement('div');badgeWrap.className='reportCardBadges';const existing=top.querySelector('.nsaBadge,.compactBadges,.statusBadges');if(existing&&existing.parentNode){existing.parentNode.insertBefore(badgeWrap,existing.nextSibling);}else top.appendChild(badgeWrap);}
 badgeWrap.innerHTML='';
 if(vehicleIssue&& !/^(none|no|n\/a|not applicable)$/i.test(vehicleIssue))badgeWrap.insertAdjacentHTML('beforeend','<span class="reportCardBadge vehicle">VEHICLE ISSUES</span>');
 if(driverStatus&& !/^(ok|none|no|n\/a|not applicable)$/i.test(driverStatus))badgeWrap.insertAdjacentHTML('beforeend','<span class="reportCardBadge driver">DRIVER '+driverStatus.toUpperCase()+'</span>');
 if(details){
  details.querySelectorAll('.reportDetailHighlight').forEach(x=>x.remove());
  if(driverStatus&& !/^(ok|none|no|n\/a|not applicable)$/i.test(driverStatus)){
   const box=document.createElement('div');box.className='reportDetailHighlight driver';box.innerHTML='<b>Driver Report: '+driverStatus+'</b>'+(driverReason?'<br>'+driverReason:'');details.appendChild(box);
  }
  if(vehicleIssue&& !/^(none|no|n\/a|not applicable)$/i.test(vehicleIssue)){
   const box=document.createElement('div');box.className='reportDetailHighlight vehicle';box.innerHTML='<b>Vehicle Issue: '+vehicleIssue+'</b>'+(vehicleComments?'<br><b>Vehicle Comments:</b> '+vehicleComments:'');details.appendChild(box);
  }
 }
}
function enhance(doc){
 addCss(doc);
 doc.querySelectorAll('#checkList .compactCheck').forEach(enhanceCard);
}
window.applyReportCardHighlights=function(){enhance(document);};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>enhance(document),500));else setTimeout(()=>enhance(document),500);
document.addEventListener('click',e=>{if(e.target.closest('[data-open="checksheet"],#refreshChecksBtn,[data-check-filter],.compactTop,.openFullDetailsBtn'))setTimeout(()=>enhance(document),180);});
})();
