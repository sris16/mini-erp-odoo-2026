import api from './api';
import type { AuditLog } from '../store';

const API_URL = '/audit-logs';

export const auditService = {
  getAuditLogs: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },
  createAuditLog: async (log: Omit<AuditLog, 'id' | 'date'>) => {
    const response = await api.post(API_URL, log);
    return response.data;
  },
};
