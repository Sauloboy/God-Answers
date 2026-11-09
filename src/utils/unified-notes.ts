import type { StudyData } from '../types/god-answers';

/**
 * Normalizes English book abbreviations, mechanical translations, and wooden calques
 * into direct, elegant, and flawless Italian biblical prose.
 */
export function polishItalian(text: string): string {
  if (!text) return '';

  let s = text;

  // 1. Abbreviazioni e citazioni bibliche dall'inglese all'italiano standard
  const bibleRefs: [RegExp, string][] = [
    [/\b1\s*Kgs\b/g, '1 Re'],
    [/\b2\s*Kgs\b/g, '2 Re'],
    [/\b1\s*Sam\b/g, '1 Samuele'],
    [/\b2\s*Sam\b/g, '2 Samuele'],
    [/\b1\s*Chr\b/g, '1 Cronache'],
    [/\b2\s*Chr\b/g, '2 Cronache'],
    [/\bMatt\b/g, 'Matteo'],
    [/\bMark\b/g, 'Marco'],
    [/\bLuke\b/g, 'Luca'],
    [/\bJohn\b/g, 'Giovanni'],
    [/\bRom\b/g, 'Romani'],
    [/\b1\s*Cor\b/g, '1 Corinzi'],
    [/\b2\s*Cor\b/g, '2 Corinzi'],
    [/\bGal\b/g, 'Galati'],
    [/\bEph\b/g, 'Efesini'],
    [/\bPhil\b/g, 'Filippesi'],
    [/\bCol\b/g, 'Colossesi'],
    [/\b1\s*Thess\b/g, '1 Tessalonicesi'],
    [/\b2\s*Thess\b/g, '2 Tessalonicesi'],
    [/\b1\s*Tim\b/g, '1 Timoteo'],
    [/\b2\s*Tim\b/g, '2 Timoteo'],
    [/\bTitus\b/g, 'Tito'],
    [/\bPhilem\b/g, 'Filemone'],
    [/\bHeb\b/g, 'Ebrei'],
    [/\bJames\b/g, 'Giacomo'],
    [/\b1\s*Pet\b/g, '1 Pietro'],
    [/\b2\s*Pet\b/g, '2 Pietro'],
    [/\b1\s*John\b/g, '1 Giovanni'],
    [/\b2\s*John\b/g, '2 Giovanni'],
    [/\b3\s*John\b/g, '3 Giovanni'],
    [/\bJude\b/g, 'Giuda'],
    [/\bRev\b/g, 'Apocalisse'],
    [/\bGen\b/g, 'Genesi'],
    [/\bExod\b/g, 'Esodo'],
    [/\bLev\b/g, 'Levitico'],
    [/\bNum\b/g, 'Numeri'],
    [/\bDeut\b/g, 'Deuteronomio'],
    [/\bJosh\b/g, 'Giosuè'],
    [/\bJudg\b/g, 'Giudici'],
    [/\bRuth\b/g, 'Rut'],
    [/\bNeh\b/g, 'Neemia'],
    [/\bEsth\b/g, 'Ester'],
    [/\bJob\b/g, 'Giobbe'],
    [/\bPss?\b/g, 'Salmi'],
    [/\bProv\b/g, 'Proverbi'],
    [/\bEccl\b/g, 'Ecclesiaste'],
    [/\bSong\b/g, 'Cantico dei Cantici'],
    [/\bIsa\b/g, 'Isaia'],
    [/\bJer\b/g, 'Geremia'],
    [/\bLam\b/g, 'Lamentazioni'],
    [/\bEzek\b/g, 'Ezechiele'],
    [/\bDan\b/g, 'Daniele'],
    [/\bHos\b/g, 'Osea'],
    [/\bJoel\b/g, 'Gioele'],
    [/\bAmos\b/g, 'Amos'],
    [/\bObad\b/g, 'Abdia'],
    [/\bJonah\b/g, 'Giona'],
    [/\bMic\b/g, 'Michea'],
    [/\bNah\b/g, 'Naum'],
    [/\bHab\b/g, 'Abacuc'],
    [/\bZeph\b/g, 'Sofonia'],
    [/\bHag\b/g, 'Aggeo'],
    [/\bZech\b/g, 'Zaccaria'],
    [/\bMal\b/g, 'Malachia'],
    [/\bC\.\s*C\.\b/gi, 'cfr.'],
    [/\bcp\./gi, 'cfr.'],
    [/\bcp\b/gi, 'cfr.'],
    [/\bsee also\b/gi, 'vedi anche'],
    [/\bsee\b/gi, 'vedi'],
    [/\bchs\b/gi, 'capp.'],
    [/\bch\b/gi, 'cap.'],
    [/\b(\d+)\s*BC\b/gi, '$1 a.C.'],
    [/\b(\d+)\s*AD\b/gi, '$1 d.C.'],
  ];

  for (const [pattern, replacement] of bibleRefs) {
    s = s.replace(pattern, replacement);
  }

  // 2. Correzione di calchi meccanici, frasi legnose e stile indiretto
  const phraseFixes: [RegExp, string][] = [
    // Grammatica ed errori palesi
    [/non ha scritto tutti loro/gi, 'non li ha scritti tutti'],
    [/non ha scritto tutti essi/gi, 'non li ha composti tutti'],
    [/non solo resistere alla saggezza, ma anche ridiculi esso/gi, 'non solo respingono la sapienza, ma la deridono apertamente'],
    [/ridiculi esso/gi, 'lo scherniscono apertamente'],
    [/ridiculi\b/gi, 'schernire'],
    [/semplicitoni/gi, 'giovani inesperti'],
    [/semplicione/gi, 'inesperto'],
    [/Mockers/gi, 'Gli schernitori'],
    [/mockers/gi, 'schernitori'],
    [/Fools/gi, 'Gli insensati'],
    [/fools/gi, 'insensati'],
    [/Folly/gi, 'Stoltezza'],
    [/folly/gi, 'stoltezza'],
    [/Tesoro dei miei comandi/gi, 'Custodire i miei precetti'],
    [/tesoro dei comandi/gi, 'custodire i comandamenti'],
    [/Per assicurare il debito di un'altra persona è quello di garantire con i propri possedimenti/gi, 'Farsi garante del debito altrui significa impegnare i propri beni'],
    [/Per assicurare il debito di un'altra persona è quello di garantire/gi, 'Farsi garante del debito altrui significa impegnare i propri beni'],
    [/trasformare un profitto/gi, 'trarre un guadagno'],
    [/il rischio è troppo grande per prendere;/gi, 'il rischio è troppo grande da correre;'],
    [/il rischio è troppo grande per prendere/gi, 'il rischio è troppo grande da assumersi'],
    [/Salvati:/gi, 'Mettiti in salvo:'],
    [/mentre custodite i vostri occhi/gi, 'come la pupilla dei tuoi occhi'],
    [/wink\s*\.\s*\.\s*nudge\s*\.\s*\.\s*wiggle/gi, 'Fare l\'occhiolino, ammiccare o fare cenni coi piedi per ingannare'],
    [/Dormire extra\s*\.\s*\.\s*più sonno sarcasticamente esprime/gi, 'Dormire ancora un po\', sonnecchiare: esprime con sarcasmo'],
    [/Dormire extra/gi, 'Dormire ancora un po\''],
    [/più sonno sarcasticamente/gi, 'il prolungarsi del sonno esprime sarcasticamente'],
    [/sesso non deve essere condiviso con gli estranei/gi, 'l\'intimità coniugale non deve essere profanata con estranei'],
    [/sesso non deve essere condiviso/gi, 'l\'intimità coniugale non va profanata'],
    [/donna di nome Folly/gi, 'la personificazione della Stoltezza'],
    [/donna chiamata Folly/gi, 'la Stoltezza personificata'],
    [/donna chiamata Sapienza/gi, 'la Sapienza personificata'],
    [/dispositivo \(chiamato parallelismo numerico\)/gi, 'artificio poetico (detto parallelismo numerico)'],
    [/Inseguendo un altro uomo/gi, 'Andando dietro a un altro uomo'],
    [/prima autorità sulla saggezza israelita/gi, 'massima figura della tradizione sapienziale d\'Israele'],
    [/letteratura saggezza/gi, 'letteratura sapienziale'],
    [/scrittura saggezza/gi, 'scritti sapienziali'],
    [/differenti lettori ai quali è indirizzato/gi, 'destinatari a cui l\'opera è rivolta'],
    [/parole come giuste, giuste e giuste/gi, 'termini come giustizia, equità e rettitudine'],
    [/chiama apertamente e pubblicamente/gi, 'fa udire la propria voce nelle piazze'],
    [/non solo resistere alla saggezza/gi, 'non si limitano a rifiutare la sapienza'],
    [/avverte il suo bambino/gi, 'ammonisce il proprio figlio'],
    [/incoraggiano il loro bambino/gi, 'esortano il proprio figlio'],
    [/I semplici sono come contenitori vuoti/gi, 'I giovani inesperti sono pronti a essere formati dalla sapienza o traviati dalla stoltezza'],
    [/Non c'è un mezzo di mezzo/gi, 'Non vi è via di mezzo'],
    [/Un rapporto intimo con la Sapienza significa entrare in un rapporto intimo con Dio/gi, 'Accogliere intimamente la Sapienza significa entrare in comunione profonda con Dio'],
    [/Il popolo malvagio subisce le conseguenze/gi, 'I malvagi subiscono le conseguenze'],
    [/La paura del Signore/gi, 'Il timore del Signore'],
    [/la paura del Signore/gi, 'il timore del Signore'],
    [/Paura del Signore/gi, 'Timore del Signore'],
    [/la paura di Dio/gi, 'il timore di Dio'],
    [/paura di Dio/gi, 'timore di Dio'],
    [/Sette volte è probabilmente un modo di dire una grande quantità/gi, 'L\'espressione «sette volte» indica simbolicamente una restituzione totale e senza scampo'],
    [/I giovani ingenui, non ancora messi in mezzo alla loro strada/gi, 'I giovani inesperti, che non hanno ancora consolidato il proprio cammino morale'],
    [/Solo obbedienza che viene dal cuore durerà/gi, 'Solo l\'obbedienza sincera che sgorga dal cuore rimane salda nel tempo'],
    [/La saggezza amorosa non lascerà spazio/gi, 'L\'amore per la sapienza custodisce il cuore e non lascia spazio'],
    [/beviamo il nostro pieno d'amore/gi, "inebriamoci d'amore"],

    // Termini lessicali biblici e teologici
    [/\bquesto passaggio\b/gi, 'questo passo'],
    [/\bnel passaggio\b/gi, 'nel passo'],
    [/\bin questo verso\b/gi, 'in questo versetto'],
    [/\bquesto verso\b/gi, 'questo versetto'],
    [/\bnel verso\b/gi, 'nel versetto'],
    [/\bi versi\b/gi, 'i versetti'],
    [/\bil verso\b/gi, 'il versetto'],
    [/\bparole di saggezza\b/gi, 'parole di sapienza'],
    [/\bla saggezza di Dio\b/gi, 'la sapienza di Dio'],
    [/\bacquisizione della saggezza\b/gi, 'ricerca della sapienza'],
    [/\bfa senso\b/gi, 'ha senso'],

    // Semplificazioni di stile diretto (anti-legnoso)
    [/\bal fine di\b/gi, 'per'],
    [/\ballo scopo di\b/gi, 'per'],
    [/\bin modo tale da\b/gi, 'così da'],
    [/\bè importante notare che\b/gi, 'va notato che'],
    [/\bè da notare che\b/gi, 'va notato che'],
    [/\bha a che fare con\b/gi, 'riguarda'],
    [/\bè in grado di\b/gi, 'può'],
    [/\bè inteso per\b/gi, 'è rivolto a'],
    [/\bè inteso a\b/gi, 'mira a'],
    [/\bprende il suo inizio\b/gi, 'ha origine'],
    [/\bdare per scontato\b/gi, 'dare per certo'],
    [/\bper mezzo di\b/gi, 'mediante'],
    [/\bha la funzione di\b/gi, 'serve a'],
    [/\bha avuto luogo\b/gi, 'è avvenuto'],
    [/\bha preso luogo\b/gi, 'è avvenuto'],
    [/\ba causa del fatto che\b/gi, 'poiché'],
    [/\bnonostante il fatto che\b/gi, 'sebbene'],
    [/\bciascuno e ognuno\b/gi, 'ciascuno'],
    [/\btutti quanti loro\b/gi, 'tutti loro'],
    [/\besso rappresenta\b/gi, 'rappresenta'],
    [/\besso è\b/gi, 'è'],
    [/\bessa rappresenta\b/gi, 'rappresenta'],
    [/\bessa è\b/gi, 'è'],

    // Pulizia punteggiatura interna
    [/\s+\.\s+\.\s+\.\s+/g, '… '],
    [/\s+\.\s+\.\s+/g, '… '],
    [/^\/\/\s*/gm, ''],
  ];

  for (const [pattern, replacement] of phraseFixes) {
    s = s.replace(pattern, replacement);
  }

  return s;
}

/**
 * Ensures that every sentence and paragraph finishes with complete and proper punctuation.
 * Eliminates truncated endings, dangling hyphens, orphan colons, and missing periods.
 */
export function ensureProperPunctuation(html: string): string {
  if (!html) return '';

  let s = html;

  // 1. Tag di chiusura </p>, </li>, </blockquote>, </h4> preceduti da caratteri alfanumerici senza punto
  s = s.replace(/([a-zA-Z0-9\u00C0-\u017F»”'’)])\s*<\/(p|li|h4|blockquote)>/g, '$1.</$2>');

  // 2. Tag di chiusura preceduti da virgola, punto e virgola o trattino: trasformali in punto finale
  s = s.replace(/[,;\-–—]\s*<\/(p|li|h4|blockquote)>/g, '.</$1>');

  // 3. Due punti isolati alla fine di un paragrafo (es. 'Mettiti in salvo:</p>') -> se la frase termina lì, chiudila
  s = s.replace(/:\s*<\/(p|li|blockquote)>/g, '.</$1>');

  // 4. Ripara doppi punti ripetuti '..' -> '.'
  s = s.replace(/\.{2,}(?![\.])/g, '.');

  // 5. Ripara puntini di sospensione seguiti da punto '….' -> '…'
  s = s.replace(/…\./g, '…');

  // 6. Spazio mancante dopo la punteggiatura prima di una lettera maiuscola (es. 'Signore.Questo' -> 'Signore. Questo')
  s = s.replace(/([.!?])([A-Z\u00C0-\u00DC])/g, '$1 $2');

  // 7. Rimuove trattini pendenti isolati alla fine
  s = s.replace(/\s+-\s+<\//g, '.</');

  return s;
}

/**
 * Strips HTML tags to extract raw plain text for duplicate comparison
 */
function toTextSnippet(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 80);
}

/**
 * Unifies Context, Analysis, and Notes into a single coherent, non-redundant,
 * direct, and perfectly punctuated Italian document.
 */
export function buildUnifiedNotesHtml(studyData: StudyData): string {
  if (!studyData) return '';

  const seenSnippets = new Set<string>();

  // Estrai gli articoli dalle note di origine
  const extractArticles = (html: string): string[] => {
    const matches = html.match(/<article class="study-source-note"[\s\S]*?<\/article>/gi);
    return matches || [];
  };

  // Contesto storico e letterario
  let cleanContext = studyData.context || '';
  const contextArticles = extractArticles(cleanContext);
  for (const art of contextArticles) {
    const snip = toTextSnippet(art);
    if (snip) seenSnippets.add(snip);
  }

  // Note esegetiche: rimuovi duplicati già presenti nel contesto
  let cleanNotes = studyData.notes || '';
  const notesArticles = extractArticles(cleanNotes);
  const uniqueNotesArticles: string[] = [];
  for (const art of notesArticles) {
    const snip = toTextSnippet(art);
    if (snip && !seenSnippets.has(snip)) {
      seenSnippets.add(snip);
      uniqueNotesArticles.push(art);
    }
  }

  if (notesArticles.length > 0) {
    cleanNotes = uniqueNotesArticles.join('\n');
  }

  // Analisi: controlla se l'articolo "Il nodo da comprendere" è già stato mostrato
  let cleanAnalysis = studyData.analysis || '';
  const analysisArticles = extractArticles(cleanAnalysis);
  for (const art of analysisArticles) {
    const snip = toTextSnippet(art);
    if (snip && seenSnippets.has(snip)) {
      cleanAnalysis = cleanAnalysis.replace(new RegExp(`<h3>Il nodo da comprendere<\\/h3>\\s*${escapeRegex(art)}`, 'gi'), '');
      cleanAnalysis = cleanAnalysis.replace(art, '');
    } else if (snip) {
      seenSnippets.add(snip);
    }
  }

  // Verifica nota curata ripetuta
  const curatedMatch = cleanNotes.match(/<h3>La nota di God Answers<\/h3>([\s\S]*?)<\/p>/i);
  if (curatedMatch && curatedMatch[1]) {
    const curatedSnip = toTextSnippet(curatedMatch[1]);
    if (curatedSnip && cleanAnalysis.includes(curatedMatch[1])) {
      cleanNotes = cleanNotes.replace(curatedMatch[0], '');
    }
  }

  // 1. Applica prima la normalizzazione linguistica per un italiano fluido e diretto
  cleanContext = polishItalian(cleanContext);
  cleanAnalysis = polishItalian(cleanAnalysis);
  cleanNotes = polishItalian(cleanNotes);

  // 2. Garantisci che nessuna frase resti troncata o priva di punto finale
  cleanContext = ensureProperPunctuation(cleanContext);
  cleanAnalysis = ensureProperPunctuation(cleanAnalysis);
  cleanNotes = ensureProperPunctuation(cleanNotes);

  return `
    <div class="unified-notes-sheet">
      <!-- 1. Contesto storico e letterario -->
      ${cleanContext ? `
        <div class="unified-note-block block-context">
          <div class="block-label">Contesto storico e letterario</div>
          <div class="block-body">${cleanContext}</div>
        </div>
      ` : ''}

      <!-- 2. Analisi del testo e comprensione -->
      ${cleanAnalysis ? `
        <div class="unified-note-block block-analysis">
          <div class="block-label">Analisi e comprensione del brano</div>
          <div class="block-body">${cleanAnalysis}</div>
        </div>
      ` : ''}

      <!-- 3. Note esegetiche e particolarità del testo -->
      ${cleanNotes.trim() ? `
        <div class="unified-note-block block-notes">
          <div class="block-label">Note esegetiche e particolarità del testo</div>
          <div class="block-body">${cleanNotes}</div>
        </div>
      ` : ''}
    </div>
  `.trim();
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
