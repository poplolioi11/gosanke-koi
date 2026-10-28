import assert from 'node:assert/strict';
import {patternAt} from '../dist/fish.js';
const results={};
for(const kind of ['kohaku','sanke','showa']){
 const counts={white:0,red:0,black:0};let headBlack=0;
 for(let i=0;i<=200;i++)for(let j=0;j<=100;j++){const s=i/200,l=j/50-1,c=patternAt(kind,s,l);assert.ok(c in counts);counts[c]++;if(s<=.2&&c==='black')headBlack++;}
 if(kind==='kohaku')assert.equal(counts.black,0);
 if(kind==='sanke'){assert.equal(headBlack,0);assert.ok(counts.black>0&&counts.red>0&&counts.white>0);}
 if(kind==='showa'){assert.ok(counts.black>results.sanke.counts.black);assert.ok(headBlack>0);}
 results[kind]={counts,headBlack};
}
console.log(JSON.stringify({passed:true,results},null,2));
