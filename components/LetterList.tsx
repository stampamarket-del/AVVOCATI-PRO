
import React, { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { jsPDF } from 'jspdf';
import { type Letter, type Client } from '../types';
import { deleteLetter } from '../services/api';
import { LoadingIcon, LettersIcon, TrashIcon, PdfIcon } from './icons';

interface LetterListProps {}

const ViewLetterModal: React.FC<{ letter: Letter; clientName: string; onClose: () => void; }> = ({ letter, clientName, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl m-4 max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-secondary mb-2">Dettaglio Lettera</h2>
                <div className="text-sm text-gray-600 mb-4">
                    <p><strong>Cliente:</strong> {clientName}</p>
                    <p><strong>Data Salvataggio:</strong> {new Date(letter.createdAt).toLocaleString('it-IT')}</p>
                </div>
                <div className="flex-grow bg-light p-4 rounded-lg border overflow-y-auto">
                    <h3 className="font-bold text-primary mb-2">Oggetto: {letter.subject}</h3>
                    <hr className="mb-2"/>
                    <pre className="text-sm text-secondary whitespace-pre-wrap font-sans">{letter.body}</pre>
                </div>
                <div className="flex justify-end pt-4 mt-auto">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800">Chiudi</button>
                </div>
            </div>
        </div>
    );
};

const LetterList: React.FC<LetterListProps> = () => {
    const { data: letters, error: lettersError } = useSWR<Letter[]>('/api/letters');
    const { data: clients, error: clientsError } = useSWR<Client[]>('/api/clients');
    const { mutate } = useSWRConfig();
    const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
    
    const getClientName = (clientId: number) => {
        return clients?.find(c => c.id === clientId)?.name || 'Sconosciuto';
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Sei sicuro di voler eliminare questa lettera salvata?')) {
            try {
                await deleteLetter(id);
                await mutate('/api/letters');
            } catch (err) {
                console.error("Errore nell'eliminazione della lettera:", err);
                alert("Si è verificato un errore durante l'eliminazione.");
            }
        }
    };
    
    const handleGeneratePdf = (letter: Letter) => {
        const doc = new jsPDF();
        const textLines = doc.splitTextToSize(letter.body, 180);
        doc.text(textLines, 15, 15);
        doc.save(`Lettera_${letter.subject.replace(/ /g, "_")}.pdf`);
    };
    
    const isLoading = (!letters && !lettersError) || (!clients && !clientsError);

    return (
        <div>
            {selectedLetter && <ViewLetterModal letter={selectedLetter} clientName={getClientName(selectedLetter.clientId)} onClose={() => setSelectedLetter(null)} />}
            <div className="flex items-center gap-3 mb-6">
                <LettersIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-secondary">Lettere Salvate</h1>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                 {isLoading && (
                     <div className="flex items-center justify-center h-48">
                        <LoadingIcon className="w-8 h-8 text-primary" />
                        <span className="ml-3 text-secondary">Caricamento lettere...</span>
                    </div>
                 )}
                 {(lettersError || clientsError) && <div className="text-red-500 p-4">Errore nel caricamento dei dati.</div>}
                 
                 {letters && clients && (
                     <div className="space-y-3">
                         {letters.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Nessuna lettera salvata. Usa l'Assistente AI per generarne e salvarne una.</p>
                         ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oggetto</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {letters.map(letter => (
                                            <tr key={letter.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getClientName(letter.clientId)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{letter.subject}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(letter.createdAt).toLocaleDateString('it-IT')}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => setSelectedLetter(letter)} className="text-primary hover:text-blue-800 mr-4">Visualizza</button>
                                                     <button onClick={() => handleGeneratePdf(letter)} className="text-red-600 hover:text-red-800 mr-4" title="Genera PDF"><PdfIcon className="inline w-5 h-5"/></button>
                                                    <button onClick={() => handleDelete(letter.id!)} className="text-gray-500 hover:text-red-800" title="Elimina"><TrashIcon className="inline w-4 h-4"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                         )}
                     </div>
                 )}
            </div>
        </div>
    );
};

export default LetterList;