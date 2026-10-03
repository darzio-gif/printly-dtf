/* PRINTLY — mobile status carousel
   Visual-only transformation of the existing mobile "Toutes les commandes" board.
   The React/Supabase order logic remains untouched.
*/
(function(){
  const STATUSES=[
    ['new','Nouvelle commande'],
    ['in_progress','En traitement'],
    ['confirmation_pending','Confirmation en attente'],
    ['ready_to_print','Ready to print'],
    ['sent_to_print','Send to print'],
    ['printed','Printed']
  ];
  let scheduled=false;
  let rebuilding=false;

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const mobile=()=>window.matchMedia('(max-width:900px)').matches;

  function css(){return `
    :host{display:block;width:100%;min-width:0;color:#f5f5f5;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}
    .carousel{display:flex;gap:12px;width:100%;overflow-x:auto;overflow-y:visible;padding:0 2px 12px;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none;touch-action:pan-x}
    .carousel::-webkit-scrollbar{display:none}
    .column{flex:0 0 88%;min-width:0;min-height:300px;background:#111214;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;scroll-snap-align:start;scroll-snap-stop:always;box-shadow:0 12px 35px rgba(0,0,0,.16)}
    .head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:3px 4px 13px}
    .head b{font-size:16px;line-height:1.25;color:#f5f5f5}
    .count{min-width:30px;height:30px;padding:0 9px;border-radius:999px;background:#222326;color:#aaa;display:grid;place-items:center;font-size:13px;font-weight:700}
    .orders{display:grid;gap:10px}
    .empty{min-height:180px;display:grid;place-items:center;text-align:center;color:#747478;font-size:14px}
    .card{background:#151516!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:15px!important;padding:16px!important;margin:0!important;color:#f5f5f5}
    .cardTop{display:flex;justify-content:space-between;align-items:center;gap:8px}
    .orderLink{background:none;border:0;padding:0;color:#fff;font-size:23px;font-weight:850}
    .statusSelect{max-width:58%;height:40px;background:#222!important;border:1px solid #333!important;color:#fff!important;border-radius:999px!important;padding:0 11px!important;font-size:12px}
    .statusSelect.confirmation_pending{background:#6b4b08!important}
    .statusSelect.ready_to_print{background:#084b31!important}
    .statusSelect.sent_to_print{background:#174a6b!important}
    .statusSelect.printed{background:#174b27!important}
    .card h3{margin:16px 0 7px;font-size:19px;color:#fff}
    .clientBtn{background:none;border:0;text-align:left;padding:0;color:#ddd;font-size:15px}
    .clientBtn small{color:#888}
    .responsible,.meter{margin-top:10px;color:#9b9b9b;font-size:13px}
    .meter b{color:#fff}
    .new{box-shadow:inset 0 1px 0 rgba(255,16,38,.16)}
    .in_progress{box-shadow:inset 0 1px 0 rgba(255,157,32,.14)}
    .confirmation_pending{box-shadow:inset 0 1px 0 rgba(22,134,255,.14)}
    .ready_to_print{box-shadow:inset 0 1px 0 rgba(21,199,106,.14)}
  `}

  function orderNumber(card){return (card.querySelector('.orderLink')?.textContent||'').replace('#','').trim()}
  function statusFromSelect(card){return card.querySelector('.statusSelect')?.value||'new'}

  function getBoard(){return document.querySelector('.mobileBoard.mobileOnly')||document.querySelector('.mobileBoard')}

  async function selectStatus(board,status){
    const buttons=[...board.querySelectorAll('.mobileStatusTabs button')];
    const index=STATUSES.findIndex(x=>x[0]===status);
    const button=buttons[index+1];
    if(!button)return;
    button.click();
    await sleep(30);
  }

  function makeShadow(board){
    if(board.__printlyCarouselShadow)return board.__printlyCarouselShadow;
    const root=board.attachShadow({mode:'open'});
    const style=document.createElement('style');
    style.textContent=css();
    const wrap=document.createElement('div');
    wrap.className='carousel';
    root.append(style,wrap);
    board.__printlyCarouselShadow={root,wrap};
    return board.__printlyCarouselShadow;
  }

  function bindCloneInteractions(card,sourceStatus){
    const number=orderNumber(card);
    if(!number)return;
    card.querySelector('.statusSelect')?.addEventListener('change',async e=>{
      const next=e.target.value;
      const board=getBoard();
      if(!board)return;
      await selectStatus(board,sourceStatus);
      const original=[...board.querySelectorAll('.mobileColumn .card')].find(c=>orderNumber(c)===number);
      const originalSelect=original?.querySelector('.statusSelect');
      if(!originalSelect)return;
      originalSelect.value=next;
      originalSelect.dispatchEvent(new Event('change',{bubbles:true}));
    });
    ['.orderLink','.clientBtn'].forEach(selector=>{
      card.querySelector(selector)?.addEventListener('click',async e=>{
        e.preventDefault();
        const board=getBoard();
        if(!board)return;
        await selectStatus(board,sourceStatus);
        const original=[...board.querySelectorAll('.mobileColumn .card')].find(c=>orderNumber(c)===number);
        const target=original?.querySelector(selector);
        if(target)target.click();
      });
    });
  }

  async function rebuild(board){
    if(rebuilding||!mobile())return;
    rebuilding=true;
    try{
      const shadow=makeShadow(board);
      const previousActive=board.querySelector('.mobileStatusTabs button.active')?.textContent||'';
      const snapshots=new Map();

      for(const [status,label] of STATUSES){
        await selectStatus(board,status);
        const source=board.querySelector('.mobileColumn');
        const cards=[...(source?.querySelectorAll('.card')||[])].map(c=>c.cloneNode(true));
        snapshots.set(status,cards);
      }

      // The live status fix can change a card's select locally without React moving it yet.
      // Use the effective select value to place the visual clone in the right column.
      const all=[];
      snapshots.forEach((cards,sourceStatus)=>cards.forEach(card=>all.push({card,sourceStatus}))); 
      const unique=new Map();
      all.forEach(item=>{
        const n=orderNumber(item.card);
        if(n&&!unique.has(n))unique.set(n,item);
      });

      shadow.wrap.innerHTML='';
      const columns=new Map();
      STATUSES.forEach(([status,label])=>{
        const col=document.createElement('section');
        col.className='column '+status;
        const head=document.createElement('div');
        head.className='head';
        const title=document.createElement('b');title.textContent=label;
        const count=document.createElement('span');count.className='count';
        const orders=document.createElement('div');orders.className='orders';
        head.append(title,count);col.append(head,orders);shadow.wrap.appendChild(col);columns.set(status,{col,count,orders});
      });

      unique.forEach(({card,sourceStatus})=>{
        const effective=statusFromSelect(card);
        const target=columns.get(effective)||columns.get(sourceStatus);
        if(!target)return;
        target.orders.appendChild(card);
        bindCloneInteractions(card,sourceStatus);
      });

      columns.forEach(({count,orders})=>{
        count.textContent=orders.children.length;
        if(!orders.children.length){
          const empty=document.createElement('div');empty.className='empty';empty.textContent='Aucune commande';orders.appendChild(empty);
        }
      });

      // Keep React's hidden/light-DOM state on the same tab that was active before rebuilding.
      if(previousActive){
        const buttons=[...board.querySelectorAll('.mobileStatusTabs button')];
        const restore=buttons.find(b=>b.textContent===previousActive);
        if(restore)restore.click();
      }
    }finally{
      rebuilding=false;
    }
  }

  function schedule(board){
    if(scheduled)return;
    scheduled=true;
    setTimeout(async()=>{scheduled=false;if(board?.isConnected)await rebuild(board)},70);
  }

  function setup(){
    const board=getBoard();
    if(!board||!mobile())return;
    makeShadow(board);
    board.classList.add('printly-carousel-host');
    if(!board.__printlyCarouselObserver){
      const observer=new MutationObserver(()=>schedule(board));
      observer.observe(board,{childList:true,subtree:true,attributes:true,attributeFilter:['class','value']});
      board.__printlyCarouselObserver=observer;
    }
    schedule(board);
  }

  const rootObserver=new MutationObserver(()=>setup());
  rootObserver.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',()=>{if(mobile())setup()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
