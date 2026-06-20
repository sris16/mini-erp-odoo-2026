import api from './api';

const API_URL = '/auth';

export const authService = {
  login: async (credentials: Record<string, unknown>) => {
    const response = await api.post(`${API_URL}/login`, credentials);
    return response.data;
  },
  register: async (userData: Record<string, unknown>) => {
    const response = await api.post(`${API_URL}/register`, userData);
    return response.data;
  },
};
