import client from './client';
import type { User, ApiResponse } from '../types';

export const authApi = {
  register: (data: { name: string; email: string; phone: string; password: string; role: string }) =>
    client.post<ApiResponse<{ token: string; user: User }>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    client.post<ApiResponse<{ token: string; user: User }>>('/auth/login', data),

  sendOtp: (email: string) =>
    client.post<ApiResponse<{ message: string }>>('/auth/send-otp', { email }),

  verifyOtp: (data: { email: string; otp: string; name?: string; phone?: string; role?: string; pincode?: string; vehicleType?: string; mode?: 'login' | 'register' }) =>
    client.post<ApiResponse<{ token: string; user: User }>>('/auth/verify-otp', data),

  me: () =>
    client.get<ApiResponse<User>>('/auth/me'),
};
