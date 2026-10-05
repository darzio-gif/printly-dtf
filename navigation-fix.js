/* Printly navigation fixes: expose Settings and dedicated old-school client window. */
(function(){
  function addSettings(){
    const nav=document.querySelector('.sideNav');
    if(!nav || nav.querySelector('[data-printly-settings-link]')) return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.dataset.printlySettingsLink='1';
    btn.className='printly-nav-settings';
    btn.innerHTML='<i class="bi bi-gear-wide-connected" aria-hidden="true"></i><span>Paramètres</span>';
    btn.addEventListener('click',()=>window.__printlyOpenSettings?.());
    nav.appendChild(btn);
  }
  function addOldSchoolClientShortcut(){
    const nav=document.querySelector('.sideNav');
    if(!nav || nav.querySelector('[data-printly-old-client]')) return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.dataset.printlyOldClient='1';
    btn.className='printly-nav-client';
    btn.innerHTML='<i class="bi bi-person-plus" aria-hidden="true"></i><span>Nouveau client</span>';
    btn.addEventListener('click',()=>window.__printlyOpenOldClient?.());
    nav.appendChild(btn);
  }
  function wire(){
    addSettings();
    addOldSchoolClientShortcut();
  }
  new MutationObserver(wire).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();
