
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { type User } from '../types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    register: (user: Omit<User, 'id' | 'role'>) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Gestione della sessione persistente
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser({
                    id: 0, // In Supabase user.id è UUID, ma la nostra app usa numbers in certi posti
                    username: session.user.email || '',
                    password: '',
                    name: session.user.user_metadata?.name || 'Utente',
                    role: session.user.user_metadata?.role || 'user'
                });
            }
            setIsLoading(false);
        });

        // Ascolta i cambiamenti di stato auth (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({
                    id: 0,
                    username: session.user.email || '',
                    password: '',
                    name: session.user.user_metadata?.name || 'Utente',
                    role: session.user.user_metadata?.role || 'user'
                });
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return !error;
    };

    const register = async (newUser: Omit<User, 'id' | 'role'>): Promise<{ success: boolean; message?: string }> => {
        try {
            const { error } = await supabase.auth.signUp({
                email: newUser.username, // Usiamo username come email per compatibilità Supabase
                password: newUser.password,
                options: {
                    data: {
                        name: newUser.name,
                        role: 'user'
                    }
                }
            });

            if (error) {
                return { success: false, message: error.message };
            }

            return { success: true };
        } catch (error) {
            console.error("Errore registrazione:", error);
            return { success: false, message: 'Si è verificato un errore durante la registrazione.' };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
