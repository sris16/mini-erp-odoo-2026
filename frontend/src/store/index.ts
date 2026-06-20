import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// ================= AUTH SLICE =================
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
    login: (state, action: PayloadAction<{ token: string }>) => {
      state.token = action.payload.token;
      state.user = { name: 'Admin User', email: 'admin@shivfurniture.com' };
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
    },
  },
});

// ================= PRODUCTS SLICE =================
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
interface ProductsState {
  items: Product[];
}
const initialProductsState: ProductsState = {
  items: [
    { id: 1, name: 'Dining Table (Oak)', sku: 'TBL-OAK-001', costPrice: 150, salesPrice: 350, onHandQty: 12, procurementStrategy: 'MTO', procurementType: 'Manufactured' },
    { id: 2, name: 'Office Chair (Ergonomic)', sku: 'CHR-ERG-002', costPrice: 80, salesPrice: 180, onHandQty: 45, procurementStrategy: 'MTS', procurementType: 'Purchased' },
    { id: 3, name: 'Wooden Leg (4-pack)', sku: 'LEG-OAK-001', costPrice: 20, salesPrice: 40, onHandQty: 80, procurementStrategy: 'MTS', procurementType: 'Purchased' },
    { id: 4, name: 'Table Top (Oak)', sku: 'TOP-OAK-001', costPrice: 50, salesPrice: 100, onHandQty: 15, procurementStrategy: 'MTO', procurementType: 'Manufactured' },
  ],
};
const productsSlice = createSlice({
  name: 'products',
  initialState: initialProductsState,
  reducers: {
    addProduct: (state, action: PayloadAction<Omit<Product, 'id'>>) => {
      const nextId = state.items.length > 0 ? Math.max(...state.items.map((i) => i.id)) + 1 : 1;
      state.items.push({ id: nextId, ...action.payload });
    },
    editProduct: (state, action: PayloadAction<Product>) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteProduct: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

// ================= CUSTOMERS SLICE =================
export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
}
interface CustomersState {
  items: Customer[];
}
const initialCustomersState: CustomersState = {
  items: [
    { id: 1, name: 'John Doe', phone: '+1 555-0199', email: 'john@example.com', address: '123 Timber Lane, Oregon' },
    { id: 2, name: 'Jane Smith', phone: '+1 555-0144', email: 'jane@example.com', address: '456 Forest Road, Seattle' },
  ],
};
const customersSlice = createSlice({
  name: 'customers',
  initialState: initialCustomersState,
  reducers: {
    addCustomer: (state, action: PayloadAction<Omit<Customer, 'id'>>) => {
      const nextId = state.items.length > 0 ? Math.max(...state.items.map((c) => c.id)) + 1 : 1;
      state.items.push({ id: nextId, ...action.payload });
    },
    editCustomer: (state, action: PayloadAction<Customer>) => {
      const index = state.items.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteCustomer: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
  },
});

// ================= VENDORS SLICE =================
export interface Vendor {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
}
interface VendorsState {
  items: Vendor[];
}
const initialVendorsState: VendorsState = {
  items: [
    { id: 1, name: 'Oakland Lumber Supplies', phone: '+1 800-LUMBER', email: 'sales@oaklandlumber.com', address: '789 Redwood Blvd, California' },
    { id: 2, name: 'Fastener Depot', phone: '+1 800-SCREWS', email: 'info@fastenerdepot.com', address: '321 Hardware Ave, Ohio' },
  ],
};
const vendorsSlice = createSlice({
  name: 'vendors',
  initialState: initialVendorsState,
  reducers: {
    addVendor: (state, action: PayloadAction<Omit<Vendor, 'id'>>) => {
      const nextId = state.items.length > 0 ? Math.max(...state.items.map((v) => v.id)) + 1 : 1;
      state.items.push({ id: nextId, ...action.payload });
    },
    editVendor: (state, action: PayloadAction<Vendor>) => {
      const index = state.items.findIndex((v) => v.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteVendor: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((v) => v.id !== action.payload);
    },
  },
});

// ================= INVENTORY SLICE =================
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
interface InventoryState {
  stock: StockItem[];
  ledger: StockLedgerEntry[];
}
const initialInventoryState: InventoryState = {
  stock: [
    { productId: 1, productName: 'Dining Table (Oak)', onHand: 12, reserved: 4, available: 8 },
    { productId: 2, productName: 'Office Chair (Ergonomic)', onHand: 45, reserved: 10, available: 35 },
    { productId: 3, productName: 'Wooden Leg (4-pack)', onHand: 80, reserved: 20, available: 60 },
    { productId: 4, productName: 'Table Top (Oak)', onHand: 15, reserved: 2, available: 13 },
  ],
  ledger: [
    { id: 1, date: '2026-06-18 10:30', productName: 'Dining Table (Oak)', movementType: 'IN (Manufacturing)', quantity: 5, reference: 'MO-102' },
    { id: 2, date: '2026-06-19 14:15', productName: 'Office Chair (Ergonomic)', movementType: 'OUT (Sales)', quantity: 2, reference: 'SO-003' },
  ],
};
const inventorySlice = createSlice({
  name: 'inventory',
  initialState: initialInventoryState,
  reducers: {
    addLedgerEntry: (state, action: PayloadAction<Omit<StockLedgerEntry, 'id'>>) => {
      const nextId = state.ledger.length > 0 ? Math.max(...state.ledger.map((l) => l.id)) + 1 : 1;
      state.ledger.unshift({ id: nextId, ...action.payload });
    },
    updateStock: (state, action: PayloadAction<{ productId: number; change: number; reservedChange?: number }>) => {
      const item = state.stock.find((s) => s.productId === action.payload.productId);
      if (item) {
        item.onHand += action.payload.change;
        if (action.payload.reservedChange !== undefined) {
          item.reserved += action.payload.reservedChange;
        }
        item.available = item.onHand - item.reserved;
      }
    },
  },
});

// ================= SALES SLICE =================
export interface SalesOrder {
  soNumber: string;
  customerName: string;
  productName: string;
  quantity: number;
  status: string; // Draft, Pending Delivery, Completed, Cancelled
  total: number;
}
interface SalesState {
  orders: SalesOrder[];
}
const initialSalesState: SalesState = {
  orders: [
    { soNumber: 'SO-001', customerName: 'John Doe', productName: 'Dining Table (Oak)', quantity: 2, status: 'Completed', total: 700 },
    { soNumber: 'SO-002', customerName: 'Jane Smith', productName: 'Office Chair (Ergonomic)', quantity: 1, status: 'Draft', total: 180 },
    { soNumber: 'SO-003', customerName: 'John Doe', productName: 'Dining Table (Oak)', quantity: 1, status: 'Pending Delivery', total: 350 },
  ],
};
const salesSlice = createSlice({
  name: 'sales',
  initialState: initialSalesState,
  reducers: {
    addSalesOrder: (state, action: PayloadAction<Omit<SalesOrder, 'soNumber'>>) => {
      const nextNum = state.orders.length > 0
        ? `SO-00${Math.max(...state.orders.map((o) => parseInt(o.soNumber.split('-')[1]))) + 1}`
        : 'SO-001';
      state.orders.unshift({ soNumber: nextNum, ...action.payload });
    },
    updateSalesOrderStatus: (state, action: PayloadAction<{ soNumber: string; status: string }>) => {
      const order = state.orders.find((o) => o.soNumber === action.payload.soNumber);
      if (order) {
        order.status = action.payload.status;
      }
    },
  },
});

// ================= PURCHASE SLICE =================
export interface PurchaseOrder {
  poNumber: string;
  vendorName: string;
  productName: string;
  quantity: number;
  status: string; // Draft, Approved, Received, Cancelled
  total: number;
}
interface PurchaseState {
  orders: PurchaseOrder[];
}
const initialPurchaseState: PurchaseState = {
  orders: [
    { poNumber: 'PO-001', vendorName: 'Oakland Lumber Supplies', productName: 'Wooden Leg (4-pack)', quantity: 20, status: 'Received', total: 400 },
    { poNumber: 'PO-002', vendorName: 'Fastener Depot', productName: 'Screws (12-pack)', quantity: 50, status: 'Approved', total: 100 },
  ],
};
const purchaseSlice = createSlice({
  name: 'purchase',
  initialState: initialPurchaseState,
  reducers: {
    addPurchaseOrder: (state, action: PayloadAction<Omit<PurchaseOrder, 'poNumber'>>) => {
      const nextNum = state.orders.length > 0
        ? `PO-00${Math.max(...state.orders.map((o) => parseInt(o.poNumber.split('-')[1]))) + 1}`
        : 'PO-001';
      state.orders.unshift({ poNumber: nextNum, ...action.payload });
    },
    updatePurchaseOrderStatus: (state, action: PayloadAction<{ poNumber: string; status: string }>) => {
      const order = state.orders.find((o) => o.poNumber === action.payload.poNumber);
      if (order) {
        order.status = action.payload.status;
      }
    },
  },
});

// ================= BOM SLICE =================
export interface BoMItem {
  id: number;
  finishedProduct: string;
  components: { name: string; qty: number }[];
}
interface BoMState {
  items: BoMItem[];
}
const initialBoMState: BoMState = {
  items: [
    {
      id: 1,
      finishedProduct: 'Dining Table (Oak)',
      components: [
        { name: 'Wooden Leg (4-pack)', qty: 1 },
        { name: 'Table Top (Oak)', qty: 1 },
        { name: 'Screws (12-pack)', qty: 2 },
      ],
    },
  ],
};
const bomSlice = createSlice({
  name: 'bom',
  initialState: initialBoMState,
  reducers: {
    addBoM: (state, action: PayloadAction<Omit<BoMItem, 'id'>>) => {
      const nextId = state.items.length > 0 ? Math.max(...state.items.map((i) => i.id)) + 1 : 1;
      state.items.push({ id: nextId, ...action.payload });
    },
    deleteBoM: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

// ================= MANUFACTURING SLICE =================
export interface ManufacturingOrder {
  moNumber: string;
  productName: string;
  quantity: number;
  status: 'Draft' | 'In Progress' | 'Completed';
}
interface ManufacturingState {
  orders: ManufacturingOrder[];
}
const initialManufacturingState: ManufacturingState = {
  orders: [
    { moNumber: 'MO-101', productName: 'Dining Table (Oak)', quantity: 10, status: 'Completed' },
    { moNumber: 'MO-102', productName: 'Dining Table (Oak)', quantity: 5, status: 'In Progress' },
    { moNumber: 'MO-103', productName: 'Office Chair (Ergonomic)', quantity: 12, status: 'Draft' },
  ],
};
const manufacturingSlice = createSlice({
  name: 'manufacturing',
  initialState: initialManufacturingState,
  reducers: {
    addManufacturingOrder: (state, action: PayloadAction<Omit<ManufacturingOrder, 'moNumber'>>) => {
      const nextNum = state.orders.length > 0
        ? `MO-10${Math.max(...state.orders.map((o) => parseInt(o.moNumber.split('-')[1]))) + 1}`
        : 'MO-101';
      state.orders.unshift({ moNumber: nextNum, ...action.payload });
    },
    updateManufacturingStatus: (state, action: PayloadAction<{ moNumber: string; status: 'Draft' | 'In Progress' | 'Completed' }>) => {
      const order = state.orders.find((o) => o.moNumber === action.payload.moNumber);
      if (order) {
        order.status = action.payload.status;
      }
    },
  },
});

// ================= AUDIT LOGS SLICE =================
export interface AuditLog {
  id: number;
  user: string;
  action: string;
  module: string;
  date: string;
}
interface AuditLogsState {
  logs: AuditLog[];
}
const initialAuditLogsState: AuditLogsState = {
  logs: [
    { id: 1, user: 'Admin', action: 'Create Product (SKU: TBL-OAK-001)', module: 'Products', date: '2026-06-20 10:15' },
    { id: 2, user: 'Admin', action: 'Create Sales Order SO-003', module: 'Sales', date: '2026-06-20 11:45' },
    { id: 3, user: 'System', action: 'Low Stock Notification (Wooden Leg)', module: 'Inventory', date: '2026-06-20 14:20' },
  ],
};
const auditLogsSlice = createSlice({
  name: 'auditLogs',
  initialState: initialAuditLogsState,
  reducers: {
    addAuditLog: (state, action: PayloadAction<Omit<AuditLog, 'id' | 'date'>>) => {
      const nextId = state.logs.length > 0 ? Math.max(...state.logs.map((l) => l.id)) + 1 : 1;
      const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
      state.logs.unshift({ id: nextId, date: now, ...action.payload });
    },
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
export const productsActions = productsSlice.actions;
export const customersActions = customersSlice.actions;
export const vendorsActions = vendorsSlice.actions;
export const inventoryActions = inventorySlice.actions;
export const salesActions = salesSlice.actions;
export const purchaseActions = purchaseSlice.actions;
export const bomActions = bomSlice.actions;
export const manufacturingActions = manufacturingSlice.actions;
export const auditLogsActions = auditLogsSlice.actions;
