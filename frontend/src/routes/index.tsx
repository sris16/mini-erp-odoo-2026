import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LinearProgress } from '@mui/material';
import MainLayout from '../layouts/MainLayout';

const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Products = lazy(() => import('../pages/Products'));
const Customers = lazy(() => import('../pages/Customers'));
const Vendors = lazy(() => import('../pages/Vendors'));
const Inventory = lazy(() => import('../pages/Inventory'));
const Sales = lazy(() => import('../pages/Sales'));
const Purchase = lazy(() => import('../pages/Purchase'));
const BoM = lazy(() => import('../pages/BoM'));
const Manufacturing = lazy(() => import('../pages/Manufacturing'));
const AuditLogs = lazy(() => import('../pages/AuditLogs'));
const Invoicing = lazy(() => import('../pages/Invoicing'));
const Users = lazy(() => import('../pages/Users'));

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || '';
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

interface AppRoutesProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function AppRoutes({ darkMode, toggleDarkMode }: AppRoutesProps) {
  return (
    <Suspense fallback={<LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }} />}>
      <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes inside MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        
        <Route 
          path="customers" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'SALES_USER', 'INVENTORY_MANAGER']}>
              <Customers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="vendors" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'PURCHASE_USER', 'INVENTORY_MANAGER']}>
              <Vendors />
            </ProtectedRoute>
          } 
        />
        <Route path="inventory" element={<Inventory />} />
        <Route 
          path="sales" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'SALES_USER', 'INVENTORY_MANAGER']}>
              <Sales />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="purchase" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'PURCHASE_USER', 'INVENTORY_MANAGER']}>
              <Purchase />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="bom" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANUFACTURING_USER', 'INVENTORY_MANAGER']}>
              <BoM />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="manufacturing" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANUFACTURING_USER', 'INVENTORY_MANAGER']}>
              <Manufacturing />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="invoicing" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'SALES_USER', 'PURCHASE_USER']}>
              <Invoicing />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="audit-logs" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
              <AuditLogs />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="users" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'OWNER']}>
              <Users />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
