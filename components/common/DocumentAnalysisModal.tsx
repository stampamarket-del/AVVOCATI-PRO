
import React, { useState } from 'react';
import { type Document } from '../../types';

interface DocumentAnalysisModalProps {
    doc: Document;
    onClose: () => void;
    onAnalyze: (prompt: string) => void;
}

export const DocumentAnalysisModal: React.FC<DocumentAnalysisModalProps> = ({ doc, onClose, onAnalyze }) => {
    const [prompt, setPrompt] = useState('');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
                <h2 className="text-2xl font-bold text-secondary mb-2">Analizza Documento</h2>
                <p className="text-gray-600 mb-4">Stai analizzando: <span className="font-semibold">{doc.name}</span></p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                    placeholder="Es: Riassumi i punti chiave di questo documento, oppure, estrai tutte le date e gli importi menzionati..."
                />
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Annulla</button>
                    <button onClick={() => onAnalyze(prompt)} disabled={!prompt.trim()} className="px-4 py-2 bg-accent text-primary-darkest font-semibold rounded-md hover:bg-yellow-600 disabled:bg-gray-400">
                        Avvia Analisi
                    </button>
                </div>
            </div>
        </div>
    );
};
