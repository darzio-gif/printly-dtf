import sharp from 'sharp';

const cmToPx=cm=>Math.round(Number(cm)*300/2.54);
const dataBuffer=data=>Buffer.from(String(data).split(',')[1]||'','base64');

export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).send('Method not allowed');
 try{
  const body=req.body||{},width=Number(body.width)||58,height=Number(body.height)||100;
  const W=cmToPx(width),H=cmToPx(height);
  if(W>10000||H>60000)return res.status(400).send('Gang sheet is too large for browser/server limits.');
  const images=body.images||{},items=body.items||[];
  const composites=[];
  for(const p of items){
   const src=images[p.id];if(!src)continue;
   let layer=sharp(dataBuffer(src)).rotate();
   const w=cmToPx(p.w),h=cmToPx(p.h);
   layer=layer.resize(p.rotated?h:w,p.rotated?w:h,{fit:'fill'});
   let buf=await layer.png().toBuffer();
   if(p.rotated)buf=await sharp(buf).rotate(90).png().toBuffer();
   composites.push({input:buf,left:cmToPx(p.x),top:cmToPx(p.y)});
  }
  const out=await sharp({create:{width:W,height:H,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite(composites)
    .toColourspace('cmyk')
    .tiff({compression:'lzw',xres:300,yres:300,bitdepth:8})
    .toBuffer();
  res.setHeader('Content-Type','image/tiff');res.setHeader('Content-Disposition','attachment; filename="printly-gang-sheet-CMYK.tiff"');res.status(200).send(out);
 }catch(e){console.error(e);res.status(500).send(e?.message||'TIFF export failed')}
}