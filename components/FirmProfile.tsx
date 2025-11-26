import React, { useState, useEffect, useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { type FirmProfile } from '../types';
import { updateFirmProfile } from '../services/api';
import { LoadingIcon, BriefcaseIcon, UploadIcon } from './icons';

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const FirmProfile: React.FC = () => {
    const profileKey = '/api/firm-profile';
    const { data: profile, error, isLoading: isLoadingProfile } = useSWR<FirmProfile>(profileKey);
    const { mutate } = useSWRConfig();

    const [formData, setFormData] = useState<Partial<FirmProfile>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        if (profile) {
            setFormData(profile);
        }
    }, [profile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const dataUrl = await fileToDataUrl(file);
                setFormData(prev => ({ ...prev, logoUrl: dataUrl }));
            } catch (err) {
                console.error("Errore nel caricamento del logo:", err);
                setFeedback({ type: 'error', message: 'Errore nel caricamento del logo.' });
            }
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setFeedback(null);
        try {
            await updateFirmProfile(formData as FirmProfile);
            await mutate(profileKey);
            setFeedback({ type: 'success', message: 'Profilo aggiornato con successo!' });
        } catch (err) {
            console.error("Errore nel salvataggio del profilo:", err);
            setFeedback({ type: 'error', message: 'Si è verificato un errore durante il salvataggio.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoadingProfile) {
        return <div className="flex items-center justify-center h-full"><LoadingIcon className="w-8 h-8 text-primary" /><p className="ml-3">Caricamento profilo...</p></div>;
    }
    
    if (error) {
        return <div className="text-red-500 p-4">Errore nel caricamento del profilo dello studio.</div>;
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <BriefcaseIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-secondary">Profilo Studio Legale</h1>
            </div>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Logo Section */}
                    <div className="md:col-span-1 flex flex-col items-center">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Logo Studio</label>
                        <div className="w-48 h-48 rounded-full bg-light border-2 border-dashed flex items-center justify-center mb-4 overflow-hidden">
                           {formData.logoUrl ? (
                             <img src={formData.logoUrl} alt="Logo anteprima" className="w-full h-full object-cover" />
                           ) : (
                             <span className="text-gray-500 text-center text-sm p-4">Nessun logo caricato</span>
                           )}
                        </div>
                        <label htmlFor="logo-upload" className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm bg-blue-100 text-primary rounded-md hover:bg-blue-200 transition-colors">
                            <UploadIcon />
                            <span>Cambia Logo</span>
                            <input id="logo-upload" name="logoUrl" type="file" accept="image/*" className="hidden" onChange={handleLogoChange}/>
                        </label>
                    </div>
                    
                    {/* Data Section */}
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Studio Legale</label>
                            <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                         <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Indirizzo Completo</label>
                            <input type="text" id="address" name="address" value={formData.address || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700">P. IVA / Cod. Fiscale</label>
                                <input type="text" id="vatNumber" name="vatNumber" value={formData.vatNumber || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefono</label>
                                <input type="tel" id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email di Contatto</label>
                            <input type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end items-center gap-4">
                    {feedback && (
                        <p className={`text-sm ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{feedback.message}</p>
                    )}
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-800 disabled:bg-gray-400 w-36 flex justify-center">
                        {isSaving ? <LoadingIcon /> : 'Salva Modifiche'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FirmProfile;
