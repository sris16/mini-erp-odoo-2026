import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { useEffect } from 'react';
import { useAppSelector, useAppDispatch, auditLogsActions } from '../../store';

export default function AuditLogs() {
  const dispatch = useAppDispatch();
  const logs = useAppSelector((state) => state.auditLogs.logs);

  useEffect(() => {
    dispatch(auditLogsActions.fetchAuditLogs());
  }, [dispatch]);

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'Products':
        return 'primary';
      case 'CRM':
        return 'secondary';
      case 'Inventory':
        return 'error';
      case 'Sales':
        return 'success';
      case 'Purchase':
        return 'warning';
      case 'Manufacturing':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
          System Audit Logs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track configuration revisions, transaction updates, and inventory allocations.
        </Typography>
      </Box>

      <Card sx={{ borderColor: 'divider' }}>
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Module</TableCell>
                <TableCell>Logged Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ color: 'text.secondary', width: '20%' }}>{row.date}</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: '15%' }}>{row.user}</TableCell>
                    <TableCell sx={{ width: '15%' }}>
                      <Chip
                        label={row.module}
                        size="small"
                        color={getModuleColor(row.module)}
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>{row.action}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No audit records found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
