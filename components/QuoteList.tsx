
import React, { useState, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { jsPDF } from 'jspdf';
import { type Quote, type Client, type FirmProfile, type Practice } from '../types';
import { deleteQuote } from '../services/api';
import { LoadingIcon, ArchiveBoxIcon, TrashIcon, PdfIcon } from './icons';
import { QuotePreview, type QuoteData } from './common/QuotePreview';

interface ViewQuoteModalProps {
    quote: Quote;
    client: Client | undefined;
    firmProfile: FirmProfile | undefined;
    onClose: () => void;
}

const ViewQuoteModal: React.FC<ViewQuoteModalProps> = ({ quote, client, firmProfile, onClose }) => {
    const quotePreviewRef = useRef<HTMLDivElement>(null);

    if (!client || !firmProfile) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white rounded-lg p-6"><LoadingIcon /> Caricamento...</div>
            </div>
        );
    }
    
    const syntheticPractice: Omit<Practice, 'id'> = {
        clientId: quote.clientId,
        title: quote.practiceTitle,
        type: quote.practiceType,
        notes: quote.practiceNotes,
        status: 'Aperta',
        value: 0,
        openedAt: quote.createdAt,
        priority: 'Media',
        fee: quote.fee,
        paidAmount: 0,
    };
    
    const quoteData: QuoteData = {
        client,
        firmProfile,
        practice: syntheticPractice,
        fees: {
            fee: quote.fee,
            cpa: quote.cpa,
            vat: quote.vat,
            total: quote.total,
        },
        date: quote.createdAt,
    };

    const handleSaveAsPdf = () => {
        const input = quotePreviewRef.current?.querySelector('.font-serif');
        if (!input) return;

        const doc = new jsPDF('p', 'pt', 'a4');
        doc.html(input as HTMLElement, {
            callback: (doc) => {
                doc.save(`Preventivo_${client.name.replace(/\s/g, '_')}.pdf`);
            },
            margin: [40, 40, 40, 40],
            autoPaging: 'text',
            width: 515,
            windowWidth: input.clientWidth,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-5xl m-4 max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-secondary mb-4">Dettaglio Preventivo</h2>
                <div ref={quotePreviewRef} className="flex-grow bg-gray-100 p-4 rounded-lg border overflow-y-auto">
                    <QuotePreview quoteData={quoteData} />
                </div>
                <div className="flex justify-end gap-4 pt-4 mt-auto">
                    <button type="button" onClick={handleSaveAsPdf} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"><PdfIcon/> Salva PDF</button>
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800">Chiudi</button>
                </div>
            </div>
        </div>
    );
};


const QuoteList: React.FC = () => {
    const { data: quotes, error: quotesError } = useSWR<Quote[]>('/api/quotes');
    const { data: clients, error: clientsError } = useSWR<Client[]>('/api/clients');
    const { data: firmProfile, error: firmProfileError } = useSWR<FirmProfile>('/api/firm-profile');
    const { mutate } = useSWRConfig();
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    
    const getClientName = (clientId: number) => {
        return clients?.find(c => c.id === clientId)?.name || 'Sconosciuto';
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Sei sicuro di voler eliminare questo preventivo salvato?')) {
            try {
                await deleteQuote(id);
                await mutate('/api/quotes');
            } catch (err) {
                console.error("Errore nell'eliminazione del preventivo:", err);
                alert("Si è verificato un errore durante l'eliminazione.");
            }
        }
    };
    
    const isLoading = (!quotes && !quotesError) || (!clients && !clientsError) || (!firmProfile && !firmProfileError);

    return (
        <div>
            {selectedQuote && <ViewQuoteModal quote={selectedQuote} client={clients?.find(c => c.id === selectedQuote.clientId)} firmProfile={firmProfile} onClose={() => setSelectedQuote(null)} />}
            <div className="flex items-center gap-3 mb-6">
                <ArchiveBoxIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-secondary">Preventivi Salvati</h1>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                 {isLoading && (
                     <div className="flex items-center justify-center h-48">
                        <LoadingIcon className="w-8 h-8 text-primary" />
                        <span className="ml-3 text-secondary">Caricamento preventivi...</span>
                    </div>
                 )}
                 {(quotesError || clientsError || firmProfileError) && <div className="text-red-500 p-4">Errore nel caricamento dei dati.</div>}
                 
                 {quotes && clients && firmProfile && (
                     <div className="space-y-3">
                         {quotes.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Nessun preventivo salvato. Vai alla sezione 'Preventivi' per generarne e salvarne uno.</p>
                         ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oggetto</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Totale</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {quotes.map(quote => (
                                            <tr key={quote.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getClientName(quote.clientId)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{quote.practiceTitle}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold">{quote.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(quote.createdAt).toLocaleDateString('it-IT')}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => setSelectedQuote(quote)} className="text-primary hover:text-blue-800 mr-4">Visualizza</button>
                                                    <button onClick={() => handleDelete(quote.id!)} className="text-gray-500 hover:text-red-800" title="Elimina"><TrashIcon className="inline w-4 h-4"/></button>
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

export default QuoteList;
