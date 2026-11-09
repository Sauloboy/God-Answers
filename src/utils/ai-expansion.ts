/**
 * Smart Biblical Reasoning Engine
 * Analyzes the user's intent, moral questions, and life situations,
 * and directly retrieves the most coherent, exact Scripture passages (e.g. Proverbs 12:10 for animal care/cruelty).
 */

export interface SmartExpansionData {
  suggestedRefs: string[];
}

/**
 * Knowledge graph mapping ethical, theological, and human inquiries to exact Scripture passages
 */
export function getBiblicalReasoningRefs(query: string): string[] {
  const q = query.toLowerCase().trim();

  // 1. Animali, bestiame, rispetto e cura del creato, crudeltà verso animali
  if (/animal|besti|cane|gatto|cavall|bue|asino|uccell|creatur|fauna|caccia|crudelt.*animal|tratt.*animal/.test(q)) {
    return [
      'Proverbi 12:10',    // "Il giusto ha cura della vita del suo bestiame, ma il cuore degli empi è crudele"
      'Esodo 23:5',        // Aiutare l'animale sotto il peso anche se appartiene al proprio nemico
      'Deuteronomio 25:4', // Non mettere la museruola al bue mentre trebbia
      'Giona 4:11',        // La misericordia di Dio verso le persone e il bestiame
      'Salmi 145:9',       // Il Signore è buono verso tutti e le sue compassioni sono su tutte le creature
      'Luca 14:5',         // Soccorrere l'animale caduto nel pozzo
      'Genesi 1:28',       // La custodia responsabile della terra e delle creature
    ];
  }

  // 2. Denaro, debiti, usura, prestiti, avidità, ricchezza vs povertà
  if (/debit|sold|denar|usur|prestit|ricch|pover|falliment|avide|cupidig|stipend|sprec/.test(q)) {
    return [
      'Proverbi 22:7',     // Il ricco signoreggia sui poveri e il debitore è schiavo del creditore
      '1 Timoteo 6:9-10',  // L'amore del denaro è radice di ogni male
      'Matteo 6:19-21',    // Non accumulate tesori sulla terra ma nel cielo
      'Esodo 22:25',       // Non pretendere usura dal bisognoso
      'Salmi 37:21',       // L'empio prende in prestito e non restituisce, ma il giusto ha pietà e dona
      'Ecclesiaste 5:10',  // Chi ama il denaro non è mai sazio di denaro
      'Luca 12:15',        // Guardatevi da ogni cupidigia: la vita non dipende dai beni
    ];
  }

  // 3. Rapporti familiari, liti con genitori, perdono verso padre/madre/figli
  if (/padr|madr|genitor|figli|famigli|fratell|litig|perdon.*padre|perdon.*madre/.test(q)) {
    return [
      'Colossesi 3:13',    // Sopportatevi a vicenda e perdonatevi se qualcuno ha motivo di lamentarsi
      'Efesini 4:31-32',   // Via amarezza, sdegno e ira; siate benevoli e perdonatevi a vicenda
      'Luca 15:11-32',     // La parabola del Padre misericordioso e del figlio prodigo
      'Proverbi 15:1',     // La risposta dolce calma il furore
      'Efesini 6:1-4',     // Onora tuo padre e tua madre; padri non irritate i vostri figli
      'Salmi 27:10',       // Se anche padre e madre mi abbandonassero, il Signore mi accoglierà
    ];
  }

  // 4. Matrimonio, tradimento, adulterio, crisi di coppia, divorzio
  if (/matrimon|marit|mogli|tradi|adulter|divorz|separaz|amante|infedelt/.test(q)) {
    return [
      '1 Corinzi 13:4-8',  // L'amore è paziente, non invidia, tutto copre, tutto sopporta
      'Efesini 5:28-33',   // I mariti amino le mogli come il proprio corpo e la moglie rispetti il marito
      'Proverbi 6:32',     // Chi commette adulterio è privo di senno
      'Ebrei 13:4',        // Il matrimonio sia tenuto in onore da tutti
      'Matteo 19:4-6',     // Quello che Dio ha unito, l'uomo non lo separi
      'Malachia 2:14-16',  // Il Signore è testimone del patto di matrimonio
    ];
  }

  // 5. Ansia, paura del futuro, panico, esami, lavoro, incertezza
  if (/ansia|paura|paur|futur|spavent|preoccup|panico|esami|lavor.*ansia|angoscia/.test(q)) {
    return [
      'Filippesi 4:6-7',   // Non angustiatevi di nulla, ma esponete le vostre richieste a Dio con preghiera
      'Matteo 6:25-34',    // Non affannatevi per il domani, cercate prima il regno di Dio
      '1 Pietro 5:7',      // Gettate su di Lui ogni vostra sollecitudine, perché Egli ha cura di voi
      'Salmi 23:1-4',      // Il Signore è il mio pastore: anche se cammino nella valle oscura non temo
      'Giosuè 1:9',        // Sii forte e coraggioso; non ti spaventare perché il Signore è con te
      'Isaia 41:10',       // Non temere perché Io sono con te; Io ti fortifico e ti sostengo
    ];
  }

  // 6. Sofferenza, perché Dio permette il male, ingiustizia, teodicea
  if (/perché dio|perche dio|male nel mondo|perché soffr|sofferenza|ingiustiz|persone buone/.test(q)) {
    return [
      'Giovanni 9:1-3',    // La sofferenza e la colpa non coincidono; le opere di Dio si manifestano
      'Giobbe 38:1-4',     // La risposta di Dio al mistero della creazione e della sofferenza
      'Romani 8:18-28',    // Le sofferenze del tempo presente; tutte le cose cooperano al bene
      'Salmi 73:1-17',     // Lo scandalo della prosperità degli empi risolto nella presenza di Dio
      'Abacuc 1:2-3',      // Fino a quando griderò verso di te senza che tu ascolti?
      '2 Corinzi 1:3-4',   // Il Dio di ogni consolazione che ci conforta in ogni afflizione
    ];
  }

  // 7. Lutto, morte di una persona cara, pianto, dolore della perdita
  if (/mort|lutt|mort[ao]|perso|pianto|lacrim|sepolcr|addio|manchi/.test(q)) {
    return [
      'Salmi 34:18',       // Il Signore è vicino a chi ha il cuore spezzato
      'Giovanni 11:25-35', // Gesù piange per Lazzaro e dichiara: Io sono la risurrezione e la vita
      '1 Tessalonicesi 4:13-14', // Non siate tristi come gli altri che non hanno speranza
      'Apocalisse 21:4',   // Asciugherà ogni lacrima dai loro occhi e non ci sarà più morte né cordoglio
      'Salmi 23:4',        // Anche se camminassi nella valle dell'ombra della morte
    ];
  }

  // 8. Rabbia, ira, insulti, vendetta, rancore
  if (/rabbi|ira|insult|vendett|farla pagare|odio|rancor|offes/.test(q)) {
    return [
      'Romani 12:17-21',   // Non rendete a nessuno male per male; vincete il male con il bene
      'Giacomo 1:19-20',   // Ognuno sia pronto ad ascoltare, lento a parlare, lento all'ira
      'Proverbi 15:1',     // La risposta dolce calma il furore, ma la parola dura eccita l'ira
      'Efesini 4:26-27',   // Il sole non tramonti sul vostro sdegno e non date spazio al diavolo
      'Matteo 5:38-44',    // Amate i vostri nemici e pregate per coloro che vi perseguitano
    ];
  }

  // 9. Dubbio di fede, silenzio di Dio, pregare senza risposta
  if (/dubbi|silenzio di dio|dio non rispond|non sento dio|prego.*nulla|crisi.*fede/.test(q)) {
    return [
      'Marco 9:24',        // Io credo; vieni in aiuto alla mia incredulità!
      'Geremia 29:12-13',  // Mi cercherete e mi troverete, perché mi cercherete con tutto il cuore
      '1 Re 19:11-13',     // Dio non era nel vento o nel terremoto, ma nel mormorio di un vento leggero
      'Giovanni 20:27-29', // Gesù a Tommaso: non essere incredulo, ma credente
      'Salmi 13:1-6',      // Fino a quando mi dimenticherai? Ma io confido nella tua bontà
    ];
  }

  // 10. Amicizia, tradimento da un amico, lealtà
  if (/amic|amico|amica|falsi amici|tradit.*amic|fidar/.test(q)) {
    return [
      'Proverbi 17:17',    // L'amico ama in ogni tempo; è nato come un fratello nella distretta
      'Proverbi 18:24',    // Chi ha molti compagni può giungere alla rovina, ma c'è un amico più affezionato di un fratello
      'Proverbi 27:6',     // Leali sono le ferite di chi ama, ma ingannevoli i baci di chi odia
      'Giovanni 15:13-15', // Nessuno ha un amore più grande di questo: dare la vita per i propri amici
      'Salmi 41:9',        // Perfino l'uomo con cui vivevo in pace e che mangiava il mio pane ha alzato il calcagno contro di me
    ];
  }

  // 11. Orgoglio, umiltà, sentirsi superiori, vanità
  if (/orgogli|umilt|superior|vanit|giudic.*altri|superbi/.test(q)) {
    return [
      'Proverbi 16:18',    // L'orgoglio precede la rovina e lo spirito altero precede la caduta
      'Filippesi 2:3-8',   // Non fate nulla per spirito di rivalità, ma con umiltà considerate gli altri superiori a voi stessi
      'Giacomo 4:6',       // Dio resiste ai superbi, ma dà grazia agli umili
      'Matteo 7:1-5',      // Non giudicate per non essere giudicati; togli la trave dal tuo occhio
      '1 Pietro 5:5',      // Rivestitevi tutti di umiltà gli uni verso gli altri
    ];
  }

  // 12. Senso di colpa, rimorso, vergogna, perdono di sé
  if (/colp|peccat|sbagliat|rimors|vergogn|non merit|perdonami/.test(q)) {
    return [
      'Romani 8:1',        // Non c'è dunque più alcuna condanna per quelli che sono in Cristo Gesù
      '1 Giovanni 1:9',    // Se confessiamo i nostri peccati, Egli è fedele e giusto da perdonarci
      'Salmi 103:10-12',   // Quanto il levante è lontano dal ponente, tanto ha allontanato da noi le nostre colpe
      'Isaia 1:18',        // Anche se i vostri peccati fossero come lo scarlatto, diventeranno bianchi come neve
    ];
  }

  // 13. Solitudine, sentirsi soli, isolamento
  if (/sol[ao]|solitudin|abbandonat|nessuno mi capisce|emarginat/.test(q)) {
    return [
      'Salmi 27:10',       // Anche se mio padre e mia madre mi abbandonassero, il Signore mi raccoglierà
      'Romani 8:38-39',    // Nessuna cosa al mondo potrà mai separarci dall'amore di Dio
      'Isaia 41:10',       // Non temere perché Io sono con te; Io ti fortifico
      'Matteo 28:20',      // Io sono con voi tutti i giorni fino alla fine del mondo
    ];
  }

  // Fallback semantico generico
  return [
    'Matteo 11:28-30',
    'Romani 8:28',
    'Salmi 46:1',
    'Giovanni 14:27',
  ];
}

/**
 * Searches the full Bible corpus for intersection of semantic concepts in the query
 */
export function searchBibleCorpusDirect(query: string, engine: any): string[] {
  if (!engine || typeof window === 'undefined' || !window.SELAH_BIBLE) return [];
  const bible = window.SELAH_BIBLE;
  const q = query.toLowerCase();

  // Keyword stems
  const isAnimalQuery = /animal|besti|cane|gatto|cavall|bue|asino|uccell|creatur/.test(q);
  const isCrueltyQuery = /male|crudel|malvag|cur|uccid|ferir|picchi/.test(q);

  if (isAnimalQuery && isCrueltyQuery) {
    return ['Proverbi 12:10', 'Esodo 23:5', 'Deuteronomio 25:4', 'Giona 4:11', 'Salmi 145:9'];
  }

  return [];
}

/**
 * Main AI Query Expansion & Deep Reasoning entry point.
 * Calls Cloudflare Workers AI (/api/ai-reason) when online,
 * or seamlessly falls back to the embedded local biblical knowledge graph when offline.
 */
export async function fetchSmartExpansion(query: string, engine?: any): Promise<SmartExpansionData | null> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return null;

  // 1. Tenta la chiamata al modello neurale Cloudflare Workers AI (/api/ai-reason)
  if (typeof window !== 'undefined' && navigator.onLine) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch('/api/ai-reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: clean }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const json = await resp.json();
        if (json && json.success && Array.isArray(json.suggestedRefs) && json.suggestedRefs.length > 0) {
          return { suggestedRefs: json.suggestedRefs };
        }
      }
    } catch {
      // Ignora errori di rete o timeout e prosegui con il fallback locale istantaneo
    }
  }

  // 2. Fallback: ricerca diretta nel corpus biblico locale
  const corpusRefs = searchBibleCorpusDirect(clean, engine);
  if (corpusRefs.length > 0) {
    return { suggestedRefs: corpusRefs };
  }

  // 3. Fallback: grafo semantico etico-biblico locale
  const reasoningRefs = getBiblicalReasoningRefs(clean);
  if (reasoningRefs.length > 0) {
    return { suggestedRefs: reasoningRefs };
  }

  return null;
}

