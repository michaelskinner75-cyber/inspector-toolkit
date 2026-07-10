(function(){
'use strict';

function parseInspectorDate(value){
  if(value instanceof Date)return new Date(value.getFullYear(),value.getMonth(),value.getDate());
  if(value===undefined||value===null||value==='')return new Date(NaN);
  const s=String(value).trim();

  // ISO dates used by HTML date inputs and all new records: YYYY-MM-DD.
  let m=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));

  // Existing Inspector Hub records use UK dates: DD/MM/YYYY.
  m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2}|\d{4})(?:\s.*)?$/);
  if(m){
    let year=Number(m[3]);
    if(year<100)year+=2000;
    return new Date(year,Number(m[2])-1,Number(m[1]));
  }

  // Only use the browser parser for unambiguous long-form values.
  const d=new Date(s);
  return isNaN(d.getTime())?new Date(NaN):d;
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

function rerender(){
  if(typeof window.renderChecks==='function')window.renderChecks();
  if(typeof window.renderTiming==='function')window.renderTiming();
  if(typeof window.renderCoverage==='function')window.renderCoverage();
  if(typeof window.renderReportSearch==='function')window.renderReportSearch();
  if(typeof window.renderNSA==='function')window.renderNSA();
}

// Make sure the date field itself starts on the user's actual local date.
const dateInput=document.getElementById('csDate');
if(dateInput){
  const now=new Date();
  const localIso=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  if(!dateInput.value)dateInput.value=localIso;
}

setTimeout(rerender,50);
})();
