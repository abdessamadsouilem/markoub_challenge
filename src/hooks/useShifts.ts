import { useState, useEffect, useCallback, useRef } from 'react';
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
    const isMounted = useRef(true);
    const paramsRef = useRef(params);

    // Update params ref when params change
    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    const fetchShifts = useCallback(async (newParams?: GetShiftsParams) => {
        if (!isMounted.current) return;

        try {
            setLoading(true);
            setError(null);
            const currentParams = paramsRef.current;
            const response = await shiftsService.getShifts({ ...currentParams, ...newParams });
            if (isMounted.current) {
                setShifts(response.shifts);
                setPagination(response.pagination);
            }
        } catch (error: unknown) {
            if (isMounted.current) {
                const message = error instanceof Error ? error.message : 'Failed to fetch shifts';
                setError(message);
                toast.error(message);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, []);

    const createShift = async (data: NewShift) => {
        try {
            const response = await shiftsService.createShift(data);
            await fetchShifts();
            toast.success(response.message);
            return { success: true, shift: response.shift };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to create shift';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const updateShift = async (id: number, data: Partial<NewShift>) => {
        try {
            const response = await shiftsService.updateShift(id, data);
            await fetchShifts(); // Refetch to get updated data with relations
            toast.success(response.message);
            return { success: true, shift: response.shift };
        } catch (error: unknown) {
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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to delete shift';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    useEffect(() => {
        isMounted.current = true;
        fetchShifts();

        return () => {
            isMounted.current = false;
        };
    }, [fetchShifts]);

    return {
        shifts,
        loading,
        error,
        pagination,
        refetch: fetchShifts,
        createShift,
        updateShift,
        deleteShift,
    };
} 