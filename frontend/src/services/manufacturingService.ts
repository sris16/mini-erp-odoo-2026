import axios from 'axios';
import type { ManufacturingOrder } from '../store';

const API_URL = '/api/v1/manufacturing';

export const manufacturingService = {
  getManufacturingOrders: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },
  createManufacturingOrder: async (order: Omit<ManufacturingOrder, 'moNumber'>) => {
    const response = await axios.post(API_URL, order);
    return response.data;
  },
  updateManufacturingStatus: async (moNumber: string, status: 'Draft' | 'In Progress' | 'Completed') => {
    const response = await axios.patch(`${API_URL}/${moNumber}/status`, { status });
    return response.data;
  },
};
