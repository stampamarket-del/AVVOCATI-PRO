
import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { type Client, type Practice, type Lawyer } from '../types';
import { UserIcon, LoadingIcon, ChevronDownIcon } from './icons';

interface ClientListProps {
  onSelectPractice: (practiceId: number, clientId: number) => void;
  onEditClient: (client: Client | null) => void;
}

const getPriorityClass = (priority: Client['priority']) => {
    switch (priority) {
        case 'Alta': return 'bg-red-100 text-red-800';
        case 'Media': return 'bg-yellow-100 text-yellow-800';
        case 'Bassa': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const getStatusClass = (status: Practice['status']) => {
    switch (status) {
      case 'Aperta': return 'bg-blue-100 text-blue-800';
      case 'In corso': return 'bg-yellow-100 text-yellow-800';
      case 'Chiusa': return 'bg-gray-100 text-gray-800';
    }
};

const ClientList: React.FC<ClientListProps> = ({ onSelectPractice, onEditClient }) => {
  const { data: clients, error: clientsError } = useSWR<Client[]>('/api/clients');
  const { data: practices, error: practicesError } = useSWR<Practice[]>('/api/practices');
  const { data: lawyers, error: lawyersError } = useSWR<Lawyer[]>('/api/lawyers');

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const lowercasedTerm = searchTerm.toLowerCase();
    return clients.filter(client =>
      client.name.toLowerCase().includes(lowercasedTerm) ||
      client.email.toLowerCase().includes(lowercasedTerm) ||
      client.taxcode.toLowerCase().includes(lowercasedTerm)
    );
  }, [clients, searchTerm]);
  
  const getLawyerName = (lawyerId?: number) => {
    if (!lawyerId || !lawyers) return 'Non assegnato';
    const lawyer = lawyers.find(l => l.id === lawyerId);
    return lawyer ? `${lawyer.firstName} ${lawyer.lastName}` : 'Sconosciuto';
  };

  const handleToggleClient = (clientId: number) => {
    setExpandedClientId(prevId => (prevId === clientId ? null : clientId));
  };

  if (clientsError || practicesError || lawyersError) return <div className="text-red-500 p-4">Errore nel caricamento dei dati.</div>;
  if (!clients || !practices || !lawyers) return (
      <div className="flex items-center justify-center h-48">
          <LoadingIcon className="w-8 h-8 text-primary" />
          <span className="ml-3 text-secondary">Caricamento clienti...</span>
      </div>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-secondary">Elenco Clienti</h1>
        <div className="flex gap-2">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Cerca per nome, email, cod. fiscale..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-72 pl-10 pr-4 py-2 border rounded-lg focus:ring-primary focus:border-primary transition"
                    aria-label="Cerca clienti"
                />
                <svg className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <button
                onClick={() => onEditClient(null)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-800 transition-colors flex-shrink-0"
            >
                Nuovo Cliente
            </button>
        </div>
      </div>

      {filteredClients.length > 0 ? (
        <div className="space-y-4">
            {filteredClients.map(client => {
                const clientPractices = practices.filter(p => p.clientId === client.id);
                const isExpanded = expandedClientId === client.id;

                return (
                    <div key={client.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                        <div
                            className="p-6 cursor-pointer"
                            onClick={() => handleToggleClient(client.id!)}
                        >
                             <div className="flex justify-between items-start">
                                <div className="flex items-center mb-4">
                                    <div className="w-16 h-16 rounded-full mr-4 bg-light flex items-center justify-center flex-shrink-0">
                                        <UserIcon className="w-10 h-10 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-primary">{client.name}</h2>
                                        <p className="text-sm text-gray-600">{client.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getPriorityClass(client.priority)}`}>
                                        {client.priority}
                                    </span>
                                    <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            <div className="flex-grow">
                                <p className="text-gray-700 mb-1"><span className="font-semibold">Telefono:</span> {client.phone}</p>
                                <p className="text-gray-700"><span className="font-semibold">Cod. Fiscale:</span> {client.taxcode}</p>
                            </div>
                        </div>
                        
                        {isExpanded && (
                            <div className="border-t p-4 bg-light">
                                <h3 className="text-md font-semibold text-secondary mb-2">Pratiche Associate ({clientPractices.length})</h3>
                                {clientPractices.length > 0 ? (
                                    <ul className="space-y-2">
                                        {clientPractices.map(p => (
                                            <li key={p.id} onClick={() => onSelectPractice(p.id!, p.clientId)} className="flex justify-between items-center p-2 rounded-md hover:bg-blue-100 cursor-pointer transition-colors">
                                                <div>
                                                    <p className="font-semibold text-primary">{p.title}</p>
                                                    <p className="text-xs text-gray-500">Avv: {getLawyerName(p.lawyerId)} | Onorario: {p.fee.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusClass(p.status)}`}>
                                                    {p.status}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">Nessuna pratica trovata per questo cliente.</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-secondary">Nessun Cliente Trovato</h3>
            <p className="text-gray-500 mt-2">Prova a modificare i termini della tua ricerca o aggiungi un nuovo cliente.</p>
        </div>
      )}

    </div>
  );
};

export default ClientList;
