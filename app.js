(function(){
 'use strict';
 if('scrollRestoration' in history)history.scrollRestoration='manual';
 const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const key='selah.private.v1';
 const blank={favorites:[],notes:{},history:[],theme:'light',size:'normal',ai:true};
 let saved;
 try{const d=JSON.parse(localStorage.getItem(key)||'{}');saved={...blank,...d};saved.favorites=Array.isArray(d.favorites)?d.favorites.filter(x=>typeof x==='string'):[];saved.history=Array.isArray(d.history)?d.history.filter(x=>typeof x==='string').slice(0,15):[];saved.notes=d.notes&&typeof d.notes==='object'&&!Array.isArray(d.notes)?d.notes:{};}catch(e){saved={...blank,notes:{}};}
 let engine,tab='search',query='',scope='all',results=null,limit=5,reading=null,returnState=null,noteDoc=null,lastFocused=null,toastTimer,searchTimer;
 let requestSerial=0,pendingSearch=null,aiState='unavailable',randomDoc=null,clarification=null,selectedMeaning=null,meaningQuery='',skippedMeaning=false;
 const main=$('#main'),modal=$('#modal');
 let readingReady=false,readingTimer,readerRenderSerial=0;
 function readingPosition(){return window.GodReadingPosition?.valid(saved.readingPosition)||null;}
 function rememberReading(){clearTimeout(readingTimer);if(!readingReady)return null;const position=window.GodReadingPosition?.capture(document,window);if(position&&JSON.stringify(position)!==JSON.stringify(readingPosition())){saved.readingPosition=position;persist();}return position;}
 function resumeLink(){const p=readingPosition();return p?'<button class="text-button reading-resume" data-action="reader">Riprendi la lettura · '+esc(engine.bible.books[p.b]+' '+p.c+':'+p.v)+' →</button>':'';}

 const bookmark='<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4Z"/></svg>';
 const arrow='<svg viewBox="0 0 24 24"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
 function persist(){try{localStorage.setItem(key,JSON.stringify(saved));return true;}catch(e){toast('Impossibile salvare: spazio locale non disponibile.');return false;}}
 function applySettings(){document.body.classList.toggle('dark',saved.theme==='dark');document.body.classList.toggle('serif-large',saved.size==='large');document.body.classList.toggle('serif-very-large',saved.size==='very-large');}
 function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600);}
 function countLabel(n){return n.toLocaleString('it-IT');}
 function wordHTML(v,text=v[3]){return window.GodScripture.html(text,{b:v[0],c:v[1],v:v[2]});}
 function verseHTML(d){return d.verses.map(v=>'<p><sup>'+v[2]+'</sup>'+wordHTML(v)+'</p>').join('');}
 function shortText(text,max=210){return text.length<=max?text:text.slice(0,max).replace(/\s+\S*$/,'')+'…';}
 function bookInfo(b){
  const names={
   Genesi:'Racconti delle origini, dei patriarchi e delle promesse. Ogni episodio va letto nel suo arco narrativo, distinguendo voce del narratore e parole dei personaggi.',
   Esodo:'Racconto della liberazione dall’Egitto, dell’alleanza e del cammino nel deserto. Le leggi e i racconti sono collegati alla formazione d’Israele.',
   Giobbe:'Dialogo poetico sul dolore e sulla giustizia. Le opinioni degli amici di Giobbe non coincidono automaticamente con la conclusione del libro.',
   Salmi:'Raccolta di preghiere e poesie: lamento, ringraziamento, protesta e fiducia. Le immagini non sono sempre affermazioni letterali o promesse individuali.',
   Proverbi:'Raccolta di insegnamenti sapienziali. Le massime indicano orientamenti di vita e osservazioni generali, non garanzie meccaniche per ogni situazione.',
   Ecclesiaste:'Riflessione sapienziale su tempo, lavoro, gioia, limite e morte. Le tensioni interne fanno parte del percorso del libro.',
   Isaia:'Raccolta profetica che attraversa giudizio, esilio e restaurazione. Identificare gli interlocutori e la situazione storica è essenziale per interpretare le promesse.',
   Geremia:'Profezie e racconti legati alla crisi di Giuda, alla caduta di Gerusalemme e all’esilio. Le promesse hanno anzitutto una dimensione comunitaria.',
   Lamentazioni:'Poemi di lutto legati alla distruzione di Gerusalemme. Lamento e fiducia sono intrecciati senza annullare la gravità della perdita.',
   Matteo:'Vangelo che presenta parole e azioni di Gesù in continuo dialogo con le Scritture d’Israele. Individua chi ascolta ogni discorso e il suo contesto.',
   Marco:'Vangelo dal racconto concentrato sull’azione e sull’identità di Gesù. Le parole sul discepolato si comprendono lungo il cammino verso la passione.',
   Luca:'Vangelo attento a misericordia, preghiera, poveri ed esclusi. Parabole e incontri fanno parte del viaggio narrativo di Gesù.',
   Giovanni:'Vangelo costruito attorno a segni, dialoghi e discorsi sull’identità di Gesù. Molte immagini e parole hanno più livelli di significato.',
   Atti:'Racconto della prima espansione delle comunità cristiane. Gli episodi descrivono anche decisioni, conflitti e trasformazioni: non ogni dettaglio è un comando universale.',
   Romani:'Lettera che affronta peccato, grazia, fede, Israele e vita comunitaria. Segui lo sviluppo dell’argomentazione prima di isolare una frase.',
   '1 Corinzi':'Lettera a una comunità segnata da divisioni e domande pratiche. Paolo risponde a situazioni specifiche su relazioni, culto, doni e risurrezione.',
   '2 Corinzi':'Lettera sul ministero, sulla debolezza e sulla riconciliazione, legata a un rapporto difficile fra Paolo e la comunità.',
   Galati:'Lettera sul rapporto fra fede, Legge e inclusione dei non giudei. La libertà cristiana viene collegata al servizio nell’amore.',
   Efesini:'Lettera sulla vita in Cristo e sull’unità della comunità, seguita da indicazioni sulla condotta e sulle relazioni nel mondo antico.',
   Filippesi:'Lettera di gratitudine e incoraggiamento scritta in una situazione di prigionia. Gioia e speranza convivono con difficoltà reali.',
   Colossesi:'Lettera che mette al centro Cristo e le conseguenze della vita nuova per la condotta e le relazioni.',
   '1 Timoteo':'Lettera con indicazioni sull’insegnamento e sulla vita comunitaria. Le situazioni sociali antiche richiedono attenzione nel passaggio al presente.',
   Ebrei:'Discorso di esortazione che interpreta Gesù attraverso le Scritture e le immagini del sacerdozio, del sacrificio e dell’alleanza.',
   Giacomo:'Lettera sapienziale su fede e azione, parole, ricchezza e relazioni. Gli esempi pratici sono centrali nell’argomentazione.',
   '1 Pietro':'Lettera che incoraggia comunità in difficoltà a vivere la speranza e a perseverare. Le esortazioni sono inserite in quella condizione concreta.',
   '1 Giovanni':'Lettera su verità, amore, peccato e comunione. Le affermazioni sulla conoscenza di Dio vengono verificate nella vita e nelle relazioni.',
   Apocalisse:'Visione profetica indirizzata a comunità concrete. Simboli, richiami all’Antico Testamento e scene di giudizio convergono nella speranza di una nuova creazione.'
  };
  const name=engine.bible.books[b];if(names[name])return names[name];
  if(b<=4)return 'Libro della Torah: racconti, leggi e alleanza appartengono alla storia d’Israele. Individua chi parla, a chi si rivolge e in quale situazione.';
  if(b<17)return 'Racconto della storia d’Israele. Le azioni dei personaggi vengono narrate e non per questo sono tutte proposte come un modello da seguire.';
  if(b<22)return 'Testo poetico o sapienziale: genere, immagini e sviluppo del discorso aiutano a non ridurre una frase a una regola assoluta.';
  if(b<39)return 'Libro profetico rivolto anzitutto a interlocutori e situazioni storiche precise. Giudizio e promessa vanno letti dentro quel contesto.';
  return 'Testo del Nuovo Testamento indirizzato a una comunità o a interlocutori concreti. Segui il ragionamento e leggi i versetti prima e dopo il passo.';
 }
 function card(d){
  const isSaved=saved.favorites.includes(d.id),note=typeof saved.notes[d.id]==='string'?saved.notes[d.id]:'';
  const relevant=results?.topics.filter(t=>d.topics.includes(t.id)).map(t=>t.title)||[];
  const details='<div class="study-view" data-study-id="'+esc(d.id)+'"><p class="study-loading" role="status">Apertura degli approfondimenti…</p></div>';
  return '<article class="verse-card" data-doc="'+esc(d.id)+'"><div class="card-head"><span class="reference">'+esc(d.ref)+'</span><button class="save-button '+(isSaved?'saved':'')+'" data-action="save" data-id="'+esc(d.id)+'" aria-label="'+(isSaved?'Rimuovi dai salvati':'Salva il passo')+'" aria-pressed="'+isSaved+'">'+bookmark+'</button></div><div class="verse-text">'+verseHTML(d)+'</div><div class="edition">Bibbia Aperta · OTB 2026</div><h3 class="card-title">'+esc(d.title)+'</h3><p class="card-short">'+esc(relevant.length?'Collegato a: '+relevant.join(' · '):d.curated?shortText(d.context):'Risultato della ricerca nel testo biblico.')+'</p><details class="card-details"><summary>Contesto, note, analisi e passi collegati</summary>'+details+'<p class="tiny">Note di God Answers: un aiuto alla lettura, distinto dal testo biblico.</p></details>'+(note?'<div class="saved-note">'+esc(note)+'</div>':'')+'<div class="card-foot"><button data-action="chapter" data-id="'+esc(d.id)+'">Leggi il capitolo →</button><div class="foot-actions"><button data-action="note" data-id="'+esc(d.id)+'">'+(note?'Appunto':'Annota')+'</button><button data-action="copy" data-id="'+esc(d.id)+'">Copia</button></div></div></article>';
 }
 let renderedDocs=new Map();
 function remember(d){renderedDocs.set(d.id,d);return d;}
 function getDoc(id){return renderedDocs.get(id)||engine.get(id);}
 function aiLabel(){return results?.direct?'Riferimento biblico':results?results.semantic?'AI offline · significato':'Temi e parole':saved.ai===false?'Temi e parole':aiState==='ready'?'AI offline · significato':aiState==='loading'?'AI in avvio…':'Ricerca offline';}
 function resultIntro(){
  if(results.direct)return 'Ecco il passo che cercavi, nel testo della Bibbia Aperta.';
  if(results.semantic)return results.lowConfidence?'Il collegamento non è chiaro. Aggiungi un dettaglio su ciò che intendi per trovare passi più vicini alla tua ricerca.':'Questi brani possono aiutarti ad approfondire ciò che hai scritto. Le note spiegano il contesto; nel capitolo ritrovi il discorso completo.';
  return results.topics.length?'Passi ordinati per affinità con i temi della tua ricerca. Apri le note per comprenderne il contesto.':'Riscontri per parole nel testo: leggi il contesto per valutarne la pertinenza.';
 }
 function searchForm(){return '<form id="search-form" class="search-box"><label for="question">DA COSA VUOI PARTIRE?</label><textarea id="question" maxlength="500" rows="2" placeholder="Scrivi ciò che hai in mente…" aria-describedby="search-help">'+esc(query)+'</textarea><div class="search-bottom"><span id="search-help" class="tiny"><span class="online-dot"></span><span id="ai-label">'+aiLabel()+'</span></span><button class="primary" id="search-button" type="submit">Cerca nella Bibbia '+arrow+'</button></div></form>';}
 function renderSearch(){
  const head=results?'<div class="hero"><span class="eyebrow">CERCA NELLA SCRITTURA</span><h2>Adesso,<br>entra nel testo.</h2></div>':'<section class="hero"><span class="eyebrow">LA PAROLA, NELLA VITA</span><h1>Porta qui<br>quello che vivi.</h1><p>Pensieri che tornano, scelte difficili, voglia di capire. Cerca nelle Scritture un punto da cui ripartire.</p></section>';
  const form=searchForm();
  if(clarification){main.innerHTML=head+form+clarificationHTML();return;}
  if(results){
   const list=results.items.slice(0,limit).map(r=>card(remember(r.doc))).join('');
   const filters=[['all','Tutta la Bibbia'],['gospels','Vangeli'],['nt','Nuovo Testamento'],['at','Antico Testamento']].map(([id,title])=>'<button class="chip '+(scope===id?'active':'')+'" data-action="scope" data-scope="'+id+'" aria-pressed="'+(scope===id)+'">'+title+'</button>').join('');
   main.innerHTML=head+form+(selectedMeaning?'<p class="meaning-selection">Hai scelto: <strong>'+esc(window.GodIntent.meanings[selectedMeaning].label)+'</strong> · <button class="text-button" data-action="change-meaning">Cambia</button></p>':'')+'<div class="section-label">Dove cercare</div><div class="chips">'+filters+'</div><section id="results"><div class="results-top"><h2>Da leggere, da capire</h2><span class="tiny">'+results.items.length+(results.items.length===60?'+':'')+' risultati</span></div>'+(results.topics.length?'<div class="topic-pills">'+results.topics.map(t=>'<span class="topic-pill">'+esc(t.title)+'</span>').join('')+'</div>':'')+'<p class="result-intro">'+resultIntro()+'</p>'+list+(!list?'<div class="empty"><h3>Prova a dirmi qualcosa in più.</h3><p>Nessun passo pertinente trovato'+(scope!=='all'?' in questa sezione':'')+'. Puoi cercare “paura del futuro”, “perdonare”, “libero arbitrio” oppure un riferimento come “Giovanni 14:27”.</p></div>':'')+(results.items.length>limit?'<button class="primary load-more" data-action="more">Mostra altri 5 passi</button>':'')+'<button class="text-button" data-action="reset">← Ricomincia da qui</button></section>';
  }else{
   const popular=['paura','perdono','sofferenza','dubbio','preghiera','amore'];

   main.innerHTML=head+form+resumeLink()+'<div class="section-label">A VOLTE BASTA UN INIZIO</div><div class="chips">'+popular.map(id=>{const t=engine.topics.find(t=>t.id===id);return '<button class="chip" data-action="question" data-query="'+esc(t.question)+'">'+esc(t.title)+'</button>';}).join('')+'</div>'+renderRandom()+(saved.history.length?'<div class="section-label">RIPRENDI IL FILO</div><div class="history">'+saved.history.slice(0,3).map(q=>'<button data-action="question" data-query="'+esc(q)+'"><span>'+esc(q)+'</span><span>↗</span></button>').join('')+'</div>':'')+'<p class="microcopy">'+countLabel(engine.bible.verses.length)+' versetti · '+engine.curated.length+' percorsi tematici<br>Testo moderno: Bibbia Aperta, italiano 2026. Tutto sul telefono.</p>';
  }
 }
 function clarificationHTML(){return '<section class="clarification" id="clarification" aria-labelledby="clarify-title"><span class="eyebrow">UN DETTAGLIO PRIMA DI CERCARE</span><h2 id="clarify-title">'+esc(clarification.title)+'</h2><p>'+esc(clarification.description)+'</p><div class="clarification-choices">'+clarification.choices.map(m=>'<button data-action="clarify" data-meaning="'+m.id+'"><strong>'+esc(m.label)+'</strong><span>'+esc(m.hint)+'</span></button>').join('')+'</div><button class="text-button" data-action="clarify-skip">Cerca comunque, senza precisare →</button></section>';}
 function studyArgs(d){return {b:d.b,c:d.c,start:d.start,end:d.end,verses:d.verses,bookName:engine.bible.books[d.b],curated:d.curated?d:null,bookContext:bookInfo(d.b)};}
 async function fillStudy(container,d){
  if(!d||container.dataset.loaded)return;container.dataset.loaded='loading';
  try{const data=await window.GodStudy.get(studyArgs(d));if(container.isConnected){container.innerHTML=window.GodStudy.tabs(data);container.dataset.loaded='true';}}
  catch(e){if(container.isConnected){container.innerHTML='<p>Non riesco ad aprire gli approfondimenti. Chiudi e riprova.</p>';delete container.dataset.loaded;}}
 }
 function openStudy(b,c,v){
  const verses=engine.getChapter(b,c).filter(x=>x[2]===v);if(!verses.length)return;
  const d={b,c,start:v,end:v,verses},args=studyArgs(d);args.curated=engine.curated.find(x=>x.b===b&&x.c===c&&v>=x.start&&v<=x.end)||null;
  openSheet(engine.bible.books[b]+' '+c+':'+v,'<div class="study-view"><p role="status">Apertura degli approfondimenti…</p></div>');
  const container=modal.querySelector('.study-view');window.GodStudy.get(args).then(data=>{if(container.isConnected)container.innerHTML=window.GodStudy.tabs(data);}).catch(()=>{if(container.isConnected)container.innerHTML='<p>Non riesco ad aprire gli approfondimenti. Chiudi e riprova.</p>';});
 }
 function renderRandom(){
  return '<section class="daily random-invite"><span class="eyebrow">LASCIA SPAZIO ALL’INATTESO</span><h2>Un passo che<br>non hai cercato.</h2><p>Esci per un momento dalle tue ricerche. Scopri un brano e fermati a leggerlo.</p><button class="primary" data-action="random">'+(randomDoc?'Scopri un altro passo':'Sorprendimi con un passo')+' '+arrow+'</button><p class="tiny random-caption">Scelto a caso tra tutti i libri, con gli approfondimenti sempre disponibili.</p></section>'+(randomDoc?'<section id="random-result" aria-label="Il passo casuale"><p class="random-announcement" role="status">Il tuo passo · '+esc(randomDoc.ref)+'</p>'+card(remember(randomDoc))+'</section>':'');
 }
 function drawRandom(){
  cancelSearch();
  const pool=engine.readingUnits,valid=new Set(pool);
  let deck=saved.randomPoolVersion===2&&Array.isArray(saved.randomDeck)?saved.randomDeck.filter(id=>valid.has(id)):[];
  if(!deck.length){
   deck=pool.slice();
   for(let i=deck.length-1;i>0;i--){const values=new Uint32Array(1);crypto.getRandomValues(values);const j=values[0]%(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}
   if(deck.length>1&&deck[deck.length-1]===saved.lastRandom)[deck[0],deck[deck.length-1]]=[deck[deck.length-1],deck[0]];
  }
  const id=deck.pop();saved.randomDeck=deck;saved.randomPoolVersion=2;saved.lastRandom=id;persist();
  randomDoc=engine.get(id);reading=null;returnState=null;tab='search';results=null;query='';scope='all';render(false);
  $('#random-result')?.scrollIntoView({block:'start'});
 }
 function renderExplore(){
  const position=readingPosition();
  main.innerHTML='<div class="page-head"><span class="eyebrow">TEMI E TESTI</span><h1>Vai più<br>in profondità.</h1><p>Segui ciò che ti sta a cuore. Oppure apri un libro e lascia che sia il testo a guidarti.</p></div><section class="daily"><h3>Ogni passo ha una storia.</h3><p class="tiny">66 libri · 1.189 capitoli · testo completo offline</p><button class="primary" data-action="reader">'+(position?'Riprendi la lettura':'Apri la Bibbia')+' '+arrow+'</button>'+(position?'<p class="tiny resume-location">Da '+esc(engine.bible.books[position.b]+' '+position.c+':'+position.v)+'</p>':'')+'</section><div class="section-label">SCEGLI UN TEMA</div><div class="topic-grid">'+engine.topics.map((t,i)=>'<button class="topic-tile" data-action="question" data-query="'+esc(t.question)+'"><span class="number">'+String(i+1).padStart(2,'0')+' / ESPLORA</span><strong>'+esc(t.title)+'</strong></button>').join('')+'</div>';
 }
 function renderSaved(){
  const docs=saved.favorites.map(id=>getDoc(id)).filter(Boolean);
  main.innerHTML='<div class="page-head"><span class="eyebrow">IL TUO SPAZIO</span><h1>Tieni vicino<br>ciò che conta.</h1><p>I passi che vuoi rileggere. Le riflessioni che non vuoi perdere.</p></div><p class="library-count">'+docs.length+' passi salvati</p>'+(docs.length?docs.map(d=>card(remember(d))).join(''):'<div class="empty"><h3>Non lasciare andare ciò che ti colpisce.</h3><p>Tocca il segnalibro su un risultato per ritrovarlo qui. Con “Annota” puoi aggiungere una riflessione personale.</p></div>');
 }
 function renderReader(){
  const {b,c,start,end}=reading,verses=engine.getChapter(b,c);
  main.innerHTML='<button class="text-button back-link" data-action="back">← Torna alla lettura precedente</button><div class="page-head"><span class="eyebrow">BIBBIA APERTA · ITALIANO 2026</span><h1>'+esc(engine.bible.books[b])+' <span>'+c+'</span></h1></div><div class="reader-picker"><select id="book-picker" aria-label="Libro">'+engine.bible.books.map((n,i)=>'<option value="'+i+'" '+(b===i?'selected':'')+'>'+esc(n)+'</option>').join('')+'</select><select id="chapter-picker" aria-label="Capitolo">'+Array.from({length:engine.bible.counts[b]},(_,i)=>'<option value="'+(i+1)+'" '+(c===i+1?'selected':'')+'>'+String(i+1)+'</option>').join('')+'</select></div><p class="book-summary">'+esc(bookInfo(b))+'</p><p class="reader-help">Gli apici aprono gli approfondimenti. Le parole blu hanno una spiegazione al tocco.</p><div class="reader-verses" data-book="'+b+'" data-chapter="'+c+'">'+verses.map(v=>'<p id="verse-'+v[2]+'" class="'+(v[2]>=start&&v[2]<=end?'highlight':'')+'"><sup>'+v[2]+'</sup>'+wordHTML(v)+'<sup class="reader-note"><button data-action="study" data-book="'+b+'" data-chapter="'+c+'" data-verse="'+v[2]+'" aria-label="Approfondisci '+esc(engine.bible.books[b])+' '+c+':'+v[2]+'">['+v[2]+']</button></sup></p>').join('')+'</div><div class="chapter-controls"><button data-action="prev-chapter" '+(b===0&&c===1?'disabled':'')+'>← Precedente</button><button data-action="next-chapter" '+(b===65&&c===engine.bible.counts[65]?'disabled':'')+'>Successivo →</button></div><p class="microcopy">Open Translation Bible, edizione italiana 2026 · CC BY-SA 4.0. Testo biblico distinto dalle note editoriali di God Answers.</p>';
 }
 function render(scroll=true,position=null){
  if(!engine)return;const previous=rememberReading();readingReady=false;const serial=++readerRenderSerial;
  if(reading)renderReader();else if(tab==='search')renderSearch();else if(tab==='explore')renderExplore();else renderSaved();
  document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));if(scroll)window.scrollTo(0,0);
  if(reading)requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(serial!==readerRenderSerial||!reading)return;
   const restore=position||(!scroll&&previous?.b===reading.b&&previous?.c===reading.c?previous:null);
   if(restore)window.GodReadingPosition.restore(restore,document,window);
   else if(scroll&&reading.start>0){const element=$('#verse-'+reading.start);if(element)window.scrollTo(0,window.scrollY+element.getBoundingClientRect().top-16);}
   readingReady=true;rememberReading();
  }));
 }
 function cancelSearch(){requestSerial++;clearTimeout(searchTimer);pendingSearch=null;}
 function commitSearch(found,searchText,scroll){
  reading=null;returnState=null;tab='search';query=searchText;limit=5;results=found;
  saved.history=[query,...saved.history.filter(x=>x!==query)].slice(0,15);persist();render(scroll);
 }
 function receiveAI(request,payload){
  const p=pendingSearch;if(!p||p.request!==request||request!==requestSerial)return;
  clearTimeout(searchTimer);pendingSearch=null;
  const found=payload?.ready&&Array.isArray(payload.items)?engine.semanticSearch(p.query,p.scope,payload,window.GodIntent.interpret(p.query,p.meaning)):engine.search(p.query,p.scope,window.GodIntent.interpret(p.query,p.meaning));
  if(!payload?.ready)toast('AI non disponibile: ricerca per temi e parole.');
  commitSearch(found,p.query,p.scroll);
 }
 function performSearch(q,scroll=true,options={}){
  cancelSearch();query=String(q).trim().slice(0,500);if(!query){toast('Scrivi un tema, una frase o un riferimento.');$('#question')?.focus();return;}
  if(query!==meaningQuery){selectedMeaning=null;skippedMeaning=false;meaningQuery=query;}
  if(options.meaning)selectedMeaning=options.meaning;if(options.skip)skippedMeaning=true;
  const ambiguous=!selectedMeaning&&!skippedMeaning?window.GodIntent.ambiguity(query):null;
  if(ambiguous){clarification=ambiguous;results=null;render();$('#clarification')?.scrollIntoView({block:'center'});return;}
  clarification=null;
  $('#question')?.blur();if(window.SelahAndroid)window.SelahAndroid.hideKeyboard();
  const native=window.SelahAndroid&&typeof window.SelahAndroid.searchAI==='function'&&saved.ai!==false&&aiState!=='unavailable'&&!engine.parseRef(query);
  const button=$('#search-button');if(button){button.disabled=true;button.textContent=native?'Cerco per significato…':'Cerco…';button.setAttribute('aria-busy','true');}
  const request=requestSerial,text=query,currentScope=scope;
  if(native){
   pendingSearch={request,query:text,scope:currentScope,scroll,meaning:selectedMeaning};
   searchTimer=setTimeout(()=>receiveAI(request,{ready:false}),45000);
   try{window.SelahAndroid.searchAI(window.GodIntent.retrievalQuery(text,selectedMeaning),currentScope,request);}catch(e){receiveAI(request,{ready:false});}
  }else searchTimer=setTimeout(()=>{if(request===requestSerial)commitSearch(engine.search(text,currentScope,window.GodIntent.interpret(text,selectedMeaning)),text,scroll);},30);
 }
 function openReader(d){
  const previousPosition=rememberReading(),resume=!d?readingPosition():null;
  returnState={tab,scroll:window.scrollY,reading:reading?{...reading}:null,position:previousPosition,previous:returnState};
  reading={b:d?.b??resume?.b??42,c:d?.c??resume?.c??1,start:d?.start??0,end:d?.end??0};render(true,resume);
 }
 const sheetStack=[];
 function openSheet(title,body,push=false){if(push&&!modal.hidden){sheetStack.push({nodes:[...modal.childNodes],scroll:modal.querySelector('.sheet')?.scrollTop||0,focus:document.activeElement});}else{sheetStack.length=0;lastFocused=document.activeElement;}modal.innerHTML='<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="sheet-head"><h2 id="sheet-title">'+esc(title)+'</h2><button class="close-button" data-action="close" aria-label="Chiudi">×</button></div>'+body+'</section>';modal.hidden=false;document.body.style.overflow='hidden';modal.querySelector('button')?.focus();}
 function closeSheet(all=false){if(noteDoc)saveNote(false);if(!all&&sheetStack.length){const previous=sheetStack.pop();modal.replaceChildren(...previous.nodes);modal.querySelector('.sheet').scrollTop=previous.scroll;previous.focus?.focus({preventScroll:true});return;}sheetStack.length=0;modal.hidden=true;modal.innerHTML='';document.body.style.overflow='';noteDoc=null;lastFocused?.focus({preventScroll:true});}
 function settings(){
  openSheet('Il tuo modo di leggere','<div class="setting-row"><label for="theme-select">Aspetto</label><select id="theme-select"><option value="light" '+(saved.theme!=='dark'?'selected':'')+'>Chiaro</option><option value="dark" '+(saved.theme==='dark'?'selected':'')+'>Scuro</option></select></div><div class="setting-row"><label for="size-select">Dimensione del testo</label><select id="size-select"><option value="normal" '+(!['large','very-large'].includes(saved.size)?'selected':'')+'>Normale</option><option value="large" '+(saved.size==='large'?'selected':'')+'>Grande</option><option value="very-large" '+(saved.size==='very-large'?'selected':'')+'>Molto grande</option></select></div><p class="note-label">La traduzione</p><p>Bibbia Aperta — Open Translation Bible (OTB), italiano 2026. È un progetto recente e aperto, distinto da Nuova Riveduta, CEI e TILC. Per lo studio di un punto delicato è utile confrontare più traduzioni.</p><p class="note-label">Come cerca God Answers</p><p>La ricerca combina il modello AI multilingue con le parole e le espressioni presenti in tutta la Bibbia. Il glossario aiuta a riconoscere il significato dei termini biblici; i risultati tengono conto anche delle note. Funziona sul telefono, senza account né connessione. Se l’AI non è disponibile, l’app lo segnala e usa la ricerca per temi e parole. I risultati sono testi biblici originali: il modello non scrive nuove risposte o versetti.</p><p class="note-label">Le note</p><p>Le 124 schede tematiche originali sono state preparate con assistenza dell’IA. Gli approfondimenti coprono tutti i capitoli: note adattate da Tyndale Open Study Notes, in traduzione italiana automatica confrontabile con l’originale inglese. Le chiavi teologiche dei 66 libri e le domande sono proposte originali di God Answers, distinte dal testo biblico. Quando una nota riguarda un brano più ampio, il suo intervallo è indicato.</p><p class="note-label">Collegamenti e parole</p><p>La quarta scheda raccoglie riferimenti incrociati da OpenBible.info, principalmente dal Treasury of Scripture Knowledge, con licenza CC BY 4.0. Le citazioni sono sempre quelle della Bibbia Aperta inclusa. Le parole blu aprono il glossario di God Answers: 78 voci editoriali con riferimenti per approfondire. I termini possono avere significati diversi secondo il contesto.</p><p class="note-label">I tuoi dati</p><p>Ricerche, preferiti, appunti e punto di lettura rimangono qui. L’app non invia dati e non richiede account o connessione. La disinstallazione elimina questi dati: puoi copiarne una copia di sicurezza.</p><div class="settings-links"><button data-action="backup">Copia backup</button><button data-action="restore">Ripristina backup</button><button data-action="open" data-url="https://www.openbible.uk/it-IT/">Fonte del testo</button><button data-action="open" data-url="https://tyndaleopenresources.com/">Fonte delle note</button><button data-action="open" data-url="https://www.openbible.info/labs/cross-references/">Fonte dei collegamenti</button><button data-action="open" data-url="https://creativecommons.org/licenses/by-sa/4.0/deed.it">Licenza CC BY-SA 4.0</button></div><p class="setting-description">God Answers 0.6.1<br>Testo OTB convertito in indice locale, senza riscritture. Note e codice di God Answers forniti con il progetto. Nessuna affiliazione o approvazione da parte degli autori OTB.</p>');
 }
 function saveNote(show=true){if(!noteDoc)return;const input=$('#personal-note');if(!input)return;const id=noteDoc.id;textOrDelete(saved.notes,id,input.value.slice(0,10000));if(input.value.trim()&&!saved.favorites.includes(id))saved.favorites.push(id);const ok=persist();if(show&&ok)toast('Appunto salvato');}
 function textOrDelete(obj,k,value){if(value.trim())obj[k]=value;else delete obj[k];}
 async function copy(text){if(window.SelahAndroid){window.SelahAndroid.copy(text);return;}try{await navigator.clipboard.writeText(text);toast('Copiato');}catch(e){openSheet('Copia il testo','<textarea class="note-input" readonly>'+esc(text)+'</textarea>');}}
 function back(){if(!modal.hidden){closeSheet();return;}if(clarification){clarification=null;render();return;}cancelSearch();if(reading){const previous=returnState;reading=previous?.reading||null;tab=previous?.tab||tab;returnState=previous?.previous||null;render(true,previous?.position||null);if(!reading)window.scrollTo(0,previous?.scroll||0);return;}if(tab!=='search'){tab='search';render();return;}if(results){results=null;query='';scope='all';render();return;}if(window.SelahAndroid)window.SelahAndroid.exitApp();}
 document.addEventListener('submit',event=>{if(event.target.id==='search-form'){event.preventDefault();performSearch($('#question').value);}});
 document.addEventListener('click',event=>{
  if(event.target===modal){closeSheet();return;}
  const el=event.target.closest('[data-action]');if(!el||el.disabled||!engine)return;event.preventDefault();const a=el.dataset.action,id=el.dataset.id,d=id?getDoc(id):null;
  if(a==='home'||a==='reset'){cancelSearch();clarification=null;selectedMeaning=null;meaningQuery='';reading=null;returnState=null;tab='search';results=null;query='';scope='all';render();}
  if(a==='tab'){cancelSearch();clarification=null;reading=null;returnState=null;tab=el.dataset.tab;render();}
  if(a==='random'){clarification=null;drawRandom();}
  if(a==='change-meaning'){selectedMeaning=null;skippedMeaning=false;performSearch(query);}
  if(a==='clarify')performSearch(query,true,{meaning:el.dataset.meaning});
  if(a==='clarify-skip')performSearch(query,true,{skip:true});
  if(a==='study')openStudy(+el.dataset.book,+el.dataset.chapter,+el.dataset.verse);
  if(a==='word'){
   const b=+el.dataset.book,c=+el.dataset.chapter,v=+el.dataset.verse,verse=engine.getChapter(b,c).find(x=>x[2]===v);if(!verse)return;
   const word=window.GodGlossary.explain(el.dataset.term,{b,c,v,word:el.textContent});if(!word)return;
   openSheet(word.label,'<p class="word-location">'+esc(engine.bible.books[b]+' '+c+':'+v)+'</p><p class="word-meaning">'+esc(word.meaning)+'</p><p class="word-attention">'+esc(word.attention)+'</p><details class="word-read-more"><summary>Un riferimento per approfondire</summary><div class="word-references">'+word.references.map(([rb,rc,rs,re])=>'<button class="text-button" data-action="linked-passage" data-target="'+[rb,rc,rs,rb,rc,re].join('_')+'">'+esc(engine.bible.books[rb]+' '+rc+':'+rs+(rs!==re?'–'+re:''))+' →</button>').join('')+'</div></details><p class="word-credit">Glossario di God Answers · spiegazione distinta dal testo biblico.</p>',!modal.hidden);
   modal.querySelector('.sheet').classList.add('word-sheet');
  }
  if(a==='linked-passage'){
   const target=el.dataset.target.split('_').map(Number),p=window.GodCrossrefs.passage(target);if(!p)return;
   openSheet(p.ref,'<div class="verse-text linked-preview">'+p.verses.map(v=>'<p><sup>'+esc(engine.bible.books[v[0]]+' '+v[1]+':'+v[2])+'</sup>'+wordHTML(v)+'</p>').join('')+'</div>'+(p.total>p.verses.length?'<p class="tiny">Sono mostrati i primi '+p.verses.length+' versetti del riferimento. Prosegui nei capitoli per leggere il seguito.</p>':'')+'<p class="edition">Bibbia Aperta · OTB 2026</p><button class="primary" data-action="linked-reader" data-target="'+target.join('_')+'">Leggi nel capitolo →</button>',!modal.hidden);
  }
  if(a==='linked-reader'){const p=window.GodCrossrefs.passage(el.dataset.target.split('_').map(Number),1);if(p){closeSheet(true);cancelSearch();openReader(p);}}
  if(a==='related-more'){
   const parent=el.closest('.crossrefs-panel'),args={b:+el.dataset.book,c:+el.dataset.chapter,start:+el.dataset.start,end:+el.dataset.end},limit=+el.dataset.limit;el.disabled=true;
   window.GodCrossrefs.get(args).then(rows=>{if(parent.isConnected){const wrapper=document.createElement('div');wrapper.innerHTML=window.GodStudy.relatedHTML(args,rows,limit);parent.replaceWith(wrapper.firstElementChild);}}).catch(()=>{el.disabled=false;toast('Non riesco ad aprire altri collegamenti. Riprova.');});
  }

  if(a==='study-tab'){const parent=el.closest('.study-view');if(parent){parent.querySelectorAll('[data-study-tab]').forEach(x=>{x.setAttribute('aria-selected',String(x===el));x.tabIndex=x===el?0:-1;});parent.querySelectorAll('[data-study-panel]').forEach(x=>x.hidden=x.dataset.studyPanel!==el.dataset.studyTab);}}
  if(a==='question'){scope='all';performSearch(el.dataset.query);}
  if(a==='scope'){scope=el.dataset.scope;performSearch(query,false);}
  if(a==='more'){const y=window.scrollY;limit+=5;render(false);window.scrollTo(0,y);}
  if(a==='save'&&d){const isSaved=saved.favorites.includes(id);saved.favorites=isSaved?saved.favorites.filter(x=>x!==id):[...saved.favorites,id];if(persist()){toast(isSaved?'Rimosso dai salvati':'Passo salvato');if(tab==='saved')render(false);else{el.classList.toggle('saved',!isSaved);el.setAttribute('aria-pressed',String(!isSaved));el.setAttribute('aria-label',isSaved?'Salva il passo':'Rimuovi dai salvati');}}}
  if(a==='note'&&d){noteDoc=d;openSheet('Il tuo appunto','<p class="reference">'+esc(d.ref)+'</p><p>'+esc(shortText(d.verses.map(v=>window.GodScripture.plain(v[3],' ')).join(' '),280))+'</p><label for="personal-note" class="tiny">Che cosa ti lascia questo passo?</label><textarea id="personal-note" class="note-input" maxlength="10000" placeholder="Scrivi liberamente…">'+esc(saved.notes[id]||'')+'</textarea><button class="primary" data-action="save-note">Salva appunto</button><p class="setting-description">L’appunto viene conservato anche chiudendo questa finestra.</p>');}
  if(a==='save-note'){saveNote();noteDoc=null;closeSheet();render(false);}
  if(a==='chapter'&&d)openReader(d);
  if(a==='reader')openReader();
  if(a==='passage'&&d){cancelSearch();query=engine.bible.books[d.b]+' '+d.c+':'+d.start+'-'+d.end;tab='search';reading=null;returnState=null;results={direct:true,topics:[],items:[{doc:d,score:100}]};render();}
  if(a==='copy'&&d)copy(d.ref+' — Bibbia Aperta, OTB 2026\n\n'+d.verses.map(v=>v[2]+' '+window.GodScripture.plain(v[3])).join('\n')+'\n\nOpen Translation Bible · CC BY-SA 4.0\nhttps://www.openbible.uk/it-IT/');
  if(a==='settings')settings();if(a==='close')closeSheet();if(a==='back')back();
  if(a==='next-chapter'||a==='prev-chapter'){let {b,c}=reading;c+=a==='next-chapter'?1:-1;if(c>engine.bible.counts[b]){b++;c=1;}if(c<1){b--;c=engine.bible.counts[b];}if(b>=0&&b<66){reading={b,c,start:0,end:0};render();}}
  if(a==='open'){if(window.SelahAndroid)window.SelahAndroid.open(el.dataset.url);else window.open(el.dataset.url,'_blank','noopener,noreferrer');}
  if(a==='backup')copy(JSON.stringify({app:'selah',version:1,data:saved},null,2));
  if(a==='restore')openSheet('Ripristina i tuoi appunti','<p>Incolla un backup dell’app. I passi e gli appunti vengono aggiunti a quelli già presenti; per lo stesso passo prevale l’appunto del backup.</p><textarea id="backup-input" class="note-input" placeholder="Incolla qui il backup JSON"></textarea><button class="primary" data-action="restore-now">Importa backup</button>');
  if(a==='restore-now'){try{const backup=JSON.parse($('#backup-input').value);if(backup.app!=='selah'||backup.version!==1||!backup.data)throw Error();const data=backup.data;if(!Array.isArray(data.favorites)||!data.notes||typeof data.notes!=='object'||Array.isArray(data.notes))throw Error();saved.favorites=[...new Set([...saved.favorites,...data.favorites.filter(x=>typeof x==='string'&&!!engine.get(x))])];Object.entries(data.notes).forEach(([k,v])=>{if(engine.get(k)&&typeof v==='string')saved.notes[k]=v.slice(0,10000);});const position=window.GodReadingPosition.valid(data.readingPosition);if(position)saved.readingPosition=position;if(persist()){closeSheet();render(false);toast('Backup importato');}}catch(e){toast('Il testo non è un backup valido di God Answers.');}}
 });
 document.addEventListener('toggle',event=>{if(event.target.matches('details.card-details')&&event.target.open){const container=event.target.querySelector('.study-view');if(container)fillStudy(container,getDoc(container.dataset.studyId));}},true);
 document.addEventListener('change',event=>{const el=event.target;if(el.id==='theme-select'){saved.theme=el.value;applySettings();persist();}if(el.id==='size-select'){const position=rememberReading();saved.size=el.value;applySettings();persist();if(position)requestAnimationFrame(()=>window.GodReadingPosition.restore(position,document,window));}if(el.id==='book-picker'){reading={b:+el.value,c:1,start:0,end:0};render();}if(el.id==='chapter-picker'){reading.c=+el.value;reading.start=0;reading.end=0;render();}});
 document.addEventListener('keydown',e=>{if(e.target.matches('[data-study-tab]')&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const buttons=[...e.target.parentElement.querySelectorAll('[data-study-tab]')],i=buttons.indexOf(e.target),next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[next].focus();buttons[next].click();return;}if(e.key==='Escape'){e.preventDefault();back();}if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&e.target.id==='question'){e.preventDefault();performSearch(e.target.value);}if(e.key==='Tab'&&!modal.hidden){const focus=[...modal.querySelectorAll('button,textarea,select,a,input,summary,[tabindex]')].filter(x=>!x.disabled&&x.tabIndex>=0&&x.getClientRects().length);const first=focus[0],last=focus[focus.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
 window.addEventListener('scroll',()=>{if(!readingReady)return;clearTimeout(readingTimer);readingTimer=setTimeout(rememberReading,250);},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){rememberReading();if(noteDoc)saveNote(false);}});
 window.addEventListener('pagehide',()=>{rememberReading();if(noteDoc)saveNote(false);});
 window.Selah={back,receiveAI};applySettings();
 function refreshAiStatus(){try{aiState=window.SelahAndroid?.aiStatus?window.SelahAndroid.aiStatus():'unavailable';}catch(e){aiState='unavailable';}const el=$('#ai-label');if(el)el.textContent=aiLabel();}
 refreshAiStatus();
 const aiStatusTimer=setInterval(()=>{refreshAiStatus();if(aiState!=='loading')clearInterval(aiStatusTimer);},600);
 try{engine=window.SelahSearch.create(window.SELAH_BIBLE,window.SELAH_CONTENT);window.__selahEngine=engine;render();document.querySelector('#launch-screen')?.remove();}
 catch(e){document.querySelector('#launch-screen')?.remove();console.error(e);main.innerHTML='<div class="empty"><h2>Il testo non si è caricato.</h2><p>Chiudi e riapri God Answers. Se il problema rimane, reinstalla l’APK senza cancellare i dati.</p></div>';}
})();
