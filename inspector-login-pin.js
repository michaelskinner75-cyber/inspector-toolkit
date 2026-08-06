(function(){
'use strict';

const INSPECTOR_PINS = Object.freeze({
  'M Skinner': '54179',
  'A Duncan': '60750',
  'A Fairbairn': '35939'
});

function setupPinLogin(){
  const loginCard = document.querySelector('#loginPage .loginCard');
  const loginButton = document.getElementById('loginBtn');
  const selectionText = document.getElementById('loginSelectionText');
  if (!loginCard || !loginButton || document.getElementById('inspectorPin')) return;

  const pinWrap = document.createElement('div');
  pinWrap.id = 'inspectorPinWrap';
  pinWrap.style.margin = '14px 0';
  pinWrap.innerHTML = `
    <label for="inspectorPin" style="display:block;font-weight:800;margin-bottom:7px">Inspector PIN</label>
    <input
      class="field"
      id="inspectorPin"
      type="password"
      inputmode="numeric"
      pattern="[0-9]*"
      maxlength="5"
      autocomplete="off"
      placeholder="Enter 5-digit PIN"
      aria-label="Inspector PIN"
    >
    <div id="inspectorPinError" style="display:none;color:#ffb3b3;font-weight:800;margin-top:7px" role="alert"></div>
  `;
  loginButton.parentNode.insertBefore(pinWrap, loginButton);

  const pinInput = document.getElementById('inspectorPin');
  const error = document.getElementById('inspectorPinError');

  function selectedInspector(){
    const selected = document.querySelector('.loginChoice.selected');
    return selected ? selected.dataset.loginName : '';
  }

  function showError(message){
    error.textContent = message;
    error.style.display = 'block';
    pinInput.value = '';
    pinInput.focus();
  }

  document.querySelectorAll('.loginChoice').forEach(button => {
    button.addEventListener('click', () => {
      pinInput.value = '';
      error.style.display = 'none';
      setTimeout(() => pinInput.focus(), 0);
    });
  });

  loginButton.addEventListener('click', event => {
    const inspector = selectedInspector();
    if (!inspector) return;

    const expectedPin = INSPECTOR_PINS[inspector];
    if (!expectedPin) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showError('This inspector does not have an authorised PIN.');
      return;
    }

    if (pinInput.value !== expectedPin) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showError('Incorrect PIN. Please try again.');
      return;
    }

    error.style.display = 'none';
  }, true);

  pinInput.addEventListener('input', () => {
    pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, 5);
    error.style.display = 'none';
  });

  pinInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      loginButton.click();
    }
  });

  if (selectionText) {
    const observer = new MutationObserver(() => {
      pinInput.value = '';
      error.style.display = 'none';
    });
    observer.observe(selectionText, {childList:true, characterData:true, subtree:true});
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupPinLogin, {once:true});
} else {
  setupPinLogin();
}
})();
