
import React from 'react';
import useSWR from 'swr';
import { type Lawyer, type Practice } from '../types';
import { UserIcon, LoadingIcon } from './icons';

interface LawyerListProps {
    onEditLawyer: (lawyer: Lawyer | null) => void;
}

const LawyerList: React.FC<LawyerListProps> = ({ onEditLawyer }) => {
    const { data: lawyers, error: lawyersError } = useSWR<Lawyer[]>('/api/lawyers');
    const { data: practices, error: practicesError } = useSWR<Practice[]>('/api/practices');

    if (lawyersError || practicesError) return <div className="text-red-500 p-4">Errore nel caricamento dei dati.</div>;
    if (!lawyers || !practices) return (
        <div className="flex items-center justify-center h-48">
            <LoadingIcon className="w-8 h-8 text-primary" />
            <span className="ml-3 text-secondary">Caricamento avvocati...</span>
        </div>
    );

    const getActivePracticesCount = (lawyerId: number) => {
        return practices.filter(p => p.lawyerId === lawyerId && p.status !== 'Chiusa').length;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-secondary">Elenco Avvocati</h1>
                <button
                    onClick={() => onEditLawyer(null)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                    Nuovo Avvocato
                </button>
            </div>

            {lawyers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lawyers.map(lawyer => (
                        <div key={lawyer.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full mb-4 bg-light flex items-center justify-center overflow-hidden">
                                {lawyer.photoUrl ? (
                                    <img src={lawyer.photoUrl} alt={`${lawyer.firstName} ${lawyer.lastName}`} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-16 h-16 text-primary" />
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-primary">{lawyer.firstName} {lawyer.lastName}</h2>
                            <p className="text-sm text-accent font-semibold">{lawyer.specialization}</p>
                            <div className="my-4 text-left space-y-1 text-gray-700 text-sm">
                                <p><span className="font-semibold">Email:</span> {lawyer.email}</p>
                                <p><span className="font-semibold">Tel:</span> {lawyer.phone}</p>
                                <p><span className="font-semibold">Tariffa:</span> {lawyer.billingType === 'Oraria' ? `${lawyer.billingRate} €/ora` : `${lawyer.billingRate.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} (Fissa)`}</p>
                            </div>
                            <div className="mt-auto pt-4 border-t w-full">
                                <p className="text-lg font-bold text-secondary">{getActivePracticesCount(lawyer.id!)}</p>
                                <p className="text-sm text-gray-500">Pratiche Attive</p>
                            </div>
                             <button
                                onClick={() => onEditLawyer(lawyer)}
                                className="mt-4 px-4 py-1.5 text-xs bg-secondary text-white rounded-md hover:bg-gray-600 transition-colors"
                            >
                                Modifica Profilo
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-secondary">Nessun Avvocato Trovato</h3>
                    <p className="text-gray-500 mt-2">Aggiungi il primo avvocato del tuo studio.</p>
                </div>
            )}
        </div>
    );
};

export default LawyerList;