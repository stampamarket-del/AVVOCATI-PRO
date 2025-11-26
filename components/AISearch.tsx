
import React, { useState } from 'react';
import useSWR from 'swr';
import { type Practice } from '../types';
import { searchKnowledgeBase } from '../services/geminiService';
import { LoadingIcon, SparklesIcon, AISearchIcon } from './icons';

const AISearch: React.FC = () => {
    const { data: practices, error: practicesError } = useSWR<Practice[]>('/api/practices');
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || !practices) {
            setError("Inserisci una domanda per avviare la ricerca.");
            return;
        }
        setIsLoading(true);
        setResult('');
        setError('');
        const response = await searchKnowledgeBase(query, practices);
        if (response.startsWith("Si è verificato un errore")) {
            setError(response);
        } else {
            setResult(response);
        }
        setIsLoading(false);
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <AISearchIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-secondary">Ricerca AI nella Base di Conoscenza</h1>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Es: mostrami casi passati relativi a vizi di forma in contratti di locazione..."
                        className="flex-grow p-3 border rounded-lg focus:ring-primary focus:border-primary transition"
                        aria-label="Domanda per la ricerca AI"
                    />
                    <button type="submit" disabled={isLoading || !practices} className="flex justify-center items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:bg-gray-400">
                        {isLoading ? <LoadingIcon /> : <SparklesIcon />}
                        <span>Cerca</span>
                    </button>
                </form>
                {practicesError && <p className="text-red-500 text-sm mt-2">Errore nel caricamento della base di conoscenza.</p>}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md min-h-[400px]">
                 <h2 className="text-xl font-bold text-secondary mb-4">Risultati della Ricerca</h2>
                 {isLoading && (
                    <div className="flex justify-center items-center h-full">
                        <LoadingIcon className="w-8 h-8 text-primary" />
                        <span className="ml-3 text-secondary">L'AI sta cercando nel tuo archivio...</span>
                    </div>
                 )}
                 {error && <div className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{error}</div>}
                 {result && (
                    <div className="bg-light p-4 rounded-lg border border-gray-200 h-full overflow-y-auto">
                       <pre className="text-sm text-secondary whitespace-pre-wrap font-sans">{result}</pre>
                    </div>
                 )}
                 {!isLoading && !result && !error && (
                    <div className="text-center text-gray-500 h-full flex flex-col justify-center items-center">
                        <p>I risultati della ricerca appariranno qui.</p>
                        <p className="text-sm">Fai una domanda per interrogare l'archivio delle pratiche.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default AISearch;