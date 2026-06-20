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
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppSelector, useAppDispatch, inventoryActions, reorderingRulesActions, productsActions } from '../../store';

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

  const dispatch = useAppDispatch();
  const { stock, ledger } = useAppSelector((state) => state.inventory);
  const reorderingRules = useAppSelector((state) => state.reorderingRules.items);
  const products = useAppSelector((state) => state.products.items);

  useEffect(() => {
    dispatch(inventoryActions.fetchStockAndLedger());
    dispatch(reorderingRulesActions.fetchReorderingRules());
    dispatch(productsActions.fetchProducts());
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
      </Stack>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
          <Tab icon={<StockIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Stock View" />
          <Tab icon={<LedgerIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Ledger View" />
          <Tab icon={<RuleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Reordering Rules" />
        </Tabs>
      </Box>

      {/* Search Filter */}
      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder={
            tabValue === 0
              ? 'Search stock by product...'
              : tabValue === 1
              ? 'Search ledger by product, reference, or type...'
              : 'Search rules by product...'
          }
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
    </Box>
  );
}
