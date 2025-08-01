import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

declare module 'axios' {
    interface InternalAxiosRequestConfig {
        _retry?: boolean;
    }
}

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: '/api',
            timeout: 10000,
            withCredentials: true,
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        this.client.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                return config;
            },
            (error: AxiosError) => {
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                return response;
            },
            async (error: AxiosError) => {
                const originalRequest = error.config as InternalAxiosRequestConfig;

                const noRefreshRoutes = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/me'];
                const shouldSkipRefresh = noRefreshRoutes.some(route =>
                    originalRequest?.url?.includes(route)
                );

                if (
                    error.response?.status === 401 &&
                    originalRequest &&
                    !originalRequest._retry &&
                    !shouldSkipRefresh
                ) {
                    originalRequest._retry = true;

                    try {
                        await this.refreshToken();
                        return this.client(originalRequest);
                    } catch (refreshError) {
                        if (typeof window !== 'undefined') {
                            window.location.href = '/login';
                        }
                        return Promise.reject(refreshError);
                    }
                }

                const statusCode = error.response?.status;
                if (statusCode === 403) {
                    toast.error('Access denied. You do not have permission to perform this action.');
                } else if (statusCode && statusCode >= 500) {
                    toast.error('Server error. Please try again later.');
                } else if (statusCode === 401 && shouldSkipRefresh) {
                }

                return Promise.reject(error);
            }
        );
    }

    private async refreshToken() {
        return this.client.post('/auth/refresh');
    }

    async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
        const response = await this.client.get(url, { params });
        return response.data;
    }

    async post<T>(url: string, data?: Record<string, unknown>): Promise<T> {
        const response = await this.client.post(url, data);
        return response.data;
    }

    async put<T>(url: string, data?: Record<string, unknown>): Promise<T> {
        const response = await this.client.put(url, data);
        return response.data;
    }

    async delete<T>(url: string): Promise<T> {
        const response = await this.client.delete(url);
        return response.data;
    }
}

const apiClient = new ApiClient();
export default apiClient; 