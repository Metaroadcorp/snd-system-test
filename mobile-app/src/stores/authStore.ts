import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import api, { TokenStorage } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { user, accessToken, refreshToken } = res.data.data;
        await TokenStorage.setAccessToken(accessToken);
        await TokenStorage.setRefreshToken(refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        set({ user, isAuthenticated: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await TokenStorage.clear();
      await AsyncStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
    }
  },

  loadUser: async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        set({ user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Load user error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    const token = await TokenStorage.getAccessToken();
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return false;
    }

    try {
      const res = await api.get('/users/me');
      if (res.data.success) {
        set({ user: res.data.data, isAuthenticated: true, isLoading: false });
        return true;
      }
    } catch (error) {
      await TokenStorage.clear();
    }

    set({ isAuthenticated: false, isLoading: false });
    return false;
  },
}));
