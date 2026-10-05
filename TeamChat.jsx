import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createClient} from '@supabase/supabase-js';

const supabase=createClient(
  import.meta.env.VITE_SUPABASE_URL||'https://gfvvxwdbahakysxnwyxr.supabase.co',
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_D29Cvfa1ie3-AikSpOOsCg_aL97agYL'
);

const roleLabels={admin:'Admin',designer:'Infographe',graphiste:'Infographe',print_operator:'Opérateur',staff:'Commercial'};
const initials=name=>(name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const timeLabel=d=>d?new Date(d).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'';
const dayLabel=d=>d?new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}):'';

export default function TeamChat({me,profiles,orders,onClose}){
  const [rooms,setRooms]=useState([]);
  const [selectedRoom,setSelectedRoom]=useState(null);
  const [messages,setMessages]=useState([]);
  const [loadingRooms,setLoadingRooms]=useState(true);
  const [loadingMessages,setLoadingMessages]=useState(false);
  const [sending,setSending]=useState(false);
  const [text,setText]=useState('');
  const [search,setSearch]=useState('');
  const [memberPicker,setMemberPicker]=useState(false);
  const [orderId,setOrderId]=useState('');
  const [error,setError]=useState('');
  const endRef=useRef(null);
  const inputRef=useRef(null);

  const profileMap=useMemo(()=>Object.fromEntries((profiles||[]).map(p=>[p.id,p])),[profiles]);

  const hydrateRooms=async()=>{
    if(!me?.id)return;
    const {data,error:rError}=await supabase
      .from('chat_rooms')
      .select('id,type,name,created_by,created_at,chat_room_members(user_id,last_read_at,profiles(id,full_name,role,avatar_url))')
      .order('created_at',{ascending:true});
    if(rError){setError(rError.message);setLoadingRooms(false);return;}
    const base=(data||[]).map(room=>{
      const members=room.chat_room_members||[];
      const other=members.find(m=>m.user_id!==me.id)?.profiles;
      const title=room.type==='general'?(room.name||'Team général'):(other?.full_name||'Conversation privée');
      const lastRead=members.find(m=>m.user_id===me.id)?.last_read_at||null;
      return {...room,members,title,other,lastRead,unread:0};
    });
    const withUnread=await Promise.all(base.map(async room=>{
      let q=supabase.from('chat_messages').select('id',{count:'exact',head:true}).eq('room_id',room.id).neq('sender_id',me.id);
      if(room.lastRead)q=q.gt('created_at',room.lastRead);
      const {count}=await q;
      return {...room,unread:count||0};
    }));
    setRooms(withUnread);
    setLoadingRooms(false);
    if(!selectedRoom && withUnread.length)setSelectedRoom(withUnread[0]);
    else if(selectedRoom){
      const fresh=withUnread.find(r=>r.id===selectedRoom.id);
      if(fresh)setSelectedRoom(fresh);
    }
  };

  const loadMessages=async room=>{
    if(!room?.id)return;
    setLoadingMessages(true);
    setError('');
    const {data,error:rError}=await supabase
      .from('chat_messages')
      .select('id,room_id,sender_id,message,order_id,created_at,profiles:sender_id(id,full_name,role,avatar_url),orders:order_id(order_number,title)')
      .eq('room_id',room.id)
      .order('created_at',{ascending:true})
      .limit(500);
    if(rError)setError(rError.message);
    setMessages(data||[]);
    setLoadingMessages(false);
    const now=new Date().toISOString();
    await supabase.from('chat_room_members').update({last_read_at:now}).eq('room_id',room.id).eq('user_id',me.id);
    setRooms(prev=>prev.map(r=>r.id===room.id?{...r,unread:0,lastRead:now}:r));
    setSelectedRoom(prev=>prev?.id===room.id?{...prev,unread:0,lastRead:now}:prev);
  };

  useEffect(()=>{hydrateRooms()},[me?.id]);
  useEffect(()=>{if(selectedRoom)loadMessages(selectedRoom)},[selectedRoom?.id]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'})},[messages.length,selectedRoom?.id]);

  useEffect(()=>{
    if(!me?.id)return;
    const channel=supabase.channel('printly-team-chat-'+me.id)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages'},payload=>{
        const msg=payload.new;
        if(msg.room_id===selectedRoom?.id){
          setMessages(prev=>prev.some(x=>x.id===msg.id)?prev:[...prev,msg]);
          supabase.from('chat_messages').select('id,room_id,sender_id,message,order_id,created_at,profiles:sender_id(id,full_name,role,avatar_url),orders:order_id(order_number,title)').eq('id',msg.id).single().then(({data})=>{
            if(data)setMessages(prev=>prev.map(x=>x.id===msg.id?data:x));
          });
          if(msg.sender_id!==me.id){
            const now=new Date().toISOString();
            supabase.from('chat_room_members').update({last_read_at:now}).eq('room_id',msg.room_id).eq('user_id',me.id);
          }
        }else hydrateRooms();
      })
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_room_members'},()=>hydrateRooms())
      .subscribe();
    return()=>{supabase.removeChannel(channel)};
  },[me?.id,selectedRoom?.id]);

  const visibleRooms=rooms.filter(r=>{
    const q=search.trim().toLowerCase();
    if(!q)return true;
    return r.title.toLowerCase().includes(q)||(roleLabels[r.other?.role]||'').toLowerCase().includes(q);
  });

  async function openPrivate(profile){
    setMemberPicker(false);
    setSearch('');
    setError('');
    const {data,error:rError}=await supabase.rpc('create_private_chat',{p_other_user_id:profile.id});
    if(rError){setError(rError.message);return;}
    await hydrateRooms();
    setRooms(prev=>{
      const room=prev.find(r=>r.id===data);
      if(room)setSelectedRoom(room);
      return prev;
    });
  }

  async function send(){
    const value=text.trim();
    if(!value||!selectedRoom||sending)return;
    setSending(true);setError('');
    const payload={room_id:selectedRoom.id,sender_id:me.id,message:value,order_id:orderId||null};
    const {data,error:rError}=await supabase.from('chat_messages').insert(payload).select('id,room_id,sender_id,message,order_id,created_at,profiles:sender_id(id,full_name,role,avatar_url),orders:order_id(order_number,title)').single();
    if(rError)setError(rError.message);
    else{
      setMessages(prev=>prev.some(x=>x.id===data.id)?prev:[...prev,data]);
      setText('');
      setOrderId('');
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}
  const otherProfiles=(profiles||[]).filter(p=>p.id!==me.id);

  return <div className="teamChatOverlay">
    <section className="teamChatWindow" role="dialog" aria-modal="true" aria-label="Team Chat">
      <header className="teamChatHeader">
        <div className="teamChatTitle"><div className="teamChatLogo">💬</div><div><strong>Team Chat</strong><small>Communication interne · Printly</small></div></div>
        <button className="teamChatClose" onClick={onClose} aria-label="Fermer">×</button>
      </header>
      <div className="teamChatBody">
        <aside className="teamChatRooms">
          <div className="teamChatRoomTools"><div className="teamChatSearch"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." /></div><button className="teamChatNew" onClick={()=>setMemberPicker(v=>!v)} title="Nouveau message">＋</button></div>
          {memberPicker&&<div className="teamChatMemberPicker"><div className="pickerTitle">Nouveau message</div>{otherProfiles.map(p=><button key={p.id} onClick={()=>openPrivate(p)}><span className="chatAvatar">{initials(p.full_name)}</span><span><b>{p.full_name}</b><small>{roleLabels[p.role]||p.role}</small></span></button>)}</div>}
          <div className="teamChatRoomList">
            {loadingRooms?<div className="chatEmpty">Chargement…</div>:visibleRooms.length===0?<div className="chatEmpty">Aucune conversation</div>:visibleRooms.map(room=><button key={room.id} className={'teamChatRoom '+(selectedRoom?.id===room.id?'active':'')} onClick={()=>setSelectedRoom(room)}><span className={'chatAvatar '+(room.type==='general'?'general':'')}>{room.type==='general'?'👥':initials(room.other?.full_name)}</span><span className="roomCopy"><b>{room.title}</b><small>{room.type==='general'?'Tous les membres':(roleLabels[room.other?.role]||'Membre')}</small></span>{room.unread>0&&<em>{room.unread>99?'99+':room.unread}</em>}</button>)}
          </div>
        </aside>
        <section className="teamChatConversation">
          {selectedRoom?<><div className="teamChatConversationHead"><button className="chatBackMobile" onClick={()=>setSelectedRoom(null)} aria-label="Retour">‹</button><div className="conversationIdentity"><span className={'chatAvatar '+(selectedRoom.type==='general'?'general':'')}>{selectedRoom.type==='general'?'👥':initials(selectedRoom.other?.full_name)}</span><div><strong>{selectedRoom.title}</strong><small>{selectedRoom.type==='general'?(selectedRoom.members?.length||0)+' membres':(roleLabels[selectedRoom.other?.role]||'Membre')}</small></div></div></div>
          <div className="teamChatMessages">
            {loadingMessages?<div className="chatEmpty">Chargement des messages…</div>:messages.length===0?<div className="chatWelcome"><div>💬</div><strong>Commencez la conversation</strong><span>Échangez avec l’équipe et partagez les informations des commandes.</span></div>:messages.map((m,i)=>{
              const own=m.sender_id===me.id;
              const previous=messages[i-1];
              const showDate=!previous||dayLabel(previous.created_at)!==dayLabel(m.created_at);
              const senderName=m.profiles?.full_name||profileMap[m.sender_id]?.full_name||'Membre';
              const senderRole=m.profiles?.role||profileMap[m.sender_id]?.role;
              return <React.Fragment key={m.id}>{showDate&&<div className="chatDate"><span>{dayLabel(m.created_at)}</span></div>}<div className={'chatMessageRow '+(own?'own':'')}>{!own&&<span className="chatAvatar small">{initials(senderName)}</span>}<div className="chatBubbleWrap">{!own&&<small className="chatSender">{senderName} · {roleLabels[senderRole]||''}</small>}<div className="chatBubble">{m.message}</div>{m.order_id&&<div className="chatOrderLink">📦 Commande #{m.orders?.order_number||'—'}{m.orders?.title?' · '+m.orders.title:''}</div>}<span className="chatTime">{timeLabel(m.created_at)}</span></div></div></React.Fragment>;
            })}
            <div ref={endRef}/>
          </div>
          <div className="teamChatComposer"><div className="chatComposerTools"><button type="button" onClick={()=>setText(v=>v+'🙂')} title="Emoji">☺</button><select value={orderId} onChange={e=>setOrderId(e.target.value)} title="Lier une commande"><option value="">Lier une commande…</option>{(orders||[]).slice(0,80).map(o=><option key={o.id} value={o.id}>#{o.order_number} · {o.title}</option>)}</select></div><div className="chatComposerInput"><textarea ref={inputRef} value={text} onChange={e=>setText(e.target.value)} onKeyDown={onKeyDown} placeholder="Écrire un message…" rows={1} maxLength={4000}/><button type="button" className="chatSend" onClick={send} disabled={sending||!text.trim()}>{sending?'…':'➤'}</button></div>{error&&<div className="chatError">{error}</div>}<small className="chatHint">Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne</small></div>
          </>:<div className="chatWelcome"><div>💬</div><strong>Team Chat</strong><span>Sélectionnez une conversation pour commencer.</span></div>}
        </section>
      </div>
    </section>
  </div>;
}
