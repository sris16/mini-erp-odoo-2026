import api from './api';
import type { Customer } from '../store';

const API_URL = '/customers';

export const customerService = {
  getCustomers: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },
  createCustomer: async (customer: Omit<Customer, 'id'>) => {
    const response = await api.post(API_URL, customer);
    return response.data;
  },
  updateCustomer: async (id: number, customer: Partial<Customer>) => {
    const response = await api.put(`${API_URL}/${id}`, customer);
    return response.data;
  },
  deleteCustomer: async (id: number) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  },
};
