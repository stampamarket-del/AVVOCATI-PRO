import React, { useState } from 'react';
import { useSWRConfig } from 'swr';
import { createReminder } from '../../services/api';
import { LoadingIcon } from '../icons';

interface AddReminderModalProps {
    title: string;
    practiceId: number;
    onClose: () => void;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({ title, practiceId, onClose }) => {
    const { mutate } = useSWRConfig();
    const [dueDate, setDueDate] = useState(new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]);
    const [priority, setPriority] = useState<'Alta' | 'Media' | 'Bassa'>('Media');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await createReminder({
                title,
                practiceId,
                dueDate,
                priority,
            });
            await mutate('/api/reminders');
            onClose();
        } catch (err) {
            console.error(err);
            setError("Si è verificato un errore durante la creazione del promemoria.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-secondary mb-2">Nuovo Promemoria</h2>
                <p className="text-gray-600 mb-4 truncate">Da milestone: <span className="font-semibold">{title}</span></p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Data Scadenza</label>
                        <input
                            type="date"
                            id="dueDate"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priorità</label>
                        <select
                            id="priority"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as 'Alta' | 'Media' | 'Bassa')}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        >
                            <option>Media</option>
                            <option>Alta</option>
                            <option>Bassa</option>
                        </select>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end gap-4 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annulla</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800 disabled:bg-gray-400 w-32 flex justify-center">
                            {isSubmitting ? <LoadingIcon /> : 'Aggiungi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};