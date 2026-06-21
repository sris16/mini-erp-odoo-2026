import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import axios from 'axios';

// ================= TYPES & INTERFACES =================

export interface Product {
  id: number;
  name: string;
  sku: string;
  costPrice: number;
  salesPrice: number;
  onHandQty: number;
  reservedQty: number;
  procurementStrategy: string; // MTO, MTS
  procurementType: string; // Manufactured, Purchased
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Vendor {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface StockItem {
  productId: number;
  productName: string;
  onHand: number;
  reserved: number;
  available: number;
}

export interface StockLedgerEntry {
  id: number;
  date: string;
  productName: string;
  movementType: string; // IN, OUT
  quantity: number;
  reference: string;
}

export interface SalesOrderLine {
  productId: number;
  productName: string;
  qtyOrdered: number;
  qtyDelivered: number;
  unitPrice: number;
}

export interface SalesOrder {
  id: number;
  soNumber: string;
  customerName: string;
  productId: number;
  productName: string;
  quantity: number;
  qtyDelivered: number;
  status: string; // Draft, Pending Delivery, Completed, Cancelled
  total: number;
  lines?: SalesOrderLine[];
}

export interface PurchaseOrderLine {
  productId: number;
  productName: string;
  qtyOrdered: number;
  qtyReceived: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  vendorName: string;
  productId: number;
  productName: string;
  quantity: number;
  qtyReceived: number;
  status: string; // Draft, Approved, Received, Cancelled
  total: number;
  lines?: PurchaseOrderLine[];
}

export interface BoMItem {
  id: number;
  finishedProduct: string;
  components: { name: string; qty: number }[];
}

export interface WorkOrder {
  id: number;
  workCenterName: string;
  sequence: number;
  qtyToProduce: number;
  status: 'READY' | 'IN_PROGRESS' | 'DONE';
  durationMinutes: number;
  laborCostPerHour?: number;
  overheadCostPerHour?: number;
}

export interface ManufacturingOrder {
  id: number;
  moNumber: string;
  productName: string;
  quantity: number;
  status: 'Draft' | 'In Progress' | 'Completed';
  workOrders?: WorkOrder[];
}

export interface AuditLog {
  id: number;
  user: string;
  action: string;
  module: string;
  date: string;
}

export interface InvoiceLine {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  product?: {
    name: string;
  };
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  salesOrderId?: number;
  customerName: string;
  status: string; // DRAFT, POSTED, PAID, CANCELLED
  issueDate: string;
  totalAmount: number;
  amountPaid: number;
  lines: InvoiceLine[];
}

export interface VendorBillLine {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  product?: {
    name: string;
  };
}

export interface VendorBill {
  id: number;
  billNumber: string;
  purchaseOrderId?: number;
  vendorName: string;
  status: string; // DRAFT, POSTED, PAID, CANCELLED
  issueDate: string;
  totalAmount: number;
  amountPaid: number;
  lines: VendorBillLine[];
}

export interface WarehouseLocation {
  id: number;
  name: string;
  code: string;
}

export interface LocationStock {
  id: number;
  product: Product;
  location: WarehouseLocation;
  onHandQty: number;
  reservedQty: number;
}

export interface StockTransfer {
  id: number;
  transferNumber: string;
  product: Product;
  qty: number;
  sourceLocation: WarehouseLocation;
  destinationLocation: WarehouseLocation;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  createdDate: string;
  completedDate?: string;
}

export interface ReorderingRule {
  id: number;
  productId: number;
  productName: string;
  minQty: number;
  maxQty: number;
  lastTriggered?: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
}

export interface ApiReorderingRule {
  id: number;
  product: {
    id: number;
    name: string;
  };
  minQty: number;
  maxQty: number;
  lastTriggered?: string;
}

export interface ApiProduct {
  id: number;
  name: string;
  sku: string;
  costPrice: number;
  salesPrice: number;
  onHandQty: number;
  reservedQty?: number;
  procurementStrategy: string;
  procurementType: string;
}

export interface ApiStockProduct {
  id: number;
  name: string;
  onHandQty: number;
  reservedQty: number;
}

export interface ApiLedgerEntry {
  id: number;
  timestamp: string;
  product?: {
    name: string;
  };
  type: string;
  qtyChanged: number;
  sourceDocument: string;
}

export interface ApiAuditLog {
  id: number;
  username: string;
  details: string;
  action: string;
  timestamp: string;
}

export interface ApiSalesOrderLine {
  productId: number;
  qtyOrdered: number;
  qtyDelivered?: number;
  unitPrice: number;
  product?: {
    name: string;
  };
}

export interface ApiSalesOrder {
  id: number;
  customerName: string;
  status: string;
  lines: ApiSalesOrderLine[];
}

export interface ApiPurchaseOrderLine {
  productId: number;
  qtyOrdered: number;
  qtyReceived?: number;
  unitPrice: number;
  product?: {
    name: string;
  };
}

export interface ApiPurchaseOrder {
  id: number;
  vendorName: string;
  status: string;
  lines: ApiPurchaseOrderLine[];
}

export interface ApiInvoiceLine {
  id: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  product?: {
    name: string;
  };
}

export interface ApiInvoice {
  id: number;
  invoiceNumber?: string;
  salesOrderId?: number;
  customerName: string;
  status: string;
  issueDate: string;
  totalAmount: number;
  amountPaid: number;
  lines: ApiInvoiceLine[];
}

export interface ApiVendorBillLine {
  id: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  product?: {
    name: string;
  };
}

export interface ApiVendorBill {
  id: number;
  billNumber?: string;
  purchaseOrderId?: number;
  vendorName: string;
  status: string;
  issueDate: string;
  totalAmount: number;
  amountPaid: number;
  lines: ApiVendorBillLine[];
}

export interface ApiLocationStock {
  id: number;
  product: ApiProduct;
  location: WarehouseLocation;
  onHandQty: number;
  reservedQty: number;
}

export interface ApiStockTransfer {
  id: number;
  transferNumber: string;
  product: ApiProduct;
  qty: number;
  sourceLocation: WarehouseLocation;
  destinationLocation: WarehouseLocation;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  createdDate: string;
  completedDate?: string;
}

export interface ApiBoMItem {
  id: number;
  finishedProductName: string;
  components: { name: string; qty: number }[];
}

export interface ApiWorkOrder {
  id: number;
  workCenter?: {
    name: string;
    laborCostPerHour?: number;
    overheadCostPerHour?: number;
  };
  sequence: number;
  qtyToProduce: number;
  status: 'READY' | 'IN_PROGRESS' | 'DONE';
  durationMinutes?: number;
}

export interface ApiManufacturingOrder {
  id: number;
  status: string;
  workOrders?: ApiWorkOrder[];
  finishedProduct?: {
    name: string;
  };
  qty: number;
}

// ================= ASYNC THUNKS =================

// Auth
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data; // { token: "..." }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.message || 'Login failed');
      }
      return rejectWithValue('Login failed');
    }
  }
);

// Products
export const fetchProducts = createAsyncThunk('products/fetch', async () => {
  const response = await api.get('/products');
  return response.data;
});

export const addProduct = createAsyncThunk('products/add', async (product: Omit<Product, 'id'>) => {
  const payload = {
    ...product,
    procurementType: product.procurementType === 'Manufactured' ? 'MANUFACTURING' : 'PURCHASE',
  };
  const response = await api.post('/products', payload);
  return response.data;
});

export const editProduct = createAsyncThunk('products/edit', async (product: Product) => {
  const payload = {
    ...product,
    procurementType: product.procurementType === 'Manufactured' ? 'MANUFACTURING' : 'PURCHASE',
  };
  const response = await api.put(`/products/${product.id}`, payload);
  return response.data;
});

export const deleteProduct = createAsyncThunk('products/delete', async (id: number) => {
  await api.delete(`/products/${id}`);
  return id;
});

// Customers
export const fetchCustomers = createAsyncThunk('customers/fetch', async () => {
  const response = await api.get('/customers');
  return response.data;
});

export const addCustomer = createAsyncThunk('customers/add', async (customer: Omit<Customer, 'id'>) => {
  const response = await api.post('/customers', customer);
  return response.data;
});

export const editCustomer = createAsyncThunk('customers/edit', async (customer: Customer) => {
  const response = await api.put(`/customers/${customer.id}`, customer);
  return response.data;
});

export const deleteCustomer = createAsyncThunk('customers/delete', async (id: number) => {
  await api.delete(`/customers/${id}`);
  return id;
});

// Vendors
export const fetchVendors = createAsyncThunk('vendors/fetch', async () => {
  const response = await api.get('/vendors');
  return response.data;
});

export const addVendor = createAsyncThunk('vendors/add', async (vendor: Omit<Vendor, 'id'>) => {
  const response = await api.post('/vendors', vendor);
  return response.data;
});

export const editVendor = createAsyncThunk('vendors/edit', async (vendor: Vendor) => {
  const response = await api.put(`/vendors/${vendor.id}`, vendor);
  return response.data;
});

export const deleteVendor = createAsyncThunk('vendors/delete', async (id: number) => {
  await api.delete(`/vendors/${id}`);
  return id;
});

// Sales Orders
export const fetchSalesOrders = createAsyncThunk('sales/fetch', async () => {
  const response = await api.get('/sales');
  return response.data;
});

export const addSalesOrder = createAsyncThunk(
  'sales/add',
  async (order: { customerName: string; lines: { productId: number; qtyOrdered: number; unitPrice: number }[] }) => {
    const payload = {
      customerName: order.customerName,
      status: 'DRAFT',
      lines: order.lines,
    };
    const response = await api.post('/sales', payload);
    return response.data;
  }
);

export const confirmSalesOrder = createAsyncThunk('sales/confirm', async (id: number) => {
  const response = await api.post(`/sales/${id}/confirm`);
  return response.data;
});

export const deliverSalesOrder = createAsyncThunk(
  'sales/deliver',
  async ({ id, partials }: { id: number; partials?: { productId: number; qtyToDeliver: number }[] }) => {
    const response = await api.post(`/sales/${id}/deliver`, partials);
    return response.data;
  }
);

export const cancelSalesOrder = createAsyncThunk('sales/cancel', async (id: number) => {
  const response = await api.post(`/sales/${id}/cancel`);
  return response.data;
});

// Purchase Orders
export const fetchPurchaseOrders = createAsyncThunk('purchase/fetch', async () => {
  const response = await api.get('/purchase');
  return response.data;
});

export const addPurchaseOrder = createAsyncThunk(
  'purchase/add',
  async (order: { vendorName: string; lines: { productId: number; qtyOrdered: number; unitPrice: number }[] }) => {
    const payload = {
      vendorName: order.vendorName,
      status: 'DRAFT',
      lines: order.lines,
    };
    const response = await api.post('/purchase', payload);
    return response.data;
  }
);

export const confirmPurchaseOrder = createAsyncThunk('purchase/confirm', async (id: number) => {
  const response = await api.post(`/purchase/${id}/confirm`);
  return response.data;
});

export const receivePurchaseOrder = createAsyncThunk(
  'purchase/receive',
  async ({ id, partials }: { id: number; partials?: { productId: number; qtyToReceive: number }[] }) => {
    const response = await api.post(`/purchase/${id}/receive`, partials);
    return response.data;
  }
);

export const cancelPurchaseOrder = createAsyncThunk('purchase/cancel', async (id: number) => {
  const response = await api.post(`/purchase/${id}/cancel`);
  return response.data;
});

// Bills of Materials
export const fetchBoms = createAsyncThunk('bom/fetch', async () => {
  const response = await api.get('/bom');
  return response.data;
});

export const addBoM = createAsyncThunk('bom/add', async (bom: Omit<BoMItem, 'id'>) => {
  const response = await api.post('/bom', {
    finishedProductName: bom.finishedProduct,
    components: bom.components,
  });
  return response.data;
});

export const deleteBoM = createAsyncThunk('bom/delete', async (id: number) => {
  await api.delete(`/bom/${id}`);
  return id;
});

// Manufacturing Orders
export const fetchManufacturingOrders = createAsyncThunk('manufacturing/fetch', async () => {
  const response = await api.get('/manufacturing');
  return response.data;
});

export const addManufacturingOrder = createAsyncThunk(
  'manufacturing/add',
  async (order: { productName: string; quantity: number }, { getState }) => {
    const state = getState() as RootState;
    const product = state.products.items.find((p) => p.name === order.productName);
    if (!product) throw new Error('Product not found in store catalog');

    const payload = {
      finishedProduct: { id: product.id },
      qty: order.quantity,
      status: 'DRAFT',
    };
    const response = await api.post('/manufacturing', payload);
    return response.data;
  }
);

export const confirmManufacturingOrder = createAsyncThunk('manufacturing/confirm', async (id: number) => {
  const response = await api.post(`/manufacturing/${id}/confirm`);
  return response.data;
});

export const completeManufacturingOrder = createAsyncThunk('manufacturing/complete', async (id: number) => {
  const response = await api.post(`/manufacturing/${id}/complete`);
  return response.data;
});

export const startWorkOrder = createAsyncThunk(
  'manufacturing/startWork',
  async ({ moId, woId }: { moId: number; woId: number }) => {
    const response = await api.post(`/manufacturing/workorders/${woId}/start`);
    return { moId, workOrder: response.data };
  }
);

export const completeWorkOrder = createAsyncThunk(
  'manufacturing/completeWork',
  async ({ moId, woId }: { moId: number; woId: number }) => {
    const response = await api.post(`/manufacturing/workorders/${woId}/complete`);
    return { moId, workOrder: response.data };
  }
);

// Inventory Stock & Ledger
export const fetchStockAndLedger = createAsyncThunk('inventory/fetchStockAndLedger', async () => {
  const [stockRes, ledgerRes] = await Promise.all([
    api.get('/products'),
    api.get('/products/ledger'),
  ]);
  return { stock: stockRes.data, ledger: ledgerRes.data };
});

// Audit Logs
export const fetchAuditLogs = createAsyncThunk('auditLogs/fetch', async () => {
  const response = await api.get('/audit-logs');
  return response.data;
});

// Reordering Rules
export const fetchReorderingRules = createAsyncThunk('reorderingRules/fetch', async () => {
  const response = await api.get('/reordering-rules');
  return response.data;
});

export const addReorderingRule = createAsyncThunk(
  'reorderingRules/add',
  async (rule: { productId: number; minQty: number; maxQty: number }) => {
    const response = await api.post('/reordering-rules', rule);
    return response.data;
  }
);

export const editReorderingRule = createAsyncThunk(
  'reorderingRules/edit',
  async (rule: { id: number; minQty: number; maxQty: number }) => {
    const response = await api.put(`/reordering-rules/${rule.id}`, {
      minQty: rule.minQty,
      maxQty: rule.maxQty,
    });
    return response.data;
  }
);

export const deleteReorderingRule = createAsyncThunk('reorderingRules/delete', async (id: number) => {
  await api.delete(`/reordering-rules/${id}`);
  return id;
});

export const runReorderingScheduler = createAsyncThunk('reorderingRules/run', async () => {
  const response = await api.post('/reordering-rules/run');
  return response.data;
});

// Invoices Thunks
export const fetchInvoices = createAsyncThunk('invoices/fetchAll', async () => {
  const response = await api.get('/invoices');
  return response.data;
});

export const createInvoiceFromSO = createAsyncThunk('invoices/createFromSO', async (soId: number) => {
  const response = await api.post(`/invoices/from-so/${soId}`);
  return response.data;
});

export const postInvoice = createAsyncThunk('invoices/post', async (id: number) => {
  const response = await api.post(`/invoices/${id}/post`);
  return response.data;
});

export const payInvoice = createAsyncThunk('invoices/pay', async ({ id, amount }: { id: number; amount: number }) => {
  const response = await api.post(`/invoices/${id}/pay`, { amount });
  return response.data;
});

// Bills Thunks
export const fetchBills = createAsyncThunk('bills/fetchAll', async () => {
  const response = await api.get('/bills');
  return response.data;
});

export const createBillFromPO = createAsyncThunk('bills/createFromPO', async (poId: number) => {
  const response = await api.post(`/bills/from-po/${poId}`);
  return response.data;
});

export const postBill = createAsyncThunk('bills/post', async (id: number) => {
  const response = await api.post(`/bills/${id}/post`);
  return response.data;
});

export const payBill = createAsyncThunk('bills/pay', async ({ id, amount }: { id: number; amount: number }) => {
  const response = await api.post(`/bills/${id}/pay`, { amount });
  return response.data;
});

// Locations & Transfers Thunks
export const fetchLocations = createAsyncThunk('locations/fetchAll', async () => {
  const response = await api.get('/locations');
  return response.data;
});

export const fetchLocationStocks = createAsyncThunk('locations/fetchStock', async () => {
  const response = await api.get('/locations/stock');
  return response.data;
});

export const fetchTransfers = createAsyncThunk('locations/fetchTransfers', async () => {
  const response = await api.get('/transfers');
  return response.data;
});

export const createTransfer = createAsyncThunk(
  'locations/createTransfer',
  async (transfer: { productId: number; qty: number; sourceLocationId: number; destinationLocationId: number }) => {
    const payload = {
      product: { id: transfer.productId },
      qty: transfer.qty,
      sourceLocation: { id: transfer.sourceLocationId },
      destinationLocation: { id: transfer.destinationLocationId },
    };
    const response = await api.post('/transfers', payload);
    return response.data;
  }
);

export const completeTransfer = createAsyncThunk('locations/completeTransfer', async (id: number) => {
  const response = await api.post(`/transfers/${id}/complete`);
  return response.data;
});

// User Management Thunks
export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  const response = await api.get('/users');
  return response.data;
});

export const addUser = createAsyncThunk('users/addUser', async (user: Omit<User, 'id'> & { password?: string }) => {
  const response = await api.post('/users', user);
  return response.data;
});

export const editUser = createAsyncThunk('users/editUser', async (user: { id: number; username: string; password?: string; role: string }) => {
  const response = await api.put(`/users/${user.id}`, user);
  return response.data;
});

export const deleteUser = createAsyncThunk('users/deleteUser', async (id: number) => {
  await api.delete(`/users/${id}`);
  return id;
});

// ================= SLICES =================

// Auth Slice
interface AuthState {
  token: string | null;
  user: { name: string; role: string } | null;
}
const initialAuthState: AuthState = {
  token: localStorage.getItem('token'),
  user: localStorage.getItem('token') ? {
    name: localStorage.getItem('username') || 'Admin User',
    role: localStorage.getItem('role') || 'OWNER'
  } : null,
};
const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      state.token = action.payload.token;
      state.user = {
        name: action.payload.username || 'Admin User',
        role: action.payload.role || 'OWNER'
      };
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('username', action.payload.username || 'Admin User');
      localStorage.setItem('role', action.payload.role || 'OWNER');
    });
  },
});

// Products Slice
interface ProductsState {
  items: Product[];
}
const productsSlice = createSlice({
  name: 'products',
  initialState: { items: [] } as ProductsState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchProducts.fulfilled, (state, action) => {
      state.items = (action.payload as ApiProduct[]).map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        costPrice: p.costPrice,
        salesPrice: p.salesPrice,
        onHandQty: p.onHandQty,
        reservedQty: p.reservedQty || 0,
        procurementStrategy: p.procurementStrategy,
        procurementType: p.procurementType === 'MANUFACTURING' ? 'Manufactured' : 'Purchased',
      }));
    });
    builder.addCase(addProduct.fulfilled, (state, action) => {
      const p = action.payload;
      state.items.unshift({
        id: p.id,
        name: p.name,
        sku: p.sku,
        costPrice: p.costPrice,
        salesPrice: p.salesPrice,
        onHandQty: p.onHandQty,
        reservedQty: p.reservedQty || 0,
        procurementStrategy: p.procurementStrategy,
        procurementType: p.procurementType === 'MANUFACTURING' ? 'Manufactured' : 'Purchased',
      });
    });
    builder.addCase(editProduct.fulfilled, (state, action) => {
      const p = action.payload;
      const index = state.items.findIndex((item) => item.id === p.id);
      if (index !== -1) {
        state.items[index] = {
          id: p.id,
          name: p.name,
          sku: p.sku,
          costPrice: p.costPrice,
          salesPrice: p.salesPrice,
          onHandQty: p.onHandQty,
          reservedQty: p.reservedQty || 0,
          procurementStrategy: p.procurementStrategy,
          procurementType: p.procurementType === 'MANUFACTURING' ? 'Manufactured' : 'Purchased',
        };
      }
    });
    builder.addCase(deleteProduct.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    });
  },
});

// Customers Slice
interface CustomersState {
  items: Customer[];
}
const customersSlice = createSlice({
  name: 'customers',
  initialState: { items: [] } as CustomersState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCustomers.fulfilled, (state, action) => {
      state.items = action.payload;
    });
    builder.addCase(addCustomer.fulfilled, (state, action) => {
      state.items.unshift(action.payload);
    });
    builder.addCase(editCustomer.fulfilled, (state, action) => {
      const c = action.payload;
      const index = state.items.findIndex((item) => item.id === c.id);
      if (index !== -1) {
        state.items[index] = c;
      }
    });
    builder.addCase(deleteCustomer.fulfilled, (state, action) => {
      state.items = state.items.filter((c) => c.id !== action.payload);
    });
  },
});

// Vendors Slice
interface VendorsState {
  items: Vendor[];
}
const vendorsSlice = createSlice({
  name: 'vendors',
  initialState: { items: [] } as VendorsState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchVendors.fulfilled, (state, action) => {
      state.items = action.payload;
    });
    builder.addCase(addVendor.fulfilled, (state, action) => {
      state.items.unshift(action.payload);
    });
    builder.addCase(editVendor.fulfilled, (state, action) => {
      const v = action.payload;
      const index = state.items.findIndex((item) => item.id === v.id);
      if (index !== -1) {
        state.items[index] = v;
      }
    });
    builder.addCase(deleteVendor.fulfilled, (state, action) => {
      state.items = state.items.filter((v) => v.id !== action.payload);
    });
  },
});

// Sales Slice
interface SalesState {
  orders: SalesOrder[];
}
const mapSalesOrder = (so: ApiSalesOrder): SalesOrder => {
  const totalVal = so.lines.reduce((sum: number, l: ApiSalesOrderLine) => sum + l.unitPrice * l.qtyOrdered, 0);
  let statusText = 'Draft';
  if (so.status === 'CONFIRMED') statusText = 'Pending Delivery';
  else if (so.status === 'FULLY_DELIVERED') statusText = 'Completed';
  else if (so.status === 'PARTIALLY_DELIVERED') statusText = 'Pending Delivery';
  else if (so.status === 'CANCELLED') statusText = 'Cancelled';

  const lines = (so.lines || []).map((l: ApiSalesOrderLine) => ({
    productId: l.productId,
    productName: l.product?.name || 'N/A',
    qtyOrdered: l.qtyOrdered,
    qtyDelivered: l.qtyDelivered || 0,
    unitPrice: l.unitPrice,
  }));

  const firstLine = lines[0];
  const totalQty = lines.reduce((sum, l) => sum + l.qtyOrdered, 0);
  const totalDelivered = lines.reduce((sum, l) => sum + l.qtyDelivered, 0);
  const summaryName = lines.length > 1 ? `${firstLine?.productName} (+${lines.length - 1} more)` : (firstLine?.productName || 'N/A');

  return {
    id: so.id,
    soNumber: 'SO-00' + so.id,
    customerName: so.customerName,
    productId: firstLine?.productId || 0,
    productName: summaryName,
    quantity: totalQty,
    qtyDelivered: totalDelivered,
    status: statusText,
    total: totalVal,
    lines,
  };
};

const salesSlice = createSlice({
  name: 'sales',
  initialState: { orders: [] } as SalesState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchSalesOrders.fulfilled, (state, action) => {
      state.orders = action.payload.map(mapSalesOrder);
    });
    builder.addCase(addSalesOrder.fulfilled, (state, action) => {
      state.orders.unshift(mapSalesOrder(action.payload));
    });
    builder.addCase(confirmSalesOrder.fulfilled, (state, action) => {
      const updated = mapSalesOrder(action.payload);
      const idx = state.orders.findIndex((o) => o.id === updated.id);
      if (idx !== -1) state.orders[idx] = updated;
    });
    builder.addCase(deliverSalesOrder.fulfilled, (state, action) => {
      const updated = mapSalesOrder(action.payload);
      const idx = state.orders.findIndex((o) => o.id === updated.id);
      if (idx !== -1) state.orders[idx] = updated;
    });
    builder.addCase(cancelSalesOrder.fulfilled, (state, action) => {
      const updated = mapSalesOrder(action.payload);
      const idx = state.orders.findIndex((o) => o.id === updated.id);
      if (idx !== -1) state.orders[idx] = updated;
    });
  },
});

// Purchase Slice
interface PurchaseState {
  orders: PurchaseOrder[];
}
const mapPurchaseOrder = (po: ApiPurchaseOrder): PurchaseOrder => {
  const totalVal = po.lines.reduce((sum: number, l: ApiPurchaseOrderLine) => sum + l.unitPrice * l.qtyOrdered, 0);
  let statusText = 'Draft';
  if (po.status === 'CONFIRMED' || po.status === 'PARTIALLY_RECEIVED') statusText = 'Approved';
  else if (po.status === 'FULLY_RECEIVED') statusText = 'Received';
  else if (po.status === 'CANCELLED') statusText = 'Cancelled';

  const lines = (po.lines || []).map((l: ApiPurchaseOrderLine) => ({
    productId: l.productId,
    productName: l.product?.name || 'N/A',
    qtyOrdered: l.qtyOrdered,
    qtyReceived: l.qtyReceived || 0,
    unitPrice: l.unitPrice,
  }));

  const firstLine = lines[0];
  const totalQty = lines.reduce((sum, l) => sum + l.qtyOrdered, 0);
  const totalReceived = lines.reduce((sum, l) => sum + l.qtyReceived, 0);
  const summaryName = lines.length > 1 ? `${firstLine?.productName} (+${lines.length - 1} more)` : (firstLine?.productName || 'N/A');

  return {
    id: po.id,
    poNumber: 'PO-00' + po.id,
    vendorName: po.vendorName,
    productId: firstLine?.productId || 0,
    productName: summaryName,
    quantity: totalQty,
    qtyReceived: totalReceived,
    status: statusText,
    total: totalVal,
    lines,
  };
};

const purchaseSlice = createSlice({
  name: 'purchase',
  initialState: { orders: [] } as PurchaseState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
      state.orders = action.payload.map(mapPurchaseOrder);
    });
    builder.addCase(addPurchaseOrder.fulfilled, (state, action) => {
      state.orders.unshift(mapPurchaseOrder(action.payload));
    });
    builder.addCase(confirmPurchaseOrder.fulfilled, (state, action) => {
      const updated = mapPurchaseOrder(action.payload);
      const idx = state.orders.findIndex((o) => o.id === updated.id);
      if (idx !== -1) state.orders[idx] = updated;
    });
    builder.addCase(receivePurchaseOrder.fulfilled, (state, action) => {
      const updated = mapPurchaseOrder(action.payload);
      const idx = state.orders.findIndex((o) => o.id === updated.id);
      if (idx !== -1) state.orders[idx] = updated;
    });
    builder.addCase(cancelPurchaseOrder.fulfilled, (state, action) => {
      const updated = mapPurchaseOrder(action.payload);
      const idx = state.orders.findIndex((o) => o.id === updated.id);
      if (idx !== -1) state.orders[idx] = updated;
    });
  },
});

// BoM Slice
interface BoMState {
  items: BoMItem[];
}
const bomSlice = createSlice({
  name: 'bom',
  initialState: { items: [] } as BoMState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchBoms.fulfilled, (state, action) => {
      state.items = (action.payload as ApiBoMItem[]).map((b) => ({
        id: b.id,
        finishedProduct: b.finishedProductName,
        components: b.components,
      }));
    });
    builder.addCase(addBoM.fulfilled, (state, action) => {
      const b = action.payload;
      state.items.push({
        id: b.id,
        finishedProduct: b.finishedProductName,
        components: b.components,
      });
    });
    builder.addCase(deleteBoM.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    });
  },
});

// Manufacturing Slice
interface ManufacturingState {
  orders: ManufacturingOrder[];
}
const mapManufacturingOrder = (mo: ApiManufacturingOrder): ManufacturingOrder => {
  let statusText: 'Draft' | 'In Progress' | 'Completed' = 'Draft';
  if (mo.status === 'CONFIRMED' || mo.status === 'IN_PROGRESS') statusText = 'In Progress';
  else if (mo.status === 'DONE') statusText = 'Completed';

  const mappedWos = (mo.workOrders || []).map((wo: ApiWorkOrder) => ({
    id: wo.id,
    workCenterName: wo.workCenter?.name || 'Unknown Center',
    sequence: wo.sequence,
    qtyToProduce: wo.qtyToProduce,
    status: wo.status,
    durationMinutes: wo.durationMinutes || 0,
    laborCostPerHour: wo.workCenter?.laborCostPerHour || 0,
    overheadCostPerHour: wo.workCenter?.overheadCostPerHour || 0,
  }));

  return {
    id: mo.id,
    moNumber: 'MO-10' + mo.id,
    productName: mo.finishedProduct?.name || 'N/A',
    quantity: mo.qty || 0,
    status: statusText,
    workOrders: mappedWos,
  };
};

const manufacturingSlice = createSlice({
  name: 'manufacturing',
  initialState: { orders: [] } as ManufacturingState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchManufacturingOrders.fulfilled, (state, action) => {
      state.orders = action.payload.map(mapManufacturingOrder);
    });
    builder.addCase(addManufacturingOrder.fulfilled, (state, action) => {
      state.orders.unshift(mapManufacturingOrder(action.payload));
    });
    builder.addCase(confirmManufacturingOrder.fulfilled, (state, action) => {
      const updated = mapManufacturingOrder(action.payload);
      const idx = state.orders.findIndex((o) => o.id === updated.id);
      if (idx !== -1) state.orders[idx] = updated;
    });
    builder.addCase(completeManufacturingOrder.fulfilled, (state, action) => {
      const updated = mapManufacturingOrder(action.payload);
      const idx = state.orders.findIndex((o) => o.id === updated.id);
      if (idx !== -1) state.orders[idx] = updated;
    });
    builder.addCase(startWorkOrder.fulfilled, (state, action) => {
      const { moId, workOrder } = action.payload;
      const order = state.orders.find((o) => o.id === moId);
      if (order && order.workOrders) {
        const woIdx = order.workOrders.findIndex((w) => w.id === workOrder.id);
        if (woIdx !== -1) {
          order.workOrders[woIdx].status = workOrder.status;
        }
      }
    });
    builder.addCase(completeWorkOrder.fulfilled, (state, action) => {
      const { moId, workOrder } = action.payload;
      const order = state.orders.find((o) => o.id === moId);
      if (order && order.workOrders) {
        const woIdx = order.workOrders.findIndex((w) => w.id === workOrder.id);
        if (woIdx !== -1) {
          order.workOrders[woIdx].status = workOrder.status;
        }
      }
    });
  },
});

// Inventory Slice
interface InventoryState {
  stock: StockItem[];
  ledger: StockLedgerEntry[];
}
const inventorySlice = createSlice({
  name: 'inventory',
  initialState: { stock: [], ledger: [] } as InventoryState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchStockAndLedger.fulfilled, (state, action) => {
      state.stock = (action.payload.stock as ApiStockProduct[]).map((p) => ({
        productId: p.id,
        productName: p.name,
        onHand: p.onHandQty,
        reserved: p.reservedQty,
        available: p.onHandQty - p.reservedQty,
      }));
      state.ledger = (action.payload.ledger as ApiLedgerEntry[]).map((l) => ({
        id: l.id,
        date: l.timestamp.replace('T', ' ').substring(0, 16),
        productName: l.product?.name || 'N/A',
        movementType: l.type === 'IN' ? 'IN' : 'OUT',
        quantity: l.qtyChanged,
        reference: l.sourceDocument,
      }));
    });
  },
});

// Audit Logs Slice
interface AuditLogsState {
  logs: AuditLog[];
}
const auditLogsSlice = createSlice({
  name: 'auditLogs',
  initialState: { logs: [] } as AuditLogsState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchAuditLogs.fulfilled, (state, action) => {
      state.logs = (action.payload as ApiAuditLog[]).map((log) => ({
        id: log.id,
        user: log.username,
        action: log.details,
        module: log.action,
        date: log.timestamp.replace('T', ' ').substring(0, 16),
      }));
    });
  },
});

// Reordering Rules Slice
interface ReorderingRulesState {
  items: ReorderingRule[];
  loading: boolean;
}
const reorderingRulesSlice = createSlice({
  name: 'reorderingRules',
  initialState: { items: [], loading: false } as ReorderingRulesState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchReorderingRules.fulfilled, (state, action) => {
      state.items = (action.payload as ApiReorderingRule[]).map((r) => ({
        id: r.id,
        productId: r.product.id,
        productName: r.product.name,
        minQty: r.minQty,
        maxQty: r.maxQty,
        lastTriggered: r.lastTriggered ? r.lastTriggered.replace('T', ' ').substring(0, 16) : undefined,
      }));
    });
    builder.addCase(addReorderingRule.fulfilled, (state, action) => {
      const r = action.payload as ApiReorderingRule;
      state.items.unshift({
        id: r.id,
        productId: r.product.id,
        productName: r.product.name,
        minQty: r.minQty,
        maxQty: r.maxQty,
        lastTriggered: r.lastTriggered ? r.lastTriggered.replace('T', ' ').substring(0, 16) : undefined,
      });
    });
    builder.addCase(editReorderingRule.fulfilled, (state, action) => {
      const r = action.payload as ApiReorderingRule;
      const idx = state.items.findIndex((item) => item.id === r.id);
      if (idx !== -1) {
        state.items[idx] = {
          id: r.id,
          productId: r.product.id,
          productName: r.product.name,
          minQty: r.minQty,
          maxQty: r.maxQty,
          lastTriggered: r.lastTriggered ? r.lastTriggered.replace('T', ' ').substring(0, 16) : undefined,
        };
      }
    });
    builder.addCase(deleteReorderingRule.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    });
  },
});

// Invoices Slice
interface InvoicesState {
  items: Invoice[];
  loading: boolean;
}
const invoicesSlice = createSlice({
  name: 'invoices',
  initialState: { items: [], loading: false } as InvoicesState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchInvoices.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchInvoices.fulfilled, (state, action) => {
      state.loading = false;
      state.items = (action.payload as ApiInvoice[]).map((inv) => ({
        ...inv,
        invoiceNumber: inv.invoiceNumber || `INV-00${inv.id}`,
        lines: inv.lines.map((l) => ({
          ...l,
          productName: l.product?.name || l.productName || 'N/A',
        })),
      }));
    });
    builder.addCase(fetchInvoices.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(createInvoiceFromSO.fulfilled, (state, action) => {
      const inv = action.payload as ApiInvoice;
      state.items.unshift({
        ...inv,
        invoiceNumber: inv.invoiceNumber || `INV-00${inv.id}`,
        lines: inv.lines.map((l) => ({
          ...l,
          productName: l.product?.name || l.productName || 'N/A',
        })),
      });
    });
    builder.addCase(postInvoice.fulfilled, (state, action) => {
      const updated = action.payload as ApiInvoice;
      const idx = state.items.findIndex((i) => i.id === updated.id);
      if (idx !== -1) {
        state.items[idx] = {
          ...updated,
          invoiceNumber: updated.invoiceNumber || `INV-00${updated.id}`,
          lines: updated.lines.map((l) => ({
            ...l,
            productName: l.product?.name || l.productName || 'N/A',
          })),
        };
      }
    });
    builder.addCase(payInvoice.fulfilled, (state, action) => {
      const updated = action.payload as ApiInvoice;
      const idx = state.items.findIndex((i) => i.id === updated.id);
      if (idx !== -1) {
        state.items[idx] = {
          ...updated,
          invoiceNumber: updated.invoiceNumber || `INV-00${updated.id}`,
          lines: updated.lines.map((l) => ({
            ...l,
            productName: l.product?.name || l.productName || 'N/A',
          })),
        };
      }
    });
  },
});

// Bills Slice
interface BillsState {
  items: VendorBill[];
  loading: boolean;
}
const billsSlice = createSlice({
  name: 'bills',
  initialState: { items: [], loading: false } as BillsState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchBills.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchBills.fulfilled, (state, action) => {
      state.loading = false;
      state.items = (action.payload as ApiVendorBill[]).map((bill) => ({
        ...bill,
        billNumber: bill.billNumber || `BILL-00${bill.id}`,
        lines: bill.lines.map((l) => ({
          ...l,
          productName: l.product?.name || l.productName || 'N/A',
        })),
      }));
    });
    builder.addCase(fetchBills.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(createBillFromPO.fulfilled, (state, action) => {
      const bill = action.payload as ApiVendorBill;
      state.items.unshift({
        ...bill,
        billNumber: bill.billNumber || `BILL-00${bill.id}`,
        lines: bill.lines.map((l) => ({
          ...l,
          productName: l.product?.name || l.productName || 'N/A',
        })),
      });
    });
    builder.addCase(postBill.fulfilled, (state, action) => {
      const updated = action.payload as ApiVendorBill;
      const idx = state.items.findIndex((i) => i.id === updated.id);
      if (idx !== -1) {
        state.items[idx] = {
          ...updated,
          billNumber: updated.billNumber || `BILL-00${updated.id}`,
          lines: updated.lines.map((l) => ({
            ...l,
            productName: l.product?.name || l.productName || 'N/A',
          })),
        };
      }
    });
    builder.addCase(payBill.fulfilled, (state, action) => {
      const updated = action.payload as ApiVendorBill;
      const idx = state.items.findIndex((i) => i.id === updated.id);
      if (idx !== -1) {
        state.items[idx] = {
          ...updated,
          billNumber: updated.billNumber || `BILL-00${updated.id}`,
          lines: updated.lines.map((l) => ({
            ...l,
            productName: l.product?.name || l.productName || 'N/A',
          })),
        };
      }
    });
  },
});

// Dashboard Thunks
export const fetchDashboardKpis = createAsyncThunk('dashboard/fetchKpis', async () => {
  const response = await api.get('/dashboard/kpis');
  return response.data;
});

export const fetchDashboardCharts = createAsyncThunk('dashboard/fetchCharts', async () => {
  const response = await api.get('/dashboard/charts');
  return response.data;
});

// Dashboard Slice
interface DashboardState {
  kpis: {
    totalSalesValue: number;
    totalPurchaseValue: number;
    pendingSalesOrders: number;
    pendingManufacturingOrders: number;
    totalProducts: number;
    totalStockValue: number;
  } | null;
  charts: {
    salesTrend: { date: string; amount: number }[];
    topProducts: { productName: string; quantityOrdered: number }[];
  } | null;
  loading: boolean;
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { kpis: null, charts: null, loading: false } as DashboardState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchDashboardKpis.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchDashboardKpis.fulfilled, (state, action) => {
      state.loading = false;
      state.kpis = action.payload;
    });
    builder.addCase(fetchDashboardKpis.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(fetchDashboardCharts.fulfilled, (state, action) => {
      state.charts = action.payload;
    });
  },
});

// Locations Slice
interface LocationsState {
  locations: WarehouseLocation[];
  stocks: LocationStock[];
  transfers: StockTransfer[];
  loading: boolean;
}
const initialLocationsState: LocationsState = {
  locations: [],
  stocks: [],
  transfers: [],
  loading: false,
};
const locationsSlice = createSlice({
  name: 'locations',
  initialState: initialLocationsState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchLocations.fulfilled, (state, action) => {
      state.locations = action.payload;
    });
    builder.addCase(fetchLocationStocks.fulfilled, (state, action) => {
      state.stocks = (action.payload as ApiLocationStock[]).map((s) => ({
        id: s.id,
        product: {
          id: s.product.id,
          name: s.product.name,
          sku: s.product.sku,
          costPrice: s.product.costPrice,
          salesPrice: s.product.salesPrice,
          onHandQty: s.product.onHandQty,
          reservedQty: s.product.reservedQty || 0,
          procurementStrategy: s.product.procurementStrategy,
          procurementType: s.product.procurementType === 'MANUFACTURING' ? 'Manufactured' : 'Purchased',
        },
        location: s.location,
        onHandQty: s.onHandQty,
        reservedQty: s.reservedQty,
      }));
    });
    builder.addCase(fetchTransfers.fulfilled, (state, action) => {
      state.transfers = (action.payload as ApiStockTransfer[]).map((t) => ({
        id: t.id,
        transferNumber: t.transferNumber,
        product: {
          id: t.product.id,
          name: t.product.name,
          sku: t.product.sku,
          costPrice: t.product.costPrice,
          salesPrice: t.product.salesPrice,
          onHandQty: t.product.onHandQty,
          reservedQty: t.product.reservedQty || 0,
          procurementStrategy: t.product.procurementStrategy,
          procurementType: t.product.procurementType === 'MANUFACTURING' ? 'Manufactured' : 'Purchased',
        },
        qty: t.qty,
        sourceLocation: t.sourceLocation,
        destinationLocation: t.destinationLocation,
        status: t.status,
        createdDate: t.createdDate.replace('T', ' ').substring(0, 16),
        completedDate: t.completedDate ? t.completedDate.replace('T', ' ').substring(0, 16) : undefined,
      }));
    });
    builder.addCase(createTransfer.fulfilled, (state, action) => {
      const t = action.payload;
      state.transfers.unshift({
        id: t.id,
        transferNumber: t.transferNumber,
        product: {
          id: t.product.id,
          name: t.product.name,
          sku: t.product.sku,
          costPrice: t.product.costPrice,
          salesPrice: t.product.salesPrice,
          onHandQty: t.product.onHandQty,
          reservedQty: t.product.reservedQty,
          procurementStrategy: t.product.procurementStrategy,
          procurementType: t.product.procurementType === 'MANUFACTURING' ? 'Manufactured' : 'Purchased',
        },
        qty: t.qty,
        sourceLocation: t.sourceLocation,
        destinationLocation: t.destinationLocation,
        status: t.status,
        createdDate: t.createdDate.replace('T', ' ').substring(0, 16),
        completedDate: t.completedDate ? t.completedDate.replace('T', ' ').substring(0, 16) : undefined,
      });
    });
    builder.addCase(completeTransfer.fulfilled, (state, action) => {
      const updated = action.payload;
      const idx = state.transfers.findIndex((t) => t.id === updated.id);
      if (idx !== -1) {
        state.transfers[idx] = {
          id: updated.id,
          transferNumber: updated.transferNumber,
          product: {
            id: updated.product.id,
            name: updated.product.name,
            sku: updated.product.sku,
            costPrice: updated.product.costPrice,
            salesPrice: updated.product.salesPrice,
            onHandQty: updated.product.onHandQty,
            reservedQty: updated.product.reservedQty,
            procurementStrategy: updated.product.procurementStrategy,
            procurementType: updated.product.procurementType === 'MANUFACTURING' ? 'Manufactured' : 'Purchased',
          },
          qty: updated.qty,
          sourceLocation: updated.sourceLocation,
          destinationLocation: updated.destinationLocation,
          status: updated.status,
          createdDate: updated.createdDate.replace('T', ' ').substring(0, 16),
          completedDate: updated.completedDate ? updated.completedDate.replace('T', ' ').substring(0, 16) : undefined,
        };
      }
    });
  },
});

// Users Slice
interface UsersState {
  users: User[];
  loading: boolean;
}
const initialUsersState: UsersState = {
  users: [],
  loading: false,
};
const usersSlice = createSlice({
  name: 'users',
  initialState: initialUsersState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchUsers.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.users = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchUsers.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(addUser.fulfilled, (state, action) => {
      state.users.push(action.payload);
    });
    builder.addCase(editUser.fulfilled, (state, action) => {
      const updated = action.payload;
      const idx = state.users.findIndex((u) => u.id === updated.id);
      if (idx !== -1) {
        state.users[idx] = updated;
      }
    });
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.users = state.users.filter((u) => u.id !== action.payload);
    });
  },
});

// ================= CONFIGURE STORE =================

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    products: productsSlice.reducer,
    customers: customersSlice.reducer,
    vendors: vendorsSlice.reducer,
    inventory: inventorySlice.reducer,
    sales: salesSlice.reducer,
    purchase: purchaseSlice.reducer,
    bom: bomSlice.reducer,
    manufacturing: manufacturingSlice.reducer,
    auditLogs: auditLogsSlice.reducer,
    dashboard: dashboardSlice.reducer,
    reorderingRules: reorderingRulesSlice.reducer,
    invoices: invoicesSlice.reducer,
    bills: billsSlice.reducer,
    locations: locationsSlice.reducer,
    users: usersSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const authActions = authSlice.actions;

// Re-export async actions as a combined action object or standalone exports
export const productsActions = { fetchProducts, addProduct, editProduct, deleteProduct };
export const customersActions = { fetchCustomers, addCustomer, editCustomer, deleteCustomer };
export const vendorsActions = { fetchVendors, addVendor, editVendor, deleteVendor };
export const inventoryActions = { fetchStockAndLedger };
export const salesActions = { fetchSalesOrders, addSalesOrder, confirmSalesOrder, deliverSalesOrder, cancelSalesOrder };
export const purchaseActions = { fetchPurchaseOrders, addPurchaseOrder, confirmPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder };
export const bomActions = { fetchBoms, addBoM, deleteBoM };
export const manufacturingActions = { fetchManufacturingOrders, addManufacturingOrder, confirmManufacturingOrder, completeManufacturingOrder, startWorkOrder, completeWorkOrder };
export const auditLogsActions = { fetchAuditLogs };
export const dashboardActions = { fetchDashboardKpis, fetchDashboardCharts };
export const reorderingRulesActions = { fetchReorderingRules, addReorderingRule, editReorderingRule, deleteReorderingRule, runReorderingScheduler };
export const invoicingActions = { fetchInvoices, createInvoiceFromSO, postInvoice, payInvoice, fetchBills, createBillFromPO, postBill, payBill };
export const locationsActions = { fetchLocations, fetchLocationStocks, fetchTransfers, createTransfer, completeTransfer };
export const usersActions = { fetchUsers, addUser, editUser, deleteUser };
