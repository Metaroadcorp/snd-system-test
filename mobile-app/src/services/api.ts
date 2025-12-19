import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 저장/조회
export const TokenStorage = {
  async getAccessToken() {
    return await SecureStore.getItemAsync('accessToken');
  },
  async setAccessToken(token: string) {
    await SecureStore.setItemAsync('accessToken', token);
  },
  async getRefreshToken() {
    return await SecureStore.getItemAsync('refreshToken');
  },
  async setRefreshToken(token: string) {
    await SecureStore.setItemAsync('refreshToken', token);
  },
  async clear() {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  },
};

// 요청 인터셉터
api.interceptors.request.use(
  async (config) => {
    const token = await TokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await TokenStorage.getRefreshToken();
        if (refreshToken) {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = res.data.data;

          await TokenStorage.setAccessToken(accessToken);
          await TokenStorage.setRefreshToken(newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch {
        await TokenStorage.clear();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
