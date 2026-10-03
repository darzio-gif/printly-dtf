(function(){
  const icons={
    menu:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    orders:'<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h5M9 13h6M9 17h5"/></svg>',
    users:'<svg viewBox="0 0 24 24"><path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5H7.5A4.5 4.5 0 0 0 3 18.5V20"/><circle cx="9.5" cy="7.5" r="3.5"/><path d="M16 11a3.5 3.5 0 1 0 0-7"/><path d="M16 14h1.5A3.5 3.5 0 0 1 21 17.5V20"/></svg>',
    activity:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>',
    team:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3A4.5 4.5 0 0 1 15 18.5V20M15 15h1.5A4.5 4.5 0 0 1 21 19.5V20"/></svg>'
  };
  function make(tag,attrs,html){const e=document.createElement(tag);Object.entries(attrs||{}).forEach(([k,v])=>e.setAttribute(k,v));if(html)e.innerHTML=html;return e}
  function setup(){
    const header=document.querySelector('header'); if(!header)return;
    if(!document.querySelector('.printly-menu-btn')){
      const btn=make('button',{class:'printly-menu-btn','aria-label':'Ouvrir le menu'},icons.menu);
      btn.onclick=openDrawer;
      header.insertBefore(btn,header.firstChild);
    }
    document.querySelectorAll('.mobileNav button').forEach((b,i)=>{const s=b.querySelector('span');if(s&&!s.dataset.icon){s.dataset.icon='1';s.innerHTML=[icons.orders,icons.users,icons.activity,icons.team][i]||icons.orders;}});
    if(!document.querySelector('.printly-drawer')) buildDrawer();
  }
  function buildDrawer(){
    const backdrop=make('div',{class:'printly-drawer-backdrop'});backdrop.style.display='none';backdrop.onclick=closeDrawer;
    const drawer=make('aside',{class:'printly-drawer','aria-label':'Menu principal'});
    drawer.innerHTML='<div class="drawer-head"><div class="drawer-logo"></div><strong>PRINTLY</strong><button class="drawer-close" aria-label="Fermer">×</button></div><div class="drawer-nav"></div>';
    drawer.querySelector('.drawer-close').onclick=closeDrawer;
    const nav=drawer.querySelector('.drawer-nav');
    const items=[['dashboard','Commandes',icons.orders],['customers','Clients',icons.users],['activity','Journal',icons.activity],['users','Équipe',icons.team]];
    items.forEach(([page,label,icon])=>{const b=make('button',{},icon+'<span>'+label+'</span>');b.dataset.page=page;b.onclick=()=>{const target=[...document.querySelectorAll('.desktopNav button')].find(x=>x.textContent.trim().toLowerCase().includes(label.toLowerCase().replace('commandes','dashboard')))||[...document.querySelectorAll('.mobileNav button')].find(x=>x.textContent.trim().toLowerCase().includes(label.toLowerCase()));if(target)target.click();closeDrawer();};nav.appendChild(b);});
    document.body.append(backdrop,drawer);
    const observer=new MutationObserver(()=>{const active=[...document.querySelectorAll('.mobileNav button')].find(x=>x.classList.contains('active'))||[...document.querySelectorAll('.desktopNav button')].find(x=>x.classList.contains('active'));const page=active?.textContent?.trim().toLowerCase();nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.textContent.trim().toLowerCase()===page||((page==='dashboard'||page==='commandes')&&b.dataset.page==='dashboard')));});observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
  }
  function openDrawer(){const d=document.querySelector('.printly-drawer'),b=document.querySelector('.printly-drawer-backdrop');if(!d||!b)return;b.style.display='block';requestAnimationFrame(()=>d.classList.add('open'));}
  function closeDrawer(){const d=document.querySelector('.printly-drawer'),b=document.querySelector('.printly-drawer-backdrop');if(!d||!b)return;d.classList.remove('open');setTimeout(()=>b.style.display='none',280);}
  new MutationObserver(setup).observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
