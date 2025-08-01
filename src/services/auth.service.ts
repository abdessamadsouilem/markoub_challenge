import apiClient from '@/lib/api/client';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface User {
    id: number;
    username: string;
    role: 'admin' | 'dispatcher' | 'viewer';
}

export interface LoginResponse {
    user: User;
    message: string;
}

export class AuthService {
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        return apiClient.post<LoginResponse>('/auth/login', credentials as unknown as Record<string, unknown>);
    }

    async logout(): Promise<{ message: string }> {
        return apiClient.post<{ message: string }>('/auth/logout');
    }

    async getCurrentUser(): Promise<{ user: User }> {
        return apiClient.get<{ user: User }>('/auth/me');
    }

    async refreshToken(): Promise<{ message: string }> {
        return apiClient.post<{ message: string }>('/auth/refresh');
    }
}

export const authService = new AuthService(); 