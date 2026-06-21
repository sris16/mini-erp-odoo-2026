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
  CheckCircle as ApproveIcon,
  Warning as WarnIcon,
  Receipt as BillIcon,
  Description as InvoiceIcon,
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
  invoicingActions,
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
  const invoices = useAppSelector((state) => state.invoices.items);
  const bills = useAppSelector((state) => state.bills.items);

  const [open, setOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    open: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showInfoPopup = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setInfoModal({ open: true, title, message, type });
  };

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
    dispatch(invoicingActions.fetchInvoices());
    dispatch(invoicingActions.fetchBills());
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
    const bom = boms.find((b) => b.finishedProduct === data.productName);
    if (bom) {
      const shortages: string[] = [];
      bom.components.forEach((comp) => {
        const compProduct = products.find((p) => p.name === comp.name);
        const compAvailable = compProduct ? compProduct.onHandQty - compProduct.reservedQty : 0;
        const required = comp.qty * data.quantity;
        if (compAvailable < required) {
          shortages.push(`${comp.name} (Required: ${required}, Available: ${compAvailable})`);
        }
      });
      if (shortages.length > 0) {
        showInfoPopup(
          'Insufficient Stock Restriction',
          `You cannot create this Manufacturing Order because the following components have insufficient stock:\n\n${shortages.join('\n')}`,
          'error'
        );
        return;
      }
    } else {
      showInfoPopup(
        'No BoM Found',
        `No Bill of Materials defined for "${data.productName}". Please define a BoM first.`,
        'error'
      );
      return;
    }

    dispatch(
      manufacturingActions.addManufacturingOrder({
        productName: data.productName,
        quantity: data.quantity,
      })
    )
      .unwrap()
      .then(() => {
        showInfoPopup(
          'Task Completed Successfully',
          'The Manufacturing Order has been successfully created and saved in DRAFT status.',
          'success'
        );
        dispatch(manufacturingActions.fetchManufacturingOrders());
      })
      .catch((err: unknown) => {
        const error = err as { message?: string };
        showInfoPopup('Error Creating Manufacturing Order', error?.message || 'Failed to create MO.', 'error');
      });

    setOpen(false);
  };

  const handleAdvanceStatus = (row: ManufacturingOrder) => {
    if (row.status === 'Draft') {
      const bom = boms.find((b) => b.finishedProduct === row.productName);
      if (bom) {
        const shortages: string[] = [];
        bom.components.forEach((comp) => {
          const compProduct = products.find((p) => p.name === comp.name);
          const compAvailable = compProduct ? compProduct.onHandQty - compProduct.reservedQty : 0;
          const required = comp.qty * row.quantity;
          if (compAvailable < required) {
            shortages.push(`${comp.name} (Required: ${required}, Available: ${compAvailable})`);
          }
        });
        if (shortages.length > 0) {
          showInfoPopup(
            'Insufficient Stock Restriction',
            `You cannot confirm this Manufacturing Order because the following components have insufficient stock:\n\n${shortages.join('\n')}`,
            'error'
          );
          return;
        }
      } else {
        showInfoPopup(
          'No BoM Found',
          `No Bill of Materials defined for "${row.productName}".`,
          'error'
        );
        return;
      }

      dispatch(manufacturingActions.confirmManufacturingOrder(row.id))
        .unwrap()
        .then(() => {
          showInfoPopup(
            'Task Completed Successfully',
            `Manufacturing Order ${row.moNumber} has been successfully confirmed and components reserved.`,
            'success'
          );
          dispatch(manufacturingActions.fetchManufacturingOrders());
        })
        .catch((err: unknown) => {
          const error = err as { message?: string };
          showInfoPopup('Error Confirming MO', error?.message || 'Failed to confirm MO.', 'error');
        });
    } else if (row.status === 'In Progress') {
      dispatch(manufacturingActions.completeManufacturingOrder(row.id))
        .unwrap()
        .then(() => {
          showInfoPopup(
            'Task Completed Successfully',
            `Manufacturing Order ${row.moNumber} has been completed. Finished goods added to stock!`,
            'success'
          );
          dispatch(manufacturingActions.fetchManufacturingOrders());
        })
        .catch((err: unknown) => {
          const error = err as { message?: string };
          showInfoPopup('Error Completing MO', error?.message || 'Failed to complete MO.', 'error');
        });
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
                            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                              {order.status !== 'Draft' && order.rawStatus !== 'CANCELLED' && (
                                <>
                                  <Tooltip title={invoices.some((inv) => inv.manufacturingOrderId === order.id) ? "Invoice Already Created" : "Create Customer Invoice"}>
                                    <span>
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => {
                                          dispatch(invoicingActions.createInvoiceFromMO(order.id))
                                            .unwrap()
                                            .then(() => {
                                              showInfoPopup(
                                                'Task Completed Successfully',
                                                'Customer Invoice has been successfully created from the Manufacturing Order.',
                                                'success'
                                              );
                                              dispatch(invoicingActions.fetchInvoices());
                                            })
                                            .catch((err: unknown) => {
                                              const error = err as { message?: string };
                                              showInfoPopup('Error Creating Invoice', error?.message || 'Failed to create invoice.', 'error');
                                            });
                                        }}
                                        disabled={invoices.some((inv) => inv.manufacturingOrderId === order.id)}
                                        sx={{ p: 0.5 }}
                                      >
                                        <InvoiceIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title={bills.some((bill) => bill.manufacturingOrderId === order.id) ? "Bill Already Created" : "Create Vendor Bill"}>
                                    <span>
                                      <IconButton
                                        size="small"
                                        color="secondary"
                                        onClick={() => {
                                          dispatch(invoicingActions.createBillFromMO(order.id))
                                            .unwrap()
                                            .then(() => {
                                              showInfoPopup(
                                                'Task Completed Successfully',
                                                'Vendor Bill has been successfully created from the Manufacturing Order.',
                                                'success'
                                              );
                                              dispatch(invoicingActions.fetchBills());
                                            })
                                            .catch((err: unknown) => {
                                              const error = err as { message?: string };
                                              showInfoPopup('Error Creating Bill', error?.message || 'Failed to create vendor bill.', 'error');
                                            });
                                        }}
                                        disabled={bills.some((bill) => bill.manufacturingOrderId === order.id)}
                                        sx={{ p: 0.5 }}
                                      >
                                        <BillIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </>
                              )}
                              {order.status !== 'Completed' && order.rawStatus !== 'CANCELLED' && (
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
                                          onClick={() => {
                                            dispatch(manufacturingActions.startWorkOrder({ moId: order.id, woId: wo.id }))
                                              .unwrap()
                                              .then(() => {
                                                showInfoPopup(
                                                  'Task Completed Successfully',
                                                  `Work center operation '${wo.workCenterName}' has been successfully started.`,
                                                  'success'
                                                );
                                                dispatch(manufacturingActions.fetchManufacturingOrders());
                                              })
                                              .catch((err: unknown) => {
                                                const error = err as { message?: string };
                                                showInfoPopup('Error Starting Work Order', error?.message || 'Failed to start operation.', 'error');
                                              });
                                          }}
                                          color="primary"
                                          sx={{ p: 0.25 }}
                                        >
                                          <StartIcon sx={{ fontSize: 12 }} />
                                        </IconButton>
                                      )}
                                      {wo.status === 'IN_PROGRESS' && (
                                        <IconButton 
                                          size="small" 
                                          onClick={() => {
                                            dispatch(manufacturingActions.completeWorkOrder({ moId: order.id, woId: wo.id }))
                                              .unwrap()
                                              .then(() => {
                                                showInfoPopup(
                                                  'Task Completed Successfully',
                                                  `Work center operation '${wo.workCenterName}' has been successfully completed.`,
                                                  'success'
                                                );
                                                dispatch(manufacturingActions.fetchManufacturingOrders());
                                              })
                                              .catch((err: unknown) => {
                                                const error = err as { message?: string };
                                                showInfoPopup('Error Completing Work Order', error?.message || 'Failed to complete operation.', 'error');
                                              });
                                          }}
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
                    <Select
                      {...field}
                      label="Product to Produce"
                      displayEmpty
                      value={field.value ?? ''}
                      renderValue={(selected) => {
                        if (!selected) return <em>Select a manufactured product</em>;
                        return String(selected);
                      }}
                    >
                      <MenuItem value="" disabled>Select a manufactured product</MenuItem>
                      {products
                        .filter((p) => p.procurementType === 'Manufactured')
                        .map((p) => {
                          const bom = boms.find((b) => b.finishedProduct === p.name);
                          let componentsAvailable = true;
                          let shortageCount = 0;
                          if (bom) {
                            bom.components.forEach((comp) => {
                              const compProduct = products.find((prod) => prod.name === comp.name);
                              const compAvail = compProduct ? compProduct.onHandQty - compProduct.reservedQty : 0;
                              if (compAvail < comp.qty) {
                                componentsAvailable = false;
                                shortageCount++;
                              }
                            });
                          } else {
                            componentsAvailable = false; // No BoM defined yet
                          }
                          return (
                            <MenuItem key={p.id} value={p.name}>
                              <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                                <span>{p.name}</span>
                                {!bom ? (
                                  <Chip label="No BoM Defined" size="small" color="default" sx={{ height: 18, fontSize: '0.65rem' }} />
                                ) : !componentsAvailable ? (
                                  <Chip label={`Shortage (${shortageCount})`} size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                                ) : (
                                  <Typography variant="caption" color="success.main" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                    Components Ready
                                  </Typography>
                                )}
                              </Box>
                            </MenuItem>
                          );
                        })}
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
                    slotProps={{
                      htmlInput: {
                        min: 1,
                      },
                    }}
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

      {/* Universal Info/Notification Dialog */}
      <Dialog
        open={infoModal.open}
        onClose={() => setInfoModal((prev) => ({ ...prev, open: false }))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          {infoModal.type === 'success' ? (
            <ApproveIcon color="success" sx={{ fontSize: 24 }} />
          ) : (
            <WarnIcon color="error" sx={{ fontSize: 24 }} />
          )}
          {infoModal.title}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Typography variant="body1" sx={{ py: 1 }}>
            {infoModal.message}
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setInfoModal((prev) => ({ ...prev, open: false }))}
            variant="contained"
            color={infoModal.type === 'success' ? 'success' : 'error'}
            fullWidth
            sx={{ py: 1, fontWeight: 600 }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
