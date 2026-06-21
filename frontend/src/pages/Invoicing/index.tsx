import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Tooltip,
  Divider,
  TextField,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as PostIcon,
  Payments as PaymentIcon,
} from '@mui/icons-material';
import {
  useAppDispatch,
  useAppSelector,
  invoicingActions,
} from '../../store';
import DebouncedTextField from '../../components/common/DebouncedTextField';

export default function Invoicing() {
  const dispatch = useAppDispatch();
  const invoices = useAppSelector((state) => state.invoices.items);
  const bills = useAppSelector((state) => state.bills.items);
  const invoicesLoading = useAppSelector((state) => state.invoices.loading);
  const billsLoading = useAppSelector((state) => state.bills.loading);

  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Dialog State
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<{ id: number; number: string; remaining: number; isInvoice: boolean } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string | number>('');

  useEffect(() => {
    dispatch(invoicingActions.fetchInvoices());
    dispatch(invoicingActions.fetchBills());
  }, [dispatch]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSearchTerm('');
  };

  const handlePostInvoice = (id: number) => {
    dispatch(invoicingActions.postInvoice(id)).then(() => {
      dispatch(invoicingActions.fetchInvoices());
    });
  };

  const handlePostBill = (id: number) => {
    dispatch(invoicingActions.postBill(id)).then(() => {
      dispatch(invoicingActions.fetchBills());
    });
  };

  const handleOpenPayment = (doc: { id: number; number: string; total: number; paid: number }, isInvoice: boolean) => {
    const remaining = Number((doc.total - doc.paid).toFixed(2));
    setActiveDoc({
      id: doc.id,
      number: doc.number,
      remaining,
      isInvoice,
    });
    setPaymentAmount(remaining.toString());
    setPaymentOpen(true);
  };

  const handleConfirmPayment = () => {
    const parsedAmount = parseFloat(String(paymentAmount)) || 0;
    if (!activeDoc || parsedAmount <= 0 || parsedAmount > activeDoc.remaining) return;

    if (activeDoc.isInvoice) {
      dispatch(invoicingActions.payInvoice({ id: activeDoc.id, amount: parsedAmount })).then(() => {
        dispatch(invoicingActions.fetchInvoices());
      });
    } else {
      dispatch(invoicingActions.payBill({ id: activeDoc.id, amount: parsedAmount })).then(() => {
        dispatch(invoicingActions.fetchBills());
      });
    }
    setPaymentOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'POSTED':
        return 'info';
      case 'DRAFT':
        return 'default';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  // Filtered Lists
  const filteredInvoices = invoices.filter(
    (i) =>
      i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.salesOrderId ? `so-00${i.salesOrderId}`.includes(searchTerm.toLowerCase()) : false)
  );

  const filteredBills = bills.filter(
    (b) =>
      b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.purchaseOrderId ? `po-00${b.purchaseOrderId}`.includes(searchTerm.toLowerCase()) : false)
  );

  return (
    <Box>
      <Stack direction="row" sx={{ mb: 4, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
            Invoicing & Billing
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Process payments, verify customer invoices, and settle vendor bills.
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="billing tabs">
          <Tab label={`Customer Invoices (${invoices.length})`} />
          <Tab label={`Vendor Bills (${bills.length})`} />
        </Tabs>
      </Box>

      <Card sx={{ borderColor: 'divider', mb: 4 }}>
        <Box sx={{ p: 2 }}>
          <DebouncedTextField
            placeholder={activeTab === 0 ? "Search invoices..." : "Search bills..."}
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            slotProps={{
              input: {
                startAdornment: <SearchIcon color="action" sx={{ mr: 1, fontSize: 20 }} />,
              },
            }}
            sx={{ maxWidth: 400, width: '100%' }}
          />
        </Box>
        <Divider />

        {activeTab === 0 ? (
          // Invoices Table
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice Number</TableCell>
                  <TableCell>Source Document</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell align="right">Total Amount</TableCell>
                  <TableCell align="right">Paid Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoicesLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">Loading invoices...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{row.invoiceNumber}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        {row.salesOrderId ? `SO-00${row.salesOrderId}` : 'Manual'}
                      </TableCell>
                      <TableCell>{row.customerName}</TableCell>
                      <TableCell>{row.issueDate ? row.issueDate.replace('T', ' ').substring(0, 10) : 'N/A'}</TableCell>
                      <TableCell align="right">${row.totalAmount.toFixed(2)}</TableCell>
                      <TableCell align="right">${row.amountPaid.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip label={row.status} size="small" color={getStatusColor(row.status)} />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                          {row.status === 'DRAFT' && (
                            <Tooltip title="Post Invoice">
                              <IconButton size="small" onClick={() => handlePostInvoice(row.id)} color="primary">
                                <PostIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {row.status === 'POSTED' && (
                            <Tooltip title="Register Payment">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenPayment({ id: row.id, number: row.invoiceNumber, total: row.totalAmount, paid: row.amountPaid }, true)}
                                color="success"
                              >
                                <PaymentIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No invoices found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          // Vendor Bills Table
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bill Number</TableCell>
                  <TableCell>Source Document</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell align="right">Total Amount</TableCell>
                  <TableCell align="right">Paid Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {billsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">Loading bills...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredBills.length > 0 ? (
                  filteredBills.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{row.billNumber}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        {row.purchaseOrderId ? `PO-00${row.purchaseOrderId}` : 'Manual'}
                      </TableCell>
                      <TableCell>{row.vendorName}</TableCell>
                      <TableCell>{row.issueDate ? row.issueDate.replace('T', ' ').substring(0, 10) : 'N/A'}</TableCell>
                      <TableCell align="right">${row.totalAmount.toFixed(2)}</TableCell>
                      <TableCell align="right">${row.amountPaid.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip label={row.status} size="small" color={getStatusColor(row.status)} />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                          {row.status === 'DRAFT' && (
                            <Tooltip title="Post Bill">
                              <IconButton size="small" onClick={() => handlePostBill(row.id)} color="primary">
                                <PostIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {row.status === 'POSTED' && (
                            <Tooltip title="Register Payment">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenPayment({ id: row.id, number: row.billNumber, total: row.totalAmount, paid: row.amountPaid }, false)}
                                color="success"
                              >
                                <PaymentIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No bills found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Payment Registration Dialog */}
      <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Register Payment</DialogTitle>
        <Divider />
        <DialogContent>
          {activeDoc && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Document: {activeDoc.number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Remaining Unpaid: ${activeDoc.remaining.toFixed(2)}
              </Typography>

              <TextField
                label="Payment Amount ($)"
                type="number"
                fullWidth
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                slotProps={{
                  htmlInput: {
                    min: 0.01,
                    max: activeDoc.remaining,
                    step: 0.01,
                  }
                }}
              />
            </Stack>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPaymentOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmPayment}
            variant="contained"
            color="success"
            disabled={!activeDoc || (parseFloat(String(paymentAmount)) || 0) <= 0 || (parseFloat(String(paymentAmount)) || 0) > activeDoc.remaining}
          >
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
