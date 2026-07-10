(function(){
  function $(id){return document.getElementById(id);}

  window.getInspector=function(){
    return localStorage.getItem('activeInspector')||'';
  };

  window.confirmInspectorBeforeSave=function(){
    return true;
  };

  window.openInspectorModal=function(){};
  window.confirmStartupInspector=function(){};

  function updateDisplay(){
    const name=window.getInspector()||'Not logged in';
    const el=$('loggedInInspector');
    if(el)el.textContent=name;
  }

  function showLogin(){
    const page=$('loginPage');
    if(page)page.classList.remove('hidden');
  }

  function hideLogin(){
    const page=$('loginPage');
    if(page)page.classList.add('hidden');
  }

  window.initInspector=function(){
    sessionStorage.setItem('inspectorConfirmed','yes');
    updateDisplay();
    if(window.getInspector())hideLogin();else showLogin();
  };

  function login(){
    const select=$('loginInspectorSelect');
    const other=$('loginOtherInspector');
    const selected=select?select.value:'';
    const otherName=other?other.value.trim():'';

    if(!selected){
      alert('Please select an inspector.');
      return;
    }
    if(selected==='Other'&&!otherName){
      alert('Please enter the inspector name.');
      return;
    }

    const name=selected==='Other'?otherName:selected;
    localStorage.setItem('activeInspector',name);
    updateDisplay();
    hideLogin();
    if(typeof window.renderAll==='function')window.renderAll();
  }

  function logout(){
    localStorage.removeItem('activeInspector');
    const select=$('loginInspectorSelect');
    const other=$('loginOtherInspector');
    if(select)select.value='';
    if(other){other.value='';other.style.display='none';}
    updateDisplay();
    showLogin();
  }

  window.addEventListener('DOMContentLoaded',function(){
    const select=$('loginInspectorSelect');
    const loginBtn=$('loginBtn');
    const changeBtn=$('changeInspectorBtn');

    if(select){
      select.addEventListener('change',function(){
        const other=$('loginOtherInspector');
        if(other)other.style.display=this.value==='Other'?'block':'none';
      });
    }
    if(loginBtn)loginBtn.addEventListener('click',login);
    if(changeBtn)changeBtn.addEventListener('click',logout);

    updateDisplay();
    if(window.getInspector())hideLogin();else showLogin();
  });
})();
