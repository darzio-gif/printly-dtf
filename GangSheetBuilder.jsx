import React,{useMemo,useRef,useState} from 'react';
import './gang-sheet.css';
import { removeBackground, upscaleRealESRGAN, optimizeDTF } from './ai-image-tools.js';
async function fileData(file){return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const uid=()=>Math.random().toString(36).slice(2,9);

function packItems(items, sheetW, sheetH, gap, margin, allowRotate){
  const placed=[];
  let x=margin,y=margin,rowH=0;
  for(const item of items){
    for(let q=0;q<item.qty;q++){
      let w=Number(item.w)||10,h=Number(item.h)||10;
      let rotated=false;
      if(allowRotate && x+w>sheetW-margin && x+h<=sheetW-margin && w<=sheetH-margin*2){[w,h]=[h,w];rotated=true}
      if(x+w>sheetW-margin){x=margin;y+=rowH+gap;rowH=0}
      if(y+h>sheetH-margin)return {placed,overflow:item.name};
      placed.push({...item,instanceId:uid(),x,y,w,h,rotated});
      x+=w+gap;rowH=Math.max(rowH,h);
    }
  }
  return {placed,overflow:null};
}

export default function GangSheetBuilder(){
  const [sheetW]=useState(58);
  const [sheetH,setSheetH]=useState(100);
  const [gap,setGap]=useState(0.3);
  const [margin,setMargin]=useState(0.5);
  const [allowRotate,setAllowRotate]=useState(true);
  const [dpi]=useState(300);
  const [items,setItems]=useState([]);
  const [selected,setSelected]=useState(null);
  const [aiLoading,setAiLoading]=useState(false);
  const [aiProgress,setAiProgress]=useState(0);
  const [aiMessage,setAiMessage]=useState('');
  const fileRef=useRef(null);
  const canvasRef=useRef(null);
  const processingRef=useRef(false);

  const expanded=useMemo(()=>items.flatMap(x=>Array.from({length:Math.max(1,Number(x.qty)||1)},()=>x)),[items]);
  const result=useMemo(()=>packItems(items,sheetW,sheetH,gap,margin,allowRotate),[items,sheetW,sheetH,gap,margin,allowRotate]);
  const totalPieces=result.placed.length;
  const usedHeight=result.placed.length?Math.max(...result.placed.map(x=>x.y+x.h))+margin:0;
  const usedArea=result.placed.reduce((s,x)=>s+x.w*x.h,0);
  const utilization=sheetW*sheetH?Math.round((usedArea/(sheetW*sheetH))*100):0;

  function addFiles(list){
    Array.from(list||[]).filter(f=>f.type.startsWith('image/')).forEach(file=>{
      const url=URL.createObjectURL(file);
      const img=new Image();
      img.onload=()=>{
        const ratio=img.width/img.height||1;
        const h=clamp(10,3,40);
        const w=clamp(h*ratio,3,55);
        setItems(v=>[...v,{id:uid(),name:file.name.replace(/\.[^.]+$/,''),file,src:url,w:Number(w.toFixed(1)),h:Number(h.toFixed(1)),qty:1,originalW:img.width,originalH:img.height}]);
      };
      img.src=url;
    });
  }

  function update(id,key,value){setItems(v=>v.map(x=>x.id===id?{...x,[key]:key==='qty'?Math.max(1,Number(value)||1):Math.max(.1,Number(value)||.1)}:x));}
  function remove(id){setItems(v=>v.filter(x=>x.id!==id));if(selected===id)setSelected(null)}
  function clearAll(){items.forEach(x=>URL.revokeObjectURL(x.src));setItems([]);setSelected(null);setAiMessage('')}

  function drawCanvas(exportMode=false){
    const pxPerCm=exportMode?Math.max(10,Math.min(40,dpi/10)):8;
    const W=Math.round(sheetW*pxPerCm),H=Math.round(sheetH*pxPerCm);
    const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#d7d7d7';ctx.lineWidth=1;ctx.strokeRect(0,0,W-1,H-1);
    result.placed.forEach(p=>{
      const im=new Image();im.src=p.src;
      im.onload=()=>{
        ctx.save();ctx.translate((p.x+p.w/2)*pxPerCm,(p.y+p.h/2)*pxPerCm);
        if(p.rotated)ctx.rotate(Math.PI/2);
        ctx.drawImage(im,-p.w*pxPerCm/2,-p.h*pxPerCm/2,p.w*pxPerCm,p.h*pxPerCm);
        ctx.restore();
      };
    });
    return {canvas,W,H};
  }

  async function exportTiff(){if(!items.length){setAiMessage('Ajoutez au moins un design avant l’export.');return}setAiLoading(true);setAiProgress(8);setAiMessage('Préparation du TIFF CMYK 300 DPI…');try{const images={};for(let i=0;i<items.length;i++){const x=items[i];images[x.id]=await fileData(x.file);setAiProgress(15+Math.round((i+1)/items.length*45))}setAiProgress(70);const payload={width:58,height:sheetH,dpi:300,gap,margin,items:result.placed.map(p=>({id:p.id,x:p.x,y:p.y,w:p.w,h:p.h,rotated:p.rotated})),images};const r=await fetch('/api/gang-sheet-export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw new Error(await r.text());const blob=await r.blob(),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='printly-gang-sheet-58x'+sheetH+'cm-300dpi-CMYK.tiff';a.click();setAiProgress(100);setAiMessage('TIFF exported: CMYK · 300 DPI · 58 cm.')}catch(e){setAiMessage(e.message||'Export failed.')}finally{setAiLoading(false);setTimeout(()=>setAiProgress(0),700)}
  }
  async function processImage(id,kind){if(processingRef.current)return;const item=items.find(x=>x.id===id);if(!item)return;processingRef.current=true;setAiLoading(true);setAiProgress(7);try{setAiMessage(kind==='bg'?'BiRefNet: suppression du fond…':'Real-ESRGAN: upscale 4×…');const f=kind==='bg'?await removeBackground(item.file,m=>{setAiMessage(m);setAiProgress(p=>Math.min(92,p+2))}):await upscaleRealESRGAN(item.file,m=>{setAiMessage(m);setAiProgress(p=>Math.min(92,p+1))});setAiProgress(96);const z=await new Promise((res,rej)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>res({src:u,w:im.width,h:im.height});im.onerror=rej;im.src=u});setItems(v=>v.map(x=>x.id===id?{...x,file:new File([f],item.name+'-'+kind+'.png',{type:'image/png'}),src:z.src,originalW:z.w,originalH:z.h}:x));if(item.src&&item.src!==z.src)URL.revokeObjectURL(item.src);setAiProgress(100);setAiMessage(kind==='bg'?'BiRefNet: background removed.':'Real-ESRGAN: 4× upscale completed.')}catch(e){setAiMessage(e.message||'AI processing failed.')}finally{setAiLoading(false);processingRef.current=false;setTimeout(()=>setAiProgress(0),700)}}
  async function optimizeImage(id){if(processingRef.current)return;const item=items.find(x=>x.id===id);if(!item)return;processingRef.current=true;setAiLoading(true);setAiProgress(5);try{const f=await optimizeDTF(item.file,m=>{setAiMessage(m);setAiProgress(p=>Math.min(94,p+1.5))});setAiProgress(97);const z=await new Promise((res,rej)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>res({src:u,w:im.width,h:im.height});im.onerror=rej;im.src=u});setItems(v=>v.map(x=>x.id===id?{...x,file:new File([f],item.name+'-optimized-4k.png',{type:'image/png'}),src:z.src,originalW:z.w,originalH:z.h}:x));if(item.src&&item.src!==z.src)URL.revokeObjectURL(item.src);setAiProgress(100);setAiMessage('Optimisation DTF terminée · BiRefNet + Real-ESRGAN 4×.')}catch(e){setAiMessage(e.message||'Optimisation AI failed.')}finally{setAiLoading(false);processingRef.current=false;setTimeout(()=>setAiProgress(0),700)}}
  return <div className="gangPage">
    <div className="gangTop">
      <div><div className="gangEyebrow">PRINT PRODUCTION</div><h2>Gang Sheet Builder</h2><p>Composez automatiquement vos designs DTF sur un film optimisé.</p></div>
      <div className="gangActions"><button className="secondaryBtn" onClick={()=>fileRef.current?.click()}>+ Ajouter des designs</button><button className="primary actionRed" onClick={exportTiff} disabled={!items.length||aiLoading}>{aiLoading?'Export…':'Exporter TIFF CMYK'}</button></div>
      <input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={e=>{addFiles(e.target.files);e.target.value=''}}/>
    </div>

    <div className="gangStats">
      <div><span>Pièces</span><strong>{totalPieces}</strong></div>
      <div><span>Hauteur utilisée</span><strong>{usedHeight.toFixed(1)} cm</strong></div>
      <div><span>Surface utile</span><strong>{utilization}%</strong></div>
      <div><span>Film</span><strong>58 × {sheetH} cm</strong></div>
    </div>

    {aiMessage&&<div className={'aiNotice '+(aiLoading?'aiProcessing':'')}><span>{aiLoading?'◌':'✦'}</span><div className="aiNoticeBody"><b>{aiLoading?'Traitement en cours…':'AI'}</b><span>{aiMessage}</span>{aiLoading&&<><div className="aiProgressTrack"><div className="aiProgressBar" style={{width:`${Math.max(4,aiProgress)}%`}}></div></div><small>{Math.round(aiProgress)}% · Veuillez patienter, presque terminé…</small></>}</div></div>}

    <div className="gangLayout">
      <section className="gangPanel gangControls">
        <div className="panelTitle"><div><h3>Configuration</h3><small>FILM & ESPACEMENT</small></div></div>
        <div className="gangGrid">
          <label>Largeur du film (cm)<input type="number" min="10" max="200" step=".1" value={58} disabled/></label>
          <label>Longueur du film (cm)<input type="number" min="10" max="1000" step=".1" value={sheetH} onChange={e=>setSheetH(Number(e.target.value)||1)}/></label>
          <label>Espacement (cm)<input type="number" min="0" max="10" step=".1" value={gap} onChange={e=>setGap(Number(e.target.value)||0)}/></label>
          <label>Marge (cm)<input type="number" min="0" max="10" step=".1" value={margin} onChange={e=>setMargin(Number(e.target.value)||0)}/></label>
          <label>Export DPI<input value="300" disabled/></label>
        </div>
        <label className="toggleRow"><input type="checkbox" checked={allowRotate} onChange={e=>setAllowRotate(e.target.checked)}/><span>Rotation automatique</span><small>Utiliser l’espace restant intelligemment</small></label>

        <div className="panelTitle designsTitle"><div><h3>Designs</h3><small>{items.length} fichier(s)</small></div>{items.length>0&&<button className="textDanger" onClick={clearAll}>Tout supprimer</button>}</div>
        <div className="designList">
          {!items.length?<button className="dropzone" onClick={()=>fileRef.current?.click()}><b>Déposez vos designs ici</b><span>PNG, JPG ou WEBP · plusieurs fichiers acceptés</span><i>+</i></button>:
          items.map(x=><div className={'designRow '+(selected===x.id?'selected':'')} key={x.id} onClick={()=>setSelected(x.id)}>
            <img src={x.src} alt=""/>
            <div className="designInfo"><b title={x.name}>{x.name}</b><small>{x.w} × {x.h} cm</small></div>
            <input className="qtyInput" type="number" min="1" value={x.qty} onClick={e=>e.stopPropagation()} onChange={e=>update(x.id,'qty',e.target.value)}/>
            <div className="designAi"><button disabled={aiLoading} onClick={e=>{e.stopPropagation();processImage(x.id,'bg')}}>Remove BG</button><button disabled={aiLoading} onClick={e=>{e.stopPropagation();processImage(x.id,'up')}}>Real-ESRGAN 4×</button><button className="optimizeBtn" disabled={aiLoading} onClick={e=>{e.stopPropagation();optimizeImage(x.id)}}>Optimize DTF</button><button className="removeDesign" onClick={e=>{e.stopPropagation();remove(x.id)}}>×</button></div>
          </div>)}
        </div>
      </section>

      <section className="gangCanvasPanel">
        <div className="canvasToolbar"><div><b>Prévisualisation</b><span>Échelle automatique · fond transparent représenté en blanc</span></div><button onClick={()=>document.getElementById('gangPreview')?.scrollIntoView({behavior:'smooth'})}>Ajuster</button></div>
        <div className="gangPreview" id="gangPreview">
          <div className="filmSheet" style={{width:`${Math.min(100,sheetW*1.25)}%`,aspectRatio:`${sheetW}/${Math.max(sheetH,1)}`}}>
            {result.placed.map((p,i)=><div key={p.instanceId} className="placedDesign" style={{left:`${(p.x/sheetW)*100}%`,top:`${(p.y/sheetH)*100}%`,width:`${(p.w/sheetW)*100}%`,height:`${(p.h/sheetH)*100}%`,transform:p.rotated?'rotate(90deg)':'none'}}><img src={p.src} alt=""/><span>{i+1}</span></div>)}
            {!result.placed.length&&<div className="emptyFilm"><b>Gang Sheet vide</b><span>Ajoutez vos designs pour commencer</span></div>}
          </div>
        </div>
        {result.overflow&&<div className="overflowNotice">⚠️ Certains designs ne rentrent pas dans le film actuel. Augmentez la longueur ou réduisez les dimensions.</div>}
      </section>
    </div>
  </div>
}
