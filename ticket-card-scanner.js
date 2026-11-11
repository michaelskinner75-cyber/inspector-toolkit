(function(){
function init(){
 const ticket=document.getElementById('ticket'),lcd=document.getElementById('ticketLcd');
 if(!ticket||!lcd||document.getElementById('saltireScan'))return;
 const panel=document.createElement('div');panel.id='saltireScan';panel.className='panel';panel.style.cssText='padding:15px;margin:14px 0;border-radius:12px;border:1px solid #48677d';
 panel.innerHTML='<h3>▣ Saltire Card Scanner</h3><p class="small">Live card scanner — no photographs are stored. Confirm the ITSO number and DOB before logging.</p>'+
 '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="scOpen">▣ START SCANNER</button><button class="btn" type="button" id="scManual">MANUAL ENTRY</button></div>'+
 '<div id="scCamera" hidden style="margin:12px 0"><div style="position:relative;max-width:520px;aspect-ratio:1.58;background:#091825;border-radius:12px;overflow:hidden"><video id="scVideo" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover"></video><div style="position:absolute;inset:12% 5%;border:3px solid #5acbe3;border-radius:12px;box-shadow:0 0 0 100px #00162877;pointer-events:none"></div><div style="position:absolute;bottom:5px;text-align:center;width:100%;font-size:12px;color:#fff">POSITION CARD INSIDE FRAME</div></div><div style="display:flex;gap:8px;margin-top:10px"><button class="btn" type="button" id="scRead">READ CARD</button><button class="btn danger" type="button" id="scClose">CLOSE</button></div></div>'+
 '<div class="small" role="status" id="scStatus">Ready to scan.</div>'+
 '<div id="scReview" hidden><h4>Review card details</h4>'+
 '<label>ITSO number<input id="scItso" class="field" inputmode="numeric" maxlength="24" placeholder="16 digits" style="width:100%"></label>'+
 '<label>Date of birth<input id="scDob" class="field" type="date" style="width:100%"></label>'+
 '<label>Valid until (optional)<input id="scExpiry" class="field" type="date" style="width:100%"></label>'+
 '<label>Card type<select id="scType" class="field" style="width:100%"><option>Young Scot</option><option>Saltirecard</option><option>Other ITSO card</option></select></label>'+
 '<p id="scAge" style="font-weight:700"></p><p class="small">Verify the printed details. Scanning does not authenticate the card chip or travel entitlement.</p>'+
 '<button class="btn" type="button" id="scSave">CONFIRM & LOG CARD</button></div>';
 lcd.before(panel);
 const $=id=>panel.querySelector('#'+id),status=$('scStatus');let stream=null,worker=null,loading=null;
 function stop(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}$('scVideo').srcObject=null;$('scCamera').hidden=true;$('scOpen').disabled=false;}
 function age(iso){if(!iso)return null;const d=new Date(iso+'T12:00:00'),n=new Date();if(isNaN(d)||d>n)return null;let a=n.getFullYear()-d.getFullYear();if(n.getMonth()<d.getMonth()||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))a--;return a>=0&&a<=125?a:null;}
 function updateAge(){const a=age($('scDob').value),expiry=$('scExpiry').value;$('scAge').textContent='Age: '+(a===null?'—':a+' years')+(a!==null?(a<22?' · Under 22':' · 22 or older'):'')+(expiry?(expiry<new Date().toISOString().slice(0,10)?' · Expiry date passed':' · Expiry date not passed'):'');}
 function show(){ $('scReview').hidden=false;updateAge();}
 $('scDob').onchange=updateAge;$('scExpiry').onchange=updateAge;
 $('scManual').onclick=()=>{stop();show();status.textContent='Enter the ITSO number and DOB, then confirm.';};
 $('scOpen').onclick=async()=>{try{if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera access needs HTTPS');stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920}},audio:false});$('scVideo').srcObject=stream;await $('scVideo').play();$('scCamera').hidden=false;$('scOpen').disabled=true;status.textContent='Place the card inside the frame and press READ CARD.';}catch(e){stop();status.textContent='Camera unavailable: '+e.message+'. Use Manual Entry.';}};
 $('scClose').onclick=stop;
 function ocr(){if(window.Tesseract)return Promise.resolve(window.Tesseract);if(!loading)loading=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=()=>window.Tesseract?resolve(window.Tesseract):reject(Error('Recognition unavailable'));s.onerror=()=>reject(Error('Could not load recognition'));document.head.append(s);}).catch(e=>{loading=null;throw e;});return loading;}
 function isoDate(s){const m=String(s||'').match(/(\d{1,2})\s*[\/.\- ]\s*(\d{1,2})\s*[\/.\- ]\s*(\d{2,4})/);if(!m)return '';let y=+m[3];if(y<100)y+=y<=30?2000:1900;const d=new Date(y,+m[2]-1,+m[1]);return d.getFullYear()===y&&d.getMonth()+1===+m[2]&&d.getDate()===+m[1]?y+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):'';}
 function parse(raw){
  const lines=raw.split(/\n/).map(s=>s.trim()).filter(Boolean);
  let itso='';
  for(let i=0;i<lines.length;i++){const numbers=lines[i].replace(/[Oo]/g,'0').replace(/[Il|]/g,'1').replace(/\D/g,'');if(numbers.length===16&&/^63/.test(numbers)&&(/ITSO/i.test(lines[i])||/ITSO/i.test(lines[i-1]||'')||i>lines.length/2)){itso=numbers;break;}}
  if(!itso){const m=raw.match(/63\d{2}(?:\s*\d){12}/);if(m)itso=m[0].replace(/\D/g,'');}
  const find=(re)=>{for(let i=0;i<lines.length;i++)if(re.test(lines[i])){const d=isoDate(lines[i])||isoDate(lines[i+1]||'');if(d)return d;}return '';};
  return {itso,dob:find(/D\s*[O0]\s*B|BIRTH/i),expiry:find(/VALID|EXPIR/i)};
 }
 $('scRead').onclick=async()=>{
  const video=$('scVideo');if(!stream||!video.videoWidth){status.textContent='Camera is not ready.';return;}
  $('scRead').disabled=true;status.textContent='Reading card…';
  try{const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
   const T=await ocr();worker=await T.createWorker('eng');await worker.setParameters({tessedit_pageseg_mode:'11'});const r=await worker.recognize(canvas),data=parse(r.data.text||'');
   if(data.itso)$('scItso').value=data.itso.replace(/(\d{4})(?=\d)/g,'$1 ').trim();
   if(data.dob)$('scDob').value=data.dob;if(data.expiry)$('scExpiry').value=data.expiry;show();stop();
   status.textContent=data.itso&&data.dob?'Details read — check them before logging.':'Some details were unclear. Please correct or enter them manually.';
  }catch(e){status.textContent='Could not read card: '+e.message+'. Use Manual Entry.';}finally{if(worker){try{await worker.terminate();}catch(e){}worker=null;}$('scRead').disabled=false;}
 };
 $('scSave').onclick=()=>{
  const itso=$('scItso').value.replace(/\D/g,''),dob=$('scDob').value,expiry=$('scExpiry').value,years=age(dob);
  if(!/^63\d{14}$/.test(itso)){status.textContent='Enter the complete 16-digit ITSO number, starting 63.';return;}
  if(years===null){status.textContent='Enter a valid date of birth.';return;}
  if(expiry&&expiry<dob){status.textContent='Check the expiry date.';return;}
  if(typeof window.addTicket!=='function'){status.textContent='Ticket Log is not ready; nothing saved.';return;}
  // Uses the existing Ticket Log storage and Google Sheets sync; never stores DOB or card image.
  window.addTicket($('scType').value+' | ITSO '+itso+' | Age '+years+(expiry?' | Valid to '+expiry:''));
  status.textContent='Card logged. No card image or DOB saved.';
  $('scItso').value='';$('scDob').value='';$('scExpiry').value='';$('scReview').hidden=true;
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();