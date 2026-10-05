/* Printly — sidebar tools, React-safe fallback */
(function(){
  const STYLE_ID='printly-sidebar-tools-final';
  function style(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      .printly-tools-dock{position:absolute!important;left:16px!important;right:16px!important;bottom:142px!important;z-index:50!important;display:flex!important;flex-direction:column!important;gap:6px!important;padding-top:10px!important;border-top:1px solid rgba(255,255,255,.09)!important}
      .printly-tools-dock button{appearance:none!important;width:100%!important;min-height:46px!important;display:flex!important;align-items:center!important;gap:12px!important;padding:0 14px!important;border:1px solid transparent!important;border-radius:14px!important;background:transparent!important;color:#b7bac4!important;font:inherit!important;font-size:14px!important;cursor:pointer!important;text-align:start!important}
      .printly-tools-dock button:hover{background:rgba(255,255,255,.06)!important;color:#fff!important;border-color:rgba(255,255,255,.1)!important}
      .printly-tools-dock i{font-size:19px!important;width:22px!important;text-align:center!important}
      .printly-tools-dock .settings i{color:#ff1730!important}
      @media(max-width:720px){.printly-tools-dock{bottom:190px!important;left:16px!important;right:16px!important}.printly-tools-dock button{min-height:50px!important;font-size:15px!important}}
    `;document.head.appendChild(s)
  }
  function call(name,eventName){
    if(typeof window[name]==='function'){window[name]();return}
    document.dispatchEvent(new CustomEvent(eventName));
    setTimeout(()=>{if(typeof window[name]==='function')window[name]()},300);
  }
  function make(){
    const sidebar=document.querySelector('.sidebar');
    if(!sidebar)return;
    style();
    sidebar.style.position='relative';
    let dock=sidebar.querySelector('.printly-tools-dock');
    if(!dock){
      dock=document.createElement('div');dock.className='printly-tools-dock';
      const client=document.createElement('button');client.type='button';client.innerHTML='<i class="bi bi-person-plus"></i><span>Nouveau client</span>';client.onclick=()=>call('__printlyOpenOldClient','printly:open-client');
      const settings=document.createElement('button');settings.type='button';settings.className='settings';settings.innerHTML='<i class="bi bi-gear-wide-connected"></i><span>Paramètres</span>';settings.onclick=()=>call('__printlyOpenSettings','printly:open-settings');
      dock.append(client,settings);sidebar.appendChild(dock);
    }
  }
  function run(){make();setTimeout(make,100);setTimeout(make,500);setTimeout(make,1200)}
  const obs=new MutationObserver(()=>make());
  function start(){run();obs.observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
