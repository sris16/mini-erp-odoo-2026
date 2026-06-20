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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Layers as BomIcon,
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  useAppDispatch,
  useAppSelector,
  bomActions,
  productsActions,
} from '../../store';

const schema = yup.object().shape({
  finishedProduct: yup.string().required('Finished product is required'),
  components: yup
    .array()
    .of(
      yup.object().shape({
        name: yup.string().required('Component name is required'),
        qty: yup
          .number()
          .typeError('Quantity must be a number')
          .required('Quantity is required')
          .positive('Quantity must be positive')
          .integer(),
      })
    )
    .min(1, 'At least one component line is required')
    .required(),
});

type BoMFormData = yup.InferType<typeof schema>;

export default function BoM() {
  const dispatch = useAppDispatch();
  const boms = useAppSelector((state) => state.bom.items);
  const products = useAppSelector((state) => state.products.items);

  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(bomActions.fetchBoms());
    dispatch(productsActions.fetchProducts());
  }, [dispatch]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BoMFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(schema) as any,
    defaultValues: {
      finishedProduct: '',
      components: [{ name: '', qty: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'components',
  });

  const handleOpenCreate = () => {
    reset({
      finishedProduct: '',
      components: [{ name: '', qty: 1 }],
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDelete = (id: number, productName: string) => {
    if (window.confirm(`Are you sure you want to delete BoM for ${productName}?`)) {
      dispatch(bomActions.deleteBoM(id));
    }
  };

  const onSubmit = (data: BoMFormData) => {
    // Filter empty lines
    const componentsVal = data.components.filter((c) => c.name !== '');
    if (componentsVal.length === 0) {
      alert('Please add at least one component');
      return;
    }

    dispatch(
      bomActions.addBoM({
        finishedProduct: data.finishedProduct,
        components: componentsVal as { name: string; qty: number }[],
      })
    );

    setOpen(false);
  };

  const filteredBoms = boms.filter((b) =>
    b.finishedProduct.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Stack direction="row" sx={{ mb: 4, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
            Bill of Materials (BoM)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Define assembly ingredients and structural dependencies for finished products.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Create BoM
        </Button>
      </Stack>

      <Card sx={{ borderColor: 'divider', mb: 4 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            placeholder="Search BoMs by finished product..."
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
                <TableCell>Finished Product</TableCell>
                <TableCell>Components Breakdown</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBoms.length > 0 ? (
                filteredBoms.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600, width: '30%', verticalAlign: 'top', pt: 2 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <BomIcon color="primary" sx={{ fontSize: 20 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{row.finishedProduct}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', py: 1.5 }}>
                      <List dense sx={{ p: 0 }}>
                        {row.components.map((c, i) => (
                          <ListItem key={i} sx={{ p: 0, py: 0.25 }}>
                            <ListItemText
                              primary={`• ${c.name}`}
                              secondary={`Required Quantity: ${c.qty} units`}
                              slotProps={{
                                primary: { sx: { fontSize: '0.85rem' } },
                                secondary: { sx: { fontSize: '0.75rem' } },
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </TableCell>
                    <TableCell align="center" sx={{ width: '15%', verticalAlign: 'top', pt: 2 }}>
                      <Tooltip title="Delete BoM">
                        <IconButton size="small" onClick={() => handleDelete(row.id, row.finishedProduct)} color="error">
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No Bill of Materials found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* BoM Creation Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Create Bill of Materials</DialogTitle>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth error={!!errors.finishedProduct}>
                <InputLabel shrink>Finished Product</InputLabel>
                <Controller
                  name="finishedProduct"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Finished Product" displayEmpty>
                      <MenuItem value="" disabled>Select a finished product</MenuItem>
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
                {errors.finishedProduct && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.finishedProduct.message}
                  </Typography>
                )}
              </FormControl>

              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Components
              </Typography>

              {fields.map((field, index) => (
                <Stack direction="row" spacing={2} key={field.id} sx={{ alignItems: 'flex-start' }}>
                  <FormControl fullWidth error={!!errors.components?.[index]?.name}>
                    <InputLabel shrink>Component Product</InputLabel>
                    <Controller
                      name={`components.${index}.name`}
                      control={control}
                      render={({ field: subField }) => (
                        <Select {...subField} label="Component Product" displayEmpty>
                          <MenuItem value="" disabled>Select component</MenuItem>
                          {products.map((p) => (
                            <MenuItem key={p.id} value={p.name}>
                              {p.name}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                  </FormControl>

                  <Controller
                    name={`components.${index}.qty`}
                    control={control}
                    render={({ field: subField }) => (
                      <TextField
                        {...subField}
                        label="Quantity"
                        type="number"
                        sx={{ width: 150 }}
                        error={!!errors.components?.[index]?.qty}
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
                onClick={() => append({ name: '', qty: 1 })}
                sx={{ alignSelf: 'flex-start', mt: 1 }}
              >
                Add Component Line
              </Button>
            </Stack>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Save BoM
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
