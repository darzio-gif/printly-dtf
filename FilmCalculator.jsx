import React,{useState} from 'react';

export default function FilmCalculator(){
 const [filmW,setFilmW]=useState(58),[gap,setGap]=useState(.5),[margin,setMargin]=useState(.2);
 const [rows,setRows]=useState([{id:1,name:'Design 1',w:20,h:30,qty:2,rotate:true,group:'1'},{id:2,name:'Design 2',w:15,h:20,qty:4,rotate:true,group:'1'},{id:3,name:'Design 3',w:40,h:25,qty:1,rotate:true,group:'1'}]);
 const [result,setResult]=useState(null),[error,setError]=useState('');
 const add=()=>setRows(v=>[...v,{id:Date.now(),name:'Design '+(v.length+1),w:'',h:'',qty:1,rotate:true,group:'1'}]);
 const update=(id,key,val)=>setRows(v=>v.map(r=>r.id===id?{...r,[key]:val}:r));
 const remove=id=>setRows(v=>v.filter(r=>r.id!==id));
 const pack=(items,usableW)=>{const placed=[],eps=1e-8,overlap=(a,b)=>a.x<b.x+b.w-eps&&a.x+a.w>b.x+eps&&a.y<b.y+b.h-eps&&a.y+a.h>b.y+eps;
  const order=[...items].sort((a,b)=>Math.max(b.w,b.h)**2-Math.max(a.w,a.h)**2);
  for(const p of order){let best=null;const choices=p.rotate&&Math.abs(p.w-p.h)>eps?[{w:p.w,h:p.h,r:false},{w:p.h,h:p.w,r:true}]:[{w:p.w,h:p.h,r:false}];
   for(const ch of choices){if(ch.w>usableW+eps)continue;const xs=new Set([0]);for(const q of placed){xs.add(q.x+q.w+gap);xs.add(q.x-ch.w-gap)}
    for(const x of [...xs].sort((a,b)=>a-b)){if(x<-eps||x+ch.w>usableW+eps)continue;let y=0;
     while(true){let moved=false;for(const q of placed){if(overlap({x,y,w:ch.w,h:ch.h},q)){y=q.y+q.h+gap;moved=true}}if(!moved)break}
     const cand={...p,...ch,x,y};if(!best||cand.y+cand.h<best.y+best.h)best=cand;
    }
   }
   if(!best)throw new Error('Un design dépasse la largeur disponible du Film. Activez la rotation ou réduisez sa taille.');
   placed.push(best);
  }
  return {items:placed,height:placed.length?Math.max(...placed.map(x=>x.y+x.h)):0};
 };
 const calculate=()=>{setError('');const fw=Number(filmW),g=Number(gap),m=Number(margin);
  if(!(fw>0)||g<0||m<0||fw<=2*m)return setError('Vérifiez la largeur du Film, l’espace et la marge.');
  const usable=fw-2*m,items=[];
  for(const row of rows){const w=Number(row.w),h=Number(row.h),q=Number(row.qty);if(!(w>0&&h>0&&q>0))continue;for(let i=1;i<=q;i++)items.push({name:row.name||'Design',w,h,rotate:!!row.rotate,group:String(row.group||'1'),copy:i})}
  if(!items.length)return setError('Ajoutez au moins un design valide.');
  const groups=[],map=new Map();
  items.forEach(it=>{const k=it.group.toLowerCase();if(!map.has(k)){const g={label:it.group,items:[]};map.set(k,g);groups.push(g)}map.get(k).items.push(it)});
  const films=groups.map((g,i)=>{const p=pack(g.items,usable);return {...p,filmH:p.height+2*m,number:i+1,group:g.label}});
  const totalH=films.reduce((a,f)=>a+f.filmH,0);
  setResult({films,totalH,meters:totalH/100,area:totalH*fw/10000,count:items.length});
 };
 return <div className="filmCalcPage">
  <div className="top"><div><h2>DTF Film Calculator</h2><p>Calcul et organisation intelligente de votre consommation de Film DTF.</p></div></div>
  <div className="filmCalcGrid">
   <section className="card filmCalcSettings"><div className="sectionHead"><div><h3>Film setup</h3><small>PARAMÈTRES DE PRODUCTION</small></div><span>58 CM</span></div>
    <div className="filmSettingsFields"><label>Largeur du Film (cm)<input type="number" value={filmW} min="0.1" step="0.01" onChange={e=>setFilmW(e.target.value)}/></label><label>Espace entre designs (cm)<input type="number" value={gap} min="0" step="0.01" onChange={e=>setGap(e.target.value)}/></label><label>Marge des 4 côtés (cm)<input type="number" value={margin} min="0" step="0.01" onChange={e=>setMargin(e.target.value)}/></label></div>
   </section>
   <section className="card"><div className="sectionHead"><div><h3>Designs</h3><small>DIMENSIONS ET QUANTITÉS</small></div><button className="secondaryBtn" onClick={add}>+ Ajouter</button></div>
    <div className="filmTableWrap"><table className="filmTable"><thead><tr><th>Nom</th><th>Largeur</th><th>Hauteur</th><th>Qté</th><th>Rotation</th><th>Groupe</th><th></th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><input value={r.name} onChange={e=>update(r.id,'name',e.target.value)}/></td><td><input type="number" value={r.w} onChange={e=>update(r.id,'w',e.target.value)}/></td><td><input type="number" value={r.h} onChange={e=>update(r.id,'h',e.target.value)}/></td><td><input type="number" min="1" value={r.qty} onChange={e=>update(r.id,'qty',e.target.value)}/></td><td><input type="checkbox" checked={r.rotate} onChange={e=>update(r.id,'rotate',e.target.checked)}/></td><td><input value={r.group} onChange={e=>update(r.id,'group',e.target.value)}/></td><td><button className="filmDelete" onClick={()=>remove(r.id)}>×</button></td></tr>)}</tbody></table></div>
   </section>
   <section className="card filmCalcAction"><button className="primary actionRed" onClick={calculate}>Calculer et organiser le Film</button>{error&&<div className="error">{error}</div>}</section>
   {result&&<section className="card"><div className="sectionHead"><div><h3>Résultat</h3><small>CONSOMMATION ESTIMÉE</small></div></div><div className="filmStats"><div><small>Longueur Film</small><b>{result.totalH.toFixed(2)} cm</b></div><div><small>Consommation</small><b>{result.meters.toFixed(3)} m</b></div><div><small>Surface</small><b>{result.area.toFixed(4)} m²</b></div><div><small>Designs</small><b>{result.count}</b></div><div><small>Films</small><b>{result.films.length}</b></div></div></section>}
   {result&&<section className="card"><div className="sectionHead"><div><h3>Film Map</h3><small>APERÇU DU PLACEMENT</small></div></div><div className="filmPreview">{result.films.map(f=><div className="filmBlock" key={f.number}><strong>Film {f.number} — {f.filmH.toFixed(2)} cm</strong><div className="filmCanvas" style={{width:'100%',aspectRatio:filmW+'/'+Math.max(f.filmH,1)}}>{f.items.map((x,i)=><div key={i} className="filmItem" style={{left:((margin+x.x)/filmW*100)+'%',top:((margin+x.y)/Math.max(f.filmH,1)*100)+'%',width:(x.w/filmW*100)+'%',height:(x.h/Math.max(f.filmH,1)*100)+'%'}}>{x.name}<small>{x.w.toFixed(1)} × {x.h.toFixed(1)}{x.r?' ↻':''}</small></div>)}</div></div>)}</div></section>}
  </div>
 </div>;
}
