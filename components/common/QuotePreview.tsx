
import React from 'react';
import { type Client, type Practice, type FirmProfile } from '../../types';

export interface QuoteData {
    firmProfile: FirmProfile;
    client: Client;
    practice: Omit<Practice, 'id'> | Practice;
    fees: {
        fee: number;
        cpa: number;
        vat: number;
        total: number;
    };
    date: string;
}

export const QuotePreview: React.FC<{ quoteData: QuoteData }> = ({ quoteData }) => {
    const { firmProfile, client, practice, fees, date } = quoteData;
    return (
        <div className="bg-white shadow-lg p-12 mx-auto max-w-4xl print:shadow-none print:p-0 print:max-w-none font-serif text-gray-800">
            <header className="flex justify-between items-start pb-6 border-b">
                <div className="w-2/3">
                    {firmProfile.logoUrl && (
                        <img src={firmProfile.logoUrl} alt="Logo Studio" className="h-16 mb-4 object-contain" />
                    )}
                    <h2 className="text-2xl font-bold text-primary">{firmProfile.name}</h2>
                    <p className="text-sm text-gray-700">{firmProfile.address}</p>
                    <p className="text-sm text-gray-700">P.IVA: {firmProfile.vatNumber} | Email: {firmProfile.email}</p>
                </div>
                <div className="text-right">
                    <h1 className="text-4xl font-bold uppercase text-gray-800">Preventivo</h1>
                    <p className="text-sm text-gray-700 mt-2">Data: {new Date(date).toLocaleDateString('it-IT')}</p>
                </div>
            </header>
            <section className="my-8 grid grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold text-gray-600 mb-2 uppercase tracking-wider text-sm">Destinatario</h3>
                    <p className="font-bold text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-800">Cod. Fisc.: {client.taxcode}</p>
                </div>
                <div className="text-right">
                    <h3 className="font-semibold text-gray-600 mb-2 uppercase tracking-wider text-sm">Oggetto</h3>
                    <p className="font-bold text-gray-900">{practice.title}</p>
                </div>
            </section>
            <section className="my-8">
                <p className="text-gray-800 mb-4 leading-relaxed">
                    Gentile {client.name},<br/>
                    facendo seguito alla Sua richiesta, siamo a sottoporre alla Vostra attenzione il preventivo per l'assistenza legale relativa all'oggetto.
                </p>
                <div className="p-4 bg-gray-50 rounded-md border">
                    <h4 className="font-bold text-gray-900 mb-2">1. Descrizione dell'Attività</h4>
                    <p className="text-sm text-gray-700">{practice.notes}</p>
                </div>
            </section>
            <section className="my-8">
                <h4 className="font-bold text-gray-900 mb-2">2. Dettaglio Compensi</h4>
                <table className="w-full text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-sm font-semibold text-gray-700 uppercase">Voce</th>
                            <th className="p-3 text-right text-sm font-semibold text-gray-700 uppercase">Importo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        <tr className="text-gray-800"><td className="p-3">Onorario Professionale</td><td className="p-3 text-right">{fees.fee.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td></tr>
                        <tr className="text-gray-800"><td className="p-3">Contributo Cassa Previdenza Avvocati (C.P.A. 4%)</td><td className="p-3 text-right">{fees.cpa.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td></tr>
                        <tr className="text-gray-800"><td className="p-3">Imposta sul Valore Aggiunto (I.V.A. 22%)</td><td className="p-3 text-right">{fees.vat.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td></tr>
                    </tbody>
                    <tfoot className="font-bold bg-gray-100 text-gray-900">
                        <tr><td className="p-3 text-lg">TOTALE PREVISTO</td><td className="p-3 text-right text-lg">{fees.total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td></tr>
                    </tfoot>
                </table>
                <p className="text-xs text-gray-600 mt-2">Il presente preventivo non include eventuali spese vive (es. contributo unificato, marche da bollo, costi di notifica) che saranno documentate e addebitate a parte.</p>
            </section>
            <footer className="mt-16 text-right text-gray-800">
                <p>Distinti saluti,</p>
                <div className="h-16"></div>
                <p className="font-bold border-t pt-2 border-gray-300">{firmProfile.name}</p>
            </footer>
        </div>
    );
};
