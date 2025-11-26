
import React, { useState, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { type Lawyer, type Practice } from '../types';
import { createLawyer, updateLawyer, deleteLawyer } from '../services/api';
import { LoadingIcon, UserIcon, UploadIcon, TrashIcon } from './icons';

interface LawyerFormProps {
    lawyer: Lawyer | null;
    onClose: () => void;
}

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const LawyerForm: React.FC<LawyerFormProps> = ({ lawyer, onClose }) => {
    const { mutate } = useSWRConfig();
    const { data: practices } = useSWR<Practice[]>('/api/practices');
    const [formData, setFormData] = useState<Partial<Lawyer>>({
        firstName: '', lastName: '', email: '', phone: '', specialization: '', photoUrl: '', billingType: 'Oraria', billingRate: 0
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (lawyer) {
            setFormData(lawyer);
        } else {
            setFormData({
                firstName: '', lastName: '', email: '', phone: '', specialization: '', photoUrl: '', billingType: 'Oraria', billingRate: 0
            });
        }
    }, [lawyer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ['billingRate'];
        setFormData(prev => ({ ...prev, [name]: numericFields.includes(name) ? Number(value) : value }));
    };
    
    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const dataUrl = await fileToDataUrl(file);
                setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
            } catch (err) {
                console.error("Errore nel caricamento della foto:", err);
                setError('Errore nel caricamento della foto.');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            if (lawyer && lawyer.id) { // Update
                await updateLawyer({ ...formData, id: lawyer.id });
            } else { // Create
                await createLawyer(formData as Lawyer);
            }
            await mutate('/api/lawyers');
            onClose();
        } catch (err) {
            console.error(err);
            setError('Si è verificato un errore durante il salvataggio.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDelete = async () => {
        if (lawyer && lawyer.id && practices) {
            const associatedPractices = practices.filter(p => p.lawyerId === lawyer.id);
            if (associatedPractices.length > 0) {
                setError(`Impossibile eliminare l'avvocato. È assegnato a ${associatedPractices.length} pratica/he.`);
                return;
            }

            if (window.confirm(`Sei sicuro di voler eliminare ${lawyer.firstName} ${lawyer.lastName}? Questa azione non può essere annullata.`)) {
                setIsLoading(true);
                try {
                    await deleteLawyer(lawyer.id);
                    await mutate('/api/lawyers');
                    onClose();
                } catch (err) {
                    console.error("Errore durante l'eliminazione:", err);
                    setError("Si è verificato un errore durante l'eliminazione.");
                } finally {
                    setIsLoading(false);
                }
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
                <h2 className="text-2xl font-bold text-secondary mb-4">{lawyer ? 'Modifica Avvocato' : 'Nuovo Avvocato'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-light border flex items-center justify-center overflow-hidden">
                           {formData.photoUrl ? (
                             <img src={formData.photoUrl} alt="Foto profilo" className="w-full h-full object-cover" />
                           ) : (
                             <UserIcon className="w-16 h-16 text-gray-400" />
                           )}
                        </div>
                         <label htmlFor="photo-upload" className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm bg-blue-100 text-primary rounded-md hover:bg-blue-200 transition-colors">
                            <UploadIcon />
                            <span>Carica Foto</span>
                            <input id="photo-upload" name="photoUrl" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange}/>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Nome</label>
                            <input type="text" id="firstName" name="firstName" value={formData.firstName || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary" />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Cognome</label>
                            <input type="text" id="lastName" name="lastName" value={formData.lastName || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary" />
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefono</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary" />
                    </div>
                     <div>
                        <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">Specializzazione</label>
                        <input type="text" id="specialization" name="specialization" value={formData.specialization || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="billingType" className="block text-sm font-medium text-gray-700">Tipo di Tariffa</label>
                            <select id="billingType" name="billingType" value={formData.billingType || 'Oraria'} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary">
                                <option>Oraria</option>
                                <option>Fissa</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="billingRate" className="block text-sm font-medium text-gray-700">
                                {formData.billingType === 'Oraria' ? 'Tariffa Oraria (€)' : 'Tariffa Fissa (€)'}
                            </label>
                            <input type="number" id="billingRate" name="billingRate" value={formData.billingRate || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary" step="0.01"/>
                        </div>
                    </div>


                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <div className="flex justify-between items-center gap-4 pt-4">
                        <div>
                            {lawyer && (
                                <button type="button" onClick={handleDelete} disabled={isLoading} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 disabled:text-gray-400">
                                    <TrashIcon /> Elimina
                                </button>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annulla</button>
                            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800 disabled:bg-gray-400 w-32 flex justify-center">
                                {isLoading ? <LoadingIcon /> : 'Salva'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LawyerForm;
