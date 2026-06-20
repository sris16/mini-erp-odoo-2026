import { useState } from 'react';
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
  auditLogsActions,
  inventoryActions,
  type ManufacturingOrder,
} from '../../store';

const schema = yup.object().shape({
  productName: yup.string().required('Product is required'),
  quantity: yup
    .number()
    .typeError('Quantity must be a number')
    .required('Quantity is required')
    .positive('Quantity must be positive')
    .integer(),
});

type ManufacturingOrderFormData = yup.InferType<typeof schema>;

export default function Manufacturing() {
  const dispatch = useAppDispatch();
  const mfgOrders = useAppSelector((state) => state.manufacturing.orders);
  const products = useAppSelector((state) => state.products.items);
  const boms = useAppSelector((state) => state.bom.items);

  const [open, setOpen] = useState(false);

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
        status: 'Draft',
      })
    );

    dispatch(
      auditLogsActions.addAuditLog({
        user: 'Admin',
        action: `Created Manufacturing Order for ${data.quantity}x ${data.productName}`,
        module: 'Manufacturing',
      })
    );

    setOpen(false);
  };

  const handleAdvanceStatus = (row: ManufacturingOrder) => {
    let nextStatus: 'Draft' | 'In Progress' | 'Completed' = 'Draft';
    if (row.status === 'Draft') nextStatus = 'In Progress';
    else if (row.status === 'In Progress') nextStatus = 'Completed';

    dispatch(
      manufacturingActions.updateManufacturingStatus({
        moNumber: row.moNumber,
        status: nextStatus,
      })
    );

    dispatch(
      auditLogsActions.addAuditLog({
        user: 'Admin',
        action: `Advanced status of Manufacturing Order ${row.moNumber} to ${nextStatus}`,
        module: 'Manufacturing',
      })
    );

    // If advanced to Completed:
    // 1. Increase inventory of finished product
    // 2. Add Stock Ledger IN entry
    // 3. (Optional but nice) Consume BoM raw ingredients
    if (nextStatus === 'Completed') {
      const prod = products.find((p) => p.name === row.productName);
      if (prod) {
        // Increase finished product stock
        dispatch(
          inventoryActions.updateStock({
            productId: prod.id,
            change: row.quantity,
          })
        );
        dispatch(
          inventoryActions.addLedgerEntry({
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            productName: row.productName,
            movementType: 'IN (Manufacturing)',
            quantity: row.quantity,
            reference: row.moNumber,
          })
        );

        // Consume raw components if BoM exists
        const bom = boms.find((b) => b.finishedProduct === row.productName);
        if (bom) {
          bom.components.forEach((comp) => {
            const rawProd = products.find((p) => p.name === comp.name);
            if (rawProd) {
              const consumedQty = comp.qty * row.quantity;
              dispatch(
                inventoryActions.updateStock({
                  productId: rawProd.id,
                  change: -consumedQty,
                })
              );
              dispatch(
                inventoryActions.addLedgerEntry({
                  date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                  productName: comp.name,
                  movementType: 'OUT (Consumed)',
                  quantity: consumedQty,
                  reference: row.moNumber,
                })
              );
            }
          });
        }
      }
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
