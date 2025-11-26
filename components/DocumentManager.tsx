
import React, { useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { type Document } from '../types';
import { addDocument, deleteDocument } from '../services/api';
import { LoadingIcon, UploadIcon, ScanIcon, TrashIcon, FilePdf, FileWord, FileImage, FileGeneric, SparklesIcon } from './icons';

interface DocumentManagerProps {
    clientId: number;
    practiceId?: number; // Opzionale per filtrare per pratica
    onScanDocument: () => void;
    onAnalyzeDocument: (document: Document) => void;
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage />;
    if (mimeType === 'application/pdf') return <FilePdf />;
    if (mimeType.includes('word')) return <FileWord />;
    return <FileGeneric />;
};

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const DocumentManager: React.FC<DocumentManagerProps> = ({ clientId, practiceId, onScanDocument, onAnalyzeDocument }) => {
    const documentsKey = practiceId ? `/api/documents?practiceId=${practiceId}` : `/api/documents?clientId=${clientId}`;
    const { data: documents, error } = useSWR<Document[]>(documentsKey);
    const { mutate } = useSWRConfig();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const dataUrl = await fileToDataUrl(file);
            const newDocument: Omit<Document, 'id'> = {
                clientId,
                practiceId,
                name: file.name,
                type: file.type,
                dataUrl,
                createdAt: new Date().toISOString(),
            };
            await addDocument(newDocument);
            await mutate(documentsKey);
        } catch (err) {
            console.error("Errore nel caricamento del file:", err);
        }
    };
    
    const handleDelete = async (id: number) => {
        try {
            await deleteDocument(id);
            await mutate(documentsKey);
        } catch (err) {
            console.error("Errore nella cancellazione del documento:", err);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-secondary">Documenti</h2>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-primary rounded-md hover:bg-blue-200 transition-colors">
                        <UploadIcon /> Carica File
                    </button>
                     <button onClick={onScanDocument} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-primary rounded-md hover:bg-blue-200 transition-colors">
                        <ScanIcon /> Scansiona
                    </button>
                </div>
            </div>
            
            {error && <div className="text-red-500">Errore nel caricamento dei documenti.</div>}
            {!documents && !error && <div className="flex items-center"><LoadingIcon className="mr-2" />Caricamento...</div>}
            
            {documents && (
                <div className="space-y-2">
                    {documents.length === 0 ? (
                        <p className="text-gray-500">Nessun documento presente.</p>
                    ) : (
                        documents.map(doc => (
                            <div key={doc.id} className="flex justify-between items-center p-2 rounded-md hover:bg-light">
                                <a href={doc.dataUrl} download={doc.name} className="flex items-center gap-3 flex-grow min-w-0">
                                    {getFileIcon(doc.type)}
                                    <div className="min-w-0">
                                        <p className="font-medium text-secondary truncate">{doc.name}</p>
                                        <p className="text-xs text-gray-500">Caricato il {new Date(doc.createdAt).toLocaleDateString('it-IT')}</p>
                                    </div>
                                </a>
                                <div className="flex items-center flex-shrink-0 ml-4">
                                    <button onClick={() => onAnalyzeDocument(doc)} className="text-yellow-600 hover:text-yellow-800 transition-colors p-1" title="Analizza con AI">
                                        <SparklesIcon className="w-5 h-5"/>
                                    </button>
                                    <button onClick={() => handleDelete(doc.id!)} className="text-gray-400 hover:text-red-600 transition-colors p-1" title="Elimina documento">
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default DocumentManager;
