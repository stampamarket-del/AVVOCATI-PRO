
import React, { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { type Reminder, type Practice } from '../types';
import { createReminder, deleteReminder } from '../services/api';
import { LoadingIcon, ReminderIcon, TrashIcon } from './icons';

const getPriorityClass = (priority: Reminder['priority']) => {
    switch (priority) {
        case 'Alta': return 'border-red-500';
        case 'Media': return 'border-yellow-500';
        case 'Bassa': return 'border-green-500';
        default: return 'border-gray-400';
    }
};

const getPracticeStatusClass = (status: Practice['status']) => {
  switch (status) {
    case 'Aperta': return 'bg-blue-100 text-blue-800';
    case 'In corso': return 'bg-yellow-100 text-yellow-800';
    case 'Chiusa': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};


const ReminderList: React.FC = () => {
    const { data: reminders, error } = useSWR<Reminder[]>('/api/reminders');
    const { data: practices } = useSWR<Practice[]>('/api/practices');
    const { mutate } = useSWRConfig();

    const [newReminder, setNewReminder] = useState<Partial<Reminder>>({ title: '', dueDate: '', priority: 'Media', practiceId: undefined });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewReminder(prev => ({ ...prev, [name]: name === 'practiceId' ? (value ? parseInt(value) : undefined) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReminder.title || !newReminder.dueDate) return;
        
        setIsSubmitting(true);
        try {
            await createReminder(newReminder as Reminder);
            setNewReminder({ title: '', dueDate: '', priority: 'Media', practiceId: undefined });
            await mutate('/api/reminders');
        } catch (err) {
            console.error("Errore nella creazione del promemoria:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteReminder(id);
            await mutate('/api/reminders');
        } catch (err) {
            console.error("Errore nella cancellazione del promemoria:", err);
        }
    };
    
    const getPracticeInfo = (practiceId?: number) => {
        if (!practiceId || !practices) return null;
        return practices.find(p => p.id === practiceId);
    }
    
    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <ReminderIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-secondary">Scadenziario</h1>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold text-secondary mb-4">Aggiungi Nuova Scadenza</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titolo</label>
                        <input type="text" name="title" id="title" value={newReminder.title} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                     <div>
                        <label htmlFor="practiceId" className="block text-sm font-medium text-gray-700">Pratica Associata (Opz.)</label>
                        <select name="practiceId" id="practiceId" value={newReminder.practiceId || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                           <option value="">Nessuna</option>
                           {practices?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Data Scadenza</label>
                        <input type="date" name="dueDate" id="dueDate" value={newReminder.dueDate} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                     <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priorità</label>
                        <select name="priority" id="priority" value={newReminder.priority} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                            <option>Bassa</option>
                            <option>Media</option>
                            <option>Alta</option>
                        </select>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="md:col-start-5 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800 transition-colors disabled:bg-gray-400 h-10 flex justify-center items-center">
                        {isSubmitting ? <LoadingIcon /> : 'Aggiungi'}
                    </button>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-secondary mb-4">Elenco Scadenze</h2>
                 {error && <div className="text-red-500 p-4">Errore nel caricamento dei promemoria.</div>}
                 {!reminders && !error && (
                     <div className="flex items-center justify-center h-48">
                        <LoadingIcon className="w-8 h-8 text-primary" />
                        <span className="ml-3 text-secondary">Caricamento scadenze...</span>
                    </div>
                 )}
                 {reminders && (
                     <div className="space-y-3">
                         {reminders.length === 0 ? (
                            <p className="text-gray-500">Nessuna scadenza presente. Aggiungine una usando il modulo qui sopra.</p>
                         ) : (
                            reminders.map(r => {
                                const relatedPractice = getPracticeInfo(r.practiceId);
                                return (
                                <div key={r.id} className={`flex justify-between items-center p-3 rounded-lg border-l-4 ${getPriorityClass(r.priority)} bg-light`}>
                                    <div>
                                        <p className="font-semibold text-secondary">{r.title}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span>Scadenza: {new Date(r.dueDate).toLocaleDateString('it-IT')}</span>
                                            {relatedPractice && (
                                                <>
                                                 <span className="text-gray-300">|</span>
                                                 <span>Pratica: <span className="font-medium">{relatedPractice.title}</span></span>
                                                 <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getPracticeStatusClass(relatedPractice.status)}`}>
                                                    {relatedPractice.status}
                                                 </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(r.id!)} className="text-gray-400 hover:text-red-600 transition-colors p-1">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                                );
                            })
                         )}
                     </div>
                 )}
            </div>
        </div>
    );
};

export default ReminderList;