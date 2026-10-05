/* PRINTLY SIDEBAR TOOLS v3 - injected after React so they cannot disappear */
(function () {
  'use strict';
  const STYLE='printly-sidebar-tools-v3-style';
  function addStyle(){
    if(document.getElementById(STYLE)) return;
    const s=document.createElement('style'); s.id=STYLE;
    s.textContent=`
      .printly-v3-tools{display:flex!important;flex-direction:column!important;gap:6px!important;margin:14px 0 0!important;padding:12px 0 0!important;border-top:1px solid rgba(255,255,255,.10)!important;width:100%!important}
      .printly-v3-btn{appearance:none!important;-webkit-appearance:none!important;display:flex!important;align-items:center!important;gap:12px!important;width:100%!important;min-height:48px!important;padding:0 14px!important;border:1px solid transparent!important;border-radius:14px!important;background:transparent!important;color:#b9bdc7!important;font:inherit!important;font-size:14px!important;text-align:left!important;cursor:pointer!important;box-sizing:border-box!important}
      .printly-v3-btn:hover,.printly-v3-btn:focus-visible{background:rgba(255,255,255,.065)!important;color:#fff!important;outline:none!important;border-color:rgba(255,255,255,.10)!important}
      .printly-v3-btn .bi{font-size:19px!important;color:#ff1730!important;flex:0 0 auto!important}
      @media(max-width:720px){.printly-v3-tools{margin-top:12px!important;padding-top:10px!important}.printly-v3-btn{min-height:52px!important;font-size:15px!important}}
    `;
    document.head.appendChild(s);
  }
  function clickClient(){
    if(typeof window.__printlyOpenOldClient==='function') window.__printlyOpenOldClient();
    else document.dispatchEvent(new CustomEvent('printly:open-client'));
  }
  function clickSettings(){
    if(typeof window.__printlyOpenSettings==='function') window.__printlyOpenSettings();
    else document.dispatchEvent(new CustomEvent('printly:open-settings'));
  }
  function mount(){
    addStyle();
    const nav=document.querySelector('.sidebar .sideNav') || document.querySelector('.sideNav');
    if(!nav) return;
    let group=nav.querySelector('.printly-v3-tools');
    if(!group){ group=document.createElement('div'); group.className='printly-v3-tools'; nav.appendChild(group); }
    if(!group.querySelector('[data-printly-v3="client"]')){
      const b=document.createElement('button'); b.type='button'; b.className='printly-v3-btn'; b.dataset.printlyV3='client';
      b.innerHTML='<i class="bi bi-person-plus" aria-hidden="true"></i><span>Nouveau client</span>';
      b.onclick=clickClient; group.appendChild(b);
    }
    if(!group.querySelector('[data-printly-v3="settings"]')){
      const b=document.createElement('button'); b.type='button'; b.className='printly-v3-btn'; b.dataset.printlyV3='settings';
      b.innerHTML='<i class="bi bi-gear-wide-connected" aria-hidden="true"></i><span>Paramètres</span>';
      b.onclick=clickSettings; group.appendChild(b);
    }
  }
  window.__printlyMountSidebarTools=mount;
  const obs=new MutationObserver(mount);
  obs.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
  setTimeout(mount,250); setTimeout(mount,1000); setTimeout(mount,2500);
})();
