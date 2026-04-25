import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { router, type Href } from 'expo-router';

import { config } from '@/constants/config';
import type { ErrorResponse } from '@/types';
import { useAppStore } from '@/store/useAppStore';

export type ApiError = ErrorResponse | {
  error: true;
  message: string;
  code: 'NETWORK_ERROR' | 'TIMEOUT' | 'SERVER_ERROR';
};

const apiClient = axios.create({
  baseURL: config.API_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((requestConfig) => {
  const token = useAppStore.getState().adminToken;

  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }

  return requestConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    const normalizedError = normalizeApiError(error);

    if (error.response?.status === 401) {
      useAppStore.getState().clearAdmin();
      router.replace('/admin/login' as Href);
    }

    return Promise.reject(normalizedError);
  },
);

function normalizeApiError(error: AxiosError<ErrorResponse>): ApiError {
  if (error.response?.data?.error && error.response.data.message) {
    return error.response.data;
  }

  if (error.code === AxiosError.ECONNABORTED) {
    return {
      error: true,
      message: 'Request timed out. Please try again.',
      code: 'TIMEOUT',
    };
  }

  if (!error.response) {
    return {
      error: true,
      message: 'No internet connection.',
      code: 'NETWORK_ERROR',
    };
  }

  return {
    error: true,
    message: 'Something went wrong. Please try again.',
    code: 'SERVER_ERROR',
  };
}

export async function get<T>(url: string, params?: Record<string, unknown>, options?: AxiosRequestConfig) {
  const response = await apiClient.get<T>(url, { ...options, params });
  return response.data;
}

export async function post<T>(url: string, body?: unknown, options?: AxiosRequestConfig) {
  const response = await apiClient.post<T>(url, body, options);
  return response.data;
}

export async function put<T>(url: string, body?: unknown, options?: AxiosRequestConfig) {
  const response = await apiClient.put<T>(url, body, options);
  return response.data;
}

export async function del<T>(url: string, options?: AxiosRequestConfig) {
  const response = await apiClient.delete<T>(url, options);
  return response.data;
}

export const api = {
  get,
  post,
  put,
  del,
};

export { apiClient };
