
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../data/db';
import { type User } from '../types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    register: (user: Omit<User, 'id' | 'role'>) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Controlla se c'è una sessione salvata (in una app reale useremmo token)
        const storedUserId = localStorage.getItem('auth_user_id');
        if (storedUserId) {
            db.users.get(parseInt(storedUserId)).then(foundUser => {
                if (foundUser) {
                    setUser(foundUser);
                }
            }).finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        const foundUser = await db.users.where({ username }).first();
        if (foundUser && foundUser.password === password) {
            setUser(foundUser);
            localStorage.setItem('auth_user_id', foundUser.id!.toString());
            return true;
        }
        return false;
    };

    const register = async (newUser: Omit<User, 'id' | 'role'>): Promise<{ success: boolean; message?: string }> => {
        try {
            const existingUser = await db.users.where({ username: newUser.username }).first();
            if (existingUser) {
                return { success: false, message: 'Nome utente già in uso.' };
            }

            const userToCreate: User = {
                ...newUser,
                role: 'user' // Default role
            };

            const id = await db.users.add(userToCreate);
            
            // Auto-login dopo la registrazione
            const createdUser = { ...userToCreate, id: id as number };
            setUser(createdUser);
            localStorage.setItem('auth_user_id', id.toString());

            return { success: true };
        } catch (error) {
            console.error("Errore registrazione:", error);
            return { success: false, message: 'Si è verificato un errore durante la registrazione.' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('auth_user_id');
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
