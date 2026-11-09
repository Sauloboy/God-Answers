(function(g){
 'use strict';
 const normalize=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,' ').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
 const stop=new Set('a ad al allo alla agli alle ai anche che chi ci cio come con cosa da dal dallo dalla dalle dai degli dei del dello della delle di e ed era essere fa fare fra gli ha hai hanno ho i il in io la le lei li lo lui ma me mi mio mia miei mie nel nello nella nei nelle noi o per perche poi posso quale quali quanto questo questa questi queste qui quando se sei si sia siamo sono su sul sullo sulla sulle te ti tra tu tuo tua un una uno voi'.split(' '));
 const framing=new Set('biblico biblica biblici bibliche bibbia scrittura scritture versetto versetti passo passi brano brani testo testi parla parlano parlare dice dire dimmi mostrami trova trovare cercare cerca significato significa significano spiegami spiegare spiegazione raccontami capire intende intendere vuol vuole sapere detto cos'.split(' '));
 function stem(word){
  if(word.length>6){const suffix=word.match(/(?:avano|evano|ivano|ando|endo|ato|ata|ati|ate|uto|uta|uti|ute|ito|ita|iti|ite|ava|eva|iva)$/);if(suffix&&word.length-suffix[0].length>=3)return word.slice(0,-suffix[0].length);}
  if(word.length>5&&/(are|ere|ire)$/.test(word))return word.slice(0,-3);
  return word.length>3?word.replace(/[aeio]$/,''):word;
 }
 let configuration=g.GOD_SEARCH_LANGUAGE||{families:[],concepts:[]},families=new Map();
 for(const family of configuration.families||[]){const key=stem(normalize(family[0]));for(const word of family)families.set(stem(normalize(word)),key);}
 const canonical=w=>families.get(stem(w))||stem(w);
 function tokens(text,query=false){return normalize(text).split(' ').filter(w=>w.length>1&&!stop.has(w)&&(!query||!framing.has(w))).map(canonical);}
 const concepts=new Map((g.GOD_GLOSSARY?.entries||[]).map(e=>[e.id,{id:e.id,label:e.label,meaning:e.meaning,aliases:[e.label,...e.forms]}]));
 for(const item of configuration.concepts||[]){const old=concepts.get(item.id);concepts.set(item.id,{...old,...item,aliases:[...new Set([...(old?.aliases||[]),...item.aliases])]});}
 const allConcepts=[...concepts.values()];
 function plan(query){
  const normalized=normalize(query),personal=/\b(mi|sento|riesco|vorrei|voglio|ho|sto|sono|continuo|subisco)\b/.test(normalized.replace(/^(?:vorrei|voglio) (?:capire|sapere|conoscere) /,''));
  const definition=/^(?:(?:che cosa|cosa|che|chi) (?:e|sono|significa|vuol dire)|(?:che )?cos e|significato|spiegami|parlami di|che si intende|cosa si intende|differenza tra)/.test(normalized);
  const found=[];
  for(const c of allConcepts)for(const alias of [...c.aliases].sort((a,b)=>b.length-a.length)){const n=normalize(alias);if((' '+normalized+' ').includes(' '+n+' ')){found.push({concept:c,alias:n,span:n.length,compound:n.split(' ').length>1});break;}}
  found.sort((a,b)=>b.span-a.span);const hits=found.filter(x=>!found.some(y=>y!==x&&y.span>x.span&&y.alias.includes(x.alias)));
  const compound=hits.some(h=>h.compound),rawTerms=[...new Set(tokens(query,true))];
  const quotation=!/\b(mi|mio|mia|sento|riesco|ho|sto|sono|subisco)\b/.test(normalized)&&rawTerms.length>=2&&hits.length>=2;
  const specific=compound||definition||quotation||(!personal&&rawTerms.length>0&&rawTerms.length<=7);
  const groups=rawTerms.map(t=>new Set([t]));
  for(const {concept} of hits){
   const singles=concept.aliases.filter(a=>tokens(a).length===1).flatMap(a=>tokens(a));
   if(singles.length){for(const group of groups)if(singles.some(t=>group.has(t)))singles.forEach(t=>group.add(t));}
  }
  if(hits.some(h=>h.concept.id==='timore')&&compound){
   const divine=['dio','signore','eterno'].map(canonical);let group=groups.find(s=>divine.some(t=>s.has(t)));
   if(group){divine.forEach(t=>group.add(t));for(let i=groups.length-1;i>=0;i--)if(groups[i]!==group&&divine.some(t=>groups[i].has(t)))groups.splice(i,1);}
  }
  const phrases=[...new Set(hits.filter(h=>h.compound).flatMap(h=>h.concept.aliases.filter(a=>tokens(a).length>=2).map(a=>tokens(a).join(' '))))];
  const sequence=tokens(query,true).join(' ');if(rawTerms.length>=2&&rawTerms.length<=7&&(!personal||quotation))phrases.push(sequence);
  return {normalized,personal,definition,specific,compound,groups,hits,phrases};
 }
 function expandQuery(query){
  const p=plan(query),best=p.hits[0]?.concept;
  return p.specific&&(p.definition||p.compound)&&best?.meaning?(String(query)+'. Concetto biblico: '+best.label+'. '+best.meaning).slice(0,480):String(query);
 }
 function create(bible,curated,resolve){
  const data=g.GOD_RETRIEVAL_DATA;if(!data||data.verses!==bible.verses.length)return null;
  const N=data.verses,aver=data.lengths.reduce((a,b)=>a+b,0)/N,textCache=new Map(),chapterBounds=new Map();
  for(const [b,c,offset,total] of bible.chapters)chapterBounds.set(b+'_'+c,[offset,offset+total-1]);
  const inScope=(b,s)=>s==='all'||!s||s==='nt'&&b>=39||s==='at'&&b<39||s==='gospels'&&b>=39&&b<=42;
  const sequence=i=>{if(!textCache.has(i))textCache.set(i,' '+tokens(bible.verses[i][3]).join(' ')+' ');return textCache.get(i);};
  function evidence(query,scope){
   const p=plan(query);if(!p.specific||!p.groups.length)return {plan:p,items:[]};
   const weights=p.groups.map(group=>{const present=[...group].filter(t=>data.postings[t]);return present.length?Math.min(...present.map(t=>Math.log(1+(N-data.postings[t].length/2+.5)/(data.postings[t].length/2+.5)))):Math.log(1+N);});
   const totalWeight=weights.reduce((a,b)=>a+b,0),matchedWeight=p.groups.reduce((sum,group,i)=>sum+([...group].some(t=>data.postings[t])?weights[i]:0),0);
   const support=matchedWeight/Math.max(totalWeight,1);if(support<.55)return {plan:p,items:[],support};
   const records=new Map();
   p.groups.forEach((group,gi)=>{for(const term of group){const posting=data.postings[term]||[];for(let k=0;k<posting.length;k+=2){const i=posting[k],tf=posting[k+1];if(!inScope(bible.verses[i][0],scope))continue;let rec=records.get(i);if(!rec){rec={scores:new Map(),sum:0};records.set(i,rec);}const bm=weights[gi]*tf*2.2/(tf+1.2*(.25+.75*data.lengths[i]/aver)),old=rec.scores.get(gi)||0;if(bm>old){rec.scores.set(gi,bm);rec.sum+=bm-old;}}}});
   const seeds=[...records].sort((a,b)=>b[1].sum-a[1].sum).slice(0,650),seen=new Set(),items=[];
   for(const [i,own] of seeds){const v=bible.verses[i],[lo,hi]=chapterBounds.get(v[0]+'_'+v[1]),first=Math.max(lo,i-1),last=Math.min(hi,i+1),key=first+'_'+last;if(seen.has(key))continue;seen.add(key);
    const scores=new Map();for(let j=first;j<=last;j++)for(const [g,s] of records.get(j)?.scores||[])scores.set(g,Math.max(scores.get(g)||0,s));
    const coverage=[...scores.keys()].reduce((sum,gi)=>sum+weights[gi],0)/Math.max(totalWeight,1),count=scores.size;
    if(coverage<.76||count<Math.min(2,p.groups.length))continue;
    const verseSequences=Array.from({length:last-first+1},(_,k)=>sequence(first+k));
    const closePhrase=(text,phrase)=>{const words=text.trim().split(' '),wanted=phrase.split(' ');for(let a=0;a<words.length;a++){if(words[a]!==wanted[0])continue;let at=a+1,ok=true;for(const word of wanted.slice(1)){let next=words.indexOf(word,at);if(next<0||next-at>1){ok=false;break;}at=next+1;}if(ok)return true;}return false;};
    const phrase=verseSequences.some(text=>p.phrases.some(s=>closePhrase(text,s)));
    if(p.compound&&!phrase)continue;
    const score=[...scores.values()].reduce((a,b)=>a+b,0)+own.sum*.03;
    const literal=Array.from({length:last-first+1},(_,k)=>normalize(bible.verses[first+k][3])).some(t=>(' '+t+' ').includes(' '+p.normalized+' '));
    const compact=verseSequences.some(t=>p.phrases.some(a=>t.includes(' '+a+' ')));
    const start=bible.verses[first][2],end=bible.verses[last][2],doc=resolve('g'+v[0]+'_'+v[1]+'_'+start+'_'+end);
    if(doc)items.push({doc,score,coverage,phrase,literal,compact,anchor:v[2]});
   }
   items.sort((a,b)=>b.score-a.score||b.coverage-a.coverage||a.doc.b-b.doc.b||a.doc.c-b.doc.c||a.doc.start-b.doc.start);
   return {plan:p,items:items.slice(0,100),support};
  }
  function rank(query,scope,base,payload){
   const found=evidence(query,scope),p=found.plan;
   if(!found.items.length){
    const strongest=Math.max(0,...(payload?.items||[]).filter(x=>!/^[qt]/.test(x.id)&&Number.isFinite(x.score)).map(x=>x.score));
    // Unknown vocabulary plus weak semantic evidence is not a Biblical answer.
    // Keep source-note/name matches and glossary concepts on their existing path.
    const unknown=[...new Set(p.normalized.split(' ').filter(t=>t.length>1&&!stop.has(t)&&!framing.has(t)&&!data.surfaces?.[t]))].length;
    if(payload&&p.specific&&base.lowConfidence&&!p.hits.length&&base.items.every(x=>x.similarity<.55)&&(found.support<.35&&strongest<.52||unknown>=2&&strongest<.40))return {...base,items:[],lowConfidence:true};
    return base;
   }
   const maximum=found.items[0].score,semantic=(payload?.items||[]).filter(x=>!/^[qt]/.test(x.id)).map(x=>({doc:resolve(x.id),score:x.score})).filter(x=>x.doc),ranked=[];
   for(const hit of found.items){
    let sim=0,denseRank=Infinity;for(let i=0;i<semantic.length;i++){const raw=semantic[i];if(raw.doc.b===hit.doc.b&&raw.doc.c===hit.doc.c&&raw.doc.start<=hit.doc.end&&raw.doc.end>=hit.doc.start){sim=Math.max(sim,raw.score);if(raw.score>=.40)denseRank=Math.min(denseRank,i+1);}}
    let doc=hit.doc;const annotated=curated.find(d=>d.b===doc.b&&d.c===doc.c&&hit.anchor>=d.start&&hit.anchor<=d.end&&d.start<=doc.end&&d.end>=doc.start);
    if(annotated){const text=' '+tokens(annotated.verses.map(v=>v[3]).join(' ')).join(' ')+' ';if(!p.compound||p.phrases.some(a=>text.includes(' '+a+' ')))doc=annotated;}
    if(payload&&p.groups.length===1&&sim<.38)continue;
    ranked.push({doc,score:.40*hit.score/maximum+.20*hit.coverage+.24*sim+.30/(1+denseRank/4)+(hit.phrase?.20:0)+(hit.compact?.12:0)+(hit.literal?.12:0),similarity:Math.max(sim,.65),evidence:{text:true,phrase:hit.phrase,coverage:hit.coverage}});
   }
   ranked.sort((a,b)=>b.score-a.score);const unique=[];
   for(const item of ranked){if(unique.some(r=>r.doc.b===item.doc.b&&r.doc.c===item.doc.c&&Math.max(0,Math.min(r.doc.end,item.doc.end)-Math.max(r.doc.start,item.doc.start)+1)>=Math.min(r.doc.end-r.doc.start+1,item.doc.end-item.doc.start+1)*.5))continue;unique.push(item);}
   if(!unique.length)return base;
   const top=unique[0]?.score||1,items=unique.filter(r=>r.score>=top*.82).slice(0,20);
   return {...base,topics:[],items,textEvidence:true,semantic:!!payload,lexicalOnly:!payload,lowConfidence:false};
  }
  return {rank,evidence,plan};
 }
 g.GodRetrieval={normalize,tokens,plan,expandQuery,create};
})(typeof window==='undefined'?globalThis:window);
