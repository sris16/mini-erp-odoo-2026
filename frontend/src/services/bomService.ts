import axios from 'axios';
import type { BoMItem } from '../store';

const API_URL = '/api/v1/bom';

export const bomService = {
  getBoms: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },
  createBom: async (bom: Omit<BoMItem, 'id'>) => {
    const response = await axios.post(API_URL, bom);
    return response.data;
  },
  deleteBom: async (id: number) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },
};
