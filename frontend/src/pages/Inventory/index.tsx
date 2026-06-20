import { useState } from 'react';
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
  Tabs,
  Tab,
  Chip,
  TextField,
} from '@mui/material';
import {
  Inventory as StockIcon,
  ListAlt as LedgerIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../../store';

export default function Inventory() {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const { stock, ledger } = useAppSelector((state) => state.inventory);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSearchTerm('');
  };

  const filteredStock = stock.filter((s) =>
    s.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLedger = ledger.filter((l) =>
    l.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.movementType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
          Inventory stock
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track real-time stock balances, reservations, and stock movement logs.
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
          <Tab icon={<StockIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Stock View" />
          <Tab icon={<LedgerIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Ledger View" />
        </Tabs>
      </Box>

      {/* Search Filter */}
      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder={tabValue === 0 ? "Search stock by product..." : "Search ledger by product, reference, or type..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon color="action" sx={{ mr: 1, fontSize: 20 }} />,
            },
          }}
          sx={{ maxWidth: 400, width: '100%' }}
        />
      </Box>

      {tabValue === 0 && (
        <Card sx={{ borderColor: 'divider' }}>
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">On Hand</TableCell>
                  <TableCell align="right">Reserved</TableCell>
                  <TableCell align="right">Available</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStock.length > 0 ? (
                  filteredStock.map((row) => (
                    <TableRow key={row.productId} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{row.productName}</TableCell>
                      <TableCell align="right">{row.onHand} units</TableCell>
                      <TableCell align="right" sx={{ color: row.reserved > 0 ? 'warning.main' : 'inherit' }}>
                        {row.reserved} units
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: row.available < 15 ? 'error.main' : 'success.main' }}>
                        {row.available} units
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No stock balances found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {tabValue === 1 && (
        <Card sx={{ borderColor: 'divider' }}>
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Movement Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell>Reference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLedger.length > 0 ? (
                  filteredLedger.map((row) => {
                    const isIncoming = row.movementType.includes('IN') || row.movementType.includes('Purchased');
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ color: 'text.secondary' }}>{row.date}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{row.productName}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.movementType}
                            size="small"
                            color={isIncoming ? 'success' : 'secondary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: isIncoming ? 'success.main' : 'error.main' }}>
                          {isIncoming ? `+${row.quantity}` : `-${row.quantity}`} units
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{row.reference}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No ledger entries found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
