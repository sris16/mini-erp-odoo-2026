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
} from '@mui/icons-material';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  useAppDispatch,
  useAppSelector,
  salesActions,
  productsActions,
  customersActions,
  type SalesOrder,
} from '../../store';

const schema = yup.object().shape({
  customerName: yup.string().required('Customer is required'),
  productName: yup.string().required('Product is required'),
  quantity: yup
    .number()
    .typeError('Quantity must be a number')
    .required('Quantity is required')
    .positive('Quantity must be positive')
    .integer(),
});

type SalesOrderFormData = yup.InferType<typeof schema>;

export default function Sales() {
  const dispatch = useAppDispatch();
  const salesOrders = useAppSelector((state) => state.sales.orders);
  const customers = useAppSelector((state) => state.customers.items);
  const products = useAppSelector((state) => state.products.items);

  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState<SalesOrder | null>(null);
  const [deliveryQty, setDeliveryQty] = useState<number>(0);

  useEffect(() => {
    dispatch(salesActions.fetchSalesOrders());
    dispatch(productsActions.fetchProducts());
    dispatch(customersActions.fetchCustomers());
  }, [dispatch]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SalesOrderFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(schema) as any,
    defaultValues: {
      customerName: '',
      productName: '',
      quantity: 1,
    },
  });

  const selectedProduct = useWatch({ control, name: 'productName' });
  const enteredQty = useWatch({ control, name: 'quantity' });

  const currentProduct = products.find((p) => p.name === selectedProduct);
  const calculatedTotal = currentProduct ? currentProduct.salesPrice * (enteredQty || 0) : 0;

  const handleOpenCreate = () => {
    reset({
      customerName: '',
      productName: '',
      quantity: 1,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onSubmit = (data: SalesOrderFormData) => {
    const totalVal = currentProduct ? currentProduct.salesPrice * data.quantity : 0;
    
    dispatch(
      salesActions.addSalesOrder({
        customerName: data.customerName,
        productName: data.productName,
        quantity: data.quantity,
        status: 'Draft',
        total: totalVal,
      })
    );

    setOpen(false);
  };

  const handleApprove = (row: SalesOrder) => {
    if (row.status === 'Draft') {
      dispatch(salesActions.confirmSalesOrder(row.id));
    } else if (row.status === 'Pending Delivery') {
      setActiveDeliveryOrder(row);
      setDeliveryQty(row.quantity - row.qtyDelivered);
      setDeliveryOpen(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Pending Delivery':
        return 'warning';
      case 'Draft':
        return 'default';
      default:
        return 'error';
    }
  };

  const filteredOrders = salesOrders.filter(
    (o) =>
      o.soNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Stack direction="row" sx={{ mb: 4, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
            Sales Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Process sales transactions and review outbound shipments.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Create Sales Order
        </Button>
      </Stack>

      <Card sx={{ borderColor: 'divider', mb: 4 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            placeholder="Search orders..."
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
        <Divider />
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>SO Number</TableCell>
                <TableCell>Customer</TableCell>
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
                  <TableRow key={row.soNumber} hover>
                    <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{row.soNumber}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{row.productName}</TableCell>
                    <TableCell align="right">
                      {row.qtyDelivered > 0 && row.qtyDelivered < row.quantity ? (
                        <Tooltip title={`Delivered: ${row.qtyDelivered} / ${row.quantity} units`}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {row.qtyDelivered} / {row.quantity} units
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
                      {row.status !== 'Completed' && (
                        <Tooltip title={row.status === 'Draft' ? 'Approve Order' : 'Ship Goods'}>
                          <IconButton size="small" onClick={() => handleApprove(row)} color="success">
                            <ApproveIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No sales orders found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Order Creation Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Create Sales Order</DialogTitle>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth error={!!errors.customerName}>
                <InputLabel shrink>Customer</InputLabel>
                <Controller
                  name="customerName"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Customer" displayEmpty>
                      <MenuItem value="" disabled>Select a customer</MenuItem>
                      {customers.map((c) => (
                        <MenuItem key={c.id} value={c.name}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.customerName && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.customerName.message}
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
                          {p.name} (${p.salesPrice.toFixed(2)})
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
                <Typography variant="subtitle2" color="text.secondary">Estimated Order Total:</Typography>
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

      {/* Delivery Confirmation Dialog */}
      <Dialog open={deliveryOpen} onClose={() => setDeliveryOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Deliver Products</DialogTitle>
        <Divider />
        <DialogContent>
          {activeDeliveryOrder && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {activeDeliveryOrder.productName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                SO Number: {activeDeliveryOrder.soNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Ordered: {activeDeliveryOrder.quantity} units
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Already Shipped: {activeDeliveryOrder.qtyDelivered} units
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Remaining to Ship: {activeDeliveryOrder.quantity - activeDeliveryOrder.qtyDelivered} units
              </Typography>

              <TextField
                label="Quantity to Ship Now"
                type="number"
                fullWidth
                value={deliveryQty}
                onChange={(e) => setDeliveryQty(Math.max(1, parseInt(e.target.value) || 0))}
                slotProps={{
                  htmlInput: {
                    min: 1,
                    max: activeDeliveryOrder.quantity - activeDeliveryOrder.qtyDelivered,
                  }
                }}
              />
            </Stack>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeliveryOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (activeDeliveryOrder) {
                dispatch(
                  salesActions.deliverSalesOrder({
                    id: activeDeliveryOrder.id,
                    partials: [
                      {
                        productId: activeDeliveryOrder.productId,
                        qtyToDeliver: deliveryQty,
                      },
                    ],
                  })
                ).then(() => {
                  dispatch(salesActions.fetchSalesOrders());
                });
              }
              setDeliveryOpen(false);
            }}
            variant="contained"
            color="success"
            disabled={!activeDeliveryOrder || deliveryQty <= 0 || deliveryQty > (activeDeliveryOrder.quantity - activeDeliveryOrder.qtyDelivered)}
          >
            Confirm Shipment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
