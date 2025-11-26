
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlusIcon, ShieldIcon, LoadingIcon } from './icons';

interface RegisterPageProps {
    onSwitchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Le password non coincidono.');
            return;
        }

        if (formData.password.length < 4) {
             setError('La password deve essere di almeno 4 caratteri.');
             return;
        }

        setIsLoading(true);
        
        try {
            const result = await register({
                name: formData.name,
                username: formData.username,
                password: formData.password
            });

            if (!result.success) {
                setError(result.message || 'Errore durante la registrazione.');
            }
        } catch (err) {
            setError('Si è verificato un errore imprevisto.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-light flex flex-col justify-center items-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-accent">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 bg-yellow-100 rounded-full mb-4">
                        <ShieldIcon className="w-12 h-12 text-accent" />
                    </div>
                    <h1 className="text-2xl font-bold text-secondary">Crea un Account</h1>
                    <p className="text-gray-500">Unisciti allo Studio Legale AI CRM</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent transition"
                            placeholder="Mario Rossi"
                        />
                    </div>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent transition"
                            placeholder="mario.rossi"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent transition"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Conferma Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent transition"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">{error}</div>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:bg-gray-400 transition-colors"
                    >
                        {isLoading ? <LoadingIcon /> : <><UserPlusIcon className="w-4 h-4 mr-2"/> Registrati</>}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Hai già un account?{' '}
                        <button onClick={onSwitchToLogin} className="font-medium text-primary hover:text-blue-800 transition-colors">
                            Accedi qui
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
