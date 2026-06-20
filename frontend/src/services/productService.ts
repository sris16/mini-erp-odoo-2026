import api from './api';
import type { Product } from '../store';

const API_URL = '/products';

export const productService = {
  getProducts: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },
  createProduct: async (product: Omit<Product, 'id'>) => {
    const response = await api.post(API_URL, product);
    return response.data;
  },
  updateProduct: async (id: number, product: Partial<Product>) => {
    const response = await api.put(`${API_URL}/${id}`, product);
    return response.data;
  },
  deleteProduct: async (id: number) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  },
};
