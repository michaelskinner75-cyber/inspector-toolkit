(function(){
'use strict';

function currentInspector(){
  try{return typeof getInspector==='function'?getInspector():(localStorage.getItem('activeInspector')||'');}
  catch(e){return localStorage.getItem('activeInspector')||'';}
}

function setMessage(text){
  try{if(typeof setStatus==='function')setStatus(text);}
  catch(e){}
}

async function deleteCard(button){
  if(currentInspector()!=='M Skinner')return;

  const sheet=button.dataset.deleteSheet;
  const rowNumber=Number(button.dataset.deleteRow);
  const title=button.dataset.deleteTitle||'record';

  if(!sheet||!Number.isInteger(rowNumber)||rowNumber<2){
    alert('This card does not have a valid Google Sheets row number. Refresh the reports and try again.');
    return;
  }

  if(!confirm(`Delete this ${title} from ${sheet} and Google Sheets?`))return;

  const adminPin=prompt('Enter the admin PIN to delete this record:');
  if(adminPin===null)return;
  if(!adminPin.trim()){
    alert('Admin PIN required.');
    return;
  }

  const card=button.closest('.compactCheck');
  document.querySelectorAll('.reportDeleteBtn').forEach(btn=>btn.disabled=true);
  button.textContent='DELETING…';
  setMessage('Deleting from Google Sheets…');

  try{
    await fetch(WEB_APP_URL,{
      method:'POST',
      mode:'no-cors',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({
        action:'deleteRow',
        sheet:sheet,
        rowNumber:rowNumber,
        adminPin:adminPin.trim()
      })
    });

    try{
      if(typeof cloud!=='undefined'&&cloud[sheet]&&Array.isArray(cloud[sheet])){
        cloud[sheet].splice(rowNumber-1,1);
      }
    }catch(e){}

    if(card)card.remove();
    setMessage('Delete sent. Refreshing reports…');

    await new Promise(resolve=>setTimeout(resolve,3000));
    if(typeof loadCloud==='function')await loadCloud();
    if(typeof renderReportSearch==='function')renderReportSearch();
    setMessage('Record deletion completed.');
  }catch(error){
    console.error(error);
    setMessage('Delete failed.');
    alert('The card could not be deleted. Please check the Google Apps Script deployment.');
    document.querySelectorAll('.reportDeleteBtn').forEach(btn=>btn.disabled=false);
    button.textContent='DELETE THIS CARD';
  }
}

document.addEventListener('click',function(event){
  const button=event.target.closest('.reportDeleteBtn');
  if(!button)return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  deleteCard(button);
},true);
})();
