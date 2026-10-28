import {KoiWorld} from './world.js?v=0.1.0';
import {drawFish} from './fish.js?v=0.1.0';
import {WaterField} from './water.js?v=0.1.0';
export class KoiScene{
 constructor(canvas,{width,height,dpr=1,seed=17}={}){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.mask=document.createElement('canvas');this.m=this.mask.getContext('2d',{willReadFrequently:true});
  this.world=new KoiWorld(seed);this.water=new WaterField(33);this.project=p=>this.world.project(p);this.time=0;this.samples=0;this.resize(width,height,dpr);
 }
 resize(width,height,dpr=1){
  this.width=Math.max(1,width);this.height=Math.max(1,height);this.dpr=Math.min(1.25,Math.max(1,dpr));
  this.canvas.width=Math.round(width*this.dpr);this.canvas.height=Math.round(height*this.dpr);this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
  this.cw=width<700?3.5:4.6;this.ch=width<700?5.5:7.1;this.cols=Math.ceil(width/this.cw);this.rows=Math.ceil(height/this.ch);this.mask.width=this.cols;this.mask.height=this.rows;
  this.world.resize(width,height);this.water.resize(width,height);
 }
 step(dt,time,pointer){this.time=time;this.world.step(dt,time,pointer);this.water.step(dt,time,this.world.fishes,this.project);}
 draw(time=this.time){
  const ctx=this.ctx,m=this.m,w=this.width,h=this.height;this.time=time;
  ctx.save();this.water.drawBack(ctx,time);ctx.restore();
  m.setTransform(1,0,0,1,0,0);m.clearRect(0,0,this.cols,this.rows);m.setTransform(1/this.cw,0,0,1/this.ch,0,0);
  const fishes=[...this.world.fishes].sort((a,b)=>this.project(a.position).depth-this.project(b.position).depth);
  for(const fish of fishes){if(fish.opacity<.01)continue;m.save();drawFish(m,fish,this.project,time);m.restore();}
  m.setTransform(1,0,0,1,0,0);const pixels=m.getImageData(0,0,this.cols,this.rows).data;
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`600 ${this.ch*1.14}px "SFMono-Regular",Menlo,Consolas,monospace`;
  const glyphs='.:=+ox%#@',fine='.,:';let samples=0;
  for(let y=0;y<this.rows;y++)for(let x=0;x<this.cols;x++){
   const k=(y*this.cols+x)*4,alpha=pixels[k+3]/255;if(alpha<.035)continue;
   const sx=(x+.5)*this.cw,sy=(y+.5)*this.ch,light=.96+.075*Math.sin(sx*.011+sy*.018-time*.23);
   const r=Math.min(255,Math.round(pixels[k]*light*1.10)),g=Math.min(255,Math.round(pixels[k+1]*light*1.10)),b=Math.min(255,Math.round(pixels[k+2]*(light+.025)*1.10));
   const brightness=(r*.25+g*.61+b*.14)/255,hash=((x*73856093)^(y*19349663))>>>0;
   const glyph=alpha<.35?fine[hash%fine.length]:glyphs[(hash+Math.floor(brightness*4))%glyphs.length];
   if(alpha>.6){ctx.fillStyle=`rgba(${Math.round(r*.35)},${Math.round(g*.35)},${Math.round(b*.35)},${alpha*.30})`;ctx.fillRect(x*this.cw+.4,y*this.ch+.5,this.cw-.8,this.ch-1);}
   ctx.fillStyle=`rgba(${r},${g},${b},${Math.min(1,alpha*.96)})`;ctx.fillText(glyph,sx,sy);samples++;
  }
  this.samples=samples;ctx.save();this.water.drawFront(ctx,time);ctx.restore();
  const edge=ctx.createRadialGradient(w*.5,h*.48,Math.min(w,h)*.25,w*.5,h*.5,Math.max(w,h)*.73);edge.addColorStop(0,'rgba(0,4,8,0)');edge.addColorStop(1,'rgba(0,4,8,.34)');ctx.fillStyle=edge;ctx.fillRect(0,0,w,h);
 }
 get pixelBytes(){return(this.canvas.width*this.canvas.height+this.mask.width*this.mask.height)*4;}
}
