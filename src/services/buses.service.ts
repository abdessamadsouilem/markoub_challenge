import apiClient from '@/lib/api/client';
import { Bus, NewBus } from '@/lib/db/schema';

export interface GetBusesParams {
    page?: number;
    limit?: number;
    search?: string;
}

export interface GetBusesResponse {
    buses: Bus[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}

export interface CreateBusResponse {
    bus: Bus;
    message: string;
}

export interface UpdateBusResponse {
    bus: Bus;
    message: string;
}

export class BusesService {
    async getBuses(params?: GetBusesParams): Promise<GetBusesResponse> {
        return apiClient.get<GetBusesResponse>('/buses', params as Record<string, unknown>);
    }

    async getBus(id: number): Promise<{ bus: Bus }> {
        return apiClient.get<{ bus: Bus }>(`/buses/${id}`);
    }

    async createBus(data: NewBus): Promise<CreateBusResponse> {
        return apiClient.post<CreateBusResponse>('/buses', data as Record<string, unknown>);
    }

    async updateBus(id: number, data: Partial<NewBus>): Promise<UpdateBusResponse> {
        return apiClient.put<UpdateBusResponse>(`/buses/${id}`, data as Record<string, unknown>);
    }

    async deleteBus(id: number): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`/buses/${id}`);
    }
}

export const busesService = new BusesService(); 