/* PRINTLY — live status update + order deletion permissions
   Status changes stay local. Order deletion is allowed when:
   - the current user created the order, OR
   - the order is Printed (all users).
*/
(function(){
  const API='https://gfvvxwdbahakysxnwyxr.supabase.co';
  const KEY='sb_publishable_D29Cvfa1ie3-AikSpOOsCg_aL97agYL';
  const SPECIAL=new Set(['sent_to_print','printed']);
  const overrides=new Map();

  function token(){
    try{
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i)||'';
        if(!k.includes('auth-token')) continue;
        const raw=localStorage.getItem(k); if(!raw) continue;
        const v=JSON.parse(raw); if(v?.access_token) return v.access_token;
      }
    }catch(e){}
    return '';
  }
  function userId(){
    try{
      const t=token().split('.')[1];
      if(!t)return '';
      const payload=JSON.parse(atob(t.replace(/-/g,'+').replace(/_/g,'/')));
      return payload.sub||'';
    }catch(e){return ''}
  }
  function headers(){const t=token();return {'apikey':KEY,'Authorization':'Bearer '+t,'Content-Type':'application/json','Prefer':'return=minimal'};}
  function orderNumber(card){return (card.querySelector('.orderLink')?.textContent||'').replace('#','').trim();}
  function applyOverride(card,status){
    const select=card.querySelector('.statusSelect'); if(!select)return;
    select.value=status;
    select.className='statusSelect '+status;
    const selected=[...select.options].find(o=>o.value===status); if(selected) selected.selected=true;
    card.dataset.printlyStatus=status;
  }
  function findCards(number){return [...document.querySelectorAll('.card')].filter(c=>orderNumber(c)===String(number));}
  function refreshVisuals(number,status){
    overrides.set(String(number),status);
    findCards(number).forEach(c=>applyOverride(c,status));
    document.querySelectorAll('.column').forEach(col=>{
      const title=(col.querySelector('.colHead b')?.textContent||'').trim().toLowerCase();
      const labels={new:'nouvelle',in_progress:'en traitement',confirmation_pending:'confirmation en attente',ready_to_print:'ready to print',sent_to_print:'send to print',printed:'printed'};
      const wanted=(labels[status]||'').toLowerCase();
      findCards(number).forEach(card=>{
        if(title===wanted && !col.contains(card)) col.appendChild(card);
      });
    });
  }
  async function getOrder(number){
    const q=await fetch(API+'/rest/v1/orders?order_number=eq.'+encodeURIComponent(number)+'&select=id,status,created_by,order_number',{headers:headers()});
    if(!q.ok) throw new Error('Impossible de retrouver la commande');
    const rows=await q.json();
    if(!rows[0]?.id) throw new Error('Commande introuvable');
    return rows[0];
  }
  async function update(number,status){
    const t=token(); if(!t) throw new Error('Session utilisateur introuvable');
    const row=await getOrder(number);
    const r=await fetch(API+'/rest/v1/orders?id=eq.'+encodeURIComponent(row.id),{method:'PATCH',headers:headers(),body:JSON.stringify({status,updated_at:new Date().toISOString()})});
    if(!r.ok) throw new Error('Impossible de modifier le statut');
  }
  function addDeleteStyles(){
    if(document.getElementById('printly-delete-style'))return;
    const s=document.createElement('style');s.id='printly-delete-style';
    s.textContent='.printlyDeleteBtn{width:34px;height:34px;border:1px solid rgba(255,16,38,.22);border-radius:10px;background:rgba(255,16,38,.08);color:#ff4050;display:grid;place-items:center;cursor:pointer;font-size:15px;line-height:1;flex:0 0 auto;transition:.18s}.printlyDeleteBtn:hover{background:#ff1026;color:#fff;border-color:#ff1026;transform:translateY(-1px)}.printlyDeleteBtn:disabled{opacity:.5;cursor:wait}.cardTop{display:flex;align-items:center;gap:7px}.cardTop .statusSelect{margin-left:auto}.printlyDeleteBtn + .statusSelect{margin-left:0!important}';
    document.head.appendChild(s);
  }
  async function setupDelete(card){
    if(!card||card.dataset.printlyDeleteReady==='1')return;
    const number=orderNumber(card); if(!number)return;
    card.dataset.printlyDeleteReady='1';
    try{
      const row=await getOrder(number);
      const me=userId();
      const allowed=row.status==='printed'||(row.created_by&&row.created_by===me);
      if(!allowed)return;
      addDeleteStyles();
      const top=card.querySelector('.cardTop'); if(!top)return;
      if(top.querySelector('.printlyDeleteBtn'))return;
      const btn=document.createElement('button');
      btn.type='button';btn.className='printlyDeleteBtn';btn.title=row.status==='printed'?'Supprimer la commande (autorisé pour tous)':'Supprimer ma commande';btn.setAttribute('aria-label',btn.title);btn.innerHTML='🗑';
      btn.addEventListener('click',async e=>{
        e.preventDefault();e.stopPropagation();
        if(!confirm(`Supprimer définitivement la commande #${row.order_number} ?`))return;
        btn.disabled=true;
        try{
          const r=await fetch(API+'/rest/v1/rpc/delete_printed_order',{method:'POST',headers:headers(),body:JSON.stringify({p_order_id:row.id})});
          const body=await r.text();
          if(!r.ok)throw new Error(body||'Suppression impossible');
          findCards(row.order_number).forEach(c=>c.remove());
          window.location.reload();
        }catch(err){
          console.error('[PRINTLY] delete failed',err);
          alert(err?.message||'Impossible de supprimer la commande.');
          btn.disabled=false;
        }
      });
      top.insertBefore(btn,top.querySelector('.statusSelect'));
    }catch(err){
      console.error('[PRINTLY] delete permission check failed',err);
    }
  }
  function scanDeleteButtons(){document.querySelectorAll('.card').forEach(setupDelete)}
  async function onChange(e){
    const select=e.target.closest?.('.statusSelect'); if(!select)return;
    const next=select.value;
    if(SPECIAL.has(next)) return;
    const card=select.closest('.card'); if(!card)return;
    const number=orderNumber(card); if(!number)return;
    e.stopPropagation(); e.stopImmediatePropagation();
    const previous=select.dataset.printlyPrevious || [...select.options].find(o=>o.defaultSelected)?.value || 'new';
    select.dataset.printlyPrevious=next;select.disabled=true;
    try{await update(number,next);refreshVisuals(number,next);}
    catch(err){select.value=previous;select.className='statusSelect '+previous;console.error('[PRINTLY] status update failed',err);alert('Impossible de modifier le statut.');}
    finally{select.disabled=false;scanDeleteButtons();}
  }
  document.addEventListener('change',onChange,true);
  const observer=new MutationObserver(()=>{
    document.querySelectorAll('.card').forEach(card=>{const n=orderNumber(card),s=overrides.get(n);if(n&&s&&card.querySelector('.statusSelect')?.value!==s)applyOverride(card,s);});
    scanDeleteButtons();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(scanDeleteButtons,700);
})();
