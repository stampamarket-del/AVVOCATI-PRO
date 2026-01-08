
import React from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { type User } from '../types';
import { ShieldIcon, UserIcon, TrashIcon, LogoutIcon, LoadingIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { deleteProfile } from '../services/api';

const AdminPanel: React.FC = () => {
    const { logout } = useAuth();
    const { mutate } = useSWRConfig();
    const { data: profiles, error, isLoading } = useSWR<any[]>('/api/profiles');

    const handleDeleteUser = async (id: string, name: string) => {
        if (window.confirm(`Sei sicuro di voler eliminare il profilo di ${name}? L'accesso dovrà essere rimosso manualmente dalla dashboard di Supabase Auth.`)) {
            try {
                await deleteProfile(id);
                await mutate('/api/profiles');
            } catch (err) {
                alert("Errore durante l'eliminazione del profilo.");
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <ShieldIcon className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold text-secondary">Amministrazione</h1>
                </div>
                <button 
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                    <LogoutIcon className="w-5 h-5" />
                    <span>Disconnetti</span>
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-secondary mb-4">Utenti del Sistema</h2>
                <p className="text-sm text-gray-500 mb-6">Nota: La creazione di nuovi utenti admin deve essere gestita tramite la registrazione standard o la dashboard Supabase.</p>
                
                {isLoading ? (
                    <div className="flex justify-center p-8"><LoadingIcon className="w-8 h-8 text-primary" /></div>
                ) : error ? (
                    <p className="text-red-500">Errore nel caricamento dei profili.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruolo</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {profiles?.map(profile => (
                                    <tr key={profile.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-primary">
                                                    <UserIcon className="w-5 h-5"/>
                                                </div>
                                                <div className="ml-4 text-sm font-medium text-gray-900">{profile.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${profile.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                                {profile.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {profile.role !== 'admin' && (
                                                <button onClick={() => handleDeleteUser(profile.id, profile.name)} className="text-red-600 hover:text-red-900">
                                                    <TrashIcon className="w-5 h-5"/>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
