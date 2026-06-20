import axios from 'axios';
import type { PurchaseOrder } from '../store';

const API_URL = '/api/v1/purchases';

export const purchaseService = {
  getPurchaseOrders: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },
  createPurchaseOrder: async (order: Omit<PurchaseOrder, 'poNumber'>) => {
    const response = await axios.post(API_URL, order);
    return response.data;
  },
  updatePurchaseOrderStatus: async (poNumber: string, status: string) => {
    const response = await axios.patch(`${API_URL}/${poNumber}/status`, { status });
    return response.data;
  },
};
