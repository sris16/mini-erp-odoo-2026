import api from './api';
import type { Vendor } from '../store';

const API_URL = '/vendors';

export const vendorService = {
  getVendors: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },
  createVendor: async (vendor: Omit<Vendor, 'id'>) => {
    const response = await api.post(API_URL, vendor);
    return response.data;
  },
  updateVendor: async (id: number, vendor: Partial<Vendor>) => {
    const response = await api.put(`${API_URL}/${id}`, vendor);
    return response.data;
  },
  deleteVendor: async (id: number) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  },
};
