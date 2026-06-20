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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tooltip,
  Divider,
  TextField,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as ApproveIcon,
  Search as SearchIcon,
  Receipt as BillIcon,
} from '@mui/icons-material';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  useAppDispatch,
  useAppSelector,
  purchaseActions,
  productsActions,
  vendorsActions,
  invoicingActions,
  type PurchaseOrder,
} from '../../store';
import DebouncedTextField from '../../components/common/DebouncedTextField';

const schema = yup.object().shape({
  vendorName: yup.string().required('Vendor is required'),
  productName: yup.string().required('Product is required'),
  quantity: yup
    .number()
    .transform((value) => (Number.isNaN(value) ? undefined : value))
    .required('Please enter a value')
    .min(1, 'Please enter a value greater than 0')
    .integer('Must be a whole number'),
});

type PurchaseOrderFormData = yup.InferType<typeof schema>;

export default function Purchase() {
  const dispatch = useAppDispatch();
  const purchaseOrders = useAppSelector((state) => state.purchase.orders);
  const vendors = useAppSelector((state) => state.vendors.items);
  const products = useAppSelector((state) => state.products.items);
  const bills = useAppSelector((state) => state.bills.items);

  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [activeReceiveOrder, setActiveReceiveOrder] = useState<PurchaseOrder | null>(null);
  const [receiveQty, setReceiveQty] = useState<number>(0);

  useEffect(() => {
    dispatch(purchaseActions.fetchPurchaseOrders());
    dispatch(productsActions.fetchProducts());
    dispatch(vendorsActions.fetchVendors());
    dispatch(invoicingActions.fetchBills());
  }, [dispatch]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PurchaseOrderFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(schema) as any,
    defaultValues: {
      vendorName: '',
      productName: '',
      quantity: 1,
    },
  });

  const selectedProduct = useWatch({ control, name: 'productName' });
  const enteredQty = useWatch({ control, name: 'quantity' });

  const currentProduct = products.find((p) => p.name === selectedProduct);
  const calculatedTotal = currentProduct ? currentProduct.costPrice * (enteredQty || 0) : 0;

  const handleOpenCreate = () => {
    reset({
      vendorName: '',
      productName: '',
      quantity: 1,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onSubmit = (data: PurchaseOrderFormData) => {
    const totalVal = currentProduct ? currentProduct.costPrice * data.quantity : 0;

    dispatch(
      purchaseActions.addPurchaseOrder({
        vendorName: data.vendorName,
        productName: data.productName,
        quantity: data.quantity,
        status: 'Draft',
        total: totalVal,
      })
    );

    setOpen(false);
  };

  const handleApprove = (row: PurchaseOrder) => {
    if (row.status === 'Draft') {
      dispatch(purchaseActions.confirmPurchaseOrder(row.id));
    } else if (row.status === 'Approved') {
      setActiveReceiveOrder(row);
      setReceiveQty(row.quantity - row.qtyReceived);
      setReceiveOpen(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received':
        return 'success';
      case 'Approved':
        return 'warning';
      case 'Draft':
        return 'default';
      default:
        return 'error';
    }
  };

  const filteredOrders = purchaseOrders.filter(
    (o) =>
      o.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Stack direction="row" sx={{ mb: 4, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
            Purchase Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Replenish materials and track inbound inventory acquisitions.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Create Purchase Order
        </Button>
      </Stack>

      <Card sx={{ borderColor: 'divider', mb: 4 }}>
        <Box sx={{ p: 2 }}>
          <DebouncedTextField
            placeholder="Search purchase orders..."
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
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PO Number</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((row) => (
                  <TableRow key={row.poNumber} hover>
                    <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{row.poNumber}</TableCell>
                    <TableCell>{row.vendorName}</TableCell>
                    <TableCell>{row.productName}</TableCell>
                    <TableCell align="right">
                      {row.qtyReceived > 0 && row.qtyReceived < row.quantity ? (
                        <Tooltip title={`Received: ${row.qtyReceived} / ${row.quantity} units`}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {row.qtyReceived} / {row.quantity} units
                          </Typography>
                        </Tooltip>
                      ) : (
                        `${row.quantity} units`
                      )}
                    </TableCell>
                    <TableCell align="right">${row.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip label={row.status} size="small" color={getStatusColor(row.status)} />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                        {row.status !== 'Received' && (
                          <Tooltip title={row.status === 'Draft' ? 'Approve Purchase' : 'Receive Stock'}>
                            <IconButton size="small" onClick={() => handleApprove(row)} color="success">
                              <ApproveIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {row.status !== 'Draft' && row.status !== 'Cancelled' && (
                          <Tooltip title={bills.some((bill) => bill.purchaseOrderId === row.id) ? "Bill Already Created" : "Create Bill"}>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  dispatch(invoicingActions.createBillFromPO(row.id)).then(() => {
                                    dispatch(invoicingActions.fetchBills());
                                  });
                                }}
                                color="primary"
                                disabled={bills.some((bill) => bill.purchaseOrderId === row.id)}
                              >
                                <BillIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No purchase orders found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Order Creation Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Create Purchase Order</DialogTitle>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth error={!!errors.vendorName}>
                <InputLabel shrink>Vendor</InputLabel>
                <Controller
                  name="vendorName"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Vendor" displayEmpty>
                      <MenuItem value="" disabled>Select a vendor</MenuItem>
                      {vendors.map((v) => (
                        <MenuItem key={v.id} value={v.name}>
                          {v.name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.vendorName && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.vendorName.message}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth error={!!errors.productName}>
                <InputLabel shrink>Product</InputLabel>
                <Controller
                  name="productName"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Product" displayEmpty>
                      <MenuItem value="" disabled>Select a product</MenuItem>
                      {products.map((p) => (
                        <MenuItem key={p.id} value={p.name}>
                          {p.name} (${p.costPrice.toFixed(2)})
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.productName && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.productName.message}
                  </Typography>
                )}
              </FormControl>

              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Quantity"
                    type="number"
                    fullWidth
                    error={!!errors.quantity}
                    helperText={errors.quantity?.message}
                  />
                )}
              />

              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Estimated Cost:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.5 }}>
                  ${calculatedTotal.toFixed(2)}
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Save Order
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Receive Confirmation Dialog */}
      <Dialog open={receiveOpen} onClose={() => setReceiveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Receive Products</DialogTitle>
        <Divider />
        <DialogContent>
          {activeReceiveOrder && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {activeReceiveOrder.productName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PO Number: {activeReceiveOrder.poNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Ordered: {activeReceiveOrder.quantity} units
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Already Received: {activeReceiveOrder.qtyReceived} units
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Remaining to Receive: {activeReceiveOrder.quantity - activeReceiveOrder.qtyReceived} units
              </Typography>

              <TextField
                label="Quantity to Receive Now"
                type="number"
                fullWidth
                value={receiveQty === 0 ? '' : receiveQty}
                onChange={(e) => {
                  const val = e.target.value;
                  setReceiveQty(val === '' ? 0 : parseInt(val) || 0);
                }}
                slotProps={{
                  htmlInput: {
                    min: 1,
                    max: activeReceiveOrder.quantity - activeReceiveOrder.qtyReceived,
                  }
                }}
              />
            </Stack>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReceiveOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (activeReceiveOrder) {
                dispatch(
                  purchaseActions.receivePurchaseOrder({
                    id: activeReceiveOrder.id,
                    partials: [
                      {
                        productId: activeReceiveOrder.productId,
                        qtyToReceive: receiveQty,
                      },
                    ],
                  })
                ).then(() => {
                  dispatch(purchaseActions.fetchPurchaseOrders());
                });
              }
              setReceiveOpen(false);
            }}
            variant="contained"
            color="success"
            disabled={!activeReceiveOrder || receiveQty <= 0 || receiveQty > (activeReceiveOrder.quantity - activeReceiveOrder.qtyReceived)}
          >
            Confirm Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
