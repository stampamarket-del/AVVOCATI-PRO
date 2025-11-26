
import React, { useState, useEffect } from 'react';
import { db } from '../data/db';
import { type User } from '../types';
import { ShieldIcon, UserIcon, TrashIcon, UserPlusIcon, LogoutIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

const AdminPanel: React.FC = () => {
    const { logout } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [newUser, setNewUser] = useState<Partial<User>>({ username: '', password: '', name: '', role: 'user' });
    const [loading, setLoading] = useState(true);

    const loadUsers = async () => {
        setLoading(true);
        const allUsers = await db.users.toArray();
        setUsers(allUsers);
        setLoading(false);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.username || !newUser.password || !newUser.name) return;

        try {
            await db.users.add(newUser as User);
            setNewUser({ username: '', password: '', name: '', role: 'user' });
            loadUsers();
        } catch (error) {
            alert("Errore: username probabilmente già esistente.");
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (window.confirm("Sei sicuro di voler eliminare questo utente?")) {
            await db.users.delete(id);
            loadUsers();
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User List */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-secondary mb-4">Utenti del Sistema</h2>
                    {loading ? <p>Caricamento...</p> : (
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
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-primary">
                                                        <UserIcon className="w-5 h-5"/>
                                                    </div>
                                                    <div className="ml-4 text-sm font-medium text-gray-900">{user.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {user.username !== 'admin' && (
                                                    <button onClick={() => handleDeleteUser(user.id!)} className="text-red-600 hover:text-red-900">
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

                {/* Add User Form */}
                <div className="bg-white p-6 rounded-lg shadow-md h-fit">
                    <h2 className="text-xl font-bold text-secondary mb-4">Aggiungi Utente</h2>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                            <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required className="mt-1 block w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required className="mt-1 block w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required className="mt-1 block w-full px-3 py-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ruolo</label>
                            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as 'user' | 'admin'})} className="mt-1 block w-full px-3 py-2 border rounded-md">
                                <option value="user">Utente</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-800">
                            <UserPlusIcon /> Crea Utente
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
