import { useState, useEffect, useCallback, useRef } from 'react';
import { routesService, GetRoutesParams } from '@/services/routes.service';
import { NewRoute, Route } from '@/lib/db/schema';
import toast from 'react-hot-toast';

export function useRoutes(params?: GetRoutesParams) {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
    });
    const isMounted = useRef(true);
    const paramsRef = useRef(params);

    // Update params ref when params change
    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    const fetchRoutes = useCallback(async (newParams?: GetRoutesParams) => {
        if (!isMounted.current) return;

        try {
            setLoading(true);
            setError(null);
            const currentParams = paramsRef.current;
            const response = await routesService.getRoutes({ ...currentParams, ...newParams });
            if (isMounted.current) {
                setRoutes(response.routes);
                setPagination(response.pagination);
            }
        } catch (error: unknown) {
            if (isMounted.current) {
                const message = error instanceof Error ? error.message : 'Failed to fetch routes';
                setError(message);
                toast.error(message);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, []);

    const createRoute = async (data: NewRoute) => {
        try {
            const response = await routesService.createRoute(data);
            await fetchRoutes();
            toast.success(response.message);
            return { success: true, route: response.route };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to create route';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const updateRoute = async (id: number, data: Partial<NewRoute>) => {
        try {
            const response = await routesService.updateRoute(id, data);
            setRoutes(prev => prev.map(route =>
                route.id === id ? response.route : route
            ));
            toast.success(response.message);
            return { success: true, route: response.route };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to update route';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const deleteRoute = async (id: number) => {
        try {
            const response = await routesService.deleteRoute(id);
            setRoutes(prev => prev.filter(route => route.id !== id));
            toast.success(response.message);
            return { success: true };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to delete route';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    useEffect(() => {
        isMounted.current = true;
        fetchRoutes();

        return () => {
            isMounted.current = false;
        };
    }, [fetchRoutes]);

    return {
        routes,
        loading,
        error,
        pagination,
        refetch: fetchRoutes,
        createRoute,
        updateRoute,
        deleteRoute,
    };
} 