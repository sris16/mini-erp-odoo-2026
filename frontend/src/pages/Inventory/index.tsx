import { useState, useEffect } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Inventory as StockIcon,
  ListAlt as LedgerIcon,
  Search as SearchIcon,
  Add as AddIcon,
  PlayArrow as RunIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Autorenew as RuleIcon,
  Store as LocationIcon,
  SwapHoriz as TransferIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppSelector, useAppDispatch, inventoryActions, reorderingRulesActions, productsActions, locationsActions } from '../../store';
import DebouncedTextField from '../../components/common/DebouncedTextField';

const ruleSchema = yup.object().shape({
  productId: yup.number().typeError('Product is required').required('Product is required'),
  minQty: yup
    .number()
    .typeError('Min Quantity must be a number')
    .required('Min Quantity is required')
    .min(0, 'Min Quantity cannot be negative')
    .integer(),
  maxQty: yup
    .number()
    .typeError('Max Quantity must be a number')
    .required('Max Quantity is required')
    .min(1, 'Max Quantity must be positive')
    .integer()
    .moreThan(yup.ref('minQty'), 'Max Quantity must be greater than Min Quantity'),
});

type RuleFormData = yup.InferType<typeof ruleSchema>;

export default function Inventory() {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  const dispatch = useAppDispatch();
  const { stock, ledger } = useAppSelector((state) => state.inventory);
  const reorderingRules = useAppSelector((state) => state.reorderingRules.items);
  const products = useAppSelector((state) => state.products.items);
  const { locations, stocks: locationStocks, transfers } = useAppSelector((state) => state.locations);

  useEffect(() => {
    dispatch(inventoryActions.fetchStockAndLedger());
    dispatch(reorderingRulesActions.fetchReorderingRules());
    dispatch(productsActions.fetchProducts());
    dispatch(locationsActions.fetchLocations());
    dispatch(locationsActions.fetchLocationStocks());
    dispatch(locationsActions.fetchTransfers());
  }, [dispatch]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RuleFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(ruleSchema) as any,
    defaultValues: {
      productId: undefined,
      minQty: 10,
      maxQty: 100,
    },
  });

  const transferSchema = yup.object().shape({
    productId: yup.number().typeError('Product is required').required('Product is required'),
    sourceLocationId: yup.number().typeError('Source Location is required').required('Source Location is required'),
    destinationLocationId: yup
      .number()
      .typeError('Destination Location is required')
      .required('Destination Location is required')
      .notOneOf([yup.ref('sourceLocationId')], 'Source and Destination locations must be different'),
    qty: yup
      .number()
      .typeError('Quantity must be a number')
      .required('Quantity is required')
      .positive('Quantity must be positive')
      .integer()
      .test(
        'stock-check',
        'Insufficient available stock at source location',
        function (value) {
          const { productId, sourceLocationId } = this.parent;
          if (!productId || !sourceLocationId || !value) return true;
          const ls = locationStocks.find(
            (s) => s.product.id === productId && s.location.id === sourceLocationId
          );
          const available = ls ? ls.onHandQty - ls.reservedQty : 0;
          return value <= available;
        }
      ),
  });

  type TransferFormData = yup.InferType<typeof transferSchema>;

  const {
    control: transferControl,
    handleSubmit: handleTransferSubmit,
    reset: resetTransfer,
    formState: { errors: transferErrors },
  } = useForm<TransferFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(transferSchema) as any,
    defaultValues: {
      productId: undefined,
      sourceLocationId: undefined,
      destinationLocationId: undefined,
      qty: 1,
    },
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSearchTerm('');
  };

  const handleOpenCreate = () => {
    setEditingRuleId(null);
    reset({
      productId: undefined,
      minQty: 10,
      maxQty: 100,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (rule: typeof reorderingRules[0]) => {
    setEditingRuleId(rule.id);
    reset({
      productId: rule.productId,
      minQty: rule.minQty,
      maxQty: rule.maxQty,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const onSubmit = (data: RuleFormData) => {
    if (editingRuleId !== null) {
      dispatch(
        reorderingRulesActions.editReorderingRule({
          id: editingRuleId,
          minQty: data.minQty,
          maxQty: data.maxQty,
        })
      ).then(() => {
        dispatch(reorderingRulesActions.fetchReorderingRules());
      });
    } else {
      dispatch(
        reorderingRulesActions.addReorderingRule({
          productId: data.productId,
          minQty: data.minQty,
          maxQty: data.maxQty,
        })
      );
    }
    setDialogOpen(false);
  };

  const handleDeleteRule = (id: number) => {
    if (window.confirm('Are you sure you want to delete this reordering rule?')) {
      dispatch(reorderingRulesActions.deleteReorderingRule(id));
    }
  };

  const handleRunScheduler = () => {
    dispatch(reorderingRulesActions.runReorderingScheduler()).then(() => {
      alert('Procurement scheduler executed successfully. Inventory status and draft POs/MOs have been updated!');
      dispatch(inventoryActions.fetchStockAndLedger());
      dispatch(reorderingRulesActions.fetchReorderingRules());
    });
  };

  const handleOpenTransferCreate = () => {
    resetTransfer({
      productId: undefined,
      sourceLocationId: undefined,
      destinationLocationId: undefined,
      qty: 1,
    });
    setTransferDialogOpen(true);
  };

  const handleCloseTransferDialog = () => {
    setTransferDialogOpen(false);
  };

  const onTransferSubmit = (data: TransferFormData) => {
    dispatch(
      locationsActions.createTransfer({
        productId: Number(data.productId),
        qty: Number(data.qty),
        sourceLocationId: Number(data.sourceLocationId),
        destinationLocationId: Number(data.destinationLocationId),
      })
    ).then(() => {
      dispatch(locationsActions.fetchTransfers());
      dispatch(locationsActions.fetchLocationStocks());
      dispatch(inventoryActions.fetchStockAndLedger());
    });
    setTransferDialogOpen(false);
  };

  const handleCompleteTransfer = (id: number) => {
    if (window.confirm('Are you sure you want to complete this stock transfer?')) {
      dispatch(locationsActions.completeTransfer(id)).then(() => {
        dispatch(locationsActions.fetchTransfers());
        dispatch(locationsActions.fetchLocationStocks());
        dispatch(inventoryActions.fetchStockAndLedger());
      });
    }
  };

  const filteredStock = stock.filter((s) =>
    s.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLedger = ledger.filter((l) =>
    l.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.movementType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRules = reorderingRules.filter((r) =>
    r.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransfers = transfers.filter((t) =>
    t.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.transferNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Products available to assign rules (not already mapped, except when editing)
  const availableProducts = products.filter(
    (p) =>
      editingRuleId !== null ||
      !reorderingRules.some((r) => r.productId === p.id)
  );

  return (
    <Box>
      <Stack direction="row" sx={{ mb: 4, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
            Inventory Stock
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track real-time stock balances, reservations, and stock movement logs.
          </Typography>
        </Box>
        {tabValue === 2 && (
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RunIcon />}
              onClick={handleRunScheduler}
            >
              Run Scheduler
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Create Rule
            </Button>
          </Stack>
        )}
        {tabValue === 4 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenTransferCreate}
          >
            New Transfer
          </Button>
        )}
      </Stack>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
          <Tab icon={<StockIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Stock View" />
          <Tab icon={<LedgerIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Ledger View" />
          <Tab icon={<RuleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Reordering Rules" />
          <Tab icon={<LocationIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Warehouse Locations" />
          <Tab icon={<TransferIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Stock Transfers" />
        </Tabs>
      </Box>

      {/* Search Filter */}
      <Box sx={{ mb: 3 }}>
        <DebouncedTextField
          placeholder={
            tabValue === 0
              ? 'Search stock by product...'
              : tabValue === 1
              ? 'Search ledger by product, reference, or type...'
              : tabValue === 2
              ? 'Search rules by product...'
              : tabValue === 3
              ? 'Search location stocks by product...'
              : 'Search transfers by product or reference...'
          }
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

      {tabValue === 2 && (
        <Card sx={{ borderColor: 'divider' }}>
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Minimum Qty</TableCell>
                  <TableCell align="right">Maximum Qty</TableCell>
                  <TableCell>Last Triggered</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRules.length > 0 ? (
                  filteredRules.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{row.productName}</TableCell>
                      <TableCell align="right">{row.minQty} units</TableCell>
                      <TableCell align="right">{row.maxQty} units</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                        {row.lastTriggered || 'Never'}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                          <Tooltip title="Edit Rule">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(row)}>
                              <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Rule">
                            <IconButton size="small" color="error" onClick={() => handleDeleteRule(row.id)}>
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No reordering rules defined.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {tabValue === 3 && (
        <Box>
          {/* Location Summary Cards */}
          <Stack direction="row" spacing={3} sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}>
            {locations.map((loc) => {
              const uniqueItemsCount = locationStocks.filter(
                (s) => s.location.id === loc.id && s.onHandQty > 0
              ).length;
              return (
                <Card key={loc.id} sx={{ p: 3, flex: '1 1 250px', borderColor: 'divider' }}>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <LocationIcon color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        {loc.code}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {loc.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        <strong>{uniqueItemsCount}</strong> distinct products stocked
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              );
            })}
          </Stack>

          {/* Product Stock Distribution Pivot Table */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Product Stock Distribution
          </Typography>
          <Card sx={{ borderColor: 'divider' }}>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>SKU</TableCell>
                    {locations.map((loc) => (
                      <TableCell key={loc.id} align="right">
                        {loc.name}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Global</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{p.sku}</TableCell>
                      {locations.map((loc) => {
                        const ls = locationStocks.find(
                          (s) => s.product.id === p.id && s.location.id === loc.id
                        );
                        const onHand = ls ? ls.onHandQty : 0;
                        const reserved = ls ? ls.reservedQty : 0;
                        return (
                          <TableCell key={loc.id} align="right">
                            <Box>
                              <span style={{ fontWeight: onHand > 0 ? 600 : 'normal' }}>
                                {onHand} units
                              </span>
                              {reserved > 0 && (
                                <span style={{ fontSize: '0.8rem', color: 'orange', marginLeft: 4 }}>
                                  ({reserved} res)
                                </span>
                              )}
                            </Box>
                          </TableCell>
                        );
                      })}
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {p.onHandQty} units
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {tabValue === 4 && (
        <Card sx={{ borderColor: 'divider' }}>
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Transfer #</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell>Source Location</TableCell>
                  <TableCell>Destination Location</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Completed Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransfers.length > 0 ? (
                  filteredTransfers.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                        {row.transferNumber}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {row.product.name}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {row.qty} units
                      </TableCell>
                      <TableCell>{row.sourceLocation.name}</TableCell>
                      <TableCell>{row.destinationLocation.name}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{row.createdDate}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {row.completedDate || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          color={row.status === 'COMPLETED' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {row.status === 'DRAFT' && (
                          <Tooltip title="Complete Transfer">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleCompleteTransfer(row.id)}
                            >
                              <CompleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No stock transfers found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Create / Edit Rule Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingRuleId !== null ? 'Edit Reordering Rule' : 'Create Reordering Rule'}
        </DialogTitle>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth error={!!errors.productId} disabled={editingRuleId !== null}>
                <InputLabel shrink>Product</InputLabel>
                <Controller
                  name="productId"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Product" displayEmpty>
                      <MenuItem value="" disabled>Select a product</MenuItem>
                      {availableProducts.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.productId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.productId.message}
                  </Typography>
                )}
              </FormControl>

              <Controller
                name="minQty"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Minimum Quantity"
                    type="number"
                    fullWidth
                    error={!!errors.minQty}
                    helperText={errors.minQty ? errors.minQty.message : 'When stock drops below this value, replenishment is triggered.'}
                  />
                )}
              />

              <Controller
                name="maxQty"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Maximum Quantity"
                    type="number"
                    fullWidth
                    error={!!errors.maxQty}
                    helperText={errors.maxQty ? errors.maxQty.message : 'The target stock level to replenish back up to.'}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Save Rule
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* New Stock Transfer Dialog */}
      <Dialog open={transferDialogOpen} onClose={handleCloseTransferDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Create Internal Stock Transfer</DialogTitle>
        <Divider />
        <form onSubmit={handleTransferSubmit(onTransferSubmit)}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Product */}
              <FormControl fullWidth error={!!transferErrors.productId}>
                <InputLabel shrink>Product</InputLabel>
                <Controller
                  name="productId"
                  control={transferControl}
                  render={({ field }) => (
                    <Select {...field} label="Product" displayEmpty>
                      <MenuItem value="" disabled>Select product to transfer</MenuItem>
                      {products.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {transferErrors.productId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {String(transferErrors.productId.message)}
                  </Typography>
                )}
              </FormControl>

              {/* Source Location */}
              <FormControl fullWidth error={!!transferErrors.sourceLocationId}>
                <InputLabel shrink>Source Location</InputLabel>
                <Controller
                  name="sourceLocationId"
                  control={transferControl}
                  render={({ field }) => (
                    <Select {...field} label="Source Location" displayEmpty>
                      <MenuItem value="" disabled>Select source location</MenuItem>
                      {locations.map((loc) => (
                        <MenuItem key={loc.id} value={loc.id}>
                          {loc.name} ({loc.code})
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {transferErrors.sourceLocationId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {String(transferErrors.sourceLocationId.message)}
                  </Typography>
                )}
              </FormControl>

              {/* Destination Location */}
              <FormControl fullWidth error={!!transferErrors.destinationLocationId}>
                <InputLabel shrink>Destination Location</InputLabel>
                <Controller
                  name="destinationLocationId"
                  control={transferControl}
                  render={({ field }) => (
                    <Select {...field} label="Destination Location" displayEmpty>
                      <MenuItem value="" disabled>Select destination location</MenuItem>
                      {locations.map((loc) => (
                        <MenuItem key={loc.id} value={loc.id}>
                          {loc.name} ({loc.code})
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {transferErrors.destinationLocationId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {String(transferErrors.destinationLocationId.message)}
                  </Typography>
                )}
              </FormControl>

              {/* Quantity */}
              <Controller
                name="qty"
                control={transferControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Transfer Quantity"
                    type="number"
                    fullWidth
                    error={!!transferErrors.qty}
                    helperText={transferErrors.qty ? String(transferErrors.qty.message) : 'Number of units to relocate.'}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseTransferDialog} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Create Transfer
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
