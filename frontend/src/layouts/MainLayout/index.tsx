import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Breadcrumbs,
  Link,
  Tooltip,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
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
  Search as SearchIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Logout as LogoutIcon,
  AccountCircle as UserIcon,
} from '@mui/icons-material';

import NotificationCenter from '../../components/common/NotificationCenter';
import CommandPalette from '../../components/common/CommandPalette';

const drawerWidth = 240;

interface MainLayoutProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function MainLayout({ darkMode, toggleDarkMode }: MainLayoutProps) {
  const [open, setOpen] = useState(true);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileOpen = (e: React.MouseEvent<HTMLElement>) => {
    setProfileAnchor(e.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchor(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    handleProfileClose();
  };

  // Sidebar navigation mapping
  const menuItems = [
    { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'Products', path: '/products', icon: <ProductsIcon /> },
    { text: 'Customers', path: '/customers', icon: <CustomersIcon /> },
    { text: 'Vendors', path: '/vendors', icon: <VendorsIcon /> },
    { text: 'Inventory', path: '/inventory', icon: <InventoryIcon /> },
    { text: 'Sales', path: '/sales', icon: <SalesIcon /> },
    { text: 'Purchase', path: '/purchase', icon: <PurchaseIcon /> },
    { text: 'BoM', path: '/bom', icon: <BoMIcon /> },
    { text: 'Manufacturing', path: '/manufacturing', icon: <MfgIcon /> },
    { text: 'Audit Logs', path: '/audit-logs', icon: <AuditIcon /> },
  ];

  // Breadcrumbs generation
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbName = (part: string) => {
    if (part === 'bom') return 'BoM';
    if (part === 'audit-logs') return 'Audit Logs';
    return part.charAt(0).toUpperCase() + part.slice(1);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 56 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Avatar
              sx={{
                bgcolor: 'transparent',
                width: 32,
                height: 32,
                mr: 1.5,
                border: '2px solid white',
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'white' }}>
                S
              </Typography>
            </Avatar>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
              Shiv Furniture Works
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Command Palette Helper */}
            <Tooltip title="Press Ctrl+K to search">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: 'primary.dark',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1.5,
                  mr: 2,
                  cursor: 'pointer',
                  opacity: 0.9,
                  '&:hover': { opacity: 1 },
                }}
              >
                <SearchIcon sx={{ mr: 1, fontSize: 18 }} />
                <Typography variant="body2" sx={{ mr: 1, fontSize: '0.8rem', display: { xs: 'none', md: 'inline' } }}>
                  Search modules...
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    px: 0.8,
                    py: 0.1,
                    borderRadius: 1,
                    fontSize: '0.7rem',
                  }}
                >
                  Ctrl+K
                </Typography>
              </Box>
            </Tooltip>

            {/* Notification Bell */}
            <NotificationCenter />

            {/* Theme Toggle */}
            <IconButton color="inherit" onClick={toggleDarkMode}>
              {darkMode ? <LightIcon /> : <DarkIcon />}
            </IconButton>

            {/* User Profile */}
            <IconButton onClick={handleProfileOpen} sx={{ p: 0, ml: 1 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: '0.9rem' }}>
                A
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={profileAnchor}
              open={Boolean(profileAnchor)}
              onClose={handleProfileClose}
              slotProps={{ paper: { sx: { width: 180, mt: 1.5 } } }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Admin User
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  admin@shivfurniture.com
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleProfileClose} disabled>
                <UserIcon sx={{ mr: 1.5, fontSize: 20 }} /> My Profile
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} /> Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 72,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 72,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            overflowX: 'hidden',
          },
        }}
      >
        <Toolbar sx={{ minHeight: 56 }} />
        <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <List sx={{ px: 1, py: 1.5 }}>
            {menuItems.map((item) => {
              const active = location.pathname.startsWith(item.path);
              return (
                <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                  <ListItemButton
                    component={RouterLink}
                    to={item.path}
                    sx={{
                      minHeight: 40,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                      borderRadius: 2,
                      bgcolor: active ? 'action.selected' : 'transparent',
                      color: active ? 'primary.main' : 'text.primary',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 2 : 'auto',
                        justifyContent: 'center',
                        color: active ? 'primary.main' : 'text.secondary',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      sx={{
                        opacity: open ? 1 : 0,
                        '& .MuiTypography-root': {
                          fontSize: '0.875rem',
                          fontWeight: active ? 600 : 500,
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
          <Box sx={{ mt: 'auto', p: 2, display: open ? 'block' : 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
              Shiv ERP v1.0.0
            </Typography>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
        <Toolbar sx={{ minHeight: 56 }} />
        
        {/* Breadcrumbs Bar */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.85rem' }}>
            <Link component={RouterLink} to="/dashboard" color="inherit" underline="hover">
              Home
            </Link>
            {pathnames.map((value, index) => {
              const last = index === pathnames.length - 1;
              const to = `/${pathnames.slice(0, index + 1).join('/')}`;
              return last ? (
                <Typography color="text.primary" key={to} sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  {getBreadcrumbName(value)}
                </Typography>
              ) : (
                <Link component={RouterLink} to={to} color="inherit" underline="hover" key={to}>
                  {getBreadcrumbName(value)}
                </Link>
              );
            })}
          </Breadcrumbs>
        </Box>

        {/* Content Outlet */}
        <Box sx={{ minHeight: 'calc(100vh - 160px)' }}>
          <Outlet />
        </Box>
      </Box>

      {/* Global Command Palette dialog */}
      <CommandPalette />
    </Box>
  );
}
