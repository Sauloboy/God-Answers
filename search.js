(function(global){
 'use strict';
 const stop=new Set('a ad al alla allo agli alle ai anche che chi ci cio co come con cosa da dal dalla dei del della delle degli di dio e ed era essere fa fare fra gli ha hai hanno ho i il in io la le lei li lo lui ma me mi mio mia miei mie nel nella nei nelle non noi o oggi per perche poi posso quale quali quanto questo questa questi queste qui quando se sei si sia siamo sono su sul sulla te ti tra tu tuo tua un una uno voi vorrei voglio dice diceva dicevano bibbia signore'.split(' '));
 function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,' ').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();}
 function stem(s){if(/^perdon/.test(s))return 'perdon';if(/^soffr|^soffer/.test(s))return 'soffer';if(/^preg|^pregh/.test(s))return 'pregh';if(/^ricch|^ricc/.test(s))return 'ricch';return s.length>7?s.slice(0,6):s.length>4?s.replace(/[aeio]$/,''):s;}
 function tokens(s){return [...new Set(norm(s).split(' ').filter(x=>x.length>2&&!stop.has(x)).map(stem))];}
 function create(bible,content){
  const docs=[],curated=[],chapterMap=new Map(),curatedMap=new Map();
  bible.chapters.forEach(c=>chapterMap.set(c[0]+':'+c[1],c));
  const topics=content.topics.map(t=>({id:t[0],title:t[1],words:new Set(tokens(t[2])),question:t[3]}));
  const bookAliases={gn:'Genesi',gen:'Genesi',es:'Esodo',sal:'Salmi',salmo:'Salmi',prov:'Proverbi',qo:'Ecclesiaste',qoelet:'Ecclesiaste',is:'Isaia',ger:'Geremia',mt:'Matteo',mat:'Matteo',mc:'Marco',lc:'Luca',gv:'Giovanni',gio:'Giovanni',at:'Atti',rm:'Romani',rom:'Romani',ap:'Apocalisse',fil:'Filippesi',ef:'Efesini',eb:'Ebrei',gc:'Giacomo','1cor':'1 Corinzi','2cor':'2 Corinzi','1gv':'1 Giovanni','1pt':'1 Pietro'};
  function parseRef(input){
   const m=String(input).trim().match(/^([1-3]?\s*[^\d:]+?)\s*(\d{1,3})(?:\s*[:,]\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?\s*$/);
   if(!m)return null;
   const bn=norm(m[1]),alias=bookAliases[bn.replace(/ /g,'')]||bookAliases[bn];
   const b=bible.books.findIndex(x=>norm(x)===bn||x===alias);
   if(b<0||!chapterMap.has(b+':'+Number(m[2])))return null;
   const c=Number(m[2]),start=Number(m[3]||1),end=Number(m[4]||m[3]||999);
   const vs=getChapter(b,c).filter(x=>x[2]>=start&&x[2]<=end);
   if(!vs.length||start>end)return null;
   return {b,c,start:vs[0][2],end:vs[vs.length-1][2],verses:vs};
  }
  function getChapter(b,c){const a=chapterMap.get(b+':'+c);return a?bible.verses.slice(a[2],a[2]+a[3]):[];}
  function reference(d){return bible.books[d.b]+' '+d.c+':'+d.start+(d.end!==d.start?'–'+d.end:'');}
  content.passages.forEach(p=>{
   const r=parseRef(p[0]);if(!r)throw Error('Riferimento non valido: '+p[0]);
   const topicIds=p[2].split(' ');
   const d={...r,id:'p'+curated.length,title:p[1],topics:topicIds,context:p[3],note:p[4],curated:true};
   d.ref=reference(d);d.words=new Set(tokens(p[0]+' '+p[1]+' '+p[3]+' '+p[4]+' '+d.verses.map(v=>v[3]).join(' ')));
   curated.push(d);curatedMap.set(d.id,d);
  });
  // Lightweight lexical index over the entire bundled Bible. Topic expansion
  // provides natural-language retrieval without making generative-AI calls.
  bible.verses.forEach((v,i)=>docs.push({i,words:new Set(tokens(v[3]))}));
  const df=new Map(); docs.forEach(d=>d.words.forEach(w=>df.set(w,(df.get(w)||0)+1)));
  function topicMatches(q){
   const words=tokens(q),n=norm(q);
   const matches=topics.map(t=>({...t,score:words.reduce((s,w)=>s+(t.words.has(w)?1:0),0)})).filter(t=>t.score>0);
   if(/spirito santo|paraclito/.test(n)){const t=matches.find(t=>t.id==='spirito');if(t)t.score+=6;}
   if(/chi e gesu|gesu chi|gesu e dio|figlio di dio/.test(n)){const t=topics.find(t=>t.id==='gesu');matches.push({...t,score:8});}
   if(/regno di dio|regno dei cieli/.test(n)){const t=matches.find(t=>t.id==='regno');if(t)t.score+=5;}
   const highest=Math.max(0,...matches.map(t=>t.score));
   return matches.filter(t=>highest<3||t.score>=2).sort((a,b)=>b.score-a.score).slice(0,3);
  }
  function inScope(d,scope){return !scope||scope==='all'||scope==='nt'&&d.b>=39||scope==='at'&&d.b<39||scope==='gospels'&&d.b>=39&&d.b<=42;}
  function scoreWords(words,q){let s=0;for(const w of q)if(words.has(w))s+=Math.log(1+(bible.verses.length/(df.get(w)||1)));return s;}
  function byVerse(v){const b=v[0],c=v[1],num=v[2];const hit=curated.find(d=>d.b===b&&d.c===c&&num>=d.start&&num<=d.end);return hit||{id:'v'+b+'_'+c+'_'+num,b,c,start:num,end:num,ref:bible.books[b]+' '+c+':'+num,verses:[v],title:'Un passo da leggere nel suo contesto',topics:[],curated:false};}
  function rangeDoc(b,c,start,end,id){
   if(![b,c,start,end].every(Number.isInteger)||start>end)return null;
   const verses=getChapter(b,c).filter(v=>v[2]>=start&&v[2]<=end);
   if(!verses.length||verses[0][2]!==start||verses[verses.length-1][2]!==end)return null;
   const annotated=curated.find(d=>d.b===b&&d.c===c&&Math.max(0,Math.min(d.end,end)-Math.max(d.start,start)+1)>=Math.min(end-start+1,d.end-d.start+1)*.65);
   if(annotated)return annotated;
   const d={b,c,start,end,id,verses,title:'Un passo collegato alla tua ricerca',topics:[],curated:false};
   d.ref=reference(d);return d;
  }
  function get(id){
   if(curatedMap.has(id))return curatedMap.get(id);
   if(String(id).startsWith('r')){const r=parseRef(String(id).slice(1));return r?{...r,id,ref:reference(r),title:'Il passo che hai cercato',topics:[],curated:false}:null;}
   const g=String(id).match(/^[gs](\d+)_(\d+)_(\d+)_(\d+)$/);if(g){const b=+g[1],c=+g[2],start=+g[3],end=+g[4],verses=getChapter(b,c).filter(v=>v[2]>=start&&v[2]<=end);if(!verses.length||verses[0][2]!==start||verses[verses.length-1][2]!==end)return null;return {id,b,c,start,end,verses,ref:reference({b,c,start,end}),title:'Un brano da leggere nel suo contesto',topics:[],curated:false};}
   const a=String(id).match(/^a(\d+)_(\d+)_(\d+)_(\d+)$/);if(a)return rangeDoc(+a[1],+a[2],+a[3],+a[4],id);
   const m=String(id).match(/^v(\d+)_(\d+)_(\d+)$/);if(!m)return null;
   const v=getChapter(+m[1],+m[2]).find(v=>v[2]===+m[3]);return v?byVerse(v):null;
  }
  function legacySearch(q,scope='all'){
   const raw=String(q).trim().slice(0,500),direct=parseRef(raw);
   if(direct){const d={...direct,id:'r'+raw,ref:reference(direct),title:'Il passo che hai cercato',topics:[],curated:false};const exact=curated.find(x=>x.b===d.b&&x.c===d.c&&x.start===d.start&&x.end===d.end);return {direct:true,topics:[],items:inScope(d,scope)?[{doc:exact||d,score:100}]:[]};}
   const words=tokens(raw);if(!words.length)return {topics:[],items:[]};
   const matched=topicMatches(raw),items=[];
   for(const d of curated){if(!inScope(d,scope))continue;const topicScore=matched.reduce((s,t)=>s+(d.topics.includes(t.id)?Math.min(t.score,5)*20:0),0);const lexical=scoreWords(d.words,words);const titleScore=scoreWords(new Set(tokens(d.title)),words)*1.2;const score=topicScore+lexical+titleScore;if(score>0)items.push({doc:d,score});}
   if(!matched.length){
    const minimum=words.length<2?1:Math.max(2,Math.ceil(words.length*.6));
    const ranked=docs.map(x=>({x,s:scoreWords(x.words,words),hits:words.filter(w=>x.words.has(w)).length})).filter(x=>x.s>0&&x.hits>=minimum&&inScope({b:bible.verses[x.x.i][0]},scope)).sort((a,b)=>b.s-a.s).slice(0,30);
    const used=new Set(items.map(x=>x.doc.id));
    for(const r of ranked){const d=byVerse(bible.verses[r.x.i]);if(!used.has(d.id)){used.add(d.id);items.push({doc:d,score:r.s});}}
   }
   items.sort((a,b)=>b.score-a.score||a.doc.b-b.doc.b||a.doc.c-b.doc.c);
   const minimum=words.length<2?1:Math.max(2,Math.ceil(words.length*.6));
   const filtered=matched.length?items.filter(x=>x.score>=Math.min(25,items[0]?.score||25)):items.filter(x=>x.score>0&&(x.doc.words?words.filter(w=>x.doc.words.has(w)).length>=minimum:true));
   return {topics:matched,items:filtered.slice(0,60),lexicalOnly:!matched.length};
  }
  // Domain language helps short, specific concepts survive paraphrasing.
  function meaningWords(text){
   const s=norm(text).replace(/\bqoelet\b/g,' ecclesiaste ').replace(/\b(?:raccont\w*|spieg\w*|parla|parlano|parlare|testo|brano)\b/g,' ').replace(/\b(?:statue?|statuette?|icone?|idoli?|immagini?)\b/g,' immagini ')
    .replace(/\b(?:stipendi[oa]?|salari[oa]?|retribuzion\w*|paghe)\b/g,' salario ')
    .replace(/\b(?:disgrazi\w*|tragedi\w*|catastrof\w*)\b/g,' tragedia ')
    .replace(/\b(?:chies[ae]|comunita)\b/g,' comunita ')
    .replace(/\b(?:superflu\w*|inutil\w*)\b/g,' inutile ')
    .replace(/\b(?:confront\w*|paragon\w*|traguard\w*)\b/g,' confronto ');
   const filler=new Set('ancora sempre tutto qualcosa qualcuno nessuno troppo proprio soltanto senza stesso stessa penso volta tanto tutti ogni mai altri altro altre piu meno gia davvero forse possibile riesco riuscire modo momento quello quella quelli quelle cui mentre'.split(' ').map(stem));
   return tokens(s).filter(w=>!filler.has(w));
  }
  const intentSets=curated.map((d,i)=>new Set(meaningWords((global.SELAH_PASSAGE_INTENTS?.[i]||[]).join(' ')+' '+d.title)));
  const intentDF=new Map();intentSets.forEach(set=>set.forEach(w=>intentDF.set(w,(intentDF.get(w)||0)+1)));
  const studyIndex=global.GOD_STUDY_SEARCH||{docs:[],postings:{}};
  // Exact names occurring in the Bible distinguish a specific episode from
  // a broad topic. General divine titles are deliberately not name anchors.
  const properNames=new Set(norm('Adamo Eva Caino Abele Set Noè Sem Cam Iafet Abramo Abraamo Abrahamo Sara Sarai Agar Isacco Rebecca Giacobbe Esaù Labano Lia Rachele Giuseppe Beniamino Giuda Ruben Simeone Levi Mosè Aronne Miriam Giosuè Caleb Raab Racab Balaam Balak Gedeone Sansone Iefte Debora Barak Rut Noemi Boaz Anna Elkana Samuele Saul Gionata Davide Natan Betsabea Uria Absalom Salomone Roboamo Geroboamo Acab Gezabele Elia Eliseo Giezi Naaman Ezechia Giosia Manasse Esdra Neemia Ester Mardocheo Aman Giobbe Elifaz Bildad Zofar Eliu Isaia Geremia Baruc Ezechiele Daniele Sadrac Mesac Abednego Nabucodonosor Dario Ciro Osea Gomer Gioele Amos Abdia Giona Michea Naum Abacuc Sofonia Aggeo Zaccaria Malachia Maria Elisabetta Pietro Andrea Giacomo Giovanni Filippo Bartolomeo Tommaso Matteo Simone Taddeo Mattia Natanaele Nicodemo Marta Lazzaro Zaccheo Pilato Erode Erodiade Caifa Gamaliele Saulo Paolo Barnaba Marco Luca Timoteo Tito Silvano Sila Filemone Onesimo Priscilla Aquila Apollos Lidia Febe Giunia Anania Saffira Cornelio Stefano Ninive Babilonia Gerusalemme Betlemme Nazaret Cafarnao Capernaum Galilea Samaria Giudea Egitto Canaan Tiro Sidone Damasco Antiochia Efeso Corinto Filippi Tessalonica Roma Atene Patmos Sion Sinai Gerico Betel Sichem Sodoma Gomorra').split(' '));
  const nicheConcepts=/\b(giubileo|roveto|samaritan\w*|manna|primogenitura|sicomoro|farise\w*|sadduce\w*|pubblican\w*|tabernacolo)\b/;
  function studyEvidence(query,scope){
   const words=meaningWords(query),anchors=new Set(norm(query).split(" ").filter(w=>properNames.has(w)).map(stem)),scores=new Map(),N=studyIndex.docs.length;
   if(!N||words.length<2)return [];
   let total=0;
   for(const w of words){const posting=studyIndex.postings[w]||[],weight=Math.log(1+N/(1+posting.length));total+=weight;for(const i of posting){const r=scores.get(i)||{score:0,hits:0};r.score+=weight;r.hits++;if(anchors.has(w))r.anchor=true;scores.set(i,r);}}
   const minimum=Math.min(3,Math.max(2,Math.ceil(words.length*.35)));
   return [...scores].filter(([i,r])=>r.hits>=minimum&&r.score/total>=.30).map(([i,r])=>({doc:get(studyIndex.docs[i][0]),strength:r.score/total,hits:r.hits,anchor:!!r.anchor})).filter(x=>x.doc&&inScope(x.doc,scope)).sort((a,b)=>b.strength-a.strength).slice(0,24);
  }
  function mentionedBook(query){
   const text=' '+norm(query)+' ';if(/\bgiovanni battista\b/.test(text))return null;
   const found=[];
   bible.books.forEach((name,b)=>{const phrase=' '+norm(name)+' ',start=text.indexOf(phrase);if(start>=0)found.push({b,start,end:start+phrase.length});});
   const matches=found.filter(x=>!found.some(y=>y!==x&&y.start<=x.start&&y.end>=x.end&&(y.end-y.start>x.end-x.start))).map(x=>x.b);
   if(/\bqoelet\b/.test(text))matches.push(20);
   return matches.length===1?matches[0]:null;
  }
  function legacySemanticSearch(query,scope,payload,meaning=null){
   if(parseRef(query))return legacySearch(query,scope);
   const all=payload.items||[],questionScores=new Map((payload.questions||[]).filter(x=>/^q\d+$/.test(x.id)&&Number.isFinite(x.score)).map(x=>['p'+x.id.slice(1),x.score]));
   const inferred=all.filter(x=>/^t\d+$/.test(x.id)&&Number.isFinite(x.score)).map(x=>({...topics[+x.id.slice(1)],confidence:x.score})).filter(x=>x.id&&x.confidence>=.40).sort((a,b)=>b.confidence-a.confidence);
   const detected=inferred.filter(x=>x.confidence>=Math.max(.40,(inferred[0]?.confidence||0)-.07)).slice(0,3);
   const topicConfidence=new Map(detected.map(t=>[t.id,t.confidence]));
   const words=meaningWords(query),lexicalScores=curated.map((d,i)=>words.reduce((sum,w)=>sum+(intentSets[i].has(w)?Math.log(1+curated.length/(intentDF.get(w)||1)):0),0));
   const maximumLexical=Math.max(1,...lexicalScores),candidates=new Map();
   const bookFocus=mentionedBook(query);
   const strongestQuestion=Math.max(0,...questionScores.values());
   const uncertainIntent=strongestQuestion<.53;
   const dominant=detected[0]?.confidence>=.70?detected[0]:null;
   for(const item of all){
    if(typeof item.id!=='string'||!Number.isFinite(item.score)||item.score<.36)continue;
    const d=get(item.id);if(!d||!inScope(d,scope))continue;
    const previous=candidates.get(d.id);if(!previous||item.score>previous.similarity)candidates.set(d.id,{doc:d,score:item.score*.72,similarity:item.score});
   }
   for(let i=0;i<curated.length;i++){
    const d=curated[i];if(!inScope(d,scope))continue;
    const prior=candidates.get(d.id),context=prior?.similarity||0,q=questionScores.get(d.id)||0;
    const thematic=Math.max(0,...d.topics.map(t=>topicConfidence.get(t)||0));
    const lexical=lexicalScores[i]/maximumLexical;
    if(Math.max(q,context,thematic)<.40)continue;
    const primary=detected.findIndex(t=>t.id===d.topics[0]);
    let score=uncertainIntent?q*.40+context*.10+lexical*.10+thematic*.55+(primary<0?0:.04/(primary+1)):q*.82+context*.08+lexical*.08+thematic*.07;
    if(dominant&&!d.topics.includes(dominant.id)&&q<.65)score*=.78;
    if(meaning&&d.topics.some(t=>meaning.topics.includes(t)))score+=.045;
    candidates.set(d.id,{doc:d,score,similarity:Math.max(q,context,thematic)});
   }
   const useStudyWords=bookFocus!==null||norm(query).split(' ').some(w=>properNames.has(w))||nicheConcepts.test(norm(query));
   for(const evidence of (useStudyWords?studyEvidence(query,scope):[])){
    const prior=candidates.get(evidence.doc.id),semantic=prior?.similarity||0;
    const globalEvidence=Math.max(0,...all.filter(x=>Number.isFinite(x.score)&&!/^[qt]/.test(x.id)).map(x=>x.score));
    const score=Math.max(prior?.score||0,.46+evidence.strength*.40+semantic*.10+(evidence.anchor?.08:0));
    if((semantic>=.36||evidence.strength>=.55||evidence.hits>=3||bookFocus===evidence.doc.b||evidence.anchor)&&(globalEvidence>=.40||bookFocus===evidence.doc.b||evidence.anchor))candidates.set(evidence.doc.id,{doc:evidence.doc,score,similarity:Math.max(semantic,evidence.strength*.78)});
   }
   if(bookFocus!==null)for(const candidate of candidates.values())candidate.score*=candidate.doc.b===bookFocus?2.0:.80;
   const sorted=[...candidates.values()].sort((a,b)=>b.score-a.score),unique=[];
   for(const item of sorted){
    if(unique.some(x=>x.doc.b===item.doc.b&&x.doc.c===item.doc.c&&Math.max(0,Math.min(x.doc.end,item.doc.end)-Math.max(x.doc.start,item.doc.start)+1)>=Math.min(x.doc.end-x.doc.start+1,item.doc.end-item.doc.start+1)*.5))continue;
    unique.push(item);
   }
   const best=unique[0]?.similarity||0,topScore=unique[0]?.score||0;
   const items=unique.filter(x=>x.similarity>=Math.max(.36,best-.18)&&x.score>=topScore*.68).slice(0,20);
   const leadingQuestion=Math.max(0,...questionScores.values());
   return {semantic:true,topics:detected,items,lowConfidence:best<.44||leadingQuestion<.48&&maximumLexical<=1,lexicalOnly:false};
  }
  const retrieval=global.GodRetrieval?.create(bible,curated,get);
  function search(query,scope='all',meaning=null){
   if(parseRef(query))return legacySearch(query,scope);
   const base=legacySearch(meaning?meaning.focus+' Situazione descritta: '+query:query,scope);
   return retrieval?retrieval.rank(query,scope,base,null):base;
  }
  function semanticSearch(query,scope,payload,meaning=null){
   const base=legacySemanticSearch(query,scope,payload,meaning);
   return retrieval&&!parseRef(query)&&mentionedBook(query)===null?retrieval.rank(query,scope,base,payload):base;
  }
  const readingUnits=[];for(const [b,c,offset,total] of bible.chapters)for(let first=1;first<=total;first+=6)readingUnits.push('g'+b+'_'+c+'_'+first+'_'+Math.min(first+5,total));
  return {readingUnits,search,semanticSearch,parseRef,getChapter,reference,get,curated,topics,topicMatches,norm,tokens,byVerse,bible};
 }
 global.SelahSearch={create,norm,tokens};
})(typeof window!=='undefined'?window:globalThis);
