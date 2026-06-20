import axios from 'axios';
import type { Vendor } from '../store';

const API_URL = '/api/v1/vendors';

export const vendorService = {
  getVendors: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },
  createVendor: async (vendor: Omit<Vendor, 'id'>) => {
    const response = await axios.post(API_URL, vendor);
    return response.data;
  },
  updateVendor: async (id: number, vendor: Partial<Vendor>) => {
    const response = await axios.put(`${API_URL}/${id}`, vendor);
    return response.data;
  },
  deleteVendor: async (id: number) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },
};
