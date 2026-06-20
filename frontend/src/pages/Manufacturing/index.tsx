import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
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
  Paper,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as StartIcon,
  Check as DoneIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  useAppDispatch,
  useAppSelector,
  manufacturingActions,
  productsActions,
  bomActions,
  type ManufacturingOrder,
} from '../../store';

const schema = yup.object().shape({
  productName: yup.string().required('Product is required'),
  quantity: yup
    .number()
    .transform((value) => (Number.isNaN(value) ? undefined : value))
    .required('Please enter a value')
    .min(1, 'Please enter a value greater than 0')
    .integer('Must be a whole number'),
});

type ManufacturingOrderFormData = yup.InferType<typeof schema>;

export default function Manufacturing() {
  const dispatch = useAppDispatch();
  const mfgOrders = useAppSelector((state) => state.manufacturing.orders);
  const products = useAppSelector((state) => state.products.items);
  const boms = useAppSelector((state) => state.bom.items);

  const [open, setOpen] = useState(false);

  const getComponentCost = (order: ManufacturingOrder) => {
    const bom = boms.find((b) => b.finishedProduct === order.productName);
    if (!bom) return 0;
    return bom.components.reduce((sum, comp) => {
      const compProduct = products.find((p) => p.name === comp.name);
      const price = compProduct ? compProduct.costPrice : 0;
      return sum + price * comp.qty * order.quantity;
    }, 0);
  };

  const getOperationCost = (order: ManufacturingOrder) => {
    if (!order.workOrders) return 0;
    return order.workOrders.reduce((sum, wo) => {
      const labor = wo.laborCostPerHour || 0;
      const overhead = wo.overheadCostPerHour || 0;
      const durationHours = wo.durationMinutes / 60;
      return sum + durationHours * (labor + overhead);
    }, 0);
  };

  useEffect(() => {
    dispatch(manufacturingActions.fetchManufacturingOrders());
    dispatch(productsActions.fetchProducts());
    dispatch(bomActions.fetchBoms());
  }, [dispatch]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManufacturingOrderFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(schema) as any,
    defaultValues: {
      productName: '',
      quantity: 1,
    },
  });

  const handleOpenCreate = () => {
    reset({
      productName: '',
      quantity: 1,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onSubmit = (data: ManufacturingOrderFormData) => {
    dispatch(
      manufacturingActions.addManufacturingOrder({
        productName: data.productName,
        quantity: data.quantity,
      })
    );

    setOpen(false);
  };

  const handleAdvanceStatus = (row: ManufacturingOrder) => {
    if (row.status === 'Draft') {
      dispatch(manufacturingActions.confirmManufacturingOrder(row.id));
    } else if (row.status === 'In Progress') {
      dispatch(manufacturingActions.completeManufacturingOrder(row.id));
    }
  };

  const columns: { title: string; status: 'Draft' | 'In Progress' | 'Completed'; color: string }[] = [
    { title: 'Draft', status: 'Draft', color: '#6B7280' },
    { title: 'In Progress', status: 'In Progress', color: '#F0AD4E' },
    { title: 'Completed', status: 'Completed', color: '#21B799' },
  ];

  return (
    <Box>
      <Stack direction="row" sx={{ mb: 4, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
            Manufacturing Orders (MO)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Coordinate shop floor execution, track material staging, and review completions.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Create MO
        </Button>
      </Stack>

      {/* Kanban Board Layout */}
      <Grid container spacing={3}>
        {columns.map((col) => {
          const orders = mfgOrders.filter((o) => o.status === col.status);
          return (
            <Grid size={{ xs: 12, md: 4 }} key={col.title}>
              <Paper
                sx={{
                  p: 2,
                  minHeight: 500,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                }}
              >
                <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: col.color }} />
                    {col.title}
                  </Typography>
                  <Chip label={orders.length} size="small" sx={{ fontWeight: 600 }} />
                </Stack>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={2}>
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <Card
                        key={order.moNumber}
                        sx={{
                          borderColor: 'divider',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.04)' },
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'start' }}>
                            <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                              {order.moNumber}
                            </Typography>
                            {order.status !== 'Completed' && (
                              <Tooltip title={order.status === 'Draft' ? 'Start Order' : 'Complete Order'}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleAdvanceStatus(order)}
                                  color="success"
                                  sx={{ p: 0.5 }}
                                >
                                  {order.status === 'Draft' ? <StartIcon sx={{ fontSize: 16 }} /> : <DoneIcon sx={{ fontSize: 16 }} />}
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                          <Typography variant="body1" sx={{ fontWeight: 600, mt: 1 }}>
                            {order.productName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Target Quantity: {order.quantity} units
                          </Typography>

                          {(() => {
                            const componentCost = getComponentCost(order);
                            const operationCost = getOperationCost(order);
                            const totalCost = componentCost + operationCost;
                            const unitCost = order.quantity > 0 ? totalCost / order.quantity : 0;
                            return (
                              <Box sx={{ mt: 1.5, p: 1, bgcolor: 'action.hover', borderRadius: 1.5 }}>
                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                  <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Components:</Typography>
                                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 600 }}>${componentCost.toFixed(2)}</Typography>
                                </Stack>
                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                  <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Operations:</Typography>
                                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 600 }}>${operationCost.toFixed(2)}</Typography>
                                </Stack>
                                <Divider sx={{ my: 0.5 }} />
                                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700 }}>Est. Cost:</Typography>
                                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'primary.main' }}>
                                    ${totalCost.toFixed(2)} (${unitCost.toFixed(2)}/u)
                                  </Typography>
                                </Stack>
                              </Box>
                            );
                          })()}

                          {order.workOrders && order.workOrders.length > 0 && (
                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                                Work Center Operations:
                              </Typography>
                              <Stack spacing={1}>
                                {order.workOrders.map((wo) => (
                                  <Stack key={wo.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.primary' }}>
                                      {wo.workCenterName}
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                      <Chip 
                                        label={wo.status} 
                                        size="small" 
                                        sx={{ fontSize: '0.65rem', height: 16 }} 
                                        color={wo.status === 'DONE' ? 'success' : wo.status === 'IN_PROGRESS' ? 'warning' : 'default'}
                                      />
                                      {wo.status === 'READY' && (
                                        <IconButton 
                                          size="small" 
                                          onClick={() => dispatch(manufacturingActions.startWorkOrder({ moId: order.id, woId: wo.id }))}
                                          color="primary"
                                          sx={{ p: 0.25 }}
                                        >
                                          <StartIcon sx={{ fontSize: 12 }} />
                                        </IconButton>
                                      )}
                                      {wo.status === 'IN_PROGRESS' && (
                                        <IconButton 
                                          size="small" 
                                          onClick={() => dispatch(manufacturingActions.completeWorkOrder({ moId: order.id, woId: wo.id }))}
                                          color="success"
                                          sx={{ p: 0.25 }}
                                        >
                                          <DoneIcon sx={{ fontSize: 12 }} />
                                        </IconButton>
                                      )}
                                    </Stack>
                                  </Stack>
                                ))}
                              </Stack>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Box sx={{ py: 6, textStyle: 'center', display: 'flex', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No orders in this phase.
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* MO Creation Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Create Manufacturing Order</DialogTitle>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth error={!!errors.productName}>
                <InputLabel shrink>Product to Produce</InputLabel>
                <Controller
                  name="productName"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Product to Produce" displayEmpty>
                      <MenuItem value="" disabled>Select a manufactured product</MenuItem>
                      {products
                        .filter((p) => p.procurementType === 'Manufactured')
                        .map((p) => (
                          <MenuItem key={p.id} value={p.name}>
                            {p.name}
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
                    label="Quantity to Produce"
                    type="number"
                    fullWidth
                    error={!!errors.quantity}
                    helperText={errors.quantity?.message}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Confirm Order
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
