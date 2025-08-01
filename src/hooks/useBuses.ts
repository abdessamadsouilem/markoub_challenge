import { useState, useEffect, useCallback, useRef } from 'react';
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
    const isMounted = useRef(true);
    const paramsRef = useRef(params);

    // Update params ref when params change
    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    const fetchBuses = useCallback(async (newParams?: GetBusesParams) => {
        if (!isMounted.current) return;

        try {
            setLoading(true);
            setError(null);
            const currentParams = paramsRef.current;
            const response = await busesService.getBuses({ ...currentParams, ...newParams });
            if (isMounted.current) {
                setBuses(response.buses);
                setPagination(response.pagination);
            }
        } catch (error: unknown) {
            if (isMounted.current) {
                const message = error instanceof Error ? error.message : 'Failed to fetch buses';
                setError(message);
                toast.error(message);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, []);

    const createBus = async (data: NewBus) => {
        try {
            const response = await busesService.createBus(data);
            await fetchBuses();
            toast.success(response.message);
            return { success: true, bus: response.bus };
        } catch (error: unknown) {
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
        } catch (error: unknown) {
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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to delete bus';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    useEffect(() => {
        isMounted.current = true;
        fetchBuses();

        return () => {
            isMounted.current = false;
        };
    }, [fetchBuses]);

    return {
        buses,
        loading,
        error,
        pagination,
        refetch: fetchBuses,
        createBus,
        updateBus,
        deleteBus,
    };
} 