import api from './api';
import type { BoMItem } from '../store';

const API_URL = '/bom';

export const bomService = {
  getBoms: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },
  createBom: async (bom: Omit<BoMItem, 'id'>) => {
    const response = await api.post(API_URL, bom);
    return response.data;
  },
  deleteBom: async (id: number) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  },
};
