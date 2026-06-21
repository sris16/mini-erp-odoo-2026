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
  Receipt as InvoiceIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useForm, Controller, useWatch, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  useAppDispatch,
  useAppSelector,
  salesActions,
  productsActions,
  customersActions,
  invoicingActions,
  type SalesOrder,
} from '../../store';
import DebouncedTextField from '../../components/common/DebouncedTextField';

const schema = yup.object().shape({
  customerName: yup.string().required('Customer is required'),
  lines: yup
    .array()
    .of(
      yup.object().shape({
        productId: yup.number().typeError('Product is required').required('Product is required'),
        qtyOrdered: yup
          .number()
          .transform((value) => (Number.isNaN(value) ? undefined : value))
          .required('Please enter a value')
          .min(1, 'Please enter a value greater than 0')
          .integer('Must be a whole number'),
      })
    )
    .min(1, 'At least one product line is required')
    .required(),
});

type SalesOrderFormData = yup.InferType<typeof schema>;

export default function Sales() {
  const dispatch = useAppDispatch();
  const salesOrders = useAppSelector((state) => state.sales.orders);
  const customers = useAppSelector((state) => state.customers.items);
  const products = useAppSelector((state) => state.products.items);
  const invoices = useAppSelector((state) => state.invoices.items);

  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState<SalesOrder | null>(null);
  const [deliveryQuantities, setDeliveryQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    dispatch(salesActions.fetchSalesOrders());
    dispatch(productsActions.fetchProducts());
    dispatch(customersActions.fetchCustomers());
    dispatch(invoicingActions.fetchInvoices());
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
      lines: [{ productId: undefined as unknown as number, qtyOrdered: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const selectedLines = useWatch({ control, name: 'lines' }) || [];
  const calculatedTotal = selectedLines.reduce((sum, line) => {
    if (!line?.productId) return sum;
    const prod = products.find((p) => p.id === line.productId);
    return sum + (prod ? prod.salesPrice * (line.qtyOrdered || 0) : 0);
  }, 0);

  const handleOpenCreate = () => {
    reset({
      customerName: '',
      lines: [{ productId: undefined as unknown as number, qtyOrdered: 1 }],
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onSubmit = (data: SalesOrderFormData) => {
    const linesPayload = data.lines.map((line) => {
      const prod = products.find((p) => p.id === line.productId);
      return {
        productId: line.productId,
        qtyOrdered: line.qtyOrdered,
        unitPrice: prod ? prod.salesPrice : 0,
      };
    });

    dispatch(
      salesActions.addSalesOrder({
        customerName: data.customerName,
        lines: linesPayload,
      })
    );

    setOpen(false);
  };

  const handleApprove = (row: SalesOrder) => {
    if (row.status === 'Draft') {
      dispatch(salesActions.confirmSalesOrder(row.id));
    } else if (row.status === 'Pending Delivery') {
      setActiveDeliveryOrder(row);
      const initialQtys: Record<number, number> = {};
      row.lines?.forEach((line) => {
        const remaining = line.qtyOrdered - line.qtyDelivered;
        initialQtys[line.productId] = Math.max(0, remaining);
      });
      setDeliveryQuantities(initialQtys);
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
          <DebouncedTextField
            placeholder="Search orders..."
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
                    <TableCell>
                      {row.lines && row.lines.length > 1 ? (
                        <Tooltip
                          title={
                            <Box sx={{ p: 0.5 }}>
                              {row.lines.map((line, idx) => (
                                <Typography key={idx} variant="caption" sx={{ display: 'block', color: '#fff' }}>
                                  • {line.productName} ({line.qtyOrdered} units)
                                </Typography>
                              ))}
                            </Box>
                          }
                        >
                          <span style={{ cursor: 'pointer', borderBottom: '1px dashed' }}>
                            {row.productName}
                          </span>
                        </Tooltip>
                      ) : (
                        row.productName
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {row.qtyDelivered > 0 && row.qtyDelivered < row.quantity ? (
                        <Tooltip title={`Delivered: ${row.qtyDelivered} / ${row.quantity} total units`}>
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
                      <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                        {row.status !== 'Completed' && (
                          <Tooltip title={row.status === 'Draft' ? 'Approve Order' : 'Ship Goods'}>
                            <IconButton size="small" onClick={() => handleApprove(row)} color="success">
                              <ApproveIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {row.status !== 'Draft' && row.status !== 'Cancelled' && (
                          <Tooltip title={invoices.some((inv) => inv.salesOrderId === row.id) ? "Invoice Already Created" : "Create Invoice"}>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  dispatch(invoicingActions.createInvoiceFromSO(row.id)).then(() => {
                                    dispatch(invoicingActions.fetchInvoices());
                                  });
                                }}
                                color="primary"
                                disabled={invoices.some((inv) => inv.salesOrderId === row.id)}
                              >
                                <InvoiceIcon sx={{ fontSize: 18 }} />
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

              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Order Products
              </Typography>

              {fields.map((field, index) => (
                <Stack direction="row" spacing={2} key={field.id} sx={{ alignItems: 'flex-start' }}>
                  <FormControl fullWidth error={!!errors.lines?.[index]?.productId}>
                    <InputLabel shrink>Product</InputLabel>
                    <Controller
                      name={`lines.${index}.productId`}
                      control={control}
                      render={({ field: subField }) => (
                        <Select {...subField} label="Product" displayEmpty value={subField.value ?? ''}>
                          <MenuItem value="" disabled>Select product</MenuItem>
                          {products.map((p) => (
                            <MenuItem key={p.id} value={p.id}>
                              {p.name} (${p.salesPrice.toFixed(2)})
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.lines?.[index]?.productId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.lines?.[index]?.productId?.message}
                      </Typography>
                    )}
                  </FormControl>

                  <Controller
                    name={`lines.${index}.qtyOrdered`}
                    control={control}
                    render={({ field: subField }) => (
                      <TextField
                        {...subField}
                        label="Quantity"
                        type="number"
                        sx={{ width: 130 }}
                        error={!!errors.lines?.[index]?.qtyOrdered}
                        helperText={errors.lines?.[index]?.qtyOrdered?.message}
                        slotProps={{
                          htmlInput: {
                            min: 1,
                          },
                        }}
                      />
                    )}
                  />

                  {fields.length > 1 && (
                    <IconButton color="error" onClick={() => remove(index)} sx={{ mt: 1 }}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Stack>
              ))}

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => append({ productId: '' as unknown as number, qtyOrdered: 1 })}
                sx={{ alignSelf: 'flex-start', mt: 1 }}
              >
                Add Product Line
              </Button>

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
      <Dialog open={deliveryOpen} onClose={() => setDeliveryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Deliver Products</DialogTitle>
        <Divider />
        <DialogContent>
          {activeDeliveryOrder && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                SO Number: {activeDeliveryOrder.soNumber} | Customer: {activeDeliveryOrder.customerName}
              </Typography>

              <TableContainer component={Paper} variant="outlined" elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Ordered</TableCell>
                      <TableCell align="right">Delivered</TableCell>
                      <TableCell align="right">Remaining</TableCell>
                      <TableCell sx={{ width: 130 }} align="right">Deliver Now</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeDeliveryOrder.lines?.map((line) => {
                      const remaining = line.qtyOrdered - line.qtyDelivered;
                      return (
                        <TableRow key={line.productId}>
                          <TableCell sx={{ fontWeight: 500 }}>{line.productName}</TableCell>
                          <TableCell align="right">{line.qtyOrdered}</TableCell>
                          <TableCell align="right">{line.qtyDelivered}</TableCell>
                          <TableCell align="right">{remaining}</TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={deliveryQuantities[line.productId] ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const numericVal = val === '' ? 0 : parseInt(val) || 0;
                                setDeliveryQuantities((prev) => ({
                                  ...prev,
                                  [line.productId]: numericVal,
                                }));
                              }}
                              slotProps={{
                                htmlInput: {
                                  min: 0,
                                  max: remaining,
                                }
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
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
                const partials = Object.entries(deliveryQuantities)
                  .map(([prodId, qty]) => ({
                    productId: parseInt(prodId),
                    qtyToDeliver: qty,
                  }))
                  .filter((p) => p.qtyToDeliver > 0);

                if (partials.length === 0) {
                  alert('Please enter at least one quantity to deliver');
                  return;
                }

                dispatch(
                  salesActions.deliverSalesOrder({
                    id: activeDeliveryOrder.id,
                    partials,
                  })
                ).then(() => {
                  dispatch(salesActions.fetchSalesOrders());
                });
              }
              setDeliveryOpen(false);
            }}
            variant="contained"
            color="success"
            disabled={
              !activeDeliveryOrder ||
              Object.values(deliveryQuantities).every((q) => q <= 0) ||
              Object.entries(deliveryQuantities).some(([prodId, q]) => {
                const line = activeDeliveryOrder.lines?.find((l) => l.productId === parseInt(prodId));
                if (!line) return false;
                const remaining = line.qtyOrdered - line.qtyDelivered;
                return q > remaining || q < 0;
              })
            }
          >
            Confirm Shipment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
