import { useState, useEffect, useMemo } from 'react';
import { driversService, GetDriversParams } from '@/services/drivers.service';
import { NewDriver, Driver } from '@/lib/db/schema';
import toast from 'react-hot-toast';

export function useDrivers(params?: GetDriversParams) {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
    });

    const stableParams = useMemo(() => params, [JSON.stringify(params)]);

    const fetchDrivers = async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            setError(null);
            const response = await driversService.getDrivers(stableParams, { signal });

            if (!response || !response.drivers || !response.pagination) {
                throw new Error('Invalid response from server');
            }

            setDrivers(response.drivers);
            setPagination(response.pagination);
        } catch (error: any) {
            if (signal?.aborted) return;

            const message = error instanceof Error ? error.message : 'Failed to fetch drivers';
            setError(message);
            toast.error(message);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    const refetch = () => fetchDrivers();

    const createDriver = async (data: NewDriver) => {
        try {
            const response = await driversService.createDriver(data);
            await refetch();
            toast.success(response.message);
            return { success: true, driver: response.driver };
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Failed to create driver';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const updateDriver = async (id: number, data: Partial<NewDriver>) => {
        try {
            const response = await driversService.updateDriver(id, data);
            setDrivers(prev => prev.map(driver =>
                driver.id === id ? response.driver : driver
            ));
            toast.success(response.message);
            return { success: true, driver: response.driver };
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Failed to update driver';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const deleteDriver = async (id: number) => {
        try {
            const response = await driversService.deleteDriver(id);
            setDrivers(prev => prev.filter(driver => driver.id !== id));
            toast.success(response.message);
            return { success: true };
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Failed to delete driver';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchDrivers(controller.signal);

        return () => {
            controller.abort();
        };
    }, [stableParams]);

    return {
        drivers,
        loading,
        error,
        pagination,
        refetch,
        createDriver,
        updateDriver,
        deleteDriver,
    };
}
