import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Products from '../pages/Products';
import Customers from '../pages/Customers';
import Vendors from '../pages/Vendors';
import Inventory from '../pages/Inventory';
import Sales from '../pages/Sales';
import Purchase from '../pages/Purchase';
import BoM from '../pages/BoM';
import Manufacturing from '../pages/Manufacturing';
import AuditLogs from '../pages/AuditLogs';
import Invoicing from '../pages/Invoicing';

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
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
