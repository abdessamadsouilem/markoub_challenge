import { useState, useEffect, useCallback, useRef } from 'react';
import { authService, User } from '@/services/auth.service';
import toast from 'react-hot-toast';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasInitialized, setHasInitialized] = useState(false);
    const isMounted = useRef(true);
    const loadingRef = useRef(loading);
    const hasInitializedRef = useRef(hasInitialized);

    // Update refs when state changes
    useEffect(() => {
        loadingRef.current = loading;
        hasInitializedRef.current = hasInitialized;
    }, [loading, hasInitialized]);

    const fetchCurrentUser = useCallback(async () => {
        if (!isMounted.current) return;

        // Prevent multiple simultaneous requests
        if (loadingRef.current && hasInitializedRef.current) {
            return;
        }

        try {
            const response = await authService.getCurrentUser();
            if (isMounted.current) {
                setUser(response.user);
            }
        } catch {
            if (isMounted.current) {
                setUser(null);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
                setHasInitialized(true);
            }
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        fetchCurrentUser();

        return () => {
            isMounted.current = false;
        };
    }, [fetchCurrentUser]);

    const login = async (username: string, password: string) => {
        try {
            setLoading(true);

            const response = await authService.login({ username, password });

            setUser(response.user);
            toast.success('Login successful!');

            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 500);
        } catch (error: unknown) {
            console.error('Login error:', error);
            const message = error instanceof Error ? error.message : 'Login failed';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setHasInitialized(false);
            window.location.href = '/login';
        }
    };

    const refetch = useCallback(() => {
        if (!hasInitializedRef.current) {
            fetchCurrentUser();
        }
    }, [fetchCurrentUser]);

    return {
        user,
        loading,
        login,
        logout,
        refetch,
    };
} 