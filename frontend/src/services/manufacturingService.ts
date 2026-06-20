import api from './api';
import type { ManufacturingOrder } from '../store';

const API_URL = '/manufacturing';

export const manufacturingService = {
  getManufacturingOrders: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },
  createManufacturingOrder: async (order: Omit<ManufacturingOrder, 'moNumber'>) => {
    const response = await api.post(API_URL, order);
    return response.data;
  },
  updateManufacturingStatus: async (moNumber: string, status: 'Draft' | 'In Progress' | 'Completed') => {
    const response = await api.patch(`${API_URL}/${moNumber}/status`, { status });
    return response.data;
  },
};
