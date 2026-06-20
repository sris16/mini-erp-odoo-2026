import api from './api';
import type { StockLedgerEntry } from '../store';

const API_URL = '/products';

export const inventoryService = {
  getStock: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },
  getLedger: async () => {
    const response = await api.get(`${API_URL}/ledger`);
    return response.data;
  },
  addLedgerEntry: async (entry: Omit<StockLedgerEntry, 'id'>) => {
    // We can map this to adjusted stock or similar, but the backend doesn't support direct CRUD on ledger.
    // However, we preserve the signature mapping.
    const response = await api.post(`${API_URL}/ledger`, entry);
    return response.data;
  },
  updateStock: async (productId: number, payload: { change: number; reservedChange?: number }) => {
    const response = await api.patch(`${API_URL}/${productId}`, payload);
    return response.data;
  },
};
