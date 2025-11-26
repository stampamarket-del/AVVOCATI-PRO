import React, { useState, useCallback, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { type Client, type Practice, type Document, type Lawyer } from '../types';
import { summarizeText, draftEmail, getPracticeAnalysis, analyzeDocument } from '../services/geminiService';
import { updateClient } from '../services/api';
import { SparklesIcon, LoadingIcon, UserIcon } from './icons';
import DocumentManager from './DocumentManager';
import { AIResultCard } from './common/AIResultCard';
import { DocumentAnalysisModal } from './common/DocumentAnalysisModal';


interface ClientDetailProps {
  clientId: number;
  onBack: () => void;
  onEditClient: (client: Client) => void;
  onScanDocument: () => void;
  onSelectPractice: (practiceId: number, clientId: number) => void;
}

const getClientPriorityClass = (priority: Client['priority']) => {
    switch (priority) {
        case 'Alta': return 'bg-red-100 text-red-800';
        case 'Media': return 'bg-yellow-100 text-yellow-800';
        case 'Bassa': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const getPracticePriorityClass = (priority: Practice['priority']) => {
    switch (priority) {
        case 'Alta': return 'bg-red-100 text-red-800';
        case 'Media': return 'bg-yellow-100 text-yellow-800';
        case 'Bassa': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const ClientDetail: React.FC<ClientDetailProps> = ({ clientId, onBack, onEditClient, onScanDocument, onSelectPractice }) => {
  const { mutate } = useSWRConfig();
  const clientKey = `/api/clients/${clientId}`;
  const clientsListKey = '/api/clients';

  const { data: client, error: clientError } = useSWR<Client>(clientKey);
  const { data: practices, error: practicesError } = useSWR<Practice[]>(`/api/practices`);
  const { data: lawyers, error: lawyersError } = useSWR<Lawyer[]>('/api/lawyers');

  const [notes, setNotes] = useState('');
  const [emailTopic, setEmailTopic] = useState('');
  const [aiResult, setAiResult] = useState<{title: string, subject?: string, content: string} | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [docToAnalyze, setDocToAnalyze] = useState<Document | null>(null);

  useEffect(() => {
    if (client) {
      setNotes(client.notes || '');
    }
  }, [client]);

  const handleSaveNotes = async () => {
    if (!client) return;
    setIsSaving(true);
    try {
        await updateClient({ id: client.id!, notes });
        await mutate(clientKey);
        await mutate(clientsListKey);
    } catch(err) {
        console.error("Failed to save notes:", err);
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleAiRequest = useCallback(async (requestFn: () => Promise<string>, title: string, isEmail: boolean = false) => {
    setIsAiLoading(true);
    setAiError(null);
    setAiResult(null);
    const result = await requestFn();
    if (result.startsWith("Si è verificato un errore")) {
        setAiError(result);
    } else {
        if (isEmail) {
            const parts = result.split('---BODY---');
            const subject = parts[0].replace('Oggetto: ', '').trim();
            const content = parts.length > 1 ? parts[1].trim() : '';
            setAiResult({ title, subject, content });
        } else {
            setAiResult({ title, content: result });
        }
    }
    setIsAiLoading(false);
  }, []);
  
  const handleAnalyzePractice = useCallback((practiceToAnalyze: Practice) => {
    handleAiRequest(async () => {
        const analysisResult = await getPracticeAnalysis(practiceToAnalyze, practices || []);
        if (analysisResult.startsWith("Si è verificato un errore")) return analysisResult;
        try {
            const cleanedResult = analysisResult.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanedResult);
            return `Stima Durata: ${parsed.stima_durata_mesi} mesi\nStima Valore: ${new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(parsed.stima_valore)}\n\nRagionamento:\n${parsed.ragionamento}`;
        } catch(e) {
            console.error("Failed to parse practice analysis:", e, "Original string:", analysisResult);
            return "L'analisi ha prodotto un risultato non valido.";
        }
    }, `Analisi Predittiva: ${practiceToAnalyze.title}`);
  }, [practices, handleAiRequest]);

  const handleRunDocumentAnalysis = useCallback((prompt: string) => {
    if (!docToAnalyze) return;
    setDocToAnalyze(null);
    handleAiRequest(
        () => analyzeDocument(docToAnalyze, prompt),
        `Analisi: ${docToAnalyze.name}`
    );
  }, [docToAnalyze, handleAiRequest]);

  const handleSendEmail = () => {
    if (!client || !aiResult?.content) return;
    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(aiResult.subject || '')}&body=${encodeURIComponent(aiResult.content)}`;
    window.location.href = mailtoLink;
  };

  if (clientError || practicesError || lawyersError) return <div className="text-red-500 p-4">Errore nel caricamento dei dettagli del cliente.</div>;
  if (!client || !practices || !lawyers) return (
      <div className="flex items-center justify-center h-full">
          <LoadingIcon className="w-8 h-8 text-primary" />
          <span className="ml-3 text-secondary">Caricamento cliente...</span>
      </div>
  );

  const clientPractices = practices.filter(p => p.clientId === client.id);
  const relevantClosedPractices = clientPractices.filter(p => p.status === 'Chiusa' && p.fee > 1000).sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  
  const getLawyerName = (lawyerId?: number) => {
    if (!lawyerId) return 'Non assegnato';
    const lawyer = lawyers.find(l => l.id === lawyerId);
    return lawyer ? `${lawyer.firstName} ${lawyer.lastName}` : 'Sconosciuto';
  };

  return (
    <div className="space-y-8">
      {docToAnalyze && <DocumentAnalysisModal doc={docToAnalyze} onClose={() => setDocToAnalyze(null)} onAnalyze={handleRunDocumentAnalysis} />}
      
      <button onClick={onBack} className="text-sm text-primary hover:underline mb-4">&larr; Torna a Elenco Clienti</button>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className="flex items-center space-x-6">
                <div className="w-24 h-24 rounded-full bg-light flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-16 h-16 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-primary">{client.name}</h1>
                  <p className="text-gray-600">{client.email} | {client.phone}</p>
                  <p className="text-gray-500 text-sm mt-1">Cliente dal {new Date(client.createdAt).toLocaleDateString('it-IT')}</p>
                  <div className="mt-2">
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getClientPriorityClass(client.priority)}`}>
                        Priorità: {client.priority}
                    </span>
                  </div>
                </div>
            </div>
            <button
                onClick={() => onEditClient(client)}
                className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-gray-600 transition-colors flex-shrink-0"
            >
                Modifica Anagrafica
            </button>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-secondary mb-4">Pratiche Associate</h2>
            <ul className="space-y-3">
              {clientPractices.length > 0 ? clientPractices.map(p => (
                <li key={p.id} className="p-3 bg-light rounded-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <p 
                                className="font-semibold text-primary hover:underline cursor-pointer"
                                onClick={() => onSelectPractice(p.id!, clientId)}
                            >
                                {p.title} ({p.type})
                            </p>
                            <p className="text-sm text-gray-500">Avv: <span className="font-medium text-gray-700">{getLawyerName(p.lawyerId)}</span></p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                <span>Onorario: <span className="font-semibold text-gray-800">{(p.fee || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</span></span>
                                <span>Saldato: <span className="font-semibold text-green-700">{(p.paidAmount || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</span></span>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getPracticePriorityClass(p.priority)}`}>{p.priority}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleAnalyzePractice(p)}
                            disabled={isAiLoading}
                            className="flex items-center gap-1.5 text-xs px-2 py-1 bg-accent text-primary-darkest font-semibold rounded-md hover:bg-yellow-600 transition-colors disabled:bg-gray-300 flex-shrink-0"
                        >
                            <SparklesIcon className="w-3 h-3"/> Analizza
                        </button>
                    </div>
                </li>
              )) : <p className="text-gray-500">Nessuna pratica associata a questo cliente.</p>}
            </ul>
          </div>
          
           {relevantClosedPractices.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-secondary mb-4">Storico Pratiche Rilevanti</h2>
                <p className="text-sm text-gray-500 mb-4">Elenco delle pratiche chiuse con valore superiore a 1.000€.</p>
                <ul className="space-y-2">
                    {relevantClosedPractices.map(p => (
                        <li key={p.id} className="text-sm p-2 bg-gray-50 rounded-md">
                            <span className="font-semibold">{p.title}</span> - Chiusa il {new Date(p.openedAt).toLocaleDateString('it-IT')} - Valore: {p.fee.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                        </li>
                    ))}
                </ul>
            </div>
           )}

          <DocumentManager clientId={clientId} onScanDocument={onScanDocument} onAnalyzeDocument={setDocToAnalyze}/>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-secondary mb-4">Note sul Cliente</h2>
            <textarea
                className="w-full h-48 p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Aggiungi note qui..."
            />
            <button 
              onClick={handleSaveNotes} 
              disabled={isSaving}
              className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800 transition-colors w-32 flex justify-center items-center disabled:bg-gray-400"
            >
                {isSaving ? <LoadingIcon className="w-5 h-5" /> : 'Salva Note'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
             <SparklesIcon className="w-8 h-8 text-accent mr-3" />
             <h2 className="text-2xl font-bold text-secondary">AI Studio</h2>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg text-secondary mb-2">Riassumi Note</h3>
              <button onClick={() => handleAiRequest(() => summarizeText(notes), "Riassunto Note")}
                disabled={isAiLoading || !notes}
                className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-accent text-primary-darkest font-semibold rounded-md hover:bg-yellow-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                {isAiLoading ? <LoadingIcon /> : <SparklesIcon />} <span>Genera Riassunto</span>
              </button>
            </div>
            <hr/>
            <div>
              <h3 className="font-semibold text-lg text-secondary mb-2">Crea Bozza Email</h3>
              <input type="text" value={emailTopic} onChange={(e) => setEmailTopic(e.target.value)} placeholder="Es: Aggiornamento sulla pratica" className="w-full p-2 border rounded-md mb-3 focus:ring-2 focus:ring-primary"/>
              <button onClick={() => { handleAiRequest(() => draftEmail(client.name, emailTopic), `Bozza Email: ${emailTopic}`, true); setEmailTopic(''); }}
                disabled={isAiLoading || !emailTopic.trim()}
                className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-accent text-primary-darkest font-semibold rounded-md hover:bg-yellow-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                {isAiLoading ? <LoadingIcon /> : <SparklesIcon />} <span>Crea Bozza</span>
              </button>
            </div>
            
            {isAiLoading && (
                <div className="flex justify-center items-center pt-4">
                    <LoadingIcon className="w-8 h-8 text-primary" />
                    <span className="ml-3 text-secondary">Elaborazione in corso...</span>
                </div>
            )}
            {aiError && <div className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{aiError}</div>}
            {aiResult && !isAiLoading && <AIResultCard title={aiResult.title} subject={aiResult.subject} content={aiResult.content} onSendEmail={aiResult.subject ? handleSendEmail : undefined} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;