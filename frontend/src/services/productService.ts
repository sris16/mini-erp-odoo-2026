import axios from 'axios';
import type { Product } from '../store';

const API_URL = '/api/v1/products';

export const productService = {
  getProducts: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },
  createProduct: async (product: Omit<Product, 'id'>) => {
    const response = await axios.post(API_URL, product);
    return response.data;
  },
  updateProduct: async (id: number, product: Partial<Product>) => {
    const response = await axios.put(`${API_URL}/${id}`, product);
    return response.data;
  },
  deleteProduct: async (id: number) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },
};
