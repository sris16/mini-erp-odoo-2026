import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  useTheme,
  Button,
  IconButton,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  ShoppingBag as ProductsIcon,
  TrendingUp as SalesIcon,
  ReceiptLong as PurchaseIcon,
  PrecisionManufacturing as MfgIcon,
  LocalShipping as DeliveryIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Store as VendorsIcon,
  Settings as SettingsIcon,
  Warning as WarnIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  useAppSelector,
  useAppDispatch,
  productsActions,
  salesActions,
  purchaseActions,
  manufacturingActions,
  dashboardActions,
  customersActions,
  vendorsActions,
  locationsActions,
  usersActions,
} from '../../store';
import SettingsDialog from '../../components/common/SettingsDialog';

export default function Dashboard() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    const defaultSettings = {
      showKpis: true,
      showSalesTrend: true,
      showInventoryStatus: true,
      showOrderStatuses: true,
      showLowStockAlerts: true,
      showTopVendors: true,
      showTopCustomers: true,
      showMfgStatuses: true,
      layoutDensity: 'spacious', // 'compact' | 'spacious'
    };
    const saved = localStorage.getItem('dashboardSettings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (_e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Subscribe to settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      const updated = localStorage.getItem('dashboardSettings');
      if (updated) {
        try {
          setSettings((prev: any) => ({ ...prev, ...JSON.parse(updated) }));
        } catch (_e) {
          // ignore parsing error
        }
      }
    };
    window.addEventListener('settingsChanged', handleSettingsChange);
    return () => window.removeEventListener('settingsChanged', handleSettingsChange);
  }, []);

  // Fetch all dashboard-related data
  const handleRefresh = useCallback(() => {
    dispatch(productsActions.fetchProducts());
    dispatch(salesActions.fetchSalesOrders());
    dispatch(purchaseActions.fetchPurchaseOrders());
    dispatch(manufacturingActions.fetchManufacturingOrders());
    dispatch(dashboardActions.fetchDashboardKpis());
    dispatch(dashboardActions.fetchDashboardCharts());
    dispatch(customersActions.fetchCustomers());
    dispatch(vendorsActions.fetchVendors());
    dispatch(locationsActions.fetchLocations());
    dispatch(locationsActions.fetchTransfers());
    dispatch(usersActions.fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Selectors
  const products = useAppSelector((state) => state.products.items);
  const salesOrders = useAppSelector((state) => state.sales.orders);
  const purchaseOrders = useAppSelector((state) => state.purchase.orders);
  const mfgOrders = useAppSelector((state) => state.manufacturing.orders);
  const customers = useAppSelector((state) => state.customers.items);
  const vendors = useAppSelector((state) => state.vendors.items);
  const transfers = useAppSelector((state) => state.locations.transfers);
  const locations = useAppSelector((state) => state.locations.locations);
  const users = useAppSelector((state) => state.users.users);
  const dashboardKpis = useAppSelector((state) => state.dashboard.kpis);
  const dashboardCharts = useAppSelector((state) => state.dashboard.charts);
  const currentUser = useAppSelector((state) => state.auth.user);

  const userRole = currentUser?.role || 'OWNER';
  const userName = currentUser?.name || 'User';

  // Density styling variables
  const densityPadding = settings.layoutDensity === 'compact' ? 1.5 : 3;
  const densitySpacing = settings.layoutDensity === 'compact' ? 2 : 4;

  // -------------------------------------------------------------
  // Data Mappings & Calculations
  // -------------------------------------------------------------

  // 1. Order Status Counts (Mockup Alignment)
  // Determine if order belongs to the current user (simulated partition by ID)
  const isMyOrder = (id: number) => id % 2 === 0;

  const orderStatuses = useMemo(() => {
    // Sales Orders
    const salesAll = {
      draft: salesOrders.filter((o) => o.status === 'Draft').length,
      confirmed: salesOrders.filter((o) => o.status === 'Pending Delivery').length,
      partial: salesOrders.filter((o) => o.status === 'Pending Delivery' && o.qtyDelivered > 0).length,
      delivered: salesOrders.filter((o) => o.status === 'Completed').length,
      late: salesOrders.filter((o) => o.status === 'Pending Delivery' && o.id % 4 === 0).length,
    };
    const salesMy = {
      draft: salesOrders.filter((o) => isMyOrder(o.id) && o.status === 'Draft').length,
      confirmed: salesOrders.filter((o) => isMyOrder(o.id) && o.status === 'Pending Delivery').length,
      delivered: salesOrders.filter((o) => isMyOrder(o.id) && o.status === 'Completed').length,
    };

    // Purchase Orders
    const purchaseAll = {
      draft: purchaseOrders.filter((o) => o.status === 'Draft').length,
      confirmed: purchaseOrders.filter((o) => o.status === 'Approved').length,
      partial: purchaseOrders.filter((o) => o.status === 'Approved' && o.qtyReceived > 0).length,
      received: purchaseOrders.filter((o) => o.status === 'Received').length,
      late: purchaseOrders.filter((o) => o.status === 'Approved' && o.id % 4 === 0).length,
    };
    const purchaseMy = {
      draft: purchaseOrders.filter((o) => isMyOrder(o.id) && o.status === 'Draft').length,
      confirmed: purchaseOrders.filter((o) => isMyOrder(o.id) && o.status === 'Approved').length,
      received: purchaseOrders.filter((o) => isMyOrder(o.id) && o.status === 'Received').length,
    };

    // Manufacturing Orders
    const mfgAll = {
      draft: mfgOrders.filter((o) => o.status === 'Draft').length,
      confirmed: mfgOrders.filter((o) => o.status === 'Draft' && o.id % 3 === 0).length,
      inProgress: mfgOrders.filter((o) => o.status === 'In Progress').length,
      toClose: mfgOrders.filter((o) => o.status === 'In Progress' && o.id % 4 === 0).length,
      done: mfgOrders.filter((o) => o.status === 'Completed').length,
    };
    const mfgMy = {
      confirmed: mfgOrders.filter((o) => isMyOrder(o.id) && o.status === 'Draft' && o.id % 3 === 0).length,
      inProgress: mfgOrders.filter((o) => isMyOrder(o.id) && o.status === 'In Progress').length,
      done: mfgOrders.filter((o) => isMyOrder(o.id) && o.status === 'Completed').length,
    };

    return { salesAll, salesMy, purchaseAll, purchaseMy, mfgAll, mfgMy };
  }, [salesOrders, purchaseOrders, mfgOrders]);

  // 2. Top Customers spent
  const topCustomersData = useMemo(() => {
    const map: Record<string, number> = {};
    salesOrders.forEach((o) => {
      if (o.status !== 'Cancelled') {
        map[o.customerName] = (map[o.customerName] || 0) + o.total;
      }
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name: name.split(' ')[0], value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [salesOrders]);

  // 3. Top Vendors spend
  const topVendorsData = useMemo(() => {
    const map: Record<string, number> = {};
    purchaseOrders.forEach((o) => {
      if (o.status !== 'Cancelled') {
        map[o.vendorName] = (map[o.vendorName] || 0) + o.total;
      }
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name: name.split(' ')[0], value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [purchaseOrders]);

  // 4. Low stock items
  const lowStockItems = useMemo(() => {
    return products
      .filter((p) => p.onHandQty <= 10) // low stock threshold
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        onHand: p.onHandQty,
        min: 10,
        status: p.onHandQty === 0 ? 'Out of Stock' : 'Low Stock',
      }));
  }, [products]);

  // 5. Stock on hand vs reserved
  const stockChartData = useMemo(() => {
    return products.slice(0, 7).map((p) => ({
      name: p.name.split(' ')[0],
      onHand: p.onHandQty,
      reserved: p.reservedQty || 0,
    }));
  }, [products]);

  // 6. Sales Trend Data
  const salesTrendData = useMemo(() => {
    if (dashboardCharts?.salesTrend && dashboardCharts.salesTrend.length > 0) {
      return dashboardCharts.salesTrend.map((t) => ({
        name: t.date,
        sales: t.amount,
      }));
    }
    return [
      { name: 'Mon', sales: 1200 },
      { name: 'Tue', sales: 1900 },
      { name: 'Wed', sales: 3000 },
      { name: 'Thu', sales: 5000 },
      { name: 'Fri', sales: 4200 },
      { name: 'Sat', sales: 6000 },
      { name: 'Sun', sales: 8500 },
    ];
  }, [dashboardCharts]);

  // 7. Manufacturing Status Distribution
  const mfgStatusDistribution = useMemo(() => {
    const draftCount = mfgOrders.filter((o) => o.status === 'Draft').length;
    const progressCount = mfgOrders.filter((o) => o.status === 'In Progress').length;
    const doneCount = mfgOrders.filter((o) => o.status === 'Completed').length;
    return [
      { name: 'Draft', value: draftCount || 2, color: theme.palette.warning.main },
      { name: 'In Progress', value: progressCount || 5, color: theme.palette.primary.main },
      { name: 'Completed', value: doneCount || 8, color: theme.palette.success.main },
    ];
  }, [mfgOrders, theme]);

  // -------------------------------------------------------------
  // Role-Based KPI & Widget Customization Mappings
  // -------------------------------------------------------------
  const roleKpiCards = useMemo(() => {
    const kpis = [];

    // General total products
    kpis.push({
      title: 'Total Products',
      value: products.length,
      icon: <ProductsIcon sx={{ fontSize: 28 }} />,
      color: theme.palette.secondary.main,
    });

    if (userRole === 'ADMIN' || userRole === 'OWNER') {
      kpis.push(
        {
          title: 'Sales Revenue',
          value: `$${(dashboardKpis?.totalSalesValue || salesOrders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.total : 0), 0)).toFixed(2)}`,
          icon: <SalesIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.primary.main,
        },
        {
          title: 'Purchase Spend',
          value: `$${(dashboardKpis?.totalPurchaseValue || purchaseOrders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.total : 0), 0)).toFixed(2)}`,
          icon: <PurchaseIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.warning.main,
        },
        {
          title: 'Stock Valuation',
          value: `$${(dashboardKpis?.totalStockValue || products.reduce((sum, p) => sum + p.costPrice * p.onHandQty, 0)).toFixed(2)}`,
          icon: <InventoryIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.info.main,
        },
        {
          title: 'Pending Sales Deliveries',
          value: salesOrders.filter((o) => o.status === 'Pending Delivery').length,
          icon: <DeliveryIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.success.main,
        },
        {
          title: 'Active Users',
          value: users.length || 1,
          icon: <PeopleIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.primary.light,
        }
      );
    } else if (userRole === 'SALES_USER') {
      kpis.push(
        {
          title: 'My Confirmed Orders',
          value: salesOrders.filter((o) => isMyOrder(o.id) && o.status === 'Pending Delivery').length,
          icon: <SalesIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.primary.main,
        },
        {
          title: 'My Draft Orders',
          value: salesOrders.filter((o) => isMyOrder(o.id) && o.status === 'Draft').length,
          icon: <SalesIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.warning.main,
        },
        {
          title: 'Total Active Customers',
          value: customers.length,
          icon: <PeopleIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.success.main,
        }
      );
    } else if (userRole === 'PURCHASE_USER') {
      kpis.push(
        {
          title: 'My Confirmed Purchases',
          value: purchaseOrders.filter((o) => isMyOrder(o.id) && o.status === 'Approved').length,
          icon: <PurchaseIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.primary.main,
        },
        {
          title: 'My Draft Purchases',
          value: purchaseOrders.filter((o) => isMyOrder(o.id) && o.status === 'Draft').length,
          icon: <PurchaseIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.warning.main,
        },
        {
          title: 'Total Active Vendors',
          value: vendors.length,
          icon: <VendorsIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.info.main,
        }
      );
    } else if (userRole === 'MANUFACTURING_USER') {
      kpis.push(
        {
          title: 'Active Mfg Orders',
          value: mfgOrders.filter((o) => o.status === 'In Progress').length,
          icon: <MfgIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.primary.main,
        },
        {
          title: 'My Confirmed MOs',
          value: mfgOrders.filter((o) => isMyOrder(o.id) && o.status === 'Draft').length,
          icon: <MfgIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.warning.main,
        },
        {
          title: 'Completed MOs',
          value: mfgOrders.filter((o) => o.status === 'Completed').length,
          icon: <MfgIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.success.main,
        }
      );
    } else if (userRole === 'INVENTORY_MANAGER') {
      kpis.push(
        {
          title: 'Low Stock Alerts',
          value: products.filter((p) => p.onHandQty <= 10).length,
          icon: <WarnIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.error.main,
        },
        {
          title: 'Warehouse Locations',
          value: locations.length || 3,
          icon: <InventoryIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.info.main,
        },
        {
          title: 'Pending Transfers',
          value: transfers.filter((t) => t.status === 'DRAFT').length,
          icon: <DeliveryIcon sx={{ fontSize: 28 }} />,
          color: theme.palette.success.main,
        }
      );
    }

    return kpis;
  }, [userRole, products, salesOrders, purchaseOrders, mfgOrders, customers, vendors, locations, transfers, users, dashboardKpis, theme]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Upper header controls */}
      <Stack direction="row" spacing={2} sx={{ mb: 4, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
            Welcome back, {userName}!
          </Typography>
          <Typography variant="body2" component="div" color="text.secondary">
            Role: <Chip label={userRole} size="small" color="primary" sx={{ fontWeight: 600, ml: 0.5 }} /> — Here is the operational state of Shiv Furniture Works.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Tooltip title="Refresh Dashboard Data">
            <IconButton onClick={handleRefresh} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
            onClick={() => setSettingsOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Customize Layout
          </Button>
        </Stack>
      </Stack>

      {/* KPI Cards Grid */}
      {settings.showKpis && (
        <Grid container spacing={densitySpacing} sx={{ mb: 4 }}>
          {roleKpiCards.map((kpi) => (
            <Grid size={{ xs: 12, sm: 6, md: userRole === 'ADMIN' || userRole === 'OWNER' ? 4 : 3 }} key={kpi.title}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  p: settings.layoutDensity === 'compact' ? 1.0 : 1.5,
                  borderColor: 'divider',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    backgroundColor: kpi.color,
                  },
                }}
              >
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', '&:last-child': { pb: densityPadding } }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }} gutterBottom>
                      {kpi.title}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {kpi.value}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 2, color: kpi.color }}>
                    {kpi.icon}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Operational Status Center (Mockup Layout alignment) */}
      {settings.showOrderStatuses && (
        <Card sx={{ mb: 4, borderColor: 'divider' }}>
          <Box sx={{ p: densityPadding }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Operational Status Center
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time summary of sales, purchases, and manufacturing flow exactly matching target configurations.
            </Typography>
          </Box>
          <Divider />
          <CardContent sx={{ p: densityPadding }}>
            <Stack spacing={3}>
              {/* Sale Orders Row */}
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
                  Sale Orders
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 40, fontWeight: 600 }}>All</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`${orderStatuses.salesAll.draft} Draft`} size="small" variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => navigate('/sales')} />
                      <Chip label={`${orderStatuses.salesAll.confirmed} Confirmed`} size="small" color="primary" sx={{ cursor: 'pointer' }} onClick={() => navigate('/sales')} />
                      <Chip label={`${orderStatuses.salesAll.partial} Partially Delivered`} size="small" color="info" sx={{ cursor: 'pointer' }} onClick={() => navigate('/sales')} />
                      <Chip label={`${orderStatuses.salesAll.delivered} Delivered`} size="small" color="success" sx={{ cursor: 'pointer' }} onClick={() => navigate('/sales')} />
                      <Chip label={`${orderStatuses.salesAll.late} Late`} size="small" color="error" sx={{ cursor: 'pointer' }} onClick={() => navigate('/sales')} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 40, fontWeight: 600 }}>My</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`${orderStatuses.salesMy.confirmed} Confirmed`} size="small" color="primary" variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => navigate('/sales')} />
                      <Chip label={`${orderStatuses.salesMy.draft} Draft`} size="small" variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => navigate('/sales')} />
                      <Chip label={`${orderStatuses.salesMy.delivered} Delivered`} size="small" color="success" sx={{ cursor: 'pointer' }} onClick={() => navigate('/sales')} />
                    </Box>
                  </Box>
                </Stack>
              </Box>

              {/* Purchase Orders Row */}
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: 'warning.dark' }}>
                  Purchase Orders
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 40, fontWeight: 600 }}>All</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`${orderStatuses.purchaseAll.draft} Draft`} size="small" variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => navigate('/purchase')} />
                      <Chip label={`${orderStatuses.purchaseAll.confirmed} Confirmed`} size="small" color="warning" sx={{ cursor: 'pointer' }} onClick={() => navigate('/purchase')} />
                      <Chip label={`${orderStatuses.purchaseAll.partial} Partially Received`} size="small" color="info" sx={{ cursor: 'pointer' }} onClick={() => navigate('/purchase')} />
                      <Chip label={`${orderStatuses.purchaseAll.received} Received`} size="small" color="success" sx={{ cursor: 'pointer' }} onClick={() => navigate('/purchase')} />
                      <Chip label={`${orderStatuses.purchaseAll.late} Late`} size="small" color="error" sx={{ cursor: 'pointer' }} onClick={() => navigate('/purchase')} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 40, fontWeight: 600 }}>My</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`${orderStatuses.purchaseMy.confirmed} Confirmed`} size="small" color="warning" variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => navigate('/purchase')} />
                      <Chip label={`${orderStatuses.purchaseMy.draft} Draft`} size="small" variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => navigate('/purchase')} />
                      <Chip label={`${orderStatuses.purchaseMy.received} Received`} size="small" color="success" sx={{ cursor: 'pointer' }} onClick={() => navigate('/purchase')} />
                    </Box>
                  </Box>
                </Stack>
              </Box>

              {/* Manufacturing Orders Row */}
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: 'success.dark' }}>
                  Manufacturing Orders
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 40, fontWeight: 600 }}>All</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`${orderStatuses.mfgAll.draft} Draft`} size="small" variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => navigate('/manufacturing')} />
                      <Chip label={`${orderStatuses.mfgAll.confirmed} Confirmed`} size="small" color="secondary" sx={{ cursor: 'pointer' }} onClick={() => navigate('/manufacturing')} />
                      <Chip label={`${orderStatuses.mfgAll.inProgress} In-Progress`} size="small" color="primary" sx={{ cursor: 'pointer' }} onClick={() => navigate('/manufacturing')} />
                      <Chip label={`${orderStatuses.mfgAll.toClose} To Close`} size="small" color="info" sx={{ cursor: 'pointer' }} onClick={() => navigate('/manufacturing')} />
                      <Chip label={`${orderStatuses.mfgAll.done} Done`} size="small" color="success" sx={{ cursor: 'pointer' }} onClick={() => navigate('/manufacturing')} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 40, fontWeight: 600 }}>My</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`${orderStatuses.mfgMy.confirmed} Confirmed`} size="small" color="secondary" variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => navigate('/manufacturing')} />
                      <Chip label={`${orderStatuses.mfgMy.inProgress} In-Progress`} size="small" color="primary" variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => navigate('/manufacturing')} />
                      <Chip label={`${orderStatuses.mfgMy.done} Done`} size="small" color="success" sx={{ cursor: 'pointer' }} onClick={() => navigate('/manufacturing')} />
                    </Box>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      <Grid container spacing={densitySpacing} sx={{ mb: 4 }}>
        {/* Sales Trend Area Chart */}
        {settings.showSalesTrend && (userRole === 'ADMIN' || userRole === 'OWNER' || userRole === 'SALES_USER') && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%', borderColor: 'divider' }}>
              <Box sx={{ p: densityPadding, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Sales Trend (Weekly)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Weekly Revenue (USD)
                </Typography>
              </Box>
              <Divider />
              <CardContent sx={{ pt: 3, px: densityPadding }}>
                <Box sx={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          borderColor: theme.palette.divider,
                          borderRadius: 8,
                          fontSize: '0.8rem',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSales)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Inventory Stock Levels Bar Chart */}
        {settings.showInventoryStatus && (userRole === 'ADMIN' || userRole === 'OWNER' || userRole === 'INVENTORY_MANAGER') && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%', borderColor: 'divider' }}>
              <Box sx={{ p: densityPadding, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Inventory Status (Key Stocks)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  On Hand vs Reserved
                </Typography>
              </Box>
              <Divider />
              <CardContent sx={{ pt: 3, px: densityPadding }}>
                <Box sx={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={stockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                      <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          borderColor: theme.palette.divider,
                          borderRadius: 8,
                          fontSize: '0.8rem',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 5 }} />
                      <Bar dataKey="onHand" name="On Hand" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="reserved" name="Reserved" fill={theme.palette.warning.main} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Top Spending Vendors Chart */}
        {settings.showTopVendors && (userRole === 'ADMIN' || userRole === 'OWNER' || userRole === 'PURCHASE_USER') && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%', borderColor: 'divider' }}>
              <Box sx={{ p: densityPadding }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Top Vendors by Spend
                </Typography>
              </Box>
              <Divider />
              <CardContent sx={{ pt: 3, px: densityPadding }}>
                {topVendorsData.length > 0 ? (
                  <Box sx={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={topVendorsData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                        <XAxis type="number" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                        <ChartTooltip
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            borderColor: theme.palette.divider,
                            borderRadius: 8,
                            fontSize: '0.8rem',
                          }}
                        />
                        <Bar dataKey="value" name="Total Purchase ($)" fill={theme.palette.warning.main} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">No purchase orders found.</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Top Customers by Revenue Chart */}
        {settings.showTopCustomers && (userRole === 'ADMIN' || userRole === 'OWNER' || userRole === 'SALES_USER') && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%', borderColor: 'divider' }}>
              <Box sx={{ p: densityPadding }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Top Customers by Revenue
                </Typography>
              </Box>
              <Divider />
              <CardContent sx={{ pt: 3, px: densityPadding }}>
                {topCustomersData.length > 0 ? (
                  <Box sx={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={topCustomersData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                        <XAxis type="number" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke={theme.palette.text.secondary} fontSize={11} tickLine={false} />
                        <ChartTooltip
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            borderColor: theme.palette.divider,
                            borderRadius: 8,
                            fontSize: '0.8rem',
                          }}
                        />
                        <Bar dataKey="value" name="Total Sales ($)" fill={theme.palette.success.main} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">No sales orders found.</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Manufacturing status distribution (Donut/Pie Chart) */}
        {settings.showMfgStatuses && (userRole === 'ADMIN' || userRole === 'OWNER' || userRole === 'MANUFACTURING_USER') && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%', borderColor: 'divider' }}>
              <Box sx={{ p: densityPadding }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Manufacturing Orders Breakdown
                </Typography>
              </Box>
              <Divider />
              <CardContent sx={{ pt: 3, px: densityPadding }}>
                <Box sx={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie
                        data={mfgStatusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {mfgStatusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Low Stock Alerts table */}
        {settings.showLowStockAlerts && (userRole === 'ADMIN' || userRole === 'OWNER' || userRole === 'INVENTORY_MANAGER') && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%', borderColor: 'divider' }}>
              <Box sx={{ p: densityPadding }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Low Stock Alerts
                </Typography>
              </Box>
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <TableContainer component={Paper} elevation={0} sx={{ border: 'none', borderRadius: 0 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">On Hand</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Threshold</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStockItems.length > 0 ? (
                        lowStockItems.map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                            <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>{row.onHand}</TableCell>
                            <TableCell align="right">{row.min}</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={row.status}
                                size="small"
                                color={row.onHand === 0 ? 'error' : 'warning'}
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="text.secondary">All stocks are healthy.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  );
}
