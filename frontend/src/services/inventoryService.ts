import axios from 'axios';
import type { StockLedgerEntry } from '../store';

const API_URL = '/api/v1/inventory';

export const inventoryService = {
  getStock: async () => {
    const response = await axios.get(`${API_URL}/stock`);
    return response.data;
  },
  getLedger: async () => {
    const response = await axios.get(`${API_URL}/ledger`);
    return response.data;
  },
  addLedgerEntry: async (entry: Omit<StockLedgerEntry, 'id'>) => {
    const response = await axios.post(`${API_URL}/ledger`, entry);
    return response.data;
  },
  updateStock: async (productId: number, payload: { change: number; reservedChange?: number }) => {
    const response = await axios.patch(`${API_URL}/stock/${productId}`, payload);
    return response.data;
  },
};
