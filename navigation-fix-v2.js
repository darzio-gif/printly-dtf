/* Printly navigation v2: reliable mobile/desktop shortcuts. */
(function(){
  const css=`.printly-nav-settings,.printly-nav-client{min-height:48px!important;width:100%!important;display:flex!important;align-items:center!important;gap:12px!important;padding:0 13px!important;border:1px solid transparent!important;border-radius:14px!important;background:transparent!important;color:#aeb3bd!important;text-align:start!important;cursor:pointer!important}.printly-nav-settings:hover,.printly-nav-client:hover{background:rgba(255,255,255,.06)!important;color:#fff!important}.printly-nav-settings .bi,.printly-nav-client .bi{font-size:19px;color:#ff1730}.printly-nav-divider{height:1px;background:rgba(255,255,255,.08);margin:8px 4px}`;
  function style(){if(document.getElementById('nav-v2-style'))return;const s=document.createElement('style');s.id='nav-v2-style';s.textContent=css;document.head.appendChild(s)}
  function settings(){
    const nav=document.querySelector('.sideNav');
    if(!nav||nav.querySelector('[data-nav-v2-settings]'))return;
    const b=document.createElement('button');b.type='button';b.dataset.navV2Settings='1';b.className='printly-nav-settings';b.innerHTML='<i class="bi bi-gear-wide-connected"></i><span>Paramètres</span>';
    b.onclick=()=>{if(typeof window.__printlyOpenSettings==='function')window.__printlyOpenSettings();else{const x=document.querySelector('.printly-settings-overlay');x?.classList.add('open');document.body.classList.add('printly-settings-open')}};nav.appendChild(b);
  }
  function client(){
    const nav=document.querySelector('.sideNav');
    if(!nav||nav.querySelector('[data-nav-v2-client]'))return;
    const b=document.createElement('button');b.type='button';b.dataset.navV2Client='1';b.className='printly-nav-client';b.innerHTML='<i class="bi bi-person-plus"></i><span>Nouveau client</span>';
    b.onclick=()=>window.__printlyOpenOldClient?.();nav.appendChild(b);
  }
  function run(){style();settings();client()}
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
