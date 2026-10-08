import { pipeline, RawImage } from '@huggingface/transformers';
import * as ort from 'onnxruntime-web';

const BG_MODEL = 'jiabins0303/birefnet-lite-1024-webgpu';
const ESRGAN_MODEL = 'https://huggingface.co/CoderViking/realesr-general-x4v3-onnx/resolve/main/realesr-general-x4v3.onnx';
let bgPipePromise = null;
let srSessionPromise = null;

function imageBitmap(file){
  return createImageBitmap(file);
}

async function canvasFromFile(file){
  const bmp = await imageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width; canvas.height = bmp.height;
  canvas.getContext('2d').drawImage(bmp,0,0);
  bmp.close?.();
  return canvas;
}

async function loadBackgroundModel(progress){
  if(!bgPipePromise){
    bgPipePromise = (async()=>{
      progress?.('تحميل BiRefNet…');
      try {
        return await pipeline('image-segmentation', BG_MODEL, {device:'webgpu'});
      } catch {
        return await pipeline('image-segmentation', BG_MODEL, {device:'wasm'});
      }
    })();
  }
  return bgPipePromise;
}

export async function removeBackground(file, progress){
  const segmenter = await loadBackgroundModel(progress);
  const image = await RawImage.read(file);
  progress?.('تحليل الخلفية بـ BiRefNet…');
  const outputs = await segmenter(image);
  if(!outputs?.length) throw new Error('BiRefNet لم يرجع قناعاً.');
  const mask = outputs[0].mask;
  const src = await canvasFromFile(file);
  const ctx = src.getContext('2d');
  const pixels = ctx.getImageData(0,0,src.width,src.height);
  const alpha = mask.data;
  const mw = mask.width, mh = mask.height;
  if(mw!==src.width || mh!==src.height) throw new Error('حجم قناع BiRefNet غير متوافق.');
  for(let i=0;i<alpha.length;i++) pixels.data[i*4+3] = alpha[i];
  ctx.putImageData(pixels,0,0);
  return await new Promise(r=>src.toBlob(r,'image/png'));
}

async function loadSR(){
  if(!srSessionPromise){
    srSessionPromise = (async()=>{
      ort.env.logLevel='warning';
      if(ort.env.wasm) ort.env.wasm.numThreads = 1;
      try {
        return await ort.InferenceSession.create(ESRGAN_MODEL,{
          executionProviders:['webgpu','wasm'],
          graphOptimizationLevel:'all'
        });
      } catch {
        return await ort.InferenceSession.create(ESRGAN_MODEL,{
          executionProviders:['wasm'],
          graphOptimizationLevel:'all'
        });
      }
    })();
  }
  return srSessionPromise;
}

async function runTile(session, canvas, sx, sy, sw, sh){
  const c=document.createElement('canvas'); c.width=sw; c.height=sh;
  const cx=c.getContext('2d',{willReadFrequently:true});
  cx.drawImage(canvas,sx,sy,sw,sh,0,0,sw,sh);
  const data=cx.getImageData(0,0,sw,sh).data;
  const input=new Float32Array(3*sw*sh);
  for(let y=0;y<sh;y++) for(let x=0;x<sw;x++){
    const p=(y*sw+x)*4, q=y*sw+x;
    input[q]=data[p]/255; input[sw*sh+q]=data[p+1]/255; input[2*sw*sh+q]=data[p+2]/255;
  }
  const tensor=new ort.Tensor('float32',input,[1,3,sh,sw]);
  const out=await session.run({input:tensor});
  const t=out.output;
  const arr=await t.getData();
  const oh=sh*4, ow=sw*4, rgba=new Uint8ClampedArray(ow*oh*4);
  const plane=ow*oh;
  for(let y=0;y<oh;y++) for(let x=0;x<ow;x++){
    const q=y*ow+x, p=q*4;
    rgba[p]=Math.max(0,Math.min(255,arr[q]*255));
    rgba[p+1]=Math.max(0,Math.min(255,arr[plane+q]*255));
    rgba[p+2]=Math.max(0,Math.min(255,arr[plane*2+q]*255));
    rgba[p+3]=255;
  }
  tensor.dispose?.(); t.dispose?.();
  return {rgba,width:ow,height:oh};
}

async function resizeAlpha(alphaCanvas,w,h){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
  ctx.drawImage(alphaCanvas,0,0,w,h);
  return ctx.getImageData(0,0,w,h).data;
}

export async function upscaleRealESRGAN(file, progress){
  const session=await loadSR();
  progress?.('Préparation Real-ESRGAN 4×…');
  const src=await canvasFromFile(file);
  const W=src.width,H=src.height;
  const outW=W*4,outH=H*4;
  const output=document.createElement('canvas'); output.width=outW; output.height=outH;
  const octx=output.getContext('2d');
  const alpha=document.createElement('canvas'); alpha.width=W; alpha.height=H;
  alpha.getContext('2d').drawImage(src,0,0);
  const alpha4=await resizeAlpha(alpha,outW,outH);
  const tile=256, overlap=16, step=tile-overlap*2;
  let done=0,total=Math.ceil(W/step)*Math.ceil(H/step);
  for(let y=0;y<H;y+=step) for(let x=0;x<W;x+=step){
    const sx=Math.max(0,x-overlap), sy=Math.max(0,y-overlap);
    const ex=Math.min(W,x+tile+overlap), ey=Math.min(H,y+tile+overlap);
    const sw=ex-sx, sh=ey-sy;
    const result=await runTile(session,src,sx,sy,sw,sh);
    const left=(x-sx)*4, top=(y-sy)*4;
    const cw=Math.min(tile,W-x)*4, ch=Math.min(tile,H-y)*4;
    const tileCanvas=document.createElement('canvas'); tileCanvas.width=result.width; tileCanvas.height=result.height;
    tileCanvas.getContext('2d').putImageData(new ImageData(result.rgba,result.width,result.height),0,0);
    octx.drawImage(tileCanvas,left,top,cw,ch,x*4,y*4,cw,ch);
    done++; progress?.(`Real-ESRGAN 4×: ${done}/${total}`);
  }
  const final=octx.getImageData(0,0,outW,outH);
  for(let i=0;i<alpha4.length;i++) final.data[i*4+3]=alpha4[i*4];
  octx.putImageData(final,0,0);
  return await new Promise(r=>output.toBlob(r,'image/png'));
}

export async function optimizeDTF(file, progress){
  progress?.('1/2 · Remove Background');
  const noBg=await removeBackground(file,progress);
  progress?.('2/2 · Real-ESRGAN 4×');
  return await upscaleRealESRGAN(noBg,progress);
}
