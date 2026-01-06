import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    loginUser,
    registerUser,
    getCurrentUser,
    getUserId,
    setUserId,
    removeUserId,
} from '@/lib/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string, role: 'teach' | 'learn' | 'both') => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Check for existing session on mount
    useEffect(() => {
        const initAuth = async () => {
            const storedUserId = getUserId();
            if (storedUserId) {
                try {
                    console.log('[Auth] Restoring session for user:', storedUserId);
                    const response = await getCurrentUser(storedUserId);
                    setUser(response.user);
                    console.log('[Auth] Session restored successfully');
                } catch (error) {
                    // User not found or invalid, clear stored ID
                    console.log('[Auth] Session restore failed, clearing stored user ID');
                    removeUserId();
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const response = await loginUser({ email, password });
        // Store user ID for session persistence
        setUserId(response.user.id);
        setUser(response.user);
        navigate('/dashboard');
    }, [navigate]);

    const signup = useCallback(async (
        name: string,
        email: string,
        password: string,
        role: 'teach' | 'learn' | 'both'
    ) => {
        const response = await registerUser({ name, email, password, role });
        // Store user ID for session persistence
        setUserId(response.user.id);
        setUser(response.user);
        navigate('/dashboard');
    }, [navigate]);

    const logout = useCallback(() => {
        removeUserId();
        setUser(null);
        navigate('/login');
    }, [navigate]);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
