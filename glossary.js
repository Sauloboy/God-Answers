(function(g){
 'use strict';
 const entries=g.GOD_GLOSSARY.entries,byId=new Map(entries.map(e=>[e.id,e])),forms=new Map();
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const normalize=s=>s.toLocaleLowerCase('it').replace(/’/g,"'").replace(/\s+/g,' ');
 const letter=c=>!!c&&/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(c);
 entries.forEach(e=>e.forms.forEach(f=>forms.set(normalize(f),e)));
 forms.set('parola',byId.get('logos'));
 const pattern=[...forms.keys()].sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/'/g,"['’]").replace(/ /g,'\\s+')).join('|');
 function find(text,context={}){
  const regex=new RegExp(pattern,'giu'),found=[];let match;
  while((match=regex.exec(text))){
   const start=match.index,end=start+match[0].length;if(letter(text[start-1])||letter(text[end]))continue;
   const form=normalize(match[0]),entry=forms.get(form);if(!entry)continue;
   if(form==='parola'&&!(context.b===42&&context.c===1&&context.v>=1&&context.v<=18))continue;
   if(form==='legge'&&/\b(?:chi|egli|lui|lei|si)\s+$/i.test(text.slice(0,start)))continue;
   if(form==='gentili'&&/(?:siate\s+|essere\s+|siete\s+|sono\s+)$/i.test(text.slice(0,start)))continue;
   found.push({start,end,text:match[0],id:entry.id});
  }
  return found;
 }
 function html(text,context={}){
  let cursor=0,result='';for(const match of find(text,context)){
   result+=esc(text.slice(cursor,match.start))+'<button class="bible-word" data-action="word" data-term="'+match.id+'" data-book="'+context.b+'" data-chapter="'+context.c+'" data-verse="'+context.v+'" aria-label="Spiega '+esc(match.text)+'">'+esc(match.text)+'</button>';cursor=match.end;
  }return result+esc(text.slice(cursor));
 }
 function explain(id,context={}){
  const entry=byId.get(id);if(!entry)return null;const value={...entry};
  if(id==='carne'&&context.b===42&&context.c===1&&context.v===14){value.meaning='In Giovanni 1:14, “carne” indica la condizione umana concreta. Affermando che la Parola è diventata carne, il prologo parla di Gesù che entra nella vita umana, con corpo, storia e fragilità.';value.attention='Qui il termine riguarda l’incarnazione: il suo significato è diverso dall’uso etico che compare in alcuni passi di Paolo.';}
  else if(id==='carne'&&((context.b===44&&context.c===8&&context.v>=1&&context.v<=17)||(context.b===47&&context.c===5&&context.v>=13&&context.v<=26))){value.meaning='In questo discorso di Paolo, “carne” descrive un orientamento della vita che resiste allo Spirito di Dio e tiene la persona legata al peccato. Il contrasto riguarda il modo di vivere e ciò che lo guida.';value.attention='Leggi il contrasto insieme alle azioni e ai frutti elencati nel brano; non ridurlo alla contrapposizione tra corpo cattivo e interiorità buona.';}
  if(id==='circoncisione'&&/incirconcis/i.test(context.word||''))value.attention='“Incirconcisione” indica l’assenza della circoncisione e, in certi discorsi, le persone o i popoli non ebrei. Il significato dipende dall’argomento della lettera.';
  return value;
 }
 g.GodGlossary={entries,find,html,explain};
})(window);
