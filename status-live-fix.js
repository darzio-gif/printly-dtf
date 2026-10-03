/* PRINTLY — live status update fix
   Keeps ordinary status changes local so changing a status does not reload the whole app.
   Special transitions (Send to print / Printed) are left to the existing meter workflow.
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
  function headers(){const t=token();return {'apikey':KEY,'Authorization':'Bearer '+t,'Content-Type':'application/json','Prefer':'return=minimal'};}
  function orderNumber(card){return (card.querySelector('.orderLink')?.textContent||'').replace('#','').trim();}
  function applyOverride(card,status){
    const select=card.querySelector('.statusSelect'); if(!select)return;
    select.value=status;
    select.className='statusSelect '+status;
    const map={new:'Nouvelle',in_progress:'En traitement',confirmation_pending:'Confirmation en attente',ready_to_print:'Ready to print',sent_to_print:'Send to print',printed:'Printed'};
    const selected=[...select.options].find(o=>o.value===status); if(selected) selected.selected=true;
    card.dataset.printlyStatus=status;
  }
  function findCards(number){return [...document.querySelectorAll('.card')].filter(c=>orderNumber(c)===String(number));}
  function refreshVisuals(number,status){
    overrides.set(String(number),status);
    findCards(number).forEach(c=>applyOverride(c,status));
    // Keep desktop cards in the correct column without touching the rest of the UI.
    document.querySelectorAll('.column').forEach(col=>{
      const title=(col.querySelector('.colHead b')?.textContent||'').trim().toLowerCase();
      const labels={new:'nouvelle',in_progress:'en traitement',confirmation_pending:'confirmation en attente',ready_to_print:'ready to print',sent_to_print:'send to print',printed:'printed'};
      const wanted=(labels[status]||'').toLowerCase();
      findCards(number).forEach(card=>{
        if(title===wanted && !col.contains(card)) col.appendChild(card);
      });
    });
  }
  async function update(number,status){
    const t=token(); if(!t) throw new Error('Session utilisateur introuvable');
    const q=await fetch(API+'/rest/v1/orders?order_number=eq.'+encodeURIComponent(number)+'&select=id,status',{headers:headers()});
    if(!q.ok) throw new Error('Impossible de retrouver la commande');
    const rows=await q.json(); if(!rows[0]?.id) throw new Error('Commande introuvable');
    const r=await fetch(API+'/rest/v1/orders?id=eq.'+encodeURIComponent(rows[0].id),{method:'PATCH',headers:headers(),body:JSON.stringify({status,updated_at:new Date().toISOString()})});
    if(!r.ok) throw new Error('Impossible de modifier le statut');
  }
  async function onChange(e){
    const select=e.target.closest?.('.statusSelect'); if(!select)return;
    const next=select.value;
    if(SPECIAL.has(next)) return;
    const card=select.closest('.card'); if(!card)return;
    const number=orderNumber(card); if(!number)return;
    // Stop React's old handler: it calls reload(), which causes the whole page to flash.
    e.stopPropagation(); e.stopImmediatePropagation();
    const previous=select.dataset.printlyPrevious || [...select.options].find(o=>o.defaultSelected)?.value || 'new';
    select.dataset.printlyPrevious=next;
    select.disabled=true;
    try{
      await update(number,next);
      refreshVisuals(number,next);
    }catch(err){
      select.value=previous;
      select.className='statusSelect '+previous;
      console.error('[PRINTLY] status update failed',err);
      alert('Impossible de modifier le statut.');
    }finally{select.disabled=false;}
  }
  document.addEventListener('change',onChange,true);
  const observer=new MutationObserver(()=>{
    document.querySelectorAll('.card').forEach(card=>{
      const n=orderNumber(card),s=overrides.get(n); if(n&&s&&card.querySelector('.statusSelect')?.value!==s) applyOverride(card,s);
    });
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();
