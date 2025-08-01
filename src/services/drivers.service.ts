import apiClient from '@/lib/api/client';
import { Driver, NewDriver } from '@/lib/db/schema';

export interface GetDriversParams {
    page?: number;
    limit?: number;
    search?: string;
}

export interface GetDriversResponse {
    drivers: Driver[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}

export interface CreateDriverResponse {
    driver: Driver;
    message: string;
}

export interface UpdateDriverResponse {
    driver: Driver;
    message: string;
}

export class DriversService {
    async getDrivers(params?: GetDriversParams): Promise<GetDriversResponse> {
        return apiClient.get<GetDriversResponse>('/drivers', params as Record<string, unknown>);
    }

    async getDriver(id: number): Promise<{ driver: Driver }> {
        return apiClient.get<{ driver: Driver }>(`/drivers/${id}`);
    }

    async createDriver(data: NewDriver): Promise<CreateDriverResponse> {
        return apiClient.post<CreateDriverResponse>('/drivers', data as Record<string, unknown>);
    }

    async updateDriver(id: number, data: Partial<NewDriver>): Promise<UpdateDriverResponse> {
        return apiClient.put<UpdateDriverResponse>(`/drivers/${id}`, data as Record<string, unknown>);
    }

    async deleteDriver(id: number): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`/drivers/${id}`);
    }
}

export const driversService = new DriversService(); 