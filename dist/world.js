/** Three slow, spatial carp. Coordinates are camera-centred; +z is farther. */
const COUNT=56,TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const v=(x=0,y=0,z=0)=>({x,y,z});
const sub=(a,b)=>v(a.x-b.x,a.y-b.y,a.z-b.z);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>v(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const length=a=>Math.hypot(a.x,a.y,a.z);
const unit=(a,fallback=v(1,0,0))=>{const n=length(a);return n>1e-9?v(a.x/n,a.y/n,a.z/n):{...fallback};};
const delta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
function basis(forward,roll=0){
 const F=unit(forward),d=dot(v(0,0,-1),F);
 const U=unit(v(-F.x*d,-F.y*d,-1-F.z*d),v(0,0,-1));
 const S=unit(cross(F,U),v(0,1,0)),c=Math.cos(roll),s=Math.sin(roll);
 return {forward:F,side:v(S.x*c+U.x*s,S.y*c+U.y*s,S.z*c+U.z*s),up:v(U.x*c-S.x*s,U.y*c-S.y*s,U.z*c-S.z*s)};
}
export class KoiWorld {
 constructor(seed=17){this.seed=seed>>>0;this.width=0;this.height=0;this.focal=900;this.time=0;this.fishes=[];this.project=point=>this.projectPoint(point);}
 random(){this.seed+=0x6d2b79f5;let n=this.seed;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return ((n^(n>>>14))>>>0)/4294967296;}
 dimensions(size){const mobile=this.width<700,L=(mobile?clamp(this.width*.43,140,190):clamp(Math.min(this.width,this.height)*.40,240,335))*size;return {length:L,girth:L*.125,cruise:(mobile?18:26)*(0.94+size*.06)};}
 resize(width,height){
  width=Math.max(1,Number(width)||1);height=Math.max(1,Number(height)||1);const oldW=this.width,oldH=this.height,oldF=this.focal;
  this.width=width;this.height=height;this.focal=Math.max(650,Math.min(width,height)*1.45);
  if(!this.fishes.length){
   // Initial poses leave room for the complete tail and pectoral fins.
   const specs=width<700
    ?[['kohaku',1.0,.20,-.22,1.10,.04],['sanke',1.07,-.22,0,3.24,.20],['showa',.94,.10,.22,-.80,.11]]
    :[['kohaku',1.0,-.17,-.23,-.06,.04],['sanke',1.07,.15,-.015,3.36,.20],['showa',.94,-.13,.10,-.78,.11]];
   this.fishes=specs.map(([kind,size,x,y,heading,z],id)=>{
    const f={id,kind,size,...this.dimensions(size),opacity:1,phase:id*2.17+.35,position:v(x*width,y*height,z*this.focal),speed:0,heading,pitch:0,roll:0,turn:0,pitchRate:0,rollRate:0,waypoint:null,nextTargetAt:0,nodes:[],history:[],lastRecord:null};
    f.speed=f.cruise*.80;for(let i=0;i<COUNT;i++)f.nodes.push({x:0,y:0,z:0,s:i/(COUNT-1),r:0,forward:v(1,0,0),side:v(0,1,0),up:v(0,0,-1)});
    this.seedTrail(f);this.chooseTarget(f,true);this.sample(f);return f;
   });return;
  }
  const sx=width/oldW,sy=height/oldH,sz=this.focal/oldF;
  const scale=p=>{if(p){p.x*=sx;p.y*=sy;p.z*=sz;}};
  for(const f of this.fishes){scale(f.position);scale(f.waypoint);scale(f.lastRecord);for(const p of f.history)scale(p);f.heading=Math.atan2(Math.sin(f.heading)*sy,Math.cos(f.heading)*sx);Object.assign(f,this.dimensions(f.size));this.sample(f);}
 }
 projectPoint(point){const scale=this.focal/Math.max(this.focal*.46,this.focal+point.z);return {x:this.width*.5+point.x*scale,y:this.height*.5+point.y*scale,scale,depth:scale};}
 seedTrail(f){
  const F=v(Math.cos(f.heading),Math.sin(f.heading),0),step=Math.max(1.2,f.girth*.07);
  for(let d=0;d<f.length*1.8;d+=step)f.history.push(v(f.position.x-F.x*d,f.position.y-F.y*d,f.position.z));f.lastRecord={...f.position};
 }
 chooseTarget(f,initial=false){
  const p=f.position,anchor=Math.floor(this.time/90)%3===f.id;
  const outside=Math.abs(p.x)>this.width*.64||Math.abs(p.y)>this.height*.65;
  if(initial){const a=f.heading+(f.id-1)*.18;f.waypoint=v(p.x+Math.cos(a)*f.length*1.6,p.y+Math.sin(a)*f.length*1.6,this.focal*(.08+f.id*.07));}
  else if(outside||anchor||this.random()<.32){
   const angle=this.random()*TAU;f.waypoint=v(Math.cos(angle)*this.width*(anchor?.28:.43),Math.sin(angle)*this.height*(anchor?.25:.39),this.focal*(-.12+this.random()*.45));
  }else{
   const a=f.heading+(this.random()-.5)*1.50,d=f.cruise*(21+this.random()*14);
   f.waypoint=v(p.x+Math.cos(a)*d,p.y+Math.sin(a)*d,this.focal*(-.10+this.random()*.43));
  }
  f.returning=outside;f.nextTargetAt=this.time+24+this.random()*18;
 }
 step(dt,time,pointer={active:false,x:0,y:0}){
  if(!this.width)return;dt=clamp(Number(dt)||0,0,.10);this.time=Number.isFinite(time)?time:this.time+dt;
  for(const f of this.fishes){if(dt>0)this.move(f,dt,pointer);this.sample(f);}
 }
 move(f,dt,pointer){
  const p=f.position,goal=f.waypoint,dist=Math.hypot(goal.x-p.x,goal.y-p.y);
  const outside=Math.abs(p.x)>this.width*.80||Math.abs(p.y)>this.height*.82;
  if(Math.abs(p.x)<this.width*.52&&Math.abs(p.y)<this.height*.53)f.returning=false;
  if(this.time>f.nextTargetAt||dist<f.length*.48||(outside&&!f.returning)){this.chooseTarget(f);}
  const target=f.waypoint;
  // Mild wind-like input changes the destination, never the current position.
  const wind=pointer.active?(pointer.y-this.height*.5)*.035:0;
  const desiredHeading=Math.atan2(target.y+wind-p.y,target.x-p.x);
  const targetTurn=clamp(delta(f.heading,desiredHeading)*.24,-.14,.14);
  f.turn+=clamp((targetTurn-f.turn)*.8,-.035,.035)*dt;f.turn=clamp(f.turn,-.14,.14);
  f.heading=Math.atan2(Math.sin(f.heading+f.turn*dt),Math.cos(f.heading+f.turn*dt));
  const horizontal=Math.max(260,Math.hypot(target.x-p.x,target.y-p.y));
  const pitchTarget=clamp(Math.atan2(target.z-p.z,horizontal),-.28,.28);
  f.pitchRate+=clamp(((pitchTarget-f.pitch)*.55-f.pitchRate)*.8,-.045,.045)*dt;f.pitchRate=clamp(f.pitchRate,-.12,.12);f.pitch=clamp(f.pitch+f.pitchRate*dt,-.32,.32);
  const rollTarget=clamp(-f.turn*.95+Math.sin(this.time*.24+f.phase)*.055,-.23,.23);
  f.rollRate+=clamp(((rollTarget-f.roll)*.7-f.rollRate)*1.0,-.08,.08)*dt;f.rollRate=clamp(f.rollRate,-.18,.18);f.roll=clamp(f.roll+f.rollRate*dt,-.30,.30);
  const speedTarget=f.cruise*(.85+.16*Math.sin(this.time*.16+f.phase)+.06*Math.sin(this.time*.057+f.phase));
  f.speed+=clamp((speedTarget-f.speed)*.45,-f.cruise*.12,f.cruise*.12)*dt;
  const horizontalSpeed=f.speed*Math.cos(f.pitch);
  p.x+=Math.cos(f.heading)*horizontalSpeed*dt;p.y+=Math.sin(f.heading)*horizontalSpeed*dt;p.z+=Math.sin(f.pitch)*f.speed*dt;
  f.opacity=1-smooth(this.focal*.24,this.focal*.48,p.z)*.16;
  const spacing=Math.max(1,f.girth*.065);
  if(length(sub(p,f.lastRecord))>=spacing){f.history.splice(1,0,{...p});f.lastRecord={...p};}
  f.history[0]={...p};
 }
 sample(f){
  const trail=f.history;let cursor=0,walked=0,a=trail[0],b=trail[1]||a,segment=length(sub(b,a));
  for(const n of f.nodes){
   const distance=n.s*f.length;
   while(walked+segment<distance&&cursor<trail.length-2){walked+=segment;cursor++;a=trail[cursor];b=trail[cursor+1];segment=length(sub(b,a));}
   const fraction=segment>1e-7?(distance-walked)/segment:0,F=unit(sub(a,b),v(Math.cos(f.heading),Math.sin(f.heading),0));
   const frame=basis(F,f.roll),s=n.s,amp=f.length*.052*Math.pow(s,2.65)*(0.76+f.speed/f.cruise*.24);
   const wave=Math.sin(this.time*(2.18+f.speed/f.cruise*.38)-s*5.1+f.phase)*amp;
   n.x=mix(a.x,b.x,fraction)+frame.side.x*wave;n.y=mix(a.y,b.y,fraction)+frame.side.y*wave;n.z=mix(a.z,b.z,fraction)+frame.side.z*wave;
   const radius=s<.20?mix(.45,1,smooth(0,.20,s)):mix(1,.12,Math.pow((s-.20)/.80,.88));n.r=f.girth*radius;
  }
  for(let i=0;i<COUNT;i++){
   const before=f.nodes[Math.max(0,i-1)],after=f.nodes[Math.min(COUNT-1,i+1)],n=f.nodes[i],frame=basis(sub(before,after),f.roll);
   n.forward=frame.forward;n.side=frame.side;n.up=frame.up;
  }
  // Preserve enough actual travel history for one body, plus a turn margin.
  if(cursor+5<trail.length)trail.length=Math.max(cursor+5,4);
 }
}
