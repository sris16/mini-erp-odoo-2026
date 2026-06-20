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
  TextField,
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
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  useAppDispatch,
  useAppSelector,
  productsActions,
  reorderingRulesActions,
  type Product,
} from '../../store';

const schema = yup.object().shape({
  name: yup.string().required('Product name is required'),
  sku: yup.string().required('SKU is required'),
  costPrice: yup.number().typeError('Cost must be a number').required('Cost price is required').min(0),
  salesPrice: yup.number().typeError('Sales Price must be a number').required('Sales price is required').min(0),
  onHandQty: yup.number().typeError('On hand quantity must be a number').required('Quantity is required').min(0),
  procurementStrategy: yup.string().required('Procurement strategy is required'),
  procurementType: yup.string().required('Procurement type is required'),
});

type ProductFormData = yup.InferType<typeof schema>;

export default function Products() {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.products.items);
  const reorderingRules = useAppSelector((state) => state.reorderingRules.items);

  useEffect(() => {
    dispatch(productsActions.fetchProducts());
    dispatch(reorderingRulesActions.fetchReorderingRules());
  }, [dispatch]);

  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: '',
      sku: '',
      costPrice: 0,
      salesPrice: 0,
      onHandQty: 0,
      procurementStrategy: 'MTS',
      procurementType: 'Purchased',
    },
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    reset({
      name: '',
      sku: '',
      costPrice: 0,
      salesPrice: 0,
      onHandQty: 0,
      procurementStrategy: 'MTS',
      procurementType: 'Purchased',
    });
    setOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      sku: product.sku,
      costPrice: product.costPrice,
      salesPrice: product.salesPrice,
      onHandQty: product.onHandQty,
      procurementStrategy: product.procurementStrategy,
      procurementType: product.procurementType,
    });
    setOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete product ${name}?`)) {
      dispatch(productsActions.deleteProduct(id));
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      const updated: Product = { id: editingProduct.id, ...data } as Product;
      dispatch(productsActions.editProduct(updated));
    } else {
      dispatch(productsActions.addProduct(data as Omit<Product, 'id'>));
    }
    setOpen(false);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Stack direction="row" sx={{ mb: 4, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
            Products
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage product catalog, prices, SKUs, and procurement routes.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Create Product
        </Button>
      </Stack>

      <Card sx={{ borderColor: 'divider', mb: 4 }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            placeholder="Search products by name or SKU..."
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
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Cost Price</TableCell>
                <TableCell align="right">Sales Price</TableCell>
                <TableCell align="right">On Hand Qty</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((row) => {
                  const rule = reorderingRules.find((r) => r.productId === row.id);
                  const isLowStock = rule ? row.onHandQty < rule.minQty : false;
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                      <TableCell>{row.sku}</TableCell>
                      <TableCell align="right">${row.costPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">${row.salesPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        {isLowStock ? (
                          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Chip
                              label="Low Stock"
                              color="warning"
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 18 }}
                            />
                            <Typography variant="body2">{row.onHandQty} units</Typography>
                          </Stack>
                        ) : (
                          `${row.onHandQty} units`
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                          <Tooltip title="Edit Product">
                            <IconButton size="small" onClick={() => handleOpenEdit(row)} color="primary">
                              <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Product">
                            <IconButton size="small" onClick={() => handleDelete(row.id, row.name)} color="error">
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No products found matching your search.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingProduct ? 'Edit Product' : 'Create Product'}
        </DialogTitle>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Product Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />

              <Controller
                name="sku"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SKU Code"
                    fullWidth
                    error={!!errors.sku}
                    helperText={errors.sku?.message}
                  />
                )}
              />

              <Stack direction="row" spacing={2}>
                <Controller
                  name="costPrice"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Cost Price ($)"
                      type="number"
                      fullWidth
                      error={!!errors.costPrice}
                      helperText={errors.costPrice?.message}
                    />
                  )}
                />
                <Controller
                  name="salesPrice"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Sales Price ($)"
                      type="number"
                      fullWidth
                      error={!!errors.salesPrice}
                      helperText={errors.salesPrice?.message}
                    />
                  )}
                />
              </Stack>

              <Controller
                name="onHandQty"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Initial Stock On Hand"
                    type="number"
                    fullWidth
                    error={!!errors.onHandQty}
                    helperText={errors.onHandQty?.message}
                    disabled={!!editingProduct} // Disallowed editing inventory quantity directly (backend ledger handles stock movement!)
                  />
                )}
              />

              <Stack direction="row" spacing={2}>
                <FormControl fullWidth error={!!errors.procurementStrategy}>
                  <InputLabel shrink>Procurement Strategy</InputLabel>
                  <Controller
                    name="procurementStrategy"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Procurement Strategy" displayEmpty>
                        <MenuItem value="MTS">Make to Stock (MTS)</MenuItem>
                        <MenuItem value="MTO">Make to Order (MTO)</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>

                <FormControl fullWidth error={!!errors.procurementType}>
                  <InputLabel shrink>Procurement Type</InputLabel>
                  <Controller
                    name="procurementType"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Procurement Type" displayEmpty>
                        <MenuItem value="Manufactured">Manufactured (In-House)</MenuItem>
                        <MenuItem value="Purchased">Purchased (Vendor)</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Stack>
            </Stack>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
