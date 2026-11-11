(function(){
function init(){
 const section=document.getElementById('checksheet');if(!section||document.getElementById('reportScanPanel'))return;
 const p=document.createElement('div');p.id='reportScanPanel';p.className='panel';
 p.innerHTML='<h3>Scan Inspector Report</h3><p class="small">Take a photo of the printed report. Review recognised fields before filling the check sheet. Manual entry remains available.</p><label class="btn" style="display:inline-block;padding:12px;cursor:pointer;margin:4px">📷 SCAN REPORT<input type="file" accept="image/*" capture="environment" hidden id="reportCamera"></label><label class="btn" style="display:inline-block;padding:12px;cursor:pointer;margin:4px">UPLOAD PHOTO<input type="file" accept="image/*" hidden id="reportUpload"></label><div id="reportScanStatus" class="small" role="status"></div><div id="reportScanReview"></div>';
 section.querySelector('h2').insertAdjacentElement('afterend',p);
 const status=p.querySelector('#reportScanStatus'),review=p.querySelector('#reportScanReview');
 const clean=s=>(s||'').replace(/[Oo]/g,'0').replace(/[Il|]/g,'1').replace(/[^0-9]/g,'');
 function extract(raw){
  const text=String(raw||'').replace(/\r/g,'\n');
  const lines=text.split(/\n/).map(s=>s.trim()).filter(Boolean);
  const time=x=>{let m=String(x||'').replace(/[Oo]/g,'0').match(/(?:^|[^\d])([01]?\d|2[0-3])\s*[:.]\s*([0-5]\d)(?!\d)/);return m?m[1].padStart(2,'0')+':'+m[2]:'';};
  const numeric=x=>String(x||'').replace(/[Oo]/g,'0').replace(/[Il|]/g,'1').replace(/[^0-9]/g,'');
  const labelMatchers={
   fleet:/B\s*U\s*S\s*(?:N\s*[O0]|N[0O]|NUMBER|#)/i,
   driver:/D\s*R\s*[I1]\s*V\s*E\s*R/i,
   service:/S\s*E\s*R\s*V\s*[I1]\s*C\s*E/i,
   equipment:/E\s*Q\s*U\s*[I1]\s*P\s*#?/i,
   trip:/T\s*R\s*[I1]\s*P\s*#?/i,
   scheduled:/S\s*C\s*H\s*[D0]\s*S\s*T\s*A\s*R\s*T/i,
   actual:/R\s*E\s*A\s*L\s*S\s*T\s*A\s*R\s*T/i,
   first:/F\s*[I1]\s*R\s*S\s*T\s*T\s*[I1]\s*C\s*K\s*T/i,
   last:/L\s*A\s*S\s*T\s*T\s*[I1]\s*C\s*K\s*T/i
  };
  function value(k){
    const re=labelMatchers[k];
    for(let i=0;i<lines.length;i++){
      const line=lines[i];
      const match=re.exec(line);
      if(match){
        let remaining=line.slice(match.index+match[0].length).replace(/^[\s:#.=]+/,'').trim();
        if(!remaining && i+1<lines.length)remaining=lines[i+1];
        return remaining;
      }
    }
    return '';
  }
  function number(k,min,max){
   const s=value(k);
   const re=new RegExp('[0-9OoIl|]{'+min+','+max+'}','g');
   const hits=[...s.matchAll(re)].map(m=>numeric(m[0])).filter(n=>n.length>=min&&n.length<=max);
   return hits[0]||'';
  }
  const dateMatch=text.match(/\b([0-3]?\d)\s*[\/.\-]\s*([01]?\d)\s*[\/.\-]\s*(20\d{2}|\d{2})\b/);
  let date='';
  if(dateMatch){
   const y=dateMatch[3].length===2?'20'+dateMatch[3]:dateMatch[3],mo=+dateMatch[2],da=+dateMatch[1];
   if(mo>=1&&mo<=12&&da>=1&&da<=31)date=y+'-'+dateMatch[2].padStart(2,'0')+'-'+dateMatch[1].padStart(2,'0');
  }
  // Use the report header time, NEVER the journey's scheduled or actual start.
  const headerPortion=text.split(/E\s*Q\s*U\s*[I1]\s*P|B\s*U\s*S\s*N\s*O/i)[0];
  const headerTimes=[...headerPortion.matchAll(/(?:^|[^\d])([01]?\d|2[0-3])\s*[:.]\s*([0-5]\d)(?!\d)/g)];
  const checked=headerTimes.length?time(headerTimes[headerTimes.length-1][0]):'';
  const serviceCandidate=value('service').match(/(?:^|\s)([A-Z]?\d{1,3}[A-Z]?)(?!\d)/i);
  return {date,checked,fleet:number('fleet',4,6),driver:number('driver',3,8),service:serviceCandidate?serviceCandidate[1]:'',
   equipment:number('equipment',5,12),trip:number('trip',1,4),
   scheduled:time(value('scheduled')),actual:time(value('actual')),
   first:number('first',3,9),last:number('last',3,9)};
 }
 function makeEnhancedPhoto(file){
  return new Promise((resolve,reject)=>{
   const img=new Image(),url=URL.createObjectURL(file);
   img.onload=()=>{try{
    const c=document.createElement('canvas'),scale=Math.max(1,Math.min(2.2,1800/img.width));
    c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
    const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,c.width,c.height);
    const frame=ctx.getImageData(0,0,c.width,c.height),data=frame.data;
    for(let i=0;i<data.length;i+=4){
     const gray=.299*data[i]+.587*data[i+1]+.114*data[i+2];
     // High contrast for faint thermal-printer characters; light blue watermark fades.
     const value=gray<168?0:255;
     data[i]=data[i+1]=data[i+2]=value;
    }
    ctx.putImageData(frame,0,0);c.toBlob(blob=>blob?resolve(blob):reject(Error('Cannot process image')),'image/png');
   }catch(e){reject(e);}finally{URL.revokeObjectURL(url);}};
   img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Cannot open image'));};
   img.src=url;
  });
 }
 function render(v){
  review.replaceChildren();
  const h=document.createElement('h4');h.textContent='Review scanned details';review.append(h);
  const rows=[];
  [['fleet','Fleet number','csFleet'],['driver','Driver','csDriver'],['service','Service','csService'],['date','Report date','csDate'],['checked','Time Checked','csTimeOn']].forEach(([key,title,id])=>{
   const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;align-items:center;margin:8px 0';
   const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!v[key];cb.disabled=false;
   const label=document.createElement('label');label.textContent=title;label.style.flex='1';
   const input=document.createElement('input');input.className='field';input.style.width='100%';input.value=v[key]||'';label.append(input);input.addEventListener('input',()=>{if(input.value.trim())cb.checked=true;});row.append(cb,label);review.append(row);rows.push({cb,input,id});
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
 async function scan(file){
  if(!file)return;
  review.replaceChildren();status.textContent='Reading report photograph…';let worker;
  try{
   const t=await getTesseract();
   worker=await t.createWorker('eng');
   const standard=await worker.recognize(file);
   let raw=standard.data.text||'',best=extract(raw);
   const filled=v=>['date','checked','fleet','driver','service'].filter(k=>v[k]).length;
   // If normal recognition misses key fields, try a high-contrast image.
   if(filled(best)<5){
     status.textContent='Checking faint print with enhanced recognition…';
     const enhanced=await makeEnhancedPhoto(file);
     const second=await worker.recognize(enhanced);
     const alt=extract(second.data.text||'');
     ['date','checked','fleet','driver','service','equipment','trip','scheduled','actual','first','last'].forEach(k=>{
       if(!best[k]&&alt[k])best[k]=alt[k];
       // Preserve disagreement for manual confirmation rather than making a silent guess.
       else if(best[k]&&alt[k]&&best[k]!==alt[k]&&['fleet','driver','service','date','checked'].includes(k)) best[k]='';
     });
     raw+='\n\n--- Enhanced read ---\n'+(second.data.text||'');
   }
   render(best);
   const details=document.createElement('details');details.style.marginTop='12px';
   const summary=document.createElement('summary');summary.textContent='View recognised text / troubleshoot';details.append(summary);
   const pre=document.createElement('pre');pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-height:260px;overflow:auto;font-size:12px';
   pre.textContent=raw||'No readable text';details.append(pre);review.append(details);
   status.textContent=filled(best)<3?'Only some fields were recognised. Please enter or correct missing values before applying.':'Please verify every recognised value before applying.';
  }catch(e){status.textContent='Scan could not read the report: '+e.message+'. Manual entry remains available.';}
  finally{if(worker)try{await worker.terminate();}catch(e){}}
 }
 ['reportCamera','reportUpload'].forEach(id=>p.querySelector('#'+id).addEventListener('change',e=>{scan(e.target.files[0]);e.target.value='';}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();