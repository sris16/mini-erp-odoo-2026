import api from './api';
import type { PurchaseOrder } from '../store';

const API_URL = '/purchase';

export const purchaseService = {
  getPurchaseOrders: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },
  createPurchaseOrder: async (order: Omit<PurchaseOrder, 'poNumber'>) => {
    const response = await api.post(API_URL, order);
    return response.data;
  },
  updatePurchaseOrderStatus: async (poNumber: string, status: string) => {
    const response = await api.patch(`${API_URL}/${poNumber}/status`, { status });
    return response.data;
  },
};
