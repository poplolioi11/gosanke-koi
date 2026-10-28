import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .*\n/,'');const results=[];
for(const hz of [60,120]){
 let clock=0,queue=new Map(),id=0,draws=0,steps=0;const listeners={},mediaListeners={},media={matches:false,addEventListener:(n,f)=>{mediaListeners[n]=f;}};const canvas={dataset:{},addEventListener(){}};
 class Scene{constructor(){}resize(){}step(){steps++;}draw(){draws++;}get pixelBytes(){return 1;}}
 const doc={hidden:false,getElementById:()=>canvas,addEventListener:(n,f)=>{listeners[n]=f;}};
 const context={KoiScene:Scene,document:doc,matchMedia:()=>media,innerWidth:1280,innerHeight:720,devicePixelRatio:2,performance:{now:()=>clock},requestAnimationFrame:f=>{queue.set(++id,f);return id;},cancelAnimationFrame:n=>queue.delete(n),addEventListener(){}};
 vm.runInNewContext(source,context);
 for(let i=1;i<=hz*10;i++){clock=i*1000/hz;const callbacks=[...queue.values()];queue.clear();for(const f of callbacks)f(clock);}
 assert.ok(draws>=599&&draws<=602,`${hz}Hz renders ${draws}`);assert.ok(steps>0);assert.equal(canvas.dataset.targetFps,'60');assert.equal(canvas.dataset.renderMode,'ascii');
 doc.hidden=true;listeners.visibilitychange();const stopped=draws;assert.equal(queue.size,0);
 media.matches=true;mediaListeners.change();doc.hidden=false;listeners.visibilitychange();assert.equal(queue.size,0);assert.equal(draws,stopped);
 media.matches=false;mediaListeners.change();assert.equal(queue.size,1);
 results.push({displayHz:hz,seconds:10,drawsIncludingInitial:draws,hiddenPause:true,reducedMotionPause:true});
}
console.log(JSON.stringify({passed:true,results},null,2));
