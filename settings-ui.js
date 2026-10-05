(function(){
  const KEY='printly.settings';
  const defaults={density:'comfortable',motion:true,notifications:true,language:'fr',accent:'red'};
  const state=Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'));
  const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
  const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  function mount(){
    if(document.querySelector('.printly-settings-overlay'))return;
    const nav=document.querySelector('.sideNav');
    if(!nav)return;
    if(!nav.querySelector('[data-settings-open]')){
      const b=document.createElement('button');b.type='button';b.dataset.settingsOpen='1';b.innerHTML='<i class="bi bi-gear-wide-connected" aria-hidden="true"></i><span>Paramètres</span>';b.addEventListener('click',open);nav.appendChild(b);
    }
    const user=document.querySelector('.userInfo strong')?.textContent?.trim()||'Utilisateur';
    const role=document.querySelector('.userInfo small')?.textContent?.trim()||'';
    const overlay=document.createElement('div');overlay.className='printly-settings-overlay';overlay.innerHTML=`
      <section class="printly-settings-shell" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
        <header class="printly-settings-head"><div class="printly-settings-title"><i class="bi bi-gear-wide-connected" aria-hidden="true"></i><div><strong id="settingsTitle">Paramètres</strong><small>Personnalisez votre expérience Printly</small></div></div><button class="printly-settings-close" type="button" data-close aria-label="Fermer"><i class="bi bi-x-lg"></i></button></header>
        <div class="printly-settings-body"><div class="printly-settings-grid">
          <nav class="printly-settings-nav" aria-label="Sections des paramètres"><button class="active" data-tab="general"><i class="bi bi-sliders2"></i> Général</button><button data-tab="appearance"><i class="bi bi-palette"></i> Apparence</button><button data-tab="account"><i class="bi bi-person-circle"></i> Compte</button></nav>
          <div>
            <section class="printly-settings-section active" data-section="general"><h2>Général</h2><p>Les préférences sont enregistrées sur cet appareil.</p>
              <div class="printly-setting-card"><div class="printly-setting-info"><strong>Densité de l'interface</strong><small>Choisissez l'espace entre les cartes et les éléments.</small></div><select class="printly-settings-select" data-setting="density"><option value="comfortable">Confortable</option><option value="compact">Compacte</option></select></div>
              <div class="printly-setting-card"><div class="printly-setting-info"><strong>Animations</strong><small>Désactivez les transitions si vous préférez une interface instantanée.</small></div><label class="printly-switch"><input type="checkbox" data-setting="motion"><span></span></label></div>
              <div class="printly-setting-card"><div class="printly-setting-info"><strong>Notifications visuelles</strong><small>Autorise les retours visuels non intrusifs dans l'interface.</small></div><label class="printly-switch"><input type="checkbox" data-setting="notifications"><span></span></label></div>
            </section>
            <section class="printly-settings-section" data-section="appearance"><h2>Apparence</h2><p>Une apparence sombre optimisée pour Printly DTF.</p>
              <div class="printly-setting-card"><div class="printly-setting-info"><strong>Langue de préférence</strong><small>Préférence enregistrée pour les prochaines évolutions multilingues.</small></div><select class="printly-settings-select" data-setting="language"><option value="fr">Français</option><option value="ar">العربية</option></select></div>
              <div class="printly-setting-card"><div class="printly-setting-info"><strong>Couleur d'accent</strong><small>Couleur principale des actions et états actifs.</small></div><select class="printly-settings-select" data-setting="accent"><option value="red">Printly Red</option><option value="crimson">Crimson</option></select></div>
            </section>
            <section class="printly-settings-section" data-section="account"><h2>Compte</h2><p>Informations du compte actuellement connecté.</p><div class="printly-account"><div class="printly-account-avatar">${esc(user.charAt(0).toUpperCase())}</div><div><strong>${esc(user)}</strong><small>${esc(role)}</small></div></div></section>
          </div>
        </div></div>
      </section>`;
    document.body.appendChild(overlay);
    const close=()=>{overlay.classList.remove('open');document.body.classList.remove('printly-settings-open')};
    overlay.querySelector('[data-close]').addEventListener('click',close);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    overlay.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{overlay.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===btn));overlay.querySelectorAll('[data-section]').forEach(x=>x.classList.toggle('active',x.dataset.section===btn.dataset.tab))}));
    overlay.querySelectorAll('[data-setting]').forEach(el=>{const k=el.dataset.setting;if(el.type==='checkbox')el.checked=!!state[k];else el.value=state[k]||defaults[k];el.addEventListener('change',()=>{state[k]=el.type==='checkbox'?el.checked:el.value;save();apply()})});
    function apply(){document.documentElement.dataset.printlyDensity=state.density;document.documentElement.dataset.printlyMotion=state.motion?'on':'off';document.documentElement.dataset.printlyAccent=state.accent}
    window.__printlyOpenSettings=()=>{overlay.classList.add('open');document.body.classList.add('printly-settings-open');apply();overlay.querySelector('[data-close]').focus()};
    apply();
    function open(){window.__printlyOpenSettings&&window.__printlyOpenSettings()}
    overlay.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  }
  new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState!=='loading')mount();else document.addEventListener('DOMContentLoaded',mount);
})();