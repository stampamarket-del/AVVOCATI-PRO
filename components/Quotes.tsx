
import React, { useState, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { jsPDF } from 'jspdf';
import { type Client, type Practice, type FirmProfile, type Quote } from '../types';
import { checkQuoteCompliance, suggestFee } from '../services/geminiService';
import { createQuote } from '../services/api';
import { LoadingIcon, CalculatorIcon, SparklesIcon, UserPlusIcon, PrintIcon, ArchiveBoxIcon } from './icons';
import { AIResultCard } from './common/AIResultCard';
import { QuotePreview, type QuoteData } from './common/QuotePreview';


interface QuotesProps {
    handleOpenClientForm: (client: Client | null) => void;
}

const legalServices = [
    "Consulenza Legale",
    "Redazione Contratto",
    "Assistenza Stragiudiziale",
    "Due Diligence Legale",
    "Recupero Crediti",
    "Costituzione Società",
    "Difesa in Giudizio (Primo Grado)"
];

const Quotes: React.FC<QuotesProps> = ({ handleOpenClientForm }) => {
    const { data: clients } = useSWR<Client[]>('/api/clients');
    const { data: firmProfile } = useSWR<FirmProfile>('/api/firm-profile');
    const { mutate } = useSWRConfig();

    const [formState, setFormState] = useState({
        clientId: '',
        serviceType: legalServices[0],
        description: '',
        fee: '',
    });
    const [feeJustification, setFeeJustification] = useState('');
    
    const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
    const [complianceResult, setComplianceResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const quotePreviewRef = useRef<HTMLDivElement>(null);

    const isLoadingData = !clients || !firmProfile;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
        // Reset quote when form changes
        setQuoteData(null);
        setComplianceResult('');
    };

    const handleSuggestFee = async () => {
        if (!formState.serviceType) return;
        setIsLoading(true);
        setFeeJustification('');
        const result = await suggestFee(formState.description || formState.serviceType, formState.serviceType);
        try {
            const feeData = JSON.parse(result);
            setFormState(prev => ({...prev, fee: feeData.suggestedFee}));
            setFeeJustification(feeData.justification);
        } catch(e) {
            console.error("Failed to parse fee suggestion:", e);
        }
        setIsLoading(false);
    };

    const handleGenerateQuote = () => {
        const client = clients?.find(c => c.id === parseInt(formState.clientId));
        if (!client || !firmProfile || !formState.fee) {
            alert("Seleziona un cliente e inserisci un onorario per generare il preventivo.");
            return;
        }

        const fee = parseFloat(formState.fee);
        const cpa = fee * 0.04;
        const vat = (fee + cpa) * 0.22;
        const total = fee + cpa + vat;
        
        const syntheticPractice = {
            clientId: client.id!,
            title: `Preventivo per ${formState.serviceType}`,
            type: formState.serviceType,
            notes: formState.description || 'Nessuna descrizione dettagliata fornita.',
            status: 'Aperta' as const, value: 0, openedAt: new Date().toISOString(), priority: 'Media' as const, fee, paidAmount: 0
        };

        setQuoteData({
            firmProfile,
            client,
            practice: syntheticPractice,
            fees: { fee, cpa, vat, total },
            date: new Date().toISOString()
        });
        setComplianceResult('');
    };
    
    const handleSaveQuote = async () => {
        if (!quoteData) return;
        setIsSaving(true);
        try {
            const newQuote: Omit<Quote, 'id'> = {
                clientId: quoteData.client.id!,
                practiceTitle: quoteData.practice.title,
                practiceType: quoteData.practice.type,
                practiceNotes: quoteData.practice.notes || '',
                fee: quoteData.fees.fee,
                cpa: quoteData.fees.cpa,
                vat: quoteData.fees.vat,
                total: quoteData.fees.total,
                createdAt: new Date().toISOString(),
            };
            await createQuote(newQuote);
            await mutate('/api/quotes'); // To invalidate cache for quote list page
            alert('Preventivo salvato con successo!');
        } catch (err) {
            console.error(err);
            alert('Errore nel salvataggio del preventivo.');
        } finally {
            setIsSaving(false);
        }
    };

    const generateQuoteTextForAI = (data: QuoteData): string => {
        const { practice, client, firmProfile, fees } = data;
        return `DA: ${firmProfile.name}, A: ${client.name}, Oggetto: ${practice.title}. DESCRIZIONE: ${practice.notes}. Onorario: ${fees.fee.toFixed(2)} €, CPA: ${fees.cpa.toFixed(2)} €, IVA: ${fees.vat.toFixed(2)} €, TOTALE: ${fees.total.toFixed(2)} €.`;
    };

    const handleCheckCompliance = async () => {
        if (!quoteData) return;
        setIsLoading(true);
        setComplianceResult('');
        const quoteTextForAI = generateQuoteTextForAI(quoteData);
        const result = await checkQuoteCompliance(quoteTextForAI, quoteData.practice.type);
        setComplianceResult(result);
        setIsLoading(false);
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
                <h1 className="text-3xl font-bold text-secondary">Genera Preventivo</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit print:hidden">
                    <h2 className="text-xl font-bold text-secondary mb-4">Dati Preventivo</h2>
                    {isLoadingData ? (<div className="flex items-center"><LoadingIcon className="mr-2"/>Caricamento...</div>) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                                <div className="flex items-center gap-2">
                                    <select name="clientId" value={formState.clientId} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md">
                                        <option value="">Seleziona un cliente</option>
                                        {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button onClick={() => handleOpenClientForm(null)} className="p-2.5 bg-blue-100 text-primary rounded-md hover:bg-blue-200 mt-1" title="Nuovo Cliente"><UserPlusIcon /></button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tipo di Servizio</label>
                                <select name="serviceType" value={formState.serviceType} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md">
                                    {legalServices.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Descrizione Attività</label>
                                <textarea name="description" value={formState.description} onChange={handleChange} rows={3} placeholder="Descrivi brevemente l'attività..." className="mt-1 w-full p-2 border rounded-md"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Onorario Proposto (€)</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" name="fee" value={formState.fee} onChange={handleChange} placeholder="Es. 1200" className="mt-1 w-full p-2 border rounded-md" />
                                    <button onClick={handleSuggestFee} disabled={isLoading} className="p-2.5 bg-accent text-primary-darkest rounded-md hover:bg-yellow-600 mt-1" title="Suggerisci Onorario con AI"><SparklesIcon /></button>
                                </div>
                                {feeJustification && <p className="text-xs text-gray-600 mt-1 italic">Suggerimento AI: {feeJustification}</p>}
                            </div>
                            <button onClick={handleGenerateQuote} disabled={!formState.clientId || !formState.fee} className="w-full mt-4 px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-blue-800 disabled:bg-gray-400">
                                Genera Anteprima
                            </button>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-6 rounded-lg shadow-md min-h-[500px] flex flex-col print:shadow-none print:p-0">
                        <h2 className="text-xl font-bold text-secondary mb-4 print:hidden">Anteprima e Azioni</h2>
                        <div ref={quotePreviewRef} className="flex-grow bg-gray-200 p-8 rounded-lg border overflow-y-auto print:bg-white print:p-0 print:border-none">
                            {quoteData ? (<QuotePreview quoteData={quoteData} />) : (<div className="h-full flex justify-center items-center text-gray-500 print:hidden"><p>L'anteprima del preventivo apparirà qui.</p></div>)}
                        </div>
                        {quoteData && (
                            <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-end gap-3 print:hidden">
                                <button onClick={handleSaveQuote} disabled={isLoading || isSaving} className="flex justify-center items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400">
                                    {isSaving ? <LoadingIcon /> : <ArchiveBoxIcon className="w-5 h-5"/>}
                                    Salva Preventivo
                                </button>
                                <button onClick={handleCheckCompliance} disabled={isLoading} className="flex justify-center items-center gap-2 px-4 py-2 bg-accent text-primary-darkest font-semibold rounded-md hover:bg-yellow-600 disabled:bg-gray-400">
                                    {isLoading ? <LoadingIcon /> : <SparklesIcon />} Verifica Conformità AI
                                </button>
                                <button onClick={handleSaveAsPdf} className="flex justify-center items-center gap-2 px-4 py-2 bg-secondary text-white rounded-md hover:bg-gray-600">
                                    <PrintIcon /> Stampa / Salva PDF
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="print:hidden">
                        {isLoading && (<div className="flex justify-center items-center p-4"><LoadingIcon className="w-6 h-6 text-primary" /><span className="ml-3 text-secondary">Elaborazione AI in corso...</span></div>)}
                        {complianceResult && (<div className="bg-white p-6 rounded-lg shadow-md"><AIResultCard title="Risultato Verifica Conformità" content={complianceResult} /></div>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Quotes;