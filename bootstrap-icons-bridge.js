/* Printly UI: use Bootstrap Icons without changing business logic. */
(function(){
  const map={menu:'list',orders:'clipboard2-check',users:'people',journal:'clock-history',team:'people-fill',box:'box-seam',close:'x-lg'};
  function replace(){document.querySelectorAll('svg').forEach(svg=>{const button=svg.closest('button');if(!button||button.dataset.biReady==='1')return;const label=(button.getAttribute('aria-label')||'').toLowerCase();const text=(button.textContent||'').trim().toLowerCase();let name='';if(button.classList.contains('hamburger'))name='menu';else if(label.includes('fermer'))name='close';else if(button.classList.contains('sideExtra'))name='box';else if(text.includes('commande'))name='orders';else if(text.includes('client'))name='users';else if(text.includes('journal'))name='journal';else if(text.includes('équipe')||text.includes('utilisateur'))name='team';if(!name)return;const i=document.createElement('i');i.className='bi bi-'+map[name];i.setAttribute('aria-hidden','true');svg.replaceWith(i);button.dataset.biReady='1';});}
  function start(){replace();new MutationObserver(replace).observe(document.body,{subtree:true,childList:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
