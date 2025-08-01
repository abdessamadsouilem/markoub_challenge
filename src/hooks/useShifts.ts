import { useState, useEffect, useMemo } from 'react';
import { shiftsService, GetShiftsParams } from '@/services/shifts.service';
import { NewShift, ShiftWithDetails } from '@/lib/db/schema';
import toast from 'react-hot-toast';

export function useShifts(params?: GetShiftsParams) {
    const [shifts, setShifts] = useState<ShiftWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
    });

    const stableParams = useMemo(() => params, [JSON.stringify(params)]);

    const fetchShifts = async (signal?: AbortSignal, overrideParams?: GetShiftsParams) => {
        try {
            setLoading(true);
            setError(null);

            const mergedParams = { ...stableParams, ...overrideParams };
            const response = await shiftsService.getShifts(mergedParams, { signal });

            if (!response || !response.shifts || !response.pagination) {
                throw new Error('Invalid response from server');
            }

            setShifts(response.shifts);
            setPagination(response.pagination);
        } catch (error: any) {
            if (signal?.aborted) return;
            const message = error instanceof Error ? error.message : 'Failed to fetch shifts';
            setError(message);
            toast.error(message);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    const refetch = (overrideParams?: GetShiftsParams) =>
        fetchShifts(undefined, overrideParams);

    const createShift = async (data: NewShift) => {
        try {
            const response = await shiftsService.createShift(data);
            await refetch();
            toast.success(response.message);
            return { success: true, shift: response.shift };
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Failed to create shift';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const updateShift = async (id: number, data: Partial<NewShift>) => {
        try {
            const response = await shiftsService.updateShift(id, data);
            await refetch();
            toast.success(response.message);
            return { success: true, shift: response.shift };
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Failed to update shift';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const deleteShift = async (id: number) => {
        try {
            const response = await shiftsService.deleteShift(id);
            setShifts(prev => prev.filter(shift => shift.id !== id));
            toast.success(response.message);
            return { success: true };
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Failed to delete shift';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchShifts(controller.signal);
        return () => controller.abort();
    }, [stableParams]);

    return {
        shifts,
        loading,
        error,
        pagination,
        refetch,
        createShift,
        updateShift,
        deleteShift,
    };
}
