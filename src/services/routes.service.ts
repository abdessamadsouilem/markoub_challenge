import apiClient from '@/lib/api/client';
import { Route, NewRoute } from '@/lib/db/schema';

export interface GetRoutesParams {
    page?: number;
    limit?: number;
    search?: string;
}

export interface GetRoutesResponse {
    routes: Route[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}

export interface CreateRouteResponse {
    route: Route;
    message: string;
}

export interface UpdateRouteResponse {
    route: Route;
    message: string;
}

export class RoutesService {
    async getRoutes(params?: GetRoutesParams): Promise<GetRoutesResponse> {
        return apiClient.get<GetRoutesResponse>('/routes', params as Record<string, unknown>);
    }

    async getRoute(id: number): Promise<{ route: Route }> {
        return apiClient.get<{ route: Route }>(`/routes/${id}`);
    }

    async createRoute(data: NewRoute): Promise<CreateRouteResponse> {
        return apiClient.post<CreateRouteResponse>('/routes', data as Record<string, unknown>);
    }

    async updateRoute(id: number, data: Partial<NewRoute>): Promise<UpdateRouteResponse> {
        return apiClient.put<UpdateRouteResponse>(`/routes/${id}`, data as Record<string, unknown>);
    }

    async deleteRoute(id: number): Promise<{ message: string }> {
        return apiClient.delete<{ message: string }>(`/routes/${id}`);
    }
}

export const routesService = new RoutesService(); 