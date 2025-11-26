
import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { type Practice, type Client, type Lawyer } from '../types';
import { LoadingIcon, SparklesIcon } from './icons';

interface PracticeListProps {
  onNewPractice: () => void;
  onSelectPractice: (id: number, clientId: number) => void;
}

const getStatusClass = (status: 'Aperta' | 'In corso' | 'Chiusa') => {
  switch (status) {
    case 'Aperta':
      return 'bg-blue-100 text-blue-800';
    case 'In corso':
      return 'bg-yellow-100 text-yellow-800';
    case 'Chiusa':
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityClass = (priority: 'Alta' | 'Media' | 'Bassa') => {
    switch (priority) {
        case 'Alta': return 'bg-red-100 text-red-800';
        case 'Media': return 'bg-yellow-100 text-yellow-800';
        case 'Bassa': return 'bg-green-100 text-green-800';
    }
};

const PracticeList: React.FC<PracticeListProps> = ({ onNewPractice, onSelectPractice }) => {
  const { data: practices, error: practicesError } = useSWR<Practice[]>('/api/practices');
  const { data: clients, error: clientsError } = useSWR<Client[]>('/api/clients');
  const { data: lawyers, error: lawyersError } = useSWR<Lawyer[]>('/api/lawyers');
  const [searchTerm, setSearchTerm] = useState('');

  const getClientName = (clientId: number) => {
    return clients?.find(c => c.id === clientId)?.name || 'Sconosciuto';
  };
  
  const getLawyerName = (lawyerId?: number) => {
    if (!lawyerId) return 'Non assegnato';
    const lawyer = lawyers?.find(l => l.id === lawyerId);
    return lawyer ? `${lawyer.firstName} ${lawyer.lastName}` : 'Sconosciuto';
  };

  const filteredPractices = useMemo(() => {
    if (!practices || !clients) return [];
    const lowercasedTerm = searchTerm.toLowerCase();
    return practices.filter(p =>
      p.title.toLowerCase().includes(lowercasedTerm) ||
      p.type.toLowerCase().includes(lowercasedTerm) ||
      getClientName(p.clientId).toLowerCase().includes(lowercasedTerm)
    );
  }, [practices, clients, searchTerm]);

  if (practicesError || clientsError || lawyersError) return <div className="text-red-500 p-4">Errore nel caricamento dei dati delle pratiche.</div>;
  if (!practices || !clients || !lawyers) return (
      <div className="flex items-center justify-center h-48">
          <LoadingIcon className="w-8 h-8 text-primary" />
          <span className="ml-3 text-secondary">Caricamento pratiche...</span>
      </div>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-secondary">Elenco Pratiche</h1>
         <div className="flex gap-2">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Cerca per titolo, tipo, cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-72 pl-10 pr-4 py-2 border rounded-lg focus:ring-primary focus:border-primary transition"
                    aria-label="Cerca pratiche"
                />
                 <svg className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <button
              onClick={onNewPractice}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              Nuova Pratica
            </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titolo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avvocato Assegnato</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorità</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Onorario</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valore Causa</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldato</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Apertura</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPractices.map(practice => {
                const d = new Date(practice.openedAt);
                const formattedOpenedAt = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                
                return (
                <tr key={practice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                        className="text-sm font-medium text-primary hover:underline cursor-pointer"
                        onClick={() => onSelectPractice(practice.id!, practice.clientId)}
                    >
                        {practice.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getClientName(practice.clientId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getLawyerName(practice.lawyerId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(practice.status)}`}>
                      {practice.status}
                    </span>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(practice.priority)}`}>
                      {practice.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                    <div className="flex items-center gap-2">
                        <span>{(practice.fee || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</span>
                        {practice.fee > 10000 && (
                            <span className="p-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800" title="Pratica di alto valore">
                                <SparklesIcon className="w-4 h-4" />
                            </span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {(practice.value || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">
                    {(practice.paidAmount || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formattedOpenedAt}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
            {filteredPractices.length === 0 && (
                 <div className="text-center py-8 text-gray-500">
                    Nessuna pratica trovata.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PracticeList;
