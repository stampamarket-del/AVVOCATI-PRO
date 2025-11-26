import React, { useState, useEffect, useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { type Client, type Practice, type Lawyer, type Document } from '../types';
import { createPractice, updatePractice, addDocument } from '../services/api';
import { classifyPractice, suggestFee } from '../services/geminiService';
import { LoadingIcon, SparklesIcon, CalculatorIcon, UserPlusIcon, UploadIcon, TrashIcon } from './icons';

interface PracticeFormProps {
    onClose: () => void;
    handleOpenClientForm: (client: Client | null) => void;
    practice?: Practice | null;
}

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const PracticeForm: React.FC<PracticeFormProps> = ({ onClose, practice, handleOpenClientForm }) => {
    const { data: clients } = useSWR<Client[]>('/api/clients');
    const { data: lawyers } = useSWR<Lawyer[]>('/api/lawyers');
    const { mutate } = useSWRConfig();
    const [formData, setFormData] = useState<Partial<Practice>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [error, setError] = useState('');
    const [aiError, setAiError] = useState('');
    const [aiUpdatedFields, setAiUpdatedFields] = useState<Set<string>>(new Set());
    const [estimatedHours, setEstimatedHours] = useState('');
    const [feeJustification, setFeeJustification] = useState('');
    
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);


    useEffect(() => {
        if (practice) {
            setFormData(practice);
        } else {
            setFormData({
                clientId: undefined,
                lawyerId: undefined,
                title: '',
                notes: '',
                type: '',
                status: 'Aperta',
                value: 0,
                fee: 0,
                paidAmount: 0,
                priority: 'Media',
                openedAt: new Date().toISOString().split('T')[0],
            });
        }
    }, [practice]);
    

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ['clientId', 'value', 'fee', 'paidAmount', 'lawyerId'];
        setFormData(prev => ({ ...prev, [name]: numericFields.includes(name) ? (value === '' ? undefined : Number(value)) : value }));
    };
    
    const selectedLawyer = lawyers?.find(l => l.id === formData.lawyerId);

    useEffect(() => {
        if (selectedLawyer?.billingType === 'Fissa') {
            setFormData(prev => ({...prev, fee: selectedLawyer.billingRate}));
        }
    }, [formData.lawyerId, selectedLawyer]);

    const calculateFee = () => {
        if (selectedLawyer?.billingType === 'Oraria' && estimatedHours) {
            const calculated = selectedLawyer.billingRate * parseFloat(estimatedHours);
            setFormData(prev => ({...prev, fee: calculated}));
        }
    };


    const canClassify = !!(formData.title?.trim() || formData.notes?.trim());
    const canSuggestFee = !!(formData.title?.trim() && formData.type?.trim());

    const handleAiClassify = async () => {
        if (!canClassify) {
            setAiError("Inserisci un titolo o delle note per usare il suggerimento AI.");
            return;
        }
        setIsAiLoading(true);
        setAiUpdatedFields(new Set());
        setAiError('');
        try {
            const result = await classifyPractice(formData.title || '', formData.notes || '');
            if (!result) throw new Error("Risposta vuota dall'AI");

            const classification = JSON.parse(result);
            
            const updated = new Set<string>();
            if (classification.type) updated.add('type');
            if (classification.priority) updated.add('priority');
            if (updated.size === 0) throw new Error("L'AI non ha fornito suggerimenti validi.");

            setFormData(prev => ({
                ...prev,
                type: classification.type || prev.type,
                priority: classification.priority || prev.priority
            }));

            setAiUpdatedFields(updated);
            setTimeout(() => setAiUpdatedFields(new Set()), 2500); 
        } catch (err) {
            console.error("AI classification failed", err);
            setAiError("L'analisi AI non è riuscita. Controlla i dati inseriti e riprova.");
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const handleSuggestFee = async () => {
        if (!canSuggestFee) {
            setAiError("Inserisci Titolo e Tipo della pratica per suggerire un onorario.");
            return;
        }
        setIsAiLoading(true);
        setAiError('');
        setFeeJustification('');
        setAiUpdatedFields(new Set());
        try {
            const result = await suggestFee(formData.title!, formData.type!);
            const cleanedResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const feeData = JSON.parse(cleanedResult);
            setFormData(prev => ({...prev, fee: feeData.suggestedFee}));
            setFeeJustification(feeData.justification);
            
            const updated = new Set<string>(['fee']);
            setAiUpdatedFields(updated);
            setTimeout(() => setAiUpdatedFields(new Set()), 2500);
        } catch (err) {
            console.error("Fee suggestion failed", err);
            setAiError("Impossibile suggerire l'onorario.");
        } finally {
            setIsAiLoading(false);
        }
    }
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setAttachedFiles(prev => [...prev, ...Array.from(event.target.files!)]);
        }
    };

    const handleRemoveFile = (fileName: string) => {
        setAttachedFiles(prev => prev.filter(f => f.name !== fileName));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.clientId || !formData.title) {
            setError("Cliente e titolo sono obbligatori.");
            return;
        }
        setIsLoading(true);
        setError('');
        
        try {
            let practiceId: number;
            if (practice && practice.id) { // Update
                await updatePractice({ ...formData, id: practice.id });
                practiceId = practice.id;
            } else { // Create
                const newPracticeId = await createPractice(formData as Omit<Practice, 'id'>);
                practiceId = newPracticeId;
            }
            
            // Upload attached files and associate them
            for (const file of attachedFiles) {
                const dataUrl = await fileToDataUrl(file);
                const newDocument: Omit<Document, 'id'> = {
                    clientId: formData.clientId!,
                    practiceId: practiceId,
                    name: file.name,
                    type: file.type,
                    dataUrl,
                    createdAt: new Date().toISOString(),
                };
                await addDocument(newDocument);
            }
            
            await mutate('/api/practices');
            if (attachedFiles.length > 0) {
                 await mutate(`/api/documents?practiceId=${practiceId}`);
            }
            onClose();
        } catch (err) {
            console.error(err);
            setError('Si è verificato un errore durante il salvataggio.');
        } finally {
            setIsLoading(false);
        }
    };

    const baseInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary transition-colors duration-300";
    const highlightClass = "bg-yellow-100 border-accent ring-2 ring-yellow-300";


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl m-4 overflow-y-auto max-h-[90vh]">
                <h2 className="text-2xl font-bold text-secondary mb-4">{practice ? 'Modifica Pratica' : 'Nuova Pratica'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">Cliente</label>
                            <div className="flex items-center gap-2">
                                <select id="clientId" name="clientId" value={formData.clientId || ''} onChange={handleChange} required className={baseInputClasses}>
                                    <option value="">Seleziona un cliente</option>
                                    {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button type="button" onClick={() => handleOpenClientForm(null)} className="p-2 bg-blue-100 text-primary rounded-md hover:bg-blue-200" title="Aggiungi Nuovo Cliente">
                                    <UserPlusIcon />
                                </button>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="lawyerId" className="block text-sm font-medium text-gray-700">Avvocato Assegnato</label>
                            <select id="lawyerId" name="lawyerId" value={formData.lawyerId || ''} onChange={handleChange} className={baseInputClasses}>
                                <option value="">Nessuno</option>
                                {lawyers?.map(l => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titolo Pratica</label>
                        <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className={baseInputClasses} />
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Note / Descrizione Breve</label>
                        <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className={baseInputClasses}></textarea>
                    </div>

                    <div className="p-3 bg-light rounded-md">
                        <div className="flex items-end gap-4">
                            <div className="flex-1">
                                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo</label>
                                <input type="text" id="type" name="type" value={formData.type} onChange={handleChange} placeholder="Es. Diritto del Lavoro" className={`${baseInputClasses} ${aiUpdatedFields.has('type') ? highlightClass : ''}`} />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priorità</label>
                                <select id="priority" name="priority" value={formData.priority} onChange={handleChange} className={`${baseInputClasses} ${aiUpdatedFields.has('priority') ? highlightClass : ''}`}>
                                    <option>Bassa</option><option>Media</option><option>Alta</option>
                                </select>
                            </div>
                             <button type="button" onClick={handleAiClassify} disabled={isAiLoading || !canClassify} className="flex items-center gap-2 px-3 py-2 bg-accent text-primary-darkest font-semibold rounded-md hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed h-10 flex-shrink-0">
                               {isAiLoading ? <LoadingIcon /> : <SparklesIcon />} Suggerisci
                            </button>
                        </div>
                        {aiError && <p className="text-red-600 text-xs text-center mt-2">{aiError}</p>}
                    </div>
                    
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Documenti da Allegare</label>
                         <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                               <UploadIcon className="mx-auto h-12 w-12 text-gray-400"/>
                               <div className="flex text-sm text-gray-600">
                                   <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                                       <span>Carica file</span>
                                       <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                                   </label>
                                   <p className="pl-1">o trascinali qui</p>
                               </div>
                               <p className="text-xs text-gray-500">PDF, DOCX, PNG, JPG, etc.</p>
                            </div>
                         </div>
                         {attachedFiles.length > 0 && (
                            <div className="mt-2 space-y-1 text-sm">
                                {attachedFiles.map(file => (
                                    <div key={file.name} className="flex justify-between items-center bg-gray-100 p-1.5 rounded">
                                        <span className="text-gray-700 truncate">{file.name}</span>
                                        <button type="button" onClick={() => handleRemoveFile(file.name)} className="text-red-500 hover:text-red-700">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                         )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label htmlFor="fee" className="block text-sm font-medium text-gray-700">Onorario Pattuito (€)</label>
                             <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    id="fee" 
                                    name="fee" 
                                    value={formData.fee || ''} 
                                    onChange={(e) => {
                                        handleChange(e);
                                        setFeeJustification('');
                                    }}
                                    className={`${baseInputClasses} ${aiUpdatedFields.has('fee') ? highlightClass : ''}`}
                                    step="0.01" />
                                <button type="button" onClick={handleSuggestFee} disabled={isAiLoading || !canSuggestFee} className="p-2 bg-accent text-primary-darkest rounded-md hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed" title="Suggerisci Onorario con AI">
                                    <SparklesIcon/>
                                </button>
                             </div>
                             {feeJustification && <p className="text-xs text-gray-600 mt-1 italic">Suggerimento AI: {feeJustification}</p>}
                        </div>
                        <div>
                             <label htmlFor="paidAmount" className="block text-sm font-medium text-gray-700">Importo Saldato (€)</label>
                            <input type="number" id="paidAmount" name="paidAmount" value={formData.paidAmount || ''} onChange={handleChange} className={baseInputClasses} step="0.01" />
                        </div>
                    </div>
                    {selectedLawyer?.billingType === 'Oraria' && (
                         <div className="p-3 bg-blue-50 rounded-md">
                            <label className="block text-sm font-medium text-blue-800">Calcola Preventivo (per tariffe orarie)</label>
                             <div className="flex items-center gap-2 mt-1">
                                 <input type="number" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} placeholder="Ore stimate" className="w-32 px-2 py-1 border rounded-md"/>
                                 <span className="text-gray-600">x {selectedLawyer.billingRate.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}/ora =</span>
                                <button type="button" onClick={calculateFee} className="p-2 bg-primary text-white rounded-md"><CalculatorIcon/></button>
                            </div>
                         </div>
                    )}


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Stato</label>
                            <select id="status" name="status" value={formData.status} onChange={handleChange} className={baseInputClasses}>
                                <option>Aperta</option><option>In corso</option><option>Chiusa</option>
                            </select>
                        </div>
                        <div>
                             <label htmlFor="openedAt" className="block text-sm font-medium text-gray-700">Data Apertura</label>
                            <input type="date" id="openedAt" name="openedAt" value={formData.openedAt} onChange={handleChange} className={baseInputClasses} />
                        </div>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annulla</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800 disabled:bg-gray-400 w-36 flex justify-center">
                            {isLoading ? <LoadingIcon /> : 'Salva Pratica'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PracticeForm;