import { useState, useEffect, useMemo } from 'react';
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

    const stableParams = useMemo(() => params, [JSON.stringify(params)]);

    const fetchRoutes = async (signal?: AbortSignal, overrideParams?: GetRoutesParams) => {
        try {
            setLoading(true);
            setError(null);

            const mergedParams = { ...stableParams, ...overrideParams };
            const response = await routesService.getRoutes(mergedParams, { signal });

            if (!response || !response.routes || !response.pagination) {
                throw new Error('Invalid response from server');
            }

            setRoutes(response.routes);
            setPagination(response.pagination);
        } catch (error: any) {
            if (signal?.aborted) return;
            const message = error instanceof Error ? error.message : 'Failed to fetch routes';
            setError(message);
            toast.error(message);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    const refetch = (overrideParams?: GetRoutesParams) => fetchRoutes(undefined, overrideParams);

    const createRoute = async (data: NewRoute) => {
        try {
            const response = await routesService.createRoute(data);
            await refetch();
            toast.success(response.message);
            return { success: true, route: response.route };
        } catch (error: any) {
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
        } catch (error: any) {
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
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Failed to delete route';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchRoutes(controller.signal);

        return () => controller.abort();
    }, [stableParams]);

    return {
        routes,
        loading,
        error,
        pagination,
        refetch,
        createRoute,
        updateRoute,
        deleteRoute,
    };
}
