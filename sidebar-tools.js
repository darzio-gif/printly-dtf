/* Printly sidebar tools: reliable Settings + old-school New Client entry points */
(function(){
  const STYLE_ID='printly-sidebar-tools-style';
  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      .printly-tool-btn{width:100%;display:flex;align-items:center;gap:12px;min-height:48px;padding:0 16px;margin-top:6px;border:1px solid transparent;border-radius:14px;background:transparent;color:#aeb1bb;cursor:pointer;font:inherit;text-align:left;transition:background .18s,border-color .18s,color .18s}
      .printly-tool-btn:hover{background:rgba(255,255,255,.055);border-color:rgba(255,255,255,.09);color:#fff}
      .printly-tool-btn .bi{font-size:19px}.printly-tool-btn.settings .bi{color:#ff1730}
      @media(max-width:720px){.printly-tool-btn{min-height:52px;font-size:15px}}
    `;document.head.appendChild(s)
  }
  function mount(){
    addStyle();
    const nav=document.querySelector('.sidebar .sideNav');if(!nav)return;
    if(!nav.querySelector('[data-printly-tool="new-client"]')){const b=document.createElement('button');b.type='button';b.className='printly-tool-btn';b.dataset.printlyTool='new-client';b.innerHTML='<i class="bi bi-person-plus" aria-hidden="true"></i><span>Nouveau client</span>';nav.appendChild(b)}
    if(!nav.querySelector('[data-printly-tool="settings"]')){const b=document.createElement('button');b.type='button';b.className='printly-tool-btn settings';b.dataset.printlyTool='settings';b.innerHTML='<i class="bi bi-gear-wide-connected" aria-hidden="true"></i><span>Paramètres</span>';nav.appendChild(b)}
    const clientBtn=nav.querySelector('[data-printly-tool="new-client"]');
    if(clientBtn&&!clientBtn.dataset.bound){clientBtn.dataset.bound='1';clientBtn.addEventListener('click',function(){if(window.__printlyOpenOldClient)window.__printlyOpenOldClient()})}
    const settingsBtn=nav.querySelector('[data-printly-tool="settings"]');
    if(settingsBtn&&!settingsBtn.dataset.bound){settingsBtn.dataset.bound='1';settingsBtn.addEventListener('click',function(){if(window.__printlyOpenSettings)window.__printlyOpenSettings()})}
  }
  new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
