import axios from 'axios';
import type { SalesOrder } from '../store';

const API_URL = '/api/v1/sales';

export const salesService = {
  getSalesOrders: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },
  createSalesOrder: async (order: Omit<SalesOrder, 'soNumber'>) => {
    const response = await axios.post(API_URL, order);
    return response.data;
  },
  updateSalesOrderStatus: async (soNumber: string, status: string) => {
    const response = await axios.patch(`${API_URL}/${soNumber}/status`, { status });
    return response.data;
  },
};
