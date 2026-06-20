import axios from 'axios';
import type { Customer } from '../store';

const API_URL = '/api/v1/customers';

export const customerService = {
  getCustomers: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },
  createCustomer: async (customer: Omit<Customer, 'id'>) => {
    const response = await axios.post(API_URL, customer);
    return response.data;
  },
  updateCustomer: async (id: number, customer: Partial<Customer>) => {
    const response = await axios.put(`${API_URL}/${id}`, customer);
    return response.data;
  },
  deleteCustomer: async (id: number) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },
};
