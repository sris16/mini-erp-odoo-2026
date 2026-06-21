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
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useForm, Controller, useWatch, useFieldArray } from 'react-hook-form';
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
  const [receiveQuantities, setReceiveQuantities] = useState<Record<number, number>>({});

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
    return sum + (prod ? prod.costPrice * (line.qtyOrdered || 0) : 0);
  }, 0);

  const handleOpenCreate = () => {
    reset({
      vendorName: '',
      lines: [{ productId: undefined as unknown as number, qtyOrdered: 1 }],
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onSubmit = (data: PurchaseOrderFormData) => {
    const linesPayload = data.lines.map((line) => {
      const prod = products.find((p) => p.id === line.productId);
      return {
        productId: line.productId,
        qtyOrdered: line.qtyOrdered,
        unitPrice: prod ? prod.costPrice : 0,
      };
    });

    dispatch(
      purchaseActions.addPurchaseOrder({
        vendorName: data.vendorName,
        lines: linesPayload,
      })
    );

    setOpen(false);
  };

  const handleApprove = (row: PurchaseOrder) => {
    if (row.status === 'Draft') {
      dispatch(purchaseActions.confirmPurchaseOrder(row.id));
    } else if (row.status === 'Approved') {
      setActiveReceiveOrder(row);
      const initialQtys: Record<number, number> = {};
      row.lines?.forEach((line) => {
        const remaining = line.qtyOrdered - line.qtyReceived;
        initialQtys[line.productId] = Math.max(0, remaining);
      });
      setReceiveQuantities(initialQtys);
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
                      {row.qtyReceived > 0 && row.qtyReceived < row.quantity ? (
                        <Tooltip title={`Received: ${row.qtyReceived} / ${row.quantity} total units`}>
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
                              {p.name} (${p.costPrice.toFixed(2)})
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
      <Dialog open={receiveOpen} onClose={() => setReceiveOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Receive Products</DialogTitle>
        <Divider />
        <DialogContent>
          {activeReceiveOrder && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                PO Number: {activeReceiveOrder.poNumber} | Vendor: {activeReceiveOrder.vendorName}
              </Typography>

              <TableContainer component={Paper} variant="outlined" elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Ordered</TableCell>
                      <TableCell align="right">Received</TableCell>
                      <TableCell align="right">Remaining</TableCell>
                      <TableCell sx={{ width: 130 }} align="right">Receive Now</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeReceiveOrder.lines?.map((line) => {
                      const remaining = line.qtyOrdered - line.qtyReceived;
                      return (
                        <TableRow key={line.productId}>
                          <TableCell sx={{ fontWeight: 500 }}>{line.productName}</TableCell>
                          <TableCell align="right">{line.qtyOrdered}</TableCell>
                          <TableCell align="right">{line.qtyReceived}</TableCell>
                          <TableCell align="right">{remaining}</TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={receiveQuantities[line.productId] ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const numericVal = val === '' ? 0 : parseInt(val) || 0;
                                setReceiveQuantities((prev) => ({
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
          <Button onClick={() => setReceiveOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (activeReceiveOrder) {
                const partials = Object.entries(receiveQuantities)
                  .map(([prodId, qty]) => ({
                    productId: parseInt(prodId),
                    qtyToReceive: qty,
                  }))
                  .filter((p) => p.qtyToReceive > 0);

                if (partials.length === 0) {
                  alert('Please enter at least one quantity to receive');
                  return;
                }

                dispatch(
                  purchaseActions.receivePurchaseOrder({
                    id: activeReceiveOrder.id,
                    partials,
                  })
                ).then(() => {
                  dispatch(purchaseActions.fetchPurchaseOrders());
                });
              }
              setReceiveOpen(false);
            }}
            variant="contained"
            color="success"
            disabled={
              !activeReceiveOrder ||
              Object.values(receiveQuantities).every((q) => q <= 0) ||
              Object.entries(receiveQuantities).some(([prodId, q]) => {
                const line = activeReceiveOrder.lines?.find((l) => l.productId === parseInt(prodId));
                if (!line) return false;
                const remaining = line.qtyOrdered - line.qtyReceived;
                return q > remaining || q < 0;
              })
            }
          >
            Confirm Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
