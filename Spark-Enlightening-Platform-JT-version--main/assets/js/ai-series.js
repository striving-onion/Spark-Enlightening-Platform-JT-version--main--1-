const scrollTrack=document.querySelector('.scroll-container');
// Two identical halves guarantee a seamless -50% loop, including the final gap.
[...scrollTrack.children].forEach(card=>{const clone=card.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.inert=true;scrollTrack.append(clone);});
document.querySelector('.motion-toggle').addEventListener('click',function(){const paused=this.getAttribute('aria-pressed')!=='true';this.setAttribute('aria-pressed',String(paused));this.textContent=paused?'继续滚动':'暂停滚动';scrollTrack.style.animationPlayState=paused?'paused':'';});
document.querySelectorAll('.faq-question').forEach(button=>button.addEventListener('click',()=>{
  const willOpen=button.getAttribute('aria-expanded')!=='true';
  document.querySelectorAll('.faq-question').forEach(other=>{
    const open=other===button && willOpen;other.setAttribute('aria-expanded',String(open));
    other.parentElement.classList.toggle('active',open);document.getElementById(other.getAttribute('aria-controls')).hidden=!open;
    other.querySelector('.faq-toggle-btn').textContent=open?'×':'+';
  });
}));
