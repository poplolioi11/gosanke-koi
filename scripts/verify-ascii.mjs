import assert from 'node:assert/strict';
import {KoiScene} from '../dist/scene.js';

// Inspect the visible canvas contract. Fish paths stay in the sampling mask;
// only printable ASCII glyphs and two full background washes reach the view.
let glyphs=0,backgroundFills=0;
function context(visible=false){
 const state={globalAlpha:1},noop=()=>{};
 return new Proxy(state,{
  get(target,key){
   if(key in target)return target[key];
   if(key==='createRadialGradient'||key==='createLinearGradient')return()=>({addColorStop:noop});
   if(key==='getImageData')return(x,y,w,h)=>{const data=new Uint8ClampedArray(w*h*4);data.fill(180);for(let i=3;i<data.length;i+=4)data[i]=255;return{data};};
   if(key==='fillText')return(text,x,y)=>{if(!visible)return;assert.match(text,/^[\x20-\x7e]+$/);assert.ok(Number.isFinite(x)&&Number.isFinite(y));glyphs++;};
   if(key==='fillRect')return()=>{if(visible)backgroundFills++;};
   if(visible&&['stroke','fill','drawImage'].includes(key))return()=>{assert.fail(`Visible ${String(key)} bypasses ASCII rendering`);};
   return noop;
  },
  set(target,key,value){target[key]=value;return true;}
 });
}
const main=context(true),mask=context();
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>mask})};
const scene=new KoiScene({width:1,height:1,getContext:()=>main},{width:390,height:844,dpr:1});
scene.water.emit(0);scene.step(1/60,1,{active:false});scene.draw(1);
assert.ok(glyphs>1000);assert.equal(backgroundFills,2);
console.log(JSON.stringify({passed:true,visibleGlyphCalls:glyphs,printableAsciiOnly:true,subjectPathOrImageCalls:0,backgroundFills},null,2));
