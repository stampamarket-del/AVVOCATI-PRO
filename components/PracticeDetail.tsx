import React, { useState, useCallback } from 'react';
import useSWR from 'swr';
import { type Practice, type Client, type Lawyer, type TimeEntry, type Document } from '../types';
import { LoadingIcon, ClockIcon, TrashIcon, SparklesIcon } from './icons';
import { createTimeEntry, deleteTimeEntry } from '../services/api';
import { analyzeDocument, suggestMilestones } from '../services/geminiService';
import DocumentManager from './DocumentManager';
import { AIResultCard } from './common/AIResultCard';
import { DocumentAnalysisModal } from './common/DocumentAnalysisModal';
import { AddReminderModal } from './common/AddReminderModal';


interface PracticeDetailProps {
  practiceId: number;
  clientId: number;
  onBack: () => void;
  onScanDocument: () => void;
}

const getStatusClass = (status: Practice['status']) => {
  switch (status) {
    case 'Aperta': return 'bg-blue-100 text-blue-800';
    case 'In corso': return 'bg-yellow-100 text-yellow-800';
    case 'Chiusa': return 'bg-gray-100 text-gray-800';
  }
};

const PracticeDetail: React.FC<PracticeDetailProps> = ({ practiceId, clientId, onBack, onScanDocument }) => {
    const { data: practice, error: practiceError } = useSWR<Practice>(`/api/practices/${practiceId}`);
    const { data: client, error: clientError } = useSWR<Client>(`/api/clients/${clientId}`);
    const { data: lawyer, error: lawyerError } = useSWR<Lawyer>(practice?.lawyerId ? `/api/lawyers/${practice.lawyerId}` : null);
    const { data: timeEntries, error: timeEntriesError, mutate } = useSWR<TimeEntry[]>(`/api/time-entries?practiceId=${practiceId}`);
    
    const [newTimeEntry, setNewTimeEntry] = useState({ date: new Date().toISOString().split('T')[0], hours: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeEntryError, setTimeEntryError] = useState<string>('');

    const [aiResult, setAiResult] = useState<{title: string, content: string} | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [docToAnalyze, setDocToAnalyze] = useState<Document | null>(null);
    const [reminderModalInfo, setReminderModalInfo] = useState<{ open: boolean; title: string | null }>({ open: false, title: null });
    
    const handleAiRequest = useCallback(async (requestFn: () => Promise<string>, title: string) => {
        setIsAiLoading(true);
        setAiError(null);
        setAiResult(null);
        const result = await requestFn();
        if (result.startsWith("Si è verificato un errore")) {
            setAiError(result);
        } else {
            setAiResult({ title, content: result });
        }
        setIsAiLoading(false);
      }, []);

    const handleRunDocumentAnalysis = useCallback((prompt: string) => {
        if (!docToAnalyze) return;
        setDocToAnalyze(null);
        handleAiRequest(
            () => analyzeDocument(docToAnalyze, prompt),
            `Analisi: ${docToAnalyze.name}`
        );
    }, [docToAnalyze, handleAiRequest]);

    const handleAddMilestoneAsReminder = useCallback((milestoneTitle: string) => {
        setReminderModalInfo({ open: true, title: milestoneTitle });
    }, []);

    const handleTimeEntryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewTimeEntry(prev => ({ ...prev, [name]: value }));
    };

    const handleAddTimeEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTimeEntry.hours || !newTimeEntry.description) {
            setTimeEntryError("Tutti i campi sono obbligatori.");
            return;
        }
        setIsSubmitting(true);
        setTimeEntryError('');
        try {
            await createTimeEntry({
                practiceId,
                date: newTimeEntry.date,
                hours: parseFloat(newTimeEntry.hours),
                description: newTimeEntry.description
            });
            setNewTimeEntry({ date: new Date().toISOString().split('T')[0], hours: '', description: '' });
            await mutate();
        } catch (err) {
            console.error("Errore aggiunta attività:", err);
            setTimeEntryError("Impossibile aggiungere l'attività. Riprova più tardi.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteTimeEntry = async (id: number) => {
        setTimeEntryError('');
        try {
            await deleteTimeEntry(id);
            await mutate();
        } catch(err) {
            console.error("Errore cancellazione attività:", err);
            setTimeEntryError("Impossibile eliminare l'attività. Riprova più tardi.");
        }
    };

    const totalHours = timeEntries?.reduce((sum, entry) => sum + entry.hours, 0) || 0;
    let billableAmount = practice?.fee || 0;
    if (lawyer?.billingType === 'Oraria') {
        billableAmount = totalHours * (lawyer.billingRate || 0);
    }
    
    const isLoading = (!practice && !practiceError) || (!client && !clientError && practice) || (!lawyer && !lawyerError && practice?.lawyerId) || (!timeEntries && !timeEntriesError);
    if (isLoading) return <div className="flex justify-center items-center h-full"><LoadingIcon className="w-8 h-8 text-primary" /> <span className="ml-3">Caricamento pratica...</span></div>;
    if (practiceError || clientError || lawyerError || timeEntriesError) return <div className="text-red-500">Errore nel caricamento dei dati.</div>;
    if (!practice || !client) return <div className="text-red-500">Dati della pratica o del cliente non trovati.</div>;

    return (
        <div className="space-y-8">
            {docToAnalyze && <DocumentAnalysisModal doc={docToAnalyze} onClose={() => setDocToAnalyze(null)} onAnalyze={handleRunDocumentAnalysis} />}
            {reminderModalInfo.open && reminderModalInfo.title && (
                <AddReminderModal
                    title={reminderModalInfo.title}
                    practiceId={practiceId}
                    onClose={() => setReminderModalInfo({ open: false, title: null })}
                />
            )}
            <button onClick={onBack} className="text-sm text-primary hover:underline">&larr; Torna a Dettaglio Cliente</button>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-primary">{practice.title}</h1>
                        <p className="text-lg text-gray-600">per il cliente <strong className="cursor-pointer hover:underline" onClick={onBack}>{client.name}</strong></p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusClass(practice.status)}`}>{practice.status}</span>
                </div>
                <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="font-semibold text-gray-500">Tipo:</span><p className="text-secondary">{practice.type}</p></div>
                    <div><span className="font-semibold text-gray-500">Aperta il:</span><p className="text-secondary">{new Date(practice.openedAt).toLocaleDateString('it-IT')}</p></div>
                    <div><span className="font-semibold text-gray-500">Avvocato:</span><p className="text-secondary">{lawyer ? `${lawyer.firstName} ${lawyer.lastName}` : 'Non assegnato'}</p></div>
                     <div><span className="font-semibold text-gray-500">Priorità:</span><p className="text-secondary">{practice.priority}</p></div>
                </div>
                <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="font-semibold text-gray-500">Valore Causa:</span><p className="text-secondary font-medium">{practice.value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</p></div>
                    <div><span className="font-semibold text-gray-500">Onorario Pattuito:</span><p className="text-secondary font-medium">{practice.fee.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</p></div>
                    <div><span className="font-semibold text-gray-500">Importo Saldato:</span><p className="text-green-700 font-medium">{practice.paidAmount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</p></div>
                </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <DocumentManager clientId={client.id!} practiceId={practiceId} onScanDocument={onScanDocument} onAnalyzeDocument={setDocToAnalyze} />
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center gap-3 mb-4">
                            <ClockIcon className="w-6 h-6 text-primary"/>
                            <h2 className="text-2xl font-bold text-secondary">Tracciamento Ore</h2>
                        </div>
                        <form onSubmit={handleAddTimeEntry} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end bg-light p-4 rounded-md mb-6">
                            <div className="md:col-span-3">
                                <label className="text-sm font-medium text-gray-700">Descrizione Attività</label>
                                <input type="text" name="description" value={newTimeEntry.description} onChange={handleTimeEntryChange} required className="mt-1 w-full p-2 border rounded-md"/>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Data</label>
                                <input type="date" name="date" value={newTimeEntry.date} onChange={handleTimeEntryChange} required className="mt-1 w-full p-2 border rounded-md"/>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700">Ore</label>
                                <input type="number" name="hours" value={newTimeEntry.hours} onChange={handleTimeEntryChange} required className="mt-1 w-full p-2 border rounded-md" step="0.1"/>
                            </div>
                            <button type="submit" disabled={isSubmitting || isAiLoading} className="h-10 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800 disabled:bg-gray-400 flex justify-center items-center">
                                {isSubmitting ? <LoadingIcon /> : 'Aggiungi'}
                            </button>
                        </form>
                        {timeEntryError && <p className="text-red-500 text-sm mb-4 text-center">{timeEntryError}</p>}
                         <div className="space-y-3">
                            <div className="flex justify-between items-center pr-8 font-semibold text-secondary bg-gray-100 p-2 rounded-md">
                                <span>Totale Ore: {totalHours.toFixed(2)}</span>
                                <span>Totale da Fatturare: {billableAmount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</span>
                            </div>
                            {timeEntries?.map(entry => (
                                <div key={entry.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-800">{entry.description}</p>
                                        <p className="text-sm text-gray-500">{new Date(entry.date).toLocaleDateString('it-IT')}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                       <span className="font-bold text-primary">{entry.hours.toFixed(2)} ore</span>
                                       <button onClick={() => handleDeleteTimeEntry(entry.id!)} className="text-gray-400 hover:text-red-500"><TrashIcon/></button>
                                    </div>
                                </div>
                            ))}
                            {timeEntries?.length === 0 && <p className="text-center text-gray-500 py-4">Nessuna attività registrata per questa pratica.</p>}
                         </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center mb-4">
                        <SparklesIcon className="w-8 h-8 text-accent mr-3" />
                        <h2 className="text-2xl font-bold text-secondary">AI Studio</h2>
                    </div>
                     <div className="space-y-4">
                        <button
                            onClick={() => handleAiRequest(() => suggestMilestones(practice), `Milestones per: ${practice.title}`)}
                            disabled={isAiLoading}
                            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-accent text-primary-darkest font-semibold rounded-md hover:bg-yellow-600 transition-colors disabled:bg-gray-300"
                        >
                            {isAiLoading ? <LoadingIcon className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                            <span>Suggerisci Milestones</span>
                        </button>
                    </div>
                    {isAiLoading && (
                        <div className="flex justify-center items-center pt-4">
                            <LoadingIcon className="w-8 h-8 text-primary" />
                            <span className="ml-3 text-secondary">Elaborazione in corso...</span>
                        </div>
                    )}
                    {aiError && <div className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{aiError}</div>}
                    {aiResult && !isAiLoading && <AIResultCard 
                        title={aiResult.title} 
                        content={aiResult.content}
                        isMilestoneList={aiResult.title.startsWith('Milestones per:')}
                        onAddReminder={handleAddMilestoneAsReminder}
                    />}
                    {!isAiLoading && !aiResult && !aiError && <p className="text-sm text-gray-500 text-center pt-4">Analizza un documento o genera milestones per vedere qui i risultati.</p>}
                </div>
            </div>
        </div>
    );
};

export default PracticeDetail;