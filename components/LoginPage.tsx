
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LockIcon, ShieldIcon, LoadingIcon } from './icons';

interface LoginPageProps {
    onSwitchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError('');
        
        try {
            const success = await login(username, password);
            if (!success) {
                setError('Credenziali non valide. Riprova.');
            }
        } catch (err) {
            setError('Si è verificato un errore durante il login.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-light flex flex-col justify-center items-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-primary">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 bg-blue-100 rounded-full mb-4">
                        <ShieldIcon className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-secondary">Studio Legale AI CRM</h1>
                    <p className="text-gray-500">Accedi per continuare</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Utente</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary transition"
                            placeholder="admin"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary transition"
                            placeholder="admin"
                        />
                    </div>

                    {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">{error}</div>}

                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
                    >
                        {isLoggingIn ? <LoadingIcon /> : <><LockIcon className="w-4 h-4 mr-2"/> Accedi</>}
                    </button>
                </form>
                
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Non hai un account?{' '}
                        <button onClick={onSwitchToRegister} className="font-medium text-primary hover:text-blue-800 transition-colors">
                            Registrati ora
                        </button>
                    </p>
                </div>

                <div className="mt-6 text-center text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} AI Legal CRM. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
