/* Printly — reliable sidebar tools for desktop + mobile */
(function(){
  const STYLE_ID='printly-sidebar-tools-style-v2';
  function addStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      .printly-tools-group{display:flex!important;flex-direction:column!important;gap:6px!important;width:100%!important;margin-top:10px!important;padding-top:10px!important;border-top:1px solid rgba(255,255,255,.08)!important}
      .printly-tool-btn{display:flex!important;align-items:center!important;gap:12px!important;width:100%!important;min-height:48px!important;padding:0 13px!important;margin:0!important;border:1px solid transparent!important;border-radius:14px!important;background:transparent!important;color:#aeb3bd!important;cursor:pointer!important;font:inherit!important;text-align:start!important;box-sizing:border-box!important}
      .printly-tool-btn:hover{background:rgba(255,255,255,.055)!important;color:#fff!important;border-color:rgba(255,255,255,.09)!important}
      .printly-tool-btn .bi{font-size:19px!important;flex:none!important}
      .printly-tool-btn.settings .bi{color:#ff1730!important}
      @media(max-width:720px){.printly-tools-group{margin-top:8px!important;padding-top:8px!important}.printly-tool-btn{min-height:52px!important;font-size:15px!important}}
    `;document.head.appendChild(s)
  }
  function getContainer(){
    const nav=document.querySelector('.sidebar .sideNav');
    if(nav)return nav;
    return document.querySelector('.sidebar .sidebarBottom');
  }
  function makeButton(type,label,icon,extra){
    const b=document.createElement('button');
    b.type='button';b.className='printly-tool-btn'+(extra?' '+extra:'');b.dataset.printlyTool=type;
    b.innerHTML='<i class="bi '+icon+'" aria-hidden="true"></i><span>'+label+'</span>';
    b.addEventListener('click',function(e){
      e.preventDefault();
      if(type==='new-client'){
        if(typeof window.__printlyOpenOldClient==='function')window.__printlyOpenOldClient();
        else document.dispatchEvent(new CustomEvent('printly:open-client'));
      }else{
        if(typeof window.__printlyOpenSettings==='function')window.__printlyOpenSettings();
        else document.dispatchEvent(new CustomEvent('printly:open-settings'));
      }
    });
    return b;
  }
  function mount(){
    addStyle();
    const container=getContainer();if(!container)return;
    let group=container.querySelector('.printly-tools-group');
    if(!group){group=document.createElement('div');group.className='printly-tools-group';container.appendChild(group)}
    if(!group.querySelector('[data-printly-tool="new-client"]'))group.appendChild(makeButton('new-client','Nouveau client','bi-person-plus'));
    if(!group.querySelector('[data-printly-tool="settings"]'))group.appendChild(makeButton('settings','Paramètres','bi-gear-wide-connected','settings'));
  }
  const observer=new MutationObserver(mount);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
