import axios from 'axios';
import type { AuditLog } from '../store';

const API_URL = '/api/v1/audit-logs';

export const auditService = {
  getAuditLogs: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },
  createAuditLog: async (log: Omit<AuditLog, 'id' | 'date'>) => {
    const response = await axios.post(API_URL, log);
    return response.data;
  },
};
