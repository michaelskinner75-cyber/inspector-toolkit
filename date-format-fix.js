(function(){
'use strict';

function parseInspectorDate(value){
  if(value instanceof Date)return new Date(value.getFullYear(),value.getMonth(),value.getDate());
  if(value===undefined||value===null||value==='')return new Date(NaN);
  const s=String(value).trim();

  // Plain ISO calendar date from HTML inputs: keep as local date.
  let m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));

  // Google Sheets timestamps must be converted to local time first.
  // Example: 2026-07-09T23:00:00.000Z is 10 July in the UK.
  if(/^\d{4}-\d{2}-\d{2}[T\s]/.test(s)){
    const timestamp=new Date(s);
    if(!isNaN(timestamp.getTime()))return new Date(timestamp.getFullYear(),timestamp.getMonth(),timestamp.getDate());
  }

  // Existing Inspector Hub records use UK dates: DD/MM/YYYY.
  m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2}|\d{4})(?:\s.*)?$/);
  if(m){
    let year=Number(m[3]);
    if(year<100)year+=2000;
    return new Date(year,Number(m[2])-1,Number(m[1]));
  }

  const d=new Date(s);
  return isNaN(d.getTime())?new Date(NaN):new Date(d.getFullYear(),d.getMonth(),d.getDate());
}

window.parseRowDate=parseInspectorDate;
window.normaliseDateForSave=function(value){
  let d;
  if(!value){d=new Date();}
  else if(/^\d{4}-\d{2}-\d{2}$/.test(String(value))){return String(value);}
  else{d=parseInspectorDate(value);}
  if(isNaN(d.getTime()))return String(value||'');
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};
window.formatDateValue=function(value){
  const d=parseInspectorDate(value);
  if(isNaN(d.getTime()))return value===undefined||value===null||value===''?'-':String(value);
  return d.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'});
};
window.today=function(){return new Date().toLocaleDateString('en-GB');};

function localIsoToday(){
  const now=new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
function initialiseDateInput(id){
  const input=document.getElementById(id);
  if(input&&!input.value)input.value=localIsoToday();
}
function rerender(){
  if(typeof window.renderChecks==='function')window.renderChecks();
  if(typeof window.renderTiming==='function')window.renderTiming();
  if(typeof window.renderCoverage==='function')window.renderCoverage();
  if(typeof window.renderReportSearch==='function')window.renderReportSearch();
  if(typeof window.renderNSA==='function')window.renderNSA();
}

initialiseDateInput('csDate');
initialiseDateInput('nsaDate');

window.setNsaFilter=function(filter){
  nsaFilter=filter;
  if(typeof window.renderNSA==='function')window.renderNSA();
};

setTimeout(rerender,50);
})();