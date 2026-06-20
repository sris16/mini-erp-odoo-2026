import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

// Configure Axios request interceptor for JWT authorization
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Configure Axios response interceptor to handle token expiry / 401 Unauthorized
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ================= TYPES & INTERFACES =================

export interface Product {
  id: number;
  name: string;
  sku: string;
  costPrice: number;
  salesPrice: number;
  onHandQty: number;
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

export interface SalesOrder {
  id: number;
  soNumber: string;
  customerName: string;
  productName: string;
  quantity: number;
  status: string; // Draft, Pending Delivery, Completed, Cancelled
  total: number;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  vendorName: string;
  productName: string;
  quantity: number;
  status: string; // Draft, Approved, Received, Cancelled
  total: number;
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

// ================= ASYNC THUNKS =================

// Auth
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/v1/auth/login', credentials);
      return response.data; // { token: "..." }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

// Products
export const fetchProducts = createAsyncThunk('products/fetch', async () => {
  const response = await axios.get('/api/v1/products');
  return response.data;
});

export const addProduct = createAsyncThunk('products/add', async (product: Omit<Product, 'id'>) => {
  const payload = {
    ...product,
    procurementType: product.procurementType === 'Manufactured' ? 'MANUFACTURING' : 'PURCHASE',
  };
  const response = await axios.post('/api/v1/products', payload);
  return response.data;
});

export const editProduct = createAsyncThunk('products/edit', async (product: Product) => {
  const payload = {
    ...product,
    procurementType: product.procurementType === 'Manufactured' ? 'MANUFACTURING' : 'PURCHASE',
  };
  const response = await axios.put(`/api/v1/products/${product.id}`, payload);
  return response.data;
});

export const deleteProduct = createAsyncThunk('products/delete', async (id: number) => {
  await axios.delete(`/api/v1/products/${id}`);
  return id;
});

// Customers
export const fetchCustomers = createAsyncThunk('customers/fetch', async () => {
  const response = await axios.get('/api/v1/customers');
  return response.data;
});

export const addCustomer = createAsyncThunk('customers/add', async (customer: Omit<Customer, 'id'>) => {
  const response = await axios.post('/api/v1/customers', customer);
  return response.data;
});

export const editCustomer = createAsyncThunk('customers/edit', async (customer: Customer) => {
  const response = await axios.put(`/api/v1/customers/${customer.id}`, customer);
  return response.data;
});

export const deleteCustomer = createAsyncThunk('customers/delete', async (id: number) => {
  await axios.delete(`/api/v1/customers/${id}`);
  return id;
});

// Vendors
export const fetchVendors = createAsyncThunk('vendors/fetch', async () => {
  const response = await axios.get('/api/v1/vendors');
  return response.data;
});

export const addVendor = createAsyncThunk('vendors/add', async (vendor: Omit<Vendor, 'id'>) => {
  const response = await axios.post('/api/v1/vendors', vendor);
  return response.data;
});

export const editVendor = createAsyncThunk('vendors/edit', async (vendor: Vendor) => {
  const response = await axios.put(`/api/v1/vendors/${vendor.id}`, vendor);
  return response.data;
});

export const deleteVendor = createAsyncThunk('vendors/delete', async (id: number) => {
  await axios.delete(`/api/v1/vendors/${id}`);
  return id;
});

// Sales Orders
export const fetchSalesOrders = createAsyncThunk('sales/fetch', async () => {
  const response = await axios.get('/api/v1/sales');
  return response.data;
});

export const addSalesOrder = createAsyncThunk(
  'sales/add',
  async (order: { customerName: string; productName: string; quantity: number; status: string; total: number }, { getState }) => {
    const state = getState() as RootState;
    const product = state.products.items.find((p) => p.name === order.productName);
    if (!product) throw new Error('Product not found in store catalog');

    const payload = {
      customerName: order.customerName,
      status: 'DRAFT',
      lines: [
        {
          productId: product.id,
          qtyOrdered: order.quantity,
          unitPrice: product.salesPrice,
        },
      ],
    };
    const response = await axios.post('/api/v1/sales', payload);
    return response.data;
  }
);

export const confirmSalesOrder = createAsyncThunk('sales/confirm', async (id: number) => {
  const response = await axios.post(`/api/v1/sales/${id}/confirm`);
  return response.data;
});

export const deliverSalesOrder = createAsyncThunk('sales/deliver', async (id: number) => {
  const response = await axios.post(`/api/v1/sales/${id}/deliver`);
  return response.data;
});

export const cancelSalesOrder = createAsyncThunk('sales/cancel', async (id: number) => {
  const response = await axios.post(`/api/v1/sales/${id}/cancel`);
  return response.data;
});

// Purchase Orders
export const fetchPurchaseOrders = createAsyncThunk('purchase/fetch', async () => {
  const response = await axios.get('/api/v1/purchase');
  return response.data;
});

export const addPurchaseOrder = createAsyncThunk(
  'purchase/add',
  async (order: { vendorName: string; productName: string; quantity: number; status: string; total: number }, { getState }) => {
    const state = getState() as RootState;
    const product = state.products.items.find((p) => p.name === order.productName);
    if (!product) throw new Error('Product not found in store catalog');

    const payload = {
      vendorName: order.vendorName,
      status: 'DRAFT',
      lines: [
        {
          productId: product.id,
          qtyOrdered: order.quantity,
          unitPrice: product.costPrice,
        },
      ],
    };
    const response = await axios.post('/api/v1/purchase', payload);
    return response.data;
  }
);

export const confirmPurchaseOrder = createAsyncThunk('purchase/confirm', async (id: number) => {
  const response = await axios.post(`/api/v1/purchase/${id}/confirm`);
  return response.data;
});

export const receivePurchaseOrder = createAsyncThunk('purchase/receive', async (id: number) => {
  const response = await axios.post(`/api/v1/purchase/${id}/receive`);
  return response.data;
});

export const cancelPurchaseOrder = createAsyncThunk('purchase/cancel', async (id: number) => {
  const response = await axios.post(`/api/v1/purchase/${id}/cancel`);
  return response.data;
});

// Bills of Materials
export const fetchBoms = createAsyncThunk('bom/fetch', async () => {
  const response = await axios.get('/api/v1/bom');
  return response.data;
});

export const addBoM = createAsyncThunk('bom/add', async (bom: Omit<BoMItem, 'id'>) => {
  const response = await axios.post('/api/v1/bom', {
    finishedProductName: bom.finishedProduct,
    components: bom.components,
  });
  return response.data;
});

export const deleteBoM = createAsyncThunk('bom/delete', async (id: number) => {
  await axios.delete(`/api/v1/bom/${id}`);
  return id;
});

// Manufacturing Orders
export const fetchManufacturingOrders = createAsyncThunk('manufacturing/fetch', async () => {
  const response = await axios.get('/api/v1/manufacturing');
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
    const response = await axios.post('/api/v1/manufacturing', payload);
    return response.data;
  }
);

export const confirmManufacturingOrder = createAsyncThunk('manufacturing/confirm', async (id: number) => {
  const response = await axios.post(`/api/v1/manufacturing/${id}/confirm`);
  return response.data;
});

export const completeManufacturingOrder = createAsyncThunk('manufacturing/complete', async (id: number) => {
  const response = await axios.post(`/api/v1/manufacturing/${id}/complete`);
  return response.data;
});

export const startWorkOrder = createAsyncThunk(
  'manufacturing/startWork',
  async ({ moId, woId }: { moId: number; woId: number }) => {
    const response = await axios.post(`/api/v1/manufacturing/workorders/${woId}/start`);
    return { moId, workOrder: response.data };
  }
);

export const completeWorkOrder = createAsyncThunk(
  'manufacturing/completeWork',
  async ({ moId, woId }: { moId: number; woId: number }) => {
    const response = await axios.post(`/api/v1/manufacturing/workorders/${woId}/complete`);
    return { moId, workOrder: response.data };
  }
);

// Inventory Stock & Ledger
export const fetchStockAndLedger = createAsyncThunk('inventory/fetchStockAndLedger', async () => {
  const [stockRes, ledgerRes] = await Promise.all([
    axios.get('/api/v1/products'),
    axios.get('/api/v1/products/ledger'),
  ]);
  return { stock: stockRes.data, ledger: ledgerRes.data };
});

// Audit Logs
export const fetchAuditLogs = createAsyncThunk('auditLogs/fetch', async () => {
  const response = await axios.get('/api/v1/audit-logs');
  return response.data;
});

// ================= SLICES =================

// Auth Slice
interface AuthState {
  token: string | null;
  user: { name: string; email: string } | null;
}
const initialAuthState: AuthState = {
  token: localStorage.getItem('token'),
  user: localStorage.getItem('token') ? { name: 'Admin User', email: 'admin@shivfurniture.com' } : null,
};
const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      state.token = action.payload.token;
      state.user = { name: 'Admin User', email: 'admin@shivfurniture.com' };
      localStorage.setItem('token', action.payload.token);
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
      state.items = action.payload.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        costPrice: p.costPrice,
        salesPrice: p.salesPrice,
        onHandQty: p.onHandQty,
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
const mapSalesOrder = (so: any): SalesOrder => {
  const line = so.lines[0];
  const totalVal = so.lines.reduce((sum: number, l: any) => sum + l.unitPrice * l.qtyOrdered, 0);
  let statusText = 'Draft';
  if (so.status === 'CONFIRMED') statusText = 'Pending Delivery';
  else if (so.status === 'FULLY_DELIVERED') statusText = 'Completed';
  else if (so.status === 'PARTIALLY_DELIVERED') statusText = 'Pending Delivery';
  else if (so.status === 'CANCELLED') statusText = 'Cancelled';

  return {
    id: so.id,
    soNumber: 'SO-00' + so.id,
    customerName: so.customerName,
    productName: line?.product?.name || 'N/A',
    quantity: line?.qtyOrdered || 0,
    status: statusText,
    total: totalVal,
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
const mapPurchaseOrder = (po: any): PurchaseOrder => {
  const line = po.lines[0];
  const totalVal = po.lines.reduce((sum: number, l: any) => sum + l.unitPrice * l.qtyOrdered, 0);
  let statusText = 'Draft';
  if (po.status === 'CONFIRMED') statusText = 'Approved';
  else if (po.status === 'FULLY_RECEIVED') statusText = 'Received';
  else if (po.status === 'CANCELLED') statusText = 'Cancelled';

  return {
    id: po.id,
    poNumber: 'PO-00' + po.id,
    vendorName: po.vendorName,
    productName: line?.product?.name || 'N/A',
    quantity: line?.qtyOrdered || 0,
    status: statusText,
    total: totalVal,
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
      state.items = action.payload.map((b: any) => ({
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
const mapManufacturingOrder = (mo: any): ManufacturingOrder => {
  let statusText: 'Draft' | 'In Progress' | 'Completed' = 'Draft';
  if (mo.status === 'CONFIRMED' || mo.status === 'IN_PROGRESS') statusText = 'In Progress';
  else if (mo.status === 'DONE') statusText = 'Completed';

  const mappedWos = (mo.workOrders || []).map((wo: any) => ({
    id: wo.id,
    workCenterName: wo.workCenter?.name || 'Unknown Center',
    sequence: wo.sequence,
    qtyToProduce: wo.qtyToProduce,
    status: wo.status,
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
      state.stock = action.payload.stock.map((p: any) => ({
        productId: p.id,
        productName: p.name,
        onHand: p.onHandQty,
        reserved: p.reservedQty,
        available: p.onHandQty - p.reservedQty,
      }));
      state.ledger = action.payload.ledger.map((l: any) => ({
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
      state.logs = action.payload.map((log: any) => ({
        id: log.id,
        user: log.username,
        action: log.details,
        module: log.action,
        date: log.timestamp.replace('T', ' ').substring(0, 16),
      }));
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
