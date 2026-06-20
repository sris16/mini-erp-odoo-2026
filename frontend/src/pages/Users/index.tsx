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
  Stack,
  Tooltip,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
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
  usersActions,
  type User,
} from '../../store';
import DebouncedTextField from '../../components/common/DebouncedTextField';

const schema = yup.object().shape({
  username: yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
  password: yup.string().test(
    'password-validation',
    'Password must be at least 6 characters',
    function (value) {
      const context = this.options.context as { isEdit: boolean } | undefined;
      const isEdit = context?.isEdit || false;
      if (isEdit) {
        if (!value || value.trim() === '') return true; // optional
        return value.length >= 6;
      }
      return !!value && value.length >= 6; // required
    }
  ),
  role: yup.string().required('Role is required'),
});

type UserFormData = {
  username: string;
  password?: string;
  role: string;
};

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'OWNER', label: 'Business Owner' },
  { value: 'SALES_USER', label: 'Sales User' },
  { value: 'PURCHASE_USER', label: 'Purchase User' },
  { value: 'MANUFACTURING_USER', label: 'Manufacturing User' },
  { value: 'INVENTORY_MANAGER', label: 'Inventory Manager' },
];

export default function Users() {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.users.users);
  const currentUser = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(usersActions.fetchUsers());
  }, [dispatch]);

  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: number; username: string } | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: yupResolver(schema) as any,
    context: { isEdit: editingUser !== null },
    defaultValues: {
      username: '',
      password: '',
      role: 'SALES_USER',
    },
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    reset({
      username: '',
      password: '',
      role: 'SALES_USER',
    });
    setOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    reset({
      username: user.username,
      password: '',
      role: user.role,
    });
    setOpen(true);
  };

  const handleDeleteClick = (id: number, username: string) => {
    if (currentUser && currentUser.name.toLowerCase() === username.toLowerCase()) {
      return;
    }
    setUserToDelete({ id, username });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      dispatch(usersActions.deleteUser(userToDelete.id))
        .unwrap()
        .catch((err) => {
          alert(err.message || 'Failed to delete user');
        });
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      const payload: any = {
        id: editingUser.id,
        username: data.username,
        role: data.role,
      };
      if (data.password && data.password.trim() !== '') {
        payload.password = data.password;
      }
      dispatch(usersActions.editUser(payload))
        .unwrap()
        .then(() => {
          setOpen(false);
        })
        .catch((err) => {
          alert(err.message || 'Failed to update user');
        });
    } else {
      dispatch(usersActions.addUser(data))
        .unwrap()
        .then(() => {
          setOpen(false);
        })
        .catch((err) => {
          alert(err.message || 'Failed to create user');
        });
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleChipColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'OWNER':
        return 'primary';
      case 'INVENTORY_MANAGER':
        return 'success';
      case 'MANUFACTURING_USER':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          User Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          New User
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3 }}>
        <DebouncedTextField
          fullWidth
          size="small"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(val) => setSearchTerm(val)}
          slotProps={{
            input: {
              startAdornment: <SearchIcon color="action" sx={{ mr: 1, fontSize: 20 }} />,
            }
          }}
        />
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.id}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{u.username}</TableCell>
                <TableCell>
                  <Chip
                    label={u.role}
                    size="small"
                    color={getRoleChipColor(u.role)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'flex-end' }}>
                    <Tooltip title="Edit User">
                      <IconButton size="small" onClick={() => handleOpenEdit(u)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(u.id, u.username)}
                          disabled={currentUser?.name.toLowerCase() === u.username.toLowerCase()}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Username"
                    fullWidth
                    error={!!errors.username}
                    helperText={errors.username?.message}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="password"
                    label={editingUser ? 'Password (Leave blank to keep current)' : 'Password'}
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password?.message}
                  />
                )}
              />

              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.role}>
                    <InputLabel id="role-select-label">Role</InputLabel>
                    <Select
                      {...field}
                      labelId="role-select-label"
                      label="Role"
                    >
                      {ROLES.map((r) => (
                        <MenuItem key={r.value} value={r.value}>
                          {r.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Stack>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <Divider />
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{userToDelete?.username}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
