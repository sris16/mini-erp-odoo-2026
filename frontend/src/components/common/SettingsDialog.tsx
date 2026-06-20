import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  FormatSize as SizeIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [dashboardSettings, setDashboardSettings] = useState({
    showKpis: true,
    showSalesTrend: true,
    showInventoryStatus: true,
    showOrderStatuses: true,
    showLowStockAlerts: true,
    showTopVendors: true,
    showTopCustomers: true,
    showMfgStatuses: true,
    layoutDensity: 'spacious', // 'compact' | 'spacious'
  });

  useEffect(() => {
    if (open) {
      const savedSize = (localStorage.getItem('fontSize') as 'small' | 'medium' | 'large') || 'medium';
      setFontSize(savedSize);

      const savedDash = localStorage.getItem('dashboardSettings');
      if (savedDash) {
        setDashboardSettings((prev) => ({ ...prev, ...JSON.parse(savedDash) }));
      }
    }
  }, [open]);

  const handleFontSizeChange = (_event: React.MouseEvent<HTMLElement>, newSize: 'small' | 'medium' | 'large' | null) => {
    if (newSize) {
      setFontSize(newSize);
    }
  };

  const handleToggleWidget = (key: keyof typeof dashboardSettings) => {
    setDashboardSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDensityChange = (_event: React.MouseEvent<HTMLElement>, newDensity: string | null) => {
    if (newDensity) {
      setDashboardSettings((prev) => ({
        ...prev,
        layoutDensity: newDensity,
      }));
    }
  };

  const handleSave = () => {
    // Save font size
    localStorage.setItem('fontSize', fontSize);
    document.documentElement.className = ''; // Reset classes
    document.documentElement.classList.add(`font-${fontSize}`);

    // Save dashboard settings
    localStorage.setItem('dashboardSettings', JSON.stringify(dashboardSettings));

    // Dispatch global event so that other components can listen and re-render
    window.dispatchEvent(new Event('settingsChanged'));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
        <SettingsIcon color="primary" />
        System & Dashboard Settings
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={4}>
          {/* Appearance Section */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SizeIcon fontSize="small" color="action" />
              Font Size Customization
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Adjust the overall text scaling of Shiv ERP. This resizes all UI labels, cards, and tables proportionately.
            </Typography>
            <ToggleButtonGroup
              value={fontSize}
              exclusive
              onChange={handleFontSizeChange}
              fullWidth
              size="medium"
              color="primary"
            >
              <ToggleButton value="small" aria-label="small font">
                <Stack>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Small (13px)</Typography>
                  <Typography variant="caption" color="text.secondary">Crisp & condensed</Typography>
                </Stack>
              </ToggleButton>
              <ToggleButton value="medium" aria-label="medium font">
                <Stack>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Medium (16px)</Typography>
                  <Typography variant="caption" color="text.secondary">Default balance</Typography>
                </Stack>
              </ToggleButton>
              <ToggleButton value="large" aria-label="large font">
                <Stack>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Large (19px)</Typography>
                  <Typography variant="caption" color="text.secondary">High visibility</Typography>
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Divider />

          {/* Dashboard Section */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <DashboardIcon fontSize="small" color="action" />
              Dashboard Layout & Widgets
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select which metrics, charts, and tables you want to display on your dashboard.
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dashboardSettings.showKpis}
                      onChange={() => handleToggleWidget('showKpis')}
                      color="primary"
                    />
                  }
                  label="KPI Analytics Cards"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dashboardSettings.showOrderStatuses}
                      onChange={() => handleToggleWidget('showOrderStatuses')}
                      color="primary"
                    />
                  }
                  label="Order Status Badges"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dashboardSettings.showSalesTrend}
                      onChange={() => handleToggleWidget('showSalesTrend')}
                      color="primary"
                    />
                  }
                  label="Sales Trend Area Chart"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dashboardSettings.showInventoryStatus}
                      onChange={() => handleToggleWidget('showInventoryStatus')}
                      color="primary"
                    />
                  }
                  label="Inventory Stock Bar Chart"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dashboardSettings.showTopCustomers}
                      onChange={() => handleToggleWidget('showTopCustomers')}
                      color="primary"
                    />
                  }
                  label="Top Customers Bar Chart"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dashboardSettings.showTopVendors}
                      onChange={() => handleToggleWidget('showTopVendors')}
                      color="primary"
                    />
                  }
                  label="Top Spending Vendors Chart"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dashboardSettings.showMfgStatuses}
                      onChange={() => handleToggleWidget('showMfgStatuses')}
                      color="primary"
                    />
                  }
                  label="Manufacturing Order States"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dashboardSettings.showLowStockAlerts}
                      onChange={() => handleToggleWidget('showLowStockAlerts')}
                      color="primary"
                    />
                  }
                  label="Low Stock Alerts Table"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Layout Spacing Density
              </Typography>
              <ToggleButtonGroup
                value={dashboardSettings.layoutDensity}
                exclusive
                onChange={handleDensityChange}
                size="small"
                color="primary"
              >
                <ToggleButton value="compact">Compact (Dense Grid)</ToggleButton>
                <ToggleButton value="spacious">Spacious (Comfortable Grid)</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
}
