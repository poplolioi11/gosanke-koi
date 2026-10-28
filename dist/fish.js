/** Spatial Gosanke carp, painted into the caller's shared character mask. */
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const V=(x=0,y=0,z=0)=>({x,y,z});
const add=(a,b)=>V(a.x+b.x,a.y+b.y,a.z+b.z);
const mul=(a,k)=>V(a.x*k,a.y*k,a.z*k);
const mean=points=>mul(points.reduce((a,p)=>add(a,p),V()),1/points.length);
const rgb=(c,alpha=1)=>`rgba(${c.map(v=>Math.round(clamp(v,0,255))).join(',')},${clamp(alpha,0,1)})`;
const PIGMENTS={white:[222,225,211],red:[202,57,39],black:[36,48,53]};
function island(s,l,cx,cy,rx,ry,phase=0){
 const ds=(s-cx+.009*Math.sin(l*8+phase)+.004*Math.sin(l*21-phase))/rx;
 const dl=(l-cy+.055*Math.sin(s*37+phase))/ry;
 return ds*ds+dl*dl<1+.065*Math.sin(s*57+l*9+phase);
}
/** Anatomy-anchored skin pigment; s is head-to-tail and lateral is -1..1. */
export function patternAt(kind,s,lateral=0){
 const l=clamp(lateral,-1,1);s=clamp(s,0,1);
 if(kind==='showa'){
  if(island(s,l,.105,.35,.083,.60,2)||island(s,l,.435,-.25,.123,.74,5)||island(s,l,.745,.42,.103,.70,7))return 'red';
  if(island(s,l,.135,-.55,.116,.43,4)||island(s,l,.34,.60,.116,.52,7)||island(s,l,.62,-.43,.114,.56,1)||island(s,l,.885,.12,.064,.78,3))return 'white';
  return 'black';
 }
 // Kohaku has no sumi. Sanke sumi stays on the body, leaving a clean head.
 if(kind==='sanke'&&s>.20&&(island(s,l,.295,.48,.043,.48,1)||island(s,l,.46,-.40,.047,.44,3)||island(s,l,.655,.26,.046,.48,7)||island(s,l,.82,-.37,.039,.52,9)))return 'black';
 const offset=kind==='sanke'?.018:0;
 if(island(s,l,.104,-.04,.077,.91,2)||island(s,l,.315+offset,-.18,.118,.97,4)||island(s,l,.59-offset,.24,.120,.88,7)||island(s,l,.813,.03,.068,.83,9))return 'red';
 return 'white';
}
function skinColor(kind,s,lateral,normal=V(0,0,-1)){
 const pigment=patternAt(kind,s,lateral),base=PIGMENTS[pigment];
 const front=clamp(-normal.z,0,1),shade=.67+.28*front+.07*clamp(-normal.y,0,1);
 const rim=Math.pow(1-front,2.5),lift=pigment==='black'?17*rim:6*rim;
 return base.map((v,k)=>v*shade+lift*[.61,.90,1.05][k]);
}
function nodeAt(fish,s){return fish.nodes[Math.round(clamp(s,0,1)*(fish.nodes.length-1))];}
function at(n,f=0,s=0,u=0){return add(n,add(mul(n.forward,f),add(mul(n.side,s),mul(n.up,u))));}
function surface(n,lateral,forward=0){const side=clamp(lateral,-.98,.98);return at(n,forward,n.r*side,n.r*.73*Math.sqrt(1-side*side));}
function valid(p){return Number.isFinite(p.x)&&Number.isFinite(p.y);}

/** All primitives use CSS coordinates after project(); caller supplies mask scaling. */
export function drawFish(ctx,fish,project,time=0){
 if(!ctx||!fish?.nodes?.length||typeof project!=='function')return;
 const L=fish.length,R=fish.girth,phase=fish.phase||0,kind=fish.kind||'kohaku',objects=[];
 let serial=0;
 const projectSafe=p=>{const q=project(p);return q&&valid(q)?q:null;};
 const depth=p=>project(p).depth;
 const facing=(point,normal)=>depth(add(point,normal))-depth(add(point,mul(normal,-1)))>-.0000001;
 const insert=(kind,points,data={})=>{if(!points.length)return;const z=depth(mean(points));if(Number.isFinite(z))objects.push({kind,points,z,serial:serial++,...data});};
 const polygon=(points,fill,alpha=1)=>insert('polygon',points,{fill,alpha});
 const line=(points,stroke,width,alpha=1)=>insert('line',points,{stroke,width,alpha});
 const ellipsoid=(center,axes,radii,fill,alpha=1)=>insert('ellipsoid',[center],{axes,radii,fill,alpha});
 const curve=(points,stroke,width,alpha=1)=>{
  const vertices=[];for(let i=0;i<=12;i++){const t=i/12,a=1-t;vertices.push(V(...['x','y','z'].map(k=>a*a*a*points[0][k]+3*a*a*t*points[1][k]+3*a*t*t*points[2][k]+t*t*t*points[3][k])));}line(vertices,stroke,width,alpha);
 };
 const axes=n=>[n.forward,n.side,n.up];
 const fin=(n,side,size=1,pelvic=false)=>{
  const beat=Math.sin(time*1.48+phase+(side>0?.6:0)-(pelvic?1.1:0));
  const root=at(n,0,side*n.r*.70,-n.r*.12);
  const flap=(pelvic?.08:.22)*R*beat;
  const points=[root,at(n,-L*.025*size,side*R*(1.28*size+.32),flap),at(n,-L*.091*size,side*R*(1.64*size+.18),flap-R*.10),at(n,-L*.165*size,side*R*(1.37*size+.12),flap-R*.25),at(n,-L*.19*size,side*R*.80*size,flap-R*.13),at(n,-L*.08*size,side*n.r*.72,-n.r*.12)];
  const fill=kind==='showa'?[160,178,171]:[198,207,187];
  polygon(points,fill,pelvic?.30:.48);
  for(let j=1;j<=5;j++){
   const f=j/6,target=add(mul(points[1],1-f),mul(points[3],f));
   curve([root,add(mul(root,.65),mul(target,.35)),add(mul(root,.22),mul(target,.78)),target],[137,160,156],Math.max(.5,R*.022),.56);
  }
  if(kind==='showa'&&!pelvic){polygon([root,add(mul(root,.47),mul(points[1],.53)),add(mul(root,.43),mul(points[4],.57)),points[5]],[20,31,36],.83);}
  if(kind==='sanke'&&!pelvic){for(const j of [2,4]){const f=j/6,target=add(mul(points[1],1-f),mul(points[3],f));line([add(mul(root,.6),mul(target,.4)),target],[44,60,61],Math.max(.5,R*.023),.48);}}
 };
 // Fins lie below the shoulder and partly disappear behind the body.
 for(const side of [-1,1]){fin(nodeAt(fish,.21),side);fin(nodeAt(fish,.66),side,.58,true);}

 // A genuinely forked, translucent caudal fin. Its tips lag the tail peduncle.
 const tail=fish.nodes[fish.nodes.length-1],tailSway=Math.sin(time*2.43+phase-5.9)*.095;
 const tailPoint=(f,s,u=0)=>at(tail,f*L,s*R+tailSway*(-f)*L,u*R);
 const notch=tailPoint(-.135,0,.04),rootA=tailPoint(.012,.12),rootB=tailPoint(.012,-.12);
 const left=[rootA,tailPoint(-.095,1.04,.09),tailPoint(-.245,1.29,.02),tailPoint(-.215,.63,-.025),notch,tailPoint(-.02,0)];
 const right=[rootB,tailPoint(-.095,-1.04,-.09),tailPoint(-.245,-1.29,-.02),tailPoint(-.215,-.63,.025),notch,tailPoint(-.02,0)];
 for(const points of [left,right]){
  polygon(points,[184,200,186],.58);
  for(let j=0;j<5;j++){const p=add(mul(points[1],1-j/4),mul(points[2],j/4));curve([tailPoint(0,0),tailPoint(-.065,(points===left?1:-1)*(.2+j*.12)),add(mul(p,.8),mul(notch,.2)),p],[147,176,169],Math.max(.55,R*.025),.68);}
  line(points.slice(1,5),[205,218,200],Math.max(.5,R*.021),.36);
 }
 if(kind==='showa')polygon([rootA,rootB,tailPoint(-.065,-.42),tailPoint(-.086,0),tailPoint(-.065,.42)],[27,39,43],.82);

 // Backing silhouette closes subpixel joins between the colored surface tiles.
 const leftSide=fish.nodes.map(n=>at(n,0,n.r,0));
 const rightSide=[...fish.nodes].reverse().map(n=>at(n,0,-n.r,0));
 insert('polygon',[...leftSide,...rightSide],{fill:kind==='showa'?[31,43,46]:[116,133,127],alpha:1,z:depth(fish.position)-.022});
 const rings=14;
 for(let i=0;i<fish.nodes.length-1;i++){
  const a=fish.nodes[i],b=fish.nodes[i+1],s=(a.s+b.s)*.5;
  for(let j=0;j<rings;j++){
   const angle0=j/rings*TAU,angle1=(j+1)/rings*TAU,mid=(angle0+angle1)*.5;
   const normal=add(mul(a.side,Math.cos(mid)),mul(a.up,Math.sin(mid)));
   if(!facing(a,normal))continue;
   const ring=(n,angle)=>at(n,0,n.r*Math.cos(angle),n.r*.73*Math.sin(angle));
   const points=[ring(a,angle0),ring(a,angle1),ring(b,angle1),ring(b,angle0)];
   polygon(points,skinColor(kind,s,Math.cos(mid),normal));
  }
 }

 // Dorsal sail and individual rays are tied to the curved back, not the screen.
 const dorsal=[];
 for(const s of [.29,.35,.43,.52,.61,.70]){
  const n=nodeAt(fish,s),rise=Math.sin((s-.29)/.41*Math.PI)*R*.54;
  dorsal.push(at(n,0,Math.sin(time*1.05+phase-s*3)*R*.055,n.r*.71+rise));
 }
 const dorsalBase=[...dorsal].reverse().map((p,j)=>{const n=nodeAt(fish,[.70,.61,.52,.43,.35,.29][j]);return at(n,0,0,n.r*.67);});
 polygon([...dorsal,...dorsalBase],kind==='showa'?[101,132,130]:[189,204,181],.39);
 for(let i=1;i<dorsal.length-1;i++)line([dorsalBase[dorsal.length-1-i],dorsal[i]],[126,153,143],Math.max(.6,R*.018),.66);

 // Sparse staggered scale crescents support the character texture.
 for(let i=12;i<fish.nodes.length-5;i+=4){
  const n=fish.nodes[i],stagger=(i/4)%2?.08:-.08;
  for(const side of [-.68,-.32,.04,.40,.73]){
   const l=clamp(side+stagger,-.86,.86),normal=add(mul(n.side,l),mul(n.up,Math.sqrt(1-l*l)));
   if(!facing(n,normal))continue;
   const p=surface(n,l),c=skinColor(kind,n.s,l,normal),stroke=c.map(v=>v*.58);
   curve([at({...n,x:p.x,y:p.y,z:p.z},L*.018,-R*.085,0),at({...n,x:p.x,y:p.y,z:p.z},0,-R*.105,R*.008),at({...n,x:p.x,y:p.y,z:p.z},-L*.021,0,R*.012),at({...n,x:p.x,y:p.y,z:p.z},L*.003,R*.09,0)],stroke,Math.max(.5,R*.020),.43);
  }
 }

 // The blunt nose, lips, eyes and opercula keep a carp silhouette at small size.
 const head=nodeAt(fish,.075),nose=fish.nodes[0],headPigment=skinColor(kind,.075,0);
 ellipsoid(at(nose,L*.008,0,R*.08),axes(nose),[L*.023,R*.43,R*.29],kind==='showa'?[111,127,118]:[218,221,201]);
 ellipsoid(at(nose,L*.025,0,R*.095),axes(nose),[L*.007,R*.29,R*.135],[100,121,112],.64);
 curve([at(nose,L*.029,-R*.27,R*.12),at(nose,L*.033,-R*.11,R*.07),at(nose,L*.033,R*.11,R*.07),at(nose,L*.029,R*.27,R*.12)],[44,67,65],Math.max(.6,R*.027),.76);
 for(const side of [-1,1]){
  const eyeNormal=add(mul(head.side,side*.64),mul(head.up,.76));
  if(facing(head,eyeNormal)){
   const eye=at(head,L*.009,side*head.r*.78,head.r*.55);
   ellipsoid(eye,axes(head),[L*.022,R*.15,R*.16],[46,65,61]);
   const iris=add(eye,mul(eyeNormal,R*.032));
   ellipsoid(iris,axes(head),[L*.016,R*.104,R*.113],[185,179,133]);
   ellipsoid(add(iris,mul(eyeNormal,R*.032)),axes(head),[L*.009,R*.066,R*.071],[9,18,19]);
   ellipsoid(at({...head,x:iris.x,y:iris.y,z:iris.z},L*.005,-side*R*.026,R*.070),axes(head),[L*.0035,R*.026,R*.027],[229,237,215],.85);
  }
  const gill=nodeAt(fish,.172),n0=surface(gill,side*.06),n1=surface(gill,side*.56),n2=surface(gill,side*.91);
  curve([at({...gill,x:n0.x,y:n0.y,z:n0.z},-L*.013,0,0),at({...gill,x:n1.x,y:n1.y,z:n1.z},-L*.026,0,0),at({...gill,x:n2.x,y:n2.y,z:n2.z},L*.002,0,0),at(gill,L*.021,side*gill.r*.98,-gill.r*.055)],kind==='showa'?[93,117,111]:headPigment.map(v=>v*.55),Math.max(.65,R*.036),.72);
  // Only a short pair of lip barbels, far shorter than a dragon's whiskers.
  curve([at(nose,L*.018,side*R*.33,R*.10),at(nose,L*.020,side*R*.52,R*.10),at(nose,-L*.018,side*R*.67,R*.03),at(nose,-L*.035,side*R*.56,-R*.025)],[158,181,161],Math.max(.45,R*.022),.68);
 }

 objects.sort((a,b)=>a.z-b.z||a.serial-b.serial);
 ctx.save();const inherited=ctx.globalAlpha;
 try{
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const object of objects){
   ctx.globalAlpha=inherited*clamp(fish.opacity??1,0,1)*(object.alpha??1);
   if(object.kind==='ellipsoid'){
    const p=projectSafe(object.points[0]);if(!p)continue;
    let xx=0,xy=0,yy=0;
    for(let i=0;i<3;i++){
     const d=mul(object.axes[i],object.radii[i]),a=projectSafe(add(object.points[0],d)),b=projectSafe(add(object.points[0],mul(d,-1)));if(!a||!b)continue;
     const x=(a.x-b.x)*.5,y=(a.y-b.y)*.5;xx+=x*x;xy+=x*y;yy+=y*y;
    }
    const root=Math.sqrt(Math.max(0,(xx-yy)*(xx-yy)+4*xy*xy)),rx=Math.sqrt(Math.max(.16,(xx+yy+root)*.5)),ry=Math.sqrt(Math.max(.16,(xx+yy-root)*.5));
    ctx.fillStyle=rgb(object.fill);ctx.beginPath();ctx.ellipse(p.x,p.y,rx,ry,.5*Math.atan2(2*xy,xx-yy),0,TAU);ctx.fill();continue;
   }
   const points=object.points.map(projectSafe);if(points.some(p=>!p))continue;
   ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let j=1;j<points.length;j++)ctx.lineTo(points[j].x,points[j].y);
   if(object.kind==='line'){ctx.strokeStyle=rgb(object.stroke);ctx.lineWidth=object.width;ctx.stroke();}
   else{ctx.closePath();ctx.fillStyle=rgb(object.fill);ctx.fill();}
  }
 }finally{ctx.restore();}
}
