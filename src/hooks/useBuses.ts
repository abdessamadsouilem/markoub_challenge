import { useState, useEffect, useMemo } from 'react';
import { busesService, GetBusesParams } from '@/services/buses.service';
import { NewBus, Bus } from '@/lib/db/schema';
import toast from 'react-hot-toast';

export function useBuses(params?: GetBusesParams) {
    const [buses, setBuses] = useState<Bus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
    });

    const stableParams = useMemo(() => params, [JSON.stringify(params)]);

    const fetchBuses = async (signal?: AbortSignal, overrideParams?: GetBusesParams) => {
        try {
            setLoading(true);
            setError(null);

            const mergedParams = { ...stableParams, ...overrideParams };
            const response = await busesService.getBuses(mergedParams, { signal });

            if (!response || !response.buses || !response.pagination) {
                throw new Error('Invalid response from server');
            }

            setBuses(response.buses);
            setPagination(response.pagination);
        } catch (error: any) {
            if (signal?.aborted) return;
            const message = error instanceof Error ? error.message : 'Failed to fetch buses';
            setError(message);
            toast.error(message);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    const refetch = (overrideParams?: GetBusesParams) => fetchBuses(undefined, overrideParams);

    const createBus = async (data: NewBus) => {
        try {
            const response = await busesService.createBus(data);
            await refetch();
            toast.success(response.message);
            return { success: true, bus: response.bus };
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Failed to create bus';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const updateBus = async (id: number, data: Partial<NewBus>) => {
        try {
            const response = await busesService.updateBus(id, data);
            setBuses(prev => prev.map(bus =>
                bus.id === id ? response.bus : bus
            ));
            toast.success(response.message);
            return { success: true, bus: response.bus };
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Failed to update bus';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const deleteBus = async (id: number) => {
        try {
            const response = await busesService.deleteBus(id);
            setBuses(prev => prev.filter(bus => bus.id !== id));
            toast.success(response.message);
            return { success: true };
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Failed to delete bus';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchBuses(controller.signal);

        return () => controller.abort();
    }, [stableParams]);

    return {
        buses,
        loading,
        error,
        pagination,
        refetch,
        createBus,
        updateBus,
        deleteBus,
    };
}
