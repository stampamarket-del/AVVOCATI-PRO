import React, { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { jsPDF } from 'jspdf';
import { type Client, type Practice, type Lawyer, type FirmProfile } from '../types';
import { checkQuoteCompliance } from '../services/geminiService';
import { LoadingIcon, CalculatorIcon, SparklesIcon, PrintIcon } from './icons';
import { AIResultCard } from './common/AIResultCard';

interface QuoteData {
    firmProfile: FirmProfile;
    client: Client;
    practice: Practice;
    fees: {
        fee: number;
        cpa: number;
        vat: number;
        total: number;
    };
    date: string;
}

const QuotePreview: React.FC<{ quoteData: QuoteData }> = ({ quoteData }) => {
    const { firmProfile, client, practice, fees, date } = quoteData;
    return (
        <div className="bg-white shadow-lg p-12 mx-auto max-w-4xl print:shadow-none print:p-0 print:max-w-none font-serif text-gray-800">
            {/* Header */}
            <header className="flex justify-between items-start pb-6 border-b">
                <div className="w-2/3">
                    {firmProfile.logoUrl && (
                        <img src={firmProfile.logoUrl} alt="Logo Studio" className="h-16 mb-4 object-contain" />
                    )}
                    <h2 className="text-2xl font-bold text-primary">{firmProfile.name}</h2>
                    <p className="text-sm text-gray-700">{firmProfile.address}</p>
                    <p className="text-sm text-gray-700">P.IVA: {firmProfile.vatNumber} | Email: {firmProfile.email}</p>
                </div>
                <div className="text-right">
                    <h1 className="text-4xl font-bold uppercase text-gray-800">Preventivo</h1>
                    <p className="text-sm text-gray-700 mt-2">Data: {new Date(date).toLocaleDateString('it-IT')}</p>
                </div>
            </header>

            {/* Client and Subject */}
            <section className="my-8 grid grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold text-gray-600 mb-2 uppercase tracking-wider text-sm">Destinatario</h3>
                    <p className="font-bold text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-800">Cod. Fisc.: {client.taxcode}</p>
                </div>
                <div className="text-right">
                    <h3 className="font-semibold text-gray-600 mb-2 uppercase tracking-wider text-sm">Oggetto</h3>
                    <p className="font-bold text-gray-900">Preventivo per la pratica "{practice.title}"</p>
                </div>
            </section>
            
            {/* Body */}
            <section className="my-8">
                <p className="text-gray-800 mb-4 leading-relaxed">
                    Gentile {client.name},<br/>
                    facendo seguito alla Sua richiesta, siamo a sottoporre alla Vostra attenzione il preventivo per l'assistenza legale relativa alla pratica in oggetto.
                </p>
                <div className="p-4 bg-gray-50 rounded-md border">
                    <h4 className="font-bold text-gray-900 mb-2">1. Descrizione dell'Attività</h4>
                    <p className="text-sm text-gray-700">{practice.notes || 'Studio e analisi della documentazione, consulenza e assistenza stragiudiziale/giudiziale, e rappresentanza e difesa nelle opportune sedi.'}</p>
                </div>
            </section>

            {/* Fees Table */}
            <section className="my-8">
                <h4 className="font-bold text-gray-900 mb-2">2. Dettaglio Compensi</h4>
                <table className="w-full text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-sm font-semibold text-gray-700 uppercase">Voce</th>
                            <th className="p-3 text-right text-sm font-semibold text-gray-700 uppercase">Importo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        <tr className="text-gray-800">
                            <td className="p-3">Onorario Professionale</td>
                            <td className="p-3 text-right">{fees.fee.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td>
                        </tr>
                        <tr className="text-gray-800">
                            <td className="p-3">Contributo Cassa Previdenza Avvocati (C.P.A. 4%)</td>
                            <td className="p-3 text-right">{fees.cpa.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td>
                        </tr>
                        <tr className="text-gray-800">
                            <td className="p-3">Imposta sul Valore Aggiunto (I.V.A. 22%)</td>
                            <td className="p-3 text-right">{fees.vat.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td>
                        </tr>
                    </tbody>
                    <tfoot className="font-bold bg-gray-100 text-gray-900">
                        <tr>
                            <td className="p-3 text-lg">TOTALE PREVISTO</td>
                            <td className="p-3 text-right text-lg">{fees.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td>
                        </tr>
                    </tfoot>
                </table>
                 <p className="text-xs text-gray-600 mt-2">
                    Il presente preventivo non include eventuali spese vive (es. contributo unificato, marche da bollo, costi di notifica) che saranno documentate e addebitate a parte.
                </p>
            </section>

            {/* Signature */}
            <footer className="mt-16 text-right text-gray-800">
                <p>Distinti saluti,</p>
                <div className="h-16"></div>
                <p className="font-bold border-t pt-2 border-gray-300">{firmProfile.name}</p>
            </footer>
        </div>
    );
};


const Billing: React.FC = () => {
    const { data: clients } = useSWR<Client[]>('/api/clients');
    const { data: practices } = useSWR<Practice[]>('/api/practices');
    const { data: firmProfile } = useSWR<FirmProfile>('/api/firm-profile');

    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [selectedPracticeId, setSelectedPracticeId] = useState<string>('');
    const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
    const [complianceResult, setComplianceResult] = useState<string>('');
    const [isLoadingCompliance, setIsLoadingCompliance] = useState<boolean>(false);
    const quotePreviewRef = useRef<HTMLDivElement>(null);
    
    const isLoadingData = !clients || !practices || !firmProfile;

    const filteredPractices = useMemo(() => {
        if (!practices || !selectedClientId) return [];
        return practices.filter(p => p.clientId === parseInt(selectedClientId));
    }, [practices, selectedClientId]);

    const selectedPractice = useMemo(() => {
        if (!practices || !selectedPracticeId) return null;
        return practices.find(p => p.id === parseInt(selectedPracticeId));
    }, [practices, selectedPracticeId]);
    
    const handleGenerateQuote = () => {
        if (!selectedPractice || !clients || !firmProfile) return;
        
        const client = clients.find(c => c.id === selectedPractice.clientId);
        if (!client) return;

        const fee = selectedPractice.fee;
        const cpa = fee * 0.04;
        const vat = (fee + cpa) * 0.22;
        const total = fee + cpa + vat;
        
        setQuoteData({
            firmProfile,
            client,
            practice: selectedPractice,
            fees: { fee, cpa, vat, total },
            date: new Date().toISOString()
        });
        setComplianceResult('');
    };
    
    const generateQuoteTextForAI = (data: QuoteData): string => {
        const { practice, client, firmProfile, fees } = data;
        return `
PREVENTIVO PER PRESTAZIONI PROFESSIONALI
DA: ${firmProfile.name}, ${firmProfile.address}, P.IVA: ${firmProfile.vatNumber}
A: Spett.le ${client.name}, Cod. Fisc.: ${client.taxcode}
Oggetto: Preventivo per la pratica "${practice.title}"
DESCRIZIONE ATTIVITÀ: ${practice.notes || 'Studio e analisi, consulenza, rappresentanza.'}
COMPENSI:
- Onorario: ${fees.fee.toFixed(2)} €
- CPA 4%: ${fees.cpa.toFixed(2)} €
- IVA 22%: ${fees.vat.toFixed(2)} €
- TOTALE: ${fees.total.toFixed(2)} €
Escluse spese vive.
        `;
    };

    const handleCheckCompliance = async () => {
        if (!quoteData) return;
        setIsLoadingCompliance(true);
        setComplianceResult('');
        const quoteTextForAI = generateQuoteTextForAI(quoteData);
        const result = await checkQuoteCompliance(quoteTextForAI, quoteData.practice.type);
        setComplianceResult(result);
        setIsLoadingCompliance(false);
    };
    
    const handleSaveAsPdf = () => {
        const input = quotePreviewRef.current?.querySelector('.font-serif');
        if (!input || !quoteData) {
            console.error("Elemento del preventivo non trovato o dati mancanti.");
            return;
        }

        const doc = new jsPDF('p', 'pt', 'a4');

        doc.html(input as HTMLElement, {
            callback: (doc) => {
                doc.save(`Preventivo_${quoteData.client.name.replace(/\s/g, '_')}.pdf`);
            },
            margin: [40, 40, 40, 40],
            autoPaging: 'text',
            width: 515,
            windowWidth: input.clientWidth,
        });
    };

    return (
        <div>
             <div className="flex items-center gap-3 mb-6 print:hidden">
                <CalculatorIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-secondary">Preventivi e Compliance</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit print:hidden">
                    <h2 className="text-xl font-bold text-secondary mb-4">1. Seleziona Pratica</h2>
                    {isLoadingData ? (
                        <div className="flex items-center"><LoadingIcon className="mr-2"/>Caricamento dati...</div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                                <select value={selectedClientId} onChange={e => { setSelectedClientId(e.target.value); setSelectedPracticeId(''); setQuoteData(null); setComplianceResult(''); }} className="mt-1 w-full p-2 border rounded-md">
                                    <option value="">Seleziona un cliente</option>
                                    {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Pratica</label>
                                <select value={selectedPracticeId} onChange={e => { setSelectedPracticeId(e.target.value); setQuoteData(null); setComplianceResult(''); }} disabled={!selectedClientId} className="mt-1 w-full p-2 border rounded-md disabled:bg-gray-100">
                                    <option value="">Seleziona una pratica</option>
                                    {filteredPractices.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>
                            <button onClick={handleGenerateQuote} disabled={!selectedPracticeId} className="w-full mt-4 px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-blue-800 disabled:bg-gray-400">
                                Genera Preventivo
                            </button>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-6 rounded-lg shadow-md min-h-[500px] flex flex-col print:shadow-none print:p-0">
                        <h2 className="text-xl font-bold text-secondary mb-4 print:hidden">2. Anteprima e Azioni</h2>
                        <div ref={quotePreviewRef} className="flex-grow bg-gray-200 p-8 rounded-lg border overflow-y-auto print:bg-white print:p-0 print:border-none">
                            {quoteData ? (
                                <QuotePreview quoteData={quoteData} />
                            ) : (
                                <div className="h-full flex justify-center items-center text-gray-500 print:hidden">
                                    <p>L'anteprima del preventivo apparirà qui.</p>
                                </div>
                            )}
                        </div>
                        {quoteData && (
                            <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-end gap-3 print:hidden">
                                <button onClick={handleCheckCompliance} disabled={isLoadingCompliance} className="flex justify-center items-center gap-2 px-4 py-2 bg-accent text-primary-darkest font-semibold rounded-md hover:bg-yellow-600 disabled:bg-gray-400">
                                    {isLoadingCompliance ? <LoadingIcon /> : <SparklesIcon />}
                                    Verifica Conformità AI
                                </button>
                                <button onClick={handleSaveAsPdf} className="flex justify-center items-center gap-2 px-4 py-2 bg-secondary text-white rounded-md hover:bg-gray-600">
                                    <PrintIcon /> Stampa / Salva PDF
                                </button>
                            </div>
                        )}
                    </div>
                     <div className="print:hidden">
                        {isLoadingCompliance && (
                            <div className="flex justify-center items-center p-4">
                               <LoadingIcon className="w-6 h-6 text-primary" />
                               <span className="ml-3 text-secondary">Verifica in corso...</span>
                            </div>
                        )}
                        {complianceResult && (
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <AIResultCard 
                                    title="Risultato Verifica Conformità" 
                                    content={complianceResult} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Billing;