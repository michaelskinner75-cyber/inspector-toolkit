(function(){
function init(){
 const section=document.getElementById('checksheet');if(!section||document.getElementById('reportScanPanel'))return;
 const p=document.createElement('div');p.id='reportScanPanel';p.className='panel';
 p.innerHTML='<h3>Scan Inspector Report</h3><p class="small">Take a photo of the printed report. Review recognised fields before filling the check sheet. Manual entry remains available.</p><label class="btn" style="display:inline-block;padding:12px;cursor:pointer;margin:4px">📷 SCAN REPORT<input type="file" accept="image/*" capture="environment" hidden id="reportCamera"></label><label class="btn" style="display:inline-block;padding:12px;cursor:pointer;margin:4px">UPLOAD PHOTO<input type="file" accept="image/*" hidden id="reportUpload"></label><div id="reportScanStatus" class="small" role="status"></div><div id="reportScanReview"></div>';
 section.querySelector('h2').insertAdjacentElement('afterend',p);
 const status=p.querySelector('#reportScanStatus'),review=p.querySelector('#reportScanReview');
 const clean=s=>(s||'').replace(/[Oo]/g,'0').replace(/[Il|]/g,'1').replace(/[^0-9]/g,'');
 function extract(raw){
  const lines=raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const find=label=>{const re=new RegExp('^'+label+'\\s*[:#-]?\\s*(.*)$','i');for(let i=0;i<lines.length;i++){const m=lines[i].match(re);if(m)return m[1].trim()||lines[i+1]||'';}return '';};
  const date=raw.match(/\b([0-3]?\d)\/([01]?\d)\/(\d{2,4})\b/);
  const dt=date?(date[3].length===2?'20'+date[3]:date[3])+'-'+date[2].padStart(2,'0')+'-'+date[1].padStart(2,'0'):'';
  const tm=s=>{const m=(s||'').replace(/O/g,'0').match(/(\d{1,2})\s*[:.]\s*(\d{2})/);return m?m[1].padStart(2,'0')+':'+m[2]:'';};
  return {date:dt,fleet:clean(find('BUS\\s*NO')),driver:clean(find('DRIVER')),service:(find('SERVICE').match(/[A-Z]?\d+[A-Z]?/i)||[])[0]||'',equipment:clean(find('EQUIP\\s*#?')),trip:clean(find('TRIP\\s*#?')),scheduled:tm(find('SCHD\\s*START')),actual:tm(find('REAL\\s*START')),first:clean(find('FIRST\\s*TICKET')),last:clean(find('LAST\\s*TICKET'))};
 }
 function render(v){
  review.replaceChildren();
  const h=document.createElement('h4');h.textContent='Review scanned details';review.append(h);
  const rows=[];
  [['fleet','Fleet number','csFleet'],['driver','Driver','csDriver'],['service','Service','csService'],['date','Report date','csDate']].forEach(([key,title,id])=>{
   const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;align-items:center;margin:8px 0';
   const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!v[key];cb.disabled=!v[key];
   const label=document.createElement('label');label.textContent=title;label.style.flex='1';
   const input=document.createElement('input');input.className='field';input.style.width='100%';input.value=v[key]||'';label.append(input);row.append(cb,label);review.append(row);rows.push({cb,input,id});
  });
  const extra=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Other report details (reference only)';extra.append(summary);
  [['Equipment',v.equipment],['Trip',v.trip],['Scheduled start',v.scheduled],['Actual start',v.actual],['First ticket',v.first],['Last ticket',v.last]].forEach(([a,b])=>{const d=document.createElement('div');d.textContent=a+': '+(b||'not read');extra.append(d);});review.append(extra);
  const button=document.createElement('button');button.className='btn';button.type='button';button.textContent='APPLY TO CHECK SHEET';button.style.marginTop='10px';button.onclick=()=>{
   let count=0;rows.forEach(({cb,input,id})=>{if(!cb.checked||!input.value.trim())return;const el=document.getElementById(id);if(!el)return;el.value=input.value.trim();el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));count++;});
   status.textContent=count+' fields filled. Please check these and finish the other parts of your check sheet before saving.';
  };review.append(button);
 }
 let loading;
 function getTesseract(){if(window.Tesseract)return Promise.resolve(window.Tesseract);if(!loading)loading=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=()=>resolve(window.Tesseract);s.onerror=()=>reject(Error('Unable to load OCR library'));document.head.append(s);}).catch(e=>{loading=null;throw e;});return loading;}
 async function scan(file){if(!file)return;review.replaceChildren();status.textContent='Reading report photograph…';let worker;try{const t=await getTesseract();worker=await t.createWorker('eng');const result=await worker.recognize(file);const values=extract(result.data.text||'');if(!values.fleet&&!values.driver&&!values.service&&!values.date)throw Error('No recognisable report details');render(values);status.textContent='Review the recognised details, then select Apply.';}catch(e){status.textContent='Scan failed: '+e.message+'. You can still complete the sheet manually.';}finally{if(worker)await worker.terminate();}}
 ['reportCamera','reportUpload'].forEach(id=>p.querySelector('#'+id).addEventListener('change',e=>{scan(e.target.files[0]);e.target.value='';}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();