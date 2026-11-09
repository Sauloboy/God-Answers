/**
 * Cloudflare Pages Function: /api/ai-reason
 * Powered by Cloudflare Workers AI (LLaMA 3.1 / 3.2 Instruct).
 * Performs deep biblical reasoning on user questions and finds exact Scripture passages.
 */

export async function onRequestPost(context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await context.request.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? body.query.trim() : '';

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query troppo breve o assente', fallback: true }),
        { status: 400, headers }
      );
    }

    // Se il binding Workers AI di Cloudflare è configurato (context.env.AI)
    if (context.env && context.env.AI) {
      const systemPrompt = `Sei un teologo ed esperto biblico per l'app "God Answers".
Il tuo compito è analizzare la domanda, il dubbio morale o la ricerca spirituale dell'utente e individuare con intelligenza profonda da 1 a 4 passi della Bibbia realmente attinenti.

Regole rigorose:
1. Ragiona sul significato etico e profondo (es. per maltrattamento degli animali -> Proverbi 12:10 "Il giusto ha cura del suo bestiame", Esodo 23:5; per debiti -> Proverbi 22:7, 1 Timoteo 6:10; per rancore -> Romani 12:17-21, Efesini 4:31-32).
2. Rispondi ESCLUSIVAMENTE in formato JSON valido, senza markdown, senza preamboli, senza saluti.
3. Formato JSON esatto:
{
  "summary": "1 o 2 frasi in italiano con il ragionamento biblico essenziale per l'utente",
  "suggestedRefs": ["NomeLibro Capitolo:Versetto", "NomeLibro Capitolo:Versetto-Versetto"]
}
4. I nomi dei libri devono essere ESCLUSIVAMENTE quelli canonici in italiano (es. Genesi, Esodo, Salmi, Proverbi, Ecclesiaste, Matteo, Marco, Luca, Giovanni, Romani, 1 Corinzi, Giacomo, ecc.).`;

      // Chiama il modello neurale LLaMA 3.1 8B Instruct su Cloudflare Workers AI
      const aiResponse = await context.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: 0.15,
        max_tokens: 400,
      });

      let rawText = '';
      if (typeof aiResponse === 'string') {
        rawText = aiResponse;
      } else if (aiResponse && aiResponse.response) {
        rawText = aiResponse.response;
      }

      // Estrai il blocco JSON
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed.suggestedRefs)) {
            return new Response(
              JSON.stringify({
                success: true,
                engine: 'cloudflare-workers-ai',
                summary: parsed.summary || '',
                suggestedRefs: parsed.suggestedRefs,
              }),
              { status: 200, headers }
            );
          }
        } catch {
          // Errore parsing JSON, prosegui al fallback
        }
      }
    }

    // Se l'AI binding non è ancora collegato o ha restituito risposta non valida,
    // segnala al frontend di usare l'ottimo motore di fallback locale
    return new Response(
      JSON.stringify({
        success: false,
        fallback: true,
        message: 'Workers AI non collegato nella dashboard di Cloudflare. Utilizzo del motore locale.',
      }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: String(err?.message || err),
        fallback: true,
      }),
      { status: 200, headers }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
