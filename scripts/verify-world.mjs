import assert from 'node:assert/strict';
import {KoiWorld} from '../dist/world.js';
const results=[];
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
for(const [w,h] of [[1280,720],[390,844],[1920,1080]]){
 const world=new KoiWorld(17);world.resize(w,h);assert.equal(world.fishes.length,3);assert.deepEqual(world.fishes.map(f=>f.kind).sort(),['kohaku','sanke','showa']);let minVisible=3,maxStep=0,emptyFrames=0,maxEmptyFrames=0;let previous=world.fishes.map(f=>({...f.position}));
 for(let i=0;i<600*24;i++){
  world.step(1/24,i/24,{active:false});let visible=0;
  for(const [j,f] of world.fishes.entries()){
   assert.ok([f.position.x,f.position.y,f.position.z,f.length,f.girth,f.opacity,f.speed,f.heading,f.pitch,f.roll].every(Number.isFinite));
   assert.equal(f.nodes.length,56);assert.ok(f.opacity>=0&&f.opacity<=1);
   maxStep=Math.max(maxStep,Math.hypot(f.position.x-previous[j].x,f.position.y-previous[j].y,f.position.z-previous[j].z));previous[j]={...f.position};
   if(f.nodes.some(n=>{const p=world.project(n);return p.x+n.r*p.scale*1.8>=0&&p.x-n.r*p.scale*1.8<=w&&p.y+n.r*p.scale*1.8>=0&&p.y-n.r*p.scale*1.8<=h&&f.opacity>.05;}))visible++;
   if(i%24===0)for(const n of f.nodes){
    const p=world.project(n);assert.ok([n.x,n.y,n.z,n.r,p.x,p.y,p.scale,p.depth].every(Number.isFinite));assert.ok(n.r>0);
    for(const v of [n.forward,n.side,n.up])assert.ok(Math.abs(Math.hypot(v.x,v.y,v.z)-1)<1e-5);
    assert.ok(Math.abs(dot(n.forward,n.side))<1e-5);assert.ok(Math.abs(dot(n.forward,n.up))<1e-5);assert.ok(Math.abs(dot(n.side,n.up))<1e-5);
   }
  }minVisible=Math.min(minVisible,visible);emptyFrames=visible?0:emptyFrames+1;maxEmptyFrames=Math.max(maxEmptyFrames,emptyFrames);
 }
 assert.ok(maxEmptyFrames/24<=5,'All fish must not stay away for more than five seconds');assert.ok(maxStep<3);
 world.resize(h,w);world.step(1/24,601);world.resize(w,h);world.step(1/24,602);assert.ok(world.fishes.every(f=>f.nodes.every(n=>Number.isFinite(world.project(n).x))));results.push({width:w,height:h,seconds:600,minVisible,maxEmptySeconds:maxEmptyFrames/24,maxStep});
}
console.log(JSON.stringify({passed:true,results},null,2));
