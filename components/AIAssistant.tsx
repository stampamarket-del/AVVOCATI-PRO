
import React, { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { jsPDF } from 'jspdf';
import { type Client, type FirmProfile, type Letter } from '../types';
import { generateOfficialEmail, generateLegalLetter } from '../services/geminiService';
import { createLetter } from '../services/api';
import { LoadingIcon, SparklesIcon, WandIcon, PaperPlaneIcon, PdfIcon } from './icons';

type AITool = 'email' | 'letter';

const AIAssistant: React.FC = () => {
    const { data: clients, error: clientsError } = useSWR<Client[]>('/api/clients');
    const { data: firmProfile, error: profileError } = useSWR<FirmProfile>('/api/firm-profile');
    const { mutate } = useSWRConfig();
    
    const [activeTool, setActiveTool] = useState<AITool>('email');

    const [isLoading, setIsLoading] = useState(false);
    const [resultSubject, setResultSubject] = useState('');
    const [resultBody, setResultBody] = useState('');
    const [error, setError] = useState('');

    // State for Email Tool
    const [emailClient, setEmailClient] = useState('');
    const [emailTone, setEmailTone] = useState('Professionale');
    const [emailPoints, setEmailPoints] = useState('');

    // State for Letter Tool
    const [letterClient, setLetterClient] = useState('');
    const [letterType, setLetterType] = useState('Sollecito di pagamento');
    const [letterContext, setLetterContext] = useState('');
    const letterTypes = ['Sollecito di pagamento', 'Messa in mora', 'Lettera di incarico', 'Diffida', 'Disdetta contratto'];

    const resetResult = () => {
        setResultBody('');
        setResultSubject('');
        setError('');
    };

    const handleGenerateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        const client = clients?.find(c => c.id === parseInt(emailClient));
        if (!client) {
            setError("Seleziona un cliente valido.");
            return;
        }
        setIsLoading(true);
        resetResult();
        const response = await generateOfficialEmail(client.name, emailTone, emailPoints);
        if (response.startsWith("Si è verificato un errore")) {
            setError(response);
        } else {
            const parts = response.split('---BODY---');
            setResultSubject(parts[0].replace('Oggetto: ', '').trim());
            setResultBody(parts.length > 1 ? parts[1].trim() : '');
        }
        setIsLoading(false);
    };

    const handleGenerateLetter = async (e: React.FormEvent) => {
        e.preventDefault();
        const client = clients?.find(c => c.id === parseInt(letterClient));
        if (!client) {
            setError("Seleziona un cliente valido.");
            return;
        }
        if (!firmProfile) {
            setError("Profilo dello studio non trovato. Compilalo prima di generare lettere.");
            return;
        }
        setIsLoading(true);
        resetResult();
        const response = await generateLegalLetter(firmProfile, client, letterType, letterContext);
        if (response.startsWith("Si è verificato un errore")) {
            setError(response);
        } else {
            const parts = response.split('---BODY---');
            setResultSubject(parts[0].replace('Oggetto: ', '').trim());
            setResultBody(parts.length > 1 ? parts[1].trim() : '');
        }
        setIsLoading(false);
    };

    const handleSaveLetter = async () => {
        const clientId = parseInt(letterClient);
        if (!clientId || !resultBody) return;
        
        const newLetter: Omit<Letter, 'id'> = {
            clientId,
            subject: resultSubject,
            body: resultBody,
            createdAt: new Date().toISOString()
        };
        await createLetter(newLetter);
        await mutate('/api/letters');
        alert('Lettera salvata con successo!');
    };

    const handleGeneratePdf = () => {
        if (!resultBody) return;
        const doc = new jsPDF();
        
        const textLines = doc.splitTextToSize(resultBody, 180); // 180mm width
        doc.text(textLines, 15, 15);
        doc.save(`Lettera_${resultSubject.replace(/ /g, "_")}.pdf`);
    };

    const handleSendEmail = () => {
        const client = clients?.find(c => c.id === parseInt(emailClient));
        if (!client || !resultBody) return;
        
        const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(resultSubject)}&body=${encodeURIComponent(resultBody)}`;
        window.location.href = mailtoLink;
    };


    const renderEmailForm = () => (
        <form onSubmit={handleGenerateEmail} className="space-y-4">
            <div>
                <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select id="client-select" value={emailClient} onChange={e => setEmailClient(e.target.value)} required className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary">
                    <option value="">Seleziona un cliente</option>
                    {clients?.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="tone-select" className="block text-sm font-medium text-gray-700 mb-1">Tono dell'Email</label>
                <select id="tone-select" value={emailTone} onChange={e => setEmailTone(e.target.value)} className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary">
                    <option>Professionale</option>
                    <option>Cortese</option>
                    <option>Urgente</option>
                    <option>Informativo</option>
                </select>
            </div>
            <div>
                <label htmlFor="email-points" className="block text-sm font-medium text-gray-700 mb-1">Punti Chiave (uno per riga)</label>
                <textarea id="email-points" value={emailPoints} onChange={e => setEmailPoints(e.target.value)} required rows={5} placeholder="- Aggiornamento sullo stato della pratica X&#10;- Prossimi passi da seguire&#10;- Richiesta di documentazione aggiuntiva" className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"></textarea>
            </div>
            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-blue-800 transition-colors disabled:bg-gray-400">
                {isLoading ? <LoadingIcon /> : <SparklesIcon />}
                <span>Genera Bozza Email</span>
            </button>
        </form>
    );

    const renderLetterForm = () => (
        <form onSubmit={handleGenerateLetter} className="space-y-4">
             <div>
                <label htmlFor="letter-client-select" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select id="letter-client-select" value={letterClient} onChange={e => setLetterClient(e.target.value)} required className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary">
                    <option value="">Seleziona un cliente</option>
                    {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="letter-type" className="block text-sm font-medium text-gray-700 mb-1">Tipo di Lettera</label>
                <select id="letter-type" value={letterType} onChange={e => setLetterType(e.target.value)} required className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary">
                  {letterTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="letter-context" className="block text-sm font-medium text-gray-700 mb-1">Contesto / Dettagli Chiave</label>
                <textarea id="letter-context" value={letterContext} onChange={e => setLetterContext(e.target.value)} required rows={5} placeholder="Es: Fattura n. 123 di 500€ non pagata, scaduta il 30/05/2024." className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"></textarea>
            </div>
            <button type="submit" disabled={isLoading || !firmProfile} className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-blue-800 transition-colors disabled:bg-gray-400">
                {isLoading ? <LoadingIcon /> : <SparklesIcon />}
                <span>Genera Lettera</span>
            </button>
            {profileError && <p className="text-red-500 text-xs text-center mt-2">Errore nel caricamento del profilo studio.</p>}
        </form>
    );

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <WandIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-secondary">Assistente AI</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Form */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="border-b border-gray-200 mb-4">
                        <nav className="-mb-px flex gap-6">
                            <button onClick={() => { setActiveTool('email'); resetResult(); }} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTool === 'email' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Crea Email</button>
                            <button onClick={() => { setActiveTool('letter'); resetResult(); }} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTool === 'letter' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Crea Lettera</button>
                        </nav>
                    </div>
                    {clientsError && <div className="text-red-500 text-sm mb-4">Impossibile caricare l'elenco dei clienti.</div>}
                    {activeTool === 'email' ? renderEmailForm() : renderLetterForm()}
                </div>

                {/* Right Column: Result */}
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                     <h2 className="text-xl font-bold text-secondary mb-4">Risultato Generato</h2>
                     <div className="flex-grow min-h-[300px]">
                        {isLoading && (
                            <div className="flex justify-center items-center h-full">
                                <LoadingIcon className="w-8 h-8 text-primary" />
                                <span className="ml-3 text-secondary">L'assistente AI sta scrivendo...</span>
                            </div>
                        )}
                        {error && <div className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{error}</div>}
                        {resultBody && (
                            <div className="bg-light p-4 rounded-lg border border-gray-200 h-full overflow-y-auto">
                            <h3 className="font-bold text-primary mb-2">Oggetto: {resultSubject}</h3>
                            <hr className="mb-2"/>
                            <pre className="text-sm text-secondary whitespace-pre-wrap font-sans">{resultBody}</pre>
                            </div>
                        )}
                        {!isLoading && !resultBody && !error && (
                            <div className="text-center text-gray-500 h-full flex flex-col justify-center items-center">
                                <p>Il risultato della generazione apparirà qui.</p>
                                <p className="text-sm">Compila il modulo a sinistra per iniziare.</p>
                            </div>
                        )}
                     </div>
                     {!isLoading && resultBody && (
                        <div className="mt-4 pt-4 border-t flex justify-end gap-3">
                            {activeTool === 'letter' && (
                                <>
                                    <button onClick={handleSaveLetter} className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700">Salva Lettera</button>
                                    <button onClick={handleGeneratePdf} className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"><PdfIcon/>Genera PDF</button>
                                </>
                            )}
                             {activeTool === 'email' && (
                                <button onClick={handleSendEmail} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"><PaperPlaneIcon/>Invia Mail</button>
                            )}
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;