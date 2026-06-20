import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Dashboard as DashboardIcon,
  ShoppingBag as ProductsIcon,
  People as CustomersIcon,
  LocalShipping as VendorsIcon,
  Inventory as InventoryIcon,
  TrendingUp as SalesIcon,
  ReceiptLong as PurchaseIcon,
  AccountTree as BoMIcon,
  PrecisionManufacturing as MfgIcon,
  History as AuditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface CommandItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  category: string;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands: CommandItem[] = [
    { name: 'Dashboard Analytics', path: '/dashboard', icon: <DashboardIcon />, category: 'Navigation' },
    { name: 'Products Management', path: '/products', icon: <ProductsIcon />, category: 'Master Data' },
    { name: 'Customers CRUD', path: '/customers', icon: <PeopleIcon />, category: 'Contacts' },
    { name: 'Vendors CRUD', path: '/vendors', icon: <VendorsIcon />, category: 'Contacts' },
    { name: 'Inventory Ledger & Stock', path: '/inventory', icon: <InventoryIcon />, category: 'Logistics' },
    { name: 'Sales Orders', path: '/sales', icon: <SalesIcon />, category: 'Sales & Purchases' },
    { name: 'Purchase Orders', path: '/purchase', icon: <PurchaseIcon />, category: 'Sales & Purchases' },
    { name: 'Bill of Materials (BoM)', path: '/bom', icon: <BoMIcon />, category: 'Manufacturing' },
    { name: 'Manufacturing Orders', path: '/manufacturing', icon: <MfgIcon />, category: 'Manufacturing' },
    { name: 'Audit Logs & Action Timeline', path: '/audit-logs', icon: <AuditIcon />, category: 'System' },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (path: string) => {
    setOpen(false);
    setSearch('');
    navigate(path);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 24,
            backgroundImage: 'none',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <SearchIcon color="action" sx={{ mr: 1 }} />
          <TextField
            fullWidth
            placeholder="Search modules, pages, or commands... (Ctrl+K)"
            variant="standard"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            InputProps={{
              disableUnderline: true,
              style: { fontSize: '1rem' },
            }}
          />
          <Typography variant="caption" sx={{ px: 1, py: 0.5, bgcolor: 'action.selected', borderRadius: 1, mr: 1, display: { xs: 'none', sm: 'inline-block' } }}>
            ESC
          </Typography>
          <IconButton size="small" onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0, maxHeight: 350, overflowY: 'auto' }}>
          {filteredCommands.length > 0 ? (
            <List sx={{ p: 1 }}>
              {filteredCommands.map((cmd) => (
                <ListItemButton
                  key={cmd.path}
                  onClick={() => handleSelect(cmd.path)}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    {cmd.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={cmd.name}
                    secondary={cmd.category}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No matching pages or actions found. Try "Inventory" or "Sales".
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Icon fallbacks if import names clash
const PeopleIcon = CustomersIcon;
