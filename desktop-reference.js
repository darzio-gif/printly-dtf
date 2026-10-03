(function(){
 const statusNames={new:'Nouvelle',in_progress:'En traitement',confirmation_pending:'Confirmation en attente',ready_to_print:'Ready to print',sent_to_print:'Send to print',printed:'Printed'};
 const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
 function makeTable(){
  if(innerWidth<901)return;
  const kanban=document.querySelector('.kanban');if(!kanban)return;
  const cards=[...document.querySelectorAll('.kanban .card')];
  const signature=cards.map(c=>c.innerText).join('|')+'|'+(document.querySelector('.sectionTab.active span')?.textContent||'')+'|'+(document.querySelector('.filters input:first-child')?.value||'');
  let table=document.querySelector('.desktop-order-table');
  if(table&&table.dataset.signature===signature)return;
  if(table)table.remove();
  table=document.createElement('section');table.className='desktop-order-table';table.dataset.signature=signature;
  const title=document.querySelector('.mobileColumnHead h3')?.textContent||'Toutes les commandes';
  table.innerHTML='<div class="dot-title"><div><small>Commandes</small><h3>'+esc(title)+'</h3></div><span class="dot-count">'+cards.length+'</span></div><div class="dot-head"><span>#</span><span>Client</span><span>Type</span><span>Statut</span><span>Date</span><span>Responsable</span><span></span></div>';
  const body=document.createDocumentFragment();
  cards.forEach((card,i)=>{
   const order=card.querySelector('.orderLink'),client=card.querySelector('.clientBtn'),status=card.querySelector('.statusSelect'),resp=card.querySelector('.responsible');
   const row=document.createElement('div');row.className='dot-row';row.dataset.index=i;
   const number=order?.textContent||'—';const clientName=client?.childNodes?.[0]?.textContent?.trim()||'—';const phone=client?.querySelector('small')?.textContent||'';const type=(document.querySelector('.sectionTab.active span')?.textContent||'DTF').trim();const st=status?.value||'new';const label=statusNames[st]||status?.selectedOptions?.[0]?.textContent||st;const responsible=resp?.textContent?.replace('👤','').trim()||'—';
   row.innerHTML='<span class="dot-order">'+esc(number)+'</span><span class="dot-client"><strong>'+esc(clientName)+'</strong><span>'+esc(phone)+'</span></span><span class="dot-type">'+esc(type)+'</span><span class="dot-status '+esc(st)+'">'+(st==='printed'?'✓ ':'')+esc(label)+'</span><span>—</span><span class="dot-resp"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20c.7-4 2.7-6 6 6"/></svg>'+esc(responsible)+'</span><span class="dot-more">•••</span>';
   row.addEventListener('click',e=>{if(e.target.closest('.dot-more')||e.target.closest('.dot-status'))return;order?.click()});
   body.appendChild(row);
  });
  if(!cards.length){const e=document.createElement('div');e.className='dot-empty';e.textContent='Aucune commande';body.appendChild(e)}
  table.appendChild(body);kanban.parentNode.insertBefore(table,kanban);
 }
 function headerBell(){const h=document.querySelector('header');if(!h||h.querySelector('.desktop-bell'))return;const b=document.createElement('button');b.className='desktop-bell';b.setAttribute('aria-label','Notifications');b.innerHTML='<svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><i></i>';h.appendChild(b)}
 function run(){if(innerWidth<901)return;headerBell();makeTable()}
 let timer;const obs=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(run,150)});window.addEventListener('load',()=>setTimeout(()=>{run();obs.observe(document.body,{childList:true,subtree:true})},700));window.addEventListener('resize',run);
})();
