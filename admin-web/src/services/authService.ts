import api from './api';
import type { User, ApiResponse } from '@/types';

interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  async register(data: RegisterRequest): Promise<ApiResponse<User>> {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<ApiResponse<User>> {
    const res = await api.get('/users/me');
    return res.data;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<null>> {
    const res = await api.post('/auth/change-password', { oldPassword, newPassword });
    return res.data;
  },
};
