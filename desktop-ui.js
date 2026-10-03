(function(){
  const ICONS={
    orders:'<svg viewBox="0 0 24 24"><path d="M7 3h10v18H7z"/><path d="M9 3v3h6V3M9 10h6M9 14h6M9 18h4"/></svg>',
    clients:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20c.7-4 2.7-6 6-6s5.3 2 6 6M16 11a3 3 0 1 0 0-6M17 14c2.5.4 3.8 2.3 4 6"/></svg>',
    journal:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    team:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.7-4 2.7-6 6-6s5.3 2 6 6M15 15c3 .2 4.7 1.8 5 5"/></svg>',
    search:'<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>',
    menu:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    chevron:'<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
    box:'<svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>'
  };
  function run(){
    if(window.innerWidth<901) return;
    const app=document.querySelector('.app'), header=document.querySelector('header');
    if(!app||!header) return;
    if(!document.querySelector('.printly-sidebar')){
      const side=document.createElement('aside'); side.className='printly-sidebar';
      side.innerHTML='<div class="ps-brand"><img src="/logo.png"><span>PRINTLY</span></div><div class="ps-nav">'+
        '<button data-page="dashboard" class="active">'+ICONS.orders+'<span>Commandes</span><b>›</b></button>'+ 
        '<button data-page="customers">'+ICONS.clients+'<span>Clients</span><b>›</b></button>'+ 
        '<button data-page="activity">'+ICONS.journal+'<span>Journal</span><b>›</b></button>'+ 
        '<button data-page="users" class="ps-team">'+ICONS.team+'<span>Équipe</span><b>›</b></button>'+ 
      '</div><div class="ps-bottom"><div class="ps-products">'+ICONS.box+'<span>Stock & Produits</span><b>›</b></div><div class="ps-profile"><div class="ps-avatar">F</div><div><strong class="ps-name">Fouad</strong><small class="ps-role">Admin</small></div><b>›</b></div></div>';
      app.prepend(side);
      side.querySelectorAll('.ps-nav button').forEach(btn=>btn.addEventListener('click',()=>{
        const target=btn.dataset.page;
        const map={dashboard:'.desktopNav button:nth-child(1)',customers:'.desktopNav button:nth-child(2)',activity:'.desktopNav button:nth-child(3)',users:'.desktopNav button:nth-child(4)'};
        const el=document.querySelector(map[target]); if(el) el.click();
        side.querySelectorAll('button').forEach(x=>x.classList.remove('active')); btn.classList.add('active');
      }));
    }
    if(!document.querySelector('.printly-menu-btn')){
      const menu=document.createElement('button'); menu.className='printly-menu-btn'; menu.innerHTML=ICONS.menu; menu.setAttribute('aria-label','Menu');
      menu.onclick=()=>document.querySelector('.printly-sidebar')?.classList.toggle('collapsed');
      header.prepend(menu);
    }
    if(!document.querySelector('.desktop-search')){
      const wrap=document.createElement('div'); wrap.className='desktop-search'; wrap.innerHTML=ICONS.search+'<input placeholder="Rechercher client, téléphone, commande...">';
      const inp=wrap.querySelector('input'); const target=()=>document.querySelector('.filters input:first-child');
      inp.addEventListener('input',e=>{const t=target();if(t){t.value=e.target.value;t.dispatchEvent(new Event('input',{bubbles:true}))}});
      header.insertBefore(wrap,header.querySelector('.user'));
    }
    const profile=document.querySelector('.ps-profile'); const strong=document.querySelector('.userInfo strong'); const role=document.querySelector('.userInfo small');
    if(profile&&strong) profile.querySelector('.ps-name').textContent=strong.textContent||'Fouad';
    if(profile&&role) profile.querySelector('.ps-role').textContent=role.textContent||'Admin';
    const admin=document.querySelector('.desktopNav button:nth-child(4)'); const team=document.querySelector('.ps-team'); if(team) team.style.display=admin?'flex':'none';
  }
  const obs=new MutationObserver(()=>run());
  window.addEventListener('resize',()=>{if(window.innerWidth>=901)run()});
  window.addEventListener('load',()=>{setTimeout(()=>{run();obs.observe(document.body,{childList:true,subtree:true})},500)});
})();
