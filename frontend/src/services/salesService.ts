import api from './api';
import type { SalesOrder } from '../store';

const API_URL = '/sales';

export const salesService = {
  getSalesOrders: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },
  createSalesOrder: async (order: Omit<SalesOrder, 'soNumber'>) => {
    const response = await api.post(API_URL, order);
    return response.data;
  },
  updateSalesOrderStatus: async (soNumber: string, status: string) => {
    const response = await api.patch(`${API_URL}/${soNumber}/status`, { status });
    return response.data;
  },
};
