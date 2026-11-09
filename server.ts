import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google GenAI with recommended telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Deep semantic understanding and smart query reasoning with Gemini 3.8 Flash
app.post('/api/ai-expand', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query non valida' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Chiave API non configurata', fallback: true });
    }

    const prompt = `Sei un teologo biblico, pastore ed ermeneuta di grande sapienza, empatia umana e rigore esegetico per l'applicazione God Answers.
L'utente ha condiviso questo pensiero, domanda, dubbio, situazione personale o ricerca spirituale:
"${query.slice(0, 500)}"

Non limitarti a una ricerca per parole chiave. Ragiona approfonditamente su:
1. Qual è lo stato d'animo, il conflitto interiore, la sofferenza o l'interrogativo profondo sotteso?
2. Quali grandi risposte bibliche, dottrinali ed esistenziali offrono luce e conforto reale a questa situazione?
3. Quali sono i 3 o 4 passi biblici più mirati ed efficaci (indicando Libro C:V o C:V-V canonico italiano esatto, es. Salmi 23:1-4, Romani 8:28, Matteo 11:28-30) e per ciascuno spiega in 1 frase perché risponde esattamente a ciò che l'utente ha scritto?
4. Una breve chiave di lettura/meditazione per orientare la persona durante la lettura della Parola.

Restituisci ESCLUSIVAMENTE un JSON valido con questa struttura esatta:
{
  "summary": "Ragionamento spirituale ed empatico approfondito (2-3 frasi chiare, calorose, teologicamente solide che parlano al cuore dell'utente)",
  "reflectionKey": "Una chiave o domanda di meditazione personale su cui riflettere leggendo i passi",
  "theologicalThemes": ["Tema biblico 1", "Tema 2", "Tema 3"],
  "suggestedRefs": [
    {
      "ref": "NomeLibro C:V",
      "reason": "Motivazione biblica puntuale legata al bisogno espresso"
    }
  ]
}
Nota rigorosa per i riferimenti: usa solo i nomi italiani canonici (Genesi, Esodo, Levitico, Numeri, Deuteronomio, Giosuè, Giudici, Rut, 1 Samuele, 2 Samuele, 1 Re, 2 Re, 1 Cronache, 2 Cronache, Esdra, Neemia, Ester, Giobbe, Salmi, Proverbi, Ecclesiaste, Cantico dei Cantici, Isaia, Geremia, Lamentazioni, Ezechiele, Daniele, Osea, Gioele, Amos, Abdia, Giona, Michea, Naum, Abacuc, Sofonia, Aggeo, Zaccaria, Malachia, Matteo, Marco, Luca, Giovanni, Atti, Romani, 1 Corinzi, 2 Corinzi, Galati, Efesini, Filippesi, Colossesi, 1 Tessalonicesi, 2 Tessalonicesi, 1 Timoteo, 2 Timoteo, Tito, Filemone, Ebrei, Giacomo, 1 Pietro, 2 Pietro, 1 Giovanni, 2 Giovanni, 3 Giovanni, Giuda, Apocalisse). Formato: 'Libro Capitolo:Versetto' (es. 'Salmi 34:18', 'Matteo 11:28-30').`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return res.json({
      success: true,
      data: {
        summary: parsed.summary || '',
        reflectionKey: parsed.reflectionKey || '',
        theologicalThemes: Array.isArray(parsed.theologicalThemes) ? parsed.theologicalThemes : [],
        suggestedRefs: Array.isArray(parsed.suggestedRefs) ? parsed.suggestedRefs : [],
      },
    });
  } catch (error: any) {
    console.error('Error in /api/ai-expand:', error);
    return res.status(500).json({ error: 'Errore durante il ragionamento semantico', fallback: true });
  }
});

// Endpoint compatibile con Cloudflare Pages Functions: /api/ai-reason
app.post('/api/ai-reason', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query non valida' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ fallback: true, message: 'Nessuna chiave API trovata, uso fallback locale' });
    }

    const prompt = `Sei un teologo ed esperto biblico per l'app "God Answers".
Il tuo compito è analizzare la domanda, il dubbio morale o la ricerca spirituale dell'utente e individuare con intelligenza profonda da 1 a 4 passi della Bibbia realmente attinenti.
Rispondi ESCLUSIVAMENTE in formato JSON:
{
  "summary": "1 o 2 frasi in italiano con il ragionamento biblico essenziale",
  "suggestedRefs": ["NomeLibro Capitolo:Versetto", "NomeLibro Capitolo:Versetto-Versetto"]
}
Usa solo nomi di libri canonici in italiano (es. Genesi, Esodo, Salmi, Proverbi, Matteo, Romani).
Domanda dell'utente: "${query.slice(0, 500)}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      engine: 'dev-server-gemini',
      summary: parsed.summary || '',
      suggestedRefs: Array.isArray(parsed.suggestedRefs) ? parsed.suggestedRefs : [],
    });
  } catch (error: any) {
    return res.json({ fallback: true, error: error.message });
  }
});

// Funzione di utilità per garantire la presenza del file zip pulito
function ensureZipExists(): string {
  const zipPath = path.resolve(__dirname, 'public', 'god-answers-project.zip');
  if (!fs.existsSync(zipPath)) {
    try {
      execSync(`python3 -c "
import os, zipfile
ignore_dirs = {'node_modules', 'dev-dist', 'dist', 'build', '.git', '.aistudio', 'original_project', '__pycache__'}
ignore_files = {'bun.lock'}
output_zip = 'public/god-answers-project.zip'
with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in ignore_dirs and not d.startswith('.git')]
        for f in files:
            if f.endswith('.zip') or f in ignore_files or f.endswith('.log'):
                continue
            filepath = os.path.join(root, f)
            arcname = os.path.relpath(filepath, '.')
            zipf.write(filepath, arcname)
"`, { cwd: __dirname });
    } catch (e) {
      console.error('Error generating zip:', e);
    }
  }
  return zipPath;
}

// Endpoint diretto per scaricare lo zip del progetto
app.get(['/god-answers-project.zip', '/download/project.zip'], (req, res) => {
  try {
    const zipPath = ensureZipExists();
    if (fs.existsSync(zipPath)) {
      return res.download(zipPath, 'god-answers-project.zip');
    }
    return res.status(500).send('Impossibile creare il file zip.');
  } catch (err: any) {
    return res.status(500).send('Errore durante la creazione dello zip: ' + err.message);
  }
});


// Setup Vite middlewares in development or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`God Answers server running on port ${port}`);
  });
}

startServer();
