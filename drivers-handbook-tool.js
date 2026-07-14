(function(){
'use strict';
const $=id=>document.getElementById(id);
const TOPICS=[
{
 id:'safety',icon:'🦺',title:'Safety',pages:'28–47',tags:'safety defects hazards near miss fire reversing pedestrians sharps',sections:[
  ['Driver responsibilities','Follow all safety rules, procedures and legal requirements relevant to the role. Carry out pre-journey and first-use checks, report defects immediately, use the correct channels to report incidents, near misses, hazards and unsafe conditions, attend safety briefings and training, and always protect your own safety and the safety of others.'],
  ['Be Safe principles','Safety is everyone’s responsibility. Mistakes and near misses should be reported openly so lessons can be learned. The aim is to prevent harm, improve safety culture and create a safe environment for employees, customers, contractors and visitors.'],
  ['Sharp objects and needles','Do not pick up needles or hidden sharps by hand. Make the area safe, keep others away and contact Control for guidance. Waste may conceal sharps behind seats, under cushions, inside ticket boxes, behind vinyls or inside vents.'],
  ['Vehicle and pedestrian safety','Wear high-visibility clothing in depots and traffic movement areas. Use designated walkways, obey local speed limits, give priority to pedestrians and reversing vehicles, and stay alert for people emerging from behind parked vehicles.'],
  ['Inspector focus','Check that the first-use check and defect card are completed properly, defects are reported, unsafe vehicles are not taken into service, required PPE is worn and the driver understands local safety reporting procedures.']
 ]
},
{
 id:'bridges',icon:'🌉',title:'Low Bridge Avoidance',pages:'31–32',tags:'bridge lbas height diversion arched strike control railway',sections:[
  ['Why it matters','Bridge strikes can cause death or life-changing injury, major infrastructure and vehicle damage, legal action, loss of licence, possible imprisonment and widespread disruption. They are preventable.'],
  ['If LBAS sounds','1. Stop safely as soon as possible. 2. Check the vehicle height. 3. Assess the bridge ahead. 4. Continue only when certain the vehicle is suitable. 5. If unsuitable or uncertain, do not proceed and contact Control. 6. If a second warning sounds, stop and check again. Never ignore LBAS.'],
  ['Driver responsibilities','Know the vehicle height every time you take over a vehicle. Follow the prescribed route. Do not take shortcuts. Obey height restriction signs. Never operate an unfamiliar vehicle type or route without training. Contact Control whenever diverted or asked to leave route, including by police or emergency services.'],
  ['If diverted or off route','Stop safely, secure the vehicle, leave the cab if necessary to assess safely, and call Control. Do not continue until Control confirms the route is safe. Do not rely on mobile maps or local knowledge.'],
  ['Arched bridges','Slow down, assess carefully and move towards the centre only where safe and necessary. Use the horn or dipped headlights if required by signs or poor visibility. Maintain a steady line and never swerve under the bridge.'],
  ['If a bridge strike occurs','Switch off and isolate the vehicle. Call 999 or the emergency number displayed on the bridge, especially for railway bridges. Report injuries, notify Control and do not move the vehicle until instructed by emergency services or Control.'],
  ['Inspector focus','Confirm the driver knows the bus height, understands LBAS, can explain what to do during a diversion and knows that Control must approve any alternative route.']
 ]
},
{
 id:'diversions',icon:'🛣️',title:'Off Route & Diversions',pages:'32–34',tags:'diversion police control private hire route map overhead tree hump',sections:[
  ['Core rule','Never leave the planned route without official instruction. If a police officer or another person directs a diversion, stop safely and contact depot Control before continuing.'],
  ['When unsure','A driver may say they are not comfortable with a proposed diversion. Stop safely, seek advice and do not continue until an approved route is confirmed.'],
  ['Do not use','Do not use mobile maps or personal local knowledge to create an unapproved route.'],
  ['Hazards to consider','Low bridges, low branches, overhead cables, road humps, narrow roads, unfamiliar junctions, weight restrictions and soft verges.'],
  ['Out of service','When operating out of service, remain alert, use approved risk-assessed routes and do not carry members of the public.'],
  ['Inspector focus','Ask who authorised the diversion, what route was approved and whether the driver checked the vehicle height and route hazards before moving.']
 ]
},
{
 id:'vehicle',icon:'🚍',title:'Vehicle Operation',pages:'34–43, 55',tags:'defect first use reversing banksperson flood verge telematics cab',sections:[
  ['First-use and defect checks','Every bus must receive a proper first-use check before service. Defects must be reported immediately and recorded through the required defect system. A vehicle must not be used where a safety-critical defect is unresolved.'],
  ['Soft verges','Do not mount soft verges. They can collapse under the weight of a bus and may cause the vehicle to leave the road or overturn.'],
  ['Floods and heavy rain','Never enter flood water. Stop safely and contact Control. Reduce speed, increase following distance and use smooth steering, braking and acceleration. Avoid standing water and sudden movements.'],
  ['Aquaplaning response','Ease off the accelerator, avoid sudden braking, steer gently in the intended direction and wait for tyre contact to return.'],
  ['Reversing','Avoid reversing where possible. Check the full area, keep speed very low and use cameras or sensors where fitted. Stop whenever uncertain.'],
  ['Using a banksperson','Only a trained and competent banksperson should guide a reversing vehicle. They must wear high visibility clothing, remain on the driver’s offside and stay in view. Stop immediately if visual contact is lost. Agree signals before moving.'],
  ['Without a banksperson','Reverse only where the area has been thoroughly checked, no pedestrians are present, reversing aids work and the reversing horn has been sounded. When not completely sure, stop and obtain help.'],
  ['Telematics','GreenRoad or other telematics systems support safer driving through real-time feedback and performance monitoring. Serious incident data may be requested by police or the Traffic Commissioner.'],
  ['Unauthorised driving','Never allow an unauthorised person to drive a company vehicle or enter the cab. Do not operate a vehicle type you have not been trained to use.']
 ]
},
{
 id:'incidents',icon:'🚨',title:'Incidents & Emergencies',pages:'44–47, 88–89',tags:'accident near miss fire objects thrown assault conflict abcd emergency',sections:[
  ['Objects thrown at a vehicle','Do not confront or pursue offenders. Drive to a safe, well-lit or populated place if possible. If unable to move safely, activate the alarm, contact Control, call police and remain securely in the cab.'],
  ['Vehicle accident','Secure the vehicle, check customer and third-party welfare, call emergency services where needed and inform Control. Record passenger and third-party details, injuries, witnesses, exact location, time and damage. Do not accept liability. Take photographs only when safe and for the claims process, not social media.'],
  ['Near misses','A near miss is an event that could have caused harm but did not. Report all near misses through Blink or the local process, including what happened, where it occurred and what could have gone wrong.'],
  ['Vehicle fire','Evacuate quickly and move customers away. Never put yourself at risk. Only attempt a very small non-electrical fire. Never try to extinguish an electrical vehicle fire.'],
  ['Conflict ABCD','A — Assess what has happened. B — Be safe and remain in the cab. C — Call Control or police for help. D — Do as instructed by Control or emergency services.'],
  ['De-escalation','Stay calm, use a neutral tone, apologise for inconvenience where appropriate, avoid threats and physical contact, never restrain passengers and call for support early.'],
  ['Inspector focus','Check that incidents were reported promptly, evidence and witness details were gathered, the driver remained in the cab during conflict and no liability was admitted.']
 ]
},
{
 id:'timekeeping',icon:'⏰',title:'Timekeeping & Early Running',pages:'54–55',tags:'early timing point timetable ticket machine late delay punctuality',sections:[
  ['Scheduled times','Drivers must follow scheduled departure times from start points, termini and intermediate timing points unless supervisory approval or a justified delay applies.'],
  ['What counts as early running','A vehicle is early running only when it leaves a recognised timing point before the scheduled time. Arriving early at a location does not automatically mean the journey is an early-running offence.'],
  ['Primary timing device','The ticket machine is the primary timing device. Any concern about its accuracy must be reported to Control and a replacement requested where necessary.'],
  ['Delays','Report delays or cancellations through the local procedure as soon as possible. Never vary the duty or route without authorisation.'],
  ['Inspector focus','Confirm the exact timing point, scheduled departure time and actual departure time. Record whether the bus merely arrived early or actually departed a timing point early.']
 ]
},
{
 id:'tickets',icon:'🎫',title:'Tickets & Revenue',pages:'74–80',tags:'cash card contactless mobile pass warrant cannot pay overstage counterfeit customer numbers',sections:[
  ['Accepted payment methods','On-bus payment can include cash, contactless cards, Apple Pay, Google Pay and compatible devices. Bank of Scotland and Bank of Ireland notes should be accepted.'],
  ['Mobile tickets','Mobile tickets must be presented correctly and checked or scanned. Customers need internet access to activate a ticket, after which it may remain available offline for up to eight hours before needing to reconnect.'],
  ['Non-cash travel','Local bus passes must be recorded correctly. Valid travel warrants are accepted for the destination shown unless altered. Valid police warrant cards presented by serving officers or PCSOs may be accepted in lieu of payment according to policy.'],
  ['Customers who cannot pay','Use discretion, remain in the cab and never forcefully remove a customer. Consider vulnerability, safety and whether it is the last bus. Children who cannot pay or have lost a pass must be allowed to travel. Record the incident through the local process when discretion is used.'],
  ['Overriding or overstaging','Report repeated cases to management or Revenue Protection. Prioritise safety and avoid confrontation.'],
  ['Cancelled tickets','Refund using the original payment method. Never resell a ticket already issued to someone else.'],
  ['Counterfeit money','Check security features and use the supplied detector equipment. Do not accept £50 notes.'],
  ['Customer numbers','Every customer must be recorded. Where a ticket does not register automatically, record it manually. Accurate figures protect revenue and support service planning.'],
  ['Inspector focus','Check that all customers were recorded, mobile tickets were validated, concessions were processed correctly, cancellations were declared and cash procedures were followed.']
 ]
},
{
 id:'accessibility',icon:'♿',title:'Accessibility & Customer Care',pages:'62–71',tags:'wheelchair disability equality kneeling ramp assistance dog stopping standees lost property',sections:[
  ['Stopping for customers','Approach recognised stops at a suitable speed and look carefully for waiting customers, including those sheltering or activating a mobile ticket. Stop where safe. Report customers left behind, especially on the last service.'],
  ['Standees','Do not exceed the certified standing capacity. No one may stand upstairs or on the stairs. Keep aisles and emergency exits clear and maintain a clear view of the nearside mirror.'],
  ['Equality and disability','Do not discriminate. Take all reasonable steps to help disabled customers and remember that not all disabilities are visible.'],
  ['Kneeling suspension','Use kneeling suspension as a matter of course where fitted and safe. Report any failure.'],
  ['Ramps and lifts','Use ramps when requested and safe. Report faults to Engineering and on the defect card. Deploy manual ramps to the kerb. Wheelchair users and approved mobility scooters should board head on. Hydraulic or electric lifts are for wheelchair users only.'],
  ['Wheelchair space','Make every reasonable effort to free the designated space unless the vehicle is full or another wheelchair already occupies it. Ask other customers politely, explain the purpose of the space and contact Control if refusal continues.'],
  ['Assistance dogs','Assistance dogs and assistance-dog trainers with trainees are welcome. Assistance dogs take priority where other dogs cannot travel safely alongside them.'],
  ['Customer assistance','Be patient, communicate clearly, make eye contact appropriately and offer practical help. It may be appropriate to leave the cab to assist a disabled customer where safe and practical.'],
  ['Lost property','Record the date, time, service, direction and identifying details of found items.']
 ]
},
{
 id:'security',icon:'🔒',title:'Security & Conflict Avoidance',pages:'84–89',tags:'cash robbery assault suspicious package hijack isolate vehicle cab security',sections:[
  ['General security','Do not put yourself at risk. Treat threats seriously, contact police when safe and remember descriptions, clothing, accent, age, direction of travel and any names used. Report the incident to management.'],
  ['Cash safety','Stay alert, greet customers, use depot cashing-in points and never cash up in public or on the bus. If threatened, back away, keep distance and place a barrier between yourself and the aggressor where possible.'],
  ['Vehicle security','When leaving the vehicle, even briefly, isolate it fully, remove cash, lock or sign off the ticket machine and secure the doors. Check the bus regularly and at the depot, including the cab, under seats and luggage areas.'],
  ['Suspicious packages','Do not touch, move or inspect the item. Evacuate calmly, contact police and notify the depot when safe.'],
  ['Hijack','Do nothing that increases risk. Escape only where this can be done safely.'],
  ['Inspector focus','Confirm the vehicle was isolated correctly, cash and ticket machine were secured, checks were completed and suspicious items or threats were reported through the proper channels.']
 ]
},
{
 id:'responsibilities',icon:'🪪',title:'Driver Responsibilities',pages:'50–59',tags:'dqc pcv licence cpc hours rest fatigue workday policies conviction',sections:[
  ['DQC and PCV licence','Carry the Driver Qualification Card while driving and produce it for inspection. Drivers are also expected to carry their PCV licence at work. Missing or stolen cards must be reported and evidenced.'],
  ['Licence and medical requirements','Renew the PCV licence in time and show the replacement before the old one expires. Report notifiable medical conditions to the doctor, DVLA and line manager promptly.'],
  ['Domestic hours','Maximum 10 hours driving per day. After 5½ hours driving, take at least 30 minutes break. Regular daily rest is 10 hours, reducible to 8½ hours three times a week.'],
  ['EU hours','Normally maximum 9 hours driving daily, extendable to 10 twice weekly; 56 hours in one week and 90 over two weeks. Take 45 minutes break after 4½ hours driving, which may be split into 15 then 30 minutes.'],
  ['Fatigue','Legal hours do not replace personal judgement. Report tiredness, poor concentration or concern about a possible breach immediately.'],
  ['Policies and information','Keep Workday details current, protect confidential information and company property, obtain consent before other work, behave professionally in uniform and report prosecutions, cautions, arrests or convictions promptly.']
 ]
}
];
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function searchable(t){return [t.title,t.tags,t.pages,...t.sections.flat()].join(' ').toLowerCase();}
function render(){const q=($('kbSearch')?.value||'').trim().toLowerCase();const cat=$('kbTopic')?.value||'all';const list=$('kbResults');if(!list)return;const found=TOPICS.filter(t=>(cat==='all'||t.id===cat)&&(!q||searchable(t).includes(q)));$('kbCount').textContent=found.length+' section'+(found.length===1?'':'s');list.innerHTML=found.map(t=>'<article class="kbTopicCard" data-kb-topic="'+t.id+'"><div class="kbTopicHead"><span class="kbTopicIcon">'+t.icon+'</span><div><h3>'+esc(t.title)+'</h3><small>Handbook pages '+esc(t.pages)+'</small></div><button type="button" class="kbPrint" data-print-topic="'+t.id+'">PRINT</button></div><div class="kbSections">'+t.sections.map((s,i)=>'<details class="kbDetail" '+(q?'open':'')+'><summary>'+esc(s[0])+'</summary><div>'+esc(s[1]).replace(/\n/g,'<br>')+'</div></details>').join('')+'</div></article>').join('')||'<div class="panel">No knowledge-base sections match your search.</div>';}
function printTopic(id){const t=TOPICS.find(x=>x.id===id);if(!t)return;const w=window.open('','_blank');if(!w)return;w.document.write('<!doctype html><html><head><title>'+esc(t.title)+'</title><style>body{font-family:Arial,sans-serif;line-height:1.5;padding:28px;color:#111}h1{border-bottom:4px solid #f4a51c;padding-bottom:8px}h2{margin-top:24px}small{color:#555}</style></head><body><h1>'+t.icon+' '+esc(t.title)+'</h1><small>Driver’s Handbook pages '+esc(t.pages)+'</small>'+t.sections.map(s=>'<h2>'+esc(s[0])+'</h2><p>'+esc(s[1])+'</p>').join('')+'<p><small>Inspector Hub quick-reference. Use the current full handbook and local policies for formal decisions.</small></p></body></html>');w.document.close();w.focus();setTimeout(()=>w.print(),250);}
function setup(){const nav=document.querySelector('#home .nav');if(!nav)return;let b=[...nav.querySelectorAll('button')].find(x=>x.textContent.includes('Driver Handbook')||x.textContent.includes('Driver Knowledge Base'));if(!b){b=document.createElement('button');nav.appendChild(b);}b.dataset.open='driversHandbook';b.innerHTML='<span class="navIcon">📚</span>Driver Knowledge Base';let section=$('driversHandbook');if(section)section.remove();const anchor=$('busTimes')||document.querySelector('.section:last-of-type');anchor.insertAdjacentHTML('beforebegin','<section id="driversHandbook" class="section"><button class="backBtn" data-open="home">← Back</button><h2>Driver Knowledge Base</h2><div class="kbHero"><div><b>Operational guidance, made easy to use</b><span>Searchable, expandable and arranged by practical topic.</span></div><span>📚</span></div><div class="kbQuick">'+TOPICS.map(t=>'<button type="button" data-kb-jump="'+t.id+'">'+t.icon+' '+esc(t.title)+'</button>').join('')+'</div><div class="panel"><input class="searchBar" id="kbSearch" placeholder="Search: LBAS, wheelchair, cannot pay, near miss, early running..."><select class="field" id="kbTopic"><option value="all">All topics</option>'+TOPICS.map(t=>'<option value="'+t.id+'">'+esc(t.title)+'</option>').join('')+'</select><div class="kbActions"><button class="btn" id="kbExpandAll">EXPAND ALL</button><button class="btn" id="kbCollapseAll">COLLAPSE ALL</button></div><div class="small" id="kbCount"></div></div><div id="kbResults"></div><div class="kbNotice"><b>Important:</b> This is an operational quick-reference based on the 2026 Driver’s Handbook. Use the current full handbook, local notices and management instructions for formal decisions.</div></section>');$('kbSearch').addEventListener('input',render);$('kbTopic').addEventListener('change',render);$('kbExpandAll').onclick=()=>document.querySelectorAll('#kbResults details').forEach(x=>x.open=true);$('kbCollapseAll').onclick=()=>document.querySelectorAll('#kbResults details').forEach(x=>x.open=false);document.addEventListener('click',e=>{const j=e.target.closest('[data-kb-jump]');if(j){$('kbTopic').value=j.dataset.kbJump;$('kbSearch').value='';render();setTimeout(()=>$('kbResults').scrollIntoView({behavior:'smooth',block:'start'}),50);}const p=e.target.closest('[data-print-topic]');if(p)printTopic(p.dataset.printTopic);});render();}
function style(){if($('knowledgeBaseCss'))return;const s=document.createElement('style');s.id='knowledgeBaseCss';s.textContent=`.kbHero{display:flex;justify-content:space-between;align-items:center;padding:18px;border-radius:15px;background:linear-gradient(135deg,#071b2d,#123c5f);border-left:7px solid #f4a51c;margin-bottom:10px}.kbHero b{display:block;font-size:22px}.kbHero span{display:block;margin-top:4px}.kbHero>span{font-size:40px}.kbQuick{display:flex;gap:8px;overflow-x:auto;padding:0 0 10px}.kbQuick button{white-space:nowrap;border:0;border-radius:999px;padding:10px 13px;background:#f4a51c;color:#071b2d;font-weight:900}.kbActions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.kbTopicCard{margin:12px 0;border:1px solid rgba(255,255,255,.12);border-radius:14px;overflow:hidden;background:#0e2940}.kbTopicHead{display:flex;align-items:center;gap:12px;padding:14px;background:#123650}.kbTopicIcon{font-size:34px}.kbTopicHead h3{margin:0;font-size:19px}.kbTopicHead small{opacity:.72}.kbPrint{margin-left:auto;border:0;border-radius:8px;padding:8px 10px;background:#f4a51c;color:#071b2d;font-weight:900}.kbSections{padding:8px}.kbDetail{background:#102b42;border:1px solid rgba(255,255,255,.1);border-radius:10px;margin:7px 0;overflow:hidden}.kbDetail summary{cursor:pointer;padding:13px;font-weight:900;color:#fff}.kbDetail[open] summary{background:#173e5c;color:#ffd079}.kbDetail div{padding:0 13px 14px;line-height:1.62;white-space:normal}.kbNotice{margin:15px 0;padding:13px;border-radius:10px;background:#4b3511;border-left:5px solid #f4a51c;font-size:12px;line-height:1.5}body.display-phone .kbHero b{font-size:18px}body.display-phone .kbActions{grid-template-columns:1fr}body.display-phone .kbTopicHead{align-items:flex-start}.kbPrint{font-size:11px}`;document.head.appendChild(s);}
function init(){style();setup();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1100));else setTimeout(init,1100);
})();