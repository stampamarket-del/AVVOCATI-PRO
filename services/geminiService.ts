import { GoogleGenAI, Type } from "@google/genai";
import { type Practice, type Document, type FirmProfile, type Client } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

const callGemini = async (prompt: string | any, config?: any): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config,
        });
        return response.text;
    } catch (error) {
        console.error("Errore nella chiamata API a Gemini:", error);
        return `Si è verificato un errore durante la generazione del contenuto. Controlla la console per i dettagli.`;
    }
}

export const summarizeText = async (text: string): Promise<string> => {
  if (!text.trim()) {
    return "Nessun testo fornito per il riassunto.";
  }
  const prompt = `Riassumi le seguenti note legali in 3-4 punti chiave. Sii conciso e professionale:\n\n---\n${text}\n---`;
  return callGemini(prompt);
};

export const draftEmail = async (clientName: string, topic: string): Promise<string> => {
   if (!clientName.trim() || !topic.trim()) {
    return "Nome del cliente e argomento sono necessari per creare una bozza di email.";
  }
  const prompt = `Scrivi una bozza di email professionale e cortese per un cliente di uno studio legale di nome ${clientName}. 
  Basandoti sull'argomento, genera prima un oggetto (subject) appropriato.
  L'argomento è: "${topic}". 
  L'email deve avere un tono rassicurante e informativo. Includi un segnaposto per i dettagli specifici.
  Separa l'oggetto dal corpo con "---BODY---".`;
  return callGemini(prompt);
};

export const generateOfficialEmail = async (clientName: string, tone: string, points: string): Promise<string> => {
    if (!clientName || !tone || !points.trim()) {
        return "Cliente, tono e punti chiave sono necessari per generare l'email.";
    }
    const prompt = `Agisci come un avvocato. Scrivi una bozza di email formale per il cliente ${clientName}.
    
    Il tono dell'email deve essere: ${tone}.
    
    L'email deve coprire i seguenti punti chiave:
    ---
    ${points}
    ---

    Basandoti sui punti chiave, genera prima un oggetto (subject) appropriato per l'email.
    Poi, struttura l'email con un'apertura formale, sviluppa i punti in paragrafi chiari e concludi con una chiusura professionale e i segnaposto per la firma.
    
    Separa l'oggetto dal corpo dell'email con "---BODY---".
    Formato atteso:
    Oggetto: [Generato dall'AI]
    ---BODY---
    [Corpo dell'email]
    `;
    return callGemini(prompt);
};

export const generateLegalLetter = async (
    firmProfile: FirmProfile,
    client: Client,
    letterType: string,
    context: string
): Promise<string> => {
    if (!client || !firmProfile || !letterType || !context) {
        return "Dati insufficienti per generare la lettera.";
    }

    const prompt = `
    Agisci come un avvocato per lo studio legale "${firmProfile.name}". Redigi una lettera legale completa e pronta per l'uso in italiano. NON usare asterischi o segnaposto generici come "[Data]" o "[Indirizzo Cliente]", ma componi un documento realistico e professionale.

    INTESTAZIONE MITTENTE (Usa questi dati):
    - Studio Legale: ${firmProfile.name}
    - Indirizzo: ${firmProfile.address}
    - Email: ${firmProfile.email}
    - Telefono: ${firmProfile.phone}
    - P.IVA: ${firmProfile.vatNumber}

    DATI DESTINATARIO (Usa questi dati):
    - Nome: ${client.name}
    - Codice Fiscale: ${client.taxcode}
    - Riferimento per indirizzo: "Spett.le ${client.name}"

    DETTAGLI LETTERA:
    - Tipo di Lettera: "${letterType}"
    - Contesto e Punti Chiave forniti: "${context}"

    ISTRUZIONI:
    1. Genera un Oggetto (Subject) chiaro e professionale basato sul tipo di lettera e sul contesto.
    2. Scrivi il corpo della lettera. Sviluppa i punti chiave del contesto in un testo legale formale e completo.
    3. Formatta l'intera lettera includendo: l'intestazione completa del mittente, la data odierna (in formato "Luogo, gg mese aaaa"), i dati del destinatario, l'oggetto e il corpo del testo.
    4. Termina con una chiusura formale (es. "Distinti saluti,") e la firma dello studio ("${firmProfile.name}").
    5. Separa l'oggetto generato dal corpo completo della lettera con "---BODY---".

    FORMATO ATTESO:
    Oggetto: [Generato dall'AI]
    ---BODY---
    [Corpo completo della lettera, iniziando con l'intestazione del mittente, seguito da data, destinatario, oggetto ripetuto e testo]
    `;
    return callGemini(prompt);
};


export const getPracticeAnalysis = async (practice: Practice, historicalData: Practice[]): Promise<string> => {
    const historicalSummary = historicalData
        .filter(p => p.id !== practice.id && p.status === 'Chiusa')
        .map(p => `Tipo: ${p.type}, Valore: ${p.value}, Durata: ${Math.round((new Date().getTime() - new Date(p.openedAt).getTime()) / (1000 * 60 * 60 * 24 * 30))} mesi`)
        .join('; ');
    
    const prompt = `Sei un analista di dati per uno studio legale. Basandoti sui seguenti dati storici anonimizzati di pratiche concluse:
    ---
    ${historicalSummary || 'Nessun dato storico disponibile.'}
    ---
    Analizza la seguente nuova pratica:
    - Titolo: "${practice.title}"
    - Tipo: "${practice.type}"
    - Note: "${practice.notes}"
    
    Fornisci una stima della durata probabile in mesi e del valore finale potenziale della pratica. Spiega il tuo ragionamento in una frase.
    Rispondi in formato JSON con le chiavi "stima_durata_mesi", "stima_valore" e "ragionamento".`;
    
    return callGemini(prompt);
};

export const classifyPractice = async (title: string, notes: string): Promise<string> => {
    if (!title.trim() && !notes.trim()) return "";
    const prompt = `Analizza il titolo e la descrizione di questa pratica legale e classificala.
    Titolo: "${title}"
    Descrizione: "${notes}"
    Le categorie di tipo possibili sono ['Civile Immobiliare', 'Societario', 'Diritto del Lavoro', 'Commerciale', 'Contrattualistica'].
    Le priorità sono ['Alta', 'Media', 'Bassa']. Scegli la priorità in base a potenziali urgenze o complessità menzionate.`;

    return callGemini(prompt, {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, description: 'La categoria legale della pratica.' },
                priority: { type: Type.STRING, description: 'La priorità stimata (Alta, Media, Bassa).' }
            },
            required: ['type', 'priority']
        }
    });
};

export const searchKnowledgeBase = async (query: string, allPractices: Practice[]): Promise<string> => {
    const knowledgeBase = allPractices.map(p => `ID: ${p.id}, Titolo: ${p.title}, Tipo: ${p.type}, Note: ${p.notes}`).join('\n---\n');
    const prompt = `Agisci come un assistente legale esperto. Analizza il seguente archivio di pratiche legali e rispondi alla domanda dell'utente.
    
    Domanda Utente: "${query}"
    
    Archivio Interno:
    ---
    ${knowledgeBase}
    ---
    
    Identifica le pratiche più pertinenti alla domanda. Fornisci un riassunto dei punti salienti per ciascuna pratica trovata, includendo sempre il loro ID. Se non trovi nulla di pertinente, indicalo.`;
    return callGemini(prompt);
};

export const analyzeDocument = async (document: Document, prompt: string): Promise<string> => {
    if (!prompt.trim()) return "Fornisci una domanda per l'analisi.";
    
    const dataUrlParts = document.dataUrl.split(',');
    if (dataUrlParts.length !== 2) return "URL dati del documento non valido.";
    
    const base64Data = dataUrlParts[1];

    const documentPart = {
        inlineData: {
            mimeType: document.type,
            data: base64Data,
        },
    };
    const textPart = { text: `Analizza il seguente documento e rispondi alla domanda. Domanda: ${prompt}` };

    const contents = { parts: [textPart, documentPart] };
    
    return callGemini(contents);
};

export const suggestMilestones = async (practice: Practice): Promise<string> => {
    if (!practice) {
        return "Dati della pratica non forniti.";
    }
    const prompt = `Agisci come un assistente legale esperto. Per una pratica di tipo "${practice.type}" intitolata "${practice.title}", suggerisci un elenco di 5-7 milestone o fasi procedurali tipiche e importanti in Italia. Fornisci solo un elenco puntato. Esempi: 'Prima udienza', 'Deposito memoria conclusionale', 'Sentenza'.`;
    return callGemini(prompt);
};


export const suggestFee = async (practiceTitle: string, practiceType: string): Promise<string> => {
    const prompt = `Basandoti su una ricerca web di tariffe legali in Italia, suggerisci un onorario competitivo per una pratica con il seguente titolo e tipo.
    Titolo: "${practiceTitle}"
    Tipo: "${practiceType}"
    Fornisci una stima numerica e una breve giustificazione in una frase.
    Rispondi in formato JSON con le chiavi "suggestedFee" (numero) e "justification" (stringa).`;

    return callGemini(prompt, {
        tools: [{ googleSearch: {} }],
    });
};

export const checkQuoteCompliance = async (quoteText: string, practiceType: string): Promise<string> => {
    if (!quoteText.trim()) {
        return "Testo del preventivo non fornito.";
    }
    const prompt = `
    Agisci come un esperto avvocato italiano specializzato in deontologia e parametri forensi (D.M. 147/2022).
    Analizza in modo critico e approfondito il seguente preventivo per una pratica legale di tipo "${practiceType}".

    Testo del Preventivo:
    ---
    ${quoteText}
    ---

    Valuta la conformità del preventivo, prestando particolare attenzione ai seguenti punti deboli comuni:
    1.  **Chiarezza della Descrizione dell'Attività:** Voci come "Rappresentanza e difesa nelle opportune sedi" sono troppo generiche. La descrizione è precisa? Specifica se l'attività è stragiudiziale o giudiziale, quali fasi sono incluse (es. negoziazione, mediazione, primo grado di giudizio) e quali sono escluse?
    2.  **Equità e Parametri Forensi:** L'onorario è proporzionato e giustificato rispetto alla complessità descritta e ai parametri forensi? La mancanza di dettaglio nella descrizione dell'attività rende difficile questa valutazione.
    3.  **Completezza:** Il preventivo include tutte le informazioni necessarie per la trasparenza verso il cliente? Controlla la presenza di: modalità e tempistiche di pagamento, stima della durata, stima delle spese vive, e clausole per la revisione del compenso.

    ISTRUZIONI PER LA RISPOSTA:
    - Inizia la risposta con "CONFORMITÀ: SÌ" o "CONFORMITÀ: NO".
    - Fornisci un sommario di una o due frasi che riassuma il tuo giudizio complessivo.
    - Elenca i suggerimenti di miglioramento in modo dettagliato e strutturato. Usa titoli chiari in grassetto (es. **Chiarezza della Descrizione dell'Attività (Punto 1):**) e utilizza elenchi puntati (con '*' o '-') per ogni raccomandazione specifica.
    - Sii molto specifico nei tuoi suggerimenti, come se stessi istruendo un collega.
    - Mantieni un tono professionale e costruttivo.
    `;
    return callGemini(prompt);
};