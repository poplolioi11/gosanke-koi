import {KoiScene} from './scene.js?v=0.1.0';
const canvas=document.getElementById('pond'),MAX_FPS=24,INTERVAL=1000/MAX_FPS;
const scene=new KoiScene(canvas,{width:innerWidth,height:innerHeight,dpr:devicePixelRatio||1});
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),pointer={x:0,y:0,active:false};
let visible=!document.hidden,paused=reduced.matches,raf=0,last=0,nextFrame=0,pending=0,time=0,frameCount=0;
canvas.dataset.targetFps=String(MAX_FPS);canvas.dataset.fishCount='3';
function draw(){const started=performance.now();scene.draw(time);canvas.dataset.renderMs=(performance.now()-started).toFixed(2);frameCount++;canvas.dataset.frameCount=String(frameCount);canvas.dataset.pixelBytes=String(scene.pixelBytes);}
function frame(now){
 raf=0;if(!visible||paused)return;
 if(last)pending+=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
 if(now+.01>=nextFrame){
  let remaining=pending;pending=0;while(remaining>1e-7){const dt=Math.min(1/30,remaining);time+=dt;scene.step(dt,time,pointer);remaining-=dt;}
  draw();if(!nextFrame)nextFrame=now;do{nextFrame+=INTERVAL;}while(nextFrame<=now);
 }
 raf=requestAnimationFrame(frame);
}
function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;pending=0;nextFrame=0;}
function start(){if(!raf&&visible&&!paused){last=0;nextFrame=0;raf=requestAnimationFrame(frame);}}
function resize(){scene.resize(innerWidth,innerHeight,devicePixelRatio||1);draw();}
canvas.addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;});canvas.addEventListener('pointerleave',()=>{pointer.active=false;});
canvas.addEventListener('pointerdown',e=>{pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;});canvas.addEventListener('pointerup',e=>{if(e.pointerType==='touch')pointer.active=false;});
document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(visible)start();else stop();});
reduced.addEventListener('change',()=>{paused=reduced.matches;if(paused)stop();else start();});addEventListener('resize',resize);
draw();start();
