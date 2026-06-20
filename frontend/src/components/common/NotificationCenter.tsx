import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
} from '@mui/material';
import { Notifications as NotificationsIcon, Circle } from '@mui/icons-material';

interface ERPNotification {
  id: number;
  message: string;
  module: string;
  time: string;
  unread: boolean;
}

export default function NotificationCenter() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<ERPNotification[]>([
    { id: 1, message: 'Stock alert: Legs (Oak Wood) is below minimum level (4 units on hand)', module: 'Inventory', time: '10m ago', unread: true },
    { id: 2, message: 'New Sales Order SO-003 created for customer John Doe', module: 'Sales', time: '1h ago', unread: true },
    { id: 3, message: 'Manufacturing Order MO-102 completed for 5x Wooden Table', module: 'Manufacturing', time: '3h ago', unread: false },
    { id: 4, message: 'Audit warning: System configuration modified by Admin', module: 'Audit Logs', time: '1d ago', unread: false },
  ]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const open = Boolean(anchorEl);
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 320, mt: 1.5, borderRadius: 2 },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllRead} sx={{ fontSize: '0.75rem' }}>
              Mark all as read
            </Button>
          )}
        </Box>
        <Divider />
        <List sx={{ p: 0, maxHeight: 300, overflowY: 'auto' }}>
          {notifications.map((n) => (
            <React.Fragment key={n.id}>
              <ListItem
                sx={{
                  bgcolor: n.unread ? 'action.hover' : 'inherit',
                  py: 1.5,
                  alignItems: 'flex-start',
                }}
              >
                <Circle
                  color={n.unread ? 'primary' : 'disabled'}
                  sx={{ width: 8, height: 8, mt: 1, mr: 1.5, flexShrink: 0 }}
                />
                <ListItemText
                  primary={n.message}
                  secondary={`${n.module} • ${n.time}`}
                  primaryTypographyProps={{ fontSize: '0.8125rem', color: 'text.primary', fontWeight: n.unread ? 500 : 400 }}
                  secondaryTypographyProps={{ fontSize: '0.75rem', mt: 0.5 }}
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Popover>
    </>
  );
}
