import { useState, useEffect, useCallback, useRef } from 'react';
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
    const isMounted = useRef(true);
    const paramsRef = useRef(params);

    // Update params ref when params change
    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    const fetchDrivers = useCallback(async (newParams?: GetDriversParams) => {
        if (!isMounted.current) return;

        try {
            setLoading(true);
            setError(null);
            const currentParams = paramsRef.current;
            const response = await driversService.getDrivers({ ...currentParams, ...newParams });
            if (isMounted.current) {
                setDrivers(response.drivers);
                setPagination(response.pagination);
            }
        } catch (error: unknown) {
            if (isMounted.current) {
                const message = error instanceof Error ? error.message : 'Failed to fetch drivers';
                setError(message);
                toast.error(message);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, []);

    const createDriver = async (data: NewDriver) => {
        try {
            const response = await driversService.createDriver(data);
            await fetchDrivers();
            toast.success(response.message);
            return { success: true, driver: response.driver };
        } catch (error: unknown) {
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
        } catch (error: unknown) {
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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to delete driver';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    useEffect(() => {
        isMounted.current = true;
        fetchDrivers();

        return () => {
            isMounted.current = false;
        };
    }, [fetchDrivers]);

    return {
        drivers,
        loading,
        error,
        pagination,
        refetch: fetchDrivers,
        createDriver,
        updateDriver,
        deleteDriver,
    };
} 