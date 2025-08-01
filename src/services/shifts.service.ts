import apiClient from '@/lib/api/client';
import { Shift, NewShift, ShiftWithDetails } from '@/lib/db/schema';

export interface GetShiftsParams {
    page?: number;
    limit?: number;
    date?: string;
    startDate?: string;
    endDate?: string;
    driverId?: number;
    busId?: number;
    search?: string;
}

export interface GetShiftsResponse {
    shifts: ShiftWithDetails[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}

export interface CreateShiftResponse {
    shift: Shift;
    message: string;
}

export interface UpdateShiftResponse {
    shift: Shift;
    message: string;
}

export class ShiftsService {
    async getShifts(params?: GetShiftsParams): Promise<GetShiftsResponse> {
        return apiClient.get<GetShiftsResponse>('/shifts', params as Record<string, unknown>);
    }

    async getShift(id: number): Promise<{ shift: ShiftWithDetails }> {
        return apiClient.get<{ shift: ShiftWithDetails }>(`/shifts/${id}`);
    }

    async createShift(data: NewShift): Promise<CreateShiftResponse> {
        return apiClient.post<CreateShiftResponse>('/shifts', data as Record<string, unknown>);
    }

    async updateShift(id: number, data: Partial<NewShift>): Promise<UpdateShiftResponse> {
        return apiClient.put<UpdateShiftResponse>(`/shifts/${id}`, data as Record<string, unknown>);
    }

    async deleteShift(id: number): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`/shifts/${id}`);
    }
}

export const shiftsService = new ShiftsService(); 