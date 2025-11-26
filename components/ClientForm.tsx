
import React, { useState, useEffect } from 'react';
import { useSWRConfig } from 'swr';
import { type Client } from '../types';
import { createClient, updateClient } from '../services/api';
import { LoadingIcon } from './icons';

interface ClientFormProps {
    client: Client | null;
    onClose: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ client, onClose }) => {
    const { mutate } = useSWRConfig();
    const [formData, setFormData] = useState<Partial<Client>>({
        name: '',
        email: '',
        phone: '',
        taxcode: '',
        notes: '',
        priority: 'Media',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (client) {
            setFormData(client);
        } else {
            setFormData({
                name: '', email: '', phone: '', taxcode: '', notes: '', priority: 'Media',
            });
        }
    }, [client]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            if (client && client.id) { // Update existing client
                await updateClient({ ...formData, id: client.id });
            } else { // Create new client
                await createClient({
                    ...formData,
                    name: formData.name || 'Senza nome',
                    email: formData.email || '',
                    phone: formData.phone || '',
                    taxcode: formData.taxcode || '',
                    priority: formData.priority || 'Media',
                    createdAt: new Date().toISOString(),
                });
            }
            await mutate('/api/clients');
            onClose();
        } catch (err) {
            console.error(err);
            setError('Si è verificato un errore durante il salvataggio.');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
                <h2 className="text-2xl font-bold text-secondary mb-4">{client ? 'Modifica Cliente' : 'Nuovo Cliente'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefono</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                     <div>
                        <label htmlFor="taxcode" className="block text-sm font-medium text-gray-700">Codice Fiscale</label>
                        <input type="text" id="taxcode" name="taxcode" value={formData.taxcode} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                     <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priorità/Urgenza</label>
                        <select id="priority" name="priority" value={formData.priority} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                            <option>Bassa</option>
                            <option>Media</option>
                            <option>Alta</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Note</label>
                        <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"></textarea>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annulla</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800 disabled:bg-gray-400 w-32 flex justify-center">
                            {isLoading ? <LoadingIcon /> : 'Salva Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientForm;