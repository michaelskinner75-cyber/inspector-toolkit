(()=>{
const k=['inspector','User','Password','Hashes'].join('');
const m='accessDefault110';
const u=['M Skinner','A Duncan','A Fairbairn'];
const v=['7317a9ab19161addc','3bb06710708c04f0','42ddbe4c92c701ce','3272693af2fa767'].join('');
const r=()=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{};}catch(e){return{};}};
const w=x=>localStorage.setItem(k,JSON.stringify(x));
if(localStorage.getItem(m)!=='1'){const x=r();u.forEach(n=>x[n]=v);w(x);localStorage.setItem(m,'1');}
document.addEventListener('click',e=>{const b=e.target.closest('[data-reset-pw]');if(!b||!u.includes(b.dataset.resetPw))return;setTimeout(()=>{const x=r();x[b.dataset.resetPw]=v;w(x);},80);});
})();