import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  useTheme,
} from '@mui/material';
import {
  ShoppingBag as ProductsIcon,
  TrendingUp as SalesIcon,
  ReceiptLong as PurchaseIcon,
  PrecisionManufacturing as MfgIcon,
  LocalShipping as DeliveryIcon,
  Inventory as InventoryIcon,
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
} from 'recharts';
import { useEffect } from 'react';
import {
  useAppSelector,
  useAppDispatch,
  productsActions,
  salesActions,
  purchaseActions,
  manufacturingActions,
  dashboardActions,
} from '../../store';

export default function Dashboard() {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(productsActions.fetchProducts());
    dispatch(salesActions.fetchSalesOrders());
    dispatch(purchaseActions.fetchPurchaseOrders());
    dispatch(manufacturingActions.fetchManufacturingOrders());
    dispatch(dashboardActions.fetchDashboardKpis());
    dispatch(dashboardActions.fetchDashboardCharts());
  }, [dispatch]);

  // Dynamic Redux state counts
  const products = useAppSelector((state) => state.products.items);
  const salesOrders = useAppSelector((state) => state.sales.orders);
  const mfgOrders = useAppSelector((state) => state.manufacturing.orders);
  const dashboardKpis = useAppSelector((state) => state.dashboard.kpis);
  const dashboardCharts = useAppSelector((state) => state.dashboard.charts);
  
  const totalProductsCount = products.length;
  const mfgCount = mfgOrders.length;

  // Calculate pending deliveries (sales orders with Pending Delivery status)
  const pendingDeliveriesCount = salesOrders.filter((o) => o.status === 'Pending Delivery').length;

  // Map product stock levels for bar chart using dynamic reservedQty
  const stockChartData = products.map((p) => ({
    name: p.name.split(' ')[0], // Short name
    onHand: p.onHandQty,
    reserved: p.reservedQty || 0,
  }));

  // Dynamic sales trend mapped to Recharts format
  const salesTrendData = dashboardCharts?.salesTrend && dashboardCharts.salesTrend.length > 0
    ? dashboardCharts.salesTrend.map((t) => ({
        name: t.date,
        sales: t.amount,
      }))
    : [
        { name: 'Mon', sales: 0 },
        { name: 'Tue', sales: 0 },
        { name: 'Wed', sales: 0 },
        { name: 'Thu', sales: 0 },
        { name: 'Fri', sales: 0 },
        { name: 'Sat', sales: 0 },
        { name: 'Sun', sales: 0 },
      ];

  const kpis = [
    {
      title: 'Total Products',
      value: dashboardKpis?.totalProducts ?? totalProductsCount,
      icon: <ProductsIcon sx={{ fontSize: 32, color: theme.palette.secondary.main }} />,
      color: theme.palette.secondary.main,
    },
    {
      title: 'Sales Revenue',
      value: dashboardKpis !== null ? `$${dashboardKpis.totalSalesValue.toFixed(2)}` : `$${(0).toFixed(2)}`,
      icon: <SalesIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Purchase Spend',
      value: dashboardKpis !== null ? `$${dashboardKpis.totalPurchaseValue.toFixed(2)}` : `$${(0).toFixed(2)}`,
      icon: <PurchaseIcon sx={{ fontSize: 32, color: theme.palette.warning.main }} />,
      color: theme.palette.warning.main,
    },
    {
      title: 'Stock Valuation',
      value: dashboardKpis !== null ? `$${dashboardKpis.totalStockValue.toFixed(2)}` : `$${(0).toFixed(2)}`,
      icon: <InventoryIcon sx={{ fontSize: 32, color: theme.palette.info.main }} />,
      color: theme.palette.info.main,
    },
    {
      title: 'Pending Sales Orders',
      value: dashboardKpis?.pendingSalesOrders ?? pendingDeliveriesCount,
      icon: <DeliveryIcon sx={{ fontSize: 32, color: theme.palette.success.main }} />,
      color: theme.palette.success.main,
    },
    {
      title: 'Pending Mfg Orders',
      value: dashboardKpis?.pendingManufacturingOrders ?? mfgCount,
      icon: <MfgIcon sx={{ fontSize: 32, color: theme.palette.primary.light }} />,
      color: theme.palette.primary.light,
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
        Dashboard Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Overview of Shiv Furniture Works operational flow and key performance indicators.
      </Typography>

      {/* KPI Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((kpi) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={kpi.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                p: 1.5,
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
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', '&:last-child': { pb: 2 } }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }} gutterBottom>
                    {kpi.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {kpi.value}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 2 }}>
                  {kpi.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={4}>
        {/* Sales Trend Area Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%', borderColor: 'divider' }}>
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Sales Trend (Weekly)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Weekly Revenue (USD)
              </Typography>
            </Box>
            <Divider />
            <CardContent sx={{ pt: 3 }}>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={12} tickLine={false} />
                    <YAxis stroke={theme.palette.text.secondary} fontSize={12} tickLine={false} />
                    <ChartTooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderColor: theme.palette.divider,
                        borderRadius: 8,
                        fontSize: '0.875rem',
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

        {/* Inventory Status Bar Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%', borderColor: 'divider' }}>
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Inventory Status (Key Stocks)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                On Hand vs Reserved
              </Typography>
            </Box>
            <Divider />
            <CardContent sx={{ pt: 3 }}>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={stockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} fontSize={12} tickLine={false} />
                    <YAxis stroke={theme.palette.text.secondary} fontSize={12} tickLine={false} />
                    <ChartTooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderColor: theme.palette.divider,
                        borderRadius: 8,
                        fontSize: '0.875rem',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="onHand" name="On Hand" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="reserved" name="Reserved" fill={theme.palette.warning.main} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
