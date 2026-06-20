import axios from 'axios';

const API_URL = '/api/v1/auth';

export const authService = {
  login: async (credentials: Record<string, unknown>) => {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
  },
  register: async (userData: Record<string, unknown>) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  },
};
