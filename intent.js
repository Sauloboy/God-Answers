(function(g){
 'use strict';
 const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,' ').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
 const meanings={
  forgive_self:['Perdonare me stesso','Colpa, vergogna e possibilità di ricominciare','Riconoscere un mio errore e trovare misericordia, perdono e possibilità di cambiare.',['peccato','perdono','misericordia']],
  forgive_others:['Perdonare un’altra persona','Un torto ricevuto, rabbia o rancore','Perdonare chi mi ha ferito e rinunciare alla vendetta senza negare la sua responsabilità.',['perdono','rabbia']],
  receive_forgiveness:['Chiedere o ricevere perdono','Un errore per cui assumermi responsabilità','Ho fatto del male: riconoscere la mia responsabilità, chiedere perdono e ricominciare.',['perdono','peccato']],
  faith:['La fede in Dio','Dubbi, incredulità o distanza da Dio','Dubbi sulla fede e difficoltà a credere in Dio. Cercare senza fingere certezze.',['dubbio','preghiera']],
  people:['La fiducia nelle persone','Delusioni, amicizie e rapporti','Fidarsi delle persone dopo delusioni e tradimenti. Amicizia, lealtà e ascolto.',['amicizia','relazioni']],
  direction:['Una scelta o una direzione','Capire come andare avanti','Saggezza e discernimento per una decisione difficile e per il futuro.',['saggezza','speranza']],
  loneliness:['Solitudine e appartenenza','Sentirmi visto e trovare un posto','Sentirsi soli ed esclusi. Presenza, accoglienza e valore di ogni persona nella comunità.',['solitudine','comunita']],
  grief:['La perdita di una persona','Dolore, lutto e vicinanza','Il dolore per una persona cara che è morta. Conforto nel lutto e speranza senza negare le lacrime.',['morte','sofferenza']],
  afterlife:['Che cosa viene dopo','Risurrezione e vita oltre la morte','La risurrezione e la speranza della vita oltre la morte secondo Gesù e il Nuovo Testamento.',['morte','speranza']],
  fear_death:['La paura della morte','Il limite della vita e la fiducia','La paura di morire, il limite della vita e la fiducia davanti alla morte.',['morte','paura']],
  future:['Il futuro che mi preoccupa','L’incertezza di ciò che deve accadere','L’ansia per il futuro e per ciò che potrebbe andare male. Vivere un giorno alla volta.',['paura','speranza']],
  end_world:['La fine del mondo','Apocalisse, giudizio e nuova creazione','Le immagini della fine, il giudizio e la nuova creazione nell’Apocalisse.',['apocalisse','speranza']],
  free_choice:['Libertà di scegliere','Responsabilità e libero arbitrio','Scelte libere, libero arbitrio e responsabilità personale senza fatalismo.',['liberta']],
  release:['Liberarmi da ciò che mi domina','Abitudini, dipendenze o pressioni','Essere liberi da ciò che ci domina, dal peccato e dalle abitudini distruttive.',['liberta','peccato']]
 };
 Object.entries(meanings).forEach(([id,m])=>meanings[id]={id,label:m[0],hint:m[1],focus:m[2],topics:m[3]});
 function explicit(text){
  const q=norm(text);
  if(/perdon/.test(q)){
   if(/farmi perdon|chiedere perdono|ricevere perdono/.test(q))return meanings.receive_forgiveness;
   if(/perdonarm|perdonare me|me stess|mi vergogno|ho sbagliato|senso di colpa/.test(q))return meanings.forgive_self;
   if(/perdonarl|perdonare (chi|qualcuno|un |una |mio |mia )|mi ha|mi hanno|rancor|tradit|torto/.test(q))return meanings.forgive_others;
  }
  if(/vendic|farla pagare|punire chi|restituire il male/.test(q))return meanings.forgive_others;
  if(/credo|creder|fede|fiducia|fidar|fido|fidi|fidiamo|fidate|fidano/.test(q)){
   const faith=/\b(dio|gesu|cristo|religione|ateo|fede)\b/.test(q),people=/person|amic|fidanzat|colleg|gente|chi ho accanto|chi mi sta accanto|nessuno/.test(q);
   if(faith&&!people)return meanings.faith;if(people&&!faith)return meanings.people;
  }
  const family='(?:padre|madre|mamma|papa|fratello|sorella|nonno|nonna|amico|amica|persona cara|figlio|figlia|moglie|marito)';
  if(/\b(morto|morta|morte|lutto|funerale|scomparsa)\b/.test(q)&&new RegExp('\\b'+family+'\\b').test(q)||new RegExp('\\bperso (?:mio |mia |il |la |un |una )?'+family+'\\b').test(q))return meanings.grief;
  if(/paura (di morire|della morte)|terrore (di morire|della morte)/.test(q))return meanings.fear_death;
  if(/libero arbitrio|liberta di scegl|gia tutto deciso/.test(q))return meanings.free_choice;
  return null;
 }
 function ambiguity(text){
  if(explicit(text))return null;const q=norm(text);let ids,title;
  if(/^(il )?perdono$|^(come|vorrei|voglio|non riesco a|e possibile|posso) perdonare$|^ho bisogno di perdono$/.test(q)){ids=['forgive_others','forgive_self','receive_forgiveness'];title='Di quale perdono vuoi parlare?';}
  else if(/^(non credo piu|non riesco a credere|ho perso la fiducia|vorrei fidarmi|come ritrovare la fiducia|fiducia)$/.test(q)){ids=['faith','people'];title='Intendi la fede o la fiducia nelle persone?';}
  else if(/^(mi sento perso|mi sento persa|non so piu dove andare|mi manca una direzione)$/.test(q)){ids=['direction','faith','loneliness'];title='Che cosa senti più vicino a ciò che stai vivendo?';}
  else if(/^(la )?morte$|^parlami della morte$/.test(q)){ids=['grief','afterlife','fear_death'];title='Quale aspetto della morte vuoi approfondire?';}
  else if(/^(la fine|ho paura della fine|la fine di tutto)$/.test(q)){ids=['future','fear_death','end_world'];title='A quale “fine” stai pensando?';}
  else if(/^(la )?liberta$|^cosa significa essere liberi$/.test(q)){ids=['free_choice','release'];title='Quale libertà vuoi approfondire?';}
  return ids?{title,description:'Un dettaglio mi aiuta a cercare passi più pertinenti.',choices:ids.map(id=>meanings[id])}:null;
 }
 function interpret(q,id){return meanings[id]||explicit(q);}
 function retrievalQuery(q,id){const expanded=!id&&g.GodRetrieval?g.GodRetrieval.expandQuery(q):String(q);if(expanded!==String(q))return expanded;const m=interpret(q,id);return (m?m.focus+' Situazione descritta: '+q:String(q)).slice(0,500);}
 g.GodIntent={ambiguity,explicit,interpret,retrievalQuery,meanings,norm};
})(typeof window==='undefined'?globalThis:window);
