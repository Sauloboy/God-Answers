(function(g){
 'use strict';
 const cache=new Map(),pending=new Map();
 function register(book,records){cache.set(book,records);}
 function load(book){
  if(cache.has(book))return Promise.resolve(cache.get(book));
  if(pending.has(book))return pending.get(book);
  if(!Number.isInteger(book)||book<0||book>65)return Promise.resolve({});
  const task=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='crossrefs/'+book+'.js';script.onload=()=>{script.remove();pending.delete(book);cache.has(book)?resolve(cache.get(book)):reject(Error('Cross references missing'));};script.onerror=()=>{script.remove();pending.delete(book);reject(Error('Cross references unavailable'));};document.head.appendChild(script);});pending.set(book,task);return task;
 }
 async function get({b,c,start,end}){
  const records=await load(b),found=new Map();
  for(let v=start;v<=end;v++)for(const row of records[c+'_'+v]||[]){
   const [tb,tc,tv,eb,ec,ev,score]=row;
   if(tb===b&&eb===b&&tc===c&&ec===c&&tv>=start&&ev<=end)continue;
   const id=row.slice(0,6).join('_'),old=found.get(id);
   if(old){old.score=Math.max(old.score,score);if(!old.from.includes(v))old.from.push(v);}
   else found.set(id,{target:[tb,tc,tv,eb,ec,ev],score,from:[v]});
  }
  return [...found.values()].sort((a,b)=>b.score-a.score||b.from.length-a.from.length||a.target.join('_').localeCompare(b.target.join('_')));
 }
 let positions;
 function passage(target,limit=40){
  if(!Array.isArray(target)||target.length!==6||!target.every(Number.isInteger))return null;
  if(!positions)positions=new Map(g.SELAH_BIBLE.verses.map((v,i)=>[v.slice(0,3).join('_'),i]));
  const [b,c,v,eb,ec,ev]=target,first=positions.get([b,c,v].join('_')),last=positions.get([eb,ec,ev].join('_'));
  if(first===undefined||last===undefined||last<first)return null;
  const books=g.SELAH_BIBLE.books;
  const ref=books[b]+' '+c+':'+v+(first===last?'':b!==eb?' – '+books[eb]+' '+ec+':'+ev:c!==ec?'–'+ec+':'+ev:'–'+ev);
  return {ref,b,c,start:v,end:eb===b&&ec===c?ev:g.SELAH_BIBLE.chapters.find(r=>r[0]===b&&r[1]===c)[3],verses:g.SELAH_BIBLE.verses.slice(first,Math.min(last+1,first+limit)),total:last-first+1,target};
 }
 g.GodCrossrefs={register,load,get,passage};
})(window);
